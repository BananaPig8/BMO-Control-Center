package com.bmo.controlcenter;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;

/**
 * 20/08/2026 - Heartbeat en segundo plano, sin depender del WebView (que
 * Android congela en cuanto se bloquea la pantalla). Servicio en primer
 * plano de verdad (con notificación fija, exigida por Android desde la 8
 * para que el sistema no lo mate) que manda el mismo heartbeat que ya
 * mandaba app.js, pero leyendo batería/modelo directamente de la API
 * nativa de Android en vez de depender de JS vivo.
 */
public class HeartbeatService extends Service {
    private static final String CHANNEL_ID = "bmo_heartbeat";
    private static final int NOTIF_ID = 1001;
    private static final long INTERVAL_MS = 25000;
    private static final String API_URL = "https://bmo-pi.tail0f0c76.ts.net/api/devices";
    private static final String API_KEY = "6cf4e9146401b55bfb0f324e00b916981e0afe5c5705af46dc58a55cefd12495";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable beat = new Runnable() {
        @Override
        public void run() {
            new Thread(HeartbeatService.this::sendHeartbeat).start();
            handler.postDelayed(this, INTERVAL_MS);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        startForeground(NOTIF_ID, buildNotification());
        handler.post(beat);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(beat);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "BMO — presencia",
                NotificationManager.IMPORTANCE_MIN
            );
            channel.setDescription("Mantiene a BMO informado de que este móvil está disponible");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        PendingIntent openApp = PendingIntent.getActivity(
            this,
            0,
            new Intent(this, MainActivity.class),
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0
        );
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BMO Control Center")
            .setContentText("Este móvil está visible en Dispositivos")
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setContentIntent(openApp)
            .build();
    }

    private int[] readBattery() {
        // {percent, charging(1/0)} - via el sticky broadcast, no hace
        // falta un receiver registrado aparte para leer el valor actual.
        IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = registerReceiver(null, filter);
        if (batteryStatus == null) return new int[] { -1, 0 };
        int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
        int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        int pct = (level >= 0 && scale > 0) ? Math.round(level * 100f / scale) : -1;
        boolean charging =
            status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
        return new int[] { pct, charging ? 1 : 0 };
    }

    private void sendHeartbeat() {
        try {
            int[] battery = readBattery();
            String json =
                "{"
                + "\"hostname\":\"movil\","
                + "\"os\":\"Android\","
                + "\"os_version\":\"" + esc(Build.VERSION.RELEASE) + "\","
                + "\"model\":\"" + esc(Build.MODEL) + "\","
                + "\"manufacturer\":\"" + esc(Build.MANUFACTURER) + "\","
                + "\"platform\":\"Android\""
                + (battery[0] >= 0 ? ",\"battery_pct\":" + battery[0] : "")
                + ",\"battery_charging\":" + (battery[1] == 1)
                + "}";

            URL url = new URL(API_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            if (conn instanceof HttpsURLConnection) {
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
            }
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-BMO-Key", API_KEY);
            conn.setDoOutput(true);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes("UTF-8"));
            }
            conn.getResponseCode(); // fuerza el envío, ignoramos el resultado (best-effort)
            conn.disconnect();
        } catch (Exception e) {
            // best-effort: un fallo puntual de red no debe tumbar el servicio
        }
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
