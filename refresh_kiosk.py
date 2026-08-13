import os
import time

import paramiko
from dotenv import load_dotenv

load_dotenv()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(
    os.environ["BMO_HOST"],
    username=os.environ["BMO_SSH_USER"],
    password=os.environ["BMO_SSH_PASSWORD"],
    timeout=15,
)
sftp = ssh.open_sftp()
sftp.put(
    r"C:\Users\manue\Projects\bmo-control-center\dist\index.html",
    "/home/bmo/bmo-os/ui/index.html",
)
sftp.put(
    r"C:\Users\manue\Projects\bmo-control-center\dist\styles.css",
    "/home/bmo/bmo-os/ui/styles.css",
)
sftp.close()

ssh.exec_command("pkill -f firefox; true")
time.sleep(1.5)
# Prefer existing kiosk helper if present; otherwise start Firefox directly.
stdin, stdout, stderr = ssh.exec_command(
    "bash -lc 'if [ -x \"$HOME/scripts/bmo-kiosk.sh\" ]; then nohup \"$HOME/scripts/bmo-kiosk.sh\" >/tmp/bmo-kiosk.log 2>&1 & "
    "elif [ -x \"$HOME/scripts/bmo-start.sh\" ]; then nohup \"$HOME/scripts/bmo-start.sh\" >/tmp/bmo-kiosk.log 2>&1 & "
    "else DISPLAY=:0 nohup firefox --kiosk http://127.0.0.1:8080/ >/tmp/bmo-kiosk.log 2>&1 & fi; echo started'"
)
print(stdout.read().decode(), stderr.read().decode())
ssh.close()
