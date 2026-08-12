import json
import os
import time

import paramiko
import requests
from dotenv import load_dotenv

load_dotenv()

HOST = os.environ["BMO_HOST"]
SSH_USER = os.environ["BMO_SSH_USER"]
SSH_PASSWORD = os.environ["BMO_SSH_PASSWORD"]
API = f"http://{HOST}:8080"
KEY = os.environ["BMO_API_KEY"]
HEADERS = {"X-BMO-Key": KEY}


def main() -> None:
    print("== API Spotify status ==")
    r = requests.get(f"{API}/api/spotify/status", headers=HEADERS, timeout=10)
    print("status", r.status_code)
    data = r.json()
    print(json.dumps({k: data.get(k) for k in ("connected", "configured", "playing", "volume", "deviceId")}, indent=2))
    track = data.get("track") or {}
    print("track", track.get("name"), "/", track.get("artists"))

    ui = requests.get(f"{API}/", timeout=10)
    html = ui.text
    checks = [
        ('data-nav="servicios"', "nav servicios"),
        ('data-nav="dispositivos"', "nav dispositivos"),
        ("view-servicios", "view servicios"),
        ("sp-back-btn", "spotify back btn"),
        ("sp-breadcrumb", "breadcrumb"),
    ]
    print("== UI HTML ==")
    for needle, label in checks:
        print(("OK" if needle in html else "MISSING"), label)

    js = requests.get(f"{API}/app.js", timeout=10).text
    css = requests.get(f"{API}/styles.css", timeout=10).text
    print("setAppNav in js", "setAppNav" in js)
    print("sp-now in css", ".sp-now" in css)
    print("nav 4 cols", "repeat(4, 1fr)" in css)

    # optional playback smoke if connected
    if data.get("connected"):
        print("== playback smoke (toggle) ==")
        playing = bool(data.get("playing"))
        action = "pause" if playing else "play"
        tr = requests.post(f"{API}/api/spotify/{action}", headers=HEADERS, json={}, timeout=12)
        print(action, tr.status_code, tr.text[:200])
        time.sleep(1.2)
        # restore
        restore = "play" if playing else "pause"
        rr = requests.post(f"{API}/api/spotify/{restore}", headers=HEADERS, json={}, timeout=12)
        print("restore", restore, rr.status_code)
        if data.get("volume") is not None:
            vol = int(data.get("volume") or 50)
            vr = requests.post(
                f"{API}/api/spotify/volume",
                headers=HEADERS,
                json={"volume": vol},
                timeout=12,
            )
            print("volume keep", vol, vr.status_code)

    print("== restart kiosk ==")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=SSH_USER, password=SSH_PASSWORD, timeout=15)
    ssh.exec_command("pkill -f firefox; true")
    time.sleep(1.5)
    stdin, stdout, stderr = ssh.exec_command(
        "bash -lc 'if [ -x \"$HOME/scripts/bmo-kiosk.sh\" ]; then nohup \"$HOME/scripts/bmo-kiosk.sh\" >/tmp/bmo-kiosk.log 2>&1 & "
        "elif [ -x \"$HOME/scripts/bmo-start.sh\" ]; then nohup \"$HOME/scripts/bmo-start.sh\" >/tmp/bmo-kiosk.log 2>&1 & "
        "else DISPLAY=:0 nohup firefox --kiosk http://127.0.0.1:8080/ >/tmp/bmo-kiosk.log 2>&1 & fi; echo started'"
    )
    print(stdout.read().decode(), stderr.read().decode())
    ssh.close()
    print("DONE")


if __name__ == "__main__":
    main()
