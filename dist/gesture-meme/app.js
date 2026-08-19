import {
  HandLandmarker,
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

// ---- meme mapping -----------------------------------------------------
// Each gesture maps to one or more meme images. When a gesture has more
// than one image, one is picked at random each time the gesture is newly
// (re)triggered, so repeated gestures don't always show the same frame.
const GESTURE_MEMES = {
  rockstar: ["memes/cat.jpg"],
  default: ["memes/pokercat.jpg"],
  oneFingerUp: ["memes/profcat.jpg", "memes/professorcat.jpg"],
  pointAtCamera: ["memes/laugh and point .jpg"],
  fist: ["memes/punchcat.jpg"],
  shhh: ["memes/shhcat.jpg"],
  twoFingersTogether: ["memes/fingers together muehehe .jpg"],
  uwuCat: ["memes/uwucat.jpg", "memes/uwucatt.jpg"],
  handCoverFace: ["memes/hand cover face .jpg"],
  crashOutCat: ["memes/crashout cat .jpg"],
  twoHandsOnHead: ["memes/two hands on head .jpg"],
  handStretchedOut: ["memes/hand stretched out, palm facing up .jpg"],
  sideEyeCat: ["memes/side eye cat.jpg"],
};

// how many consecutive frames a gesture must hold before we switch to it
const STABLE_FRAMES_REQUIRED = 5;
// if no hand / no gesture is seen for this long, fall back to default
const DEFAULT_FALLBACK_MS = 600;
// how long we trust a stale face box after the face detector loses the face
// (e.g. hand covering the mouth during a shush)
const FACE_STALE_MS = 1200;

// how far the head has to turn (yaw, in degrees, from MediaPipe's own head
// pose estimate - not a hand-rolled distance heuristic) to count as a
// side-eye look. Watch the live debug HUD in the camera pane while turning
// your head to find the right value for you.
const SIDE_EYE_YAW_DEG = 15.0;

// hand-covering-face: how close the hand needs to be to where the mouth
// last was. Wider when the face detector has fully lost the face (strong
// evidence of a real occlusion); tighter when the face is still partially
// tracked (weaker evidence, avoid false positives from a hand just passing
// near the face).
const HAND_COVER_FACE_DIST_FACE_LOST = 1.3;
const HAND_COVER_FACE_DIST_FACE_SEEN = 0.7;

const video = document.getElementById("video");
const memeImg = document.getElementById("memeImg");
const debugHud = document.getElementById("debugHud");
const camStatus = document.getElementById("camStatus");

let handLandmarker, faceLandmarker;
let lastVideoTime = -1;
let currentGesture = "default";
let candidateGesture = "default";
let candidateStreak = 0;
let lastNonDefaultAt = performance.now();
let lastFace = null; // { mouthCenter, faceWidth, mouthOpen, yawDeg, t }
let lastFaceSeenThisFrame = false;
let lastYawDebug = 0;
let lastHandDebug = "hands: 0"; // temp diagnostic for tuning muehehe threshold, 2026-08-19

async function init() {
  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFacialTransformationMatrixes: true,
  });

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  if (camStatus) camStatus.hidden = true;

  requestAnimationFrame(loop);
}

// ---- 3D-aware geometry helpers -----------------------------------------
// Using z (depth) as well as x/y makes these tests far more robust to hand
// rotation, foreshortening, and motion blur than a plain 2D/wrist-distance
// check would be.
function vec(a, b) {
  return { x: b.x - a.x, y: b.y - a.y, z: (b.z || 0) - (a.z || 0) };
}
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}
function angleDeg(v1, v2) {
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const m1 = Math.hypot(v1.x, v1.y, v1.z);
  const m2 = Math.hypot(v2.x, v2.y, v2.z);
  if (m1 < 1e-9 || m2 < 1e-9) return 180;
  return (Math.acos(Math.min(1, Math.max(-1, dot / (m1 * m2)))) * 180) / Math.PI;
}

// a finger is "extended" if its two segments (mcp->pip, pip->tip) point in
// roughly the same direction; "curled" if it folds back sharply.
function fingerExtended(lm, mcp, pip, tip) {
  const angle = angleDeg(vec(lm[mcp], lm[pip]), vec(lm[pip], lm[tip]));
  return angle < 45;
}

// extract the head's left/right turn angle (yaw, degrees) from MediaPipe's
// facial transformation matrix - its own estimate of head pose, far more
// robust than trying to infer turn from landmark distances.
function yawFromTransformMatrix(matrixData) {
  // matrixData is a 16-element row-major 4x4 array; r(row, col) = data[row*4+col]
  const r00 = matrixData[0];
  const r10 = matrixData[4];
  const r20 = matrixData[8];
  const sy = Math.hypot(r00, r10);
  if (sy < 1e-6) return 0;
  return (Math.atan2(-r20, sy) * 180) / Math.PI;
}

function classifyHand(lm) {
  const handScale = dist(lm[0], lm[9]) || 1e-6; // wrist -> middle mcp

  const indexUp = fingerExtended(lm, 5, 6, 8);
  const middleUp = fingerExtended(lm, 9, 10, 12);
  const ringUp = fingerExtended(lm, 13, 14, 16);
  const pinkyUp = fingerExtended(lm, 17, 18, 20);

  // thumb + pinky spread apart from each other = shaka/rock-on shape.
  // tucked thumb sits close to the pinky-side of the palm; an abducted
  // thumb sticks straight out and this distance grows a lot.
  const thumbPinkySpread = dist(lm[4], lm[17]) / handScale;
  const thumbOut = thumbPinkySpread > 1.05;

  const curledCount = [indexUp, middleUp, ringUp, pinkyUp].filter((v) => !v).length;

  return {
    indexUp,
    middleUp,
    ringUp,
    pinkyUp,
    thumbOut,
    curledCount,
    handScale,
    indexTip: lm[8],
    indexBase: lm[5],
    thumbTip: lm[4],
    pinkyTip: lm[20],
    wrist: lm[0],
    palmCenter: lm[9],
  };
}

function updateFace(faceResult) {
  const now = performance.now();
  const sawFace = !!(faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0);

  if (sawFace) {
    const f = faceResult.faceLandmarks[0];
    const upperLip = f[13];
    const lowerLip = f[14];
    const rightCheek = f[234];
    const leftCheek = f[454];
    const mouthCenter = {
      x: (upperLip.x + lowerLip.x) / 2,
      y: (upperLip.y + lowerLip.y) / 2,
      z: ((upperLip.z || 0) + (lowerLip.z || 0)) / 2,
    };
    const faceWidth = dist(rightCheek, leftCheek);
    // how open the mouth is right now - normalized so it doesn't depend on
    // distance from the camera.
    const mouthOpen = dist(upperLip, lowerLip) / faceWidth;

    let yawDeg = 0;
    if (faceResult.facialTransformationMatrixes && faceResult.facialTransformationMatrixes.length > 0) {
      yawDeg = yawFromTransformMatrix(faceResult.facialTransformationMatrixes[0].data);
    }

    lastFace = { mouthCenter, faceWidth, mouthOpen, yawDeg, t: now };
    lastYawDebug = yawDeg;
  }
  lastFaceSeenThisFrame = sawFace;
}

// a hand is "pointing" if only the index finger is extended (thumb can be
// either way) - the shape both hands make in the finger-tips-touching pose.
function isPointing(h) {
  return h.indexUp && !h.middleUp && !h.ringUp && !h.pinkyUp;
}

function decideGesture(handResult) {
  const now = performance.now();
  const faceIsFresh = !!lastFace && now - lastFace.t < FACE_STALE_MS;

  if (!handResult.landmarks || handResult.landmarks.length === 0) {
    // no hands: side-eye is a face-only pose (head turned, no particular
    // hand shape needed).
    if (faceIsFresh && Math.abs(lastFace.yawDeg) > SIDE_EYE_YAW_DEG) {
      return "sideEyeCat";
    }
    return "default";
  }

  const hands = handResult.landmarks.map(classifyHand);

  // temp diagnostic for tuning muehehe (twoFingersTogether), 2026-08-19
  lastHandDebug = `hands: ${hands.length}`;
  if (hands.length === 2) {
    lastHandDebug += ` pointing:${isPointing(hands[0])}/${isPointing(hands[1])}`;
  }

  if (hands.length === 2) {
    // two fingers pointing together: both hands pointing with just the
    // index finger, fingertips close to each other in the frame.
    if (isPointing(hands[0]) && isPointing(hands[1])) {
      const avgScale = (hands[0].handScale + hands[1].handScale) / 2;
      const tipGap = dist(hands[0].indexTip, hands[1].indexTip) / avgScale;
      lastHandDebug += ` tipGap:${tipGap.toFixed(2)} (thr<1.4)`;
      if (tipGap < 1.4) {
        return "twoFingersTogether";
      }
    }

    // two hands up: either both above the top of the head (devo cat), or
    // both held up beside the cheeks (crash-out-cat, pencil-in-mouth pose).
    // "Above head" is checked first and only by height (palmCenter.y vs.
    // headTopY) - it must NOT also require the palms to be within the
    // tighter "near face" distance below, because raising both hands above
    // the head naturally pushes them further from the mouth than 2.2x face
    // width, so that gate was silently blocking devo cat and falling
    // through to the single-hand logic (handStretchedOut), found live
    // 2026-08-19. "Near face" (the 2.2x check) is only needed to
    // distinguish crash-out-cat's cheek-height hold from an unrelated pose.
    if (faceIsFresh) {
      const { mouthCenter, faceWidth } = lastFace;
      const headTopY = mouthCenter.y - faceWidth * 1.1;
      const bothAboveHead = hands.every((h) => h.palmCenter.y < headTopY);
      if (bothAboveHead) {
        return "twoHandsOnHead";
      }
      const nearFace = hands.every(
        (h) => dist(h.palmCenter, mouthCenter) / faceWidth < 2.2
      );
      if (nearFace) {
        return "crashOutCat";
      }
    }
  }

  const h = hands[0];

  // 0. rockstar / shaka: thumb + pinky out, index/middle/ring curled.
  // Checked FIRST, before the pinch test below: an outstretched shaka
  // thumb can land at a similar thumb-index distance/height as a real
  // pinch, and no distance-based heuristic reliably told them apart (tried
  // two, both still misfired live 2026-08-19) - but rockstar's own
  // thumbOut+pinkyUp shape check is specific and already reliable, so
  // giving it priority is simpler and more robust than adding more
  // geometry to the pinch check.
  if (h.thumbOut && h.pinkyUp && !h.indexUp && !h.middleUp && !h.ringUp) {
    return "rockstar";
  }

  // 1. pinch (index tip touching thumb tip) with thumb pointing up - "uwu
  // cat". Checked before the fist test below: pinching the index against
  // the thumb curls the index finger down enough that fingerExtended() can
  // read it as "curled", which would otherwise get mis-caught as a fist.
  const pinchDist = dist(h.thumbTip, h.indexTip) / h.handScale;
  const pinchThumbUp = h.thumbTip.y < h.wrist.y - h.handScale * 0.2;
  // indexUp must be false: pointing (index straight, oneFingerUp) can land
  // at a similar thumb-index distance as a real pinch (1.20 vs 1.53 in live
  // testing, too close to separate by distance alone) - but pinching
  // requires the index to curl to reach the thumb, so it always fails the
  // straight-line "extended" test, while pointing always passes it.
  lastHandDebug += ` pinch:${pinchDist.toFixed(2)}(thr<1.9) thumbUp:${pinchThumbUp} indexUp:${h.indexUp}`;
  if (pinchDist < 1.9 && pinchThumbUp && !h.indexUp) {
    return "uwuCat";
  }

  // 2. fist / punch: everything curled
  if (h.curledCount === 4) {
    return "fist";
  }

  // 3. shhh / one-finger-up: a single extended index finger is a very
  // specific shape (shhh in particular = fingertip right on the mouth), so
  // it must be checked before the broader hand-covering-face test below -
  // otherwise a shhh pose (finger near the mouth) gets swallowed by the
  // "any hand near the face" check.
  if (h.indexUp && !h.middleUp && !h.ringUp && !h.pinkyUp) {
    if (faceIsFresh) {
      const d = dist(h.indexTip, lastFace.mouthCenter) / lastFace.faceWidth;
      if (d < 0.55) {
        return "shhh";
      }
    }
    // Two distinct poses for a single raised index finger, told apart by
    // which way the finger points (base -> tip direction), not chosen at
    // random: pointing mostly toward the camera (tip much closer to the
    // lens than the base, i.e. z drops a lot) vs. pointing mostly upward
    // (tip well above the base in the frame, i.e. y drops a lot). Whichever
    // axis moves more dominates.
    const dx = h.indexTip.x - h.indexBase.x;
    const dy = h.indexTip.y - h.indexBase.y;
    const dz = (h.indexTip.z || 0) - (h.indexBase.z || 0);
    lastHandDebug += ` fingerDir dx:${dx.toFixed(2)} dy:${dy.toFixed(2)} dz:${dz.toFixed(2)}`;
    if (-dz > Math.abs(dy) && -dz > Math.abs(dx)) {
      return "pointAtCamera";
    }
    return "oneFingerUp";
  }

  // 4. hand covering face: the one hand we see sits roughly where the face
  // last was. Wider tolerance if the face detector has fully lost the face
  // (strong evidence of a real occlusion); tighter if it's still partially
  // tracking through the fingers.
  if (faceIsFresh) {
    const d = dist(h.palmCenter, lastFace.mouthCenter) / lastFace.faceWidth;
    const threshold = lastFaceSeenThisFrame
      ? HAND_COVER_FACE_DIST_FACE_SEEN
      : HAND_COVER_FACE_DIST_FACE_LOST;
    if (d < threshold) {
      return "handCoverFace";
    }
  }

  // 5. open palm held out, not near the face: hand stretched out towards
  // the camera, palm up.
  if (h.curledCount === 0) {
    return "handStretchedOut";
  }

  // hands are up but not making a specific shape - still allow a strong
  // side-eye read to win over an ambiguous hand pose.
  if (faceIsFresh && Math.abs(lastFace.yawDeg) > SIDE_EYE_YAW_DEG) {
    return "sideEyeCat";
  }

  return "default";
}

function pickImage(gesture) {
  const images = GESTURE_MEMES[gesture];
  return images[Math.floor(Math.random() * images.length)];
}

function applyGesture(gesture) {
  if (gesture === currentGesture) return;
  currentGesture = gesture;
  memeImg.src = pickImage(gesture);
}

function loop() {
  const now = performance.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const ts = performance.now();

    const handResult = handLandmarker.detectForVideo(video, ts);
    const faceResult = faceLandmarker.detectForVideo(video, ts);
    updateFace(faceResult);

    const gesture = decideGesture(handResult);

    // debounce: require a gesture to be seen for several consecutive
    // frames before we commit to it, to avoid flicker between frames
    if (gesture === candidateGesture) {
      candidateStreak++;
    } else {
      candidateGesture = gesture;
      candidateStreak = 1;
    }

    if (candidateStreak >= STABLE_FRAMES_REQUIRED) {
      applyGesture(gesture);
    }

    if (gesture !== "default") lastNonDefaultAt = now;
    if (now - lastNonDefaultAt > DEFAULT_FALLBACK_MS && currentGesture !== "default") {
      applyGesture("default");
    }

    updateDebugHud();
  }
  requestAnimationFrame(loop);
}

function updateDebugHud() {
  if (!debugHud) return;
  debugHud.textContent =
    `gesture: ${currentGesture}\n` +
    `yaw: ${lastYawDebug >= 0 ? "+" : ""}${lastYawDebug.toFixed(1)} deg  (side-eye thr +/-${SIDE_EYE_YAW_DEG.toFixed(1)})\n` +
    lastHandDebug;
}

init().catch((err) => {
  console.error(err);
  if (camStatus) {
    camStatus.hidden = false;
    camStatus.textContent =
      err.name === "NotAllowedError"
        ? "Sin permiso de cámara"
        : "No se pudo activar la cámara";
  }
});
