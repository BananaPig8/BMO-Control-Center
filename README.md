# BMO OS — Control Center

<p align="center">
  <img src="dist/assets/bmo.gif" alt="BMO" width="180">
</p>

<p align="center">
  Panel de control para un kiosco doméstico en Raspberry Pi 5: pantalla táctil
  vertical con la cara de <strong>BMO</strong>, servicios auto-hospedados,
  automatizaciones, IA y todo el sistema de la casa a un toque.
</p>

Este repositorio contiene la **UI del kiosco** (estática, sin build), las
**herramientas de despliegue** hacia el dispositivo real y el **diseño físico**
de la carcasa. El backend (API, Docker, automatizaciones, seguridad, etc.)
vive en el propio dispositivo y no forma parte de este repo.

## Qué es

BMO OS convierte una Raspberry Pi 5 con pantalla táctil en un panel de
control de casa inteligente, con cara de BMO (Hora de Aventuras) como
mascota/interfaz. Todo corre en local, sin nube de por medio: Firefox en
modo kiosco sirviendo esta UI estática, contra una API propia en el mismo
dispositivo.

## Funciones

- **Servicios** — tarjetas para todo lo auto-hospedado: Docker, Grafana,
  Portainer, Prometheus, Home Assistant, Spotify, y cualquier app añadida
  al catálogo.
- **Automatizaciones y escenas** — motor de reglas propio (condiciones,
  horarios, encadenado de acciones) más un editor de escenas.
- **BMO AI** — chat con IA integrada contra un gateway propio.
- **Gato-Cam** 🐱 — cámara + detección de gestos con MediaPipe (WASM, 100%
  en el navegador) que dispara memes de gato según el gesto que hagas.
- **Ecosistema** — integraciones externas (Steam y otras), cuentas y API
  pública para conectar BMO con otras cosas.
- **Plugins** — marketplace con sandbox real, permisos y logs por plugin.
- **Sistema** — monitorización, alertas, eventos, salud del dispositivo,
  rendimiento, backups, actualizaciones, usuarios y permisos, registros.
- **Recovery Center** 🩹 — watchdog, boot manager y modo seguro para que el
  kiosco se recupere solo de un cuelgue o un arranque fallido.
- **Security Center** 🛡️ — sesiones autenticadas, firewall, rate limiting y
  auditoría, todo gestionable desde el propio panel.
- **Personalización** — temas, pantallas, disposición táctil y páginas a
  medida, pensado de punta a punta para uso táctil en una pantalla vertical.
- **Dispositivos y MI-PC** — control remoto de otros equipos de la red desde
  el mismo panel.

## Estructura del repo

```
dist/                 UI del kiosco: HTML/CSS/JS estático, sin build ni npm install
  index.html           Marcado de toda la app (paneles, tarjetas, modales)
  app.js                Toda la lógica de frontend
  styles.css             Estilos, tema oscuro pensado para pantalla táctil
  gesture-meme/          Gato-Cam: detección de gestos + memes (MediaPipe)
  assets/                 Imágenes e iconos de servicios
  vendor/                   CodeMirror y xterm.js vendorizados

hardware/bmo-stand/    Carcasa 3D imprimible (OpenSCAD) para pantalla + Pi5

deploy_ui.py           Sincroniza dist/ al dispositivo por SFTP y recarga Firefox
refresh_kiosk.py       Sube solo HTML/CSS y relanza el kiosco
smoke_spotify_nav.py   Smoke test contra la API real del dispositivo

.claude/launch.json    Config del servidor de desarrollo local (npm run dev)
```

## Desarrollo local

La UI es estática, no necesita build:

```bash
npm run dev
```

Sirve `dist/` en `http://localhost:5173`. Sin un dispositivo BMO OS real
detrás, las llamadas a `/api/...` fallarán — sigue siendo útil para iterar
sobre maquetación y estilos con datos de ejemplo/estado vacío.

## Desplegar a un dispositivo real

Los scripts de despliegue hablan por SSH/SFTP con la Raspberry Pi. Copia
`.env.example` a `.env` y rellena tus datos:

```bash
cp .env.example .env
# BMO_HOST=192.168.1.40
# BMO_SSH_USER=bmo
# BMO_SSH_PASSWORD=...
# BMO_API_KEY=...   (solo necesaria para smoke_spotify_nav.py)

pip install -r requirements.txt
python deploy_ui.py       # sincroniza dist/ completo y recarga Firefox
python refresh_kiosk.py   # solo HTML/CSS, relanza el kiosco
```

`.env` nunca se sube al repo (está en `.gitignore`).

## Hardware

El diseño de la carcasa (impresión 3D, BOM con piezas reales) está en
[`hardware/bmo-stand/`](hardware/bmo-stand/README.md): pantalla montada en
vertical a ras de marco, hueco para cámara y módulo de voz, y toda la
electrónica (Pi5 + active cooler) accesible por los laterales.

## Estado

**1.0.0** — primera versión estable, con doble comprobación en dispositivo
físico real (no solo revisión de código) para cada función antes de darla
por cerrada.
