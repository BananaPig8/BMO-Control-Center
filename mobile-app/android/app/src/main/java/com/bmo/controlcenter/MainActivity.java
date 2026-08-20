package com.bmo.controlcenter;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int NOTIF_PERMISSION_REQUEST = 4201;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 20/08/2026 - heartbeat en segundo plano (ver HeartbeatService):
        // Android 13+ exige el permiso en tiempo de ejecución para poder
        // mostrar SIQUIERA la notificación fija que el propio servicio en
        // primer plano necesita para poder existir.
        if (Build.VERSION.SDK_INT >= 33) {
            if (ActivityCompat.checkSelfPermission(this, "android.permission.POST_NOTIFICATIONS")
                != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    new String[] { "android.permission.POST_NOTIFICATIONS" },
                    NOTIF_PERMISSION_REQUEST
                );
            } else {
                startHeartbeatService();
            }
        } else {
            startHeartbeatService();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == NOTIF_PERMISSION_REQUEST) {
            // Se pida o no el permiso, arrancamos el servicio igual - sin
            // notificación en Android >=13 el sistema mata el foreground
            // service casi al momento, pero preferimos intentarlo a dejar
            // el heartbeat completamente parado.
            startHeartbeatService();
        }
    }

    private void startHeartbeatService() {
        Intent intent = new Intent(this, HeartbeatService.class);
        ContextCompat.startForegroundService(this, intent);
    }
}
