import os
import time
from pathlib import Path

import paramiko
from dotenv import load_dotenv

load_dotenv()

HOST = os.environ["BMO_HOST"]
USER = os.environ["BMO_SSH_USER"]
PASSWORD = os.environ["BMO_SSH_PASSWORD"]
API_KEY = os.environ["BMO_API_KEY"]
API_KEY_PLACEHOLDER = "__BMO_API_KEY__"
LOCAL = Path(r"C:\Users\manue\Projects\bmo-control-center\dist")
REMOTE_REL = "bmo-os/ui"
SKIP_PREFIXES = ("bmo-src", "bmo-raw")


def main() -> None:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15)

    _, stdout, _ = ssh.exec_command("printf %s \"$HOME\"")
    home = stdout.read().decode().strip() or f"/home/{USER}"
    remote = f"{home}/{REMOTE_REL}"
    ssh.exec_command(f"mkdir -p '{remote}/assets'")
    time.sleep(0.2)

    sftp = ssh.open_sftp()
    for root, _dirs, files in os.walk(LOCAL):
        rel = os.path.relpath(root, LOCAL).replace("\\", "/")
        rdir = remote if rel == "." else f"{remote}/{rel}"
        try:
            sftp.stat(rdir)
        except FileNotFoundError:
            ssh.exec_command(f"mkdir -p '{rdir}'")
            time.sleep(0.15)
        for name in files:
            stem = Path(name).stem
            if stem.startswith(SKIP_PREFIXES):
                continue
            local_path = Path(root) / name
            remote_path = f"{rdir}/{name}"
            print("put", remote_path)
            if rel == "." and name == "app.js":
                # La clave de la API no va en el repo (es público): se
                # inyecta aquí desde .env al subir a la Pi.
                text = local_path.read_text(encoding="utf-8")
                if API_KEY_PLACEHOLDER not in text:
                    raise SystemExit("dist/app.js no tiene el marcador de la clave; no se despliega")
                with sftp.open(remote_path, "wb") as fh:
                    fh.write(text.replace(API_KEY_PLACEHOLDER, API_KEY).encode("utf-8"))
                continue
            sftp.put(str(local_path), remote_path)

    sftp.close()
    ssh.exec_command("pkill -HUP firefox || true")
    ssh.close()
    print("deployed to", remote)


if __name__ == "__main__":
    main()
