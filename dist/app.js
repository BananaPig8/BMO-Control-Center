(() => {
  // IP de la Pi en la LAN: único punto a tocar si cambia de dirección.
  const BMO_HOST = "192.168.1.40";
  // 20/08/2026 - la API SIEMPRE vive en el mismo origen que sirve esta
  // página (kiosco :8080, IP de Tailscale :8080, o el proxy HTTPS de
  // "tailscale serve" en :443 con host bmo-pi.*.ts.net) - la única
  // excepción real es el servidor de desarrollo local (`npm run dev`,
  // puerto 5173), que sirve la UI sin backend detrás y necesita apuntar
  // a la Pi real. Antes esto se adivinaba por puerto/host conocidos y
  // dejaba fuera "tailscale serve" (caía al IP de LAN fijo, inalcanzable
  // desde fuera de casa, y encima http:// desde una página https://).
  const API_BASE = window.location.port === "5173" ? `http://${BMO_HOST}:8080` : "";
  const API_KEY = "__BMO_API_KEY__"; // deploy_ui.py la rellena desde .env
  // Cuenta/gestión real de Docker en este BMO
  const PORTAINER_URL = `http://${BMO_HOST}:9000`;
  const PORTAINER_EMBED_URL = `http://${BMO_HOST}:9001`;
  // Grafana directo :3030; kiosk/auto-login vía proxy :3031
  const GRAFANA_URL = `http://${BMO_HOST}:3030`;
  const GRAFANA_EMBED_URL = `http://${BMO_HOST}:3031`;
  // Prometheus directo :9090 (loopback); kiosk vía proxy :9091 con «Volver a BMO»
  const PROMETHEUS_URL = "http://127.0.0.1:9090";
  const PROMETHEUS_EMBED_URL = `http://${BMO_HOST}:9091`;

  const state = {
    docker: null,
    system: null,
    devicesApi: [],
    selectedId: "mi-pc",
    homeDeviceId: "mi-pc",
    homeDeviceOrder: ["mi-pc", "raspberry", "android", "linux-ssh"],
    selectedService: null,
    configPluginId: null,
    configDraft: {},
    configSchema: null,
    configName: null,
    spotify: null,
    spotifyTimer: null,
    spotifyTab: "cola",
    spotifySearch: "",
    spotifyVolDragging: false,
    spotifyQueueData: null,
    spotifyFavorites: null,
    spotifyPlaylists: null,
    spotifyTabLoading: false,
    spotifyTabError: null,
    appNav: "inicio",
    devicesFrom: "hub",
    dockerContainers: [],
    dockerStatsMap: {},
    dockerTab: "containers", // containers | images | volumes | networks | compose | hub | backup | updates | security | security
    dockerImages: [],
    dockerVolumes: [],
    dockerNetworks: [],
    dockerBackups: [],
    dockerBackupSchedule: null,
    dockerBackupBusy: false,
    dockerBackupPreview: null,
    dockerBackupCreateOpts: {
      includeVolumes: false,
      includePlugins: true,
      label: "",
    },
    dockerUpdates: [],
    dockerUpdateHistory: [],
    dockerUpdateSettings: null,
    dockerUpdateBusy: false,
    dockerUpdateView: "list", // list | config
    dockerUpdateMaint: false,
    dockerSecurity: null,
    dockerSecurityEvents: [],
    dockerSecurityBusy: false,
    dockerSecurityView: "overview", // overview | events | policy
    dockerHubQuery: "",
    dockerHubResults: [],
    dockerHubDetail: null,
    dockerHubLoading: false,
    dockerHubCompatible: null,
    dockerHubWizard: null,
    dockerHubWizardStep: 0,
    dockerHubAllowUntrusted: false,
    dockerLogsTimer: null,
    dockerLogsEs: null,
    dockerLogsStreaming: false,
    dockerView: "list",
    dockerFocusId: null,
    dockerLogs: "",
    dockerConsoleOut: "",
    dockerTimer: null,
    dockerWs: null,
    dockerTerm: null,
    dockerFit: null,
    dockerTermStatus: "idle",
    dockerTermShell: null,
    dockerStacks: [],
    dockerStackFocusId: null,
    dockerStackDraft: { name: "", compose: "" },
    dockerTemplates: [],
    dockerTplSelected: null,
    dockerTplDetail: null,
    dockerTplValues: {},
    dockerTplPreview: "",
    dockerStackStatus: null,
    dockerComposeCm: null,
    dockerHistory: [],
    plugins: [],
    permsPluginId: null,
    consentPlugin: null,
    consentNeedsDeps: false,
    logsPluginId: null,
    logsEntries: [],
    metricsSnap: null,
    promStatus: null,
    monitorTimer: null,
    perfTimer: null,
    alertsTab: "active",
    alertsActive: null,
    alertsHistory: null,
    alertsConfig: null,
    alertsTimer: null,
    alertsDraft: null,
    eventsFilter: "all",
    eventsRecent: null,
    eventsTimer: null,
    agentDevices: null,
    agentFocusId: "mi-pc",
    agentProcesses: null,
    agentProfiles: null,
    agentTimer: null,
    discoveryScan: null,
    discoveryScanning: false,
    history: {
      "mi-pc": { cpu: [], ram: [], disk: [], extra: [] },
      bmo: { cpu: [], ram: [], disk: [], extra: [] },
    },
  };

  const services = [
    { id: "docker", name: "Docker", live: true, color: "#2496ed", iconImg: "./assets/docker.png" },
    { id: "portainer", name: "Portainer", live: true, color: "#00b4d8", iconImg: "./assets/portainer.png", href: PORTAINER_URL },
    { id: "uptime", name: "Uptime Kuma", live: false, color: "#5ad67d", icon: "🟢" },
    { id: "grafana", name: "Grafana", live: true, color: "#f59e0b", iconImg: "./assets/grafana.png", href: GRAFANA_URL },
    { id: "prometheus", name: "Prometheus", live: true, color: "#e6522c", iconImg: "./assets/prometheus.png", href: PROMETHEUS_URL },
    { id: "hass", name: "Home Assistant", live: false, color: "#18bcf2", iconImg: "./assets/homeassistant.png" },
    { id: "files", name: "File Browser", live: false, color: "#7c5cff", icon: "📁" },
    { id: "mqtt", name: "MQTT", live: false, color: "#a3e635", icon: "📡" },
    { id: "spotify", name: "Spotify", live: true, color: "#1db954", iconImg: "./assets/spotify.png" },
    { id: "pokemon", name: "Pokémon", live: true, color: "#e3350d", iconImg: "./assets/pokeball.svg" },
  ];

  const els = {
    clock: document.getElementById("clock"),
    date: document.getElementById("date"),
    services: document.getElementById("services-grid"),
    servicesPager: document.getElementById("services-pager"),
    servicesPagesTrack: document.getElementById("services-pages-track"),
    servicesPagerDots: document.getElementById("services-pager-dots"),
    metrics: document.getElementById("metrics"),
    info: document.getElementById("info-row"),
    devices: document.getElementById("devices"),
    dots: document.getElementById("dots"),
    selectedLabel: document.getElementById("selected-label"),
    homeHero: document.getElementById("home-hero"),
    homeMetrics: document.getElementById("home-metrics"),
    homeServices: document.getElementById("home-services"),
    homeOthers: document.getElementById("home-others"),
    headerSub: document.getElementById("header-sub"),
    toast: document.getElementById("toast"),
    configPanel: document.getElementById("config-panel"),
    configTitle: document.getElementById("config-title"),
    configForm: document.getElementById("config-form"),
    configBack: document.getElementById("config-back"),
    configSave: document.getElementById("config-save"),
    configValidate: document.getElementById("config-validate"),
    configReset: document.getElementById("config-reset"),
    configExport: document.getElementById("config-export"),
    configImport: document.getElementById("config-import"),
    configImportFile: document.getElementById("config-import-file"),
    configErrors: document.getElementById("config-errors"),
    dockerPanel: document.getElementById("docker-panel"),
    dockerBody: document.getElementById("docker-body"),
    dockerBack: document.getElementById("docker-back"),
    dockerRefresh: document.getElementById("docker-refresh"),
    dockerCreateBtn: document.getElementById("docker-create-btn"),
    pluginsPanel: document.getElementById("plugins-panel"),
    pluginsBody: document.getElementById("plugins-body"),
    pluginsBack: document.getElementById("plugins-back"),
    pluginsSearch: document.getElementById("plugins-search"),
    pluginsCategoryChips: document.getElementById("plugins-category-chips"),
    permsPanel: document.getElementById("plugin-perms-panel"),
    permsBody: document.getElementById("plugin-perms-body"),
    permsTitle: document.getElementById("plugin-perms-title"),
    permsBack: document.getElementById("plugin-perms-back"),
    permsSave: document.getElementById("plugin-perms-save"),
    consentPanel: document.getElementById("plugin-consent-panel"),
    consentTitle: document.getElementById("plugin-consent-title"),
    consentIntro: document.getElementById("plugin-consent-intro"),
    consentBody: document.getElementById("plugin-consent-body"),
    consentAccept: document.getElementById("plugin-consent-accept"),
    consentDeny: document.getElementById("plugin-consent-deny"),
    consentCancel: document.getElementById("plugin-consent-cancel"),
    logsPanel: document.getElementById("plugin-logs-panel"),
    logsTitle: document.getElementById("plugin-logs-title"),
    logsBody: document.getElementById("plugin-logs-body"),
    logsBack: document.getElementById("plugin-logs-back"),
    logsFilter: document.getElementById("plugin-logs-filter"),
    logsRefresh: document.getElementById("plugin-logs-refresh"),
    logsCopy: document.getElementById("plugin-logs-copy"),
    logsDownload: document.getElementById("plugin-logs-download"),
    logsClear: document.getElementById("plugin-logs-clear"),
    sysHubPanel: document.getElementById("view-sistema"),
    sysCoreVersion: document.getElementById("sys-core-version"),
    sysCoreUptime: document.getElementById("sys-core-uptime"),
    sysCoreAlerts: document.getElementById("sys-core-alerts"),
    sysCoreBackup: document.getElementById("sys-core-backup"),
    sysPluginsSub: document.getElementById("sys-plugins-sub"),
    sysBackupSub: document.getElementById("sys-backup-sub"),
    sysScenesSub: document.getElementById("sys-scenes-sub"),
    sysAutomationsSub: document.getElementById("sys-automations-sub"),
    marketplacePanel: document.getElementById("marketplace-panel"),
    marketplaceBody: document.getElementById("marketplace-body"),
    marketplaceBack: document.getElementById("marketplace-back"),
    marketplaceRefresh: document.getElementById("marketplace-refresh"),
    sysLogsPanel: document.getElementById("sys-logs-panel"),
    sysLogsBody: document.getElementById("sys-logs-body"),
    sysLogsBack: document.getElementById("sys-logs-back"),
    sysPermsPanel: document.getElementById("sys-perms-panel"),
    sysPermsBody: document.getElementById("sys-perms-body"),
    sysPermsBack: document.getElementById("sys-perms-back"),
    sysUsersPanel: document.getElementById("sys-users-panel"),
    sysUsersBody: document.getElementById("sys-users-body"),
    sysUsersBack: document.getElementById("sys-users-back"),
    scenesPanel: document.getElementById("scenes-panel"),
    scenesBody: document.getElementById("scenes-body"),
    scenesTitle: document.getElementById("scenes-title"),
    scenesBack: document.getElementById("scenes-back"),
    automationsPanel: document.getElementById("automations-panel"),
    automationsTitle: document.getElementById("automations-title"),
    automationsBody: document.getElementById("automations-body"),
    automationsBack: document.getElementById("automations-back"),
    appCatalogPanel: document.getElementById("app-catalog-panel"),
    appCatalogBody: document.getElementById("app-catalog-body"),
    appCatalogBack: document.getElementById("app-catalog-back"),
    deviceHistoryPanel: document.getElementById("device-history-panel"),
    deviceHistoryTitle: document.getElementById("device-history-title"),
    deviceHistoryBody: document.getElementById("device-history-body"),
    deviceHistoryBack: document.getElementById("device-history-back"),
    powerConfirmPanel: document.getElementById("power-confirm-panel"),
    powerConfirmTitle: document.getElementById("power-confirm-title"),
    powerConfirmMsg: document.getElementById("power-confirm-msg"),
    powerConfirmCancel: document.getElementById("power-confirm-cancel"),
    powerConfirmOk: document.getElementById("power-confirm-ok"),
    monitorPanel: document.getElementById("monitor-panel"),
    monitorBody: document.getElementById("monitor-body"),
    monitorBack: document.getElementById("monitor-back"),
    monitorRefresh: document.getElementById("monitor-refresh"),
    perfPanel: document.getElementById("perf-panel"),
    perfBody: document.getElementById("perf-body"),
    perfBack: document.getElementById("perf-back"),
    perfMonitor: document.getElementById("perf-monitor"),
    perfPlugins: document.getElementById("perf-plugins"),
    alertsPanel: document.getElementById("alerts-panel"),
    alertsBody: document.getElementById("alerts-body"),
    alertsBack: document.getElementById("alerts-back"),
    alertsRefresh: document.getElementById("alerts-refresh"),
    alertsTest: document.getElementById("alerts-test"),
    weather: document.getElementById("weather"),
    weatherIcon: document.getElementById("weather-icon"),
    weatherTemp: document.getElementById("weather-temp"),
    devicesPanel: document.getElementById("view-dispositivos"),
    devicesBody: document.getElementById("devices-body"),
    devicesRefresh: document.getElementById("devices-refresh"),
  };

  function openServiceFrame(title, url) {
    // Portainer/Grafana/Prometheus: pantalla completa vía proxy + «Volver a BMO».
    let embed = url;
    if (url.includes(":9000")) embed = PORTAINER_EMBED_URL;
    else if (url.includes(":3030")) embed = GRAFANA_EMBED_URL;
    else if (url.includes(":9090")) embed = PROMETHEUS_EMBED_URL;
    if (embed.includes(":9091")) toast(`Abriendo ${title}…`);
    else toast(`${title}: admin / BmoAdmin2026`);
    setTimeout(() => {
      window.location.href = embed;
    }, 250);
  }

  function toast(msg) {
    els.toast.hidden = false;
    els.toast.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      els.toast.hidden = true;
    }, 2200);
  }

  async function api(path, options = {}) {
    // Compat: api(path, true) antiguo
    if (typeof options === "boolean") options = {};
    const headers = {
      "Content-Type": "application/json",
      "X-BMO-Key": API_KEY,
      ...(options.headers || {}),
    };
    // KAN-107 (7.0.3) - /api/v1: unico punto de reescritura para los ~283
    // call-sites que ya pasan por este helper. /api/* sigue vivo en el
    // servidor como fallback, esto solo hace que el cliente prefiera el
    // prefijo nuevo desde ya.
    const v1Path = path.startsWith("/api/v1/") ? path : path.replace(/^\/api\//, "/api/v1/");
    const res = await fetch(`${API_BASE}${v1Path}`, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let msg = errText || `HTTP ${res.status}`;
      let payload = null;
      try {
        payload = JSON.parse(errText);
        if (payload.error) msg = payload.error;
      } catch (_) {}
      const err = new Error(msg);
      err.status = res.status;
      err.payload = payload;
      if (payload) {
        err.code = payload.code;
        err.line = payload.line;
        err.stderr = payload.stderr;
      }
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // 20/08/2026 - App Android (Capacitor, envoltorio nativo sobre esta misma
  // web vía Tailscale): mientras esté abierta en primer plano, se
  // autorreporta como el dispositivo "movil" reusando el MISMO endpoint de
  // heartbeat que ya usa el agente de MI-PC - nada de infraestructura
  // nueva. Deliberadamente solo en primer plano (sin plugin de tareas en
  // segundo plano): heartbeat cada 25s, si se cierra la app dejan de
  // llegar y a los 30s BMO ya la marca offline sola (mismo umbral que
  // cualquier otro dispositivo).
  (function () {
    const isNative =
      typeof window !== "undefined" && window.Capacitor && typeof window.Capacitor.isNativePlatform === "function"
        ? window.Capacitor.isNativePlatform()
        : false;
    if (!isNative) return;

    // @capacitor/device (nativo, no una API del navegador) - de aquí sale
    // el modelo real ("Pixel 10 Pro XL"), no algo adivinado del user-agent.
    // Solo hace falta pedirlo una vez, el modelo no cambia entre heartbeats.
    let deviceInfoPromise = null;
    function getDeviceInfoOnce() {
      if (!deviceInfoPromise) {
        deviceInfoPromise = (async () => {
          try {
            const DevicePlugin = window.Capacitor.Plugins && window.Capacitor.Plugins.Device;
            if (!DevicePlugin) return null;
            return await DevicePlugin.getInfo();
          } catch {
            return null;
          }
        })();
      }
      return deviceInfoPromise;
    }

    async function sendHeartbeat() {
      // "platform" es lo que deviceAgentService.js realmente muestra como
      // "Sistema" (ver nota más abajo) - se deja simple a propósito.
      const payload = { hostname: "movil", os: "Android", platform: "Android" };
      try {
        if (navigator.getBattery) {
          const battery = await navigator.getBattery();
          payload.battery_pct = Math.round(battery.level * 100);
          payload.battery_charging = !!battery.charging;
        }
      } catch {
        /* API de batería no disponible en este WebView, no pasa nada */
      }
      const info = await getDeviceInfoOnce();
      if (info) {
        payload.model = info.model || null;
        payload.manufacturer = info.manufacturer || null;
        payload.os_version = info.osVersion || null;
        // ojo: NO tocar payload.platform aquí — deviceAgentService.js usa
        // liveEntry.platform como reserva para el campo "os" (pensado para
        // MI-PC), y pisarlo con el modelo del móvil hacía que "Sistema"
        // mostrara "Google Pixel..." en vez de "Android". model/manufacturer
        // ya van en sus propios campos, no hace falta duplicarlos ahí.
      }
      api("/api/devices", { method: "POST", body: JSON.stringify(payload) }).catch(() => {
        /* heartbeat es best-effort, un fallo puntual no debe interrumpir la app */
      });
    }

    sendHeartbeat();
    setInterval(sendHeartbeat, 25000);
  })();

  function closeConfigPanel() {
    els.configPanel.hidden = true;
    state.configPluginId = null;
    state.configDraft = {};
    state.configSchema = null;
    state.configName = null;
    els.configForm.innerHTML = "";
    hideConfigErrors();
  }

  function hideConfigErrors() {
    if (!els.configErrors) return;
    els.configErrors.hidden = true;
    els.configErrors.innerHTML = "";
  }

  function showConfigErrors(errors) {
    if (!els.configErrors) return;
    const list = Array.isArray(errors) ? errors : [];
    if (!list.length) {
      hideConfigErrors();
      return;
    }
    els.configErrors.hidden = false;
    els.configErrors.innerHTML =
      `<strong>Revisa la configuración</strong><ul>` +
      list.map((e) => `<li>${e.message || e}</li>`).join("") +
      `</ul>`;
  }

  function fieldInput(key, field, value) {
    const type = field.type || "string";
    const label = field.label || key;
    if (type === "boolean") {
      const checked = Boolean(value);
      return `<div class="config-field boolean">
        <label for="cfg-${key}">${label}</label>
        <input id="cfg-${key}" name="${key}" type="checkbox" ${checked ? "checked" : ""} />
      </div>`;
    }
    if (type === "select") {
      const opts = (field.options || [])
        .map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label || o.value;
          return `<option value="${v}" ${String(value) === String(v) ? "selected" : ""}>${l}</option>`;
        })
        .join("");
      return `<div class="config-field"><label for="cfg-${key}">${label}</label><select id="cfg-${key}" name="${key}">${opts}</select></div>`;
    }
    if (type === "number") {
      const min = field.min != null ? `min="${field.min}"` : "";
      const max = field.max != null ? `max="${field.max}"` : "";
      return `<div class="config-field"><label for="cfg-${key}">${label}</label><input id="cfg-${key}" name="${key}" type="number" value="${value ?? ""}" ${min} ${max} /></div>`;
    }
    const inputType = field.secret ? "password" : "text";
    return `<div class="config-field"><label for="cfg-${key}">${label}</label><input id="cfg-${key}" name="${key}" type="${inputType}" value="${value ?? ""}" autocomplete="off" /></div>`;
  }

  function readFormDraft(schema) {
    const draft = {};
    Object.keys(schema || {}).forEach((key) => {
      const field = schema[key] || {};
      const el = els.configForm.querySelector(`[name="${key}"]`);
      if (!el) return;
      if (field.type === "boolean") draft[key] = !!el.checked;
      else if (field.type === "number") draft[key] = el.value === "" ? null : Number(el.value);
      else draft[key] = el.value;
    });
    return draft;
  }

  function renderConfigForm(schema, config) {
    const keys = Object.keys(schema || {});
    state.configSchema = schema || {};
    if (!keys.length) {
      els.configForm.innerHTML = `<p class="tagline">Este plugin no define schema de configuración.</p>`;
      return;
    }
    els.configForm.innerHTML = keys
      .map((key) => fieldInput(key, schema[key] || {}, config?.[key] ?? schema[key]?.default))
      .join("");
  }

  async function openConfigPanel(pluginId, pluginName) {
    try {
      toast(`Cargando config de ${pluginName}…`);
      const data = await api(`/api/plugin-config/${pluginId}`);
      state.configPluginId = pluginId;
      state.configName = pluginName || data.name || pluginId;
      state.configDraft = { ...(data.config || {}) };
      els.configTitle.textContent = `Configurar · ${state.configName}`;
      hideConfigErrors();
      renderConfigForm(data.schema || {}, data.config || {});
      els.configPanel.hidden = false;
    } catch (err) {
      toast(`No se pudo abrir config: ${err.message}`);
    }
  }

  async function saveConfigPanel() {
    if (!state.configPluginId) return;
    try {
      const schema = state.configSchema || {};
      const draft = readFormDraft(schema);
      const check = await api(`/api/plugin-config/${state.configPluginId}/validate`, {
        method: "POST",
        body: JSON.stringify({ config: draft }),
      });
      if (!check.ok) {
        showConfigErrors(check.errors || []);
        toast("Configuración no válida");
        return;
      }
      hideConfigErrors();
      await api(`/api/plugin-config/${state.configPluginId}`, {
        method: "POST",
        body: JSON.stringify({ config: draft }),
      });
      toast("Configuración guardada");
      closeConfigPanel();
    } catch (err) {
      toast(`Error al guardar: ${err.message}`);
    }
  }

  async function validateConfigPanel() {
    if (!state.configPluginId) return;
    try {
      const draft = readFormDraft(state.configSchema || {});
      const check = await api(`/api/plugin-config/${state.configPluginId}/validate`, {
        method: "POST",
        body: JSON.stringify({ config: draft }),
      });
      if (check.ok) {
        hideConfigErrors();
        toast("Configuración válida ✔");
      } else {
        showConfigErrors(check.errors || []);
        toast("Hay errores de validación");
      }
    } catch (err) {
      toast(err.message);
    }
  }

  async function resetConfigPanel() {
    if (!state.configPluginId) return;
    if (!confirm("¿Restablecer la configuración del plugin a los valores por defecto?")) return;
    try {
      const data = await api(`/api/plugin-config/${state.configPluginId}/reset`, {
        method: "POST",
        body: "{}",
      });
      state.configDraft = { ...(data.config || {}) };
      renderConfigForm(data.schema || state.configSchema || {}, data.config || {});
      hideConfigErrors();
      toast("Configuración restablecida");
    } catch (err) {
      toast(err.message);
    }
  }

  async function exportConfigPanel() {
    if (!state.configPluginId) return;
    try {
      const data = await api(`/api/plugin-config/${state.configPluginId}/export`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `bmo-${state.configPluginId}-config.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Config exportada");
    } catch (err) {
      toast(err.message);
    }
  }

  function importConfigPanel() {
    if (!state.configPluginId) return;
    els.configImportFile?.click();
  }

  async function onImportFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !state.configPluginId) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const data = await api(`/api/plugin-config/${state.configPluginId}/import`, {
        method: "POST",
        body: JSON.stringify(json),
      });
      state.configDraft = { ...(data.config || {}) };
      renderConfigForm(data.schema || state.configSchema || {}, data.config || {});
      hideConfigErrors();
      toast("Configuración importada");
    } catch (err) {
      toast(`Importación fallida: ${err.message}`);
    }
  }

  els.configBack?.addEventListener("click", closeConfigPanel);
  els.configSave?.addEventListener("click", saveConfigPanel);
  els.configValidate?.addEventListener("click", validateConfigPanel);
  els.configReset?.addEventListener("click", resetConfigPanel);
  els.configExport?.addEventListener("click", exportConfigPanel);
  els.configImport?.addEventListener("click", importConfigPanel);
  els.configImportFile?.addEventListener("change", onImportFileSelected);
  els.configPanel?.addEventListener("click", (e) => {
    if (e.target === els.configPanel) closeConfigPanel();
  });

  function stopSpotifyPolling() {
    if (state.spotifyTimer) {
      clearInterval(state.spotifyTimer);
      state.spotifyTimer = null;
    }
  }

  function closeSpotifyPanel() {
    stopSpotifyPolling();
    closeBmoMusic();
  }

  function fmtMs(ms) {
    const n = Math.max(0, Math.floor(Number(ms) || 0) / 1000);
    const m = Math.floor(n / 60);
    const s = Math.floor(n % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // Texto corto de Spotify para Inicio/servicios (KAN-400).
  function spotifySubText(sp) {
    if (!sp) return "cargando…";
    if (!sp.configured) return "sin config";
    if (!sp.connected) return "desconectado";
    if (sp.playing && sp.track) return `▶ ${sp.track.name}`;
    return (sp.device && sp.device.name) || "conectado";
  }

  async function refreshSpotifyStatus() {
    try {
      state.spotify = await api("/api/spotify/status");
      renderServices();
      const sub = els.homeServices?.querySelector('[data-home-svc="spotify"] .hs-sub');
      if (sub) sub.textContent = spotifySubText(state.spotify);
    } catch {
      /* el dashboard no se bloquea si Spotify falla */
    }
  }

  async function connectSpotify() {
    try {
      const data = await api("/api/spotify/auth-url");
      if (!data.url) throw new Error("No hay URL de auth");
      window.location.href = data.url;
    } catch (err) {
      toast(err.message);
    }
  }

  // KAN-393/403: BMO Music es la única app de música (panel antiguo retirado en F10).
  function openSpotifyPanel() {
    return openBmoMusic();
  }

  // —— BMO Music (KAN-393) ——
  // Reutiliza el mismo spotifyService del backend. Sondeo de estado cada 8s
  // solo con el panel abierto (el backend ya cachea 3s); el progreso se
  // interpola en cliente cada segundo sin peticiones extra.
  // var (no const): closeSpotifyPanel() puede llamar a closeBmoMusic()
  // durante la carga inicial, antes de llegar a esta línea.
  var bm = {
    view: "home",
    status: null,
    timer: null,
    tick: null,
    syncedAt: 0,
    lastEndRefresh: 0,
    playlists: null,
    saved: null,
    libTab: "playlists",
    libError: "",
    lists: {},
    searchQ: "",
    searchRes: null,
    searchTimer: null,
    searchSeq: 0,
    busy: false,
    transferring: null,
    devError: "",
    sheet: "devices",
    queue: null,
    pageStack: [],
    prevView: "home",
    pageCache: {},
    libFilter: "",
    libSort: null,
    ambient: false,
    lastTouch: Date.now(),
    likes: {},
    likeBusy: {},
    trackIndex: {},
    savedTotal: 0,
    savedNext: null,
    savedLoading: false,
    savedAll: false,
    addUri: null,
  };
  const BM_PINS_KEY = "bmomusic.pins";
  const BM_SORT_KEY = "bmomusic.libSort";
  const BM_AMBIENT_IDLE_MS = 3 * 60 * 1000;
  const BM_HISTORY_KEY = "bmomusic.searchHistory";
  const BM_VIS_KEY = "bmomusic.visualizer";
  // Iconos SVG propios: los glifos Unicode (▶ ⏸ ⏮) tienen métricas distintas
  // según la fuente y quedaban descentrados dentro de los botones redondos.
  const BM_STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const BM_ICONS = {
    play: '<path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/>',
    prev: '<path d="M5 5h2.2v14H5zM20 6.2v11.6a1 1 0 0 1-1.55.83l-8.65-5.8a1 1 0 0 1 0-1.66l8.65-5.8A1 1 0 0 1 20 6.2z"/>',
    next: '<path d="M16.8 5H19v14h-2.2zM4 6.2v11.6a1 1 0 0 0 1.55.83l8.65-5.8a1 1 0 0 0 0-1.66L5.55 5.37A1 1 0 0 0 4 6.2z"/>',
    shuffle: `<g ${BM_STROKE}><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></g>`,
    repeat: `<g ${BM_STROKE}><path d="M17 2l4 4-4 4"/><path d="M3 11V10a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></g>`,
    repeatOne: `<g ${BM_STROKE}><path d="M17 2l4 4-4 4"/><path d="M3 11V10a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></g><path d="M11 10.2l1.6-1V15" ${BM_STROKE} stroke-width="1.8"/>`,
    devices: `<g ${BM_STROKE}><rect x="5" y="2" width="14" height="20" rx="2.5"/><circle cx="12" cy="14" r="3.6"/><path d="M12 6.2h.01"/></g>`,
    down: `<path d="M6 9l6 6 6-6" ${BM_STROKE}/>`,
    back: `<path d="M15 6l-6 6 6 6" ${BM_STROKE}/>`,
    queue: `<g ${BM_STROKE}><path d="M4 6h12"/><path d="M4 12h12"/><path d="M4 18h7"/></g><path d="M15 15.5v5l4.5-2.5z"/>`,
    plus: `<g ${BM_STROKE}><path d="M12 5v14"/><path d="M5 12h14"/></g>`,
    heart: `<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.6 5 6.9 5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.4 3.2 4.2 6.3-1.8 4.6-9.3 9.2-9.3 9.2z" ${BM_STROKE}/>`,
    heartFill: `<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.6 5 6.9 5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.4 3.2 4.2 6.3-1.8 4.6-9.3 9.2-9.3 9.2z"/>`,
    playlistAdd: `<g ${BM_STROKE}><path d="M4 6h11"/><path d="M4 12h11"/><path d="M4 18h7"/><path d="M18 14v6"/><path d="M15 17h6"/></g>`,
    pin: `<path d="M8.5 3h7l-1 6.2 3.2 3.3V14h-11v-1.5L9.5 9.2z"/><path d="M12 14v7" ${BM_STROKE}/>`,
    ambient: `<g ${BM_STROKE}><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></g>`,
  };
  function bmIcon(name) {
    return `<svg class="bm-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${BM_ICONS[name] || ""}</svg>`;
  }

  function bmStore(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  }

  function bmSave(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function bmEl(id) {
    return document.getElementById(id);
  }

  function bmBg(url) {
    return url ? `background-image:url('${escHtml(url).replace(/'/g, "%27")}')` : "";
  }

  function bmImg(url, cls, alt) {
    return url
      ? `<img class="${cls}" src="${escHtml(url)}" alt="${escHtml(alt || "")}" loading="lazy" />`
      : `<div class="${cls} bm-img-empty">♪</div>`;
  }

  function bmGreeting() {
    const h = new Date().getHours();
    if (h < 6) return "Música para trasnochar";
    if (h < 13) return "Buenos días";
    if (h < 21) return "Buenas tardes";
    return "Buenas noches";
  }

  function bmMood(s) {
    if (!s || !s.connected) return { cls: "sleep", line: "BMO está esperando a Spotify" };
    if (s.playing) return { cls: "happy", line: "¡BMO está escuchando música!" };
    if (s.track) return { cls: "calm", line: "Música en pausa" };
    return { cls: "calm", line: "La música está lista" };
  }

  function bmProgress() {
    const s = bm.status;
    if (!s || !s.track) return 0;
    let p = Number(s.progressMs) || 0;
    if (s.playing) p += Date.now() - bm.syncedAt;
    const dur = Number(s.track.durationMs) || p;
    return Math.min(p, dur);
  }

  function bmSkeletonCards(n) {
    return Array.from({ length: n })
      .map(() => `<div class="bm-card bm-skel"><div class="bm-card-img"></div><span class="bm-skel-line"></span></div>`)
      .join("");
  }

  function bmSkeletonRows(n) {
    return `<div class="bm-rows">${Array.from({ length: n })
      .map(() => `<div class="bm-row bm-skel"><div class="bm-row-img"></div><span class="bm-skel-line"></span></div>`)
      .join("")}</div>`;
  }

  function bmErrorBox(msg) {
    const m = String(msg || "Error desconocido");
    const scope = /scope|permission|insufficient/i.test(m);
    return `<div class="bm-state bm-state-small">
      <h2>${scope ? "Falta un permiso de Spotify" : "No se pudo cargar"}</h2>
      <p>${scope ? "Esta función necesita volver a autorizar Spotify con los permisos nuevos (se hace desde la pantalla de BMO)." : escHtml(m)}</p>
      ${scope ? `<button type="button" class="bm-btn-primary" data-bm-connect>Volver a autorizar</button>` : ""}
    </div>`;
  }

  function bmConnectCard(s) {
    const configured = Boolean(s && s.configured);
    return `<div class="bm-state">
      <img src="./assets/bmo.webp" alt="" class="bm-state-bmo" />
      <h2>${configured ? "Conecta tu cuenta de Spotify" : "Spotify sin configurar"}</h2>
      <p>${
        configured
          ? "BMO necesita permiso para ver y controlar tu música. La autorización se hace desde la pantalla de BMO: Spotify solo acepta volver a esta Raspberry."
          : "Falta el Client ID / Client Secret de Spotify en la configuración del plugin."
      }</p>
      ${configured ? `<button type="button" class="bm-btn-primary" data-bm-connect>Conectar con Spotify</button>` : ""}
      ${s && s.error ? `<p class="bm-note">${escHtml(s.error)}</p>` : ""}
    </div>`;
  }

  // Fijados: solo ids, por pantalla (localStorage) - preferencia de interfaz,
  // no datos de escucha.
  function bmPins() {
    const p = bmStore(BM_PINS_KEY, []);
    return Array.isArray(p) ? p : [];
  }

  function bmTogglePin(id) {
    const p = bmPins();
    const i = p.indexOf(id);
    if (i >= 0) p.splice(i, 1);
    else p.unshift(id);
    bmSave(BM_PINS_KEY, p.slice(0, 30));
    return i < 0;
  }

  function bmOrderPinned(list) {
    const p = bmPins();
    if (!p.length) return list;
    const rank = (pl) => {
      const i = p.indexOf(pl.id);
      return i < 0 ? 1e9 : i;
    };
    return list
      .map((x, i) => [x, i])
      .sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1])
      .map((x) => x[0]);
  }

  function bmPlaylistCards(list) {
    if (!list.length) return `<p class="bm-empty">No hay playlists en tu cuenta.</p>`;
    const pins = bmPins();
    return list
      .map(
        (pl) => `<button type="button" class="bm-card" data-bm-play-context="${escHtml(pl.uri)}">
        ${bmImg(pl.image, "bm-card-img", pl.name)}
        <span class="bm-card-play">${bmIcon("play")}</span>
        ${pl.id ? `<span class="bm-card-pin ${pins.includes(pl.id) ? "is-on" : ""}" role="button" data-bm-pin="${escHtml(pl.id)}" aria-label="${pins.includes(pl.id) ? "Desfijar" : "Fijar arriba"}">${bmIcon("pin")}</span>` : ""}
        <span class="bm-card-title">${escHtml(pl.name)}</span>
        <span class="bm-card-sub">${escHtml(pl.owner || "")}${pl.tracksTotal ? ` · ${pl.tracksTotal} canciones` : ""}</span>
      </button>`
      )
      .join("");
  }

  // Corazón de Me gusta (solo icono). Estado desconocido -> gris y sin
  // efecto hasta que Spotify confirma; nunca se inventa.
  function bmHeart(uri, cls) {
    if (!uri) return "";
    const known = uri in bm.likes;
    const on = bm.likes[uri] === true;
    return `<span class="bm-heart ${cls || ""} ${on ? "is-on" : ""} ${known ? "" : "is-unknown"}" role="button" tabindex="0" data-bm-heart="${escHtml(uri)}" aria-pressed="${on}" aria-label="${on ? "Quitar de Me gusta" : "Añadir a Me gusta"}">${bmIcon(on ? "heartFill" : "heart")}</span>`;
  }

  function bmSyncHearts() {
    document.querySelectorAll("#bmomusic-panel [data-bm-heart]").forEach((el) => {
      const uri = el.dataset.bmHeart;
      const known = uri in bm.likes;
      const on = bm.likes[uri] === true;
      el.classList.toggle("is-on", on);
      el.classList.toggle("is-unknown", !known);
      el.setAttribute("aria-pressed", String(on));
      el.setAttribute("aria-label", on ? "Quitar de Me gusta" : "Añadir a Me gusta");
      el.innerHTML = bmIcon(on ? "heartFill" : "heart");
    });
  }

  // Consulta en bloques de 20 (límite del backend) solo lo que no se sabe.
  function bmCheckLikesChunked(uris) {
    const need = [...new Set(uris)].filter((u) => u && !(u in bm.likes));
    for (let i = 0; i < need.length; i += 20) bmCheckLikes(need.slice(i, i + 20));
  }

  function bmTrackRows(list, key) {
    bm.lists[key] = list.map((t) => t.uri);
    if (!list.length) return `<p class="bm-empty">Todavía no hay canciones aquí.</p>`;
    list.forEach((t) => {
      if (t && t.uri) bm.trackIndex[t.uri] = t;
    });
    setTimeout(() => bmCheckLikesChunked(list.map((t) => t.uri)), 0);
    const cur = bm.status && bm.status.track ? bm.status.track.uri : null;
    return `<div class="bm-rows">${list
      .map(
        (t, i) => `<button type="button" class="bm-row ${t.uri === cur ? "is-current" : ""}" data-bm-play-track="${key}:${i}">
        ${bmImg(t.image, "bm-row-img", t.album)}
        <span class="bm-row-text"><span class="bm-row-title">${escHtml(t.name)}</span><span class="bm-row-sub">${escHtml(t.artists)}${t.album ? ` · ${escHtml(t.album)}` : ""}</span></span>
        <span class="bm-row-dur">${t.durationMs ? fmtMs(t.durationMs) : ""}</span>
        ${bmHeart(t.uri, "bm-row-heart")}
        <span class="bm-row-q" role="button" tabindex="0" data-bm-queue-add="${escHtml(t.uri)}" aria-label="Añadir a la cola">${bmIcon("plus")}</span>
      </button>`
      )
      .join("")}</div>`;
  }

  async function bmLoadPlaylists() {
    try {
      bm.playlists = (await api("/api/spotify/playlists")).items || [];
    } catch (err) {
      bm.playlists = null;
      bm.libError = err.message;
    }
  }

  function bmAddSavedPage(r) {
    const items = (r && r.items) || [];
    items.forEach((t) => {
      bm.likes[t.uri] = true; // está en favoritos: no hace falta preguntar
      bm.trackIndex[t.uri] = t;
    });
    const seen = new Set((bm.saved || []).map((t) => t.uri));
    bm.saved = (bm.saved || []).concat(items.filter((t) => !seen.has(t.uri)));
    bm.savedTotal = Number(r && r.total) || bm.saved.length;
    bm.savedNext = r && r.next != null ? r.next : null;
  }

  async function bmLoadSaved() {
    bm.saved = null;
    bm.savedNext = null;
    try {
      bmAddSavedPage(await api("/api/spotify/saved-tracks?offset=0&limit=50"));
      bm.savedSyncedAt = Date.now();
    } catch (err) {
      bm.saved = null;
      bm.libError = err.message;
    }
  }

  // 12/11/2026 - los favoritos se cargaban UNA sola vez y el kiosco pasa días
  // sin recargarse: lo que se añadía desde el móvil o el PC no aparecía nunca
  // (visto en vivo: Spotify ya devolvía la canción nueva y la pantalla no).
  // Ahora se vuelve a pedir la primera página (al entrar en Favoritos y, con
  // la lista a la vista, como mucho una vez por minuto); si ha cambiado, se
  // sustituye la lista por la real. Devuelve true si hubo cambios.
  async function bmRefreshSaved(minAgeMs) {
    if (!bm.saved || bm.savedLoading || bm.savedAll || bm.savedRefreshing) return false;
    if (Date.now() - (bm.savedSyncedAt || 0) < minAgeMs) return false;
    bm.savedRefreshing = true;
    try {
      const r = await api("/api/spotify/saved-tracks?offset=0&limit=50");
      bm.savedSyncedAt = Date.now();
      const fresh = (r && r.items) || [];
      const head = bm.saved.slice(0, fresh.length);
      const same =
        Number(r && r.total) === bm.savedTotal &&
        head.length === fresh.length &&
        fresh.every((t, i) => t.uri === head[i].uri);
      if (same) return false;
      // Lo que estaba en ese tramo y ya no está pudo quitarse desde otro
      // dispositivo: su corazón se vuelve a comprobar en vez de darse por bueno.
      const keep = new Set(fresh.map((t) => t.uri));
      head.forEach((t) => {
        if (!keep.has(t.uri)) delete bm.likes[t.uri];
      });
      bm.saved = null;
      bm.savedNext = null;
      bmAddSavedPage(r);
      return true;
    } catch {
      return false; // sin red: se queda la lista que había
    } finally {
      bm.savedRefreshing = false;
    }
  }

  // Siguiente página (al bajar hasta el final o con el botón).
  async function bmLoadMoreSaved() {
    if (bm.savedLoading || bm.savedNext == null || !bm.saved) return false;
    bm.savedLoading = true;
    try {
      bmAddSavedPage(await api(`/api/spotify/saved-tracks?offset=${bm.savedNext}&limit=50`));
      return true;
    } catch (err) {
      toast(`BMO Music: ${err.message}`);
      return false;
    } finally {
      bm.savedLoading = false;
    }
  }

  // "Cargar todas": a petición del usuario, página a página con pausa
  // (no se lanzan 55 peticiones de golpe).
  async function bmLoadAllSaved() {
    if (bm.savedAll) return;
    bm.savedAll = true;
    while (bm.savedNext != null && bm.view === "library" && bm.libTab === "saved") {
      const ok = await bmLoadMoreSaved();
      if (!ok) break;
      bmFillLibrary();
      await new Promise((r) => setTimeout(r, 350));
    }
    bm.savedAll = false;
    bmFillLibrary();
  }

  function bmRenderChrome() {
    const s = bm.status || {};
    const mood = bmMood(s);
    const title = bmEl("bm-greet-title");
    const sub = bmEl("bm-greet-sub");
    const av = bmEl("bm-avatar");
    const conn = bmEl("bm-conn");
    if (title) title.textContent = bmGreeting();
    if (sub) sub.textContent = mood.line;
    if (av) av.className = `bm-avatar ${mood.cls}`;
    if (conn) {
      conn.innerHTML = !bm.status
        ? ""
        : !s.configured
          ? `<span class="bm-dot off"></span>Sin configurar`
          : !s.connected
            ? `<span class="bm-dot off"></span>Desconectado`
            : `<span class="bm-dot"></span>${escHtml(s.device ? s.device.name : "Sin dispositivo")}`;
    }
    bmRenderMini();
  }

  function bmRenderMini() {
    const mini = bmEl("bm-mini");
    if (!mini) return;
    const s = bm.status || {};
    const t = s.track;
    if (!s.connected || !t) {
      mini.hidden = true;
      return;
    }
    mini.hidden = false;
    const pct = t.durationMs ? (bmProgress() / t.durationMs) * 100 : 0;
    mini.innerHTML = `
      <div class="bm-mini-progress"><div class="bm-mini-fill" id="bm-mini-fill" style="width:${pct}%"></div></div>
      <button type="button" class="bm-mini-info" data-bm-open-np>
        ${bmImg(t.image, "bm-mini-cover", t.album)}
        <span class="bm-mini-text"><span class="bm-mini-title">${escHtml(t.name)}</span><span class="bm-mini-artist">${escHtml(t.artists)}</span></span>
      </button>
      <div class="bm-mini-ctrls">
        ${bmHeart(t.uri, "bm-ctrl bm-ctrl-sm bm-mini-heart")}
        <button type="button" class="bm-ctrl bm-ctrl-sm" data-bm-devsheet aria-label="Cambiar dispositivo">${bmIcon("devices")}</button>
        <button type="button" class="bm-ctrl" data-bm-cmd="previous" aria-label="Anterior">${bmIcon("prev")}</button>
        <button type="button" class="bm-ctrl bm-ctrl-main" data-bm-cmd="${s.playing ? "pause" : "play"}" aria-label="${s.playing ? "Pausar" : "Reproducir"}">${bmIcon(s.playing ? "pause" : "play")}</button>
        <button type="button" class="bm-ctrl" data-bm-cmd="next" aria-label="Siguiente">${bmIcon("next")}</button>
      </div>`;
  }

  function bmRenderHero() {
    const hero = bmEl("bm-hero");
    if (!hero) return;
    const s = bm.status || {};
    const t = s.track;
    if (!t) {
      hero.className = "bm-hero bm-hero-idle";
      hero.innerHTML = `<img class="bm-hero-bmo" src="./assets/bmo.webp" alt="" />
        <div class="bm-hero-meta">
          <div class="bm-hero-kicker">Nada sonando ahora mismo</div>
          <div class="bm-hero-title">¿Qué escuchamos?</div>
          <div class="bm-hero-sub">${
            s.devices && s.devices.length
              ? "Elige una playlist o busca algo."
              : "Abre Spotify en algún dispositivo para que BMO pueda controlarlo."
          }</div>
        </div>`;
      return;
    }
    hero.className = `bm-hero ${s.playing ? "is-playing" : ""}`;
    hero.innerHTML = `
      <div class="bm-hero-bg" style="${bmBg(t.image)}"></div>
      <button type="button" class="bm-hero-cover-btn" data-bm-open-np aria-label="Abrir Now Playing">${bmImg(t.image, "bm-hero-cover", t.album)}</button>
      <div class="bm-hero-meta">
        <div class="bm-hero-kicker">${s.playing ? "Sonando ahora" : "En pausa"}${s.device ? ` · ${escHtml(s.device.name)}` : ""}</div>
        <div class="bm-hero-title">${escHtml(t.name)}</div>
        <div class="bm-hero-sub">${escHtml(t.artists)}${t.album ? ` · ${escHtml(t.album)}` : ""}</div>
        <div class="bm-hero-actions">
          <button type="button" class="bm-btn-primary" data-bm-cmd="${s.playing ? "pause" : "play"}">${bmIcon(s.playing ? "pause" : "play")}<span>${s.playing ? "Pausar" : "Reanudar"}</span></button>
          <button type="button" class="bm-btn-ghost bm-btn-icon ${s.shuffleState ? "is-on" : ""}" data-bm-shuffle aria-pressed="${s.shuffleState ? "true" : "false"}">${bmIcon("shuffle")}<span>Aleatorio</span></button>
          <button type="button" class="bm-btn-ghost bm-btn-icon" data-bm-devsheet>${bmIcon("devices")}<span>Dispositivo</span></button>
        </div>
      </div>`;
  }

  function bmRenderHome(view) {
    const s = bm.status;
    if (!s) {
      view.innerHTML = `<div class="bm-hero bm-skel"></div>${bmSkeletonCards(4)}`;
      return;
    }
    if (!s.configured || !s.connected) {
      view.innerHTML = bmConnectCard(s);
      return;
    }
    const missing = Array.isArray(s.missingScopes) ? s.missingScopes : [];
    view.innerHTML = `
      ${missing.length ? `<div class="bm-banner"><span>Reconecta Spotify desde esta pantalla para activar guardar favoritos, editar playlists y el reproductor propio de BMO.</span><button type="button" class="bm-btn-ghost" data-bm-connect>Reconectar</button></div>` : ""}
      <section class="bm-hero" id="bm-hero"></section>
      <div class="bm-quick">
        <button type="button" data-bm-view="search">⌕ Buscar música</button>
        <button type="button" data-bm-view="library" data-bm-lib-tab="saved">♥ Favoritos</button>
        <button type="button" data-bm-view="devices">◉ Dispositivos</button>
      </div>
      <h2 class="bm-h2">Tus playlists</h2>
      <div class="bm-grid" id="bm-home-playlists">${bm.playlists ? bmPlaylistCards(bmOrderPinned(bm.playlists).slice(0, 8)) : bmSkeletonCards(4)}</div>`;
    bmRenderHero();
    if (!bm.playlists) {
      bmLoadPlaylists().then(() => {
        const grid = bmEl("bm-home-playlists");
        if (!grid) return;
        grid.innerHTML = bm.playlists ? bmPlaylistCards(bmOrderPinned(bm.playlists).slice(0, 8)) : bmErrorBox(bm.libError);
      });
    }
  }

  const BM_LIB_SORTS = {
    playlists: [["recent", "Recientes"], ["az", "A–Z"], ["tracks", "Nº de canciones"]],
    saved: [["recent", "Añadidas recientemente"], ["az", "Título A–Z"], ["artist", "Artista"]],
  };

  function bmLibSortState() {
    if (!bm.libSort) {
      const saved = bmStore(BM_SORT_KEY, {});
      bm.libSort = { playlists: "recent", saved: "recent", ...(saved && typeof saved === "object" ? saved : {}) };
    }
    return bm.libSort;
  }

  function bmLibList() {
    const q = String(bm.libFilter || "").trim().toLowerCase();
    const sort = bmLibSortState()[bm.libTab];
    const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es");
    if (bm.libTab === "playlists") {
      let list = (bm.playlists || []).filter((pl) => !q || `${pl.name} ${pl.owner || ""}`.toLowerCase().includes(q));
      if (sort === "az") list = list.slice().sort(byName);
      else if (sort === "tracks") list = list.slice().sort((a, b) => (b.tracksTotal || 0) - (a.tracksTotal || 0));
      return bmOrderPinned(list);
    }
    let list = (bm.saved || []).filter((t) => !q || `${t.name} ${t.artists} ${t.album}`.toLowerCase().includes(q));
    if (sort === "az") list = list.slice().sort(byName);
    else if (sort === "artist") list = list.slice().sort((a, b) => String(a.artists || "").localeCompare(String(b.artists || ""), "es"));
    return list;
  }

  function bmFillLibrary() {
    const body = bmEl("bm-lib-body");
    if (!body || bm.view !== "library") return;
    const isPl = bm.libTab === "playlists";
    const loaded = isPl ? bm.playlists : bm.saved;
    if (!loaded) {
      body.innerHTML = bm.libError ? bmErrorBox(bm.libError) : isPl ? `<div class="bm-grid">${bmSkeletonCards(6)}</div>` : bmSkeletonRows(6);
      return;
    }
    const list = bmLibList();
    if (!list.length) {
      body.innerHTML = bm.libFilter
        ? `<p class="bm-empty">Nada coincide con “${escHtml(bm.libFilter)}”.</p>`
        : `<p class="bm-empty">${isPl ? "No hay playlists en tu cuenta." : "Todavía no hay favoritos."}</p>`;
      return;
    }
    const count = bm.libFilter ? `<p class="bm-lib-count">${list.length} de ${loaded.length}</p>` : "";
    if (isPl) {
      body.innerHTML = `${count}<div class="bm-grid">${bmPlaylistCards(list)}</div>`;
      return;
    }
    const partial = bm.savedNext != null;
    const head = `<div class="bm-fav-head">${bmIcon("heartFill")}<span><strong>${bm.savedTotal}</strong> canciones que te gustan${partial ? ` · ${loaded.length} cargadas` : ""}</span></div>`;
    const hint = partial && (bm.libFilter || bmLibSortState().saved !== "recent")
      ? `<p class="bm-note">El filtro y el orden solo miran las ${loaded.length} canciones cargadas. <button type="button" class="bm-link" data-bm-saved-all>Cargar todas</button></p>`
      : "";
    const more = partial
      ? `<div class="bm-more" id="bm-saved-more">${bm.savedAll ? `Cargando… ${loaded.length} de ${bm.savedTotal}` : `<button type="button" class="bm-btn-ghost" data-bm-saved-more>Cargar 50 más</button><button type="button" class="bm-btn-ghost" data-bm-saved-all>Cargar todas</button>`}</div>`
      : "";
    body.innerHTML = `${head}${hint}${count}${bmTrackRows(list, "saved")}${more}`;
    // La siguiente página se carga sola al bajar (ver listener de scroll).
  }

  function bmRenderLibrary(view) {
    const tab = bm.libTab;
    const cur = bmLibSortState()[tab];
    view.innerHTML = `
      <div class="bm-tabs">
        <button type="button" class="bm-tab ${tab === "playlists" ? "active" : ""}" data-bm-lib-tab="playlists">Playlists</button>
        <button type="button" class="bm-tab ${tab === "saved" ? "active" : ""}" data-bm-lib-tab="saved">Favoritos</button>
      </div>
      <div class="bm-libbar">
        <input id="bm-lib-filter" type="search" placeholder="${tab === "playlists" ? "Filtrar playlists" : "Filtrar favoritos"}" value="${escHtml(bm.libFilter)}" autocomplete="off" />
        <select id="bm-lib-sort" aria-label="Ordenar">${BM_LIB_SORTS[tab]
          .map(([v, l]) => `<option value="${v}" ${v === cur ? "selected" : ""}>${l}</option>`)
          .join("")}</select>
      </div>
      <div id="bm-lib-body"></div>`;
    const loaded = tab === "playlists" ? bm.playlists : bm.saved;
    if (!loaded) bm.libError = "";
    bmFillLibrary();
    if (!loaded) {
      (tab === "playlists" ? bmLoadPlaylists() : bmLoadSaved()).then(() => {
        if (bm.libTab === tab) bmFillLibrary();
      });
    } else if (tab === "saved") {
      bmRefreshSaved(15000).then((changed) => {
        if (changed && bm.view === "library" && bm.libTab === "saved") bmFillLibrary();
      });
    }
  }

  function bmRenderSearch(view) {
    view.innerHTML = `
      <div class="bm-search">
        <span class="bm-search-ico">⌕</span>
        <input id="bm-search-input" type="search" placeholder="Canciones, artistas, álbumes o playlists" value="${escHtml(bm.searchQ)}" autocomplete="off" />
        <button type="button" class="bm-search-clear" data-bm-search-clear aria-label="Borrar">✕</button>
      </div>
      <div id="bm-search-body"></div>`;
    bmRenderSearchBody();
  }

  function bmRenderSearchBody() {
    const body = bmEl("bm-search-body");
    if (!body) return;
    if (!bm.searchQ) {
      const history = bmStore(BM_HISTORY_KEY, []);
      body.innerHTML = history.length
        ? `<h2 class="bm-h2">Búsquedas recientes</h2><div class="bm-chips">${history
            .map((h) => `<button type="button" class="bm-chip" data-bm-history="${escHtml(h)}">${escHtml(h)}</button>`)
            .join("")}</div>`
        : `<p class="bm-empty">Busca lo que quieras escuchar y BMO lo pondrá en tu dispositivo.</p>`;
      return;
    }
    if (bm.searchRes === "loading") {
      body.innerHTML = bmSkeletonRows(5);
      return;
    }
    if (bm.searchRes && bm.searchRes.error) {
      body.innerHTML = bmErrorBox(bm.searchRes.error);
      return;
    }
    const r = bm.searchRes;
    if (!r) {
      body.innerHTML = "";
      return;
    }
    const total = r.tracks.length + r.artists.length + r.albums.length + r.playlists.length;
    if (!total) {
      body.innerHTML = `<p class="bm-empty">Sin resultados para “${escHtml(bm.searchQ)}”.</p>`;
      return;
    }
    body.innerHTML = `
      ${r.tracks.length ? `<h2 class="bm-h2">Canciones</h2>${bmTrackRows(r.tracks, "search")}` : ""}
      ${
        r.artists.length
          ? `<h2 class="bm-h2">Artistas</h2><div class="bm-hscroll">${r.artists
              .map(
                (a) => `<button type="button" class="bm-artist" data-bm-artist="${escHtml(a.id)}">${bmImg(a.image, "bm-artist-img", a.name)}<span>${escHtml(a.name)}</span></button>`
              )
              .join("")}</div>`
          : ""
      }
      ${
        r.albums.length
          ? `<h2 class="bm-h2">Álbumes</h2><div class="bm-grid">${bmAlbumCards(r.albums)}</div>`
          : ""
      }
      ${r.playlists.length ? `<h2 class="bm-h2">Playlists</h2><div class="bm-grid">${bmPlaylistCards(r.playlists)}</div>` : ""}`;
  }

  function bmSearchInput(value) {
    bm.searchQ = String(value || "").trim();
    clearTimeout(bm.searchTimer);
    if (!bm.searchQ) {
      bm.searchRes = null;
      bmRenderSearchBody();
      return;
    }
    bm.searchTimer = setTimeout(() => bmDoSearch(bm.searchQ), 450);
  }

  async function bmDoSearch(q) {
    const seq = ++bm.searchSeq;
    bm.searchRes = "loading";
    bmRenderSearchBody();
    try {
      const r = await api(`/api/spotify/search?q=${encodeURIComponent(q)}`);
      if (seq !== bm.searchSeq) return;
      bm.searchRes = r;
      const history = [q, ...bmStore(BM_HISTORY_KEY, []).filter((h) => String(h).toLowerCase() !== q.toLowerCase())].slice(0, 8);
      bmSave(BM_HISTORY_KEY, history);
    } catch (err) {
      if (seq !== bm.searchSeq) return;
      bm.searchRes = { error: err.message };
    }
    bmRenderSearchBody();
  }

  const BM_DEVICE_ICONS = { Computer: "💻", Smartphone: "📱", Tablet: "📱", Speaker: "🔊", AVR: "🔊", CastAudio: "🔊", TV: "📺", CastVideo: "📺" };

  function bmDeviceListHtml(devs) {
    if (!devs.length) {
      return `<p class="bm-empty">No hay ningún dispositivo Spotify Connect disponible ahora mismo. Abre Spotify en el móvil, el PC o un altavoz y aparecerá aquí.</p>`;
    }
    return `<div class="bm-devices">${devs
      .map((d) => {
        const busy = bm.transferring === d.id;
        return `<button type="button" class="bm-device ${d.isActive ? "is-active" : ""} ${busy ? "is-busy" : ""}" data-bm-device="${escHtml(d.id)}" ${d.isActive || bm.transferring ? "disabled" : ""}>
              <span class="bm-device-ico">${BM_DEVICE_ICONS[d.type] || "🎵"}</span>
              <span class="bm-device-text"><span class="bm-device-name">${escHtml(d.name)}</span><span class="bm-device-sub">${escHtml(d.type)}${d.isActive ? " · reproduciendo aquí" : ""}${d.volume != null ? ` · vol ${d.volume}%` : ""}</span></span>
              <span class="bm-device-action">${busy ? "Cambiando…" : d.isActive ? "Activo" : "Usar"}</span>
            </button>`;
      })
      .join("")}</div>`;
  }

  function bmRenderDevices(view) {
    const s = bm.status;
    if (!s || !s.connected) {
      view.innerHTML = s ? bmConnectCard(s) : bmSkeletonRows(3);
      return;
    }
    view.innerHTML = `
      <h2 class="bm-h2">Spotify Connect</h2>
      ${bm.devError ? `<p class="bm-dev-error" role="alert">${escHtml(bm.devError)}</p>` : ""}
      ${bmDeviceListHtml(s.devices || [])}
      <p class="bm-note">BMO todavía no aparece como dispositivo propio: eso llega en la fase de reproducción.</p>`;
  }

  // Selector rápido de dispositivo (hoja inferior), accesible desde el
  // mini reproductor, el hero de Inicio y Now Playing.
  function bmRenderDevSheet() {
    const sheet = bmEl("bm-devsheet");
    if (!sheet || sheet.hidden) return;
    if (bm.sheet === "queue") return bmRenderQueueSheet(sheet);
    if (bm.sheet === "playlists") return bmRenderPlaylistSheet(sheet);
    sheet.setAttribute("aria-label", "Elegir dispositivo");
    const s = bm.status || {};
    sheet.innerHTML = `<div class="bm-sheet-backdrop" data-bm-close-sheet></div>
      <div class="bm-sheet-card">
        <div class="bm-sheet-head"><h2 class="bm-h2">Reproducir en…</h2><button type="button" class="bm-np-close" data-bm-close-sheet aria-label="Cerrar">${bmIcon("down")}</button></div>
        ${bm.devError ? `<p class="bm-dev-error" role="alert">${escHtml(bm.devError)}</p>` : ""}
        ${s.connected ? bmDeviceListHtml(s.devices || []) : `<p class="bm-empty">Spotify no está conectado.</p>`}
      </div>`;
  }

  function bmOpenDevSheet() {
    const sheet = bmEl("bm-devsheet");
    if (!sheet) return;
    bm.sheet = "devices";
    bm.devError = "";
    sheet.hidden = false;
    bmRenderDevSheet();
    bmRefresh();
  }

  function bmCloseDevSheet() {
    const sheet = bmEl("bm-devsheet");
    if (sheet) sheet.hidden = true;
  }

  // ---- Cola (KAN-398): solo lectura + añadir. La Web API de Spotify no
  // permite quitar ni reordenar elementos de la cola.
  function bmRenderQueueSheet(sheet) {
    sheet.setAttribute("aria-label", "Cola de reproducción");
    const q = bm.queue;
    let body;
    if (!q || q === "loading") body = bmSkeletonRows(5);
    else if (q.error) body = bmErrorBox(q.error);
    else {
      const next = (q.queue || []).filter(Boolean).slice(0, 20);
      const row = (t) => `<div class="bm-row bm-row-static">${bmImg(t.image, "bm-row-img", t.album)}<span class="bm-row-text"><span class="bm-row-title">${escHtml(t.name)}</span><span class="bm-row-sub">${escHtml(t.artists)}</span></span><span class="bm-row-dur">${t.durationMs ? fmtMs(t.durationMs) : ""}</span></div>`;
      body = `${q.currentlyPlaying ? `<h3 class="bm-h3">Sonando</h3><div class="bm-rows">${row(q.currentlyPlaying)}</div>` : ""}
        <h3 class="bm-h3">A continuación</h3>
        ${next.length ? `<div class="bm-rows">${next.map(row).join("")}</div>` : `<p class="bm-empty">La cola está vacía.</p>`}
        <p class="bm-note">Añade canciones con el botón + de cualquier lista. Spotify no deja quitar ni reordenar la cola desde otras apps.</p>`;
    }
    sheet.innerHTML = `<div class="bm-sheet-backdrop" data-bm-close-sheet></div>
      <div class="bm-sheet-card">
        <div class="bm-sheet-head"><h2 class="bm-h2">Cola</h2><button type="button" class="bm-np-close" data-bm-close-sheet aria-label="Cerrar">${bmIcon("down")}</button></div>
        ${body}
      </div>`;
  }

  async function bmLoadQueue() {
    bm.queue = "loading";
    bmRenderDevSheet();
    try {
      bm.queue = await api("/api/spotify/queue");
    } catch (err) {
      bm.queue = { error: err.message };
    }
    bmRenderDevSheet();
  }

  function bmOpenQueue() {
    const sheet = bmEl("bm-devsheet");
    if (!sheet) return;
    bm.sheet = "queue";
    sheet.hidden = false;
    bmLoadQueue();
  }

  async function bmAddToQueue(uri) {
    try {
      await api("/api/spotify/queue", { method: "POST", body: JSON.stringify({ uri }) });
      toast("Añadida a la cola");
      const sheet = bmEl("bm-devsheet");
      if (bm.sheet === "queue" && sheet && !sheet.hidden) bmLoadQueue();
    } catch (err) {
      toast(`BMO Music: ${err.message}`);
    }
  }

  // ---- Páginas de artista y álbum (KAN-399) ----
  function bmAlbumCards(list) {
    if (!list.length) return `<p class="bm-empty">Sin discos.</p>`;
    return list
      .map(
        (al) => `<button type="button" class="bm-card" data-bm-album="${escHtml(al.id)}">${bmImg(al.image, "bm-card-img", al.name)}<span class="bm-card-play" role="button" data-bm-quick-play="${escHtml(al.uri)}" aria-label="Reproducir ${escHtml(al.name)}">${bmIcon("play")}</span><span class="bm-card-title">${escHtml(al.name)}</span><span class="bm-card-sub">${al.type === "single" ? "Single" : escHtml(al.artists)}${al.year ? ` · ${al.year}` : ""}</span></button>`
      )
      .join("");
  }

  function bmOpenPage(type, id) {
    if (!id) return;
    const np = bmEl("bm-np");
    if (np) np.hidden = true;
    bmCloseDevSheet();
    if (bm.view !== "artist" && bm.view !== "album") {
      bm.prevView = bm.view;
      bm.pageStack = [];
    }
    bm.pageStack.push({ type, id });
    bmShowPage();
  }

  function bmPageBack() {
    bm.pageStack.pop();
    if (bm.pageStack.length) return bmShowPage();
    bmSetView(bm.prevView || "home");
  }

  function bmShowPage() {
    const top = bm.pageStack[bm.pageStack.length - 1];
    bm.view = top.type;
    document.querySelectorAll("#bmomusic-panel .bm-nav-btn").forEach((b) => b.classList.remove("active"));
    const v = bmEl("bm-view");
    if (v) v.scrollTop = 0;
    bmRenderView();
    const key = `${top.type}:${top.id}`;
    if (bm.pageCache[key]) return;
    api(`/api/spotify/${top.type}/${encodeURIComponent(top.id)}`)
      .then((data) => {
        bm.pageCache[key] = data;
      })
      .catch((err) => {
        bm.pageCache[key] = { error: err.message };
      })
      .then(() => {
        const cur = bm.pageStack[bm.pageStack.length - 1];
        if (cur && `${cur.type}:${cur.id}` === key && bm.view === cur.type) bmRenderView();
      });
  }

  function bmRenderPage(view) {
    const top = bm.pageStack[bm.pageStack.length - 1];
    if (!top) return bmSetView("home");
    const key = `${top.type}:${top.id}`;
    const data = bm.pageCache[key];
    const back = `<button type="button" class="bm-page-back" data-bm-page-back aria-label="Volver">${bmIcon("back")}<span>Volver</span></button>`;
    if (!data) {
      view.innerHTML = `${back}<div class="bm-page-hero bm-skel"><span class="bm-page-img bm-page-skel"></span><span class="bm-skel-line"></span></div>${bmSkeletonRows(5)}`;
      return;
    }
    if (data.error) {
      delete bm.pageCache[key];
      view.innerHTML = `${back}${bmErrorBox(data.error)}`;
      return;
    }
    if (top.type === "artist") {
      view.innerHTML = `${back}
        <section class="bm-page-hero">
          ${bmImg(data.image, "bm-page-img bm-page-img-round", data.name)}
          <div class="bm-page-meta">
            <div class="bm-page-kicker">Artista</div>
            <h1 class="bm-page-title">${escHtml(data.name)}</h1>
            <div class="bm-hero-actions"><button type="button" class="bm-btn-primary" data-bm-play-context="${escHtml(data.uri)}">${bmIcon("play")}<span>Reproducir</span></button>${bmLikeButton(data.uri, "artist")}</div>
          </div>
        </section>
        ${data.tracks && data.tracks.length ? `<h2 class="bm-h2">Canciones</h2>${bmTrackRows(data.tracks, "artist")}` : ""}
        <h2 class="bm-h2">Discografía${data.albumsTotal > (data.albums || []).length ? ` <span class="bm-h2-sub">${(data.albums || []).length} de ${data.albumsTotal}</span>` : ""}</h2>
        <div class="bm-grid">${bmAlbumCards(data.albums || [])}</div>
        ${(data.partialErrors || []).length ? `<p class="bm-note">No se pudo cargar: ${escHtml(data.partialErrors.join(" · "))}</p>` : ""}
        <p class="bm-note">Spotify no deja a esta app ver las canciones más populares, los artistas relacionados ni los seguidores (modo desarrollo).</p>`;
      return;
    }
    view.innerHTML = `${back}
      <section class="bm-page-hero">
        ${bmImg(data.image, "bm-page-img", data.name)}
        <div class="bm-page-meta">
          <div class="bm-page-kicker">${data.type === "single" ? "Single" : data.type === "compilation" ? "Recopilatorio" : "Álbum"}</div>
          <h1 class="bm-page-title">${escHtml(data.name)}</h1>
          ${data.artistId ? `<button type="button" class="bm-page-artist" data-bm-artist="${escHtml(data.artistId)}">${escHtml(data.artists)}</button>` : `<div class="bm-page-sub">${escHtml(data.artists)}</div>`}
          <div class="bm-page-sub">${data.year || ""}${data.totalTracks ? ` · ${data.totalTracks} canciones` : ""}</div>
          <div class="bm-hero-actions"><button type="button" class="bm-btn-primary" data-bm-play-context="${escHtml(data.uri)}">${bmIcon("play")}<span>Reproducir</span></button>${bmLikeButton(data.uri, "album")}</div>
        </div>
      </section>
      ${bmTrackRows(data.tracks || [], "album")}
      ${data.label ? `<p class="bm-note">${escHtml(data.label)}</p>` : ""}`;
  }

  function bmRenderView() {
    const view = bmEl("bm-view");
    if (!view) return;
    if (bm.view === "artist" || bm.view === "album") return bmRenderPage(view);
    if (bm.view === "search") bmRenderSearch(view);
    else if (bm.view === "library") bmRenderLibrary(view);
    else if (bm.view === "devices") bmRenderDevices(view);
    else bmRenderHome(view);
  }

  function bmSetView(view) {
    bm.view = view;
    document.querySelectorAll("#bmomusic-panel .bm-nav-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.bmView === view);
    });
    const v = bmEl("bm-view");
    if (v) v.scrollTop = 0;
    bmRenderView();
  }

  function bmRenderNowPlaying() {
    const np = bmEl("bm-np");
    if (!np || np.hidden) return;
    const active = document.activeElement;
    if (active && (active.id === "bm-seek" || active.id === "bm-volume")) return;
    const s = bm.status || {};
    const t = s.track;
    const vis = bmStore(BM_VIS_KEY, true);
    if (!t) {
      np.innerHTML = `<div class="bm-np-inner">
        <div class="bm-np-top"><button type="button" class="bm-np-close" data-bm-close-np aria-label="Cerrar">${bmIcon("down")}</button></div>
        <div class="bm-state"><img src="./assets/bmo.webp" class="bm-state-bmo" alt="" /><h2>Nada sonando</h2><p>Elige algo en Inicio o en tu Biblioteca.</p></div>
      </div>`;
      return;
    }
    const dur = Number(t.durationMs) || 0;
    const pos = bmProgress();
    np.innerHTML = `
      <div class="bm-np-bg" style="${bmBg(t.image)}"></div>
      <div class="bm-np-inner ${s.playing ? "is-playing" : ""}">
        <div class="bm-np-top">
          <button type="button" class="bm-np-close" data-bm-close-np aria-label="Cerrar">${bmIcon("down")}</button>
          <button type="button" class="bm-np-device" data-bm-devsheet aria-label="Cambiar dispositivo">${bmIcon("devices")}<span>${s.device ? escHtml(s.device.name) : "Elegir dispositivo"}</span></button>
          <button type="button" class="bm-np-vis-toggle ${vis ? "is-on" : ""}" data-bm-vis-toggle aria-label="Visualizador">≋</button>
        </div>
        <div class="bm-np-cover-wrap">${bmImg(t.image, "bm-np-cover", t.album)}</div>
        ${
          vis
            ? `<div class="bm-vis" aria-hidden="true">${Array.from({ length: 24 })
                .map((_, i) => `<span style="animation-delay:${(i * 137) % 900}ms;animation-duration:${700 + ((i * 53) % 600)}ms"></span>`)
                .join("")}</div>`
            : ""
        }
        <div class="bm-np-meta">
          <div class="bm-np-titlerow"><div class="bm-np-title">${escHtml(t.name)}</div>${bmHeart(t.uri, "bm-np-heart")}</div>
          ${t.artistId ? `<button type="button" class="bm-np-artist bm-np-link" data-bm-artist="${escHtml(t.artistId)}">${escHtml(t.artists)}</button>` : `<div class="bm-np-artist">${escHtml(t.artists)}</div>`}
          ${t.albumId ? `<button type="button" class="bm-np-album bm-np-link" data-bm-album="${escHtml(t.albumId)}">${escHtml(t.album)}</button>` : `<div class="bm-np-album">${escHtml(t.album)}</div>`}
        </div>
        <div class="bm-np-seek">
          <input type="range" id="bm-seek" min="0" max="${dur}" value="${Math.floor(pos)}" step="1000" aria-label="Posición" />
          <div class="bm-np-times"><span id="bm-np-pos">${fmtMs(pos)}</span><span>${fmtMs(dur)}</span></div>
        </div>
        <div class="bm-np-ctrls">
          <button type="button" class="bm-ctrl ${s.shuffleState ? "is-on" : ""}" data-bm-shuffle aria-pressed="${s.shuffleState ? "true" : "false"}" aria-label="Aleatorio">${bmIcon("shuffle")}</button>
          <button type="button" class="bm-ctrl" data-bm-cmd="previous" aria-label="Anterior">${bmIcon("prev")}</button>
          <button type="button" class="bm-ctrl bm-ctrl-big" data-bm-cmd="${s.playing ? "pause" : "play"}" aria-label="${s.playing ? "Pausar" : "Reproducir"}">${bmIcon(s.playing ? "pause" : "play")}</button>
          <button type="button" class="bm-ctrl" data-bm-cmd="next" aria-label="Siguiente">${bmIcon("next")}</button>
          <button type="button" class="bm-ctrl ${s.repeatState && s.repeatState !== "off" ? "is-on" : ""}" data-bm-repeat aria-label="Repetir: ${s.repeatState === "track" ? "canción" : s.repeatState === "context" ? "lista" : "no"}">${bmIcon(s.repeatState === "track" ? "repeatOne" : "repeat")}</button>
        </div>
        <div class="bm-np-vol"><span>🔈</span><input type="range" id="bm-volume" min="0" max="100" value="${Number(s.volume) || 0}" aria-label="Volumen" /><span>🔊</span></div>
        <div class="bm-np-extra"><button type="button" class="bm-btn-ghost bm-btn-icon" data-bm-addpl="${escHtml(t.uri)}">${bmIcon("playlistAdd")}<span>Playlist</span></button><button type="button" class="bm-btn-ghost bm-btn-icon" data-bm-queue-open>${bmIcon("queue")}<span>Cola</span></button><button type="button" class="bm-btn-ghost bm-btn-icon" data-bm-ambient>${bmIcon("ambient")}<span>Ambiente</span></button></div>
      </div>`;
  }

  // ---- Biblioteca: Me gusta / Seguir / Guardar (KAN-399) ----
  // Una consulta por elemento (no en cada sondeo): el resultado se guarda en
  // bm.likes y solo cambia cuando el usuario pulsa el botón.
  const BM_LIKE_TEXT = {
    track: ["Me gusta", "Te gusta"],
    artist: ["Seguir", "Siguiendo"],
    album: ["Guardar", "Guardado"],
  };

  function bmLikeButton(uri, kind) {
    if (!uri) return "";
    const on = bm.likes[uri] === true;
    const known = uri in bm.likes;
    const [off, yes] = BM_LIKE_TEXT[kind] || BM_LIKE_TEXT.track;
    if (!known) bmCheckLikes([uri]);
    return `<button type="button" class="bm-btn-ghost bm-btn-icon bm-like ${on ? "is-on" : ""}" data-bm-like="${escHtml(uri)}" data-bm-like-kind="${kind}" aria-pressed="${on}" ${known ? "" : "disabled"}>${bmIcon(kind === "track" ? (on ? "heartFill" : "heart") : on ? "heartFill" : "plus")}<span>${on ? yes : off}</span></button>`;
  }

  async function bmCheckLikes(uris) {
    // Tras un fallo no se reintenta durante 60 s (evita un bucle render->consulta).
    const need = uris.filter((u) => u && !(u in bm.likes) && !bm.likeBusy[u] && !(bm.likeBusy["fail:" + u] > Date.now() - 60000));
    if (!need.length) return;
    need.forEach((u) => (bm.likeBusy[u] = true));
    try {
      const r = await api(`/api/spotify/library/contains?uris=${encodeURIComponent(need.join(","))}`);
      Object.assign(bm.likes, (r && r.saved) || {});
    } catch {
      /* sin dato: el botón queda deshabilitado, no se inventa el estado */
      need.forEach((u) => (bm.likeBusy["fail:" + u] = Date.now()));
    } finally {
      need.forEach((u) => delete bm.likeBusy[u]);
    }
    bmRenderLikeButtons();
    bmSyncHearts();
  }

  function bmRenderLikeButtons() {
    document.querySelectorAll("#bmomusic-panel [data-bm-like]").forEach((btn) => {
      const tmp = document.createElement("div");
      tmp.innerHTML = bmLikeButton(btn.dataset.bmLike, btn.dataset.bmLikeKind);
      if (tmp.firstElementChild) btn.replaceWith(tmp.firstElementChild);
    });
  }

  async function bmToggleLike(uri, kind) {
    if (!(uri in bm.likes)) return;
    const want = !bm.likes[uri];
    try {
      await api("/api/spotify/library", { method: "POST", body: JSON.stringify({ uri, saved: want }) });
      bm.likes[uri] = want;
      if (kind === "track") bm.savedSyncedAt = Date.now();
      if (kind === "track" && bm.saved) {
        if (want) {
          const t = bm.trackIndex[uri];
          if (t && !bm.saved.some((x) => x.uri === uri)) bm.saved.unshift(t);
          bm.savedTotal += 1;
        } else {
          bm.saved = bm.saved.filter((x) => x.uri !== uri);
          bm.savedTotal = Math.max(0, bm.savedTotal - 1);
        }
        if (bm.view === "library" && bm.libTab === "saved") bmFillLibrary();
      }
      const msg = {
        track: want ? "Añadida a tus Me gusta" : "Quitada de tus Me gusta",
        artist: want ? "Ahora sigues a este artista" : "Has dejado de seguirlo",
        album: want ? "Álbum guardado en tu biblioteca" : "Álbum quitado de tu biblioteca",
      };
      toast(msg[kind] || msg.track);
    } catch (err) {
      toast(`BMO Music: ${err.message}`);
    }
    bmRenderLikeButtons();
    bmSyncHearts();
  }

  // ---- Añadir a playlist (solo playlists propias o colaborativas) ----
  function bmRenderPlaylistSheet(sheet) {
    sheet.setAttribute("aria-label", "Añadir a playlist");
    let body;
    if (!bm.playlists) body = bm.libError ? bmErrorBox(bm.libError) : bmSkeletonRows(5);
    else {
      const own = bm.playlists.filter((p) => p.owned);
      body = own.length
        ? `<div class="bm-rows">${own
            .map(
              (p) => `<button type="button" class="bm-row" data-bm-addto="${escHtml(p.id)}">${bmImg(p.image, "bm-row-img", p.name)}<span class="bm-row-text"><span class="bm-row-title">${escHtml(p.name)}</span><span class="bm-row-sub">${p.tracksTotal || 0} canciones</span></span>${bmIcon("plus")}</button>`
            )
            .join("")}</div>`
        : `<p class="bm-empty">No tienes playlists propias. Crea una en Spotify y aparecerá aquí.</p>`;
    }
    sheet.innerHTML = `<div class="bm-sheet-backdrop" data-bm-close-sheet></div>
      <div class="bm-sheet-card">
        <div class="bm-sheet-head"><h2 class="bm-h2">Añadir a playlist</h2><button type="button" class="bm-np-close" data-bm-close-sheet aria-label="Cerrar">${bmIcon("down")}</button></div>
        ${body}
      </div>`;
  }

  function bmOpenPlaylistSheet(uri) {
    const sheet = bmEl("bm-devsheet");
    if (!sheet || !uri) return;
    bm.addUri = uri;
    bm.sheet = "playlists";
    sheet.hidden = false;
    bmRenderDevSheet();
    if (!bm.playlists) {
      bm.libError = "";
      bmLoadPlaylists().then(() => {
        if (bm.sheet === "playlists") bmRenderDevSheet();
      });
    }
  }

  async function bmAddToPlaylist(playlistId) {
    const uri = bm.addUri;
    if (!uri) return;
    try {
      await api(`/api/spotify/playlist/${encodeURIComponent(playlistId)}/items`, { method: "POST", body: JSON.stringify({ uri }) });
      const p = (bm.playlists || []).find((x) => x.id === playlistId);
      if (p) p.tracksTotal = (p.tracksTotal || 0) + 1;
      toast(`Añadida a «${p ? p.name : "tu playlist"}»`);
      bmCloseDevSheet();
    } catch (err) {
      toast(`BMO Music: ${err.message}`);
    }
  }

  async function bmRefresh() {
    const wasConnected = Boolean(bm.status && bm.status.connected);
    const hadStatus = Boolean(bm.status);
    try {
      const s = await api("/api/spotify/status");
      // Justo después de una orden (aleatorio, repetir, volumen...) Spotify
      // puede devolver la posición a 0 un instante aunque la canción siga
      // sonando (visto en vivo con el Echo). Si es la misma canción y la orden
      // no movía la posición, se ignora ese salto hacia atrás.
      const prev = bm.status;
      const sinceCmd = Date.now() - (bm.lastCmdAt || 0);
      const movesPosition = ["seek", "previous", "next", "play-context"].includes(bm.lastCmd);
      if (prev && prev.track && s && s.track && prev.track.uri === s.track.uri && sinceCmd < 8000 && !movesPosition) {
        const expected = bmProgress();
        if (Number(s.progressMs || 0) + 3000 < expected) s.progressMs = expected;
      }
      bm.status = s;
      bm.syncedAt = Date.now();
      if (s && s.track && s.track.uri) {
        bm.trackIndex[s.track.uri] = s.track;
        if (!(s.track.uri in bm.likes)) bmCheckLikes([s.track.uri]);
      }
      state.spotify = s;
    } catch (err) {
      bm.status = { connected: false, configured: true, error: err.message };
    }
    bmRenderChrome();
    const panel = bmEl("bmomusic-panel");
    if (!panel || panel.hidden) return;
    const changed = !hadStatus || wasConnected !== Boolean(bm.status.connected);
    if (changed || bm.view === "devices") bmRenderView();
    else if (bm.view === "home") bmRenderHero();
    bmRenderNowPlaying();
    bmRenderDevSheet();
    if (bm.ambient) bmRenderAmbient();
    const favView = bmEl("bm-view");
    if (bm.view === "library" && bm.libTab === "saved" && !bm.libFilter && favView && favView.scrollTop < 40) {
      bmRefreshSaved(60000).then((changed) => {
        if (changed && bm.view === "library" && bm.libTab === "saved") bmFillLibrary();
      });
    }
  }

  // onOk: aplica el estado confirmado por el backend (la orden ya devolvió
  // éxito) mientras /me/player de Spotify tarda en reflejarlo; el siguiente
  // sondeo real lo vuelve a sincronizar.
  async function bmCmd(path, body, onOk) {
    if (bm.busy) return;
    bm.busy = true;
    bm.lastCmd = path;
    bm.lastCmdAt = Date.now();
    try {
      await api(`/api/spotify/${path}`, { method: "POST", body: JSON.stringify(body || {}) });
      await bmRefresh();
      if (onOk && bm.status) {
        onOk();
        bmRenderChrome();
        if (bm.view === "home") bmRenderHero();
        bmRenderNowPlaying();
      }
    } catch (err) {
      toast(`BMO Music: ${err.message}`);
    } finally {
      bm.busy = false;
    }
  }

  async function bmTransfer(deviceId) {
    if (bm.transferring) return;
    const d = ((bm.status && bm.status.devices) || []).find((x) => x.id === deviceId);
    bm.transferring = deviceId;
    bm.devError = "";
    bmRenderDevSheet();
    if (bm.view === "devices") bmRenderView();
    try {
      // El backend ya comprueba que el destino suena de verdad (y si no,
      // devuelve la música al origen), así que aquí basta con una lectura.
      await api("/api/spotify/device", { method: "POST", body: JSON.stringify({ deviceId }) });
      await bmRefresh();
      toast(`Música en ${d ? d.name : "el dispositivo elegido"}`);
      bmCloseDevSheet();
    } catch (err) {
      bm.devError = err.message;
      toast(`BMO Music: ${err.message}`);
      await bmRefresh();
    } finally {
      bm.transferring = null;
      bmRenderDevSheet();
      bmRenderView();
    }
  }

  function bmAmbientClock() {
    return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function bmVisHtml(n) {
    return `<div class="bm-vis" aria-hidden="true">${Array.from({ length: n })
      .map((_, i) => `<span style="animation-delay:${(i * 137) % 900}ms;animation-duration:${700 + ((i * 53) % 600)}ms"></span>`)
      .join("")}</div>`;
  }

  function bmRenderAmbient() {
    const el = bmEl("bm-ambient");
    if (!el || el.hidden) return;
    const s = bm.status || {};
    const t = s.track;
    if (!t) {
      el.innerHTML = `<div class="bm-amb-inner"><div class="bm-amb-clock" id="bm-amb-clock">${bmAmbientClock()}</div><div class="bm-amb-artist">Nada sonando</div><div class="bm-amb-hint">Toca para volver</div></div>`;
      return;
    }
    el.innerHTML = `<div class="bm-np-bg" style="${bmBg(t.image)}"></div>
      <div class="bm-amb-inner ${s.playing ? "is-playing" : ""}">
        <div class="bm-amb-clock" id="bm-amb-clock">${bmAmbientClock()}</div>
        ${bmImg(t.image, "bm-amb-cover", t.album)}
        <div class="bm-amb-title">${escHtml(t.name)}</div>
        <div class="bm-amb-artist">${escHtml(t.artists)}${s.device ? ` · ${escHtml(s.device.name)}` : ""}</div>
        ${bmStore(BM_VIS_KEY, true) ? bmVisHtml(32) : ""}
        <div class="bm-amb-hint">Toca para volver</div>
      </div>`;
  }

  function bmEnterAmbient() {
    const panel = bmEl("bmomusic-panel");
    if (!panel) return;
    let el = bmEl("bm-ambient");
    if (!el) {
      el = document.createElement("div");
      el.id = "bm-ambient";
      el.className = "bm-ambient";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "Modo ambiente");
      panel.querySelector(".bm-app").appendChild(el);
    }
    bmCloseDevSheet();
    bm.ambient = true;
    el.hidden = false;
    // Pantalla completa de verdad: tapa también la barra inferior de BMO OS.
    document.body.classList.add("bm-ambient-on");
    bmRenderAmbient();
  }

  function bmExitAmbient() {
    bm.ambient = false;
    bm.lastTouch = Date.now();
    document.body.classList.remove("bm-ambient-on");
    const el = bmEl("bm-ambient");
    if (el) el.hidden = true;
  }

  function bmTick() {
    const s = bm.status;
    if (bm.ambient) {
      const clock = bmEl("bm-amb-clock");
      if (clock) clock.textContent = bmAmbientClock();
    } else if (s && s.playing && Date.now() - bm.lastTouch > BM_AMBIENT_IDLE_MS) {
      bmEnterAmbient();
    }
    if (!s || !s.track) return;
    const dur = Number(s.track.durationMs) || 0;
    const pos = bmProgress();
    const fill = bmEl("bm-mini-fill");
    if (fill && dur) fill.style.width = `${(pos / dur) * 100}%`;
    const seek = bmEl("bm-seek");
    if (seek && document.activeElement !== seek) seek.value = String(Math.floor(pos));
    const label = bmEl("bm-np-pos");
    if (label) label.textContent = fmtMs(pos);
    if (s.playing && dur && pos >= dur && Date.now() - bm.lastEndRefresh > 5000) {
      bm.lastEndRefresh = Date.now();
      bmRefresh();
    }
  }

  function bmStopTimers() {
    clearInterval(bm.timer);
    clearInterval(bm.tick);
    bm.timer = null;
    bm.tick = null;
  }

  async function openBmoMusic() {
    const panel = bmEl("bmomusic-panel");
    if (!panel) {
      toast("BMO Music no cargado — recarga la página");
      return;
    }
    closeSysHub();
    closeDevicesPanel();
    closeDockerPanel();
    closePerfPanel();
    closeMonitorPanel();
    closeAlertsPanel();
    closeEventsPanel();
    closeConfigPanel();
    setAppNav("servicios", { keepPanels: true });
    panel.hidden = false;
    bm.lastTouch = Date.now();
    bmSetView(bm.view || "home");
    bmStopTimers();
    await bmRefresh();
    bm.timer = setInterval(bmRefresh, 8000);
    bm.tick = setInterval(bmTick, 1000);
  }

  function closeBmoMusic() {
    if (bm) {
      bmStopTimers();
      bmExitAmbient();
    }
    const panel = bmEl("bmomusic-panel");
    if (panel) panel.hidden = true;
    const np = bmEl("bm-np");
    if (np) np.hidden = true;
    bmCloseDevSheet();
  }

  // KAN-398 (F5): ¿puede este navegador reproducir Spotify (Widevine/EME)?
  // Se comprueba una vez por carga y se informa al servidor; decide si BMO
  // puede registrarse como dispositivo "BMO Music Player".
  async function bmProbeWidevine() {
    let widevine = false;
    let error = null;
    try {
      if (!navigator.requestMediaKeySystemAccess) throw new Error("EME no disponible");
      await navigator.requestMediaKeySystemAccess("com.widevine.alpha", [
        {
          initDataTypes: ["cenc"],
          audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
        },
      ]);
      widevine = true;
    } catch (err) {
      error = (err && (err.name || err.message)) || String(err);
    }
    bm.widevine = widevine;
    try {
      await api("/api/spotify/player/capability", { method: "POST", body: JSON.stringify({ widevine, error }) });
    } catch {
      /* diagnóstico opcional */
    }
    return widevine;
  }
  setTimeout(bmProbeWidevine, 4000);

  (function bindBmoMusic() {
    const panel = bmEl("bmomusic-panel");
    if (!panel) return;
    panel.addEventListener("click", (e) => {
      if (e.target.closest("#bm-ambient")) return bmExitAmbient();
      if (e.target.classList && e.target.classList.contains("bm-sheet-backdrop")) return bmCloseDevSheet();
      const pinBtn = e.target.closest("[data-bm-pin]");
      if (pinBtn && panel.contains(pinBtn)) {
        e.stopPropagation();
        const on = bmTogglePin(pinBtn.dataset.bmPin);
        toast(on ? "Fijada arriba" : "Ya no está fijada");
        if (bm.view === "library") bmFillLibrary();
        else if (bm.view === "home") {
          const grid = bmEl("bm-home-playlists");
          if (grid && bm.playlists) grid.innerHTML = bmPlaylistCards(bmOrderPinned(bm.playlists).slice(0, 8));
        }
        return;
      }
      const heart = e.target.closest("[data-bm-heart]");
      if (heart && panel.contains(heart)) {
        e.stopPropagation();
        if (!heart.classList.contains("is-unknown")) bmToggleLike(heart.dataset.bmHeart, "track");
        return;
      }
      const qAdd = e.target.closest("[data-bm-queue-add]");
      if (qAdd && panel.contains(qAdd)) {
        e.stopPropagation();
        return bmAddToQueue(qAdd.dataset.bmQueueAdd);
      }
      const quick = e.target.closest("[data-bm-quick-play]");
      if (quick && panel.contains(quick)) {
        e.stopPropagation();
        return bmCmd("play-context", { contextUri: quick.dataset.bmQuickPlay }, () => toast("¡Tu música está preparada!"));
      }
      const btn = e.target.closest("button");
      if (!btn || !panel.contains(btn)) return;
      const d = btn.dataset;
      if (btn.id === "bmomusic-back") {
        closeBmoMusic();
        setAppNav("servicios");
        return;
      }
      if (d.bmLibTab) {
        if (bm.libTab !== d.bmLibTab) bm.libFilter = "";
        bm.libTab = d.bmLibTab;
        if (!d.bmView) {
          bmRenderView();
          return;
        }
      }
      if (d.bmView) return bmSetView(d.bmView);
      if (d.bmCmd) return bmCmd(d.bmCmd);
      if ("bmOpenNp" in d) {
        const np = bmEl("bm-np");
        np.hidden = false;
        bmRenderNowPlaying();
        return;
      }
      if ("bmCloseNp" in d) {
        bmEl("bm-np").hidden = true;
        return;
      }
      if (d.bmPlayContext) {
        return bmCmd("play-context", { contextUri: d.bmPlayContext }, () => toast("¡Tu música está preparada!"));
      }
      if (d.bmPlayTrack) {
        const [key, idx] = d.bmPlayTrack.split(":");
        const uris = (bm.lists[key] || []).slice(Number(idx), Number(idx) + 50);
        // "Tus me gusta": el backend la lanza dentro de esa lista (sigue con tus me gusta).
        if (uris.length) return bmCmd("play-context", key === "saved" ? { uris, collection: true } : { uris });
        return;
      }
      if (d.bmDevice) return bmTransfer(d.bmDevice);
      if ("bmDevsheet" in d) return bmOpenDevSheet();
      if ("bmQueueOpen" in d) return bmOpenQueue();
      if ("bmAmbient" in d) return bmEnterAmbient();
      if ("bmSavedMore" in d) return bmLoadMoreSaved().then((ok) => ok && bmFillLibrary());
      if ("bmSavedAll" in d) return bmLoadAllSaved();
      if (d.bmLike) return bmToggleLike(d.bmLike, d.bmLikeKind || "track");
      if (d.bmAddpl) return bmOpenPlaylistSheet(d.bmAddpl);
      if (d.bmAddto) return bmAddToPlaylist(d.bmAddto);
      if (d.bmArtist) return bmOpenPage("artist", d.bmArtist);
      if (d.bmAlbum) return bmOpenPage("album", d.bmAlbum);
      if ("bmPageBack" in d) return bmPageBack();
      if ("bmCloseSheet" in d) return bmCloseDevSheet();
      if ("bmShuffle" in d) {
        const want = !(bm.status && bm.status.shuffleState);
        return bmCmd("shuffle", { state: want }, () => {
          bm.status.shuffleState = want;
          toast(want ? "Aleatorio activado" : "Aleatorio desactivado");
        });
      }
      if ("bmRepeat" in d) {
        const order = ["off", "context", "track"];
        const labels = { off: "Repetir desactivado", context: "Repetir lista", track: "Repetir canción" };
        const cur = (bm.status && bm.status.repeatState) || "off";
        const want = order[(order.indexOf(cur) + 1) % order.length];
        return bmCmd("repeat", { state: want }, () => {
          bm.status.repeatState = want;
          toast(labels[want]);
        });
      }
      if ("bmConnect" in d) return connectSpotify();
      if (d.bmHistory) {
        bm.searchQ = d.bmHistory;
        const input = bmEl("bm-search-input");
        if (input) input.value = d.bmHistory;
        return bmDoSearch(d.bmHistory);
      }
      if ("bmSearchClear" in d) {
        bm.searchQ = "";
        bm.searchRes = null;
        const input = bmEl("bm-search-input");
        if (input) {
          input.value = "";
          input.focus();
        }
        bmRenderSearchBody();
        return;
      }
      if ("bmVisToggle" in d) {
        bmSave(BM_VIS_KEY, !bmStore(BM_VIS_KEY, true));
        bmRenderNowPlaying();
      }
    });
    panel.addEventListener("input", (e) => {
      if (e.target.id === "bm-search-input") bmSearchInput(e.target.value);
      else if (e.target.id === "bm-lib-filter") {
        bm.libFilter = e.target.value;
        bmFillLibrary();
      }
    });
    // Favoritos: al acercarse al final de la lista se carga la siguiente
    // página (una cada vez; bmLoadMoreSaved ignora llamadas mientras carga).
    const bmView = bmEl("bm-view");
    if (bmView) {
      bmView.addEventListener("scroll", () => {
        if (bm.view !== "library" || bm.libTab !== "saved" || bm.savedAll || bm.savedNext == null) return;
        if (bmView.scrollTop + bmView.clientHeight < bmView.scrollHeight - 400) return;
        const keep = bmView.scrollTop;
        bmLoadMoreSaved().then((ok) => {
          if (!ok) return;
          bmFillLibrary();
          bmView.scrollTop = keep; // no saltar arriba al repintar
        });
      }, { passive: true });
    }
    // Cualquier toque reinicia la cuenta atrás del modo ambiente.
    panel.addEventListener("pointerdown", () => {
      bm.lastTouch = Date.now();
    });
    // F9: con la pantalla oculta no se sondea Spotify.
    document.addEventListener("visibilitychange", () => {
      const p = bmEl("bmomusic-panel");
      if (!p || p.hidden) return;
      if (document.hidden) bmStopTimers();
      else if (!bm.timer) {
        bmRefresh();
        bm.timer = setInterval(bmRefresh, 8000);
        bm.tick = setInterval(bmTick, 1000);
      }
    });
    panel.addEventListener("change", (e) => {
      if (e.target.id === "bm-seek") {
        const value = Number(e.target.value);
        e.target.blur();
        bmCmd("seek", { positionMs: value });
      } else if (e.target.id === "bm-lib-sort") {
        bmLibSortState()[bm.libTab] = e.target.value;
        bmSave(BM_SORT_KEY, bm.libSort);
        bmFillLibrary();
      } else if (e.target.id === "bm-volume") {
        const value = Number(e.target.value);
        e.target.blur();
        bmCmd("volume", { volume: value });
      }
    });
  })();

  function escHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stopDockerPolling() {
    if (state.dockerTimer) {
      clearInterval(state.dockerTimer);
      state.dockerTimer = null;
    }
  }

  function closeDockerPanel() {
    stopDockerPolling();
    stopDockerLogsPolling();
    destroyComposeEditor();
    destroyDockerTerminal();
    if (els.dockerPanel) els.dockerPanel.hidden = true;
    state.dockerView = "list";
    state.dockerFocusId = null;
    state.dockerStackFocusId = null;
    state.dockerStackStatus = null;
    state.dockerHistory = [];
  }

  function normalizeDockerTab(tab) {
    const t = String(tab || "containers");
    if (t === "stacks") return "compose";
    const ok = [
      "containers",
      "images",
      "volumes",
      "networks",
      "compose",
      "hub",
      "backup",
      "updates",
      "security",
    ];
    return ok.includes(t) ? t : "containers";
  }

  function setDockerTab(tab) {
    stopDockerLogsPolling();
    destroyComposeEditor();
    state.dockerTab = normalizeDockerTab(tab);
    state.dockerView = "list";
    state.dockerFocusId = null;
    state.dockerStackFocusId = null;
    state.dockerHistory = [];
    destroyDockerTerminal();
    document.querySelectorAll("[data-docker-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.dockerTab === state.dockerTab);
    });
    refreshCurrentDockerTab()
      .then(() => renderDockerBody())
      .catch((err) => toast(err.message || "Error Docker"));
  }

  async function refreshCurrentDockerTab() {
    const tab = state.dockerTab;
    if (tab === "compose") return refreshDockerStacks();
    if (tab === "hub") return; // búsqueda bajo demanda
    if (tab === "backup") return refreshDockerBackups();
    if (tab === "updates") return refreshDockerUpdates();
    if (tab === "security") return refreshDockerSecurity();
    if (tab === "images") return refreshDockerImages();
    if (tab === "volumes") return refreshDockerVolumes();
    if (tab === "networks") return refreshDockerNetworks();
    return refreshDockerContainers();
  }

  async function refreshDockerBackups() {
    const data = await api("/api/docker/backups");
    state.dockerBackups = data.backups || [];
    state.dockerBackupSchedule = data.schedule || null;
  }

  function formatBytes(n) {
    const v = Number(n) || 0;
    if (v < 1024) return `${v} B`;
    if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
    if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB`;
    return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function includesChecks(inc) {
    if (!inc) return "—";
    const bits = [];
    if (inc.compose) bits.push("Compose ✓");
    if (inc.plugins) bits.push("Plugins ✓");
    if (inc.config) bits.push("Config ✓");
    if (inc.volumes) bits.push("Volúmenes ✓");
    else bits.push("Volúmenes ✗");
    if (inc.system) bits.push("System ✓");
    return bits.join(" · ");
  }

  function renderBackupPanel() {
    const list = state.dockerBackups || [];
    const latest = list[0] || null;
    const sch = state.dockerBackupSchedule || {};
    const busy = state.dockerBackupBusy;
    const opts = state.dockerBackupCreateOpts || {};
    const preview = state.dockerBackupPreview;

    const previewHtml = preview
      ? `
      <div class="docker-backup-preview">
        <h4>Vista previa restore</h4>
        <p class="docker-meta">${escHtml(preview.message || "Preview")}</p>
        <div class="docker-meta">
          Stacks: <strong>${escHtml((preview.willTouch?.stacks || []).join(", ") || "(ninguno)")}</strong><br/>
          Plugins: <strong>${escHtml((preview.willTouch?.plugins || []).join(", ") || "(ninguno)")}</strong><br/>
          Volúmenes: <strong>${escHtml((preview.willTouch?.volumes || []).join(", ") || "(ninguno)")}</strong><br/>
          Config: <strong>${preview.willTouch?.config ? "sí" : "no"}</strong>
        </div>
        <div class="docker-meta">
          Sobrescribe stacks: ${escHtml((preview.overwriteStacks || []).join(", ") || "—")}<br/>
          Nuevos stacks: ${escHtml((preview.newStacks || []).join(", ") || "—")}
        </div>
        <ul class="docker-backup-warn">
          ${(preview.warnings || []).map((w) => `<li>${escHtml(w)}</li>`).join("")}
        </ul>
        <div class="docker-actions">
          <button type="button" class="dk-btn danger" data-bak-apply ${busy ? "disabled" : ""}>
            Confirmar restore
          </button>
          <button type="button" class="dk-btn ghost" data-bak-preview-close>Cerrar preview</button>
        </div>
      </div>`
      : "";

    const rows = list.length
      ? list
          .map((b) => {
            return `
              <div class="docker-row" data-bak-id="${escHtml(b.id)}">
                <div class="docker-row-top">
                  <h3>${escHtml(b.id)}</h3>
                  <span class="docker-badge">${escHtml(formatBytes(b.sizeBytes))}</span>
                </div>
                <div class="docker-meta">
                  ${escHtml(b.date || b.mtime || "")}
                  ${b.label ? ` · ${escHtml(b.label)}` : ""}
                  ${b.hostname ? ` · ${escHtml(b.hostname)}` : ""}
                </div>
                <div class="docker-meta">${escHtml(includesChecks(b.includes))}</div>
                <div class="docker-actions">
                  <button type="button" class="dk-btn ghost" data-bact="detail">Detalle</button>
                  <button type="button" class="dk-btn" data-bact="preview">Restaurar…</button>
                  <button type="button" class="dk-btn danger" data-bact="delete">Eliminar</button>
                </div>
              </div>`;
          })
          .join("")
      : `<p class="docker-meta">No hay backups todavía. Crea uno (por defecto sin volúmenes grandes).</p>`;

    els.dockerBody.innerHTML = `
      <div class="docker-summary">
        <span>Backups: <strong>${list.length}</strong></span>
        <span>Dir: <strong>/home/bmo/backups</strong></span>
        ${
          latest
            ? `<span>Último: <strong>${escHtml(latest.id)}</strong> (${escHtml(formatBytes(latest.sizeBytes))})</span>`
            : `<span>Último: <strong>—</strong></span>`
        }
      </div>

      <div class="docker-backup-create">
        <h3 style="margin:0;font-size:14px">Crear backup</h3>
        <div class="docker-backup-opts">
          <label class="docker-check">
            <input type="checkbox" id="bak-inc-plugins" ${opts.includePlugins !== false ? "checked" : ""}/>
            Incluir plugins
          </label>
          <label class="docker-check">
            <input type="checkbox" id="bak-inc-vols" ${opts.includeVolumes ? "checked" : ""}/>
            Incluir volúmenes (puede ser grande)
          </label>
          <label class="docker-backup-label">
            Etiqueta
            <input type="text" id="bak-label" placeholder="opcional" value="${escHtml(opts.label || "")}" maxlength="40"/>
          </label>
        </div>
        <div class="docker-actions">
          <button type="button" class="dk-btn" data-bak-create ${busy ? "disabled" : ""}>
            ${busy ? "Creando…" : "Crear backup"}
          </button>
          <button type="button" class="dk-btn ghost" data-bak-refresh ${busy ? "disabled" : ""}>Actualizar</button>
        </div>
      </div>

      <div class="docker-backup-schedule">
        <h3 style="margin:0;font-size:14px">Programar</h3>
        <p class="docker-meta">${escHtml(sch.note || "MVP: guarda preferencia (cron real próximamente).")}</p>
        <div class="docker-actions">
          <select id="bak-interval">
            <option value="off" ${sch.interval === "off" || !sch.interval ? "selected" : ""}>Off</option>
            <option value="daily" ${sch.interval === "daily" ? "selected" : ""}>Diario</option>
            <option value="weekly" ${sch.interval === "weekly" ? "selected" : ""}>Semanal</option>
          </select>
          <label class="docker-check">
            <input type="checkbox" id="bak-sch-enabled" ${sch.enabled ? "checked" : ""}/>
            Activar preferencia
          </label>
          <button type="button" class="dk-btn ghost" data-bak-schedule-save>Guardar</button>
        </div>
      </div>

      ${previewHtml}

      <div class="docker-backup-list">
        <h3 style="margin:0;font-size:14px">Lista</h3>
        ${rows}
      </div>`;

    els.dockerBody.querySelector("[data-bak-create]")?.addEventListener("click", async () => {
      const includePlugins = !!els.dockerBody.querySelector("#bak-inc-plugins")?.checked;
      const includeVolumes = !!els.dockerBody.querySelector("#bak-inc-vols")?.checked;
      const label = String(els.dockerBody.querySelector("#bak-label")?.value || "").trim();
      state.dockerBackupCreateOpts = { includePlugins, includeVolumes, label };
      state.dockerBackupBusy = true;
      renderBackupPanel();
      try {
        const created = await api("/api/docker/backups/create", {
          method: "POST",
          body: JSON.stringify({ includePlugins, includeVolumes, label }),
        });
        toast("Creando backup… (mira Sistema → Tareas para ver el progreso)");
        const finalTask = await waitForTask(created.taskId);
        if (finalTask.status === "done") {
          toast(`Backup OK: ${finalTask.detail || "completado"}`);
        } else {
          toast(finalTask.detail || "Error creando backup");
        }
        await refreshDockerBackups();
      } catch (err) {
        toast(err.message || "Error creando backup");
      } finally {
        state.dockerBackupBusy = false;
        renderBackupPanel();
      }
    });

    els.dockerBody.querySelector("[data-bak-refresh]")?.addEventListener("click", () => {
      refreshDockerBackups()
        .then(() => renderBackupPanel())
        .catch((err) => toast(err.message || "Error"));
    });

    els.dockerBody.querySelector("[data-bak-schedule-save]")?.addEventListener("click", async () => {
      try {
        const interval = els.dockerBody.querySelector("#bak-interval")?.value || "off";
        const enabled = !!els.dockerBody.querySelector("#bak-sch-enabled")?.checked;
        const data = await api("/api/docker/backups/schedule", {
          method: "PUT",
          body: JSON.stringify({ interval, enabled }),
        });
        state.dockerBackupSchedule = data.schedule || null;
        toast("Programación guardada (MVP)");
        renderBackupPanel();
      } catch (err) {
        toast(err.message || "Error guardando programación");
      }
    });

    els.dockerBody.querySelector("[data-bak-preview-close]")?.addEventListener("click", () => {
      state.dockerBackupPreview = null;
      renderBackupPanel();
    });

    els.dockerBody.querySelector("[data-bak-apply]")?.addEventListener("click", async () => {
      const id = state.dockerBackupPreview?._id;
      if (!id) return;
      if (
        !confirm(
          `¿Restaurar backup ${id}?\nEsto puede sobrescribir stacks/plugins/config. Portainer/homepage no se eliminan.`
        )
      ) {
        return;
      }
      state.dockerBackupBusy = true;
      renderBackupPanel();
      try {
        toast("Restaurando…");
        const result = await api(
          `/api/docker/backups/${encodeURIComponent(id)}/restore`,
          {
            method: "POST",
            body: JSON.stringify({ confirm: true, preview: false, includeVolumes: false }),
          }
        );
        toast(
          result.ok
            ? `Restore OK (errores: ${(result.errors || []).length})`
            : "Restore finalizado con avisos"
        );
        state.dockerBackupPreview = null;
        await refreshDockerBackups();
      } catch (err) {
        toast(err.message || "Error en restore");
      } finally {
        state.dockerBackupBusy = false;
        renderBackupPanel();
      }
    });

    els.dockerBody.querySelectorAll("[data-bak-id]").forEach((row) => {
      const id = row.dataset.bakId;
      row.querySelectorAll("[data-bact]").forEach((btn) => {
        btn.addEventListener("click", () => handleBackupAction(id, btn.dataset.bact));
      });
    });
  }

  async function handleBackupAction(id, act) {
    try {
      if (act === "detail") {
        const data = await api(`/api/docker/backups/${encodeURIComponent(id)}`);
        const meta = data.metadata || {};
        const inc = data.contents?.includes || meta.includes || {};
        alert(
          [
            `Backup: ${id}`,
            `Tamaño: ${formatBytes(data.sizeBytes)}`,
            `Fecha: ${meta.date || data.mtime || ""}`,
            `Host: ${meta.hostname || ""}`,
            `Docker: ${meta.docker || ""}`,
            `Stacks: ${(meta.stacks || []).join(", ") || "—"}`,
            `Plugins: ${(meta.plugins || []).join(", ") || "—"}`,
            `Volúmenes: ${(meta.volumes || []).join(", ") || "—"}`,
            `Incluye: ${includesChecks(inc)}`,
            `Entradas: ${data.contents?.entryCount ?? "—"}`,
          ].join("\n")
        );
        return;
      }
      if (act === "preview") {
        state.dockerBackupBusy = true;
        renderBackupPanel();
        try {
          const data = await api(
            `/api/docker/backups/${encodeURIComponent(id)}/restore`,
            {
              method: "POST",
              body: JSON.stringify({ preview: true, confirm: false }),
            }
          );
          state.dockerBackupPreview = { ...data, _id: id };
          toast("Preview listo — revisa cambios antes de confirmar");
        } finally {
          state.dockerBackupBusy = false;
          renderBackupPanel();
        }
        return;
      }
      if (act === "delete") {
        if (!(await askConfirm(`¿Eliminar backup ${id}?`))) return;
        await api(`/api/docker/backups/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        toast("Backup eliminado");
        state.dockerBackupPreview = null;
        await refreshDockerBackups();
        renderBackupPanel();
      }
    } catch (err) {
      state.dockerBackupBusy = false;
      toast(err.message || "Error backup");
      renderBackupPanel();
    }
  }



  async function refreshDockerSecurity() {
    const [sec, ev] = await Promise.all([
      api("/api/docker/security"),
      api("/api/docker/security/events?limit=40"),
    ]);
    state.dockerSecurity = sec;
    state.dockerSecurityEvents = ev.events || sec.recentEvents || [];
  }

  function renderSecurityPanel() {
    const busy = state.dockerSecurityBusy;
    const sec = state.dockerSecurity || {
      containers: [],
      openPorts: [],
      policy: { level: "normal" },
      critical: [],
      recentEvents: [],
    };
    const policy = sec.policy || { level: "normal", block: {}, warn: {} };
    const containers = sec.containers || [];
    const ports = sec.openPorts || [];
    const events = state.dockerSecurityEvents || sec.recentEvents || [];

    if (state.dockerSecurityView === "events") {
      const rows = events.length
        ? events
            .map((e) => {
              const cls =
                e.result === "blocked" || e.type === "critical_blocked"
                  ? "sec-block"
                  : e.result === "warn" || e.type === "policy_warn"
                    ? "sec-warn"
                    : "sec-ok";
              return `
                <div class="docker-row">
                  <div class="docker-row-top">
                    <h3 style="font-size:13px">${escHtml(e.type || e.action || "event")}</h3>
                    <span class="docker-badge ${cls}">${escHtml(e.result || "ok")}</span>
                  </div>
                  <div class="docker-meta">${escHtml(e.at || "")} · ${escHtml(e.target || "")}</div>
                  <div class="docker-sec-finding">${escHtml(e.message || "")}</div>
                </div>`;
            })
            .join("")
        : `<p class="docker-meta">Sin eventos todavía. Escanea o prueba stop/delete de un crítico.</p>`;

      els.dockerBody.innerHTML = `
        <div class="docker-sec-events">
          <div class="docker-actions">
            <button type="button" class="dk-btn ghost" data-sec-back>← Volver</button>
            <button type="button" class="dk-btn ghost" data-sec-ev-refresh ${busy ? "disabled" : ""}>Actualizar</button>
          </div>
          <h3 style="margin:0;font-size:14px">Auditoría reciente</h3>
          ${rows}
        </div>`;
      els.dockerBody.querySelector("[data-sec-back]")?.addEventListener("click", () => {
        state.dockerSecurityView = "overview";
        renderSecurityPanel();
      });
      els.dockerBody.querySelector("[data-sec-ev-refresh]")?.addEventListener("click", async () => {
        try {
          state.dockerSecurityBusy = true;
          const ev = await api("/api/docker/security/events?limit=40");
          state.dockerSecurityEvents = ev.events || [];
        } catch (err) {
          toast(err.message || "Error eventos");
        } finally {
          state.dockerSecurityBusy = false;
          renderSecurityPanel();
        }
      });
      return;
    }

    if (state.dockerSecurityView === "policy") {
      const level = policy.level || "normal";
      els.dockerBody.innerHTML = `
        <div class="docker-sec-policy">
          <div class="docker-actions">
            <button type="button" class="dk-btn ghost" data-sec-back>← Volver</button>
            <button type="button" class="dk-btn" data-sec-pol-save ${busy ? "disabled" : ""}>Guardar</button>
          </div>
          <h3 style="margin:0;font-size:14px">Política de seguridad</h3>
          <p class="docker-meta">low relaja · normal (default) · strict endurece (root/imagen/caps)</p>
          <label>Nivel
            <select id="sec-level">
              <option value="low" ${level === "low" ? "selected" : ""}>low</option>
              <option value="normal" ${level === "normal" ? "selected" : ""}>normal</option>
              <option value="strict" ${level === "strict" ? "selected" : ""}>strict</option>
            </select>
          </label>
          <div class="docker-backup-opts">
            <label class="docker-check"><input type="checkbox" id="sec-b-priv" ${policy.block?.privileged !== false ? "checked" : ""}/> Bloquear privileged</label>
            <label class="docker-check"><input type="checkbox" id="sec-b-host" ${policy.block?.hostNetwork !== false ? "checked" : ""}/> Bloquear host network</label>
            <label class="docker-check"><input type="checkbox" id="sec-b-sock" ${policy.block?.dockerSocket !== false ? "checked" : ""}/> Bloquear docker.sock</label>
            <label class="docker-check"><input type="checkbox" id="sec-w-root" ${policy.warn?.rootUser !== false ? "checked" : ""}/> Avisar root</label>
            <label class="docker-check"><input type="checkbox" id="sec-w-img" ${policy.warn?.unverifiedImage !== false ? "checked" : ""}/> Avisar imagen no oficial</label>
          </div>
          <div class="docker-meta">Críticos protegidos: <strong>${escHtml((sec.critical || []).join(", "))}</strong></div>
          <div class="docker-meta">Permisos: docker.read / docker.manage(≡write) / docker.host / docker.privileged</div>
        </div>`;
      els.dockerBody.querySelector("[data-sec-back]")?.addEventListener("click", () => {
        state.dockerSecurityView = "overview";
        renderSecurityPanel();
      });
      els.dockerBody.querySelector("[data-sec-pol-save]")?.addEventListener("click", async () => {
        try {
          state.dockerSecurityBusy = true;
          const body = {
            level: els.dockerBody.querySelector("#sec-level")?.value || "normal",
            block: {
              privileged: !!els.dockerBody.querySelector("#sec-b-priv")?.checked,
              hostNetwork: !!els.dockerBody.querySelector("#sec-b-host")?.checked,
              dockerSocket: !!els.dockerBody.querySelector("#sec-b-sock")?.checked,
            },
            warn: {
              rootUser: !!els.dockerBody.querySelector("#sec-w-root")?.checked,
              unverifiedImage: !!els.dockerBody.querySelector("#sec-w-img")?.checked,
            },
          };
          const data = await api("/api/docker/security/policy", {
            method: "PUT",
            body: JSON.stringify(body),
          });
          if (state.dockerSecurity) state.dockerSecurity.policy = data.policy;
          toast(`Política: ${data.policy?.level || body.level}`);
          state.dockerSecurityView = "overview";
          await refreshDockerSecurity();
          renderSecurityPanel();
        } catch (err) {
          toast(err.message || "Error guardando política");
        } finally {
          state.dockerSecurityBusy = false;
        }
      });
      return;
    }

    const scanRows = containers.length
      ? containers
          .map((c) => {
            const badges = (c.badges || [])
              .map((b) => {
                const cls = b.ok ? "sec-ok" : c.severity === "block" ? "sec-block" : "sec-warn";
                return `<span class="docker-badge ${cls}">${b.ok ? "✅" : "⚠"} ${escHtml(b.label)}</span>`;
              })
              .join("");
            const crit = c.critical
              ? `<span class="docker-badge sec-block">crítico</span>`
              : "";
            const privWarn = c.privileged && !c.privilegedAllowed
              ? `<div class="docker-sec-priv-warn">
                  Contenedor con privilegios elevados…
                  <div class="docker-actions" style="margin-top:8px">
                    <button type="button" class="dk-btn" data-sec-allow="${escHtml(c.name || c.id)}" data-sec-type="privileged">Permitir</button>
                    <button type="button" class="dk-btn ghost" data-sec-deny="${escHtml(c.name || c.id)}" data-sec-type="privileged">Bloquear</button>
                  </div>
                </div>`
              : "";
            const hostNetWarn = c.hostNetwork && !c.hostNetworkAllowed
              ? `<div class="docker-sec-priv-warn">
                  Usa network_mode: host…
                  <div class="docker-actions" style="margin-top:8px">
                    <button type="button" class="dk-btn" data-sec-allow="${escHtml(c.name || c.id)}" data-sec-type="hostNetwork">Permitir</button>
                    <button type="button" class="dk-btn ghost" data-sec-deny="${escHtml(c.name || c.id)}" data-sec-type="hostNetwork">Bloquear</button>
                  </div>
                </div>`
              : "";
            const findings = (c.findings || [])
              .slice(0, 4)
              .map((f) => {
                const sol = f.solution
                  ? ` <button type="button" class="dk-btn ghost" data-sec-sol="${escHtml(f.solution)}" style="font-size:11px;padding:2px 8px">Ver solución</button>`
                  : "";
                return `<div class="docker-sec-finding"><strong>${escHtml(f.severity)}</strong> ${escHtml(f.message)}${sol}</div>`;
              })
              .join("");
            return `
              <div class="docker-row" data-sec-id="${escHtml(c.id)}">
                <div class="docker-row-top">
                  <h3>${escHtml(c.name || c.id)}</h3>
                  ${crit}
                  <span class="docker-badge ${c.severity === "ok" ? "sec-ok" : c.severity === "block" ? "sec-block" : "sec-warn"}">${escHtml(c.severity || "?")}</span>
                </div>
                <div class="docker-sec-badges">${badges || `<span class="docker-meta">${escHtml(c.image || "")}</span>`}</div>
                ${findings}
                ${privWarn}
                ${hostNetWarn}
              </div>`;
          })
          .join("")
      : `<p class="docker-meta">Sin contenedores. Pulsa Escanear.</p>`;

    const portRows = ports.length
      ? ports
          .map((p) => {
            const warn = p.warning || p.exposure === "exposed";
            return `<div class="docker-row">
              <div class="docker-row-top">
                <h3 style="font-size:13px">${escHtml(p.service)}</h3>
                ${warn ? `<span class="docker-badge sec-block">⚠ expuesto</span>` : `<span class="docker-badge sec-ok">LAN/local</span>`}
              </div>
              <div class="docker-meta ${warn ? "sec-exposed" : ""}">${escHtml(String(p.hostIp || "0.0.0.0"))}:${escHtml(String(p.hostPort))} → ${escHtml(String(p.containerPort || ""))}</div>
            </div>`;
          })
          .join("")
      : `<p class="docker-meta">No hay puertos publicados.</p>`;

    const warnN = containers.filter((c) => c.severity === "warn").length;
    const blockN = containers.filter((c) => c.severity === "block").length;

    els.dockerBody.innerHTML = `
      <div class="docker-summary">
        <span>Nivel: <strong>${escHtml(policy.level || "normal")}</strong></span>
        <span>Warn: <strong>${warnN}</strong></span>
        <span>Block: <strong>${blockN}</strong></span>
        <span>Críticos: <strong>${escHtml((sec.critical || []).join(", ") || "—")}</strong></span>
      </div>
      <div class="docker-sec-toolbar">
        <div class="docker-actions">
          <button type="button" class="dk-btn" data-sec-scan ${busy ? "disabled" : ""}>Escanear</button>
          <button type="button" class="dk-btn ghost" data-sec-policy ${busy ? "disabled" : ""}>Política</button>
          <button type="button" class="dk-btn ghost" data-sec-events ${busy ? "disabled" : ""}>Auditoría</button>
        </div>
      </div>
      <div class="docker-sec-list">
        <h3 style="margin:0;font-size:14px">Contenedores</h3>
        ${scanRows}
      </div>
      <div class="docker-sec-ports">
        <h3 style="margin:0;font-size:14px">Puertos abiertos</h3>
        ${portRows}
      </div>`;

    els.dockerBody.querySelector("[data-sec-scan]")?.addEventListener("click", async () => {
      try {
        state.dockerSecurityBusy = true;
        renderSecurityPanel();
        const data = await api("/api/docker/security/scan", { method: "POST", body: "{}" });
        state.dockerSecurity = {
          ...(state.dockerSecurity || {}),
          ...data,
          policy: data.policy || state.dockerSecurity?.policy,
          recentEvents: state.dockerSecurity?.recentEvents,
        };
        toast(`Escaneo: ${data.containers?.length || 0} contenedores`);
        const ev = await api("/api/docker/security/events?limit=40");
        state.dockerSecurityEvents = ev.events || [];
      } catch (err) {
        toast(err.message || "Error escaneo");
      } finally {
        state.dockerSecurityBusy = false;
        renderSecurityPanel();
      }
    });
    els.dockerBody.querySelector("[data-sec-policy]")?.addEventListener("click", () => {
      state.dockerSecurityView = "policy";
      renderSecurityPanel();
    });
    els.dockerBody.querySelector("[data-sec-events]")?.addEventListener("click", () => {
      state.dockerSecurityView = "events";
      renderSecurityPanel();
    });
    els.dockerBody.querySelectorAll("[data-sec-sol]").forEach((btn) => {
      btn.addEventListener("click", () => {
        toast(btn.dataset.secSol || "Sin solución");
      });
    });
    els.dockerBody.querySelectorAll("[data-sec-allow]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          state.dockerSecurityBusy = true;
          const type = btn.dataset.secType || "privileged";
          await api("/api/docker/security/allow", {
            method: "POST",
            body: JSON.stringify({ id: btn.dataset.secAllow, allow: true, type }),
          });
          toast(type === "hostNetwork" ? "Host network permitido (override)" : "Privileged permitido (override)");
          await refreshDockerSecurity();
        } catch (err) {
          toast(err.message || "Error allow");
        } finally {
          state.dockerSecurityBusy = false;
          renderSecurityPanel();
        }
      });
    });
    els.dockerBody.querySelectorAll("[data-sec-deny]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          state.dockerSecurityBusy = true;
          const type = btn.dataset.secType || "privileged";
          await api("/api/docker/security/allow", {
            method: "POST",
            body: JSON.stringify({ id: btn.dataset.secDeny, allow: false, action: "block", type }),
          });
          toast("Override revocado / bloqueado en policy");
          await refreshDockerSecurity();
        } catch (err) {
          toast(err.message || "Error deny");
        } finally {
          state.dockerSecurityBusy = false;
          renderSecurityPanel();
        }
      });
    });
  }


  async function refreshDockerUpdates() {
    const [list, hist, settings] = await Promise.all([
      api("/api/docker/updates"),
      api("/api/docker/update/history"),
      api("/api/docker/update/settings"),
    ]);
    state.dockerUpdates = list.updates || [];
    state.dockerUpdateMaint = !!list.maintenance;
    state.dockerUpdateHistory = hist.entries || [];
    state.dockerUpdateSettings = settings.settings || null;
  }

  function renderUpdatesPanel() {
    const busy = state.dockerUpdateBusy;
    const maint = state.dockerUpdateMaint;
    const items = state.dockerUpdates || [];
    const hist = state.dockerUpdateHistory || [];
    const settings = state.dockerUpdateSettings || {
      services: {},
      critical: [],
      neverAuto: [],
      note: "",
    };

    if (state.dockerUpdateView === "config") {
      const svcKeys = [
        ...new Set([
          ...items.map((i) => i.id),
          ...Object.keys(settings.services || {}),
        ]),
      ];
      const rows = svcKeys
        .map((id) => {
          const r = (settings.services || {})[id] || {};
          const info = items.find((x) => x.id === id);
          const crit = (settings.critical || []).includes(id);
          return `
            <div class="docker-row" data-upd-cfg="${escHtml(id)}">
              <div class="docker-row-top">
                <h3>${escHtml(id)}${info?.name && info.name !== id ? ` <span class="docker-meta">(${escHtml(info.name)})</span>` : ""}</h3>
                ${crit ? `<span class="docker-badge upd-err">crítico</span>` : ""}
              </div>
              <div class="docker-backup-opts">
                <label class="docker-check"><input type="checkbox" data-cfg="autoUpdate" ${r.autoUpdate ? "checked" : ""} ${crit ? "disabled" : ""}/> Auto-update</label>
                <label class="docker-check"><input type="checkbox" data-cfg="backupBefore" ${r.backupBefore !== false ? "checked" : ""}/> Backup antes</label>
                <label class="docker-check"><input type="checkbox" data-cfg="autoRestart" ${r.autoRestart !== false ? "checked" : ""}/> Auto-restart</label>
                <label class="docker-backup-label">Horario
                  <input type="text" data-cfg="schedule" placeholder="03:00" value="${escHtml(r.schedule || "")}" maxlength="5" style="width:70px"/>
                </label>
                <label class="docker-backup-label">Canal
                  <select data-cfg="channel">
                    <option value="stable" ${r.channel !== "latest" ? "selected" : ""}>stable</option>
                    <option value="latest" ${r.channel === "latest" ? "selected" : ""}>latest</option>
                  </select>
                </label>
              </div>
              ${crit ? `<div class="docker-upd-crit">Nunca auto-update (lista crítica)</div>` : ""}
            </div>`;
        })
        .join("") || `<p class="docker-meta">No hay stacks. Crea uno en Compose.</p>`;

      els.dockerBody.innerHTML = `
        <div class="docker-updates-config">
          <div class="docker-actions">
            <button type="button" class="dk-btn ghost" data-upd-back>← Volver</button>
            <button type="button" class="dk-btn" data-upd-cfg-save ${busy ? "disabled" : ""}>Guardar reglas</button>
          </div>
          <h3 style="margin:0;font-size:14px">Reglas por servicio</h3>
          <p class="docker-meta">${escHtml(settings.note || "Schedule MVP: check cada minuto en la API.")}</p>
          <div class="docker-meta">Críticos: <strong>${escHtml((settings.critical || []).join(", ") || "—")}</strong></div>
          <div class="docker-meta">neverAuto: <strong>${escHtml((settings.neverAuto || []).join(", ") || "—")}</strong></div>
          ${rows}
        </div>`;

      els.dockerBody.querySelector("[data-upd-back]")?.addEventListener("click", () => {
        state.dockerUpdateView = "list";
        renderUpdatesPanel();
      });
      els.dockerBody.querySelector("[data-upd-cfg-save]")?.addEventListener("click", async () => {
        try {
          state.dockerUpdateBusy = true;
          const services = {};
          els.dockerBody.querySelectorAll("[data-upd-cfg]").forEach((row) => {
            const id = row.dataset.updCfg;
            services[id] = {
              autoUpdate: !!row.querySelector('[data-cfg="autoUpdate"]')?.checked,
              backupBefore: !!row.querySelector('[data-cfg="backupBefore"]')?.checked,
              autoRestart: !!row.querySelector('[data-cfg="autoRestart"]')?.checked,
              schedule: String(row.querySelector('[data-cfg="schedule"]')?.value || "").trim(),
              channel: row.querySelector('[data-cfg="channel"]')?.value || "stable",
            };
          });
          const data = await api("/api/docker/update/settings", {
            method: "PUT",
            body: JSON.stringify({ services }),
          });
          state.dockerUpdateSettings = data.settings || null;
          toast("Reglas guardadas");
          state.dockerUpdateView = "list";
          await refreshDockerUpdates();
          renderUpdatesPanel();
        } catch (err) {
          toast(err.message || "Error guardando reglas");
        } finally {
          state.dockerUpdateBusy = false;
        }
      });
      return;
    }

    const listRows = items.length
      ? items
          .map((u) => {
            const svcs = (u.services || [])
              .map((s) => {
                const arrow = s.available
                  ? `${escHtml(s.currentTag || "?")} → ${escHtml(s.newTag || "?")}`
                  : `${escHtml(s.currentTag || "?")} (ok)`;
                return `<div class="docker-upd-svc">${escHtml(s.service)}: ${arrow}</div>`;
              })
              .join("");
            const badge = u.available
              ? `<span class="docker-badge upd-avail">update</span>`
              : `<span class="docker-badge upd-ok">ok</span>`;
            const crit = u.critical
              ? `<span class="docker-badge upd-err">crítico</span>`
              : "";
            return `
              <div class="docker-row" data-upd-id="${escHtml(u.id)}">
                <div class="docker-row-top">
                  <h3>${escHtml(u.name || u.id)}</h3>
                  ${badge}${crit}
                </div>
                ${svcs || `<div class="docker-meta">${escHtml(u.error || "Sin imágenes")}</div>`}
                <div class="docker-actions">
                  <button type="button" class="dk-btn" data-uact="update" ${busy || maint || !u.available ? "disabled" : ""}>Actualizar</button>
                  <button type="button" class="dk-btn ghost" data-uact="rollback" ${busy || maint ? "disabled" : ""}>Rollback</button>
                </div>
              </div>`;
          })
          .join("")
      : `<p class="docker-meta">No hay stacks compose. Crea uno (p.ej. whoami) para ver updates.</p>`;

    const histRows = hist.length
      ? hist
          .slice(0, 20)
          .map((h) => {
            const st = h.status || "?";
            const cls =
              st === "success"
                ? "upd-ok"
                : st === "rollback"
                  ? "upd-rb"
                  : "upd-err";
            return `
              <div class="docker-row">
                <div class="docker-row-top">
                  <h3 style="font-size:13px">${escHtml(h.stackId || h.name || "")}</h3>
                  <span class="docker-badge ${cls}">${escHtml(st)}</span>
                </div>
                <div class="docker-meta">${escHtml(h.at || "")}</div>
                <div class="docker-meta">${escHtml(h.from || "")} → ${escHtml(h.to || "")}</div>
                ${h.error ? `<div class="docker-upd-crit">${escHtml(h.error)}</div>` : ""}
              </div>`;
          })
          .join("")
      : `<p class="docker-meta">Sin historial todavía.</p>`;

    els.dockerBody.innerHTML = `
      <div class="docker-summary">
        <span>Updates: <strong>${items.filter((i) => i.available).length}</strong> / ${items.length}</span>
        <span>Mantenimiento: <strong>${maint ? "ON" : "OFF"}</strong></span>
      </div>
      <div class="docker-updates-maint">
        <label class="docker-check">
          <input type="checkbox" id="upd-maint" ${maint ? "checked" : ""} ${busy ? "disabled" : ""}/>
          Modo mantenimiento (bloquea updates y schedule)
        </label>
      </div>
      <div class="docker-updates-toolbar">
        <div class="docker-actions">
          <button type="button" class="dk-btn" data-upd-all ${busy || maint ? "disabled" : ""}>Actualizar todo</button>
          <button type="button" class="dk-btn ghost" data-upd-cfg ${busy ? "disabled" : ""}>Configurar reglas</button>
          <button type="button" class="dk-btn ghost" data-upd-refresh ${busy ? "disabled" : ""}>Actualizar lista</button>
        </div>
      </div>
      <div class="docker-updates-list">
        <h3 style="margin:0;font-size:14px">Servicios</h3>
        ${listRows}
      </div>
      <div class="docker-updates-history">
        <h3 style="margin:0;font-size:14px">Historial</h3>
        ${histRows}
      </div>`;

    els.dockerBody.querySelector("#upd-maint")?.addEventListener("change", async (ev) => {
      try {
        state.dockerUpdateBusy = true;
        const data = await api("/api/docker/maintenance", {
          method: "POST",
          body: JSON.stringify({ enabled: !!ev.target.checked }),
        });
        state.dockerUpdateMaint = !!data.maintenance;
        toast(data.maintenance ? "Mantenimiento ON" : "Mantenimiento OFF");
        await refreshDockerUpdates();
      } catch (err) {
        toast(err.message || "Error mantenimiento");
      } finally {
        state.dockerUpdateBusy = false;
        renderUpdatesPanel();
      }
    });

    els.dockerBody.querySelector("[data-upd-refresh]")?.addEventListener("click", () => {
      refreshDockerUpdates()
        .then(() => renderUpdatesPanel())
        .catch((err) => toast(err.message || "Error"));
    });

    els.dockerBody.querySelector("[data-upd-cfg]")?.addEventListener("click", () => {
      state.dockerUpdateView = "config";
      renderUpdatesPanel();
    });

    els.dockerBody.querySelector("[data-upd-all]")?.addEventListener("click", async () => {
      if (!confirm("¿Actualizar todos los stacks no críticos con update disponible?")) return;
      state.dockerUpdateBusy = true;
      renderUpdatesPanel();
      try {
        const data = await api("/api/docker/update/all", {
          method: "POST",
          body: JSON.stringify({}),
        });
        const ok = (data.results || []).filter((r) => r.ok).length;
        const skip = (data.results || []).filter((r) => r.skipped).length;
        toast(`Update all: ${ok} ok, ${skip} omitidos`);
        await refreshDockerUpdates();
      } catch (err) {
        toast(err.message || "Error update all");
      } finally {
        state.dockerUpdateBusy = false;
        renderUpdatesPanel();
      }
    });

    els.dockerBody.querySelectorAll("[data-upd-id]").forEach((row) => {
      const id = row.dataset.updId;
      row.querySelectorAll("[data-uact]").forEach((btn) => {
        btn.addEventListener("click", () => handleUpdateAction(id, btn.dataset.uact));
      });
    });
  }

  async function handleUpdateAction(id, act) {
    try {
      if (act === "update") {
        const item = (state.dockerUpdates || []).find((x) => x.id === id);
        if (item?.critical) {
          if (
            !confirm(
              `«${id}» es CRÍTICO. ¿Actualizar de todas formas?\nSe creará backup y habrá rollback automático si falla.`
            )
          ) {
            return;
          }
        } else if (!confirm(`¿Actualizar stack ${id}? (backup → pull → up → health)`)) {
          return;
        }
        state.dockerUpdateBusy = true;
        renderUpdatesPanel();
        toast(`Actualizando ${id}…`);
        const body = item?.critical ? { confirmCritical: true } : {};
        // Si hay mock/_mockNewTag o newTags, enviar targetTags
        const targetTags = {};
        for (const s of item?.services || []) {
          if (s.available && s.newTag) targetTags[s.service] = s.newTag;
        }
        if (Object.keys(targetTags).length) body.targetTags = targetTags;
        const result = await api(`/api/docker/update/${encodeURIComponent(id)}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast(
          result.ok
            ? `Update OK ${id}${result.backupId ? ` (backup ${result.backupId})` : ""}`
            : "Update finalizado"
        );
        await refreshDockerUpdates();
      } else if (act === "rollback") {
        if (!confirm(`¿Rollback de ${id} al compose anterior?`)) return;
        state.dockerUpdateBusy = true;
        renderUpdatesPanel();
        const result = await api(`/api/docker/rollback/${encodeURIComponent(id)}`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        toast(result.ok ? `Rollback OK (${result.restoredFrom})` : "Rollback hecho");
        await refreshDockerUpdates();
      }
    } catch (err) {
      toast(err.message || "Error update");
      try {
        await refreshDockerUpdates();
      } catch {
        /* ignore */
      }
    } finally {
      state.dockerUpdateBusy = false;
      renderUpdatesPanel();
    }
  }


  async function refreshDockerImages() {
    const data = await api("/api/docker/images");
    state.dockerImages = data.images || [];
  }

  async function refreshDockerVolumes() {
    const data = await api("/api/docker/volumes");
    state.dockerVolumes = data.volumes || [];
  }

  async function refreshDockerNetworks() {
    const data = await api("/api/docker/networks");
    state.dockerNetworks = data.networks || [];
  }

  function stopDockerLogsPolling() {
    if (state.dockerLogsTimer) {
      clearInterval(state.dockerLogsTimer);
      state.dockerLogsTimer = null;
    }
    if (state.dockerLogsEs) {
      try {
        state.dockerLogsEs.close();
      } catch (_) {}
      state.dockerLogsEs = null;
    }
    state.dockerLogsStreaming = false;
    const btn = els.dockerBody?.querySelector("[data-logs-stop]");
    if (btn) btn.hidden = true;
    const meta = els.dockerBody?.querySelector("[data-logs-mode]");
    if (meta && !state.dockerLogsStreaming) {
      /* mode label updated by callers */
    }
  }

  function dockerSseUrl(path) {
    const base =
      API_BASE ||
      `${window.location.protocol}//${window.location.host}`;
    const sep = path.includes("?") ? "&" : "?";
    return `${base}${path}${sep}key=${encodeURIComponent(API_KEY)}`;
  }

  function appendDockerLogLine(line) {
    if (!line && line !== "") return;
    const prev = state.dockerLogs || "";
    state.dockerLogs = prev ? `${prev}\n${line}` : String(line);
    // Cap ~4000 líneas en memoria UI
    const parts = state.dockerLogs.split("\n");
    if (parts.length > 4000) {
      state.dockerLogs = parts.slice(-3500).join("\n");
    }
    const pre = els.dockerBody?.querySelector("pre.docker-logs-pre");
    if (pre) {
      pre.textContent = state.dockerLogs || "(sin logs)";
      pre.scrollTop = pre.scrollHeight;
    }
  }

  function startDockerLogsPolling(id) {
    stopDockerLogsPolling();
    state.dockerLogsStreaming = false;
    const meta = els.dockerBody?.querySelector("[data-logs-mode]");
    if (meta) meta.textContent = "Logs (polling 4s — SSE no disponible)";
    state.dockerLogsTimer = setInterval(async () => {
      if (state.dockerView !== "stack-logs" || state.dockerStackFocusId !== id) {
        stopDockerLogsPolling();
        return;
      }
      try {
        const d = await api(
          `/api/docker/compose/${encodeURIComponent(id)}/logs?tail=200`
        );
        state.dockerLogs = d.logs || "";
        const pre = els.dockerBody?.querySelector("pre.docker-logs-pre");
        if (pre) pre.textContent = state.dockerLogs || "(sin logs)";
      } catch (_) {}
    }, 4000);
  }

  function startDockerLogsStream(id) {
    stopDockerLogsPolling();
    if (typeof EventSource === "undefined") {
      startDockerLogsPolling(id);
      return;
    }
    const url = dockerSseUrl(
      `/api/docker/compose/${encodeURIComponent(id)}/logs?stream=1&tail=100`
    );
    let es;
    try {
      es = new EventSource(url);
    } catch (_) {
      startDockerLogsPolling(id);
      return;
    }
    state.dockerLogsEs = es;
    state.dockerLogsStreaming = true;
    let opened = false;
    let fellBack = false;
    const meta = els.dockerBody?.querySelector("[data-logs-mode]");
    if (meta) meta.textContent = "Logs en vivo (SSE)";
    const stopBtn = els.dockerBody?.querySelector("[data-logs-stop]");
    if (stopBtn) stopBtn.hidden = false;

    const onLine = (ev) => {
      opened = true;
      try {
        const line = JSON.parse(ev.data);
        appendDockerLogLine(line);
      } catch (_) {
        appendDockerLogLine(ev.data);
      }
    };
    es.addEventListener("log", onLine);
    es.onmessage = onLine;
    es.onopen = () => {
      opened = true;
    };
    es.addEventListener("error", () => {
      if (fellBack || opened) return;
      fellBack = true;
      try {
        es.close();
      } catch (_) {}
      state.dockerLogsEs = null;
      toast("SSE falló — usando polling");
      startDockerLogsPolling(id);
    });
    es.addEventListener("end", () => {
      stopDockerLogsPolling();
      if (meta) meta.textContent = "Stream finalizado";
    });
    // Si en ~3s no abre, fallback a polling
    setTimeout(() => {
      if (fellBack || opened || state.dockerLogsEs !== es) return;
      fellBack = true;
      try {
        es.close();
      } catch (_) {}
      state.dockerLogsEs = null;
      toast("SSE sin respuesta — usando polling");
      startDockerLogsPolling(id);
    }, 3000);
  }

  function destroyComposeEditor() {
    if (state.dockerComposeCm) {
      try {
        state.dockerComposeCm.toTextArea();
      } catch (_) {
        try {
          state.dockerComposeCm.getWrapperElement()?.remove();
        } catch (_) {}
      }
      state.dockerComposeCm = null;
    }
  }

  function initComposeEditor(textarea, initialValue) {
    destroyComposeEditor();
    if (!textarea || typeof CodeMirror === "undefined") return null;
    if (initialValue != null) textarea.value = initialValue;
    const cm = CodeMirror.fromTextArea(textarea, {
      mode: "yaml",
      theme: "material-darker",
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
      indentWithTabs: false,
      extraKeys: {
        "Ctrl-Space": "autocomplete",
        "Cmd-Space": "autocomplete",
      },
      hintOptions: { completeSingle: false },
    });
    cm.on("keyup", (editor, e) => {
      if (!e || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key || "";
      if (k.length === 1 || k === "Backspace") {
        try {
          editor.showHint({ completeSingle: false });
        } catch (_) {}
      }
    });
    state.dockerComposeCm = cm;
    setTimeout(() => {
      try {
        cm.refresh();
      } catch (_) {}
    }, 50);
    return cm;
  }

  function readComposeEditorValue(fallbackSelector) {
    if (state.dockerComposeCm) {
      try {
        return state.dockerComposeCm.getValue();
      } catch (_) {}
    }
    const ta = els.dockerBody?.querySelector(fallbackSelector || 'textarea[name="compose"]');
    return ta ? ta.value : "";
  }

  function destroyDockerTerminal() {
    try {
      if (state.dockerWs) {
        state.dockerWs.onopen = null;
        state.dockerWs.onmessage = null;
        state.dockerWs.onerror = null;
        state.dockerWs.onclose = null;
        if (
          state.dockerWs.readyState === WebSocket.OPEN ||
          state.dockerWs.readyState === WebSocket.CONNECTING
        ) {
          state.dockerWs.close();
        }
      }
    } catch (_) {}
    state.dockerWs = null;
    try {
      state.dockerTerm?.dispose();
    } catch (_) {}
    state.dockerTerm = null;
    state.dockerFit = null;
    state.dockerTermStatus = "idle";
    state.dockerTermShell = null;
    if (state.dockerTermRo) {
      try {
        state.dockerTermRo.disconnect();
      } catch (_) {}
      state.dockerTermRo = null;
    }
  }

  function dockerWsUrl(containerId) {
    const base =
      API_BASE ||
      `${window.location.protocol}//${window.location.host}`;
    const wsBase = base.replace(/^http/, "ws");
    const q = new URLSearchParams({
      key: API_KEY,
      cols: "80",
      rows: "24",
    });
    return `${wsBase}/api/docker/containers/${encodeURIComponent(containerId)}/console?${q}`;
  }

  function setDockerTermStatus(text, cls) {
    state.dockerTermStatus = text;
    const el = els.dockerBody?.querySelector("#dk-term-status");
    if (el) {
      el.textContent = text;
      el.className = `docker-term-status ${cls || ""}`.trim();
    }
  }

  function fitDockerTerminal() {
    try {
      state.dockerFit?.fit();
      const term = state.dockerTerm;
      const ws = state.dockerWs;
      if (term && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "resize",
            cols: term.cols,
            rows: term.rows,
          })
        );
      }
    } catch (_) {}
  }

  function connectDockerTerminal(containerId) {
    destroyDockerTerminal();
    const host = els.dockerBody?.querySelector("#dk-xterm");
    if (!host || typeof window.Terminal !== "function") {
      setDockerTermStatus("xterm no cargado", "err");
      toast("xterm.js no disponible");
      return;
    }

    const term = new window.Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      theme: {
        background: "#071018",
        foreground: "#d7e6f5",
        cursor: "#5ec8ff",
        selectionBackground: "rgba(36,150,237,0.35)",
      },
      convertEol: true,
    });
    let fitAddon = null;
    if (window.FitAddon?.FitAddon) {
      fitAddon = new window.FitAddon.FitAddon();
      term.loadAddon(fitAddon);
    } else if (typeof window.FitAddon === "function") {
      fitAddon = new window.FitAddon();
      term.loadAddon(fitAddon);
    }

    term.open(host);
    state.dockerTerm = term;
    state.dockerFit = fitAddon;
    setDockerTermStatus("Conectando…", "warn");

    try {
      fitAddon?.fit();
    } catch (_) {}

    const ws = new WebSocket(dockerWsUrl(containerId));
    state.dockerWs = ws;
    ws.binaryType = "arraybuffer";

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    ws.onopen = () => {
      setDockerTermStatus("Conectado", "ok");
      try {
        fitAddon?.fit();
        ws.send(
          JSON.stringify({
            type: "resize",
            cols: term.cols,
            rows: term.rows,
          })
        );
      } catch (_) {}
    };

    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        const t = ev.data.trim();
        if (t.startsWith("{")) {
          try {
            const msg = JSON.parse(t);
            if (msg.type === "ready") {
              state.dockerTermShell = msg.shell || null;
              setDockerTermStatus(
                `Listo · ${msg.shell || "sh"}${msg.mode === "cli" ? " (cli)" : ""}`,
                "ok"
              );
              return;
            }
            if (msg.type === "error") {
              setDockerTermStatus(msg.message || "Error", "err");
              term.writeln(`\r\n\x1b[31m${msg.message || "Error"}\x1b[0m`);
              return;
            }
            if (msg.type === "exit") {
              setDockerTermStatus("Sesión cerrada", "warn");
              return;
            }
            if (msg.type === "resized" || msg.type === "pong" || msg.type === "auth_required") {
              return;
            }
          } catch (_) {
            /* texto plano */
          }
        }
        term.write(ev.data);
        return;
      }
      term.write(new Uint8Array(ev.data));
    };

    ws.onerror = () => setDockerTermStatus("Error WS", "err");
    ws.onclose = () => {
      if (state.dockerWs === ws) {
        setDockerTermStatus("Desconectado", "warn");
      }
    };

    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(() => fitDockerTerminal());
      ro.observe(host);
      state.dockerTermRo = ro;
    }
  }

  async function refreshDockerContainers() {
    const data = await api("/api/docker/containers?all=1");
    state.dockerContainers = data.containers || [];
    try {
      const statsData = await api("/api/docker/containers/stats");
      const map = {};
      for (const s of statsData.stats || []) {
        if (s.id) map[s.id] = s;
        if (s.name) map[s.name] = s;
      }
      state.dockerStatsMap = map;
    } catch (_) {
      state.dockerStatsMap = {};
    }
    if (!els.dockerPanel?.hidden && state.dockerTab === "containers") {
      renderDockerBody();
    }
  }

  async function refreshDockerStacks() {
    const data = await api("/api/docker/compose");
    state.dockerStacks = data.stacks || [];
    try {
      const tpl = await api("/api/docker/compose/templates");
      state.dockerTemplates = tpl.templates || [];
    } catch (_) {
      /* plantillas opcionales */
    }
    if (!els.dockerPanel?.hidden && state.dockerTab === "compose") {
      renderDockerBody();
    }
  }

  function dockerFocus() {
    return state.dockerContainers.find(
      (c) => c.id === state.dockerFocusId || c.name === state.dockerFocusId
    );
  }

  function stackFocus() {
    return state.dockerStacks.find((s) => s.id === state.dockerStackFocusId);
  }

  function categoryOrder(cat) {
    const order = [
      "monitoring",
      "database",
      "network",
      "media",
      "apps",
      "security",
      "home",
      "management",
      "utils",
    ];
    const i = order.indexOf(cat);
    return i < 0 ? 99 : i;
  }

  function renderStackNewChooser() {
    destroyComposeEditor();
    els.dockerBody.innerHTML = `
      <div class="docker-sub">
        <button type="button" class="dk-btn ghost" data-dk-back>← Compose</button>
        <h3 style="margin:0">Nuevo stack</h3>
        <p class="docker-meta">Elige cómo crearlo. Las plantillas generan el compose.yaml por ti.</p>
        <div class="docker-tpl-chooser">
          <button type="button" class="docker-tpl-choice" data-go-tpl>
            <span class="docker-tpl-choice-icon">🧩</span>
            <strong>Desde plantilla</strong>
            <span class="docker-meta">Grafana, Redis, Jellyfin… formulario → Deploy</span>
          </button>
          <button type="button" class="docker-tpl-choice" data-go-yaml>
            <span class="docker-tpl-choice-icon">YAML</span>
            <strong>Editor manual</strong>
            <span class="docker-meta">Power users · CodeMirror + validate</span>
          </button>
        </div>
      </div>`;
    els.dockerBody.querySelector("[data-dk-back]")?.addEventListener("click", () => {
      state.dockerView = "list";
      renderDockerBody();
    });
    els.dockerBody.querySelector("[data-go-tpl]")?.addEventListener("click", () => {
      state.dockerTplSelected = null;
      state.dockerTplValues = {};
      state.dockerTplPreview = "";
      state.dockerView = "tpl-gallery";
      refreshDockerStacks()
        .catch(() => {})
        .finally(() => renderDockerBody());
    });
    els.dockerBody.querySelector("[data-go-yaml]")?.addEventListener("click", () => {
      state.dockerStackDraft = {
        name: "",
        compose: `services:\n  whoami:\n    image: traefik/whoami:v1.10.2\n    restart: unless-stopped\n    ports:\n      - "18080:80"\n`,
      };
      state.dockerView = "stack-create";
      renderDockerBody();
    });
  }

  function renderTemplateGallery() {
    destroyComposeEditor();
    const templates = [...(state.dockerTemplates || [])].sort((a, b) => {
      const c = categoryOrder(a.category) - categoryOrder(b.category);
      return c !== 0 ? c : String(a.name).localeCompare(String(b.name));
    });
    const groups = {};
    for (const t of templates) {
      const cat = t.categoryLabel || t.category || "Otros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    const sections = Object.keys(groups)
      .map((cat) => {
        const cards = groups[cat]
          .map((t) => {
            const selected = state.dockerTplSelected === t.id ? " selected" : "";
            return `
              <label class="docker-tpl-card${selected}">
                <input type="radio" name="dk-tpl" value="${escHtml(t.id)}" ${
                  state.dockerTplSelected === t.id ? "checked" : ""
                } />
                <span class="docker-tpl-card-icon">${escHtml(t.icon || "📦")}</span>
                <span class="docker-tpl-card-body">
                  <strong>${escHtml(t.name)}</strong>
                  <span class="docker-meta">${escHtml(t.description || "")}</span>
                  ${t.warning ? `<span class="docker-tpl-warn">${escHtml(t.warning)}</span>` : ""}
                </span>
              </label>`;
          })
          .join("");
        return `<div class="docker-tpl-section"><h4>${escHtml(cat)}</h4><div class="docker-tpl-grid">${cards}</div></div>`;
      })
      .join("");

    els.dockerBody.innerHTML = `
      <div class="docker-sub">
        <button type="button" class="dk-btn ghost" data-dk-back>← Nuevo stack</button>
        <h3 style="margin:0">Desde plantilla</h3>
        <p class="docker-meta">Selecciona un servicio. Luego configurarás puerto, volúmenes y credenciales.</p>
        <div class="docker-tpl-gallery">${sections || '<p class="docker-meta">No hay plantillas.</p>'}</div>
        <div class="docker-actions">
          <button type="button" class="dk-btn" data-tpl-next ${state.dockerTplSelected ? "" : "disabled"}>Configurar →</button>
          <button type="button" class="dk-btn ghost" data-go-yaml>YAML manual</button>
          <button type="button" class="dk-btn ghost" data-dk-cancel>Cancelar</button>
        </div>
      </div>`;

    const nextBtn = els.dockerBody.querySelector("[data-tpl-next]");
    els.dockerBody.querySelectorAll('input[name="dk-tpl"]').forEach((inp) => {
      inp.addEventListener("change", () => {
        state.dockerTplSelected = inp.value;
        els.dockerBody.querySelectorAll(".docker-tpl-card").forEach((c) => c.classList.remove("selected"));
        inp.closest(".docker-tpl-card")?.classList.add("selected");
        if (nextBtn) nextBtn.disabled = !state.dockerTplSelected;
      });
    });
    els.dockerBody.querySelectorAll(".docker-tpl-card").forEach((card) => {
      card.addEventListener("click", () => {
        const inp = card.querySelector('input[name="dk-tpl"]');
        if (inp) {
          inp.checked = true;
          inp.dispatchEvent(new Event("change"));
        }
      });
    });
    nextBtn?.addEventListener("click", async () => {
      if (!state.dockerTplSelected) return;
      try {
        const t = await api(
          `/api/docker/compose/templates/${encodeURIComponent(state.dockerTplSelected)}`
        );
        state.dockerTplSelected = t.id;
        state.dockerTplValues = {};
        for (const f of t.fields || []) {
          state.dockerTplValues[f.key] = f.default ?? "";
        }
        state.dockerTplDetail = t;
        state.dockerTplPreview = "";
        state.dockerView = "tpl-config";
        renderDockerBody();
      } catch (err) {
        toast(err.message || "No se pudo cargar plantilla");
      }
    });
    els.dockerBody.querySelector("[data-go-yaml]")?.addEventListener("click", () => {
      state.dockerStackDraft = {
        name: "",
        compose: `services:\n  whoami:\n    image: traefik/whoami:v1.10.2\n    restart: unless-stopped\n    ports:\n      - "18080:80"\n`,
      };
      state.dockerView = "stack-create";
      renderDockerBody();
    });
    const goBack = () => {
      state.dockerView = "stack-new";
      renderDockerBody();
    };
    els.dockerBody.querySelector("[data-dk-back]")?.addEventListener("click", goBack);
    els.dockerBody.querySelector("[data-dk-cancel]")?.addEventListener("click", () => {
      state.dockerView = "list";
      state.dockerTplSelected = null;
      renderDockerBody();
    });
  }

  function renderTemplateConfig() {
    destroyComposeEditor();
    const t = state.dockerTplDetail;
    if (!t) {
      state.dockerView = "tpl-gallery";
      renderDockerBody();
      return;
    }
    const fields = t.fields || [];
    const fieldHtml = fields
      .map((f) => {
        const val = state.dockerTplValues[f.key] ?? f.default ?? "";
        const type =
          f.type === "password" ? "password" : f.type === "number" ? "number" : "text";
        const hint = f.hint
          ? `<span class="docker-meta">${escHtml(f.hint)}</span>`
          : "";
        return `<label>${escHtml(f.label || f.key)}
          <input name="${escHtml(f.key)}" type="${type}" value="${escHtml(String(val))}" ${
            f.type === "number" ? 'min="1" step="1"' : ""
          } ${f.required === true ? "required" : ""} />
          ${hint}
        </label>`;
      })
      .join("");

    els.dockerBody.innerHTML = `
      <div class="docker-sub">
        <button type="button" class="dk-btn ghost" data-dk-back>← Plantillas</button>
        <h3 style="margin:0">Configurar · ${escHtml(t.name)}</h3>
        <p class="docker-meta">${escHtml(t.description || "")}</p>
        ${t.warning ? `<p class="docker-tpl-warn">${escHtml(t.warning)}</p>` : ""}
        <form class="docker-form" id="dk-tpl-form">${fieldHtml}</form>
        <div id="dk-tpl-preview" class="docker-tpl-preview" ${
          state.dockerTplPreview ? "" : 'hidden'
        }>
          <div class="docker-meta"><strong>Preview compose.yaml</strong></div>
          <pre class="docker-logs-pre">${escHtml(state.dockerTplPreview || "")}</pre>
        </div>
        <div id="dk-tpl-err" class="docker-meta" style="color:#f87171;display:none"></div>
        <div class="docker-actions">
          <button type="button" class="dk-btn ghost" data-tpl-cancel>Cancelar</button>
          <button type="button" class="dk-btn ghost" data-tpl-preview>Generar preview</button>
          <button type="button" class="dk-btn" data-tpl-deploy>Deploy</button>
        </div>
      </div>`;

    const readValues = () => {
      const form = els.dockerBody.querySelector("#dk-tpl-form");
      const values = {};
      for (const f of fields) {
        const inp = form?.querySelector(`[name="${f.key}"]`);
        let v = inp ? inp.value : state.dockerTplValues[f.key];
        if (f.type === "number" && v !== "" && v != null) v = Number(v);
        values[f.key] = v;
      }
      state.dockerTplValues = values;
      return values;
    };

    const showErr = (msg) => {
      const el = els.dockerBody.querySelector("#dk-tpl-err");
      if (!el) return;
      el.style.display = "block";
      el.textContent = msg || "";
    };
    const clearErr = () => {
      const el = els.dockerBody.querySelector("#dk-tpl-err");
      if (el) {
        el.style.display = "none";
        el.textContent = "";
      }
    };

    els.dockerBody.querySelector("[data-dk-back]")?.addEventListener("click", () => {
      state.dockerView = "tpl-gallery";
      renderDockerBody();
    });
    els.dockerBody.querySelector("[data-tpl-cancel]")?.addEventListener("click", () => {
      state.dockerView = "list";
      state.dockerTplSelected = null;
      state.dockerTplDetail = null;
      state.dockerTplPreview = "";
      renderDockerBody();
    });
    els.dockerBody.querySelector("[data-tpl-preview]")?.addEventListener("click", async () => {
      clearErr();
      try {
        const values = readValues();
        toast("Generando preview…");
        const data = await api("/api/docker/compose/from-template", {
          method: "POST",
          body: JSON.stringify({
            templateId: t.id,
            values,
            preview: true,
          }),
        });
        state.dockerTplPreview = data.compose || "";
        const box = els.dockerBody.querySelector("#dk-tpl-preview");
        const pre = box?.querySelector("pre");
        if (box) box.hidden = false;
        if (pre) pre.textContent = state.dockerTplPreview;
        if (data.warnings?.length) toast(data.warnings[0]);
        else toast("Preview OK (validate passed)");
      } catch (err) {
        showErr(err.message || "Error preview");
        toast(err.message || "Preview falló");
      }
    });
    els.dockerBody.querySelector("[data-tpl-deploy]")?.addEventListener("click", async () => {
      clearErr();
      try {
        const values = readValues();
        if (t.warning && !confirm(`${t.warning}\n\n¿Continuar con Deploy?`)) return;
        toast("Deploy desde plantilla…");
        const data = await api("/api/docker/compose/from-template", {
          method: "POST",
          body: JSON.stringify({
            templateId: t.id,
            values,
            deploy: true,
          }),
        });
        const id = data.stack?.id || data.stack?.name || values.name;
        if (data.warnings?.length) toast(data.warnings[0]);
        toast(`Deploy OK · ${id}`);
        state.dockerView = "list";
        state.dockerTplSelected = null;
        state.dockerTplDetail = null;
        state.dockerTplPreview = "";
        await refreshDockerStacks();
        renderDockerBody();
      } catch (err) {
        showErr(err.message || "Error deploy");
        toast(err.message || "Deploy falló");
      }
    });
  }

  function renderStackEditor(mode) {
    const isEdit = mode === "edit";
    const draft = state.dockerStackDraft || { name: "", compose: "" };
    const history = state.dockerHistory || [];
    const tplButtons = !isEdit
      ? `<div class="docker-templates">
          <button type="button" class="dk-btn ghost" data-go-tpl>← Desde plantilla</button>
          <span class="docker-meta">Editor YAML manual</span>
        </div>`
      : "";
    const histBlock =
      isEdit && history.length
        ? `<div class="docker-history">
            <div class="docker-meta"><strong>Historial</strong> (últimas ${history.length})</div>
            ${history
              .slice(0, 12)
              .map(
                (h) => `
              <div class="docker-history-row">
                <span class="docker-meta">${escHtml(h.rev)}${h.mtime ? " · " + escHtml(h.mtime.replace("T", " ").slice(0, 19)) + "Z" : ""}</span>
                <span class="docker-actions">
                  <button type="button" class="dk-btn ghost" data-hist-load="${escHtml(h.rev)}">Ver</button>
                  <button type="button" class="dk-btn" data-hist-rollback="${escHtml(h.rev)}">Restaurar</button>
                  <button type="button" class="dk-btn" data-hist-rollback-deploy="${escHtml(h.rev)}">Restaurar+Deploy</button>
                </span>
              </div>`
              )
              .join("")}
          </div>`
        : isEdit
          ? `<p class="docker-meta">Sin historial aún (aparece al Guardar).</p>`
          : "";
    destroyComposeEditor();
    els.dockerBody.innerHTML = `
      <div class="docker-sub">
        <button type="button" class="dk-btn ghost" data-dk-back>← Compose</button>
        <h3 style="margin:0">${isEdit ? "Editar compose" : "Nuevo stack"}</h3>
        ${tplButtons}
        <form class="docker-form" id="dk-stack-form">
          <label>Nombre<input name="name" value="${escHtml(draft.name)}" placeholder="whoami" ${isEdit ? "readonly" : "required"} /></label>
          <label>compose.yaml
            <textarea name="compose" id="dk-compose-ta" class="docker-compose-ta" rows="14" required spellcheck="false"></textarea>
          </label>
          <p class="docker-meta">YAML con resaltado · Ctrl+Space autocompletar</p>
          <div id="dk-validate-err" class="docker-meta" style="color:#f87171;display:none"></div>
          <div class="docker-actions">
            <button type="button" class="dk-btn" data-stack-save>Guardar</button>
            <button type="button" class="dk-btn" data-stack-deploy>Deploy</button>
            <button type="button" class="dk-btn ghost" data-dk-back>Cancelar</button>
          </div>
        </form>
        ${histBlock}
      </div>`;

    const ta = els.dockerBody.querySelector("#dk-compose-ta");
    if (ta) {
      ta.value = draft.compose || "";
      initComposeEditor(ta, draft.compose || "");
    }

    const showValErr = (msg, line) => {
      const el = els.dockerBody.querySelector("#dk-validate-err");
      if (!el) return;
      el.style.display = "block";
      el.textContent = line != null ? `Línea ${line}: ${msg}` : msg;
    };
    const clearValErr = () => {
      const el = els.dockerBody.querySelector("#dk-validate-err");
      if (el) {
        el.style.display = "none";
        el.textContent = "";
      }
    };

    const goBack = () => {
      destroyComposeEditor();
      state.dockerView = "list";
      state.dockerStackFocusId = null;
      state.dockerHistory = [];
      renderDockerBody();
    };
    els.dockerBody.querySelectorAll("[data-dk-back]").forEach((b) =>
      b.addEventListener("click", goBack)
    );

    els.dockerBody.querySelector("[data-go-tpl]")?.addEventListener("click", () => {
      destroyComposeEditor();
      state.dockerTplSelected = null;
      state.dockerView = "tpl-gallery";
      renderDockerBody();
    });

    els.dockerBody.querySelectorAll("[data-hist-load]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const rev = btn.dataset.histLoad;
          const data = await api(
            `/api/docker/compose/${encodeURIComponent(state.dockerStackFocusId)}/history/${encodeURIComponent(rev)}`
          );
          if (state.dockerComposeCm) {
            state.dockerComposeCm.setValue(data.compose || "");
          }
          toast(`Revisión ${rev} cargada en editor`);
        } catch (err) {
          toast(err.message || "No se pudo cargar revisión");
        }
      });
    });

    const doRollback = async (rev, deploy) => {
      if (!confirm(`¿Restaurar revisión ${rev}${deploy ? " y hacer Deploy" : ""}?`)) return;
      try {
        toast(deploy ? "Rollback + Deploy…" : "Rollback…");
        await api(`/api/docker/compose/${encodeURIComponent(state.dockerStackFocusId)}/rollback`, {
          method: "POST",
          body: JSON.stringify({ rev, deploy: !!deploy }),
        });
        toast(deploy ? "Restaurado y desplegado" : "Compose restaurado");
        const full = await api(
          `/api/docker/compose/${encodeURIComponent(state.dockerStackFocusId)}`
        );
        if (state.dockerComposeCm) state.dockerComposeCm.setValue(full.compose || "");
        state.dockerStackDraft = {
          name: full.name || draft.name,
          compose: full.compose || "",
        };
        try {
          const hist = await api(
            `/api/docker/compose/${encodeURIComponent(state.dockerStackFocusId)}/history`
          );
          state.dockerHistory = hist.revisions || [];
        } catch (_) {}
        renderStackEditor("edit");
      } catch (err) {
        toast(err.message || "Error en rollback");
      }
    };
    els.dockerBody.querySelectorAll("[data-hist-rollback]").forEach((btn) => {
      btn.addEventListener("click", () => doRollback(btn.dataset.histRollback, false));
    });
    els.dockerBody.querySelectorAll("[data-hist-rollback-deploy]").forEach((btn) => {
      btn.addEventListener("click", () => doRollback(btn.dataset.histRollbackDeploy, true));
    });

    const readForm = () => {
      const form = els.dockerBody.querySelector("#dk-stack-form");
      const nameInput = form?.querySelector('input[name="name"]');
      return {
        name: String(nameInput?.value || "").trim(),
        compose: readComposeEditorValue(),
      };
    };

    const saveStack = async () => {
      const { name, compose } = readForm();
      clearValErr();
      if (isEdit && state.dockerStackFocusId) {
        toast("Guardando compose…");
        await api(`/api/docker/compose/${encodeURIComponent(state.dockerStackFocusId)}`, {
          method: "PUT",
          body: JSON.stringify({ compose, name }),
        });
        toast("Guardado");
        return state.dockerStackFocusId;
      }
      toast("Creando stack…");
      const created = await api("/api/docker/compose", {
        method: "POST",
        body: JSON.stringify({ name, compose }),
      });
      const id = created.stack?.id;
      toast("Stack creado");
      return id;
    };

    const validateYaml = async (compose, id) => {
      try {
        if (id) {
          await api(`/api/docker/compose/${encodeURIComponent(id)}/validate`, {
            method: "POST",
            body: JSON.stringify({ compose }),
          });
        } else {
          await api("/api/docker/compose/validate", {
            method: "POST",
            body: JSON.stringify({ compose }),
          });
        }
        return true;
      } catch (err) {
        showValErr(err.message || "YAML inválido", err.line);
        toast(err.line != null ? `YAML inválido (línea ${err.line})` : "YAML inválido — no se despliega");
        return false;
      }
    };

    els.dockerBody.querySelector("[data-stack-save]")?.addEventListener("click", async () => {
      try {
        const id = await saveStack();
        if (id) {
          try {
            const hist = await api(
              `/api/docker/compose/${encodeURIComponent(id)}/history`
            );
            state.dockerHistory = hist.revisions || [];
          } catch (_) {}
        }
        destroyComposeEditor();
        state.dockerView = "list";
        await refreshDockerStacks();
        renderDockerBody();
      } catch (err) {
        toast(err.message || "Error al guardar");
      }
    });

    els.dockerBody.querySelector("[data-stack-deploy]")?.addEventListener("click", async () => {
      try {
        const { compose } = readForm();
        const id = await saveStack();
        if (!id) return;
        toast("Validando…");
        const ok = await validateYaml(compose, id);
        if (!ok) return;
        toast("Deploy (up -d)… (mira Sistema → Tareas para ver el progreso)");
        const created = await api(`/api/docker/compose/${encodeURIComponent(id)}/up`, {
          method: "POST",
          body: "{}",
        });
        const finalTask = await waitForTask(created.taskId);
        if (finalTask.status !== "done") throw new Error(finalTask.detail || "Error al desplegar");
        toast("Deploy OK");
        destroyComposeEditor();
        state.dockerView = "list";
        await refreshDockerStacks();
        renderDockerBody();
      } catch (err) {
        if (err.code === "COMPOSE_INVALID") {
          showValErr(err.message, err.line);
        }
        toast(err.message || "Error al desplegar");
      }
    });
  }

  function renderStackDetail() {
    const s = stackFocus();
    const id = state.dockerStackFocusId;
    const title = s?.name || id;
    const st = state.dockerStackStatus;
    const services = st?.services || s?.services || [];
    const svcRows = services.length
      ? services
          .map(
            (svc) => `
          <div class="docker-meta">
            <strong>${escHtml(svc.service || svc.name)}</strong>
            · ${escHtml(svc.state || "?")}
            ${svc.health ? ` · health ${escHtml(svc.health)}` : ""}
            ${svc.ports ? ` · ${escHtml(typeof svc.ports === "string" ? svc.ports : JSON.stringify(svc.ports))}` : ""}
          </div>`
          )
          .join("")
      : `<p class="docker-meta">Sin servicios (¿sin deploy?)</p>`;

    let inner = "";
    if (state.dockerView === "stack-logs") {
      inner = `
        <div class="docker-actions" style="margin-bottom:8px">
          <span class="docker-meta" data-logs-mode>${state.dockerLogsStreaming ? "Logs en vivo (SSE)" : "Logs"}</span>
          <button type="button" class="dk-btn ghost" data-logs-stop ${state.dockerLogsStreaming ? "" : "hidden"}>Detener stream</button>
        </div>
        <pre class="docker-logs-pre">${escHtml(state.dockerLogs || "(sin logs)")}</pre>`;
    } else if (state.dockerView === "stack-status") {
      inner = `
        <div class="docker-summary">
          <span>Estado: <strong>${escHtml(st?.state || s?.state || "?")}</strong></span>
          <span>Running: <strong>${escHtml(String(st?.running ?? s?.running ?? 0))}/${escHtml(String(st?.total ?? s?.total ?? 0))}</strong></span>
          <span>Health: <strong>${escHtml(st?.health || "—")}</strong></span>
          <span>Project: <strong>${escHtml(st?.project || s?.project || "")}</strong></span>
        </div>
        ${svcRows}`;
    }

    els.dockerBody.innerHTML = `
      <div class="docker-sub">
        <button type="button" class="dk-btn ghost" data-dk-back>← Compose</button>
        <h3 style="margin:0">${escHtml(state.dockerView === "stack-logs" ? "LOGS" : "ESTADO")} · ${escHtml(title)}</h3>
        ${inner}
      </div>`;
    els.dockerBody.querySelector("[data-dk-back]")?.addEventListener("click", () => {
      stopDockerLogsPolling();
      state.dockerView = "list";
      state.dockerStackFocusId = null;
      state.dockerStackStatus = null;
      renderDockerBody();
    });
    els.dockerBody.querySelector("[data-logs-stop]")?.addEventListener("click", () => {
      stopDockerLogsPolling();
      const meta = els.dockerBody.querySelector("[data-logs-mode]");
      if (meta) meta.textContent = "Stream detenido";
      toast("Stream de logs detenido");
    });
  }

  function renderStacksList() {
    const list = state.dockerStacks || [];
    const svcSummary = (s) => {
      const svcs = s.services || [];
      if (!svcs.length) return "sin servicios";
      return svcs
        .map((x) => `${x.service || x.name}:${x.state || "?"}`)
        .slice(0, 6)
        .join(", ");
    };
    const rows = list.length
      ? list
          .map((s) => {
            const badge = s.state || "created";
            return `
              <div class="docker-row" data-stack-id="${escHtml(s.id)}">
                <div class="docker-row-top">
                  <h3>${escHtml(s.name)}</h3>
                  <span class="docker-badge ${escHtml(badge)}">${escHtml(badge)}</span>
                </div>
                <div class="docker-meta">${escHtml(s.id)} · ${escHtml(String(s.running ?? 0))}/${escHtml(String(s.total ?? 0))} · ${escHtml(svcSummary(s))}</div>
                <div class="docker-actions">
                  <button type="button" class="dk-btn" data-sact="start" title="Start">▶ Start</button>
                  <button type="button" class="dk-btn" data-sact="stop" title="Stop">■ Stop</button>
                  <button type="button" class="dk-btn" data-sact="restart" title="Restart">↻ Restart</button>
                  <button type="button" class="dk-btn ghost" data-sact="logs">📄 Logs</button>
                  <button type="button" class="dk-btn ghost" data-sact="edit">✏ Edit</button>
                  <button type="button" class="dk-btn ghost" data-sact="history">🕘 Historial</button>
                  <button type="button" class="dk-btn" data-sact="deploy">⬆ Deploy</button>
                  <button type="button" class="dk-btn danger" data-sact="remove">🗑 Remove</button>
                </div>
              </div>`;
          })
          .join("")
      : `<p class="docker-meta">No hay stacks. Pulsa ＋ para crear uno (p.ej. whoami).</p>`;

    els.dockerBody.innerHTML = `
      <div class="docker-summary">
        <span>Compose stacks: <strong>${list.length}</strong></span>
        <span>Path: <strong>/docker/stacks/&lt;name&gt;/compose.yaml</strong></span>
      </div>
      <div class="docker-actions" style="margin-bottom:10px">
        <button type="button" class="dk-btn" data-stack-new>＋ Nuevo Stack</button>
        <button type="button" class="dk-btn" data-stack-from-tpl>Desde plantilla</button>
      </div>
      ${rows}`;

    els.dockerBody.querySelector("[data-stack-new]")?.addEventListener("click", () => {
      state.dockerView = "stack-new";
      renderDockerBody();
    });
    els.dockerBody.querySelector("[data-stack-from-tpl]")?.addEventListener("click", () => {
      state.dockerTplSelected = null;
      state.dockerTplValues = {};
      state.dockerTplPreview = "";
      state.dockerView = "tpl-gallery";
      refreshDockerStacks()
        .catch(() => {})
        .finally(() => renderDockerBody());
    });

    els.dockerBody.querySelectorAll("[data-stack-id]").forEach((row) => {
      const id = row.dataset.stackId;
      row.querySelectorAll("[data-sact]").forEach((btn) => {
        btn.addEventListener("click", () => handleStackAction(id, btn.dataset.sact));
      });
    });
  }

  async function handleStackAction(id, act) {
    const s = state.dockerStacks.find((x) => x.id === id);
    try {
      if (act === "start" || act === "deploy") {
        toast(act === "deploy" ? "Deploy… (mira Sistema → Tareas)" : "Start… (mira Sistema → Tareas)");
        const created = await api(`/api/docker/compose/${encodeURIComponent(id)}/up`, {
          method: "POST",
          body: "{}",
        });
        const finalTask = await waitForTask(created.taskId);
        if (finalTask.status !== "done") throw new Error(finalTask.detail || "Error");
        toast(act === "deploy" ? "Deploy OK" : "Start OK");
        await refreshDockerStacks();
        renderDockerBody();
        return;
      }
      if (act === "stop") {
        toast("Stop…");
        await api(`/api/docker/compose/${encodeURIComponent(id)}/down`, {
          method: "POST",
          body: "{}",
        });
        toast("Stop OK");
        await refreshDockerStacks();
        renderDockerBody();
        return;
      }
      if (act === "restart") {
        toast("Restart…");
        await api(`/api/docker/compose/${encodeURIComponent(id)}/restart`, {
          method: "POST",
          body: "{}",
        });
        toast("Restart OK");
        await refreshDockerStacks();
        renderDockerBody();
        return;
      }
      if (act === "remove") {
        if (!(await askConfirm(`¿Remove stack ${s?.name || id}? (down + borrar archivos)`))) return;
        const volumes = confirm("¿También borrar volúmenes (-v)? Normalmente No.");
        toast("Remove…");
        await api(
          `/api/docker/compose/${encodeURIComponent(id)}?destroy=true&volumes=${volumes ? "true" : "false"}`,
          { method: "DELETE", body: JSON.stringify({ destroy: true, volumes }) }
        );
        toast("Remove OK");
        await refreshDockerStacks();
        renderDockerBody();
        return;
      }
      if (act === "edit" || act === "history") {
        const full = await api(`/api/docker/compose/${encodeURIComponent(id)}`);
        state.dockerStackFocusId = id;
        state.dockerStackDraft = {
          name: full.name || s?.name || "",
          compose: full.compose || "",
        };
        try {
          const hist = await api(
            `/api/docker/compose/${encodeURIComponent(id)}/history`
          );
          state.dockerHistory = hist.revisions || [];
        } catch (_) {
          state.dockerHistory = [];
        }
        state.dockerView = "stack-edit";
        renderDockerBody();
        if (act === "history" && !state.dockerHistory.length) {
          toast("Sin historial aún — guarda el compose para crear revisiones");
        }
        return;
      }
      if (act === "logs") {
        stopDockerLogsPolling();
        let initial = "";
        try {
          const data = await api(
            `/api/docker/compose/${encodeURIComponent(id)}/logs?tail=100`
          );
          initial = data.logs || "";
        } catch (_) {}
        state.dockerStackFocusId = id;
        state.dockerLogs = initial;
        state.dockerView = "stack-logs";
        renderDockerBody();
        startDockerLogsStream(id);
      }
    } catch (err) {
      toast(err.message || "Error stack");
    }
  }

  function renderImagesList() {
    const list = state.dockerImages || [];
    const rows = list.length
      ? list
          .map(
            (img) => `
          <div class="docker-row">
            <div class="docker-row-top">
              <h3>${escHtml(img.repository || "<none>")}:${escHtml(img.tag || "<none>")}</h3>
              <span class="docker-badge">${escHtml(img.size || "")}</span>
            </div>
            <div class="docker-meta">${escHtml(img.id || "")} · ${escHtml(img.createdAt || "")}</div>
          </div>`
          )
          .join("")
      : `<p class="docker-meta">No hay imágenes.</p>`;
    els.dockerBody.innerHTML = `
      <div class="docker-summary"><span>Images: <strong>${list.length}</strong></span></div>
      ${rows}`;
  }

  function renderVolumesList() {
    const list = state.dockerVolumes || [];
    const rows = list.length
      ? list
          .map(
            (v) => `
          <div class="docker-row">
            <div class="docker-row-top">
              <h3>${escHtml(v.name || "")}</h3>
              <span class="docker-badge">${escHtml(v.driver || "")}</span>
            </div>
            <div class="docker-meta">${escHtml(v.scope || "")} · ${escHtml(v.mountpoint || "")}</div>
          </div>`
          )
          .join("")
      : `<p class="docker-meta">No hay volúmenes.</p>`;
    els.dockerBody.innerHTML = `
      <div class="docker-summary"><span>Volumes: <strong>${list.length}</strong></span></div>
      ${rows}`;
  }

  function renderNetworksList() {
    const list = state.dockerNetworks || [];
    const rows = list.length
      ? list
          .map(
            (n) => `
          <div class="docker-row">
            <div class="docker-row-top">
              <h3>${escHtml(n.name || "")}</h3>
              <span class="docker-badge">${escHtml(n.driver || "")}</span>
            </div>
            <div class="docker-meta">${escHtml(n.id || "")} · scope ${escHtml(n.scope || "")}</div>
          </div>`
          )
          .join("")
      : `<p class="docker-meta">No hay redes.</p>`;
    els.dockerBody.innerHTML = `
      <div class="docker-summary"><span>Networks: <strong>${list.length}</strong></span></div>
      ${rows}`;
  }

  function formatPulls(n) {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    const v = Number(n);
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return String(v);
  }

  function hubDefaultWizard(detail, mode = "compose") {
    const nameBase = String(detail?.name || "app")
      .split("/")
      .pop()
      .replace(/[^a-zA-Z0-9_.-]/g, "-")
      .slice(0, 40) || "app";
    const tag = (detail?.tags && detail.tags[0]) || "latest";
    const image = `${detail?.name || nameBase}:${tag}`;
    const portHint = (detail?.portsHint && detail.portsHint[0]) || "";
    return {
      mode, // compose | container-hint
      name: `${nameBase}-bmo`,
      image,
      tag,
      ports: portHint ? [`${portHint}:${portHint}`] : [],
      volumeName: `${nameBase.replace(/-/g, "_")}_data`,
      volumeMount: "/data",
      useVolume: !!portHint || /redis|postgres|mysql|mongo|grafana/i.test(nameBase),
      envText: "",
      deploy: true,
      saveTemplate: false,
    };
  }

  function parseEnvText(text) {
    const env = {};
    String(text || "")
      .split(/\n|,/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const i = line.indexOf("=");
        if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      });
    return env;
  }

  function confirmUntrustedImage(warning) {
    if (!warning?.needsConfirm) return Promise.resolve(true);
    const msg =
      (warning.message || "Imagen desconocida ⚠️") +
      "\n\nPuede ser insegura (no oficial / pocos downloads).\n¿Continuar de todos modos?";
    return showConfirmModal({ title: "⚠️ Imagen no verificada", message: msg, confirmLabel: "Continuar" });
  }

  async function searchDockerHub(q) {
    const query = String(q || state.dockerHubQuery || "").trim();
    if (!query) {
      toast("Escribe un término de búsqueda");
      return;
    }
    state.dockerHubQuery = query;
    state.dockerHubLoading = true;
    state.dockerView = "list";
    renderDockerBody();
    try {
      const data = await api(
        `/api/docker/hub/search?q=${encodeURIComponent(query)}`
      );
      state.dockerHubResults = data.results || [];
      state.dockerHubCompatible = data.compatiblePlugin || null;
      if (!state.dockerHubResults.length) toast("Sin resultados");
    } catch (err) {
      toast(err.message || "Error buscando en Hub");
      state.dockerHubResults = [];
    } finally {
      state.dockerHubLoading = false;
      renderDockerBody();
    }
  }

  async function openHubDetails(repoName) {
    state.dockerHubLoading = true;
    state.dockerView = "hub-detail";
    renderDockerBody();
    try {
      const data = await api(
        `/api/docker/hub/image?name=${encodeURIComponent(repoName)}`
      );
      state.dockerHubDetail = data;
      state.dockerHubCompatible = data.compatiblePlugin || state.dockerHubCompatible;
    } catch (err) {
      toast(err.message || "Error al cargar detalles");
      state.dockerView = "list";
      state.dockerHubDetail = null;
    } finally {
      state.dockerHubLoading = false;
      renderDockerBody();
    }
  }

  async function startHubWizard(mode = "compose") {
    const d = state.dockerHubDetail;
    if (!d) return;
    if (d.warning?.needsConfirm && !(await confirmUntrustedImage(d.warning))) {
      toast("Instalación cancelada");
      return;
    }
    state.dockerHubAllowUntrusted = !!d.warning?.needsConfirm;
    state.dockerHubWizard = hubDefaultWizard(d, mode);
    state.dockerHubWizardStep = 0;
    state.dockerView = "hub-wizard";
    renderDockerBody();
  }

  function renderHubSearch() {
    const results = state.dockerHubResults || [];
    const plugin = state.dockerHubCompatible;
    const rows = state.dockerHubLoading
      ? `<p class="docker-meta">Buscando en Docker Hub…</p>`
      : results.length
        ? results
            .map((r) => {
              const warn = r.warning?.needsConfirm
                ? `<span class="docker-badge warn" title="${escHtml(r.warning.message || "")}">⚠️</span>`
                : "";
              const official = r.is_official
                ? `<span class="docker-badge official">Oficial</span>`
                : `<span class="docker-badge">Community</span>`;
              return `
              <div class="docker-row hub-row" data-hub-name="${escHtml(r.name)}">
                <div class="docker-row-top">
                  <h3>${escHtml(r.name)} ${warn}</h3>
                  ${official}
                </div>
                <div class="docker-meta">${escHtml(formatPulls(r.pull_count))} pulls · ★ ${escHtml(r.star_count ?? 0)}</div>
                <div class="docker-meta hub-desc">${escHtml((r.description || "").slice(0, 140))}</div>
                <div class="docker-actions">
                  <button type="button" class="dk-btn ghost" data-hub-act="detail">Ver detalles</button>
                  <button type="button" class="dk-btn" data-hub-act="install">Instalar</button>
                </div>
              </div>`;
            })
            .join("")
        : state.dockerHubQuery
          ? `<p class="docker-meta">Sin resultados para “${escHtml(state.dockerHubQuery)}”.</p>`
          : `<p class="docker-meta">Busca imágenes en Docker Hub (ej. redis, nginx, grafana).</p>`;

    const pluginHint = plugin
      ? `<div class="hub-plugin-hint">Plugin compatible: <strong>${escHtml(plugin.name || plugin.id)}</strong>
          <button type="button" class="dk-btn ghost" id="hub-open-plugin">¿Instalar plugin también?</button>
        </div>`
      : "";

    els.dockerBody.innerHTML = `
      <div class="docker-sub hub-browser">
        <form class="hub-search-form" id="hub-search-form">
          <input id="hub-search-input" name="q" placeholder="Buscar en Docker Hub…" value="${escHtml(state.dockerHubQuery)}" autocomplete="off" />
          <button type="submit" class="dk-btn">Buscar</button>
        </form>
        ${pluginHint}
        <div class="docker-summary"><span>Resultados: <strong>${results.length}</strong></span></div>
        ${rows}
      </div>`;

    els.dockerBody.querySelector("#hub-search-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = els.dockerBody.querySelector("#hub-search-input")?.value || "";
      searchDockerHub(q);
    });
    els.dockerBody.querySelector("#hub-open-plugin")?.addEventListener("click", () => {
      toast(`Abre Plugin Manager → ${plugin.id}`);
      closeDockerPanel();
      openPluginsPanel();
    });
    els.dockerBody.querySelectorAll("[data-hub-act]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("[data-hub-name]");
        const name = row?.dataset.hubName;
        if (!name) return;
        if (btn.dataset.hubAct === "detail") {
          openHubDetails(name);
          return;
        }
        if (btn.dataset.hubAct === "install") {
          await openHubDetails(name);
          if (state.dockerHubDetail) startHubWizard("compose");
        }
      });
    });
  }

  function renderHubDetail() {
    const d = state.dockerHubDetail;
    if (state.dockerHubLoading || !d) {
      els.dockerBody.innerHTML = `
        <div class="docker-sub">
          <button type="button" class="dk-btn ghost" data-dk-back>← Hub</button>
          <p class="docker-meta">Cargando detalles…</p>
        </div>`;
      els.dockerBody.querySelector("[data-dk-back]")?.addEventListener("click", () => {
        state.dockerView = "list";
        renderDockerBody();
      });
      return;
    }
    const tags = (d.tags || []).slice(0, 30);
    const tagOpts = tags.length
      ? tags.map((t) => `<option value="${escHtml(t)}">${escHtml(t)}</option>`).join("")
      : `<option value="latest">latest</option>`;
    const warnBlock = d.warning?.needsConfirm
      ? `<div class="hub-warning">${escHtml(d.warning.message || "Imagen desconocida ⚠️")}</div>`
      : "";
    const plugin = d.compatiblePlugin || state.dockerHubCompatible;
    const pluginBlock = plugin
      ? `<div class="hub-plugin-hint">¿Instalar plugin <strong>${escHtml(plugin.name || plugin.id)}</strong> también?
          <button type="button" class="dk-btn ghost" id="hub-detail-plugin">Plugin Manager</button>
        </div>`
      : "";
    const ports = (d.portsHint || []).length
      ? `Puertos típicos: ${d.portsHint.join(", ")}`
      : "Sin hint de puertos conocido";
    const arches = (d.architectures || []).length
      ? d.architectures.join(", ")
      : "—";

    els.dockerBody.innerHTML = `
      <div class="docker-sub hub-detail">
        <button type="button" class="dk-btn ghost" data-dk-back>← Hub</button>
        <h3 style="margin:8px 0 0">${escHtml(d.name)} ${d.is_official ? '<span class="docker-badge official">Oficial</span>' : ""}</h3>
        ${warnBlock}
        <div class="docker-meta">${escHtml(formatPulls(d.pull_count))} pulls · ★ ${escHtml(d.star_count ?? 0)} · ${escHtml(d.user || d.namespace || "")}</div>
        <p class="hub-desc">${escHtml((d.description || "").slice(0, 280))}</p>
        <div class="docker-meta">${escHtml(ports)} · Arch: ${escHtml(arches)}</div>
        <label class="hub-field">Tag
          <select id="hub-tag-select">${tagOpts}</select>
        </label>
        ${pluginBlock}
        <div class="docker-actions" style="margin-top:12px">
          <button type="button" class="dk-btn" id="hub-wizard-compose">Crear Compose →</button>
          <button type="button" class="dk-btn ghost" id="hub-wizard-container">Crear contenedor →</button>
          <button type="button" class="dk-btn ghost" id="hub-save-tpl">Guardar plantilla</button>
          <button type="button" class="dk-btn ghost" data-dk-back>Cancelar</button>
        </div>
      </div>`;

    const back = () => {
      state.dockerView = "list";
      state.dockerHubDetail = null;
      renderDockerBody();
    };
    els.dockerBody.querySelectorAll("[data-dk-back]").forEach((b) =>
      b.addEventListener("click", back)
    );
    els.dockerBody.querySelector("#hub-detail-plugin")?.addEventListener("click", () => {
      toast(`Plugin Manager → ${plugin.id}`);
      closeDockerPanel();
      openPluginsPanel();
    });
    const applyTag = () => {
      const tag = els.dockerBody.querySelector("#hub-tag-select")?.value || "latest";
      if (state.dockerHubDetail) state.dockerHubDetail._selectedTag = tag;
    };
    els.dockerBody.querySelector("#hub-tag-select")?.addEventListener("change", applyTag);
    applyTag();
    els.dockerBody.querySelector("#hub-wizard-compose")?.addEventListener("click", () => {
      applyTag();
      const tag = state.dockerHubDetail._selectedTag || "latest";
      state.dockerHubDetail = { ...state.dockerHubDetail, tags: [tag, ...(state.dockerHubDetail.tags || [])] };
      startHubWizard("compose");
    });
    els.dockerBody.querySelector("#hub-wizard-container")?.addEventListener("click", () => {
      applyTag();
      toast("BMO instala vía Compose (recomendado). Abriendo asistente…");
      startHubWizard("compose");
    });
    els.dockerBody.querySelector("#hub-save-tpl")?.addEventListener("click", async () => {
      applyTag();
      const tag = state.dockerHubDetail._selectedTag || "latest";
      const image = `${d.name}:${tag}`;
      const w = hubDefaultWizard(d);
      try {
        await api("/api/docker/hub/save-template", {
          method: "POST",
          body: JSON.stringify({
            name: w.name,
            image,
            ports: w.ports,
            volumes: w.useVolume
              ? [{ name: w.volumeName, mount: w.volumeMount }]
              : [],
            description: d.description || `Hub: ${image}`,
          }),
        });
        toast("Plantilla BMO guardada");
      } catch (err) {
        toast(err.message || "Error al guardar plantilla");
      }
    });
  }

  function renderHubWizard() {
    const w = state.dockerHubWizard;
    const step = state.dockerHubWizardStep || 0;
    const steps = ["Nombre", "Imagen", "Puertos", "Volumen", "Variables", "Resumen"];
    if (!w) {
      state.dockerView = "list";
      renderDockerBody();
      return;
    }

    let body = "";
    if (step === 0) {
      body = `<label class="hub-field">Nombre del stack
        <input id="hub-w-name" value="${escHtml(w.name)}" /></label>`;
    } else if (step === 1) {
      body = `<label class="hub-field">Imagen:tag
        <input id="hub-w-image" value="${escHtml(w.image)}" /></label>
        <p class="docker-meta">Se generará un compose.yaml (no docker run).</p>`;
    } else if (step === 2) {
      body = `<label class="hub-field">Puertos (host:container, uno por línea)
        <textarea id="hub-w-ports" rows="3">${escHtml((w.ports || []).join("\n"))}</textarea></label>
        <p class="docker-meta">Ej. 16379:6379 para no chocar con servicios locales.</p>`;
    } else if (step === 3) {
      body = `
        <label class="hub-check"><input type="checkbox" id="hub-w-usevol" ${w.useVolume ? "checked" : ""}/> Usar volumen nombrado</label>
        <label class="hub-field">Nombre volumen<input id="hub-w-volname" value="${escHtml(w.volumeName)}" /></label>
        <label class="hub-field">Mount path<input id="hub-w-volmount" value="${escHtml(w.volumeMount)}" /></label>`;
    } else if (step === 4) {
      body = `<label class="hub-field">Variables (KEY=VAL, una por línea)
        <textarea id="hub-w-env" rows="4">${escHtml(w.envText || "")}</textarea></label>`;
    } else {
      const ports = (w.ports || []).join(", ") || "(ninguno)";
      body = `
        <div class="hub-summary">
          <div><strong>Nombre:</strong> ${escHtml(w.name)}</div>
          <div><strong>Imagen:</strong> ${escHtml(w.image)}</div>
          <div><strong>Puertos:</strong> ${escHtml(ports)}</div>
          <div><strong>Volumen:</strong> ${w.useVolume ? escHtml(`${w.volumeName} → ${w.volumeMount}`) : "—"}</div>
          <div><strong>Deploy:</strong> ${w.deploy ? "sí (up -d)" : "solo crear archivos"}</div>
        </div>
        <label class="hub-check"><input type="checkbox" id="hub-w-deploy" ${w.deploy ? "checked" : ""}/> Desplegar ahora</label>
        <label class="hub-check"><input type="checkbox" id="hub-w-savetpl" ${w.saveTemplate ? "checked" : ""}/> ¿Guardar como plantilla BMO?</label>
        <p class="docker-meta">Path: docker/stacks/&lt;name&gt;/compose.yaml</p>`;
    }

    els.dockerBody.innerHTML = `
      <div class="docker-sub hub-wizard">
        <button type="button" class="dk-btn ghost" data-dk-cancel>← Cancelar</button>
        <h3 style="margin:8px 0">Asistente · ${escHtml(steps[step])}</h3>
        <div class="hub-steps">${steps
          .map(
            (s, i) =>
              `<span class="hub-step ${i === step ? "active" : i < step ? "done" : ""}">${i + 1}. ${escHtml(s)}</span>`
          )
          .join("")}</div>
        ${body}
        <div class="docker-actions" style="margin-top:14px">
          ${step > 0 ? `<button type="button" class="dk-btn ghost" id="hub-w-prev">Atrás</button>` : ""}
          ${
            step < steps.length - 1
              ? `<button type="button" class="dk-btn" id="hub-w-next">Siguiente</button>`
              : `<button type="button" class="dk-btn" id="hub-w-deploy-btn">Deploy</button>`
          }
        </div>
      </div>`;

    const readStep = () => {
      if (step === 0) w.name = els.dockerBody.querySelector("#hub-w-name")?.value?.trim() || w.name;
      if (step === 1) w.image = els.dockerBody.querySelector("#hub-w-image")?.value?.trim() || w.image;
      if (step === 2) {
        w.ports = String(els.dockerBody.querySelector("#hub-w-ports")?.value || "")
          .split(/\n|,/)
          .map((p) => p.trim())
          .filter(Boolean);
      }
      if (step === 3) {
        w.useVolume = !!els.dockerBody.querySelector("#hub-w-usevol")?.checked;
        w.volumeName = els.dockerBody.querySelector("#hub-w-volname")?.value?.trim() || w.volumeName;
        w.volumeMount = els.dockerBody.querySelector("#hub-w-volmount")?.value?.trim() || w.volumeMount;
      }
      if (step === 4) w.envText = els.dockerBody.querySelector("#hub-w-env")?.value || "";
      if (step === 5) {
        w.deploy = !!els.dockerBody.querySelector("#hub-w-deploy")?.checked;
        w.saveTemplate = !!els.dockerBody.querySelector("#hub-w-savetpl")?.checked;
      }
    };

    els.dockerBody.querySelector("[data-dk-cancel]")?.addEventListener("click", () => {
      state.dockerHubWizard = null;
      state.dockerView = state.dockerHubDetail ? "hub-detail" : "list";
      renderDockerBody();
    });
    els.dockerBody.querySelector("#hub-w-prev")?.addEventListener("click", () => {
      readStep();
      state.dockerHubWizardStep = Math.max(0, step - 1);
      renderDockerBody();
    });
    els.dockerBody.querySelector("#hub-w-next")?.addEventListener("click", () => {
      readStep();
      if (step === 0 && !w.name) {
        toast("Nombre requerido");
        return;
      }
      if (step === 1 && !w.image) {
        toast("Imagen requerida");
        return;
      }
      state.dockerHubWizardStep = Math.min(steps.length - 1, step + 1);
      renderDockerBody();
    });
    els.dockerBody.querySelector("#hub-w-deploy-btn")?.addEventListener("click", async () => {
      readStep();
      const detailWarn = state.dockerHubDetail?.warning;
      if (detailWarn?.needsConfirm && !state.dockerHubAllowUntrusted) {
        if (!(await confirmUntrustedImage(detailWarn))) {
          toast("Deploy cancelado");
          return;
        }
        state.dockerHubAllowUntrusted = true;
      }
      const body = {
        image: w.image,
        name: w.name,
        ports: w.ports || [],
        volumes: w.useVolume
          ? [{ name: w.volumeName, mount: w.volumeMount }]
          : [],
        env: parseEnvText(w.envText),
        deploy: !!w.deploy,
        allowUntrusted: !!state.dockerHubAllowUntrusted,
      };
      try {
        toast(w.deploy ? "Desplegando stack…" : "Creando stack…");
        const result = await api("/api/docker/hub/install", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (w.saveTemplate) {
          try {
            await api("/api/docker/hub/save-template", {
              method: "POST",
              body: JSON.stringify({
                name: w.name,
                image: w.image,
                ports: w.ports,
                volumes: body.volumes,
                env: body.env,
              }),
            });
          } catch {
            /* non-fatal */
          }
        }
        toast(
          result.deployed
            ? `Stack ${result.stack?.id || w.name} en marcha`
            : `Stack ${result.stack?.id || w.name} creado`
        );
        const plugin = result.compatiblePlugin || state.dockerHubCompatible;
        if (plugin) {
          toast(`Plugin compatible: ${plugin.name || plugin.id} (Plugin Manager)`);
        }
        state.dockerHubWizard = null;
        state.dockerTab = "compose";
        state.dockerView = "list";
        document.querySelectorAll("[data-docker-tab]").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.dockerTab === "compose");
        });
        await refreshDockerStacks();
        renderDockerBody();
      } catch (err) {
        if (err.code === "UNTRUSTED_IMAGE" || /no oficial|untrusted|desconocida/i.test(err.message || "")) {
          const warn = err.payload?.warning || detailWarn || {
            needsConfirm: true,
            message: err.message,
          };
          if (await confirmUntrustedImage(warn)) {
            state.dockerHubAllowUntrusted = true;
            body.allowUntrusted = true;
            try {
              toast("Reintentando con permiso…");
              const result = await api("/api/docker/hub/install", {
                method: "POST",
                body: JSON.stringify(body),
              });
              toast(
                result.deployed
                  ? `Stack ${result.stack?.id || w.name} en marcha`
                  : `Stack ${result.stack?.id || w.name} creado`
              );
              state.dockerHubWizard = null;
              state.dockerTab = "compose";
              state.dockerView = "list";
              document.querySelectorAll("[data-docker-tab]").forEach((btn) => {
                btn.classList.toggle("active", btn.dataset.dockerTab === "compose");
              });
              await refreshDockerStacks();
              renderDockerBody();
            } catch (err2) {
              toast(err2.message || "Error al instalar");
            }
            return;
          }
        }
        toast(err.message || "Error al instalar");
      }
    });
  }

  function renderDockerBody() {
    if (!els.dockerBody) return;
    const view = state.dockerView;

    if (state.dockerTab === "hub") {
      if (view === "hub-detail") {
        renderHubDetail();
        return;
      }
      if (view === "hub-wizard") {
        renderHubWizard();
        return;
      }
      renderHubSearch();
      return;
    }

    if (state.dockerTab === "backup") {
      renderBackupPanel();
      return;
    }

    if (state.dockerTab === "updates") {
      renderUpdatesPanel();
      return;
    }

    if (state.dockerTab === "security") {
      renderSecurityPanel();
      return;
    }

    if (state.dockerTab === "compose") {
      if (view === "stack-new") {
        renderStackNewChooser();
        return;
      }
      if (view === "tpl-gallery") {
        renderTemplateGallery();
        return;
      }
      if (view === "tpl-config") {
        renderTemplateConfig();
        return;
      }
      if (view === "stack-create" || view === "stack-edit") {
        renderStackEditor(view === "stack-edit" ? "edit" : "create");
        return;
      }
      if (view === "stack-logs" || view === "stack-status") {
        renderStackDetail();
        return;
      }
      renderStacksList();
      return;
    }

    if (state.dockerTab === "images") {
      renderImagesList();
      return;
    }
    if (state.dockerTab === "volumes") {
      renderVolumesList();
      return;
    }
    if (state.dockerTab === "networks") {
      renderNetworksList();
      return;
    }

    if (view === "create") {
      els.dockerBody.innerHTML = `
        <div class="docker-sub">
          <button type="button" class="dk-btn ghost" data-dk-back>← Lista</button>
          <h3 style="margin:0">Crear contenedor</h3>
          <form class="docker-form" id="dk-create-form">
            <label>Nombre<input name="name" placeholder="bmo-test" required /></label>
            <label>Imagen<input name="image" value="alpine:latest" required /></label>
            <label>Comando<input name="cmd" value="sleep 3600" placeholder="sleep 3600" /></label>
            <label>Puertos (host:container)<input name="ports" placeholder="8080:80" /></label>
            <label>Env (KEY=VAL, separados por coma)<input name="env" placeholder="FOO=bar" /></label>
            <label>Restart policy
              <select name="restart">
                <option value="no">no</option>
                <option value="unless-stopped" selected>unless-stopped</option>
                <option value="always">always</option>
                <option value="on-failure">on-failure</option>
              </select>
            </label>
            <button type="submit" class="dk-btn">Crear e iniciar</button>
          </form>
        </div>`;
      els.dockerBody.querySelector("[data-dk-back]")?.addEventListener("click", () => {
        state.dockerView = "list";
        renderDockerBody();
      });
      els.dockerBody.querySelector("#dk-create-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const cmdStr = String(fd.get("cmd") || "").trim();
        const portsStr = String(fd.get("ports") || "").trim();
        const envStr = String(fd.get("env") || "").trim();
        const body = {
          name: String(fd.get("name") || "").trim(),
          Image: String(fd.get("image") || "").trim(),
          Cmd: cmdStr ? cmdStr.split(/\s+/) : undefined,
          ports: portsStr ? portsStr.split(",").map((p) => p.trim()).filter(Boolean) : [],
          Env: envStr ? envStr.split(",").map((x) => x.trim()).filter(Boolean) : [],
          HostConfig: { RestartPolicy: { Name: String(fd.get("restart") || "no") } },
          start: true,
        };
        try {
          toast("Creando contenedor…");
          await api("/api/docker/containers", { method: "POST", body: JSON.stringify(body) });
          toast("Contenedor creado");
          state.dockerView = "list";
          await refreshDockerContainers();
        } catch (err) {
          toast(err.message || "Error al crear");
        }
      });
      return;
    }

    if (view === "logs" || view === "stats" || view === "console") {
      const c = dockerFocus();
      const title = c ? `${c.name || c.id}` : state.dockerFocusId;
      let inner = "";
      if (view === "logs") {
        inner = `<p class="docker-meta">Logs (tail + refresh 4s). SSE: /logs?stream=1</p><pre>${escHtml(state.dockerLogs || "(sin logs)")}</pre>`;
      } else if (view === "stats") {
        const st = state.dockerStatsMap[c?.id] || state.dockerStatsMap[c?.name] || null;
        inner = st
          ? `<div class="docker-stats-grid">
              <div class="docker-stat"><span>CPU</span><strong>${escHtml(st.cpuPercent)}%</strong></div>
              <div class="docker-stat"><span>MEM</span><strong>${escHtml(st.memPercent)}%</strong></div>
              <div class="docker-stat"><span>Uso MEM</span><strong>${escHtml(st.memUsage)}</strong></div>
              <div class="docker-stat"><span>NET</span><strong>${escHtml(st.netIO)}</strong></div>
            </div>`
          : `<p class="docker-meta">Sin estadísticas (¿está parado?)</p>`;
      } else {
        inner = `
          <div class="docker-term-toolbar">
            <span id="dk-term-status" class="docker-term-status">Preparando…</span>
            <div class="docker-term-actions">
              <button type="button" class="dk-btn ghost" id="dk-term-reconnect">Reconectar</button>
              <button type="button" class="dk-btn ghost" id="dk-term-disconnect">Cerrar</button>
            </div>
          </div>
          <div id="dk-xterm" class="docker-xterm" role="region" aria-label="Consola del contenedor"></div>
          <p class="docker-meta">Terminal interactiva (WebSocket). Escribe <code>exit</code> o pulsa Cerrar.</p>`;
      }
      els.dockerBody.innerHTML = `
        <div class="docker-sub docker-sub-term">
          <button type="button" class="dk-btn ghost" data-dk-back>← Lista</button>
          <h3 style="margin:0">${escHtml(view.toUpperCase())} · ${escHtml(title)}</h3>
          ${inner}
        </div>`;
      els.dockerBody.querySelector("[data-dk-back]")?.addEventListener("click", () => {
        destroyDockerTerminal();
        state.dockerView = "list";
        state.dockerFocusId = null;
        renderDockerBody();
      });
      if (view === "console") {
        els.dockerBody.querySelector("#dk-term-reconnect")?.addEventListener("click", () => {
          if (state.dockerFocusId) connectDockerTerminal(state.dockerFocusId);
        });
        els.dockerBody.querySelector("#dk-term-disconnect")?.addEventListener("click", () => {
          destroyDockerTerminal();
          setDockerTermStatus("Cerrada", "warn");
        });
        // Montar xterm tras pintar el DOM
        requestAnimationFrame(() => {
          if (state.dockerFocusId && state.dockerView === "console") {
            connectDockerTerminal(state.dockerFocusId);
          }
        });
      }
      return;
    }

    const list = state.dockerContainers || [];
    const online = state.docker?.docker === "online";
    const rows = list.length
      ? list
          .map((c) => {
            const st = state.dockerStatsMap[c.id] || state.dockerStatsMap[c.name];
            const running = c.state === "running";
            const statsLine = st
              ? `CPU ${st.cpuPercent}% · MEM ${st.memPercent}%`
              : running
                ? "stats…"
                : "—";
            return `
              <div class="docker-row" data-id="${escHtml(c.id)}">
                <div class="docker-row-top">
                  <h3>${escHtml(c.name || c.id)}</h3>
                  <span class="docker-badge ${escHtml(c.state || "unknown")}">${escHtml(c.state || "?")}</span>
                </div>
                <div class="docker-meta">${escHtml(c.image)} · ${escHtml(c.status)} · ${escHtml(statsLine)}</div>
                <div class="docker-actions">
                  ${running ? "" : `<button type="button" class="dk-btn" data-act="start">Start</button>`}
                  ${running ? `<button type="button" class="dk-btn" data-act="stop">Stop</button>` : ""}
                  <button type="button" class="dk-btn" data-act="restart">Restart</button>
                  <button type="button" class="dk-btn ghost" data-act="logs">Logs</button>
                  <button type="button" class="dk-btn ghost" data-act="stats">Stats</button>
                  <button type="button" class="dk-btn ghost" data-act="console">Consola</button>
                  <button type="button" class="dk-btn danger" data-act="delete">Delete</button>
                </div>
              </div>`;
          })
          .join("")
      : `<p class="docker-meta">No hay contenedores.</p>`;

    els.dockerBody.innerHTML = `
      <div class="docker-summary">
        <span>Engine: <strong>${online ? "online" : "offline"}</strong></span>
        <span>Total: <strong>${list.length}</strong></span>
        <span>Running: <strong>${list.filter((c) => c.state === "running").length}</strong></span>
      </div>
      ${rows}`;

    els.dockerBody.querySelectorAll(".docker-row").forEach((row) => {
      const id = row.dataset.id;
      row.querySelectorAll("[data-act]").forEach((btn) => {
        btn.addEventListener("click", () => handleDockerAction(id, btn.dataset.act));
      });
    });
  }

  async function handleDockerAction(id, act) {
    const c = state.dockerContainers.find((x) => x.id === id);
    try {
      if (act === "start" || act === "stop" || act === "restart") {
        toast(`${act}…`);
        await api(`/api/docker/containers/${encodeURIComponent(id)}/${act}`, {
          method: "POST",
          body: "{}",
        });
        await refreshDockerContainers();
        toast(`OK: ${act}`);
        return;
      }
      if (act === "delete") {
        if (c?.protected) {
          toast(`Protegido: ${c.name}. No se elimina desde la UI.`);
          return;
        }
        if (!(await askConfirm(`¿Eliminar contenedor ${c?.name || id}?`))) return;
        const force = c?.state === "running";
        await api(`/api/docker/containers/${encodeURIComponent(id)}${force ? "?force=true" : ""}`, {
          method: "DELETE",
        });
        toast("Eliminado");
        await refreshDockerContainers();
        return;
      }
      if (act === "logs") {
        const data = await api(`/api/docker/containers/${encodeURIComponent(id)}/logs?tail=150`);
        state.dockerFocusId = id;
        state.dockerLogs = data.logs || "";
        state.dockerView = "logs";
        renderDockerBody();
        return;
      }
      if (act === "stats") {
        const data = await api(`/api/docker/containers/${encodeURIComponent(id)}/stats`);
        state.dockerStatsMap[id] = data;
        if (data.name) state.dockerStatsMap[data.name] = data;
        state.dockerFocusId = id;
        state.dockerView = "stats";
        renderDockerBody();
        return;
      }
      if (act === "console") {
        destroyDockerTerminal();
        state.dockerFocusId = id;
        state.dockerConsoleOut = "";
        state.dockerView = "console";
        renderDockerBody();
      }
    } catch (err) {
      toast(err.message || "Error Docker");
    }
  }

  async function openDockerPanel() {
    if (!els.dockerPanel || !els.dockerBody) {
      toast("Panel Docker no cargado — recarga la página");
      return;
    }
    closeSysHub();
    closeDevicesPanel();
    closeSpotifyPanel();
    closePerfPanel();
    closeMonitorPanel();
    closeAlertsPanel();
    closeEventsPanel();
    setAppNav("servicios", { keepPanels: true });
    state.dockerView = "list";
    state.dockerTab = normalizeDockerTab(state.dockerTab || "containers");
    document.querySelectorAll("[data-docker-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.dockerTab === state.dockerTab);
    });
    els.dockerPanel.hidden = false;
    toast("Abriendo Docker…");
    try {
      await refreshCurrentDockerTab();
      renderDockerBody();
    } catch (err) {
      toast(err.message || "Error Docker");
    }
    stopDockerPolling();
    state.dockerTimer = setInterval(() => {
      if (state.dockerView !== "list") return;
      refreshCurrentDockerTab().catch(() => {});
    }, 8000);
  }

  els.dockerBack?.addEventListener("click", () => {
    closeDockerPanel();
    setAppNav("servicios");
  });
  els.dockerRefresh?.addEventListener("click", () => {
    refreshCurrentDockerTab()
      .then(() => {
        renderDockerBody();
        toast("Docker actualizado");
      })
      .catch((err) => toast(err.message || "Error"));
  });
  els.dockerCreateBtn?.addEventListener("click", () => {
    if (state.dockerTab === "compose") {
      state.dockerTplSelected = null;
      state.dockerTplValues = {};
      state.dockerTplPreview = "";
      state.dockerView = "stack-new";
      refreshDockerStacks()
        .catch(() => {})
        .finally(() => renderDockerBody());
      return;
    }
    if (state.dockerTab === "hub") {
      const input = els.dockerBody?.querySelector("#hub-search-input");
      if (input) input.focus();
      else {
        state.dockerView = "list";
        renderDockerBody();
      }
      return;
    }
    if (state.dockerTab === "backup") {
      els.dockerBody?.querySelector("[data-bak-create]")?.click();
      return;
    }
    if (state.dockerTab !== "containers") {
      toast("Crear solo en Container, Compose, Hub o Backup");
      return;
    }
    state.dockerView = "create";
    renderDockerBody();
  });
  document.querySelectorAll("[data-docker-tab]").forEach((btn) => {
    btn.addEventListener("click", () => setDockerTab(btn.dataset.dockerTab));
  });
  els.dockerPanel?.addEventListener("click", (e) => {
    if (e.target === els.dockerPanel) {
      closeDockerPanel();
      setAppNav("servicios");
    }
  });

  function parseUsage(text) {
    if (typeof text === "number" && Number.isFinite(text)) {
      return Math.round(text * 10) / 10;
    }
    if (!text || text === "N/A") return null;
    const norm = String(text).replace(",", ".").replace(/\s+/g, " ").trim();
    // Acepta: 1.3Gi / 7.9Gi | 11G / 117G | 1.3GiB / 7.9GiB
    const m = norm.match(
      /([\d.]+)\s*([KMGTPE]i?B?)?\s*\/\s*([\d.]+)\s*([KMGTPE]i?B?)?/i
    );
    if (!m) return null;
    const toGi = (n, u) => {
      const unit = String(u || "G").toUpperCase();
      const val = Number(n);
      if (!Number.isFinite(val)) return 0;
      if (unit.startsWith("T")) return val * 1024;
      if (unit.startsWith("G")) return val;
      if (unit.startsWith("M")) return val / 1024;
      if (unit.startsWith("K")) return val / (1024 * 1024);
      return val;
    };
    const used = toGi(m[1], m[2]);
    const total = toGi(m[3], m[4]);
    if (!total) return null;
    return Math.round((used / total) * 1000) / 10;
  }

  function parseTemp(text) {
    if (!text || text === "N/A") return null;
    const m = String(text).replace(",", ".").match(/([\d.]+)/);
    return m ? Math.round(Number(m[1]) * 10) / 10 : null;
  }

  function formatUptime(seconds) {
    const s = Number(seconds) || 0;
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function pushHistory(id, key, value) {
    if (value == null || Number.isNaN(Number(value))) return;
    const arr = state.history[id][key];
    arr.push(Number(value));
    if (arr.length > 16) arr.shift();
  }

  function sparkline(values, color = "#3da9ff") {
    const w = 90;
    const h = 22;
    const data = values.length ? values : [0, 0];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = Math.max(1, max - min);
    const pts = data
      .map((v, i) => {
        const x = (i / Math.max(1, data.length - 1)) * (w - 2) + 1;
        const y = h - ((v - min) / span) * (h - 4) - 2;
        return `${x},${y}`;
      })
      .join(" ");
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${pts}"/></svg>`;
  }

  function getDevices() {
    const mi = state.devicesApi.find((d) => d.name === "MI-PC") || {
      name: "MI-PC",
      online: false,
      cpu: null,
      ram: null,
      disk: null,
      gpu: null,
      temp: null,
    };

    const sys = state.system || {};
    const bmo = {
      id: "bmo",
      name: "Raspberry Pi 5",
      online: true,
      kind: "pi",
      cpu: typeof sys.cpu === "number" ? sys.cpu : null,
      ram: typeof sys.ramPercent === "number" ? sys.ramPercent : parseUsage(sys.ram),
      disk: typeof sys.diskPercent === "number" ? sys.diskPercent : parseUsage(sys.disk),
      temp: typeof sys.temp === "number" ? sys.temp : parseTemp(sys.cpuTemp),
      ip: sys.ip || BMO_HOST,
      uptime: sys.uptime,
      iconImg: "./assets/raspberry.png",
      statusText: "Funcionando",
    };

    return [
      {
        id: "mi-pc",
        name: "PC Principal",
        online: !!mi.online,
        kind: "windows",
        cpu: mi.cpu,
        ram: mi.ram,
        disk: mi.disk,
        temp: mi.temp ?? null,
        ip: "MI-PC",
        uptime: mi.lastSeen,
        icon: "🖥️",
        statusText: mi.online ? "Online" : "Offline",
        raw: mi,
      },
      bmo,
    ];
  }

  function selectedDevice() {
    return getDevices().find((d) => d.id === state.selectedId) || getDevices()[0];
  }


  state.weatherCity = "Valladolid";

  async function refreshWeather() {
    if (!els.weatherTemp) return;
    try {
      const data = await api("/api/weather");
      const t = typeof data.temp === "number" ? data.temp : null;
      if (t == null) throw new Error("sin temp");
      const shown = Number.isInteger(t) ? String(t) : String(Math.round(t));
      els.weatherTemp.textContent = `${shown}°`;
      if (els.weatherIcon && data.icon) els.weatherIcon.textContent = data.icon;
      state.weatherCity = data.city || "Valladolid";
      state.weatherData = data; // 4.11.5 - para que los widgets puedan leer temp/icon reales
      if (els.weather) {
        els.weather.title = `Clima ${state.weatherCity}${data.observedAt ? " · " + data.observedAt : ""}`;
      }
      renderClock();
      if (state.weatherRetryTimer) {
        clearTimeout(state.weatherRetryTimer);
        state.weatherRetryTimer = null;
      }
    } catch (err) {
      console.warn("weather", err);
      // No esperar los 12 min del intervalo normal si el primer intento
      // falla (p.ej. red no lista aun al arrancar el kiosco) - reintenta
      // antes para no dejar el widget en "--°" mucho rato.
      if (!state.weatherRetryTimer) {
        state.weatherRetryTimer = setTimeout(() => {
          state.weatherRetryTimer = null;
          refreshWeather().catch(() => {});
        }, 30000);
      }
    }
  }

  function renderClock() {
    const now = new Date();
    if (els.clock) {
      els.clock.textContent = now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    if (els.date) {
      const day = now.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
      const dayCap = day.charAt(0).toUpperCase() + day.slice(1);
      const dayNum = now.getDate();
      const mon = now.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
      els.date.textContent = `${dayCap}, ${dayNum} ${mon} · ${state.weatherCity || "Valladolid"}`;
    }
  }

  function serviceCardHtml(s) {
    const running = state.docker?.running ?? "—";
    const online = state.docker?.docker === "online";
    const containers = state.docker?.containers || [];
    const portainerUp = containers.some((c) => String(c.name || "").toLowerCase().includes("portainer"));

    const live = s.live;
    const active = live && state.selectedService === s.id;
    let status = "Pronto";
    let ok = false;
    if (s.id === "docker") {
      status = online ? `${running} contenedores` : "offline";
      ok = online;
    } else if (s.id === "portainer") {
      status = portainerUp ? "cuenta conectada" : "offline";
      ok = portainerUp;
    } else if (s.id === "grafana") {
      const grafanaUp = containers.some((c) =>
        String(c.name || "").toLowerCase().includes("grafana")
      );
      status = grafanaUp ? "cuenta conectada" : "offline";
      ok = grafanaUp;
    } else if (s.id === "prometheus") {
      const promUp = containers.some((c) =>
        String(c.name || "").toLowerCase().includes("prometheus")
      );
      status = promUp ? "cuenta conectada" : "offline";
      ok = promUp;
    } else if (s.id === "spotify") {
      const sp = state.spotify;
      if (!sp) {
        status = "Spotify Connect";
        ok = false;
      } else if (!sp.configured) {
        status = "falta Client ID";
        ok = false;
      } else if (!sp.connected) {
        status = "conectar cuenta";
        ok = false;
      } else {
        status = sp.playing ? "reproduciendo" : "listo";
        ok = true;
      }
    } else if (s.id === "pokemon") {
      status = "listo";
      ok = true;
    }
    const ico = s.iconImg
      ? `<div class="service-ico img-wrap"><img src="${s.iconImg}" alt="${s.name}" /></div>`
      : `<div class="service-ico" style="background:${s.color}">${s.icon}</div>`;
    // 4.16.19 - Favoritos, solo marcables en modo reordenar (donde el tap
    // normal de la tarjeta ya esta suprimido) - fuera de ese modo el
    // efecto real es que los favoritos salen primero (sortFavoritesFirst),
    // no hace falta un badge permanente para eso.
    const isFav = (state.serviceFavorites || []).includes(s.id);
    const favStar = reorderState.active
      ? `<span class="service-fav-star${isFav ? " active" : ""}" data-fav-toggle="${s.id}">${isFav ? "⭐" : "☆"}</span>`
      : "";
    return `
      <button class="service-card ${live ? "live" : "soon"} ${active ? "active" : ""}" data-service="${s.id}" ${live ? "" : "disabled"} type="button">
        ${favStar}
        ${ico}
        <h3>${s.name}</h3>
        <div class="status-line"><span class="dot ${ok || !live ? "" : "off"}"></span><span>${status}</span></div>
      </button>`;
  }

  function toggleServiceFavorite(id) {
    const set = new Set(state.serviceFavorites || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const ids = [...set];
    state.serviceFavorites = ids;
    sortFavoritesFirst();
    renderServices();
    api("/api/ui/favorites/services", { method: "PUT", body: JSON.stringify({ ids }) }).catch((err) =>
      toast(err.message || "Error guardando favorito")
    );
  }

  function sortFavoritesFirst() {
    const favSet = new Set(state.serviceFavorites || []);
    if (!favSet.size) return;
    services.sort((a, b) => (favSet.has(b.id) ? 1 : 0) - (favSet.has(a.id) ? 1 : 0));
  }

  function bindServiceCardClicks(container) {
    container.querySelectorAll("[data-fav-toggle]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleServiceFavorite(el.getAttribute("data-fav-toggle"));
      });
    });
    container.querySelectorAll(".service-card.live").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.reorderingServices) return;
        const id = btn.dataset.service;
        const svc = services.find((s) => s.id === id);
        state.selectedService = id;
        renderServices();

        if (svc?.href) {
          setAppNav("servicios", { keepPanels: true });
          toast(`Conectando con ${svc.name}…`);
          openServiceFrame(svc.name, svc.href);
          return;
        }

        if (id === "spotify") {
          openSpotifyPanel().catch((err) => toast(err.message || "Error Spotify"));
          return;
        }

        if (id === "docker") {
          openDockerPanel().catch((err) => toast(err.message || "Error Docker"));
          return;
        }

        if (id === "pokemon") {
          openPokemonHomePanel().catch((err) => toast(err.message || "Error Pokémon"));
        }
      });
    });
  }

  // —— Páginas horizontales de servicios 4.11.3 ——
  // En modo reordenar (4.11.2) se muestra una unica grid plana en
  // #services-grid, para poder arrastrar tarjetas libremente sin la
  // complejidad de arrastrar entre paginas. Fuera de modo reordenar, se usa
  // el paginador con swipe (#services-pager). Deliberadamente NO se persiste
  // la pagina actual - es posicion de navegacion efimera, no una preferencia.
  // 4.16.3 - 9 por pagina (grid 3x3 real), antes 6 (3x2) - el grid ya era de
  // 3 columnas desde 4.11.3, solo hacia falta esta constante.
  const SERVICES_PER_PAGE = 9;
  let servicesPageIndex = 0;

  function goToServicesPage(index) {
    const track = els.servicesPagesTrack;
    if (!track || !track.children.length) return;
    servicesPageIndex = Math.max(0, Math.min(index, track.children.length - 1));
    track.style.transform = `translateX(-${servicesPageIndex * 100}%)`;
    els.servicesPagerDots?.querySelectorAll(".services-pager-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === servicesPageIndex);
    });
  }

  let servicesSwipeStart = null;
  function bindServicesSwipe() {
    const pager = els.servicesPager;
    if (!pager || pager.dataset.swipeBound) return;
    pager.dataset.swipeBound = "1"; // enlazar una sola vez; el track se re-renderiza, el pager no
    pager.addEventListener("pointerdown", (e) => {
      servicesSwipeStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    pager.addEventListener("pointerup", (e) => {
      if (!servicesSwipeStart || servicesSwipeStart.id !== e.pointerId) return;
      const dx = e.clientX - servicesSwipeStart.x;
      const dy = e.clientY - servicesSwipeStart.y;
      servicesSwipeStart = null;
      // umbral minimo + debe ser mas horizontal que vertical, para no
      // confundir un swipe de pagina con un scroll vertical accidental
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      goToServicesPage(dx < 0 ? servicesPageIndex + 1 : servicesPageIndex - 1);
    });
    pager.addEventListener("pointercancel", () => {
      servicesSwipeStart = null;
    });
  }

  function renderServices() {
    const cardsHtml = services.map(serviceCardHtml);

    if (reorderState.active) {
      if (els.servicesPager) els.servicesPager.hidden = true;
      if (els.servicesPagerDots) els.servicesPagerDots.hidden = true;
      if (els.services) {
        els.services.hidden = false;
        els.services.innerHTML = cardsHtml.join("");
        bindServiceCardClicks(els.services);
      }
      bindServiceDrag();
      return;
    }

    if (els.services) els.services.hidden = true;
    if (!els.servicesPager || !els.servicesPagesTrack) return;
    els.servicesPager.hidden = false;

    const pages = [];
    for (let i = 0; i < cardsHtml.length; i += SERVICES_PER_PAGE) {
      pages.push(cardsHtml.slice(i, i + SERVICES_PER_PAGE));
    }
    if (!pages.length) pages.push([]);
    if (servicesPageIndex >= pages.length) servicesPageIndex = pages.length - 1;

    els.servicesPagesTrack.innerHTML = pages
      .map((page) => `<div class="services-page">${page.join("")}</div>`)
      .join("");
    els.servicesPagesTrack.style.transform = `translateX(-${servicesPageIndex * 100}%)`;

    if (els.servicesPagerDots) {
      els.servicesPagerDots.hidden = pages.length <= 1;
      els.servicesPagerDots.innerHTML =
        pages.length > 1
          ? pages
              .map((_, i) => `<span class="services-pager-dot ${i === servicesPageIndex ? "active" : ""}"></span>`)
              .join("")
          : "";
    }

    bindServiceCardClicks(els.servicesPagesTrack);
    bindServicesSwipe();
  }

  // —— Ordenar Servicios 4.11.2 ——
  // Solo se persiste el ORDEN (array de ids); los datos de cada servicio
  // (nombre/color/icono/href) siguen viviendo en el array `services` de
  // arriba, definido en codigo. Reordenar mueve elementos del mismo array
  // en memoria, no reconstruye los objetos.
  function applyServiceOrder(order) {
    if (!Array.isArray(order) || !order.length) return;
    const byId = new Map(services.map((s) => [s.id, s]));
    const ordered = [];
    for (const id of order) {
      const s = byId.get(id);
      if (s) {
        ordered.push(s);
        byId.delete(id);
      }
    }
    // servicios nuevos que no estaban en el orden guardado (p.ej. anadidos
    // en una actualizacion posterior) se anaden al final, en su orden original
    for (const s of services) {
      if (byId.has(s.id)) ordered.push(s);
    }
    services.length = 0;
    services.push(...ordered);
  }

  const reorderState = { active: false, dragEl: null };

  function persistServiceOrderFromDom() {
    const ids = [...els.services.querySelectorAll(".service-card")].map((el) => el.dataset.service);
    applyServiceOrder(ids);
    api("/api/ui/services-order", { method: "PUT", body: JSON.stringify({ order: ids }) }).catch(() => {});
  }

  function toggleServiceReorder() {
    if (!reorderState.active && !requireEditUnlocked()) return; // solo protege al ENTRAR, salir siempre funciona
    reorderState.active = !reorderState.active;
    state.reorderingServices = reorderState.active;
    els.services?.classList.toggle("reordering", reorderState.active);
    const btn = document.getElementById("services-reorder-btn");
    if (btn) btn.textContent = reorderState.active ? "Listo" : "Reordenar";
    if (reorderState.active) {
      renderServices(); // pasa de paginado a grid plana
    } else {
      persistServiceOrderFromDom();
      servicesPageIndex = 0;
      renderServices(); // vuelve al paginado, desde la primera pagina
    }
  }

  function getCardAfter(container, y) {
    const cards = [...container.querySelectorAll(".service-card:not(.dragging)")];
    return cards.reduce(
      (closest, card) => {
        const box = card.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: card };
        return closest;
      },
      { offset: -Infinity, element: null }
    ).element;
  }

  function bindServiceDrag() {
    if (!els.services) return;
    els.services.querySelectorAll(".service-card").forEach((card) => {
      card.addEventListener("pointerdown", (e) => {
        if (!reorderState.active) return;
        e.preventDefault();
        card.setPointerCapture(e.pointerId);
        reorderState.dragEl = card;
        card.classList.add("dragging");
      });
      card.addEventListener("pointermove", (e) => {
        if (reorderState.dragEl !== card) return;
        const after = getCardAfter(els.services, e.clientY);
        if (after == null) els.services.appendChild(card);
        else els.services.insertBefore(card, after);
      });
      const endDrag = () => {
        if (reorderState.dragEl !== card) return;
        card.classList.remove("dragging");
        reorderState.dragEl = null;
      };
      card.addEventListener("pointerup", endDrag);
      card.addEventListener("pointercancel", endDrag);
    });
  }

  document.getElementById("services-reorder-btn")?.addEventListener("click", toggleServiceReorder);

  function metricLevel(kind, key, value) {
    if (value == null || Number.isNaN(Number(value))) return "unknown";
    const v = Number(value);
    // Umbrales orientativos por tipo de dispositivo
    const high = {
      windows: { cpu: 85, ram: 85, disk: 90, extra: 85 }, // extra = temp °C
      pi: { cpu: 80, ram: 85, disk: 90, extra: 75 },
    };
    const warn = {
      windows: { cpu: 70, ram: 75, disk: 80, extra: 75 },
      pi: { cpu: 65, ram: 75, disk: 80, extra: 65 },
    };
    const h = (high[kind] || high.windows)[key];
    const w = (warn[kind] || warn.windows)[key];
    if (h == null) return "unknown";
    if (v >= h) return "high";
    if (v >= w) return "warn";
    return "ok";
  }

  function shortCpuModel(model) {
    if (!model) return null;
    let s = String(model)
      .replace(/\(R\)|\(TM\)/gi, "")
      .replace(/AMD\s+/i, "")
      .replace(/Intel\s+/i, "")
      .replace(/\s+\d+-Core Processor/i, "")
      .replace(/\s+Processor$/i, "")
      .replace(/\s+CPU.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    return s || null;
  }

  function shortGpuModel(name) {
    if (!name) return null;
    return String(name)
      .replace(/AMD\s+/i, "")
      .replace(/Radeon\s+/i, "")
      .replace(/\s+/g, " ")
      .trim() || null;
  }

  function formatConnectedAgo(iso) {
    if (!iso) return "sin contacto reciente";
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms)) return "sin contacto reciente";
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 5) return "conectado hace unos segundos";
    if (s < 60) return `conectado hace ${s} segundos`;
    const m = Math.round(s / 60);
    if (m < 60) return `conectado hace ${m} min`;
    const h = Math.round(m / 60);
    if (h < 48) return `conectado hace ${h} h`;
    const d = Math.round(h / 24);
    return `conectado hace ${d} d`;
  }

  function pctOrDash(v) {
    if (v == null || Number.isNaN(Number(v))) return null;
    const n = Number(v);
    return Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString();
  }

  function getMiPcDevice() {
    const list = (state.agentDevices && state.agentDevices.devices) || [];
    const fromAgent =
      list.find((d) => d.id === "mi-pc") ||
      list.find((d) => String(d.name || "").toUpperCase() === "MI-PC");
    if (fromAgent) return fromAgent;

    const snapItems = (state.metricsSnap && state.metricsSnap.devices && state.metricsSnap.devices.items) || [];
    const fromSnap =
      snapItems.find((d) => String(d.name || "").toUpperCase() === "MI-PC") || snapItems[0];
    if (fromSnap) {
      return {
        id: "mi-pc",
        name: fromSnap.name || "MI-PC",
        online: !!fromSnap.online,
        os: fromSnap.os || "Windows 11",
        lastSeen: fromSnap.updatedAt || null,
        cpu: fromSnap.cpu,
        ram: fromSnap.ram,
        disk: fromSnap.disk,
        gpu: fromSnap.gpu_detail?.name || fromSnap.gpu || null,
        cpuTemp: fromSnap.cpu_detail?.temp_c ?? null,
        gpuTemp: fromSnap.gpu_detail?.temp_c ?? fromSnap.gpuTemp ?? null,
        metrics: {
          cpu: fromSnap.cpu_detail || null,
          ram: fromSnap.ram_detail || null,
          gpu: fromSnap.gpu_detail || null,
        },
      };
    }

    const hp = (state.devicesApi || []).find((d) => d.name === "MI-PC");
    if (hp) {
      return {
        id: "mi-pc",
        name: "MI-PC",
        online: !!hp.online,
        os: hp.platform === "Windows" ? "Windows 11" : hp.platform || "Windows",
        lastSeen: hp.lastSeen || null,
        cpu: hp.cpu,
        ram: hp.ram,
        disk: hp.disk,
        gpu: hp.gpu_name || null,
        cpuTemp: null,
        gpuTemp: hp.temp ?? null,
        metrics: { cpu: null, ram: null, gpu: null },
      };
    }
    return {
      id: "mi-pc",
      name: "MI-PC",
      online: false,
      os: "Windows 11",
      lastSeen: null,
      cpu: null,
      ram: null,
      disk: null,
      gpu: null,
      metrics: { cpu: null, ram: null, gpu: null },
    };
  }

  function getHomeDevice(id) {
    const list = (state.agentDevices && state.agentDevices.devices) || [];
    const found = list.find((d) => d.id === id);
    if (found) return found;
    if (id === "mi-pc") return getMiPcDevice();
    const label = { raspberry: "Raspberry (BMO)", android: "Móvil", "linux-ssh": "Linux SSH" }[id] || id;
    return {
      id,
      name: label,
      online: false,
      os: null,
      lastSeen: null,
      cpu: null,
      ram: null,
      disk: null,
      temp: null,
      cpuTemp: null,
      gpuTemp: null,
      gpu: null,
      metrics: { cpu: null, ram: null, gpu: null },
    };
  }

  function cycleHomeDevice(dir) {
    const order = state.homeDeviceOrder || ["mi-pc"];
    const idx = order.indexOf(state.homeDeviceId);
    const next = order[(idx + dir + order.length) % order.length];
    state.homeDeviceId = next;
    renderHome();
  }

  function renderHome() {
    const mi = getHomeDevice(state.homeDeviceId || "mi-pc");
    const cpu = (mi.metrics && mi.metrics.cpu) || {};
    const ram = (mi.metrics && mi.metrics.ram) || {};
    const gpu = (mi.metrics && mi.metrics.gpu) || {};
    const cpuModel = shortCpuModel(cpu.model) || "CPU";
    const gpuModel = shortGpuModel(gpu.name || mi.gpu) || "GPU";
    const cpuPct = pctOrDash(cpu.usage_pct ?? mi.cpu);
    const ramPct = pctOrDash(ram.percent ?? mi.ram);
    const gpuPct = pctOrDash(gpu.usage_pct);
    const cpuTemp = cpu.temp_c ?? mi.cpuTemp;
    const gpuTemp = gpu.temp_c ?? mi.gpuTemp;
    const primaryTemp = cpuTemp ?? gpuTemp ?? mi.temp ?? null;
    const tempSource = cpuTemp != null ? "CPU" : gpuTemp != null ? "GPU" : mi.temp != null ? "Sistema" : null;
    const online = !!mi.online;
    const osLabel = mi.os || "—";
    const ago = formatConnectedAgo(mi.lastSeen);
    const deviceName = mi.name || state.homeDeviceId;

    if (els.homeHero) {
      els.homeHero.innerHTML = `
        <div class="home-hero-status">
          <span class="dot ${online ? "" : "off"}"></span>
          ${escHtml(deviceName)} · ${online ? "online" : "offline"}
        </div>
        <div class="home-device-switch">
          <button type="button" class="hds-arrow" id="home-device-prev" aria-label="Dispositivo anterior">‹</button>
          <h2>${escHtml(deviceName)}</h2>
          <button type="button" class="hds-arrow" id="home-device-next" aria-label="Dispositivo siguiente">›</button>
        </div>
        <p>${escHtml(osLabel)} · ${escHtml(ago)}</p>
        <div class="home-hw-pill">${
          mi.type === "android"
            ? escHtml([mi.manufacturer, mi.model].filter(Boolean).join(" ") || "Android")
            : `${escHtml(cpuModel)} · ${escHtml(gpuModel)}`
        }</div>
      `;
      els.homeHero.querySelector("#home-device-prev")?.addEventListener("click", () => cycleHomeDevice(-1));
      els.homeHero.querySelector("#home-device-next")?.addEventListener("click", () => cycleHomeDevice(1));
    }

    const ramSub =
      ram.used_gb != null && ram.total_gb != null
        ? `${ram.used_gb} GB / ${ram.total_gb} GB`
        : ramPct != null
          ? `${ramPct}% en uso`
          : "sin datos";
    const cpuSub =
      cpuTemp != null
        ? `${escHtml(cpuModel)} · ${pctOrDash(cpuTemp)} °C`
        : escHtml(cpuModel);
    const gpuSub =
      gpuTemp != null
        ? `${escHtml(gpuModel)} · ${pctOrDash(gpuTemp)} °C`
        : escHtml(gpuModel);

    const cards =
      mi.type === "android"
        ? [
            {
              key: "battery",
              value: mi.batteryPct != null ? `${mi.batteryPct}%` : "—",
              bar: mi.batteryPct != null ? Number(mi.batteryPct) : 0,
              sub: mi.batteryCharging ? "Cargando ⚡" : "Batería",
              ico: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 10v4"/></svg>`,
            },
            {
              key: "system",
              value: mi.osVersion ? `Android ${mi.osVersion}` : "Android",
              bar: 0,
              sub: escHtml([mi.manufacturer, mi.model].filter(Boolean).join(" ") || "—"),
              ico: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>`,
            },
          ]
        : [
            {
              key: "cpu",
              value: cpuPct != null ? `${cpuPct}%` : "—",
              bar: Number(cpuPct) || 0,
              sub: cpuSub,
              ico: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2"/></svg>`,
            },
            {
              key: "ram",
              value: ramPct != null ? `${ramPct}%` : "—",
              bar: Number(ramPct) || 0,
              sub: escHtml(ramSub),
              ico: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 7v10M11 7v10M15 7v10M19 10v4"/></svg>`,
            },
            {
              key: "gpu",
              value: gpuPct != null ? `${gpuPct}%` : "—",
              bar: Number(gpuPct) || 0,
              sub: gpuSub,
              ico: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
            },
            {
              key: "temp",
              value: primaryTemp != null ? `${pctOrDash(primaryTemp)}°` : "—",
              bar: primaryTemp != null ? Math.max(0, Math.min(100, Number(primaryTemp))) : 0,
              sub: tempSource || "sin datos",
              ico: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0z"/><path d="M10 8h1"/></svg>`,
            },
          ];

    if (els.homeMetrics) {
      els.homeMetrics.innerHTML = cards
        .map(
          (c) => `<div class="home-metric" data-hm="${c.key}">
          <span class="hm-ico" aria-hidden="true">${c.ico}</span>
          <div class="hm-value">${c.value}</div>
          <div class="hm-sub">${c.sub}</div>
          <div class="home-bar"><span style="width:${Math.max(0, Math.min(100, c.bar))}%"></span></div>
        </div>`
        )
        .join("");
    }

    const dockerOnline = state.docker?.docker === "online";
    const dockerRunning = state.docker?.running;
    const spotifySub = spotifySubText(state.spotify);

    if (els.homeServices) {
      els.homeServices.innerHTML = `
        <button type="button" class="home-svc" data-home-svc="docker">
          <span class="hs-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 9h3v3H8zM12 9h3v3h-3zM16 9h3v3h-3zM8 13h3v3H8zM12 13h3v3h-3z"/><path d="M4 16c1.5 2.5 4 4 8 4s6.5-1.5 8-4"/></svg></span>
          <span class="hs-name">Docker</span>
          <span class="hs-sub">${dockerOnline ? `${dockerRunning ?? 0} activos` : "offline"}</span>
        </button>
        <button type="button" class="home-svc" data-home-svc="spotify">
          <span class="hs-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 18V6l12-2v12"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg></span>
          <span class="hs-name">Spotify</span>
          <span class="hs-sub">${escHtml(spotifySub)}</span>
        </button>
        <button type="button" class="home-svc" data-home-svc="discord" disabled title="Sin integración Discord aún">
          <span class="hs-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 8h10M7 12h6"/><path d="M5 6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3l-3 3H8a3 3 0 0 1-3-3V6z"/></svg></span>
          <span class="hs-name">Discord</span>
          <span class="hs-sub">Sin datos</span>
        </button>
      `;
      els.homeServices.querySelectorAll("[data-home-svc]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-home-svc");
          if (id === "spotify") {
            openSpotifyPanel().catch((err) => toast(err.message || "Error Spotify"));
          } else if (id === "docker") {
            openDockerPanel().catch((err) => toast(err.message || "Error Docker"));
          }
        });
      });
    }

    // 20/08/2026 - a peticion explicita del usuario, Escenas ya NO se
    // muestra en Inicio pase lo que pase (antes aparecia sola en cuanto
    // hubiera alguna escena real creada, 4.11.10). Sigue disponible igual
    // que siempre en Sistema -> Escenas y en el Menu rapido.
    const homeScenesSection = document.getElementById("home-scenes-section");
    if (homeScenesSection) homeScenesSection.hidden = true;

    const all = (state.agentDevices && state.agentDevices.devices) || [];
    const pi =
      all.find((d) => d.id === "raspberry" || d.type === "self") || {
        id: "raspberry",
        name: "Raspberry BMO",
        online: true,
        cpu: state.system?.cpu ?? null,
        temp: state.system?.temp ?? null,
      };
    const phone =
      all.find((d) => d.id === "android" || d.type === "android") || {
        id: "android",
        name: "Móvil",
        stub: true,
        online: false,
        os: "Android",
      };
    const dockerOnPi = state.docker?.docker === "online";
    const piSubParts = [];
    if (pi.cpu != null) piSubParts.push(`CPU ${pctOrDash(pi.cpu)}%`);
    if ((pi.temp ?? pi.cpuTemp) != null) piSubParts.push(`${pctOrDash(pi.temp ?? pi.cpuTemp)} °C`);
    if (dockerOnPi) piSubParts.push("Docker activo");
    const piSub = piSubParts.length ? piSubParts.join(" · ") : "Host BMO";
    const phoneSub = phone.stub
      ? "Android · sin agente"
      : phone.lastSeen
        ? `Android · ${formatConnectedAgo(phone.lastSeen).replace("conectado ", "última conexión ")}`
        : "Android";

    if (els.homeOthers) {
      els.homeOthers.innerHTML = `
        <button type="button" class="home-other" data-home-device="raspberry">
          <span class="ho-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 7h4M10 11h4M10 15h4"/></svg></span>
          <span><div class="ho-title">Raspberry BMO</div><div class="ho-sub">${escHtml(piSub)}</div></span>
          <span class="ho-status ${pi.online === false ? "off" : ""}">● ${pi.online === false ? "Offline" : "Online"}</span>
        </button>
        <button type="button" class="home-other" data-home-device="android">
          <span class="ho-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="8" y="2.5" width="8" height="19" rx="2"/><path d="M11 18h2"/></svg></span>
          <span><div class="ho-title">Móvil</div><div class="ho-sub">${escHtml(phoneSub)}</div></span>
          <span class="ho-status ${phone.online && !phone.stub ? "" : "off"}">● ${
            phone.stub ? "Stub" : phone.online ? "Online" : "Offline"
          }</span>
        </button>
      `;
      els.homeOthers.querySelectorAll("[data-home-device]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-home-device");
          state.agentFocusId = id;
          setAppNav("dispositivos");
        });
      });
    }

    // Compat legado
    if (els.selectedLabel) els.selectedLabel.textContent = mi.name || "MI-PC";
  }

  function renderSystem() {
    renderHome();
  }

  function renderDevices() {
    renderHome();
  }

  const PERM_LABELS = {
    docker: "Docker Engine",
    "docker.read": "Docker Engine (lectura)",
    "docker.write": "Docker Engine (escritura)",
    "docker.manage": "Docker Engine (gestión)",
    "docker.host": "Docker Host",
    "docker.privileged": "Docker Privileged",
    filesystem: "Sistema de archivos",
    network: "Red",
    notifications: "Notificaciones",
    events: "Eventos",
    "spotify.control": "Control de Spotify",
    spotify: "Spotify",
    "metrics.read": "Lectura de métricas",
    bluetooth: "Bluetooth",
    camera: "Cámara",
    microphone: "Micrófono",
    usb: "USB",
    gpio: "GPIO",
    serial: "Serie",
    mqtt: "MQTT",
    cloud: "Nube",
    tailscale: "Tailscale",
    proxmox: "Proxmox",
  };

  function permissionLabel(p) {
    return PERM_LABELS[p] || p;
  }


  function perfLevel(kind, value) {
    if (value == null || Number.isNaN(Number(value))) return "na";
    const v = Number(value);
    if (kind === "temp") {
      if (v >= 80) return "high";
      if (v >= 70) return "warn";
      return "ok";
    }
    if (v >= 90) return "high";
    if (v >= 75) return "warn";
    return "ok";
  }

  function closePerfPanel() {
    if (els.perfPanel) els.perfPanel.hidden = true;
    if (state.perfTimer) {
      clearInterval(state.perfTimer);
      state.perfTimer = null;
    }
  }

  function renderPerfBody() {
    if (!els.perfBody) return;
    const snap = state.metricsSnap;
    if (!snap) {
      els.perfBody.innerHTML = `<p class="tagline">Cargando métricas…</p>`;
      return;
    }
    const sys = snap.system || {};
    const docker = snap.docker || {};
    const devices = (snap.devices && snap.devices.items) || [];
    const mi =
      devices.find((d) => String(d.name || "").toUpperCase() === "MI-PC") ||
      devices.find((d) => d.online) ||
      devices[0];

    const cards = [
      { label: "CPU", value: sys.cpu, unit: "%", kind: "pct" },
      { label: "RAM", value: sys.ram, unit: "%", kind: "pct" },
      { label: "TEMP", value: sys.temperature, unit: "º", kind: "temp" },
      { label: "DISCO", value: sys.disk, unit: "%", kind: "pct" },
    ]
      .map((c) => {
        const lvl = perfLevel(c.kind, c.value);
        const shown = c.value == null ? "—" : `${c.value}${c.unit}`;
        return `<div class="perf-metric ${lvl}"><div class="label">${c.label}</div><div class="value">${shown}</div></div>`;
      })
      .join("");

    const items = (docker.items || [])
      .slice()
      .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
      .slice(0, 8);
    const dockerRows = items.length
      ? items
          .map((it) => {
            const st = String(it.status || "");
            const badge =
              st === "running" ? "ok" : st.includes("Exit") ? "high" : "warn";
            return `<div class="perf-docker-row"><span class="name">${escHtml(
              it.name || "?"
            )}</span><span>${Number(it.cpu || 0).toFixed(1)}% · ${escHtml(
              it.memory || "—"
            )}</span><span class="perf-badge ${badge}">${escHtml(
              st || "—"
            )}</span></div>`;
          })
          .join("")
      : `<div class="meta">Sin contenedores</div>`;

    const net = sys.network || {};
    const netText =
      net.downMbps != null || net.upMbps != null
        ? `↓ ${net.downMbps ?? "—"} · ↑ ${net.upMbps ?? "—"} Mbps`
        : "red midiendo…";

    let miHtml = `<div class="meta">Sin datos de agente</div>`;
    if (mi) {
      const online = mi.online ? "ok" : "off";
      const tLvl = perfLevel("temp", mi.gpuTemp);
      miHtml = `
        <div class="perf-device-line">
          <strong>${escHtml(mi.name || "MI-PC")}</strong>
          <span class="perf-badge ${online}">${mi.online ? "online" : "offline"}</span>
        </div>
        <div class="perf-device-line">
          <span class="perf-badge ${perfLevel("pct", mi.cpu)}">CPU ${mi.cpu ?? "—"}%</span>
          <span class="perf-badge ${perfLevel("pct", mi.ram)}">RAM ${mi.ram ?? "—"}%</span>
          <span class="perf-badge ${perfLevel("pct", mi.disk)}">Disco ${mi.disk ?? "—"}%</span>
          <span class="perf-badge ${tLvl}">GPU ${escHtml(
            String(mi.gpu ?? "—")
          )} · ${mi.gpuTemp ?? "—"}º</span>
        </div>`;
    }

    els.perfBody.innerHTML = `
      <h2 class="perf-title">BMO PERFORMANCE</h2>
      <div class="perf-grid">${cards}</div>
      <div class="perf-block">
        <h3>Host</h3>
        <div class="meta">Uptime ${formatUptime(sys.uptime)} · ${escHtml(netText)}</div>
      </div>
      <div class="perf-block">
        <h3>Docker: ${docker.containers ?? 0} contenedores</h3>
        <div class="meta">${docker.running != null ? docker.running + " running" : ""} ${
          docker.docker ? "· " + docker.docker : ""
        }</div>
        <div class="perf-docker-list">${dockerRows}</div>
      </div>
      <div class="perf-block">
        <h3>MI-PC</h3>
        ${miHtml}
      </div>
    `;
  }

  async function refreshPerf() {
    try {
      state.metricsSnap = await api("/api/metrics");
      renderPerfBody();
    } catch (err) {
      if (els.perfBody) {
        els.perfBody.innerHTML = `<p class="tagline">${escHtml(
          err.message || "Error métricas"
        )}</p>`;
      }
    }
  }


  function closeSysHub() {
    if (els.sysHubPanel) els.sysHubPanel.hidden = true;
  }




  // —— Salud BMO 4.10.8 ——
  els.healthPanel = document.getElementById("health-panel");
  els.healthBody = document.getElementById("health-body");
  els.healthBack = document.getElementById("health-back");

  function closeHealthPanel() {
    if (els.healthPanel) els.healthPanel.hidden = true;
    if (state.healthTimer) {
      clearInterval(state.healthTimer);
      state.healthTimer = null;
    }
  }

  function healthAgeText(iso) {
    if (!iso) return "";
    const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (secs < 60) return `${secs}s`;
    return `${Math.round(secs / 60)} min`;
  }

  function healthRowHtml(item) {
    const dot = item.status === "ok" ? "🟢" : item.status === "blocked" ? "🟡" : "🔴";
    let failLine = "";
    if (item.status === "down") {
      failLine = `<p class="sic-sub">No responde desde hace ${healthAgeText(item.failingSince)}${item.detail ? ` — ${escHtml(item.detail)}` : ""}</p>`;
    } else if (item.status === "blocked") {
      failLine = `<p class="sic-sub">${escHtml(item.detail || "No disponible")}</p>`;
    } else if (item.detail) {
      failLine = `<p class="sic-sub">${escHtml(item.detail)}</p>`;
    }
    const restartBtn =
      item.status === "down" && item.restartTarget
        ? `<button type="button" class="dk-btn ghost danger" data-health-restart="${escHtml(item.restartTarget)}">Reiniciar</button>`
        : "";
    return `<div class="plugin-card" style="margin-bottom:10px">
      <div class="docker-actions" style="justify-content:space-between">
        <strong>${dot} ${escHtml(item.label)}</strong>
        ${restartBtn}
      </div>
      ${failLine}
    </div>`;
  }

  function renderHealthBody() {
    if (!els.healthBody) return;
    const list = state.healthItems || [];
    // 6.6.15 - Ecosystem Health: cuenta real de dispositivos, encima del
    // rollup de subsistemas de siempre.
    const dev = state.healthDevices;
    const devicesRowHtml = dev
      ? `<div class="sys-list-row"><span>🌐 Dispositivos</span><span class="docker-meta">${dev.online === dev.total ? "🟢" : dev.online === 0 ? "🔴" : "🟡"} ${dev.online}/${dev.total}</span></div>`
      : "";
    els.healthBody.innerHTML = devicesRowHtml + (list.length ? list.map(healthRowHtml).join("") : `<p class="tagline">Sin datos.</p>`);
    els.healthBody.querySelectorAll("[data-health-restart]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const container = btn.getAttribute("data-health-restart");
        btn.disabled = true;
        toast(`Reiniciando ${container}…`);
        try {
          await api(`/api/docker/containers/${encodeURIComponent(container)}/restart`, { method: "POST", body: "{}" });
          toast(`${container} reiniciado`);
          await refreshHealth();
        } catch (err) {
          toast(err.message || "Error al reiniciar");
          btn.disabled = false;
        }
      });
    });
  }

  const HEALTH_OVERALL_META = {
    HEALTHY: { dot: "🟢", label: "HEALTHY" },
    DEGRADED: { dot: "🟡", label: "DEGRADED" },
    CRITICAL: { dot: "🔴", label: "CRITICAL" },
  };

  async function refreshHealth() {
    try {
      const data = await api("/api/health/manager");
      state.healthItems = data.items || [];
      state.healthDevices = data.devices || null;
      renderHealthBody();
      const badge = document.getElementById("health-overall-badge");
      if (badge) {
        const meta = HEALTH_OVERALL_META[data.overallStatus] || null;
        badge.textContent = meta ? `${meta.dot} ${meta.label}` : "";
      }
    } catch (err) {
      if (els.healthBody) els.healthBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
    }
  }

  // 6.2.17 - checklist del ultimo arranque real (Docker->Core->Monitorización
  // ->IA->Visión->UI->Salud->READY), no en vivo (para cuando se puede pedir,
  // el arranque ya termino) - se pide una vez al abrir el panel, no en el
  // intervalo de 10s de refreshHealth (no cambia mientras BMO sigue arriba).
  async function renderBootSequence() {
    const el = document.getElementById("boot-sequence-body");
    if (!el) return;
    try {
      const data = await api("/api/system/boot-sequence");
      const stages = data.stages || [];
      if (!stages.length) {
        el.innerHTML = "";
        return;
      }
      const rows = stages
        .map((s) => {
          const dot = s.ok ? "✅" : "❌";
          const elapsed = s.elapsedMs != null ? ` (+${(s.elapsedMs / 1000).toFixed(1)}s)` : "";
          const detail = s.detail ? ` — ${escHtml(s.detail)}` : "";
          return `<p class="sic-sub">${dot} ${escHtml(s.label)}${elapsed}${detail}</p>`;
        })
        .join("");
      el.innerHTML = `<div class="plugin-card" style="margin-top:10px">
        <strong>🚦 Último arranque</strong>
        ${rows}
      </div>`;
    } catch {
      el.innerHTML = "";
    }
  }

  async function openHealthPanel() {
    if (!els.healthPanel || !els.healthBody) {
      toast("Salud BMO no disponible");
      return;
    }
    closeSysHub();
    els.healthPanel.hidden = false;
    els.healthBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await refreshHealth();
    renderBootSequence().catch(() => {});
    if (state.healthTimer) clearInterval(state.healthTimer);
    state.healthTimer = setInterval(() => refreshHealth().catch(() => {}), 10000);
  }

  els.healthBack?.addEventListener("click", () => {
    closeHealthPanel();
    openSysHub();
  });

  // —— BMO Brain 6.3.21/6.3.24 ——
  // Junta en una sola pantalla lo que hasta ahora vivia repartido en varios
  // paneles (Salud BMO, Eventos, Auditoria IA) mas lo nuevo de 6.3 que no
  // tenia ningun sitio propio (Contexto, Resumen diario, Tendencia de
  // disco) - no duplica datos, solo los reune.
  els.brainPanel = document.getElementById("brain-panel");
  els.brainBody = document.getElementById("brain-body");
  els.brainBack = document.getElementById("brain-back");
  els.brainRefresh = document.getElementById("brain-refresh");

  // 7.0.18 (KAN-122) - Real-Time Activity: los datos ya existian (Audit Log
  // agent-tagged de 6.8), lo que faltaba era que la tarjeta se actualizara
  // sola mientras el panel esta abierto, en vez de ser una foto fija que
  // solo cambia si el usuario pulsa "actualizar". Solo refresca ESA
  // tarjeta (no todo el panel, para no perder lo que el usuario este
  // escribiendo en la busqueda global de al lado).
  let brainActivityTimer = null;

  async function refreshBrainActivity() {
    const el = document.getElementById("brain-activity-feed");
    if (!el) return;
    try {
      const audit = await api("/api/ai/audit?limit=5");
      const rows = (audit?.audit || [])
        .slice(0, 5)
        .map((e) => `<p class="sic-sub">${e.ok ? "✓" : "✗"} ${escHtml(aiEntryLabel(e))} · ${escHtml(formatHistoryWhen(e.at))}</p>`)
        .join("") || `<p class="sic-sub">Sin acciones recientes</p>`;
      el.innerHTML = rows;
    } catch {
      /* siguiente ciclo lo reintenta, no hace falta romper la tarjeta por un fallo puntual */
    }
  }

  function closeBrainPanel() {
    if (els.brainPanel) els.brainPanel.hidden = true;
    if (brainActivityTimer) {
      clearInterval(brainActivityTimer);
      brainActivityTimer = null;
    }
  }

  const CONTEXT_META = {
    HOME: "🏠 Home",
    GAMING: "🎮 Gaming",
    WORK: "💼 Work",
    LAN: "🌐 LAN",
    NIGHT: "🌙 Night",
    MAINTENANCE: "🛠️ Mantenimiento",
    PRIVACY: "🔒 Privacidad",
    AWAY: "🚪 Away",
  };

  function brainCard(title, bodyHtml) {
    return `<div class="plugin-card" style="margin-bottom:10px">
      <strong>${title}</strong>
      ${bodyHtml}
    </div>`;
  }

  // 7.0.16/7.0.17 (KAN-120/121) - Command Center: en vez de un panel nuevo
  // que duplique el mismo espiritu, se extiende BMO Brain (ya es el sitio
  // real donde esto vive, mismo criterio que 6.4.10 aplico con Memoria/
  // Tareas) con identidad real (7.0.7), puntuacion de salud (7.0.22) y
  // busqueda global real (7.0.20) - la primera pieza de BMO Brain que deja
  // de ser solo lectura, con la que el usuario puede interactuar de verdad.
  function healthScoreBar(pct) {
    const v = pct == null ? 0 : pct;
    const color = v >= 90 ? "#4caf50" : v >= 70 ? "#ffb300" : "#e53935";
    return `<div style="background:var(--panel-2);border-radius:6px;height:8px;margin:4px 0;overflow:hidden">
      <div style="background:${color};height:100%;width:${v}%"></div>
    </div>`;
  }

  async function runBrainSearch() {
    const input = document.getElementById("brain-search-input");
    const resultsEl = document.getElementById("brain-search-results");
    if (!input || !resultsEl) return;
    const q = input.value.trim();
    if (!q) {
      resultsEl.innerHTML = "";
      return;
    }
    resultsEl.innerHTML = `<p class="sic-sub">Buscando…</p>`;
    try {
      const r = await api(`/api/search?q=${encodeURIComponent(q)}`);
      const groups = [
        ["📟 Dispositivos", r.devices, (d) => d.name || d.id],
        ["📚 Documentación", r.documents, (d) => d.label || d.docId],
        ["📁 Proyectos", r.projects, (p) => p.name || p.id],
        ["🧠 Memoria", r.memory, (m) => m.text || m.value || m.id],
        ["📋 Eventos", r.events, (e) => e.title || e.type],
      ];
      const html = groups
        .filter(([, items]) => items && items.length)
        .map(
          ([label, items, fmt]) =>
            `<p class="sic-sub"><strong>${label}</strong>: ${items.map((i) => escHtml(String(fmt(i)))).join(" · ")}</p>`
        )
        .join("");
      resultsEl.innerHTML = html || `<p class="sic-sub">Sin resultados</p>`;
    } catch (err) {
      resultsEl.innerHTML = `<p class="sic-sub">${escHtml(err.message || "Error")}</p>`;
    }
  }

  async function renderBrainBody() {
    if (!els.brainBody) return;
    els.brainBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    try {
      const [context, health, audit, daily, diskTrend, memory, tasks, identity, healthScore, devMode] = await Promise.all([
        api("/api/system/context").catch(() => null),
        api("/api/health/manager").catch(() => null),
        api("/api/ai/audit?limit=5").catch(() => null),
        api("/api/system/daily-summary").catch(() => null),
        api("/api/system/disk-trend").catch(() => null),
        api("/api/ai/memory").catch(() => null),
        api("/api/ai/tasks").catch(() => null),
        api("/api/identity").catch(() => null),
        api("/api/health-score").catch(() => null),
        api("/api/dev-mode").catch(() => null),
      ]);

      const overallMeta = health ? HEALTH_OVERALL_META[health.overallStatus] : null;
      const aiItem = health?.items?.find((i) => i.key === "ai");

      const contextHtml = context
        ? `<p class="sic-sub">${escHtml(CONTEXT_META[context.current] || context.current)} · desde ${escHtml(fmtEventTime(context.since))} (${escHtml(context.setBy === "auto" ? "detectado automáticamente" : context.setBy === "ai" ? "cambiado por la IA" : "manual")})</p>`
        : `<p class="sic-sub">Sin datos</p>`;

      const estadoHtml = overallMeta
        ? `<p class="sic-sub">${overallMeta.dot} ${escHtml(overallMeta.label)}</p>`
        : `<p class="sic-sub">Sin datos</p>`;

      const aiHtml = aiItem
        ? `<p class="sic-sub">${aiItem.ok ? "🟢" : "🔴"} ${escHtml(aiItem.detail || "—")}</p>`
        : `<p class="sic-sub">Sin datos</p>`;

      const auditRows = (audit?.audit || [])
        .slice(0, 5)
        .map((e) => `<p class="sic-sub">${e.ok ? "✓" : "✗"} ${escHtml(aiEntryLabel(e))} · ${escHtml(formatHistoryWhen(e.at))}</p>`)
        .join("") || `<p class="sic-sub">Sin acciones recientes</p>`;

      const dailyHtml = daily && daily.date
        ? `<p class="sic-sub">${daily.status === "critical" ? "🔴" : daily.status === "degraded" ? "🟠" : "🟢"} CPU ${daily.system?.cpuAvg ?? "—"}% · RAM ${daily.system?.ramAvg ?? "—"}% · Temp ${daily.system?.tempAvg ?? "—"}°C</p>
           <p class="sic-sub">${daily.incidents ?? 0} incidencia(s) · ${daily.autoRecoveries ?? 0} recuperación(es) automática(s)${daily.uptimePercent != null ? ` · uptime ${daily.uptimePercent}%` : ""}</p>`
        : `<p class="sic-sub">Todavía no hay resumen diario</p>`;

      const trendHtml = diskTrend
        ? `<p class="sic-sub">${diskTrend.available ? escHtml(diskTrend.message) : escHtml(diskTrend.reason)}</p>`
        : `<p class="sic-sub">Sin datos</p>`;

      // 6.4.10 - BMO Assistant Dashboard: los tiles Tareas/Memoria del mockup
      // del spec, aqui dentro de BMO Brain en vez de una pantalla aparte -
      // ya existe el sitio natural para juntar todo esto (evita duplicar
      // otro panel mas con el mismo espiritu).
      const memoryHtml = memory
        ? `<p class="sic-sub">🧠 ${memory.facts.length} dato(s) guardado(s)</p>`
        : `<p class="sic-sub">Sin datos</p>`;
      const tasksHtml = tasks && tasks.summary
        ? `<p class="sic-sub">🟡 ${tasks.summary.pendientes} pendiente(s) · 🔴 ${tasks.summary.urgentes} urgente(s) · ⏰ ${tasks.summary.programadas} programada(s)</p>`
        : `<p class="sic-sub">Sin datos</p>`;

      // 7.0.7 - Identidad real de BMO (version/motor de IA/agentes/autonomia).
      // 7.1.20 (KAN-156) - Intelligence Dashboard: indicador real de
      // Verificacion (7.1.5/7.1.16) - deliberadamente NO se muestra ningun
      // indicador de "Self-Critique" (7.1.8 no existe todavia) - mostrar
      // eso en verde seria falso, ver el propio KAN-156. total=0 en las
      // ultimas 24h es un resultado bueno real, no "no funciona".
      const verificationHtml = identity?.verification
        ? `<p class="sic-sub">🔍 Verificación activa · ${identity.verification.last24h?.total ?? 0} avisos en 24h</p>`
        : "";
      // 7.1.x (KAN-157, follow-up de KAN-143/145) - a diferencia de
      // verificationHtml (siempre activo), esto solo se muestra si el
      // andamiaje de debate/confianza esta REALMENTE encendido ahora mismo
      // (multiAgentEnabled) - apagado por defecto, mostrar "activo" sin
      // serlo seria deshonesto.
      const debateHtml = identity?.debate?.active
        ? `<p class="sic-sub">🗣️ Multi-Agent Debate activo · ${identity.debate.last24h?.total ?? 0} turnos en 24h</p>`
        : "";
      const identityHtml = identity
        ? `<p class="sic-sub">${escHtml(identity.name)} · v${escHtml(identity.coreVersion)} · activo ${Math.round((identity.uptimeSeconds || 0) / 60)} min</p>
           <p class="sic-sub">🤖 ${escHtml(identity.ai?.provider || "—")}/${escHtml(identity.ai?.model || "—")} · agentes ${identity.agents?.ready ?? "—"}/${identity.agents?.total ?? "—"} · autonomía ${escHtml(identity.autonomy?.mode || "—")}</p>
           ${verificationHtml}
           ${debateHtml}`
        : `<p class="sic-sub">Sin datos</p>`;

      // 7.0.22 - Puntuacion de salud numerica, con barra por categoria.
      const healthScoreHtml = healthScore
        ? `<p class="sic-sub"><strong>${healthScore.total ?? "—"}/100</strong></p>
           ${Object.entries(healthScore.categories || {})
             .filter(([, v]) => v !== null)
             .map(([k, v]) => `<p class="sic-sub" style="margin-bottom:2px">${escHtml(k)}: ${v}%</p>${healthScoreBar(v)}`)
             .join("")}`
        : `<p class="sic-sub">Sin datos</p>`;

      const searchHtml = `
        <div style="display:flex;gap:6px;margin-top:4px">
          <input type="text" id="brain-search-input" placeholder="Buscar dispositivos, documentación, proyectos…"
            style="flex:1;padding:8px;border-radius:8px;background:var(--panel-2);color:var(--fg);border:1px solid var(--border)" />
          <button type="button" class="dk-btn" id="brain-search-btn">Buscar</button>
        </div>
        <div id="brain-search-results" style="margin-top:8px"></div>
      `;

      // 7.0.29 (KAN-133) - Developer Mode: toggle real persistido + accesos
      // directos a los paneles de debug que ya existian por separado
      // (Docker/Logs/Rendimiento/Monitor/Eventos), en vez de duplicar su
      // logica en un panel nuevo.
      const devModeHtml = `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="brain-devmode-toggle" ${devMode?.enabled ? "checked" : ""} />
          Modo desarrollador ${devMode?.enabled ? "activado" : "desactivado"}
        </label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
          <button type="button" class="dk-btn ghost" id="brain-dev-docker">🐳 Docker</button>
          <button type="button" class="dk-btn ghost" id="brain-dev-logs">📄 Logs</button>
          <button type="button" class="dk-btn ghost" id="brain-dev-perf">⚡ Rendimiento</button>
          <button type="button" class="dk-btn ghost" id="brain-dev-monitor">📈 Monitor</button>
          <button type="button" class="dk-btn ghost" id="brain-dev-events">📋 Eventos</button>
        </div>
      `;

      els.brainBody.innerHTML = [
        brainCard("🔎 Búsqueda global", searchHtml),
        brainCard("🆔 Identidad", identityHtml),
        brainCard("💯 Puntuación de salud", healthScoreHtml),
        brainCard("🛠️ Modo desarrollador", devModeHtml),
        brainCard("🧭 Contexto", contextHtml),
        brainCard("🩺 Estado global", estadoHtml),
        brainCard("🤖 IA", aiHtml),
        brainCard("⚡ Actividad en vivo", `<div id="brain-activity-feed">${auditRows}</div>`),
        brainCard("📊 Hoy", dailyHtml),
        brainCard("📈 Tendencia de disco", trendHtml),
        `<button type="button" class="plugin-card" style="margin-bottom:10px;width:100%;text-align:left;cursor:pointer" id="brain-open-memory">
          <strong>🧠 Memoria</strong>
          ${memoryHtml}
        </button>`,
        `<button type="button" class="plugin-card" style="margin-bottom:10px;width:100%;text-align:left;cursor:pointer" id="brain-open-tasks">
          <strong>✅ Tareas</strong>
          ${tasksHtml}
        </button>`,
      ].join("");

      document.getElementById("brain-open-memory")?.addEventListener("click", () => {
        closeBrainPanel();
        openAiPanel("memory").catch(() => {});
      });
      document.getElementById("brain-open-tasks")?.addEventListener("click", () => {
        closeBrainPanel();
        openAiPanel("tasks").catch(() => {});
      });
      document.getElementById("brain-search-btn")?.addEventListener("click", () => runBrainSearch());
      document.getElementById("brain-search-input")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") runBrainSearch();
      });
      document.getElementById("brain-devmode-toggle")?.addEventListener("change", async (e) => {
        try {
          await api("/api/dev-mode", { method: "POST", body: JSON.stringify({ enabled: e.target.checked }) });
          toast(e.target.checked ? "Modo desarrollador activado" : "Modo desarrollador desactivado");
        } catch (err) {
          toast(err.message || "Error");
          e.target.checked = !e.target.checked;
        }
      });
      document.getElementById("brain-dev-docker")?.addEventListener("click", () => {
        closeBrainPanel();
        openDockerPanel().catch(() => {});
      });
      document.getElementById("brain-dev-logs")?.addEventListener("click", () => {
        closeBrainPanel();
        openSysLogsPanel();
      });
      document.getElementById("brain-dev-perf")?.addEventListener("click", () => {
        closeBrainPanel();
        openPerfPanel().catch(() => {});
      });
      document.getElementById("brain-dev-monitor")?.addEventListener("click", () => {
        closeBrainPanel();
        openMonitorPanel().catch(() => {});
      });
      document.getElementById("brain-dev-events")?.addEventListener("click", () => {
        closeBrainPanel();
        openEventsPanel().catch(() => {});
      });
    } catch (err) {
      els.brainBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
    }
  }

  // —— BMO Voice F7 (KAN-412) ——
  // Conversación con BMO usando el canal de voz del chat existente
  // (/api/ai/chat channel:"voice") y su voz de Fish Audio
  // (/api/bmo/voice/speak). Sin micrófono real todavía: se le escribe.
  // La animación sigue la energía (RMS) del audio que de verdad suena.
  // var (no const): closeAllSysPanels() puede llamar a closeBmoVoicePanel()
  // durante el arranque, antes de llegar a esta línea (mismo caso que bm).
  var bv = {
    state: "idle",
    lastUser: "",
    lastReply: "",
    emotion: null,
    notices: [],
    error: "",
    busy: false,
    ctx: null,
    source: null,
    raf: null,
  };
  const BV_STATE = {
    idle: "Esperando",
    thinking: "Pensando…",
    speaking: "Hablando",
    conversing: "Conversando",
    sleeping: "Durmiendo",
    error: "Error",
  };
  const BV_EMOTION = {
    idle: "tranquilo",
    happy: "contento",
    very_happy: "muy feliz",
    sad: "triste",
    angry: "enfadado",
    surprised: "sorprendido",
    thinking: "pensando",
    confused: "confundido",
    excited: "emocionado",
    laughing: "riéndose",
    curious: "curioso",
    sleeping: "durmiendo",
  };

  function bvEl(id) {
    return document.getElementById(id);
  }

  function renderBmoVoice() {
    const body = bvEl("bmovoice-body");
    if (!body) return;
    body.innerHTML = `
      <div class="bv-stage" id="bv-stage">
        <div class="bv-face-wrap" id="bv-face-wrap">
          <img class="bv-face" src="./assets/bmo.webp" alt="BMO" />
        </div>
        <div class="bv-level" aria-hidden="true"><span id="bv-level-bar"></span></div>
        <div class="bv-status"><span class="bv-dot"></span><span id="bv-status-text"></span></div>
        <div class="bv-chips">
          <span class="bv-chip off" title="El módulo Yahboom solo reconoce frases fijas; para frases libres hace falta un micrófono que la Pi reconozca">🎤 Sin micrófono</span>
          <span class="bv-chip" id="bv-chip-voice">🔊 Voz de BMO</span>
          <span class="bv-chip">🧠 IA</span>
        </div>
      </div>
      <div class="bv-log">
        <div class="bv-you" id="bv-you" hidden></div>
        <div class="bv-bmo" id="bv-bmo" hidden></div>
        <div class="bv-notice" id="bv-notice" hidden></div>
      </div>
      <form class="bv-input" id="bv-form" autocomplete="off">
        <input id="bv-text" type="text" maxlength="500" placeholder="Escribe a BMO…" />
        <button type="submit" class="dk-btn" id="bv-send">Hablar</button>
      </form>
      <p class="bv-note">Todavía sin micrófono: escríbele y BMO te contesta con su voz en el dispositivo donde tengas esta pantalla abierta. La cara es provisional hasta tener tus caras de Figma.</p>`;
    bvEl("bv-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const t = bvEl("bv-text").value.trim();
      if (!t || bv.busy) return;
      bvEl("bv-text").value = "";
      bmoVoiceSend(t);
    });
    bvUpdate();
  }

  function bvUpdate() {
    const stage = bvEl("bv-stage");
    if (!stage) return;
    stage.className = `bv-stage bv-${bv.state} ${bv.emotion ? `bv-emo-${bv.emotion}` : ""}`;
    bvEl("bv-status-text").textContent = `${BV_STATE[bv.state] || bv.state}${bv.emotion ? ` · ${BV_EMOTION[bv.emotion] || bv.emotion}` : ""}`;
    const you = bvEl("bv-you");
    you.hidden = !bv.lastUser;
    you.textContent = bv.lastUser ? `Tú: ${bv.lastUser}` : "";
    const me = bvEl("bv-bmo");
    me.hidden = !bv.lastReply;
    me.textContent = bv.lastReply ? `BMO: ${bv.lastReply}` : "";
    const note = bvEl("bv-notice");
    const msgs = [bv.error ? `⚠️ ${bv.error}` : "", ...(bv.notices || [])].filter(Boolean);
    note.hidden = !msgs.length;
    note.textContent = msgs.join("  ");
    const send = bvEl("bv-send");
    if (send) send.disabled = bv.busy;
  }

  function bvSetLevel(v) {
    const bar = bvEl("bv-level-bar");
    if (bar) bar.style.transform = `scaleX(${Math.max(0.02, Math.min(1, v))})`;
    const face = bvEl("bv-face-wrap");
    if (face) face.style.transform = `scale(${1 + Math.min(0.06, v * 0.08)})`;
  }

  function bvStopAudio() {
    if (!bv) return;
    if (bv.raf) clearInterval(bv.raf);
    bv.raf = null;
    try {
      bv.source && bv.source.stop();
    } catch {
      /* ya parado */
    }
    bv.source = null;
    bvSetLevel(0);
  }

  // Reproduce el MP3 con Web Audio (el AudioContext se activa en el gesto
  // del usuario, así el navegador no bloquea el audio que llega segundos
  // después) y anima según la energía real de lo que suena.
  async function bvPlay(blob) {
    const ctx = bv.ctx;
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    const src = ctx.createBufferSource();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.buffer = buffer;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    bv.source = src;
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const x = (data[i] - 128) / 128;
        sum += x * x;
      }
      bvSetLevel(Math.sqrt(sum / data.length) * 4);
    };
    return new Promise((resolve) => {
      src.onended = () => {
        bvStopAudio();
        resolve();
      };
      src.start();
      // Temporizador (no requestAnimationFrame): sigue midiendo aunque el
      // navegador pause el pintado, y 20 lecturas/s bastan para la boca.
      bv.raf = setInterval(tick, 50);
    });
  }

  async function bmoVoiceSend(text) {
    bv.busy = true;
    bv.error = "";
    bv.notices = [];
    bv.lastUser = text;
    bv.lastReply = "";
    bv.state = "thinking";
    bv.emotion = "thinking";
    bvStopAudio();
    // Dentro del gesto: crear/reanudar el AudioContext.
    try {
      bv.ctx = bv.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (bv.ctx.state === "suspended") bv.ctx.resume();
    } catch {
      bv.ctx = null;
    }
    bvUpdate();
    let reply;
    try {
      reply = await api("/api/ai/chat", { method: "POST", body: JSON.stringify({ message: text, channel: "voice" }) });
    } catch (err) {
      bv.state = "error";
      bv.emotion = "confused";
      bv.error = err.message || "La IA no responde";
      bv.busy = false;
      bvUpdate();
      return;
    }
    if (reply.type === "confirmation_required") {
      bv.state = "conversing";
      bv.emotion = "curious";
      bv.lastReply = "Para eso necesito que lo confirmes. Ábrelo en BMO AI y dale a confirmar.";
      bv.busy = false;
      bvUpdate();
      return;
    }
    bv.lastReply = reply.text || "";
    bv.emotion = reply.emotion || null;
    bv.notices = reply.notices || [];
    const end = Boolean(reply.endConversation);
    const spoken = reply.spokenText || reply.text || "";
    if (spoken && bv.ctx) {
      bv.state = "speaking";
      bvUpdate();
      try {
        const res = await fetch(`${API_BASE}/api/v1/bmo/voice/speak`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-BMO-Key": API_KEY },
          body: JSON.stringify({ text: spoken.slice(0, 500) }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Voz no disponible (HTTP ${res.status})`);
        }
        await bvPlay(await res.blob());
      } catch (err) {
        // La respuesta ya está en pantalla; solo falla la voz.
        bv.error = err.message || "No se pudo generar la voz";
      }
    }
    bv.state = end ? "sleeping" : "conversing";
    if (end) bv.emotion = "sleeping";
    bv.busy = false;
    bvUpdate();
  }

  function closeBmoVoicePanel() {
    const p = bvEl("bmovoice-panel");
    if (p) p.hidden = true;
    bvStopAudio();
  }

  function openBmoVoicePanel() {
    const p = bvEl("bmovoice-panel");
    if (!p) {
      toast("BMO Voice no disponible — recarga la página");
      return;
    }
    closeSysHub();
    p.hidden = false;
    if (bv.state === "sleeping" || bv.state === "error") bv.state = "idle";
    renderBmoVoice();
  }

  bvEl("bmovoice-back")?.addEventListener("click", () => {
    closeBmoVoicePanel();
    openSysHub();
  });
  bvEl("bmovoice-panel")?.addEventListener("click", (e) => {
    if (e.target === bvEl("bmovoice-panel")) closeBmoVoicePanel();
  });

  async function openBrainPanel() {
    if (!els.brainPanel || !els.brainBody) {
      toast("BMO Brain no disponible");
      return;
    }
    closeSysHub();
    els.brainPanel.hidden = false;
    await renderBrainBody();
    // 7.0.18 - refresca solo la tarjeta de actividad cada 8s mientras el
    // panel siga abierto (closeBrainPanel para el intervalo).
    if (brainActivityTimer) clearInterval(brainActivityTimer);
    brainActivityTimer = setInterval(refreshBrainActivity, 8000);
  }

  els.brainBack?.addEventListener("click", () => {
    closeBrainPanel();
    openSysHub();
  });
  els.brainRefresh?.addEventListener("click", () => renderBrainBody());
  els.brainPanel?.addEventListener("click", (e) => {
    if (e.target === els.brainPanel) closeBrainPanel();
  });

  // —— Mantenimiento 4.10.11 ——
  els.maintenancePanel = document.getElementById("maintenance-panel");
  els.maintenanceBody = document.getElementById("maintenance-body");
  els.maintenanceBack = document.getElementById("maintenance-back");

  function closeMaintenancePanel() {
    if (els.maintenancePanel) els.maintenancePanel.hidden = true;
  }

  function maintenanceEffectsHtml(effects) {
    const eff = effects || {};
    return `<div class="plugin-card" style="margin-bottom:10px">
      <p class="sic-sub">🤖 Automatizaciones: ${escHtml(eff.automatizaciones || "—")}</p>
      <p class="sic-sub">⬆️ Actualizaciones: ${escHtml(eff.actualizaciones || "—")}</p>
      <p class="sic-sub">💾 Backups: ${escHtml(eff.backups || "—")}</p>
      <p class="sic-sub">🔔 Alertas: ${escHtml(eff.alertas || "—")}</p>
      <p class="sic-sub">♻️ Auto-recuperación: ${escHtml(eff.autorecuperacion || "—")}</p>
    </div>`;
  }

  function maintenanceResumeHtml(steps) {
    if (!steps || !steps.length) return "";
    const rows = steps
      .map((s) => `<p class="sic-sub">${s.ok ? "✅" : "❌"} ${escHtml(s.label || s.key)}</p>`)
      .join("");
    return `<div class="plugin-card" style="margin-bottom:10px">
      <strong>Comprobaciones al reanudar</strong>
      ${rows}
    </div>`;
  }

  function renderMaintenanceBody() {
    if (!els.maintenanceBody) return;
    const st = state.maintenanceStatus;
    if (!st) {
      els.maintenanceBody.innerHTML = `<p class="tagline">Cargando…</p>`;
      return;
    }
    if (st.active) {
      const since = st.enteredAt ? new Date(st.enteredAt).toLocaleString() : "";
      els.maintenanceBody.innerHTML = `
        <div class="plugin-card" style="margin-bottom:10px">
          <strong>🛠️ Modo mantenimiento activo</strong>
          <p class="sic-sub">Desde ${escHtml(since)}</p>
        </div>
        ${maintenanceEffectsHtml(st.effects)}
        <button type="button" class="dk-btn" id="maintenance-exit-btn">Salir de mantenimiento</button>
      `;
      document.getElementById("maintenance-exit-btn")?.addEventListener("click", async (e) => {
        e.target.disabled = true;
        toast("Reanudando BMO…");
        try {
          const result = await api("/api/system/maintenance/exit", { method: "POST", body: "{}" });
          state.maintenanceStatus = result;
          state.maintenanceResumeSteps = result.resumeSteps || null;
          renderMaintenanceBody();
          toast("BMO operativo");
        } catch (err) {
          toast(err.message || "Error al salir de mantenimiento");
          e.target.disabled = false;
        }
      });
    } else {
      els.maintenanceBody.innerHTML = `
        <div class="plugin-card" style="margin-bottom:10px">
          <strong>✅ Funcionamiento normal</strong>
          <p class="sic-sub">Actívalo antes de manipular el hardware para que las automatizaciones no interfieran.</p>
        </div>
        ${maintenanceEffectsHtml({
          automatizaciones: "Se pausarán",
          actualizaciones: "Seguirán permitidas",
          backups: "Seguirán permitidos",
          alertas: "Se limitarán (solo CRITICAL sale de BMO)",
          autorecuperacion: "Se desactivará (vigilancia sigue activa)",
        })}
        ${maintenanceResumeHtml(state.maintenanceResumeSteps)}
        <button type="button" class="dk-btn" id="maintenance-enter-btn">Entrar en modo mantenimiento</button>
      `;
      document.getElementById("maintenance-enter-btn")?.addEventListener("click", async (e) => {
        e.target.disabled = true;
        toast("Activando modo mantenimiento…");
        try {
          const result = await api("/api/system/maintenance/enter", { method: "POST", body: "{}" });
          state.maintenanceStatus = result;
          state.maintenanceResumeSteps = null;
          renderMaintenanceBody();
          toast("Modo mantenimiento activado");
        } catch (err) {
          toast(err.message || "Error al activar mantenimiento");
          e.target.disabled = false;
        }
      });
    }
  }

  async function refreshMaintenance() {
    try {
      state.maintenanceStatus = await api("/api/system/maintenance");
      renderMaintenanceBody();
    } catch (err) {
      if (els.maintenanceBody) {
        els.maintenanceBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      }
    }
  }

  async function openMaintenancePanel() {
    if (!els.maintenancePanel || !els.maintenanceBody) {
      toast("Mantenimiento no disponible");
      return;
    }
    closeSysHub();
    els.maintenancePanel.hidden = false;
    els.maintenanceBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await refreshMaintenance();
  }

  els.maintenanceBack?.addEventListener("click", () => {
    closeMaintenancePanel();
    openSysHub();
  });

  // —— Configuración central 4.10.12 ——
  els.settingsPanel = document.getElementById("settings-panel");
  els.settingsBody = document.getElementById("settings-body");
  els.settingsBack = document.getElementById("settings-back");
  els.settingsImportFile = document.getElementById("settings-import-file");

  async function onSettingsImportFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    let payload;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      toast("Archivo JSON inválido");
      return;
    }
    try {
      const preview = await api("/api/config-backup/preview", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const lines = [
        `Automatizaciones: ${preview.counts.automations}`,
        `Escenas: ${preview.counts.scenes}`,
        `Plugins: ${preview.counts.plugins}${
          preview.willSkip.length ? ` (${preview.willSkip.length} no instalados aquí, se omitirán)` : ""
        }`,
      ];
      if (preview.needsReconnect.length) {
        lines.push(`⚠️ Tras importar, reconecta: ${preview.needsReconnect.join(", ")}`);
      }
      // Confirmación siempre real (showConfirmModal, no askConfirm), no se
      // salta con "confirmDestructive: false" — importar sobrescribe
      // automatizaciones, escenas, permisos y config de golpe, es la
      // acción más destructiva de toda la app, no una más para el atajo
      // de acciones rutinarias.
      const msg = `Esto reemplazará tu configuración actual:\n\n${lines.join("\n")}`;
      const ok = await showConfirmModal({ title: "¿Importar configuración?", message: msg, confirmLabel: "Continuar" });
      if (!ok) return;

      const result = await api("/api/config-backup/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast("Configuración importada");
      const reconnect = (result.plugins || []).filter((p) => p.needsReconnect).map((p) => p.id);
      if (reconnect.length) {
        toast(`Reconecta manualmente: ${reconnect.join(", ")}`);
      }
      await refreshSettings();
    } catch (err) {
      toast(err.message || "Error al importar");
    }
  }

  els.settingsImportFile?.addEventListener("change", onSettingsImportFileSelected);

  function closeSettingsPanel() {
    if (els.settingsPanel) els.settingsPanel.hidden = true;
  }

  function applyBrandName(name) {
    const el = document.getElementById("brand-name");
    if (el) el.textContent = name || "BMO OS";
  }

  // 4.11.11 - "theme" ya existia en config.json desde antes de esta sesion,
  // documentado en 4.10.12 como campo muerto (sin frontend/backend que lo
  // usara). Se revive aqui de verdad en vez de crear un campo paralelo.
  const VALID_THEMES = ["dark", "light", "amoled", "blue", "cyber"];
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", VALID_THEMES.includes(theme) ? theme : "dark");
  }

  // 4.16.19 - Color de acento independiente del tema. "custom" no tiene
  // bloque [data-accent] en CSS (un hex libre no se puede expresar en un
  // selector) - se aplica directamente como custom property inline, que
  // gana por especificidad sobre cualquier [data-accent="x"] del tema.
  const VALID_ACCENTS = ["green", "blue", "purple", "custom"];
  function applyAccent(color, customHex) {
    const c = VALID_ACCENTS.includes(color) ? color : "green";
    document.documentElement.setAttribute("data-accent", c);
    if (c === "custom" && /^#[0-9a-fA-F]{6}$/.test(customHex || "")) {
      document.documentElement.style.setProperty("--accent", customHex);
      document.documentElement.style.setProperty("--tint-accent", customHex + "2e"); // ~18% alpha
    } else {
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--tint-accent");
    }
  }

  function themePickerHtml(currentTheme) {
    return [
      ["dark", "BMO Dark"],
      ["light", "BMO Light"],
      ["amoled", "BMO AMOLED"],
      ["blue", "BMO Blue"],
      ["cyber", "BMO Cyber"],
    ]
      .map(
        ([id, label]) =>
          `<button type="button" class="dk-btn ghost${(currentTheme || "dark") === id ? " active-size" : ""}" data-theme-choice="${id}">${label}</button>`
      )
      .join("");
  }

  // 4.16.19 - Acento independiente del tema, mismo patron visual que
  // themePickerHtml() (botones pill, no un <select>, para tocar con el
  // dedo sin apuntar fino).
  function accentPickerHtml(currentAccent) {
    return [
      ["green", "🟢 Verde"],
      ["blue", "🔵 Azul"],
      ["purple", "🟣 Morado"],
      ["custom", "🎨 Personalizado"],
    ]
      .map(
        ([id, label]) =>
          `<button type="button" class="dk-btn ghost${(currentAccent || "green") === id ? " active-size" : ""}" data-accent-choice="${id}">${label}</button>`
      )
      .join("");
  }

  // —— Fondo 4.11.12 ——
  // Capa separada (#bg-layer) para poder aplicar blur/brightness sin
  // difuminar el contenido real por encima - ver la nota en styles.css.
  function applyBackground(bg) {
    const layer = document.getElementById("bg-layer");
    if (!layer || !bg) return;
    layer.style.backgroundImage = "";
    if (bg.type === "solid") {
      layer.style.background = bg.color || "var(--bg)";
    } else if (bg.type === "image" && bg.imagePath) {
      layer.style.background = "var(--bg)";
      layer.style.backgroundImage = `url('${bg.imagePath}')`;
      layer.style.backgroundSize = "cover";
      layer.style.backgroundPosition = "center";
    } else {
      layer.style.background = "radial-gradient(1200px 800px at 50% -10%, var(--bg-glow) 0%, var(--bg) 55%)";
    }
    const opacity = (bg.opacity ?? 100) / 100;
    const blur = bg.blur ?? 0;
    const brightness = (bg.brightness ?? 100) / 100;
    layer.style.opacity = String(opacity);
    layer.style.filter = `blur(${blur}px) brightness(${brightness})`;
  }

  els.aparienciaPanel = document.getElementById("apariencia-panel");
  els.aparienciaBody = document.getElementById("apariencia-body");
  els.aparienciaBack = document.getElementById("apariencia-back");

  function closeAparienciaPanel() {
    if (els.aparienciaPanel) els.aparienciaPanel.hidden = true;
  }

  function renderAparienciaBody() {
    if (!els.aparienciaBody) return;
    const theme = state.settingsData?.general?.theme || "dark";
    const bg = state.background || { type: "gradient", opacity: 100, blur: 0, brightness: 100 };

    els.aparienciaBody.innerHTML = `
      <div class="plugin-card" style="margin-bottom:10px">
        <strong>Tema</strong>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${themePickerHtml(theme)}</div>
      </div>
      <div class="plugin-card" style="margin-bottom:10px">
        <strong>Fondo</strong>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button type="button" class="dk-btn ghost${bg.type === "gradient" ? " active-size" : ""}" data-bg-type="gradient">Gradiente</button>
          <button type="button" class="dk-btn ghost${bg.type === "solid" ? " active-size" : ""}" data-bg-type="solid">Sólido</button>
          <button type="button" class="dk-btn ghost${bg.type === "image" ? " active-size" : ""}" data-bg-type="image">Imagen</button>
        </div>
        ${
          bg.type === "solid"
            ? `<label style="display:block;margin-top:10px">Color
                <input type="color" id="bg-color-input" value="${escHtml(bg.color || "#101826")}" style="display:block;margin-top:4px;width:100%;height:40px;border-radius:8px;border:1px solid var(--border);background:var(--panel-2)" />
              </label>`
            : ""
        }
        ${
          bg.type === "image"
            ? `<div style="margin-top:10px">
                <p class="sic-sub">${bg.imagePath ? "Imagen cargada" : "Sin imagen todavía"}</p>
                <button type="button" class="dk-btn ghost" id="bg-image-pick-btn" style="margin-top:6px">Elegir imagen…</button>
              </div>`
            : ""
        }
        <label style="display:block;margin-top:12px">Opacidad (${bg.opacity ?? 100}%)
          <input type="range" id="bg-opacity" min="10" max="100" value="${bg.opacity ?? 100}" style="width:100%" />
        </label>
        <label style="display:block;margin-top:8px">Desenfoque (${bg.blur ?? 0}px)
          <input type="range" id="bg-blur" min="0" max="20" value="${bg.blur ?? 0}" style="width:100%" />
        </label>
        <label style="display:block;margin-top:8px">Brillo (${bg.brightness ?? 100}%)
          <input type="range" id="bg-brightness" min="30" max="150" value="${bg.brightness ?? 100}" style="width:100%" />
        </label>
      </div>
    `;

    els.aparienciaBody.querySelectorAll("[data-theme-choice]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const theme2 = btn.getAttribute("data-theme-choice");
        applyTheme(theme2);
        try {
          await api("/api/system/settings", { method: "POST", body: JSON.stringify({ theme: theme2 }) });
          state.settingsData = { ...(state.settingsData || {}), general: { ...(state.settingsData?.general || {}), theme: theme2 } };
          renderAparienciaBody();
        } catch (err) {
          toast(err.message || "Error al guardar el tema");
        }
      });
    });

    els.aparienciaBody.querySelectorAll("[data-bg-type]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const type = btn.getAttribute("data-bg-type");
        try {
          state.background = await api("/api/ui/background", { method: "PUT", body: JSON.stringify({ type }) });
          applyBackground(state.background);
          renderAparienciaBody();
        } catch (err) {
          toast(err.message || "Error al cambiar el fondo");
        }
      });
    });

    document.getElementById("bg-color-input")?.addEventListener("change", async (e) => {
      try {
        state.background = await api("/api/ui/background", {
          method: "PUT",
          body: JSON.stringify({ color: e.target.value }),
        });
        applyBackground(state.background);
      } catch (err) {
        toast(err.message || "Error al guardar el color");
      }
    });

    document.getElementById("bg-image-pick-btn")?.addEventListener("click", () => {
      document.getElementById("bg-image-file")?.click();
    });

    const debouncedBgSlider = (id, key) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener("input", () => {
        const value = Number(input.value);
        applyBackground({ ...bg, [key]: value }); // feedback inmediato mientras se arrastra
      });
      input.addEventListener("change", async () => {
        try {
          state.background = await api("/api/ui/background", {
            method: "PUT",
            body: JSON.stringify({ [key]: Number(input.value) }),
          });
          renderAparienciaBody();
        } catch (err) {
          toast(err.message || "Error al guardar");
        }
      });
    };
    debouncedBgSlider("bg-opacity", "opacity");
    debouncedBgSlider("bg-blur", "blur");
    debouncedBgSlider("bg-brightness", "brightness");
  }

  async function openAparienciaPanel() {
    if (!els.aparienciaPanel) {
      toast("Apariencia no disponible");
      return;
    }
    closePersonalizacionPanel();
    try {
      state.background = await api("/api/ui/background");
    } catch {
      /* se usa lo que ya hubiera en cache */
    }
    renderAparienciaBody();
    els.aparienciaPanel.hidden = false;
  }

  els.aparienciaBack?.addEventListener("click", () => {
    closeAparienciaPanel();
    openPersonalizacionPanel();
  });

  document.getElementById("bg-image-file")?.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast("Imagen demasiado grande (máximo 6MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        state.background = await api("/api/ui/background/image", {
          method: "POST",
          body: JSON.stringify({ dataUrl: reader.result }),
        });
        applyBackground(state.background);
        renderAparienciaBody();
        toast("Imagen de fondo actualizada");
      } catch (err) {
        toast(err.message || "Error al subir la imagen");
      }
    };
    reader.readAsDataURL(file);
  });

  // —— Modo Kiosco inteligente 4.11.13 ——
  // No reimplementa auto-recuperacion en el frontend ni en el backend: el
  // script bmo-kiosk.sh en el propio Pi ya tiene su bucle de relanzado
  // (ver kioskService.js en el backend). Este panel solo da visibilidad
  // real y una accion manual de reinicio.
  els.pantallasPanel = document.getElementById("pantallas-panel");
  els.pantallasBody = document.getElementById("pantallas-body");
  els.pantallasBack = document.getElementById("pantallas-back");

  function closePantallasPanel() {
    if (els.pantallasPanel) els.pantallasPanel.hidden = true;
    if (state.pantallasTimer) {
      clearInterval(state.pantallasTimer);
      state.pantallasTimer = null;
    }
  }

  function renderPantallasBody() {
    if (!els.pantallasBody) return;
    const k = state.kioskStatus;
    if (!k) {
      els.pantallasBody.innerHTML = `<p class="tagline">Cargando…</p>`;
      return;
    }
    els.pantallasBody.innerHTML = `
      <div class="plugin-card" style="margin-bottom:10px">
        <div class="docker-actions" style="justify-content:space-between;margin-bottom:8px">
          <span>🌐 Firefox (kiosco)</span>
          <strong>${k.firefoxActive ? "🟢 Activo" : "🔴 No responde"}</strong>
        </div>
        <div class="docker-actions" style="justify-content:space-between;margin-bottom:8px">
          <span>🖥️ Resolución</span>
          <strong>${escHtml(k.resolution || "—")}</strong>
        </div>
        <div class="docker-actions" style="justify-content:space-between">
          <span>🔄 Orientación</span>
          <strong>${escHtml(k.orientation || "—")}</strong>
        </div>
      </div>
      <button type="button" class="dk-btn ghost" id="kiosk-restart-btn">Reiniciar kiosco</button>
    `;
    document.getElementById("kiosk-restart-btn")?.addEventListener("click", async (e) => {
      if (!(await askConfirm("¿Reiniciar el navegador del kiosco? La pantalla se recargará."))) return;
      e.target.disabled = true;
      toast("Reiniciando kiosco…");
      try {
        await api("/api/system/kiosk/restart", { method: "POST", body: "{}" });
        setTimeout(refreshPantallas, 6000); // da tiempo real a que Firefox se relance
      } catch (err) {
        toast(err.message || "Error al reiniciar el kiosco");
      } finally {
        e.target.disabled = false;
      }
    });
  }

  async function refreshPantallas() {
    try {
      state.kioskStatus = await api("/api/system/kiosk");
      renderPantallasBody();
    } catch (err) {
      if (els.pantallasBody) els.pantallasBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
    }
  }

  async function openPantallasPanel() {
    if (!els.pantallasPanel) {
      toast("Pantallas no disponible");
      return;
    }
    closePersonalizacionPanel();
    els.pantallasPanel.hidden = false;
    els.pantallasBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await refreshPantallas();
    if (state.pantallasTimer) clearInterval(state.pantallasTimer);
    state.pantallasTimer = setInterval(() => refreshPantallas().catch(() => {}), 15000);
  }

  els.pantallasBack?.addEventListener("click", () => {
    closePantallasPanel();
    openPersonalizacionPanel();
  });

  function settingsInfoRow(label, value) {
    return `<p class="sic-sub">${escHtml(label)}: ${escHtml(value == null ? "—" : String(value))}</p>`;
  }

  function renderSettingsBody() {
    if (!els.settingsBody) return;
    const s = state.settingsData;
    if (!s) {
      els.settingsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
      return;
    }
    const perms = s.seguridad.permissions || {};
    els.settingsBody.innerHTML = `
      <div class="plugin-card" style="margin-bottom:10px">
        <strong>General</strong>
        <label style="display:block;margin-top:8px">Nombre
          <input type="text" id="set-name" value="${escHtml(s.general.name)}" maxlength="60" style="width:100%;margin-top:4px;padding:8px;border-radius:8px;background:var(--panel-2);color:var(--fg);border:1px solid var(--border)" />
        </label>
        <div style="margin-top:12px">
          <p class="sic-sub" style="margin-bottom:6px">Tema</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${themePickerHtml(s.general.theme)}
          </div>
        </div>
        <div style="margin-top:12px">
          <p class="sic-sub" style="margin-bottom:6px">Color de acento</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${accentPickerHtml(s.general.accentColor)}
          </div>
          ${s.general.accentColor === "custom" ? `<input type="color" id="set-accent-custom" value="${s.general.accentCustomHex || "#2ee59d"}" style="margin-top:8px;width:60px;height:36px;border-radius:8px;border:1px solid var(--border);background:none" />` : ""}
        </div>
        <div style="margin-top:12px">
          <label style="display:block">Página de inicio
            <select id="set-start-page" style="width:100%;margin-top:4px;padding:8px;border-radius:8px;background:var(--panel-2);color:var(--fg);border:1px solid var(--border)">
              <option value="inicio" ${s.general.startPage === "inicio" ? "selected" : ""}>Inicio</option>
              <option value="servicios" ${s.general.startPage === "servicios" ? "selected" : ""}>Servicios</option>
              <option value="sistema" ${s.general.startPage === "sistema" ? "selected" : ""}>Sistema</option>
              <option value="dispositivos" ${s.general.startPage === "dispositivos" ? "selected" : ""}>Dispositivos</option>
            </select>
          </label>
        </div>
      </div>
      <div class="plugin-card" style="margin-bottom:10px">
        <strong>Sistema</strong>
        ${settingsInfoRow("Puerto API", s.sistema.apiPort)}
        <label style="display:block;margin-top:8px">Timeout de heartbeat (segundos)
          <input type="number" id="set-heartbeat" value="${s.sistema.heartbeatTimeoutSec}" min="5" style="width:100%;margin-top:4px;padding:8px;border-radius:8px;background:var(--panel-2);color:var(--fg);border:1px solid var(--border)" />
        </label>
        <p class="sic-sub" style="margin-top:4px">Se aplica al reiniciar bmo-api</p>
        ${settingsInfoRow("Registro", `${s.sistema.logs.path} (${s.sistema.logs.sizeKb ?? "—"} KB)`)}
        ${settingsInfoRow("Almacenamiento usado", `${s.sistema.storage.diskPercent}%`)}
        ${settingsInfoRow("Zona horaria", s.sistema.timezone)}
        <button type="button" id="set-reboot-btn" class="dk-btn ghost danger" style="margin-top:10px">Reiniciar Raspberry</button>
        <p class="sic-sub" style="margin-top:4px">Reinicia todo el sistema (no solo el kiosco) — tarda ~1 min en volver.</p>
      </div>
      <div class="plugin-card" style="margin-bottom:10px">
        <strong>Seguridad</strong>
        ${settingsInfoRow("Clave de API", s.seguridad.apiKeyMasked)}
        ${settingsInfoRow("Autenticación", s.seguridad.sessionModel)}
        ${settingsInfoRow("Permisos globales", `Docker ${perms.docker ? "✅" : "❌"} · Spotify ${perms.spotify ? "✅" : "❌"}`)}
        <label style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <input type="checkbox" id="set-confirm" ${s.seguridad.confirmDestructive ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" />
          Pedir confirmación en acciones destructivas
        </label>
        <button type="button" id="set-logout-btn" class="dk-btn" style="margin-top:10px">Cerrar sesión</button>
      </div>
      <div class="plugin-card" style="margin-bottom:10px">
        <strong>Red</strong>
        ${settingsInfoRow("IP", s.red.ip)}
        ${settingsInfoRow("Hostname", s.red.hostname)}
        ${settingsInfoRow("WebSockets", s.red.websockets.join(", "))}
        ${settingsInfoRow("Proxies", s.red.proxies.join(", "))}
      </div>
      <div class="plugin-card" style="margin-bottom:10px">
        <strong>Accesibilidad</strong>
        <label style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <input type="checkbox" id="a11y-large-text" ${state.accessibility?.largeText ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" />
          Texto grande
        </label>
        <label style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <input type="checkbox" id="a11y-high-contrast" ${state.accessibility?.highContrast ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" />
          Alto contraste
        </label>
        <label style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <input type="checkbox" id="a11y-reduce-motion" ${state.accessibility?.reduceMotion ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" />
          Reducir animaciones
        </label>
        <label style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <input type="checkbox" id="a11y-visual-vibration" ${state.accessibility?.visualVibration ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" />
          Vibración visual al pulsar
        </label>
        <p class="sic-sub" style="margin-top:6px">Se aplica al instante, sin necesidad de guardar.</p>
      </div>
      <div class="plugin-card" style="margin-bottom:10px">
        <strong>Backup de configuración</strong>
        <p class="sic-sub">Exporta config, permisos, automatizaciones, escenas y ajustes de plugins. La clave de API y las credenciales/tokens OAuth (p.ej. Spotify) se excluyen siempre.</p>
        <button type="button" class="dk-btn ghost" id="settings-export-btn" style="margin-top:8px">Exportar configuración</button>
        <button type="button" class="dk-btn ghost" id="settings-import-btn" style="margin-top:8px;margin-left:8px">Importar configuración</button>
      </div>
      <button type="button" class="dk-btn" id="settings-save-btn">Guardar</button>
    `;
    ["large-text", "high-contrast", "reduce-motion", "visual-vibration"].forEach((key) => {
      document.getElementById(`a11y-${key}`)?.addEventListener("change", async (e) => {
        const field = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        try {
          const prefs = await api("/api/ui/accessibility", {
            method: "PUT",
            body: JSON.stringify({ [field]: e.target.checked }),
          });
          applyAccessibility(prefs);
        } catch (err) {
          e.target.checked = !e.target.checked;
          toast(err.message || "Error guardando accesibilidad");
        }
      });
    });
    document.getElementById("settings-export-btn")?.addEventListener("click", async (e) => {
      e.target.disabled = true;
      try {
        const backup = await api("/api/config-backup");
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        const stamp = new Date().toISOString().slice(0, 10);
        a.href = URL.createObjectURL(blob);
        a.download = `bmo-config-backup-${stamp}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast("Backup de configuración exportado");
      } catch (err) {
        toast(err.message || "Error al exportar");
      } finally {
        e.target.disabled = false;
      }
    });
    document.getElementById("settings-import-btn")?.addEventListener("click", () => {
      els.settingsImportFile?.click();
    });
    document.getElementById("settings-save-btn")?.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const name = document.getElementById("set-name")?.value?.trim() || "BMO OS";
      const heartbeatTimeoutSec = Number(document.getElementById("set-heartbeat")?.value) || 30;
      const confirmDestructive = !!document.getElementById("set-confirm")?.checked;
      try {
        await api("/api/system/settings", {
          method: "POST",
          body: JSON.stringify({ name, heartbeatTimeoutSec, confirmDestructive }),
        });
        state.settingsData = {
          ...s,
          general: { ...s.general, name },
          sistema: { ...s.sistema, heartbeatTimeoutSec },
          seguridad: { ...s.seguridad, confirmDestructive },
        };
        applyBrandName(name);
        renderSettingsBody();
        toast("Configuración guardada");
      } catch (err) {
        toast(err.message || "Error al guardar");
      } finally {
        e.target.disabled = false;
      }
    });

    els.settingsBody.querySelectorAll("[data-theme-choice]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const theme = btn.getAttribute("data-theme-choice");
        applyTheme(theme); // feedback inmediato, no esperar al round-trip
        try {
          await api("/api/system/settings", { method: "POST", body: JSON.stringify({ theme }) });
          state.settingsData = { ...s, general: { ...s.general, theme } };
          renderSettingsBody();
        } catch (err) {
          toast(err.message || "Error al guardar el tema");
        }
      });
    });

    els.settingsBody.querySelectorAll("[data-accent-choice]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const accentColor = btn.getAttribute("data-accent-choice");
        applyAccent(accentColor, s.general.accentCustomHex);
        try {
          await api("/api/system/settings", { method: "POST", body: JSON.stringify({ accentColor }) });
          state.settingsData = { ...s, general: { ...s.general, accentColor } };
          renderSettingsBody();
        } catch (err) {
          toast(err.message || "Error al guardar el acento");
        }
      });
    });
    document.getElementById("set-accent-custom")?.addEventListener("input", async (e) => {
      const accentCustomHex = e.target.value;
      applyAccent("custom", accentCustomHex);
      try {
        await api("/api/system/settings", { method: "POST", body: JSON.stringify({ accentColor: "custom", accentCustomHex }) });
        state.settingsData = { ...s, general: { ...s.general, accentColor: "custom", accentCustomHex } };
      } catch (err) {
        toast(err.message || "Error al guardar el color personalizado");
      }
    });
    document.getElementById("set-start-page")?.addEventListener("change", async (e) => {
      const startPage = e.target.value;
      try {
        await api("/api/system/settings", { method: "POST", body: JSON.stringify({ startPage }) });
        state.settingsData = { ...s, general: { ...s.general, startPage } };
        toast("Página de inicio guardada");
      } catch (err) {
        toast(err.message || "Error al guardar la página de inicio");
      }
    });

    // 4.17.4 - Cerrar sesion: revoca tanto la sesion corta (2h) como el
    // dispositivo confiable de este navegador (si lo hay), y vuelve a
    // mostrar la pantalla de login al recargar. No toca x-bmo-key, que
    // sigue protegiendo el resto de la API igual que siempre.
    document.getElementById("set-logout-btn")?.addEventListener("click", async () => {
      const sessionToken = sessionStorage.getItem("bmo_session_token");
      const deviceToken = localStorage.getItem("bmo_trusted_device_token");
      if (!sessionToken && !deviceToken) {
        toast("No hay una sesión de cuenta activa en este dispositivo");
        return;
      }
      const ok = await showConfirmModal({
        title: "Cerrar sesión",
        message: "Se olvidará este dispositivo y tendrás que volver a iniciar sesión.",
        confirmLabel: "Cerrar sesión",
      });
      if (!ok) return;
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + (sessionToken || deviceToken),
          },
          body: JSON.stringify({ trustedDeviceToken: deviceToken || undefined }),
        });
      } catch (_) {
        /* aunque falle la llamada, se limpia el dispositivo localmente igualmente */
      }
      sessionStorage.removeItem("bmo_session_token");
      localStorage.removeItem("bmo_trusted_device_token");
      window.location.reload();
    });

    // 4.18.5 - Reinicia la Raspberry entera (no solo Firefox como
    // "Reiniciar kiosco" en Pantallas) - bmo-api, Docker, todo se cae y
    // vuelve solo (systemd Restart=always). No hay boton de "Apagar":
    // un apagado real deja la Pi muerta hasta enchufarla a mano.
    document.getElementById("set-reboot-btn")?.addEventListener("click", async (e) => {
      const ok = await showConfirmModal({
        title: "Reiniciar Raspberry",
        message: "Se reiniciará todo el sistema (BMO, Docker, el kiosco). Tardará aproximadamente un minuto en volver.",
        confirmLabel: "Reiniciar",
      });
      if (!ok) return;
      e.target.disabled = true;
      toast("Reiniciando la Raspberry…");
      try {
        await api("/api/system/reboot", { method: "POST", body: "{}" });
      } catch (_) {
        /* la conexion se corta enseguida por el propio reinicio - esperado */
      }
    });
  }

  async function refreshSettings() {
    try {
      state.settingsData = await api("/api/system/settings");
      renderSettingsBody();
    } catch (err) {
      if (els.settingsBody) {
        els.settingsBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      }
    }
  }

  async function openSettingsPanel() {
    if (!els.settingsPanel || !els.settingsBody) {
      toast("Configuración no disponible");
      return;
    }
    closeSysHub();
    els.settingsPanel.hidden = false;
    els.settingsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await refreshSettings();
  }

  els.settingsBack?.addEventListener("click", () => {
    closeSettingsPanel();
    openSysHub();
  });

  // —— Personalización 4.11.1 ——
  // Panel de aterrizaje: sus 6 tarjetas abren los paneles reales que se
  // construyen en 4.11.2-4.11.13. Hasta que cada uno exista, la tarjeta
  // muestra "Próximamente" - mismo patron que "Históricos" en el hub de
  // Sistema, no un boton que aparenta funcionar sin hacerlo.
  els.personalizacionPanel = document.getElementById("personalizacion-panel");
  els.personalizacionBody = document.getElementById("personalizacion-body");
  els.personalizacionBack = document.getElementById("personalizacion-back");

  const PERSONALIZACION_ROUTES = {
    navegacion: () => openNavegacionPanel().catch((err) => toast(err.message || "Error")),
    apariencia: () => openAparienciaPanel().catch((err) => toast(err.message || "Error")),
    pantallas: () => openPantallasPanel().catch((err) => toast(err.message || "Error")),
  };

  function closePersonalizacionPanel() {
    if (els.personalizacionPanel) els.personalizacionPanel.hidden = true;
  }

  function openPersonalizacionPanel() {
    if (!els.personalizacionPanel) {
      toast("Personalización no disponible");
      return;
    }
    closeSysHub();
    els.personalizacionPanel.hidden = false;
  }

  els.personalizacionBack?.addEventListener("click", () => {
    closePersonalizacionPanel();
    openSysHub();
  });

  els.personalizacionBody?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-personalizacion-open]");
    if (!card) return;
    const kind = card.getAttribute("data-personalizacion-open");
    const opener = PERSONALIZACION_ROUTES[kind];
    if (opener) {
      opener();
    } else {
      toast("Próximamente");
    }
  });

  function askConfirm(msg) {
    if (state.settingsData?.seguridad?.confirmDestructive === false) return Promise.resolve(true);
    return showConfirmModal({ title: "¿Confirmar acción?", message: msg, confirmLabel: "Confirmar" });
  }

  // —— Navegación / Páginas configurables 4.11.4 ——
  // Las 4 vistas fijas (Inicio/Servicios/Sistema/Dispositivos) siguen siendo
  // vistas a medida, con contenido bespoke - no se hacen genericas aqui.
  // Este panel gestiona solo las paginas ADICIONALES que el usuario cree.
  // Verlas usa un panel generico reutilizable (#custom-page-panel), no uno
  // por pagina - no escalaria. Integrarlas de verdad en el dock inferior
  // como botones es trabajo de 4.11.7 (dock configurable), deliberadamente
  // no adelantado aqui para no duplicar ese trabajo.
  els.navegacionPanel = document.getElementById("navegacion-panel");
  els.navegacionBody = document.getElementById("navegacion-body");
  els.navegacionBack = document.getElementById("navegacion-back");
  els.customPagePanel = document.getElementById("custom-page-panel");
  els.customPageTitle = document.getElementById("custom-page-title");
  els.customPageBack = document.getElementById("custom-page-back");

  function closeNavegacionPanel() {
    if (els.navegacionPanel) els.navegacionPanel.hidden = true;
  }

  function closeCustomPagePanel() {
    if (els.customPagePanel) els.customPagePanel.hidden = true;
    if (state.customPageTimer) {
      clearInterval(state.customPageTimer);
      state.customPageTimer = null;
    }
  }

  function renderUiPagesList() {
    if (!els.navegacionBody) return;
    const list = document.getElementById("ui-pages-list");
    if (!list) return;
    const pagesArr = state.uiPages || [];
    list.innerHTML = pagesArr.length
      ? pagesArr
          .map(
            (p) => `
        <div class="docker-actions" style="justify-content:space-between;margin-bottom:8px">
          <button type="button" class="dk-btn ghost" data-ui-page-open="${p.id}" style="flex:1;text-align:left">${escHtml(p.icon)} ${escHtml(p.name)}</button>
          <button type="button" class="dk-btn danger" data-ui-page-delete="${p.id}">Eliminar</button>
        </div>`
          )
          .join("")
      : `<p class="sic-sub">Aún no has creado ninguna página</p>`;

    list.querySelectorAll("[data-ui-page-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-ui-page-open");
        const page = (state.uiPages || []).find((p) => p.id === id);
        if (page) openCustomPagePanel(page);
      });
    });
    list.querySelectorAll("[data-ui-page-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-ui-page-delete");
        const page = (state.uiPages || []).find((p) => p.id === id);
        if (!(await askConfirm(`¿Eliminar la página "${page?.name || ""}"?`))) return;
        try {
          await api(`/api/ui/pages/${id}`, { method: "DELETE" });
          state.uiPages = (state.uiPages || []).filter((p) => p.id !== id);
          renderUiPagesList();
          toast("Página eliminada");
        } catch (err) {
          toast(err.message || "Error al eliminar");
        }
      });
    });
  }

  async function refreshUiPages() {
    try {
      const data = await api("/api/ui/pages");
      state.uiPages = data.pages || [];
      renderUiPagesList();
      renderDockManageList();
    } catch (err) {
      const list = document.getElementById("ui-pages-list");
      if (list) list.innerHTML = `<p class="sic-sub">${escHtml(err.message || "Error")}</p>`;
    }
  }

  async function openNavegacionPanel() {
    if (!els.navegacionPanel) {
      toast("Navegación no disponible");
      return;
    }
    closePersonalizacionPanel();
    els.navegacionPanel.hidden = false;
    await refreshUiPages();
    try {
      state.dockConfig = await api("/api/ui/dock");
    } catch {
      /* se queda con lo que ya hubiera en state.dockConfig */
    }
    renderDockManageList();
    try {
      const data = await api("/api/ui/profiles");
      state.uiProfiles = data.profiles || [];
    } catch {
      /* se queda con lo que ya hubiera en cache */
    }
    renderProfilesList();
  }

  els.navegacionBack?.addEventListener("click", () => {
    closeNavegacionPanel();
    openPersonalizacionPanel();
  });

  // —— Gestión del dock 4.11.7 (vive dentro del panel Navegación) ——
  function dockManageLabel(item) {
    if (item.type === "fixed") return FIXED_NAV_META[item.id]?.label || item.id;
    const page = (state.uiPages || []).find((p) => p.id === item.id);
    return page ? `${page.icon} ${page.name}` : item.id;
  }

  async function persistDockConfig(newDock) {
    if (!requireEditUnlocked()) return;
    try {
      const saved = await api("/api/ui/dock", { method: "PUT", body: JSON.stringify(newDock) });
      state.dockConfig = saved;
      renderDock();
      renderDockManageList();
    } catch (err) {
      toast(err.message || "Error al guardar el dock");
    }
  }

  function moveDockItem(idx, dir) {
    const dock = state.dockConfig || DEFAULT_DOCK;
    const items = [...dock.items];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    persistDockConfig({ items, iconSize: dock.iconSize });
  }

  function removeDockItem(idx) {
    const dock = state.dockConfig || DEFAULT_DOCK;
    if (dock.items.length <= 1) return;
    const items = dock.items.filter((_, i) => i !== idx);
    persistDockConfig({ items, iconSize: dock.iconSize });
  }

  function renderDockAddRow() {
    const row = document.getElementById("ui-dock-add-row");
    if (!row) return;
    const dock = state.dockConfig || DEFAULT_DOCK;
    const presentIds = new Set(dock.items.map((i) => i.id));
    const options = [];
    for (const [id, meta] of Object.entries(FIXED_NAV_META)) {
      if (!presentIds.has(id)) options.push({ id, type: "fixed", label: meta.label });
    }
    for (const page of state.uiPages || []) {
      if (!presentIds.has(page.id)) options.push({ id: page.id, type: "custom", label: `${page.icon} ${page.name}` });
    }
    if (!options.length) {
      row.innerHTML = `<p class="sic-sub">Todas las páginas ya están en el dock</p>`;
      return;
    }
    row.innerHTML = `
      <select id="ui-dock-add-select" style="flex:1;padding:8px;border-radius:8px;background:var(--panel-2);color:var(--fg);border:1px solid var(--border)">
        ${options.map((o) => `<option value="${o.id}" data-type="${o.type}">${escHtml(o.label)}</option>`).join("")}
      </select>
      <button type="button" class="dk-btn" id="ui-dock-add-btn">Añadir</button>`;
    document.getElementById("ui-dock-add-btn")?.addEventListener("click", () => {
      const select = document.getElementById("ui-dock-add-select");
      const selected = select?.selectedOptions[0];
      if (!selected) return;
      const dock2 = state.dockConfig || DEFAULT_DOCK;
      const items = [...dock2.items, { id: selected.value, type: selected.getAttribute("data-type") }];
      persistDockConfig({ items, iconSize: dock2.iconSize });
    });
  }

  function renderDockManageList() {
    const container = document.getElementById("ui-dock-list");
    if (!container) return;
    const dock = state.dockConfig || DEFAULT_DOCK;
    container.innerHTML = dock.items
      .map(
        (item, idx) => `
      <div class="docker-actions" style="justify-content:space-between;margin-bottom:6px">
        <span style="flex:1">${escHtml(dockManageLabel(item))}</span>
        <button type="button" class="dk-btn ghost" data-dock-up="${idx}" ${idx === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="dk-btn ghost" data-dock-down="${idx}" ${idx === dock.items.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="dk-btn danger" data-dock-remove="${idx}" ${dock.items.length <= 1 ? "disabled" : ""}>Quitar</button>
      </div>`
      )
      .join("");

    container.querySelectorAll("[data-dock-up]").forEach((btn) => {
      btn.addEventListener("click", () => moveDockItem(Number(btn.getAttribute("data-dock-up")), -1));
    });
    container.querySelectorAll("[data-dock-down]").forEach((btn) => {
      btn.addEventListener("click", () => moveDockItem(Number(btn.getAttribute("data-dock-down")), 1));
    });
    container.querySelectorAll("[data-dock-remove]").forEach((btn) => {
      btn.addEventListener("click", () => removeDockItem(Number(btn.getAttribute("data-dock-remove"))));
    });

    document.querySelectorAll("[data-dock-size]").forEach((btn) => {
      btn.classList.toggle("active-size", btn.getAttribute("data-dock-size") === dock.iconSize);
    });

    renderDockAddRow();
  }

  document.querySelectorAll("[data-dock-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = btn.getAttribute("data-dock-size");
      const dock = state.dockConfig || DEFAULT_DOCK;
      persistDockConfig({ items: dock.items, iconSize: size });
    });
  });

  // —— Perfiles de interfaz 4.11.14 ——
  // Reutiliza el dock de 4.11.7 en vez de un sistema de visibilidad de
  // pagina aparte: un perfil es una foto guardada del dock actual, y
  // "aplicar" es la misma persistDockConfig()/setDock() de siempre.
  function renderProfilesList() {
    const container = document.getElementById("ui-profiles-list");
    if (!container) return;
    const profilesArr = state.uiProfiles || [];
    container.innerHTML = profilesArr.length
      ? profilesArr
          .map(
            (p) => `
        <div class="docker-actions" style="justify-content:space-between;margin-bottom:8px">
          <button type="button" class="dk-btn ghost" data-profile-apply="${p.id}" style="flex:1;text-align:left">${escHtml(p.icon)} ${escHtml(p.name)}</button>
          <button type="button" class="dk-btn danger" data-profile-delete="${p.id}">Eliminar</button>
        </div>`
          )
          .join("")
      : `<p class="sic-sub">Aún no has guardado ningún perfil</p>`;

    container.querySelectorAll("[data-profile-apply]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-profile-apply");
        try {
          state.dockConfig = await api(`/api/ui/profiles/${id}/apply`, { method: "POST", body: "{}" });
          renderDock();
          renderDockManageList();
          toast("Perfil aplicado");
        } catch (err) {
          toast(err.message || "Error al aplicar el perfil");
        }
      });
    });
    container.querySelectorAll("[data-profile-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-profile-delete");
        const profile = profilesArr.find((p) => p.id === id);
        if (!(await askConfirm(`¿Eliminar el perfil "${profile?.name || ""}"?`))) return;
        try {
          await api(`/api/ui/profiles/${id}`, { method: "DELETE" });
          state.uiProfiles = (state.uiProfiles || []).filter((p) => p.id !== id);
          renderProfilesList();
          toast("Perfil eliminado");
        } catch (err) {
          toast(err.message || "Error al eliminar");
        }
      });
    });
  }

  document.getElementById("ui-profile-add-btn")?.addEventListener("click", async (e) => {
    const nameInput = document.getElementById("ui-profile-name");
    const iconInput = document.getElementById("ui-profile-icon");
    const name = nameInput?.value?.trim();
    const icon = iconInput?.value?.trim() || "🖥️";
    if (!name) {
      toast("Escribe un nombre para el perfil");
      return;
    }
    e.target.disabled = true;
    try {
      const profile = await api("/api/ui/profiles", { method: "POST", body: JSON.stringify({ name, icon }) });
      state.uiProfiles = [...(state.uiProfiles || []), profile];
      renderProfilesList();
      if (nameInput) nameInput.value = "";
      if (iconInput) iconInput.value = "";
      toast(`Perfil "${name}" guardado con el dock actual`);
    } catch (err) {
      toast(err.message || "Error al guardar el perfil");
    } finally {
      e.target.disabled = false;
    }
  });

  // 4.11.17 - Confirmacion SIEMPRE real, igual que en la importacion de
  // backups de 4.10.14: esto borra dock personalizado, paginas, perfiles y
  // fondo de golpe - no se salta con "confirmar acciones destructivas: no"
  // (4.10.12), es la accion mas destructiva de toda la personalizacion.
  // 4.16.9 - showConfirmModal() (a diferencia de askConfirm()) nunca
  // comprueba confirmDestructive, asi que sigue siendo siempre-real sin
  // depender del dialogo nativo del navegador.
  document.getElementById("ui-restore-factory-btn")?.addEventListener("click", async (e) => {
    const ok = await showConfirmModal({
      title: "¿Restaurar diseño de fábrica?",
      message: "Se perderán el dock personalizado, las páginas, los perfiles y el fondo que hayas configurado. Esto no se puede deshacer.",
      confirmLabel: "Restaurar",
    });
    if (!ok) {
      return;
    }
    e.target.disabled = true;
    toast("Restaurando diseño de fábrica…");
    try {
      await api("/api/ui/layout/reset", { method: "POST", body: "{}" });
      toast("Diseño de fábrica restaurado — recargando…");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast(err.message || "Error al restaurar");
      e.target.disabled = false;
    }
  });

  document.getElementById("ui-page-add-btn")?.addEventListener("click", async (e) => {
    const nameInput = document.getElementById("ui-page-name");
    const iconInput = document.getElementById("ui-page-icon");
    const name = nameInput?.value?.trim();
    const icon = iconInput?.value?.trim() || "📄";
    if (!name) {
      toast("Escribe un nombre para la página");
      return;
    }
    e.target.disabled = true;
    try {
      const page = await api("/api/ui/pages", { method: "POST", body: JSON.stringify({ name, icon }) });
      state.uiPages = [...(state.uiPages || []), page];
      renderUiPagesList();
      if (nameInput) nameInput.value = "";
      if (iconInput) iconInput.value = "";
      toast("Página creada");
    } catch (err) {
      toast(err.message || "Error al crear la página");
    } finally {
      e.target.disabled = false;
    }
  });

  // —— Widgets 4.11.5 ——
  // El registro de tipos vive en el frontend (label/icono); el backend solo
  // valida que el "type" recibido sea uno conocido (misma lista duplicada
  // deliberadamente en uiPagesService.js - es una allowlist, no logica).
  // Cada widget lee datos que la app YA tiene en `state` (system/docker/
  // spotify/agentDevices/weatherData/unseenCount) - cero fetches nuevos.
  const WIDGET_TYPES = {
    cpu: { label: "CPU", icon: "🧠" },
    ram: { label: "RAM", icon: "💾" },
    gpu: { label: "GPU (MI-PC)", icon: "🎮" },
    temp: { label: "Temperatura", icon: "🌡️" },
    docker: { label: "Docker", icon: "🐳" },
    spotify: { label: "Spotify", icon: "🎵" },
    clock: { label: "Reloj", icon: "🕐" },
    calendar: { label: "Calendario", icon: "📅" },
    weather: { label: "Clima", icon: "☀️" },
    network: { label: "Red (MI-PC)", icon: "📡" },
    alerts: { label: "Alertas", icon: "🚨" },
    mipc: { label: "MI-PC", icon: "🖥️" },
  };

  function findMipcDevice() {
    return (state.agentDevices?.devices || []).find((d) => d.id === "mi-pc") || null;
  }

  function widgetValueLabel(type) {
    const sys = state.system || {};
    const mipc = findMipcDevice();
    switch (type) {
      case "cpu":
        return { value: sys.cpu != null ? `${sys.cpu}%` : "—", label: "CPU (BMO)" };
      case "ram":
        return { value: sys.ramPercent != null ? `${sys.ramPercent}%` : "—", label: "RAM (BMO)" };
      case "gpu": {
        const pct = mipc?.metrics?.gpu?.usage_pct;
        return { value: pct != null ? `${pct}%` : "—", label: "GPU (MI-PC)" };
      }
      case "temp":
        return { value: sys.temp != null ? `${sys.temp}°C` : "—", label: "Temperatura (BMO)" };
      case "docker": {
        const d = state.docker || {};
        const total = (d.containers || []).length;
        return { value: `${d.running ?? "—"}/${total}`, label: "Docker activos" };
      }
      case "spotify": {
        const sp = state.spotify;
        let v = "Sin conectar";
        if (sp?.connected) {
          const name = sp.track && sp.track.name ? String(sp.track.name) : "";
          const short = name.length > 26 ? `${name.slice(0, 25)}…` : name;
          v = sp.playing ? (short ? `▶ ${short}` : "▶ Reproduciendo") : "⏸ Listo";
        }
        return { value: v, label: "Spotify" };
      }
      case "clock": {
        const now = new Date();
        return {
          value: now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }),
          label: "Hora",
        };
      }
      case "calendar":
        return { value: "—", label: "Sin integración de calendario todavía" };
      case "weather": {
        const w = state.weatherData;
        return {
          value: w?.temp != null ? `${w.icon || "☀"} ${Math.round(w.temp)}°` : "—",
          label: `Clima ${state.weatherCity || ""}`,
        };
      }
      case "network": {
        const net = mipc?.network;
        return {
          value: net ? `↓${net.down_kbps ?? "—"} ↑${net.up_kbps ?? "—"} kbps` : "—",
          label: "Red (MI-PC)",
        };
      }
      case "alerts":
        return { value: state.unseenCount != null ? String(state.unseenCount) : "—", label: "Alertas sin ver" };
      case "mipc":
        return { value: mipc ? (mipc.online ? "🟢 Online" : "🔴 Offline") : "—", label: "MI-PC" };
      default:
        return { value: "—", label: "Widget desconocido" };
    }
  }

  // 4.11.6 - Tamanos de widget. Con una grid de 2 columnas, "grande" y
  // "completo" ocupan el ancho entero (la diferencia entre ambos es la
  // cantidad de detalle, no el ancho); "pequeno" omite la etiqueta de texto
  // para ser mas compacto; "mediano" es el aspecto por defecto de 4.11.5.
  const WIDGET_SIZE_CYCLE = ["pequeno", "mediano", "grande", "completo"];
  const WIDGET_SIZE_SHORT = { pequeno: "P", mediano: "M", grande: "G", completo: "C" };

  function widgetPercentFor(type) {
    const sys = state.system || {};
    const mipc = findMipcDevice();
    if (type === "cpu") return sys.cpu != null ? Number(sys.cpu) : null;
    if (type === "ram") return sys.ramPercent != null ? Number(sys.ramPercent) : null;
    if (type === "gpu") {
      const pct = mipc?.metrics?.gpu?.usage_pct;
      return pct != null ? Number(pct) : null;
    }
    if (type === "temp") {
      // escala aproximada 0-90C -> 0-100%, solo para la barra visual
      return sys.temp != null ? Math.max(0, Math.min(100, Math.round((Number(sys.temp) / 90) * 100))) : null;
    }
    return null;
  }

  function widgetCardHtml(widget) {
    const meta = WIDGET_TYPES[widget.type] || { label: widget.type, icon: "❔" };
    const { value, label } = widgetValueLabel(widget.type);
    const size = widget.size || "mediano";
    const pct = widgetPercentFor(widget.type);
    const showBar = pct != null && (size === "grande" || size === "completo");
    const barHtml = showBar
      ? `<div class="widget-bar"><div class="widget-bar-fill" style="width:${pct}%"></div></div>`
      : "";
    const controlsHtml = state.customPageManaging
      ? `<div class="widget-card-controls">
           <button type="button" class="widget-size-btn" data-widget-size="${widget.id}">${WIDGET_SIZE_SHORT[size] || "M"}</button>
           <button type="button" class="widget-remove-btn" data-widget-remove="${widget.id}">✕</button>
         </div>`
      : "";
    return `
      <div class="widget-card widget-size-${size}">
        ${controlsHtml}
        <span style="font-size:1.1rem">${meta.icon}</span>
        <span class="widget-value">${escHtml(value)}</span>
        ${size !== "pequeno" ? `<span class="widget-label">${escHtml(label)}</span>` : ""}
        ${barHtml}
      </div>`;
  }

  function renderCustomPageWidgets() {
    const page = state.currentCustomPage;
    const container = document.getElementById("custom-page-widgets");
    if (!page || !container) return;
    const widgets = page.widgets || [];
    container.innerHTML = widgets.length
      ? widgets.map(widgetCardHtml).join("")
      : `<p class="sic-sub">Esta página está vacía. Pulsa "Gestionar" para añadir widgets.</p>`;
    container.querySelectorAll("[data-widget-remove]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const widgetId = btn.getAttribute("data-widget-remove");
        try {
          const updated = await api(`/api/ui/pages/${page.id}/widgets/${widgetId}`, { method: "DELETE" });
          state.currentCustomPage = updated;
          const idx = (state.uiPages || []).findIndex((p) => p.id === page.id);
          if (idx >= 0) state.uiPages[idx] = updated;
          renderCustomPageWidgets();
        } catch (err) {
          toast(err.message || "Error al quitar widget");
        }
      });
    });
    container.querySelectorAll("[data-widget-size]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const widgetId = btn.getAttribute("data-widget-size");
        const w = (page.widgets || []).find((x) => x.id === widgetId);
        if (!w) return;
        const currentIdx = WIDGET_SIZE_CYCLE.indexOf(w.size || "mediano");
        const nextSize = WIDGET_SIZE_CYCLE[(currentIdx + 1) % WIDGET_SIZE_CYCLE.length];
        try {
          const updated = await api(`/api/ui/pages/${page.id}/widgets/${widgetId}/size`, {
            method: "PUT",
            body: JSON.stringify({ size: nextSize }),
          });
          state.currentCustomPage = updated;
          const idx = (state.uiPages || []).findIndex((p) => p.id === page.id);
          if (idx >= 0) state.uiPages[idx] = updated;
          renderCustomPageWidgets();
        } catch (err) {
          toast(err.message || "Error al cambiar tamaño");
        }
      });
    });
  }

  function renderWidgetPicker() {
    const picker = document.getElementById("custom-page-widget-picker");
    if (!picker) return;
    picker.innerHTML = Object.entries(WIDGET_TYPES)
      .map(
        ([type, meta]) => `
      <button type="button" class="sys-icon-card" data-widget-add="${type}">
        <span class="sic-ico sic-blue">${meta.icon}</span>
        <span class="sic-title">${meta.label}</span>
      </button>`
      )
      .join("");
    picker.querySelectorAll("[data-widget-add]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const type = btn.getAttribute("data-widget-add");
        const page = state.currentCustomPage;
        if (!page) return;
        try {
          const updated = await api(`/api/ui/pages/${page.id}/widgets`, {
            method: "POST",
            body: JSON.stringify({ type }),
          });
          state.currentCustomPage = updated;
          const idx = (state.uiPages || []).findIndex((p) => p.id === page.id);
          if (idx >= 0) state.uiPages[idx] = updated;
          renderCustomPageWidgets();
          toast("Widget añadido");
        } catch (err) {
          toast(err.message || "Error al añadir widget");
        }
      });
    });
  }

  function openCustomPagePanel(page) {
    if (!els.customPagePanel) return;
    state.currentCustomPage = page;
    state.customPageManaging = false;
    if (els.customPageTitle) els.customPageTitle.textContent = `${page.icon} ${page.name}`;
    const addWidgetBox = document.getElementById("custom-page-add-widget");
    if (addWidgetBox) addWidgetBox.hidden = true;
    const manageBtn = document.getElementById("custom-page-manage-btn");
    if (manageBtn) manageBtn.textContent = "Gestionar";
    renderWidgetPicker();
    renderCustomPageWidgets();
    closeNavegacionPanel();
    els.customPagePanel.hidden = false;
    // Refresca los valores de los widgets mientras la pagina esta abierta,
    // igual que otros paneles con datos en vivo (Estado/Actividad/Salud).
    if (state.customPageTimer) clearInterval(state.customPageTimer);
    state.customPageTimer = setInterval(() => {
      if (!state.customPageManaging) renderCustomPageWidgets();
    }, 5000);
  }

  document.getElementById("custom-page-manage-btn")?.addEventListener("click", () => {
    if (!state.customPageManaging && !requireEditUnlocked()) return;
    state.customPageManaging = !state.customPageManaging;
    const btn = document.getElementById("custom-page-manage-btn");
    if (btn) btn.textContent = state.customPageManaging ? "Listo" : "Gestionar";
    const addWidgetBox = document.getElementById("custom-page-add-widget");
    if (addWidgetBox) addWidgetBox.hidden = !state.customPageManaging;
    renderCustomPageWidgets();
  });

  els.customPageBack?.addEventListener("click", () => {
    closeCustomPagePanel();
    openNavegacionPanel().catch(() => {});
  });

  // —— Dock inferior configurable 4.11.7 ——
  // Los 4 iconos SVG fijos son exactamente los que antes estaban escritos a
  // mano en index.html - se movieron aqui tal cual, no se redisenaron. El
  // dock ahora se genera desde config en vez de HTML estatico, pero el
  // aspecto/comportamiento de los 4 botones fijos no cambia.
  const FIXED_NAV_META = {
    inicio: {
      label: "Inicio",
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/></svg>`,
    },
    servicios: {
      label: "Servicios",
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 7.5 12 12l8-4.5L12 3z"/><path d="M4 12.5 12 17l8-4.5"/><path d="M4 16.5 12 21l8-4.5"/></svg>`,
    },
    sistema: {
      label: "Sistema",
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7"/></svg>`,
      // 21/08/2026 - usuario: "quitame el numero de notificaciones en el
      // sistema ya que no me interesa" - badge quitado a proposito. El
      // resto de la logica de unseenCount/notificaciones sigue intacta
      // (Eventos, Alertas, el widget "Alertas sin ver" de Inicio), esto
      // solo apaga el numerito sobre el icono de Sistema en la barra.
    },
    dispositivos: {
      label: "Dispositivos",
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2.2"/><path d="M11 18h2"/></svg>`,
    },
  };

  const DEFAULT_DOCK = {
    items: [
      { id: "inicio", type: "fixed" },
      { id: "servicios", type: "fixed" },
      { id: "sistema", type: "fixed" },
      { id: "dispositivos", type: "fixed" },
    ],
    iconSize: "normal",
  };

  function dockItemHtml(item) {
    if (item.type === "fixed") {
      const meta = FIXED_NAV_META[item.id];
      if (!meta) return "";
      const badgeHtml = meta.badge ? `<span class="nav-badge" id="nav-badge-sistema" hidden>0</span>` : "";
      return `
        <button class="nav-item" data-nav="${item.id}" type="button">
          <span class="nav-ico" aria-hidden="true">${meta.svg}${badgeHtml}</span>
          <span>${escHtml(meta.label)}</span>
        </button>`;
    }
    const page = (state.uiPages || []).find((p) => p.id === item.id);
    if (!page) return "";
    const iconSize = (state.dockConfig || DEFAULT_DOCK).iconSize || "normal";
    const emojiPx = { pequeno: 18, normal: 20, grande: 28 }[iconSize] || 20;
    return `
      <button class="nav-item" data-nav-custom="${item.id}" type="button">
        <span class="nav-ico" aria-hidden="true" style="font-size:${emojiPx}px;line-height:1">${escHtml(page.icon)}</span>
        <span>${escHtml(page.name)}</span>
      </button>`;
  }

  function renderDock() {
    const dock = state.dockConfig || DEFAULT_DOCK;
    const nav = document.getElementById("app-nav");
    if (!nav) return;
    nav.className = `nav dock-size-${dock.iconSize || "normal"}`;
    nav.style.gridTemplateColumns = `repeat(${Math.max(1, dock.items.length)}, 1fr)`;
    nav.innerHTML = dock.items.map(dockItemHtml).join("");
    nav.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.nav === state.appNav);
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        if (btn.dataset.navCustom) {
          const page = (state.uiPages || []).find((p) => p.id === btn.dataset.navCustom);
          if (page) openCustomPagePanel(page);
          return;
        }
        setAppNav(btn.dataset.nav);
      });
    });
    // El span del badge de Sistema se recrea en cada render - re-capturar
    // la referencia y re-aplicar el valor actual, si no el badge quedaria
    // "vivo" solo hasta el primer redibujado del dock.
    els.navBadgeSistema = document.getElementById("nav-badge-sistema");
    setNotificationBadge(state.unseenCount || 0);
  }

  // —— Menú rápido 4.11.9 ——
  els.quickMenuPanel = document.getElementById("quick-menu-panel");
  els.quickMenuBody = document.getElementById("quick-menu-body");
  els.quickMenuBack = document.getElementById("quick-menu-back");

  function closeQuickMenuPanel() {
    if (els.quickMenuPanel) els.quickMenuPanel.hidden = true;
  }

  // 4.11.10 - Ejecucion "de un toque" compartida entre el Menu rapido
  // (4.11.9) y los tiles de Escenas en Inicio - una sola implementacion,
  // no una copia por sitio donde aparecen tiles de escena.
  async function runQuickScene(id, name, btn) {
    if (btn) btn.disabled = true;
    toast(`Ejecutando ${name || "escena"}…`);
    try {
      const result = await api(`/api/scenes/${id}/run`, { method: "POST", body: "{}" });
      toast(result.success !== false ? `✓ ${name || "Escena"} ejecutada` : `⚠️ ${name || "Escena"}: revisa el resultado`);
    } catch (err) {
      toast(err.message || "Error al ejecutar escena");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function sceneTileHtml(s) {
    return `
      <button type="button" class="sys-icon-card" data-scene-tile="${s.id}">
        <span class="sic-ico sic-purple">🎬</span>
        <span class="sic-title">${escHtml(s.name)}</span>
      </button>`;
  }

  function bindSceneTiles(container, scenesArr) {
    container.querySelectorAll("[data-scene-tile]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-scene-tile");
        const scene = scenesArr.find((s) => s.id === id);
        runQuickScene(id, scene?.name, btn);
      });
    });
  }

  function renderQuickMenuBody() {
    if (!els.quickMenuBody) return;
    const mipc = findMipcDevice();
    const docker = state.docker || {};
    const sp = state.spotify;
    const scenesArr = state.scenes || [];

    const statusRow = (icon, label, value) => `
      <div class="docker-actions" style="justify-content:space-between;margin-bottom:8px">
        <span>${icon} ${escHtml(label)}</span>
        <strong>${escHtml(value)}</strong>
      </div>`;

    const statusHtml = `
      <div class="plugin-card" style="margin-bottom:10px">
        ${statusRow("🖥️", "MI-PC", mipc ? (mipc.online ? "🟢 Online" : "🔴 Offline") : "—")}
        ${statusRow("🐳", "Docker", docker.docker === "online" ? `🟢 ${docker.running ?? 0} activos` : "🔴 Offline")}
        ${statusRow("🎵", "Spotify", sp?.connected ? (sp.playing ? "▶️ Reproduciendo" : "⏸ Listo") : "Sin conectar")}
        ${statusRow("🔔", "Alertas", state.unseenCount != null ? String(state.unseenCount) : "—")}
      </div>`;

    const scenesHtml = scenesArr.length
      ? `<div class="plugin-card">
          <strong>Escenas</strong>
          <div class="sys-grid-2" style="margin-top:8px">
            ${scenesArr.map(sceneTileHtml).join("")}
          </div>
        </div>`
      : `<div class="plugin-card"><strong>Escenas</strong><p class="sic-sub">Sin escenas creadas todavía — créalas en Sistema → Escenas</p></div>`;

    const t = sp && sp.connected ? sp.track : null;
    const musicHtml = t
      ? `<div class="plugin-card qm-music" style="margin-bottom:10px">
          <div class="qm-music-row">
            ${t.image ? `<img class="qm-music-cover" src="${escHtml(t.image)}" alt="" />` : ""}
            <div class="qm-music-text"><strong>${escHtml(t.name)}</strong><span>${escHtml(t.artists || "")}${sp.device ? ` · ${escHtml(sp.device.name)}` : ""}</span></div>
          </div>
          <div class="qm-music-ctrls">
            <button type="button" data-qm-music="previous" aria-label="Anterior">${bmIcon("prev")}</button>
            <button type="button" class="qm-main" data-qm-music="${sp.playing ? "pause" : "play"}" aria-label="${sp.playing ? "Pausar" : "Reproducir"}">${bmIcon(sp.playing ? "pause" : "play")}</button>
            <button type="button" data-qm-music="next" aria-label="Siguiente">${bmIcon("next")}</button>
            <button type="button" class="qm-open" data-qm-music="open">BMO Music</button>
          </div>
        </div>`
      : "";

    els.quickMenuBody.innerHTML = statusHtml + musicHtml + scenesHtml;
    bindSceneTiles(els.quickMenuBody, scenesArr);
    els.quickMenuBody.querySelectorAll("[data-qm-music]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.qmMusic;
        if (action === "open") {
          closeQuickMenuPanel();
          openBmoMusic();
          return;
        }
        try {
          await api(`/api/spotify/${action}`, { method: "POST", body: "{}" });
          await refreshSpotifyStatus();
          renderQuickMenuBody();
        } catch (err) {
          toast(`BMO Music: ${err.message}`);
        }
      });
    });
  }

  async function openQuickMenuPanel() {
    if (!els.quickMenuPanel) {
      toast("Menú rápido no disponible");
      return;
    }
    closeAllSysPanels();
    try {
      const data = await api("/api/scenes");
      state.scenes = data.scenes || [];
    } catch {
      /* se muestra lo que ya hubiera en cache, o la lista vacia */
    }
    renderQuickMenuBody();
    els.quickMenuPanel.hidden = false;
  }

  els.quickMenuBack?.addEventListener("click", () => {
    closeQuickMenuPanel();
    openSysHub();
  });

  async function loadDockConfig() {
    try {
      const [dockData, pagesData] = await Promise.all([api("/api/ui/dock"), api("/api/ui/pages")]);
      state.dockConfig = dockData;
      state.uiPages = pagesData.pages || [];
      renderDock();
    } catch {
      // se queda con el dock por defecto ya renderizado
    }
  }

  // —— Modo edición seguro 4.11.15 ——
  // Candado GLOBAL, en memoria (no persistido - se resetea a bloqueado en
  // cada carga de la pagina, a proposito: si el kiosco se deja abierto,
  // tras un refresh vuelve a estar protegido, no queda desbloqueado para
  // siempre). No oculta los controles de edicion ya construidos en 4.11.2/
  // 4.11.5/4.11.7 - los deja exactamente donde estan, pero cada uno
  // consulta requireEditUnlocked() antes de activar su propio modo de
  // edicion, en vez de reconstruir esos flujos desde cero.
  state.editModeUnlocked = false;

  function requireEditUnlocked() {
    if (state.editModeUnlocked) return true;
    toast("🔒 Modo edición bloqueado — mantén pulsada la pantalla principal para desbloquear");
    return false;
  }

  function toggleEditModeUnlocked() {
    state.editModeUnlocked = !state.editModeUnlocked;
    toast(state.editModeUnlocked ? "🔓 Modo edición desbloqueado" : "🔒 Interfaz bloqueada");
  }

  // —— Gestos táctiles 4.11.8 ——
  // Deliberadamente con "zonas de guarda" para no interferir con gestos que
  // YA tienen su propio manejo (paginador de Servicios 4.11.3, arrastre de
  // reordenar 4.11.2) ni con el scroll vertical normal dentro de paneles
  // largos (Eventos, Actividad, etc.) - sin poder probar el tacto real en el
  // dispositivo, la prioridad es no romper nada que ya funcione.
  function anyOverlayOpen() {
    return !!document.querySelector(".sys-sub-panel:not([hidden])");
  }

  function fixedPagesInDockOrder() {
    const dock = state.dockConfig || DEFAULT_DOCK;
    return dock.items.filter((i) => i.type === "fixed").map((i) => i.id);
  }

  function swipeToAdjacentPage(direction) {
    const pages = fixedPagesInDockOrder();
    if (pages.length < 2) return;
    const idx = pages.indexOf(state.appNav);
    if (idx === -1) return;
    const nextIdx = (idx + direction + pages.length) % pages.length;
    setAppNav(pages[nextIdx]);
  }

  const GESTURE_LONG_PRESS_MS = 550;
  const GESTURE_DOUBLE_TAP_MS = 320;
  const GESTURE_MIN_DELTA = 50;

  function initGlobalGestures() {
    const root = document.querySelector(".app");
    if (!root) return;
    let start = null;
    let longPressTimer = null;
    let lastTapAt = 0;

    function inGuardedZone(target) {
      return !!target.closest(".services-pager, .services-grid.reordering, .sys-sub-panel, #app-nav");
    }

    root.addEventListener("pointerdown", (e) => {
      start = { x: e.clientX, y: e.clientY, t: Date.now(), guarded: inGuardedZone(e.target), inHeader: !!e.target.closest(".header") };
      if (!start.guarded) {
        longPressTimer = setTimeout(() => {
          longPressTimer = null;
          if (start && !anyOverlayOpen()) {
            toggleEditModeUnlocked();
          }
        }, GESTURE_LONG_PRESS_MS);
      }
    });

    root.addEventListener("pointerup", (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      if (!start || start.guarded) {
        start = null;
        return;
      }
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dt = Date.now() - start.t;
      const wasHeader = start.inHeader;
      start = null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Toque simple (sin desplazamiento apreciable)
      if (absX < GESTURE_MIN_DELTA && absY < GESTURE_MIN_DELTA) {
        if (wasHeader) {
          const now = Date.now();
          if (now - lastTapAt < GESTURE_DOUBLE_TAP_MS) {
            lastTapAt = 0;
            openEstadoPanel().catch(() => {});
          } else {
            lastTapAt = now;
          }
        }
        return;
      }

      if (anyOverlayOpen()) return; // solo navegar/abrir paneles desde una vista principal limpia

      if (absX > absY && absX >= GESTURE_MIN_DELTA) {
        swipeToAdjacentPage(dx < 0 ? 1 : -1); // izquierda -> siguiente, derecha -> anterior
      } else if (absY > absX && absY >= GESTURE_MIN_DELTA && wasHeader) {
        if (dy < 0) {
          openQuickMenuPanel().catch(() => {}); // swipe arriba
        } else {
          openEventsPanel().catch(() => {}); // swipe abajo -> notificaciones
        }
      }
    });

    root.addEventListener("pointercancel", () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      start = null;
    });
  }

  // —— Tareas 4.10.6 ——
  els.tareasPanel = document.getElementById("tareas-panel");
  els.tareasBody = document.getElementById("tareas-body");
  els.tareasBack = document.getElementById("tareas-back");

  function closeTareasPanel() {
    if (els.tareasPanel) els.tareasPanel.hidden = true;
    if (state.tareasTimer) {
      clearInterval(state.tareasTimer);
      state.tareasTimer = null;
    }
  }

  const TASK_STATUS_DOT = { running: "🟡", done: "🟢", error: "🔴" };
  const TASK_TYPE_ICON = { backup: "💾", "compose-deploy": "🐳", "compose-update": "🔄" };

  function taskProgressRowHtml(t) {
    const dot = TASK_STATUS_DOT[t.status] || "⚪";
    const icon = TASK_TYPE_ICON[t.type] || "🔧";
    const statusText =
      t.status === "running"
        ? `${t.progress ?? 0}%${t.detail ? ` — ${escHtml(t.detail)}` : ""}`
        : t.status === "done"
        ? `Completado${t.detail ? ` — ${escHtml(t.detail)}` : ""}`
        : `Error${t.detail ? ` — ${escHtml(t.detail)}` : ""}`;
    return `<div class="plugin-card" style="margin-bottom:10px">
      <div class="docker-actions" style="justify-content:space-between">
        <strong>${dot} ${icon} ${escHtml(t.label)}</strong>
      </div>
      <div class="task-progress"><div class="task-progress-fill" style="width:${Math.max(0, Math.min(100, t.progress || 0))}%"></div></div>
      <p class="sic-sub" style="margin:4px 0 0">${statusText}</p>
    </div>`;
  }

  function renderTareasBody() {
    if (!els.tareasBody) return;
    const list = state.tareasList || [];
    els.tareasBody.innerHTML = list.length
      ? list.map(taskProgressRowHtml).join("")
      : `<p class="tagline">Sin tareas en curso ni recientes.</p>`;
  }

  async function refreshTareas() {
    try {
      const data = await api("/api/tasks");
      state.tareasList = data.tasks || [];
      renderTareasBody();
    } catch (err) {
      if (els.tareasBody) els.tareasBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
    }
  }

  async function openTareasPanel() {
    if (!els.tareasPanel || !els.tareasBody) {
      toast("Tareas no disponible");
      return;
    }
    closeSysHub();
    els.tareasPanel.hidden = false;
    els.tareasBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await refreshTareas();
    if (state.tareasTimer) clearInterval(state.tareasTimer);
    state.tareasTimer = setInterval(() => refreshTareas().catch(() => {}), 2000);
  }

  els.tareasBack?.addEventListener("click", () => {
    closeTareasPanel();
    openSysHub();
  });

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForTask(taskId, { intervalMs = 1500, timeoutMs = 15 * 60000 } = {}) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const { task } = await api(`/api/tasks/${encodeURIComponent(taskId)}`);
      if (task.status !== "running") return task;
      await wait(intervalMs);
    }
    throw new Error("La tarea sigue en curso, revisa Sistema → Tareas");
  }

  // —— Event Center 4.5 ——
  state.eventsFilter = "all";
  state.eventsRecent = null;
  state.eventsTimer = null;

  els.eventsPanel = document.getElementById("events-panel");
  els.eventsBody = document.getElementById("events-body");
  els.eventsBack = document.getElementById("events-back");
  els.eventsRefresh = document.getElementById("events-refresh");
  els.actividadPanel = document.getElementById("actividad-panel");
  els.actividadBody = document.getElementById("actividad-body");
  els.actividadBack = document.getElementById("actividad-back");

  const ACTIVITY_SOURCE_ICONS = {
    mipc: "🖥️",
    "device-agent": "🖥️",
    spotify: "🎵",
    docker: "🐳",
    automation: "🎮",
    alerts: "🚨",
    plugin: "🧩",
    system: "🍓",
    scene: "🎬",
    health: "🩺",
  };

  function closeActividadPanel() {
    if (els.actividadPanel) els.actividadPanel.hidden = true;
    if (state.actividadTimer) {
      clearInterval(state.actividadTimer);
      state.actividadTimer = null;
    }
  }

  function renderActividadBody() {
    if (!els.actividadBody) return;
    const list = state.actividadEvents || [];
    if (!list.length) {
      els.actividadBody.innerHTML = `<p class="tagline">Sin actividad todavía.</p>`;
      return;
    }
    els.actividadBody.innerHTML = list
      .map((e) => {
        const icon = ACTIVITY_SOURCE_ICONS[e.source] || "🔹";
        const line = e.title || e.type || "evento";
        const msg = e.message ? ` — ${e.message}` : "";
        return `<div class="sys-list-row">
          <span>${icon} ${escHtml(line)}${escHtml(msg)}</span>
          <span class="sic-sub">${escHtml(formatHistoryWhen(e.time))}</span>
        </div>`;
      })
      .join("");
  }

  async function openActividadPanel() {
    if (!els.actividadPanel || !els.actividadBody) {
      toast("Actividad no disponible");
      return;
    }
    closeSysHub();
    els.actividadPanel.hidden = false;
    els.actividadBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    markNotificationsSeen();
    try {
      const data = await api("/api/events?limit=100");
      state.actividadEvents = data.recent || data.events || [];
      renderActividadBody();
    } catch (err) {
      els.actividadBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
    }
    if (state.actividadTimer) clearInterval(state.actividadTimer);
    state.actividadTimer = setInterval(() => {
      api("/api/events?limit=100")
        .then((data) => {
          state.actividadEvents = data.recent || data.events || [];
          renderActividadBody();
        })
        .catch(() => {});
    }, 15000);
  }

  els.actividadBack?.addEventListener("click", () => {
    closeActividadPanel();
    openSysHub();
  });

  els.estadoPanel = document.getElementById("estado-panel");
  els.estadoBody = document.getElementById("estado-body");
  els.estadoBack = document.getElementById("estado-back");
  els.navBadgeSistema = document.getElementById("nav-badge-sistema");

  function setNotificationBadge(count) {
    if (!els.navBadgeSistema) return;
    const n = Number(count) || 0;
    if (n <= 0) {
      els.navBadgeSistema.hidden = true;
      return;
    }
    els.navBadgeSistema.hidden = false;
    els.navBadgeSistema.textContent = n > 99 ? "99+" : String(n);
  }

  async function refreshNotificationBadge() {
    try {
      const data = await api("/api/events?limit=1");
      setNotificationBadge(data.unseenCount || 0);
    } catch {
      /* badge is best-effort */
    }
  }

  function markNotificationsSeen() {
    api("/api/events/seen", { method: "POST", body: "{}" })
      .then(() => refreshNotificationBadge())
      .catch(() => {});
  }

  function closeEstadoPanel() {
    if (els.estadoPanel) els.estadoPanel.hidden = true;
    if (state.estadoTimer) {
      clearInterval(state.estadoTimer);
      state.estadoTimer = null;
    }
  }

  const ESTADO_ROW_META = {
    bmo: { label: "BMO", icon: "🍓" },
    mipc: { label: "MI-PC", icon: "🖥️" },
    docker: { label: "Docker", icon: "🐳" },
    spotify: { label: "Spotify", icon: "🎵" },
    grafana: { label: "Grafana", icon: "📊" },
    alerts: { label: "Alertas", icon: "🔔" },
  };

  function estadoStatusDot(status) {
    if (["online", "healthy", "connected", "ok"].includes(status)) return "🟢";
    if (["warning"].includes(status)) return "🟡";
    if (["offline", "disconnected", "critical"].includes(status)) return "🔴";
    return "⚪";
  }

  function estadoStatusText(key, row) {
    if (key === "mipc") return row.status === "online" ? "Online" : row.status === "offline" ? "Offline" : "Desconocido";
    if (key === "docker") {
      if (row.status === "healthy") return `Healthy (${row.running}/${row.total})`;
      if (row.status === "warning") return `${row.unhealthy?.length || 0} no saludable(s)`;
      if (row.status === "offline") return "Sin conexión";
      return "Desconocido";
    }
    if (key === "spotify") return row.status === "connected" ? "Connected" : "Disconnected";
    if (key === "grafana") return row.status === "online" ? "Online" : row.status === "warning" ? "Con avisos" : "Offline";
    if (key === "alerts") {
      if (row.status === "ok") return "Sin avisos activos";
      const parts = [];
      if (row.criticalCount) parts.push(`${row.criticalCount} critical`);
      if (row.warningCount) parts.push(`${row.warningCount} warning`);
      return parts.join(" · ") || "Sin avisos activos";
    }
    return row.status === "online" ? "Online" : row.status;
  }

  function renderEstadoBody(state_) {
    if (!els.estadoBody) return;
    const rows = Object.entries(ESTADO_ROW_META)
      .map(([key, meta]) => {
        const row = state_[key] || { status: "unknown" };
        return `<div class="sys-list-row">
          <span>${meta.icon} ${meta.label}</span>
          <span class="sic-sub">${estadoStatusDot(row.status)} ${escHtml(estadoStatusText(key, row))}</span>
        </div>`;
      })
      .join("");
    const updated = state_.updatedAt ? formatHistoryWhen(state_.updatedAt) : "";
    els.estadoBody.innerHTML = `${rows}<p class="tagline" style="margin-top:12px">Actualizado: ${escHtml(updated)}</p>`;
  }

  async function refreshEstado() {
    try {
      const data = await api("/api/system/state");
      renderEstadoBody(data);
    } catch (err) {
      if (els.estadoBody) els.estadoBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
    }
  }

  async function openEstadoPanel() {
    if (!els.estadoPanel || !els.estadoBody) {
      toast("Estado BMO no disponible");
      return;
    }
    closeSysHub();
    els.estadoPanel.hidden = false;
    els.estadoBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    markNotificationsSeen();
    await refreshEstado();
    if (state.estadoTimer) clearInterval(state.estadoTimer);
    state.estadoTimer = setInterval(() => refreshEstado().catch(() => {}), 10000);
  }

  els.estadoBack?.addEventListener("click", () => {
    closeEstadoPanel();
    openSysHub();
  });

  function closeEventsPanel() {
    if (els.eventsPanel) els.eventsPanel.hidden = true;
    if (state.eventsTimer) {
      clearInterval(state.eventsTimer);
      state.eventsTimer = null;
    }
  }

  // 6.3.3 - 5 niveles (antes 3): info < notice < warning < error < critical.
  const EVENT_LEVEL_EMOJI = { info: "🟢", notice: "🔵", warning: "🟠", error: "🔴", critical: "💀" };

  function eventLevelBadge(level) {
    const lvl = String(level || "info").toLowerCase();
    const emoji = EVENT_LEVEL_EMOJI[lvl] || "🟢";
    return `<span class="event-lvl ${escHtml(lvl)}">${emoji} ${escHtml(lvl)}</span>`;
  }

  function fmtEventTime(t) {
    if (!t) return "—";
    try {
      const d = new Date(t);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      }
    } catch {}
    return String(t).replace("T", " ").slice(11, 19);
  }

  function renderEventsBody() {
    if (!els.eventsBody) return;
    const filter = state.eventsFilter || "all";
    els.eventsPanel?.querySelectorAll(".events-filter").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-events-filter") === filter);
    });
    let events = (state.eventsRecent && state.eventsRecent.events) || [];
    // 7.2.27 (KAN-185) - Multimodal Timeline: filtro real por eventos que ya
    // vienen de una modalidad visual (camera.person_detected/camera.no_person,
    // los unicos tipos reales que emite cameraTriggerService.js hoy) - no se
    // inventa una fuente de eventos nueva, se filtra por tipo en vez de por
    // nivel dentro del MISMO Event Center ya existente.
    if (filter === "multimodal") {
      events = events.filter((e) => String(e.type || "").startsWith("camera."));
    } else if (filter !== "all") {
      events = events.filter((e) => String(e.level || "").toLowerCase() === filter);
    }
    if (!events.length) {
      els.eventsBody.innerHTML = `<div class="perf-block"><p class="tagline">Sin eventos</p></div>`;
      return;
    }
    els.eventsBody.innerHTML = `
      <div class="perf-block">
        <h3>Últimos eventos (${events.length})</h3>
        <div class="perf-docker-list">
          ${events
            .map((e) => {
              const lvl = String(e.level || "info").toLowerCase();
              return `<div class="event-row ${escHtml(lvl)}">
                <div class="top">
                  <span class="title">${escHtml(e.title || e.type || "—")}</span>
                  ${eventLevelBadge(lvl)}
                </div>
                <div class="body">${escHtml(e.message || "")}</div>
                <div class="meta">${escHtml(fmtEventTime(e.time))} · ${escHtml(
                  e.source || ""
                )} · ${escHtml(e.type || "")}
                  <button type="button" class="activity-more" data-dismiss-event="${escHtml(
                    e.id || ""
                  )}">Descartar</button>
                </div>
              </div>`;
            })
            .join("")}
        </div>
      </div>`;
    els.eventsBody.querySelectorAll("[data-dismiss-event]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-dismiss-event");
        if (!id) return;
        try {
          await api(`/api/events/${encodeURIComponent(id)}`, { method: "DELETE" });
          await refreshEvents();
          toast("Evento descartado");
        } catch (err) {
          toast(err.message || "Error");
        }
      });
    });
  }

  function eventsWsUrl() {
    const base = API_BASE || `${window.location.protocol}//${window.location.host}`;
    const wsBase = base.replace(/^http/, "ws");
    return `${wsBase}/api/events/ws?key=${encodeURIComponent(API_KEY)}`;
  }

  function connectEventsWs() {
    let ws;
    try {
      ws = new WebSocket(eventsWsUrl());
    } catch {
      setTimeout(connectEventsWs, 5000);
      return;
    }
    ws.onmessage = (msg) => {
      let data;
      try {
        data = JSON.parse(msg.data);
      } catch {
        return;
      }
      if (data.type === "event:snapshot") {
        state.eventsRecent = { events: data.recent || [] };
        if (!els.eventsPanel?.hidden) renderEventsBody();
      } else if (data.type === "event:new" && data.event) {
        const events = (state.eventsRecent && state.eventsRecent.events) || [];
        state.eventsRecent = { events: [data.event, ...events].slice(0, 80) };
        if (!els.eventsPanel?.hidden) renderEventsBody();
        if (data.event.level === "warning" || data.event.level === "critical") refreshNotificationBadge();
        if (!els.actividadPanel?.hidden) {
          state.actividadEvents = [data.event, ...(state.actividadEvents || [])].slice(0, 100);
          renderActividadBody();
        }
      } else if (data.type === "event:dismissed" && data.id) {
        refreshNotificationBadge();
        state.eventsRecent = {
          events: ((state.eventsRecent && state.eventsRecent.events) || []).filter((e) => e.id !== data.id),
        };
        if (!els.eventsPanel?.hidden) renderEventsBody();
      }
    };
    ws.onclose = () => setTimeout(connectEventsWs, 5000);
    ws.onerror = () => ws.close();
  }

  async function refreshEvents() {
    try {
      const data = await api("/api/events?limit=80");
      state.eventsRecent = { events: data.recent || data.events || [] };
      // 4.10.18 - esta respuesta ya trae unseenCount; evita un segundo
      // round-trip a /api/events solo para el badge en el ciclo de refresh().
      setNotificationBadge(data.unseenCount || 0);
      state.unseenCount = data.unseenCount || 0; // 4.11.5 - para el widget de alertas
      if (!els.eventsPanel?.hidden) renderEventsBody();
    } catch (err) {
      if (els.eventsBody && !els.eventsPanel?.hidden) {
        els.eventsBody.innerHTML = `<p class="tagline">${escHtml(
          err.message || "Error eventos"
        )}</p>`;
      }
    }
  }

  async function openEventsPanel() {
    if (!els.eventsPanel || !els.eventsBody) {
      toast("Panel eventos no disponible");
      return;
    }
    closeSysHub();
    closePerfPanel();
    closeMonitorPanel();
    closePluginsPanel();
    closePermsPanel();
    closeConsentPanel();
    closeLogsPanel();
    closeSpotifyPanel();
    closeConfigPanel();
    closeAlertsPanel();
    els.eventsPanel.hidden = false;
    els.eventsBody.innerHTML = `<p class="tagline">Cargando eventos…</p>`;
    markNotificationsSeen();
    await refreshEvents();
    if (state.eventsTimer) clearInterval(state.eventsTimer);
    state.eventsTimer = setInterval(() => {
      refreshEvents().catch(() => {});
    }, 12000);
  }


  // —— Alertas 4.4 ——
  state.alertsTab = "active";
  state.alertsActive = null;
  state.alertsHistory = null;
  state.alertsConfig = null;
  state.alertsTimer = null;
  state.alertsDraft = null;

  els.alertsPanel = document.getElementById("alerts-panel");
  els.alertsBody = document.getElementById("alerts-body");
  els.alertsBack = document.getElementById("alerts-back");
  els.alertsRefresh = document.getElementById("alerts-refresh");
  els.alertsTest = document.getElementById("alerts-test");

  function closeAlertsPanel() {
    if (els.alertsPanel) els.alertsPanel.hidden = true;
    if (state.alertsTimer) {
      clearInterval(state.alertsTimer);
      state.alertsTimer = null;
    }
  }

  function levelBadge(level) {
    const lvl = String(level || "INFO").toUpperCase();
    const emoji = lvl === "CRITICAL" ? "🔴" : lvl === "WARNING" ? "🟡" : "🟢";
    return `<span class="alert-lvl ${escHtml(lvl)}">${emoji} ${escHtml(lvl)}</span>`;
  }

  function fmtAlertTime(t) {
    if (!t) return "—";
    try {
      return String(t).replace("T", " ").replace(/\.\d+Z$/, " UTC").replace("Z", " UTC");
    } catch {
      return String(t);
    }
  }

  function renderAlertsBody() {
    if (!els.alertsBody) return;
    const tab = state.alertsTab || "active";
    els.alertsPanel?.querySelectorAll(".alerts-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-alerts-tab") === tab);
    });

    if (tab === "active") {
      const alerts = (state.alertsActive && state.alertsActive.alerts) || [];
      if (!alerts.length) {
        els.alertsBody.innerHTML = `<div class="perf-block"><p class="tagline">Sin alertas activas 🟢</p></div>`;
        return;
      }
      els.alertsBody.innerHTML = `
        <div class="perf-block">
          <h3>Activas (${alerts.length})</h3>
          <div class="perf-docker-list">
            ${alerts
              .map(
                (a) => `
              <div class="alert-row">
                <div class="top">
                  <span class="title">${escHtml(a.title || a.name || a.id)}</span>
                  ${levelBadge(a.level)}
                </div>
                <div class="body">${escHtml(a.body || "")}</div>
                <div class="meta">${escHtml(fmtAlertTime(a.updatedAt || a.startedAt))}</div>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
      return;
    }

    if (tab === "history") {
      const events = (state.alertsHistory && state.alertsHistory.events) || [];
      if (!events.length) {
        els.alertsBody.innerHTML = `<div class="perf-block"><p class="tagline">Historial vacío</p></div>`;
        return;
      }
      els.alertsBody.innerHTML = `
        <div class="perf-block">
          <h3>Historial</h3>
          <div class="perf-docker-list">
            ${events
              .map(
                (e) => `
              <div class="alert-row">
                <div class="top">
                  <span class="title">${escHtml(e.title || e.id || "—")} · ${escHtml(
                    e.type || ""
                  )}</span>
                  ${levelBadge(e.level)}
                </div>
                <div class="body">${escHtml(e.body || "")}</div>
                <div class="meta">${escHtml(fmtAlertTime(e.time))} · ${escHtml(
                  e.status || ""
                )}</div>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
      return;
    }

    if (tab === "rules") {
      const cfg = state.alertsDraft || state.alertsConfig || { rules: {} };
      const rules = Object.values(cfg.rules || {});
      els.alertsBody.innerHTML = `
        <div class="perf-block">
          <h3>Reglas</h3>
          <div class="meta">Umbrales y acciones por regla. Se guardan en config/alerts.json</div>
        </div>
        ${rules
          .map((r) => {
            const actions = r.actions || {};
            return `
          <div class="alerts-rule" data-rule-id="${escHtml(r.id)}">
            <div class="rule-head">
              <strong>${escHtml(r.name || r.id)}</strong>
              <label style="display:flex;align-items:center;gap:6px;color:inherit">
                <input type="checkbox" data-rule-enabled ${r.enabled !== false ? "checked" : ""}/> Activa
              </label>
            </div>
            <div class="perf-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
              <label>Umbral
                <input type="number" data-rule-threshold value="${
                  r.threshold != null ? escHtml(String(r.threshold)) : ""
                }" />
              </label>
              <label>Duración (s)
                <input type="number" data-rule-duration value="${
                  r.durationSeconds != null ? escHtml(String(r.durationSeconds)) : "0"
                }" />
              </label>
            </div>
            <div class="alerts-actions">
              <label><input type="checkbox" data-act-ui ${
                actions.ui !== false ? "checked" : ""
              }/> BMO UI</label>
              <label><input type="checkbox" data-act-mipc ${
                actions.mipc !== false ? "checked" : ""
              }/> MI-PC</label>
              <label><input type="checkbox" data-act-telegram ${
                actions.telegram !== false ? "checked" : ""
              }/> Telegram</label>
            </div>
          </div>`;
          })
          .join("")}
        <div class="alerts-save-row">
          <button type="button" class="perf-link-btn" data-alerts-save-rules>Guardar reglas</button>
        </div>`;
      els.alertsBody.querySelector("[data-alerts-save-rules]")?.addEventListener("click", () => {
        saveAlertsRules().catch((err) => toast(err.message));
      });
      return;
    }

    if (tab === "channels") {
      const cfg = state.alertsDraft || state.alertsConfig || { channels: {} };
      const ch = cfg.channels || {};
      const mipc = ch.mipc || {};
      const tg = ch.telegram || {};
      const discord = ch.discord || {};
      const email = ch.email || {};
      els.alertsBody.innerHTML = `
        <div class="perf-block">
          <h3>Canales</h3>
          <div class="meta">MI-PC usa WebSocket toast. Telegram es secundario (token no se sube a git).</div>
        </div>
        <div class="alerts-channel">
          <div class="ch-head">
            <strong>MI-PC Windows</strong>
            <label><input type="checkbox" id="ch-mipc" ${
              mipc.enabled !== false ? "checked" : ""
            }/> Activo</label>
          </div>
          <div class="alerts-hint">Agente Windows → ws://${BMO_HOST}:8080/api/alerts/ws?key=…</div>
        </div>
        <div class="alerts-channel">
          <div class="ch-head">
            <strong>Telegram</strong>
            <label><input type="checkbox" id="ch-telegram" ${
              tg.enabled ? "checked" : ""
            }/> Activo</label>
          </div>
          <label>Bot token
            <input type="password" id="ch-tg-token" placeholder="${
              tg.hasToken ? "•••• (deja vacío para no cambiar)" : "123456:ABC..."
            }" value="" autocomplete="off" />
          </label>
          <label>Chat ID
            <input type="text" id="ch-tg-chat" value="${escHtml(tg.chatId || "")}" placeholder="-100..." />
          </label>
          <div class="alerts-hint">${escHtml(
            tg.hint ||
              "1) Habla con @BotFather → /newbot → copia el token. 2) Escribe a tu bot. 3) Abre https://api.telegram.org/bot<TOKEN>/getUpdates y copia chat.id. También puedes usar env BMO_TELEGRAM_BOT_TOKEN / BMO_TELEGRAM_CHAT_ID."
          )}</div>
        </div>
        <div class="alerts-channel">
          <div class="ch-head">
            <strong>Discord</strong>
            <label><input type="checkbox" id="ch-discord" ${
              discord.enabled ? "checked" : ""
            } disabled/> Próximamente</label>
          </div>
        </div>
        <div class="alerts-channel">
          <div class="ch-head">
            <strong>Email</strong>
            <label><input type="checkbox" id="ch-email" ${
              email.enabled ? "checked" : ""
            } disabled/> Próximamente</label>
          </div>
        </div>
        <div class="alerts-save-row">
          <button type="button" class="perf-link-btn" data-alerts-save-channels>Guardar canales</button>
          <button type="button" class="perf-link-btn" data-alerts-test-tg>Probar Telegram</button>
        </div>`;
      els.alertsBody.querySelector("[data-alerts-save-channels]")?.addEventListener("click", () => {
        saveAlertsChannels().catch((err) => toast(err.message));
      });
      els.alertsBody.querySelector("[data-alerts-test-tg]")?.addEventListener("click", () => {
        testAlerts("telegram").catch((err) => toast(err.message));
      });
    }
  }

  async function saveAlertsRules() {
    const rules = {};
    els.alertsBody.querySelectorAll(".alerts-rule").forEach((el) => {
      const id = el.getAttribute("data-rule-id");
      if (!id) return;
      rules[id] = {
        enabled: !!el.querySelector("[data-rule-enabled]")?.checked,
        threshold: Number(el.querySelector("[data-rule-threshold]")?.value),
        durationSeconds: Number(el.querySelector("[data-rule-duration]")?.value),
        actions: {
          ui: !!el.querySelector("[data-act-ui]")?.checked,
          mipc: !!el.querySelector("[data-act-mipc]")?.checked,
          telegram: !!el.querySelector("[data-act-telegram]")?.checked,
        },
      };
    });
    const data = await api("/api/alerts/config", {
      method: "PUT",
      body: JSON.stringify({ rules }),
    });
    state.alertsConfig = data.config || data;
    state.alertsDraft = null;
    toast("Reglas guardadas");
    renderAlertsBody();
  }

  async function saveAlertsChannels() {
    const tokenEl = document.getElementById("ch-tg-token");
    const chatEl = document.getElementById("ch-tg-chat");
    const telegram = {
      enabled: !!document.getElementById("ch-telegram")?.checked,
      chatId: chatEl ? chatEl.value.trim() : "",
    };
    const token = tokenEl ? tokenEl.value.trim() : "";
    if (token) telegram.botToken = token;
    const channels = {
      mipc: { enabled: !!document.getElementById("ch-mipc")?.checked },
      telegram,
      discord: { enabled: false },
      email: { enabled: false },
    };
    const data = await api("/api/alerts/config", {
      method: "PUT",
      body: JSON.stringify({ channels }),
    });
    state.alertsConfig = data.config || data;
    state.alertsDraft = null;
    toast("Canales guardados");
    renderAlertsBody();
  }

  async function testAlerts(channel = "all") {
    const data = await api("/api/alerts/test", {
      method: "POST",
      body: JSON.stringify({ channel, level: "WARNING" }),
    });
    const tg = data.results && data.results.telegram;
    if (channel === "telegram" || channel === "all") {
      if (tg && tg.skipped) {
        toast(`Telegram omitido: ${tg.reason || "sin token"}`);
      } else if (tg && tg.ok) {
        toast("Test Telegram enviado");
      } else if (tg && tg.error) {
        toast(`Telegram: ${tg.error}`);
      } else {
        toast("Alerta de prueba creada");
      }
    } else {
      toast("Alerta de prueba creada");
    }
    await refreshAlerts();
  }

  async function refreshAlerts() {
    try {
      const [active, history, cfg] = await Promise.all([
        api("/api/alerts"),
        api("/api/alerts/history?limit=80"),
        api("/api/alerts/config"),
      ]);
      state.alertsActive = active;
      state.alertsHistory = history;
      state.alertsConfig = cfg;
      if (!els.alertsPanel?.hidden) renderAlertsBody();
    } catch (err) {
      if (els.alertsBody && !els.alertsPanel?.hidden) {
        els.alertsBody.innerHTML = `<p class="tagline">${escHtml(
          err.message || "Error alertas"
        )}</p>`;
      }
      throw err;
    }
  }

  async function openAlertsPanel() {
    if (!els.alertsPanel || !els.alertsBody) {
      toast("Panel alertas no disponible");
      return;
    }
    closeSysHub();
    closePerfPanel();
    closeMonitorPanel();
    closePluginsPanel();
    closePermsPanel();
    closeConsentPanel();
    closeLogsPanel();
    closeSpotifyPanel();
    closeConfigPanel();
    closeEventsPanel();
    els.alertsPanel.hidden = false;
    els.alertsBody.innerHTML = `<p class="tagline">Cargando alertas…</p>`;
    await refreshAlerts();
    if (state.alertsTimer) clearInterval(state.alertsTimer);
    state.alertsTimer = setInterval(() => {
      refreshAlerts().catch(() => {});
    }, 15000);
  }



  function closeDevicesPanel() {
    if (els.devicesPanel) els.devicesPanel.hidden = true;
    if (state.agentTimer) {
      clearInterval(state.agentTimer);
      state.agentTimer = null;
    }
  }

  function fmtNum(v, suffix) {
    if (v == null || Number.isNaN(Number(v))) return "—";
    return `${v}${suffix || ""}`;
  }

  const ESTADO_META = {
    disponible: { emoji: "🟢", label: "Disponible" },
    ocupado: { emoji: "🟡", label: "Ocupado" },
    gaming: { emoji: "🔵", label: "Gaming" },
    trabajo: { emoji: "🟣", label: "Trabajo" },
    mantenimiento: { emoji: "🟠", label: "Mantenimiento" },
    problema: { emoji: "🔴", label: "Problema" },
    apagado: { emoji: "⚫", label: "Apagado" },
  };

  function estadoBadge(estado) {
    const key = (estado && estado.estado) || "disponible";
    const meta = ESTADO_META[key] || { emoji: "⚪", label: key };
    return `${meta.emoji} ${escHtml(meta.label)}`;
  }

  const HEARTBEAT_TIER_META = {
    online: { emoji: "🟢", label: "Online" },
    unstable: { emoji: "🟡", label: "Inestable" },
    offline: { emoji: "🔴", label: "Offline" },
  };

  function heartbeatTierBadge(tier) {
    const meta = HEARTBEAT_TIER_META[tier] || { emoji: "⚪", label: "Desconocido" };
    return `${meta.emoji} ${meta.label}`;
  }

  function agentCompatBadge(compat) {
    if (!compat || compat.compatible == null) return "";
    if (compat.compatible) return "✓ Compatible";
    return `⚠️ Actualiza el agente (${escHtml(compat.reason || "")})`;
  }

  // 5.1.9 - Semáforo de salud (CPU/RAM/disco/temperatura), distinto del
  // "estado" manual (disponible/gaming/...) que ya mostraba estadoBadge.
  function healthDot(health) {
    const level = health && health.level;
    if (level === "critical") return "🔴";
    if (level === "attention") return "🟡";
    if (level === "healthy") return "🟢";
    return "⚪";
  }

  function healthLabel(health) {
    const level = health && health.level;
    if (level === "unknown") return "Sin datos (offline)";
    if (!health || !health.reasons || !health.reasons.length) return "Todo normal";
    return health.reasons.join(", ");
  }

  function deviceIcon(d) {
    if (d.type === "self" || d.id === "raspberry") {
      return `<img src="./assets/raspberry.png" alt="" style="width:24px;height:24px;object-fit:contain" />`;
    }
    if (d.type === "android") return "📱";
    if (d.type === "linux-ssh") return "🐧";
    if (d.type === "camera") return "📷";
    if (d.type === "audio") return "🔊";
    if (d.type === "generic") return "📦";
    if (d.type === "windows" || d.id === "mi-pc") return "🖥️";
    return "💻";
  }

  const APP_CATEGORY_LABELS = {
    desarrollo: "Desarrollo",
    gaming: "Gaming",
    multimedia: "Multimedia",
    sistema: "Sistema",
  };

  const PROTECTED_PROCESS_NAMES = new Set([
    "explorer.exe",
    "dwm.exe",
    "winlogon.exe",
    "services.exe",
    "csrss.exe",
    "wininit.exe",
    "smss.exe",
    "lsass.exe",
    "system",
    "registry",
    "system idle process",
    "memory compression",
    // 2026-08-20 - usuario teletrabajando por AnyDesk ahora mismo: nunca
    // debe poder cerrarse por accidente desde la tabla de procesos.
    "anydesk.exe",
  ]);

  function launcherAppsHtml(focus) {
    const perms = focus.permissions || {};
    const canLaunch = focus.online && perms.apps;
    const catalogApps = (state.appCatalog || []).filter((a) => a.allowed !== false);
    if (!catalogApps.length) {
      return `<p class="tagline">Sin apps permitidas. Revisa el catálogo.</p>`;
    }
    return catalogApps
      .map(
        (a) => `<div class="plugin-card">
          <div><strong>${escHtml(a.name)}</strong><div class="docker-meta">${escHtml(APP_CATEGORY_LABELS[a.category] || a.category)}</div></div>
          <div class="docker-actions">
            <button type="button" class="dk-btn" data-app-launch="${escHtml(a.id)}" data-app-name="${escHtml(a.name)}" ${canLaunch ? "" : "disabled"}>Abrir</button>
            <button type="button" class="dk-btn ghost" data-app-close="${escHtml(a.id)}" data-app-name="${escHtml(a.name)}" ${canLaunch ? "" : "disabled"}>Cerrar</button>
          </div>
        </div>`
      )
      .join("");
  }

  function closeAppCatalogPanel() {
    if (els.appCatalogPanel) els.appCatalogPanel.hidden = true;
  }

  async function refreshAppCatalog() {
    const data = await api("/api/applications");
    state.appCatalog = data.apps || [];
    renderAppCatalogBody();
  }

  function renderAppCatalogBody() {
    if (!els.appCatalogBody) return;
    const apps = state.appCatalog || [];
    const order = ["desarrollo", "gaming", "multimedia", "sistema"];
    const groups = order
      .map((cat) => ({ cat, items: apps.filter((a) => a.category === cat) }))
      .filter((g) => g.items.length);

    const listHtml = groups.length
      ? groups
          .map(
            (g) => `
        <h3 class="sys-section-head">${escHtml(APP_CATEGORY_LABELS[g.cat] || g.cat)}</h3>
        <div class="sys-grid-2">
          ${g.items
            .map(
              (a) => `
            <div class="plugin-card">
              <div><strong>${escHtml(a.name)}</strong><div class="docker-meta">${escHtml(a.executable)}</div></div>
              <div class="docker-actions">
                <button type="button" class="dk-btn ${a.allowed ? "" : "ghost"}" data-app-toggle="${escHtml(a.id)}" data-app-allowed="${a.allowed ? "1" : "0"}">${a.allowed ? "Permitida" : "Bloqueada"}</button>
                ${a.builtin ? "" : `<button type="button" class="dk-btn ghost danger" data-app-remove="${escHtml(a.id)}">Eliminar</button>`}
              </div>
            </div>`
            )
            .join("")}
        </div>`
          )
          .join("")
      : `<p class="tagline">Sin apps en el catálogo.</p>`;

    els.appCatalogBody.innerHTML = `
      ${listHtml}
      <h3 class="sys-section-head">Añadir app</h3>
      <div class="config-form">
        <label>Nombre<input type="text" id="app-new-name" placeholder="Ej. Blender" /></label>
        <label>Ejecutable<input type="text" id="app-new-exec" placeholder="Ej. blender.exe" /></label>
        <label>Categoría
          <select id="app-new-category">
            ${order.map((c) => `<option value="${c}">${escHtml(APP_CATEGORY_LABELS[c])}</option>`).join("")}
          </select>
        </label>
        <button type="button" class="dk-btn" id="app-new-save">Añadir al catálogo</button>
      </div>`;

    els.appCatalogBody.querySelectorAll("[data-app-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-app-toggle");
        const current = btn.getAttribute("data-app-allowed") === "1";
        try {
          await api(`/api/applications/${id}/allowed`, {
            method: "PUT",
            body: JSON.stringify({ allowed: !current }),
          });
          await refreshAppCatalog();
        } catch (err) {
          toast(err.message || "Error actualizando app");
        }
      });
    });
    els.appCatalogBody.querySelectorAll("[data-app-remove]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-app-remove");
        if (!confirm("¿Eliminar esta app del catálogo?")) return;
        try {
          await api(`/api/applications/${id}`, { method: "DELETE" });
          await refreshAppCatalog();
        } catch (err) {
          toast(err.message || "Error eliminando app");
        }
      });
    });
    els.appCatalogBody.querySelector("#app-new-save")?.addEventListener("click", async () => {
      const name = els.appCatalogBody.querySelector("#app-new-name")?.value.trim();
      const executable = els.appCatalogBody.querySelector("#app-new-exec")?.value.trim();
      const category = els.appCatalogBody.querySelector("#app-new-category")?.value;
      if (!name || !executable) {
        toast("Nombre y ejecutable son obligatorios");
        return;
      }
      try {
        await api("/api/applications", {
          method: "POST",
          body: JSON.stringify({ name, executable, category }),
        });
        toast(`${name} añadida al catálogo`);
        await refreshAppCatalog();
      } catch (err) {
        toast(err.message || "Error añadiendo app");
      }
    });
  }

  async function openAppCatalogPanel() {
    if (!els.appCatalogPanel || !els.appCatalogBody) {
      toast("Catálogo de apps no disponible");
      return;
    }
    els.appCatalogPanel.hidden = false;
    els.appCatalogBody.innerHTML = `<p class="tagline">Cargando catálogo…</p>`;
    try {
      await refreshAppCatalog();
    } catch (err) {
      els.appCatalogBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error catálogo")}</p>`;
    }
  }

  function closeDeviceHistoryPanel() {
    if (els.deviceHistoryPanel) els.deviceHistoryPanel.hidden = true;
  }

  function formatHistoryEvent(evt) {
    const data = evt.data || {};
    if (evt.type === "device.wol") {
      return { ok: true, text: "⚡ Encendido enviado (Wake-on-LAN)" };
    }
    if (evt.type === "device.online") {
      return { ok: true, text: "🟢 Dispositivo online" };
    }
    if (evt.type === "device.offline") {
      return { ok: false, text: "🔴 Dispositivo offline" };
    }
    if (evt.type === "device.action" && data.action === "set-estado") {
      return { ok: true, text: escHtml(evt.message || "Estado cambiado") };
    }
    if (evt.type === "device.action.result") {
      const r = data.result || {};
      const ok = r.ok !== false;
      let text;
      if (r.action === "open") text = `${escHtml(r.target || "App")} iniciado`;
      else if (r.action === "close") text = `${escHtml(r.target || "App")} cerrado`;
      else if (r.action === "close-process") text = `Proceso ${escHtml(r.name || r.pid || "")} cerrado`;
      else if (r.action === "shutdown") text = "Apagado";
      else if (r.action === "reboot") text = "Reiniciado";
      else if (r.action === "sleep") text = "Suspendido";
      else if (r.action === "lock") text = "Bloqueado";
      else if (r.action === "profile") {
        const opened = (r.opened || []).length;
        const closed = (r.closed || []).length;
        text = `Perfil aplicado: ${opened} abierta(s), ${closed} cerrada(s)`;
      } else text = escHtml(r.action || "Acción");
      if (!ok && r.error) text += ` — ${escHtml(r.error)}`;
      return { ok, text };
    }
    return { ok: true, text: escHtml(evt.title || evt.message || evt.type) };
  }

  async function openDeviceHistoryPanel(deviceId, deviceName) {
    if (!els.deviceHistoryPanel || !els.deviceHistoryBody) {
      toast("Historial no disponible");
      return;
    }
    if (els.deviceHistoryTitle) els.deviceHistoryTitle.textContent = `Historial · ${deviceName || deviceId}`;
    els.deviceHistoryPanel.hidden = false;
    els.deviceHistoryBody.innerHTML = `<p class="tagline">Cargando historial…</p>`;
    try {
      // 6.6.14 - antes filtraba en el cliente sobre los últimos 200 eventos
      // GLOBALES (un dispositivo poco ruidoso podía perder eventos viejos
      // aunque BMO los tuviera guardados) - ahora el filtro es del backend.
      const data = await api(`/api/events/history?limit=200&deviceId=${encodeURIComponent(deviceId)}`);
      const events = data.events || [];
      if (!events.length) {
        els.deviceHistoryBody.innerHTML = `<p class="tagline">Sin actividad registrada todavía para ${escHtml(deviceName || deviceId)}.</p>`;
        return;
      }
      els.deviceHistoryBody.innerHTML = events
        .map((evt) => {
          const { ok, text } = formatHistoryEvent(evt);
          const time = new Date(evt.time).toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          return `<div class="sys-list-row ${ok ? "" : "blocked"}">
            <span>${ok ? "✓" : "✗"} ${text}</span>
            <span class="docker-meta">${escHtml(time)}</span>
          </div>`;
        })
        .join("");
    } catch (err) {
      els.deviceHistoryBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error cargando historial")}</p>`;
    }
  }

  // 6.6.2 - Bloque de descubrimiento: escaneo manual bajo demanda (el
  // barrido automático corre solo en el backend cada 5 min y avisa por
  // Event Center; esto es para "quiero verlo ya" y decidir Añadir/Ignorar).
  function discoveryBlockHtml() {
    const scan = state.discoveryScan;
    const unknown = scan ? scan.found.filter((f) => !f.known && !f.ignored) : [];
    let resultsHtml = "";
    if (state.discoveryScanning) {
      resultsHtml = `<p class="tagline">Escaneando la red…</p>`;
    } else if (scan) {
      resultsHtml = unknown.length
        ? unknown
            .map(
              (f) => `<div class="discovery-row">
                <span>${escHtml(f.ip)}${f.mac ? ` <span class="meta">(${escHtml(f.mac)})</span>` : ""}</span>
                <span class="discovery-row-actions">
                  <button type="button" data-disc-add="${escHtml(f.ip)}" data-disc-mac="${escHtml(f.mac || "")}">➕ Añadir</button>
                  <button type="button" data-disc-ignore="${escHtml(f.ip)}" data-disc-ignore-mac="${escHtml(f.mac || "")}">🚫 Ignorar</button>
                </span>
              </div>`
            )
            .join("")
        : `<p class="tagline">${scan.count} dispositivos vistos en la red, todos ya conocidos o ignorados.</p>`;
    }
    return `<div class="perf-block devices-discovery">
      <div class="discovery-head">
        <h3>🔎 Buscar dispositivos en la red</h3>
        <button type="button" id="discovery-scan-btn" ${state.discoveryScanning ? "disabled" : ""}>${state.discoveryScanning ? "Escaneando…" : "Escanear"}</button>
      </div>
      ${resultsHtml}
    </div>`;
  }

  // 6.6.11 - Grupos de dispositivos: agrupaciones que el propio usuario crea
  // (DESKTOP/GAMING/etc del spec son solo ejemplos, no algo que forcemos).
  function groupsBlockHtml(devices) {
    const groups = state.deviceGroups || [];
    const groupsHtml = groups.length
      ? groups
          .map((g) => {
            const names = g.deviceIds.map((id) => (devices.find((d) => d.id === id) || {}).name || id).join(", ");
            return `<div class="discovery-row">
              <span>${escHtml(g.icon || "🗂️")} <strong>${escHtml(g.name)}</strong> <span class="meta">${escHtml(names || "sin dispositivos")}</span></span>
              <span class="discovery-row-actions">
                <button type="button" data-group-delete="${escHtml(g.id)}">🗑️</button>
              </span>
            </div>`;
          })
          .join("")
      : `<p class="tagline">Sin grupos todavía.</p>`;
    const checklist = devices
      .map((d) => `<label class="ai-settings-check"><input type="checkbox" data-group-device="${escHtml(d.id)}" /> ${escHtml(d.name || d.id)}</label>`)
      .join("");
    return `<div class="perf-block devices-groups">
      <h3>🗂️ Grupos de dispositivos</h3>
      ${groupsHtml}
      <form id="group-create-form" style="margin-top:10px">
        <input type="text" id="group-name-input" placeholder="Nombre del grupo (ej. GAMING)" style="width:100%;margin-bottom:8px" />
        <div class="group-checklist">${checklist}</div>
        <button type="submit" style="margin-top:8px">＋ Crear grupo</button>
      </form>
    </div>`;
  }

  // KAN-32 - Geofencing literal: bloque real de "casa" (GPS), reusa las
  // mismas clases integration-row/dk-btn que Security Center (KAN-322)
  // - sin CSS nuevo. Solo se muestra si hay al menos un dispositivo con
  // GPS real reportado (o si "casa" ya está definida, para poder
  // borrarla). state.geofence viene de refreshDevicesPanel().
  function geofenceBlockHtml(devices) {
    const gf = state.geofence;
    if (!gf) return "";
    const gfDevices = gf.devices || {};

    const homeRow = gf.home
      ? `<div class="integration-row integration-row--stub">
          <span class="integration-ico">🏠</span>
          <span class="integration-info">
            <span class="integration-name">Casa</span>
            <span class="integration-detail">Radio ${escHtml(String(gf.home.radiusM))}m</span>
          </span>
          <button type="button" class="dk-btn ghost danger" data-geofence-clear>Borrar</button>
        </div>`
      : `<div class="integration-row integration-row--stub">
          <span class="integration-ico">🏠</span>
          <span class="integration-info">
            <span class="integration-name">Casa</span>
            <span class="integration-detail">Sin definir</span>
          </span>
          <input type="number" data-geofence-radius value="150" min="20" step="10" style="width:70px" title="Radio en metros" />
          <button type="button" class="dk-btn ghost" data-geofence-set>📍 Usar mi ubicación actual</button>
        </div>`;

    const deviceRows = Object.entries(gfDevices)
      .map(([id, d]) => {
        const dev = devices.find((x) => x.id === id);
        const name = dev ? dev.name || id : id;
        const state2 = d.inside === true ? "Dentro" : d.inside === false ? "Fuera" : "Sin datos";
        return `<div class="integration-row integration-row--stub">
          <span class="integration-ico">📍</span>
          <span class="integration-info">
            <span class="integration-name">${escHtml(name)}</span>
            <span class="integration-detail">${state2} · ${escHtml(String(d.distanceM))}m de casa</span>
          </span>
        </div>`;
      })
      .join("");

    return `<div class="integrations-list" style="margin-top:12px">${homeRow}${deviceRows}</div>`;
  }

  function renderDevicesPanel() {
    if (!els.devicesBody) return;
    const devices = (state.agentDevices && state.agentDevices.devices) || [];
    if (!devices.length) {
      els.devicesBody.innerHTML = `<p class="tagline">Cargando dispositivos…</p>`;
      return;
    }
    const focus =
      devices.find((d) => d.id === state.agentFocusId) ||
      devices.find((d) => d.id === "mi-pc") ||
      devices[0];
    state.agentFocusId = focus.id;

    const listHtml = devices
      .map((d) => {
        const selected = d.id === focus.id ? "selected" : "";
        const status = d.stub ? "Stub" : d.online ? "Online" : "Offline";
        const dot = d.stub ? "off" : d.online ? "" : "off";
        // 5.1.9/5.1.10 - health y favorito. El wrapper pasa de <button> a
        // <div role=button> porque ahora aloja un <button> real dentro (la
        // estrella) - anidar botones es HTML invalido y rompia el click.
        return `<div class="devices-card-btn ${selected}" data-agent-device="${d.id}" role="button" tabindex="0">
          <span class="ico">${deviceIcon(d)}</span>
          <span><div class="title">${escHtml(d.name || d.id)}</div>
          <div class="sub">${
            d.type === "android"
              ? escHtml(`${d.os || "Android"}${d.osVersion ? " " + d.osVersion : ""} · ${d.model || "—"}`)
              : d.type === "camera"
                ? escHtml(d.privacyMode ? "Modo privacidad" : d.cameraTrigger && d.cameraTrigger.enabled ? "Disparador activo" : "En espera")
                : d.type === "audio"
                  ? escHtml(d.online ? "Altavoz ok · micro sin confirmar" : "Desconectado")
                  : `${escHtml(d.os || d.type || "")} · ${escHtml(d.ip || "—")}`
          }</div></span>
          <span class="status-line">${healthDot(d.health)} <span class="dot ${dot}"></span><span>${status}</span>
            <button type="button" class="dev-fav-btn" data-dev-fav="${d.id}" data-fav="${d.favorite ? "1" : "0"}" aria-label="Favorito">${d.favorite ? "⭐" : "☆"}</button>
          </span>
        </div>`;
      })
      .join("");

    let detail = "";
    if (focus.stub) {
      detail = `<div class="perf-block devices-detail">
        <h3>${escHtml(focus.name)}</h3>
        <div class="meta">Placeholder — agente ${escHtml(focus.type)} aún no implementado.</div>
      </div>`;
    } else if (focus.type === "camera") {
      // 6.6.7 - Camera Ecosystem: ficha de solo-estado, sin botones de
      // energía/apps que no le aplican (no tiene agente propio).
      const trig = focus.cameraTrigger || {};
      detail = `<div class="perf-block devices-detail">
        <h3>${escHtml(focus.name)}</h3>
        <div class="devices-kv">
          <div class="cell"><div class="label">Estado</div><div class="value">${focus.online ? "🟢 Conectada" : "🔴 No detectada"}</div></div>
          <div class="cell"><div class="label">Privacidad</div><div class="value">${focus.privacyMode ? "🔴 Activa (cámara en pausa)" : "🟢 Desactivada"}</div></div>
          <div class="cell"><div class="label">Disparador (visión)</div><div class="value">${trig.enabled ? "🟢 Activo" : "⚪ Apagado"}</div></div>
          <div class="cell"><div class="label">Última comprobación</div><div class="value">${trig.lastCheckAt ? new Date(trig.lastCheckAt).toLocaleString("es-ES") : "—"}</div></div>
        </div>
        <p class="meta">La cámara no tiene acciones de energía propias — se gestiona desde Sistema → Inteligencia artificial (visión y disparador).</p>
      </div>`;
    } else if (focus.type === "audio") {
      // 6.6.8 - ficha de solo-estado, honesta sobre lo que sí y no está
      // confirmado (ver hardware_specs: altavoz sí, micrófono no todavía).
      const speakerOk = focus.speaker && focus.speaker.status === "confirmado";
      const micStatus = focus.mic && focus.mic.status;
      detail = `<div class="perf-block devices-detail">
        <h3>${escHtml(focus.name)}</h3>
        <div class="devices-kv">
          <div class="cell"><div class="label">Estado</div><div class="value">${focus.online ? "🟢 Conectado" : "🔴 No detectado"}</div></div>
          <div class="cell"><div class="label">🔊 Altavoz</div><div class="value">${speakerOk ? "🟢 Confirmado" : "⚪ Desconectado"}</div></div>
          <div class="cell"><div class="label">🎙️ Micrófono</div><div class="value">${micStatus === "sin_confirmar" ? "🟡 Sin confirmar" : "⚪ Desconectado"}</div></div>
        </div>
        <p class="meta">El altavoz se ha verificado hablando en voz alta de verdad. El micrófono está detectado a nivel de hardware pero nunca ha confirmado reconocer un comando real — no se da por funcional hasta que lo haga.</p>
      </div>`;
    } else if (focus.type === "android") {
      // 20/08/2026 - ficha propia para el móvil: solo presencia/batería
      // (viene de la app Capacitor vía heartbeat), nada de CPU/RAM/GPU que
      // no tiene sentido aquí y solo saldría lleno de guiones.
      const last = focus.lastSeen ? new Date(focus.lastSeen).toLocaleString("es-ES") : "—";
      const batteryTxt =
        focus.batteryPct == null
          ? "—"
          : `${focus.batteryPct}%${focus.batteryCharging ? " ⚡ cargando" : ""}`;
      detail = `<div class="perf-block devices-detail">
        <h3>${escHtml(focus.name)}</h3>
        <div class="devices-kv">
          <div class="cell"><div class="label">Estado</div><div class="value">${heartbeatTierBadge(focus.heartbeatTier)}</div></div>
          <div class="cell"><div class="label">Salud</div><div class="value">${healthDot(focus.health)} ${escHtml(healthLabel(focus.health))}</div></div>
          <div class="cell"><div class="label">Modelo</div><div class="value">${escHtml([focus.manufacturer, focus.model].filter(Boolean).join(" ") || "—")}</div></div>
          <div class="cell"><div class="label">Sistema</div><div class="value">${escHtml(focus.os || "Android")}${focus.osVersion ? ` ${escHtml(focus.osVersion)}` : ""}</div></div>
          <div class="cell"><div class="label">Batería</div><div class="value">${escHtml(batteryTxt)}</div></div>
          <div class="cell"><div class="label">Último contacto</div><div class="value">${escHtml(last)}</div></div>
        </div>
        <p class="meta">Solo se ve online mientras tienes la app de BMO abierta — no funciona en segundo plano.</p>
      </div>`;
    } else if (focus.id === "raspberry" || focus.type === "self") {
      const m = focus.metrics || {};
      detail = `<div class="perf-block devices-detail">
        <h3>${escHtml(focus.name)}</h3>
        <div class="devices-kv">
          <div class="cell"><div class="label">Estado</div><div class="value">Online (self) · ${estadoBadge(focus.estado)}</div></div>
          <div class="cell"><div class="label">Salud</div><div class="value">${healthDot(focus.health)} ${escHtml(healthLabel(focus.health))}</div></div>
          <div class="cell"><div class="label">IP</div><div class="value">${escHtml(focus.ip || "—")}</div></div>
          <div class="cell"><div class="label">OS</div><div class="value">${escHtml(focus.os || "Linux")}</div></div>
          <div class="cell"><div class="label">CPU</div><div class="value">${fmtNum(focus.cpu, "%")}</div></div>
          <div class="cell"><div class="label">RAM</div><div class="value">${fmtNum(focus.ram, "%")}</div></div>
          <div class="cell"><div class="label">Temp</div><div class="value">${fmtNum(focus.temp, "°C")}</div></div>
        </div>
      </div>`;
    } else {
      const cpu = (focus.metrics && focus.metrics.cpu) || {};
      const ram = (focus.metrics && focus.metrics.ram) || {};
      const gpu = (focus.metrics && focus.metrics.gpu) || {};
      const perms = focus.permissions || {};
      const procs = (state.agentProcesses && state.agentProcesses.processes) || [];
      const last = focus.lastSeen
        ? new Date(focus.lastSeen).toLocaleString("es-ES")
        : "—";
      const wolBtn = !focus.online
        ? `<button type="button" data-dev-wol>Encender (WOL)</button>`
        : "";
      const net = focus.network || {};
      const idleTxt =
        focus.userActive == null
          ? "—"
          : focus.userActive
          ? `Usuario activo${focus.idleSeconds != null ? ` (${Math.round(focus.idleSeconds)}s)` : ""}`
          : `Inactivo${focus.idleSeconds != null ? ` (${Math.round(focus.idleSeconds)}s)` : ""}`;
      detail = `<div class="perf-block devices-detail">
        <h3>${escHtml(focus.name)}</h3>
        <div class="devices-kv">
          <div class="cell"><div class="label">Estado</div><div class="value">${heartbeatTierBadge(focus.heartbeatTier)} · ${estadoBadge(focus.estado)}</div></div>
          <div class="cell"><div class="label">Salud</div><div class="value">${healthDot(focus.health)} ${escHtml(healthLabel(focus.health))}</div></div>
          <div class="cell"><div class="label">Último contacto</div><div class="value">${escHtml(last)}</div></div>
          <div class="cell"><div class="label">Conexión</div><div class="value">${fmtNum(focus.latencyMs, " ms")}<br>Agente v${escHtml(focus.agentVersion || "—")} · BMO v${escHtml(focus.bmoVersion || "—")}<br>${agentCompatBadge(focus.agentCompatibility)}</div></div>
          <div class="cell"><div class="label">IP</div><div class="value">${escHtml(focus.ip || "—")}</div></div>
          <div class="cell"><div class="label">OS</div><div class="value">${escHtml(focus.os || "—")}</div></div>
          <div class="cell"><div class="label">CPU</div><div class="value">${escHtml(cpu.model || "—")}<br>${fmtNum(cpu.usage_pct ?? focus.cpu, "%")} · ${fmtNum(cpu.freq_ghz, " GHz")} · ${fmtNum(cpu.temp_c ?? focus.cpuTemp, "°C")} · ${fmtNum(cpu.power_w, " W")}</div></div>
          <div class="cell"><div class="label">RAM</div><div class="value">${fmtNum(ram.used_gb, " / ")}${fmtNum(ram.total_gb, " GB")} (${fmtNum(ram.percent ?? focus.ram, "%")})<br>Disp. ${fmtNum(ram.available_gb, " GB")} · ${fmtNum(ram.process_count, " procs")}</div></div>
          <div class="cell"><div class="label">Disco</div><div class="value">${fmtNum(focus.disk, "%")}</div></div>
          <div class="cell"><div class="label">GPU</div><div class="value">${escHtml(gpu.name || focus.gpu || "—")}<br>${fmtNum(gpu.usage_pct, "%")} · VRAM ${fmtNum(gpu.vram_used_gb, " / ")}${fmtNum(gpu.vram_total_gb, " GB")}<br>${fmtNum(gpu.temp_c ?? focus.gpuTemp, "°C")} · ${fmtNum(gpu.fan_rpm, " RPM")} · ${fmtNum(gpu.power_w, " W")}</div></div>
          <div class="cell"><div class="label">Red</div><div class="value">↑ ${fmtNum(net.up_kbps, " KB/s")} · ↓ ${fmtNum(net.down_kbps, " KB/s")}</div></div>
          <div class="cell"><div class="label">Actividad</div><div class="value">${escHtml(idleTxt)}</div></div>
        </div>
        <div class="devices-estado">
          <label>Cambiar estado
            <select data-estado-select>
              ${Object.entries(ESTADO_META)
                .map(
                  ([key, meta]) =>
                    `<option value="${key}" ${focus.estado && focus.estado.estado === key ? "selected" : ""}>${meta.emoji} ${meta.label}</option>`
                )
                .join("")}
            </select>
          </label>
          <button type="button" data-estado-save class="config-btn">Guardar estado</button>
        </div>
        <div class="devices-estado">
          <label>Etiquetas (separadas por coma)
            <input type="text" data-tags-input value="${escHtml((focus.tags || []).join(", "))}" placeholder="gaming, trabajo, principal" />
          </label>
          <button type="button" data-tags-save class="config-btn">Guardar etiquetas</button>
        </div>
        <div class="devices-actions-group">
          <h4>Escenas rápidas</h4>
          <div class="devices-actions">
            <button type="button" data-dev-profile="gaming" ${focus.online && perms.apps ? "" : "disabled"}>Gaming</button>
            <button type="button" data-dev-profile="trabajo" ${focus.online && perms.apps ? "" : "disabled"}>Trabajo</button>
            <button type="button" data-dev-profile="streaming" ${focus.online && perms.apps ? "" : "disabled"}>Streaming</button>
            <button type="button" data-dev-open-catalog>Catálogo de apps</button>
            <button type="button" data-dev-open-history>Historial</button>
            ${wolBtn}
            ${
              (focus.capabilities || {}).remote_access && perms.remote_access && perms.wol && perms.power
                ? `<button type="button" data-dev-remote-work="${focus.id}" data-dev-remote-work-name="${escHtml(focus.name || focus.id)}">🧑‍💻 Trabajo remoto</button>`
                : ""
            }
          </div>
        </div>
        <div class="devices-actions-group">
          <h4>Acciones de energía</h4>
          <div class="devices-actions">
            <button type="button" class="danger" data-dev-power="shutdown" ${focus.online && perms.power ? "" : "disabled"}>Apagar</button>
            <button type="button" class="danger" data-dev-power="reboot" ${focus.online && perms.power ? "" : "disabled"}>Reiniciar</button>
            <button type="button" data-dev-power="sleep" ${focus.online && perms.power ? "" : "disabled"}>Suspender</button>
            <button type="button" data-dev-power="lock" ${focus.online && perms.power ? "" : "disabled"}>Bloquear</button>
          </div>
        </div>
        ${
          focus.type === "windows"
            ? `<div class="devices-actions-group">
                <h4>🖥️ Monitores</h4>
                <div class="devices-actions">
                  <button type="button" data-dev-monitors="${escHtml(focus.id)}" ${focus.online && perms.monitors ? "" : "disabled"}>Ver monitores</button>
                </div>
                <div id="devices-monitors-result"></div>
              </div>`
            : ""
        }
        <h3>Aplicaciones</h3>
        <div class="devices-apps">
          ${launcherAppsHtml(focus)}
        </div>
        <h3>Permisos</h3>
        <div class="devices-perms">
          ${["metrics","power","apps","processes","wol"]
            .concat(focus.type === "windows" ? ["monitors", "git"] : [])
            .concat((focus.capabilities || {}).remote_access ? ["remote_access"] : [])
            .map((k) =>
              `<label><input type="checkbox" data-perm="${k}" ${perms[k] ? "checked" : ""}/> ${k}</label>`
            ).join("")}
          <button type="button" data-perm-save class="config-btn">Guardar permisos</button>
        </div>
        <h3>Actividad (procesos)</h3>
        <table class="proc-table"><thead><tr><th>Nombre</th><th>CPU %</th><th>RAM MB</th><th></th></tr></thead>
        <tbody>${
          procs.length
            ? procs.slice(0, 12).map((p) => {
                const protectedProc = PROTECTED_PROCESS_NAMES.has(String(p.name || "").toLowerCase());
                const canClose = focus.online && perms.processes && !protectedProc && p.pid;
                return `<tr><td>${escHtml(p.name || "")}</td><td>${fmtNum(p.cpu)}</td><td>${fmtNum(p.ram_mb)}</td>
                  <td>${
                    protectedProc
                      ? `<span class="docker-meta">protegido</span>`
                      : `<button type="button" class="dk-btn ghost danger" data-proc-close="${p.pid}" data-proc-name="${escHtml(p.name || "")}" ${canClose ? "" : "disabled"}>Cerrar</button>`
                  }</td></tr>`;
              }).join("")
            : `<tr><td colspan="4">Sin datos aún</td></tr>`
        }</tbody></table>
      </div>`;
    }

    els.devicesBody.innerHTML = `${discoveryBlockHtml()}${groupsBlockHtml(devices)}<div class="devices-list">${listHtml}</div>${detail}${geofenceBlockHtml(devices)}`;

    els.devicesBody.querySelectorAll("[data-geofence-set]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          toast("Este navegador no soporta geolocalización");
          return;
        }
        btn.disabled = true;
        btn.textContent = "Localizando…";
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const radiusInput = els.devicesBody.querySelector("[data-geofence-radius]");
            const radiusM = radiusInput && radiusInput.value ? Number(radiusInput.value) : 150;
            api("/api/system/geofence", {
              method: "PUT",
              body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude, radiusM }),
            })
              .then(() => {
                toast("Ubicación de casa guardada");
                refreshDevicesPanel().catch(() => {});
              })
              .catch((err) => toast(err.message || "No se pudo guardar la ubicación"));
          },
          (err) => {
            toast(err.message || "No se pudo obtener tu ubicación");
            btn.disabled = false;
            btn.textContent = "📍 Usar mi ubicación actual";
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });
    });
    els.devicesBody.querySelectorAll("[data-geofence-clear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        api("/api/system/geofence", { method: "DELETE" })
          .then(() => {
            toast("Ubicación de casa borrada");
            refreshDevicesPanel().catch(() => {});
          })
          .catch((err) => toast(err.message || "No se pudo borrar"));
      });
    });

    els.devicesBody.querySelectorAll("[data-agent-device]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (e.target.closest("[data-dev-fav]")) return; // la estrella maneja su propio click
        state.agentFocusId = btn.getAttribute("data-agent-device");
        refreshDevicesPanel().catch((err) => toast(err.message));
      });
    });
    els.devicesBody.querySelectorAll("[data-dev-fav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-dev-fav");
        const next = btn.getAttribute("data-fav") !== "1";
        api(`/api/devices/${id}/favorite`, { method: "PUT", body: JSON.stringify({ favorite: next }) })
          .then(() => refreshDevicesPanel())
          .catch((err) => toast(err.message || "No se pudo guardar el favorito"));
      });
    });
    els.devicesBody.querySelectorAll("[data-dev-profile]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const profileId = btn.getAttribute("data-dev-profile");
        runProfile(focus.id, profileId);
      });
    });
    els.devicesBody.querySelectorAll("[data-dev-power]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-dev-power");
        runPowerAction(focus.id, action);
      });
    });
    // 6.6.5 - Monitor Management: solo lectura por ahora (resolucion/Hz
    // reales por monitor) - a proposito NO se construyo cambio de
    // resolucion/orientacion en vivo, es justo lo que el propio spec
    // marcaba como "later" y arriesga dejar la pantalla inutilizable si
    // algo sale mal.
    els.devicesBody.querySelector("[data-dev-monitors]")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const id = btn.getAttribute("data-dev-monitors");
      const out = document.getElementById("devices-monitors-result");
      if (out) out.innerHTML = `<p class="tagline">Consultando…</p>`;
      try {
        const res = await api(`/api/devices/${id}/monitors`);
        const monitors = res.monitors || [];
        if (out) {
          out.innerHTML = monitors.length
            ? monitors
                .map(
                  (m) =>
                    `<div class="sys-list-row"><span>${m.primary ? "⭐ " : ""}${escHtml(m.monitor || m.name)}</span><span class="docker-meta">${m.width}×${m.height} · ${m.refreshHz}Hz</span></div>`
                )
                .join("")
            : `<p class="tagline">Sin monitores detectados.</p>`;
        }
      } catch (err) {
        if (out) out.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      }
    });
    els.devicesBody.querySelector("#discovery-scan-btn")?.addEventListener("click", async () => {
      state.discoveryScanning = true;
      renderDevicesPanel();
      try {
        state.discoveryScan = await api("/api/devices/discover", { method: "POST", body: "{}" });
      } catch (err) {
        toast(err.message || "No se pudo escanear la red");
      } finally {
        state.discoveryScanning = false;
        renderDevicesPanel();
      }
    });
    els.devicesBody.querySelectorAll("[data-disc-add]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ip = btn.getAttribute("data-disc-add");
        const mac = btn.getAttribute("data-disc-mac") || null;
        const name = window.prompt(`Nombre para el dispositivo en ${ip}:`, "");
        if (!name) return;
        try {
          await api("/api/devices/discover/add", { method: "POST", body: JSON.stringify({ ip, mac, name }) });
          toast(`${name} añadido`);
          // 20s de cache en el barrido del backend - actualizamos la vista
          // local en vez de re-pedir el escaneo (saldría el resultado viejo).
          if (state.discoveryScan) state.discoveryScan.found = state.discoveryScan.found.filter((f) => f.ip !== ip);
          await refreshDevicesPanel();
        } catch (err) {
          toast(err.message || "No se pudo añadir");
        }
      });
    });
    els.devicesBody.querySelector("#group-create-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameInput = els.devicesBody.querySelector("#group-name-input");
      const name = (nameInput && nameInput.value || "").trim();
      if (!name) return;
      const deviceIds = Array.from(els.devicesBody.querySelectorAll("[data-group-device]:checked")).map((el) => el.getAttribute("data-group-device"));
      try {
        await api("/api/devices/groups", { method: "POST", body: JSON.stringify({ name, deviceIds }) });
        toast(`Grupo "${name}" creado`);
        await refreshDevicesPanel();
      } catch (err) {
        toast(err.message || "No se pudo crear el grupo");
      }
    });
    els.devicesBody.querySelectorAll("[data-group-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-group-delete");
        try {
          await api(`/api/devices/groups/${id}`, { method: "DELETE" });
          await refreshDevicesPanel();
        } catch (err) {
          toast(err.message || "No se pudo borrar el grupo");
        }
      });
    });
    els.devicesBody.querySelectorAll("[data-disc-ignore]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ip = btn.getAttribute("data-disc-ignore");
        const mac = btn.getAttribute("data-disc-ignore-mac") || null;
        try {
          await api("/api/devices/discover/ignore", { method: "POST", body: JSON.stringify({ ip, mac }) });
          if (state.discoveryScan) state.discoveryScan.found = state.discoveryScan.found.filter((f) => f.ip !== ip);
          renderDevicesPanel();
        } catch (err) {
          toast(err.message || "No se pudo ignorar");
        }
      });
    });
    els.devicesBody.querySelector("[data-estado-save]")?.addEventListener("click", () => {
      const sel = els.devicesBody.querySelector("[data-estado-select]");
      const estado = sel && sel.value;
      if (!estado) return;
      api(`/api/devices/${focus.id}/state`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
      })
        .then(() => {
          toast("Estado actualizado");
          return refreshDevicesPanel();
        })
        .catch((err) => toast(err.message || "Error al guardar estado"));
    });
    els.devicesBody.querySelector("[data-dev-wol]")?.addEventListener("click", () => {
      api(`/api/devices/${focus.id}/wol`, { method: "POST", body: "{}" })
        .then(() => {
          toast("⚡ WOL enviado, 🟡 arrancando…");
          waitForDeviceOnline(focus.id);
        })
        .catch((err) => toast(err.message || "Error WOL"));
    });
    els.devicesBody.querySelector("[data-dev-open-catalog]")?.addEventListener("click", () => {
      openAppCatalogPanel().catch((err) => toast(err.message || "Error"));
    });
    els.devicesBody.querySelector("[data-dev-open-history]")?.addEventListener("click", () => {
      openDeviceHistoryPanel(focus.id, focus.name).catch((err) => toast(err.message || "Error"));
    });
    els.devicesBody.querySelectorAll("[data-app-launch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-app-launch");
        const name = btn.getAttribute("data-app-name") || id;
        toast(`Abriendo ${name}…`);
        api(`/api/devices/${focus.id}/apps/${id}/launch`, { method: "POST", body: "{}" })
          .then(() => toast(`✓ ${name} iniciado`))
          .catch((err) => toast(err.message || `No se pudo abrir ${name}`));
      });
    });
    els.devicesBody.querySelectorAll("[data-app-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-app-close");
        const name = btn.getAttribute("data-app-name") || id;
        api(`/api/devices/${focus.id}/apps/${id}/close`, { method: "POST", body: "{}" })
          .then(() => toast(`✓ ${name} cerrado`))
          .catch((err) => toast(err.message || `No se pudo cerrar ${name}`));
      });
    });
    els.devicesBody.querySelectorAll("[data-proc-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-proc-close");
        const name = btn.getAttribute("data-proc-name") || `PID ${pid}`;
        api(`/api/devices/${focus.id}/processes/${pid}/close`, { method: "POST", body: "{}" })
          .then(() => {
            toast(`✓ ${name} cerrado`);
            return refreshDevicesPanel();
          })
          .catch((err) => toast(err.message || `No se pudo cerrar ${name}`));
      });
    });
    els.devicesBody.querySelector("[data-perm-save]")?.addEventListener("click", () => {
      const permissions = {};
      els.devicesBody.querySelectorAll("[data-perm]").forEach((el) => {
        permissions[el.getAttribute("data-perm")] = !!el.checked;
      });
      api(`/api/devices/${focus.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      })
        .then(() => {
          toast("Permisos guardados");
          return refreshDevicesPanel();
        })
        .catch((err) => toast(err.message || "Error permisos"));
    });
    els.devicesBody.querySelector("[data-tags-save]")?.addEventListener("click", () => {
      const input = els.devicesBody.querySelector("[data-tags-input]");
      const tags = (input && input.value ? input.value.split(",") : []).map((t) => t.trim()).filter(Boolean);
      api(`/api/devices/${focus.id}/tags`, { method: "PUT", body: JSON.stringify({ tags }) })
        .then(() => {
          toast("Etiquetas guardadas");
          return refreshDevicesPanel();
        })
        .catch((err) => toast(err.message || "Error al guardar etiquetas"));
    });
    els.devicesBody.querySelector("[data-dev-remote-work]")?.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-dev-remote-work");
      const name = e.currentTarget.getAttribute("data-dev-remote-work-name") || id;
      runRemoteWork(id, name);
    });
  }

  const POWER_META = {
    shutdown: { title: "¿Apagar MI-PC?", msg: "El equipo se apagará inmediatamente.", verb: "Apagar" },
    reboot: { title: "¿Reiniciar MI-PC?", msg: "El equipo se reiniciará inmediatamente.", verb: "Reiniciar" },
    sleep: { title: "¿Suspender MI-PC?", msg: "El equipo entrará en suspensión.", verb: "Suspender" },
    lock: { title: "¿Bloquear MI-PC?", msg: "Se bloqueará la sesión inmediatamente.", verb: "Bloquear" },
  };

  // 4.16.9 - Modal de confirmacion compacto y reutilizable (ya existia,
  // pero solo para acciones de energia - generalizado aqui para
  // sustituir TODOS los window.confirm() nativos del navegador, que no
  // encajan con un kiosco sin chrome de navegador visible). Solo puede
  // haber una confirmacion en pantalla a la vez, asi que reutiliza el
  // mismo overlay/DOM en vez de crear uno nuevo por cada llamada.
  function showConfirmModal({ title, message, confirmLabel, cancelLabel } = {}) {
    if (!els.powerConfirmPanel) return Promise.resolve(window.confirm(title || message || "¿Confirmar?"));
    els.powerConfirmTitle.textContent = title || "¿Confirmar acción?";
    els.powerConfirmMsg.textContent = message || "";
    els.powerConfirmOk.textContent = confirmLabel || "Confirmar";
    els.powerConfirmCancel.textContent = cancelLabel || "Cancelar";
    els.powerConfirmPanel.hidden = false;
    return new Promise((resolve) => {
      const cleanup = () => {
        els.powerConfirmPanel.hidden = true;
        els.powerConfirmOk.removeEventListener("click", onOk);
        els.powerConfirmCancel.removeEventListener("click", onCancel);
      };
      const onOk = () => {
        cleanup();
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      els.powerConfirmOk.addEventListener("click", onOk);
      els.powerConfirmCancel.addEventListener("click", onCancel);
    });
  }

  function askPowerConfirm(action) {
    const meta = POWER_META[action] || { title: "¿Confirmar acción?", msg: "", verb: "Confirmar" };
    return showConfirmModal({ title: meta.title, message: meta.msg, confirmLabel: meta.verb });
  }

  async function runPowerAction(deviceId, action) {
    const ok = await askPowerConfirm(action);
    if (!ok) return;
    const verb = (POWER_META[action] && POWER_META[action].verb) || action;
    toast(`${verb}…`);
    try {
      await api(`/api/devices/${deviceId}/power/${action}`, { method: "POST", body: "{}" });
      toast(`✓ ${verb} confirmado`);
    } catch (err) {
      toast(err.message || `No se pudo ${verb.toLowerCase()}`);
    }
  }

  async function waitForDeviceOnline(deviceId, { timeoutMs = 90000, pollMs = 4000 } = {}) {
    if (state.wolWaitTimer) {
      clearInterval(state.wolWaitTimer);
      state.wolWaitTimer = null;
    }
    const started = Date.now();
    state.wolWaitTimer = setInterval(async () => {
      if (Date.now() - started > timeoutMs) {
        clearInterval(state.wolWaitTimer);
        state.wolWaitTimer = null;
        toast(`⚠️ ${deviceId}: sin confirmar online tras ${Math.round(timeoutMs / 1000)}s`);
        return;
      }
      try {
        const device = await api(`/api/devices/${deviceId}`);
        if (device && device.online) {
          clearInterval(state.wolWaitTimer);
          state.wolWaitTimer = null;
          toast(`🟢 ${device.name || deviceId} online`);
          if (state.agentFocusId === deviceId) refreshDevicesPanel().catch(() => {});
        }
      } catch {
        /* device offline lookups can fail transiently, keep polling */
      }
    }, pollMs);
  }

  async function runProfile(deviceId, profileId) {
    toast(`Aplicando ${profileId}…`);
    try {
      const res = await api(`/api/devices/${deviceId}/profile/${profileId}/run`, {
        method: "POST",
        body: "{}",
      });
      const summary = (res.steps || []).map((s) => `${s.ok ? "✓" : "✗"} ${s.step}`).join(" · ");
      toast(res.ok ? `✓ ${res.label || profileId}: ${summary}` : `⚠️ ${res.label || profileId}: ${summary}`);
      if (state.agentFocusId === deviceId) refreshDevicesPanel().catch(() => {});
    } catch (err) {
      toast(err.message || `No se pudo aplicar ${profileId}`);
    }
  }

  // 5.1.13-16 - Remote Work Engine: confirma (tiene efectos reales sobre el
  // equipo), dispara la orquestación en segundo plano y sondea la tarea con
  // el mismo sistema de tareas que ya usan backups/updates.
  async function runRemoteWork(deviceId, deviceName) {
    const ok = await showConfirmModal({
      title: `¿Preparar ${deviceName} para trabajo remoto?`,
      message: "Encenderá el equipo si hace falta, cerrará Steam y Discord, abrirá VS Code y Chrome, y pondrá Spotify a reproducir.",
      confirmLabel: "Preparar",
    });
    if (!ok) return;
    toast("🟡 Preparando trabajo remoto…");
    try {
      const res = await api(`/api/devices/${deviceId}/remote-work`, { method: "POST", body: "{}" });
      pollRemoteWorkTask(res.taskId, deviceId);
    } catch (err) {
      toast(err.message || "No se pudo iniciar el trabajo remoto");
    }
  }

  function pollRemoteWorkTask(taskId, deviceId) {
    if (state.remoteWorkTimer) clearInterval(state.remoteWorkTimer);
    state.remoteWorkTimer = setInterval(async () => {
      let task;
      try {
        ({ task } = await api(`/api/tasks/${taskId}`));
      } catch {
        return; // sondeo transitorio, se reintenta en el siguiente tick
      }
      if (!task || task.status === "running") return;
      clearInterval(state.remoteWorkTimer);
      state.remoteWorkTimer = null;
      const msg = (task.detail && task.detail.message) || (task.status === "done" ? "Listo" : "Error");
      toast(task.status === "done" ? `🟢 ${msg}` : `⚠️ ${msg}`);
      if (state.agentFocusId === deviceId) refreshDevicesPanel().catch(() => {});
    }, 3000);
  }

  async function refreshDevicesPanel() {
    const [list, profiles, groups, geofence] = await Promise.all([
      api("/api/devices"),
      api("/api/devices/profiles").catch(() => ({ profiles: {} })),
      api("/api/devices/groups").catch(() => ({ groups: [] })),
      api("/api/system/geofence").catch(() => null),
    ]);
    state.agentDevices = list;
    state.agentProfiles = profiles;
    state.deviceGroups = groups.groups || [];
    state.geofence = geofence;
    const focusId = state.agentFocusId || "mi-pc";
    if (focusId === "mi-pc" || (list.devices || []).some((d) => d.id === focusId && !d.stub && d.type === "windows")) {
      state.agentProcesses = await api(`/api/devices/${focusId}/processes`).catch(() => ({
        processes: [],
      }));
    } else {
      state.agentProcesses = { processes: [] };
    }
    renderDevicesPanel();
  }

  async function openDevicesPanel(from = "hub") {
    state.devicesFrom = from;
    closeSysHub();
    closePerfPanel();
    closeMonitorPanel();
    closeAlertsPanel();
    closeEventsPanel();
    closeSpotifyPanel();
    closeDockerPanel();
    if (!els.devicesPanel || !els.devicesBody) {
      toast("Panel dispositivos no disponible");
      return;
    }
    els.devicesPanel.hidden = false;
    api("/api/applications")
      .then((data) => {
        state.appCatalog = data.apps || [];
        renderDevicesPanel();
      })
      .catch(() => {});
    await refreshDevicesPanel();
    if (state.agentTimer) clearInterval(state.agentTimer);
    state.agentTimer = setInterval(() => {
      refreshDevicesPanel().catch(() => {});
    }, 8000);
  }

  // Lista unica de cierre para todos los sub-paneles de Sistema (y paneles
  // relacionados que pueden quedar abiertos al navegar). openSysHub() y
  // closeOverlayPanels() usan esta misma lista para no ir desincronizandose
  // cada vez que se anade un panel nuevo.
  function closeAllSysPanels() {
    closeInfraMapPanel();
    closeOfflineStatusPanel();
    closeEcoDashboardPanel();
    closeModosPanel();
    closePersonalPanel();
    closePerfPanel();
    closeMonitorPanel();
    closePluginsPanel();
    closePermsPanel();
    closeConsentPanel();
    closeLogsPanel();
    closeSpotifyPanel();
    closeConfigPanel();
    closeAlertsPanel();
    closeEventsPanel();
    closeDevicesPanel();
    closeDockerPanel();
    closeMarketplacePanel();
    closeSysLogsPanel();
    closeSysPermsPanel();
    closeSysUsersPanel();
    closeScenesPanel();
    closeAutomationsPanel();
    closeAppCatalogPanel();
    closeDeviceHistoryPanel();
    closeEstadoPanel();
    closeActividadPanel();
    closeTareasPanel();
    closeHealthPanel();
    closeMaintenancePanel();
    closeSettingsPanel();
    closePersonalizacionPanel();
    closeNavegacionPanel();
    closeCustomPagePanel();
    closeQuickMenuPanel();
    closeAparienciaPanel();
    closePantallasPanel();
    closeAiPanel();
    closeGesturememePanel();
    closeIntegrationsPanel();
    closeAccountsPanel();
    closePublicApiPanel();
    closeRecoveryPanel();
    closeSecurityCenterPanel();
    closeBrainPanel();
    closeBmoVoicePanel();
    closeSteamPanel();
    closePokedexPanel();
    closePokemonExplorePanel();
    closePokebagPanel();
    closePokemovesPanel();
    closePokecarePanel();
    closePokemedalsPanel();
    closePokeprogressPanel();
    closePokemonHomePanel();
    closePokeeventsPanel();
    closePokeboxPanel();
  }

  function openSysHub() {
    closeAllSysPanels();
    if (!els.sysHubPanel) {
      openPerfPanel().catch((err) => toast(err.message || "Error sistema"));
      return;
    }
    els.sysHubPanel.hidden = false;
    renderSysCore().catch(() => {});
  }

  function formatBackupWhen(iso) {
    if (!iso) return "Sin copias";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Sin copias";
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    if (sameDay) return `Hoy, ${hh}:${mm}`;
    const dd = String(d.getDate()).padStart(2, "0");
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mo}, ${hh}:${mm}`;
  }

  async function renderSysCore() {
    try {
      const [alerts, backups, plugins, scenesData, automationsData] = await Promise.all([
        api("/api/alerts").catch(() => null),
        api("/api/docker/backups").catch(() => null),
        api("/api/plugins").catch(() => state.plugins || null),
        api("/api/scenes").catch(() => null),
        api("/api/automations").catch(() => null),
      ]);
      if (alerts) state.alertsActive = alerts;
      if (backups) {
        state.dockerBackups = backups.backups || [];
        state.dockerBackupSchedule = backups.schedule || null;
      }
      if (plugins) state.plugins = plugins;
      if (scenesData) state.scenes = scenesData.scenes || [];
      if (automationsData) state.automations = automationsData.automations || [];
    } catch {
      // se muestran los datos que ya hubiera en caché
    }

    const sys = state.system || {};
    if (els.sysCoreVersion) {
      els.sysCoreVersion.textContent = sys.version ? `v${sys.version}` : "—";
    }
    if (els.sysCoreUptime) {
      const days = sys.uptime != null ? Math.floor(Number(sys.uptime) / 86400) : null;
      els.sysCoreUptime.textContent =
        days != null ? `${days} día${days === 1 ? "" : "s"}` : "—";
    }

    const activeAlerts = (state.alertsActive && state.alertsActive.alerts) || [];
    if (els.sysCoreAlerts) {
      els.sysCoreAlerts.textContent = activeAlerts.length
        ? `${activeAlerts.length} alerta${activeAlerts.length === 1 ? "" : "s"}`
        : "0 alertas";
    }

    const latestBackup = (state.dockerBackups || [])[0];
    if (els.sysCoreBackup) {
      els.sysCoreBackup.textContent = formatBackupWhen(latestBackup && latestBackup.date);
    }
    if (els.sysBackupSub) {
      els.sysBackupSub.textContent = latestBackup
        ? formatBackupWhen(latestBackup.date)
        : "Sin copias todavía";
    }

    const plist = state.plugins || [];
    if (els.sysPluginsSub) {
      const installedN = plist.filter((p) => p.installed).length;
      const activeN = plist.filter((p) => p.installed && p.enabled).length;
      els.sysPluginsSub.textContent = `${installedN} instalados · ${activeN} activos`;
    }

    const slist = state.scenes || [];
    if (els.sysScenesSub) {
      els.sysScenesSub.textContent = slist.length
        ? `${slist.length} escena${slist.length === 1 ? "" : "s"}`
        : "Acciones en un toque";
    }
    const alist = state.automations || [];
    if (els.sysAutomationsSub) {
      const activeAuto = alist.filter((a) => a.enabled).length;
      els.sysAutomationsSub.textContent = alist.length
        ? `${activeAuto} activa${activeAuto === 1 ? "" : "s"} de ${alist.length}`
        : "Disparadas por eventos";
    }
  }

  function closeOverlayPanels() {
    closeAllSysPanels();
    closeSysHub();
  }

  function closeMarketplacePanel() {
    if (els.marketplacePanel) els.marketplacePanel.hidden = true;
  }

  async function openMarketplacePanel() {
    if (!els.marketplacePanel || !els.marketplaceBody) {
      toast("Marketplace no cargado — recarga la página");
      return;
    }
    closeSysHub();
    els.marketplacePanel.hidden = false;
    els.marketplaceBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    try {
      const [items, plugins] = await Promise.all([
        api("/api/marketplace"),
        api("/api/plugins").catch(() => state.plugins || []),
      ]);
      state.plugins = plugins;
      const installedIds = new Set((plugins || []).filter((p) => p.installed).map((p) => p.id));
      els.marketplaceBody.innerHTML =
        (items || [])
          .map(
            (it) => `
        <div class="plugin-card">
          <div class="plugin-card-top">
            <div>
              <h3>${escHtml(it.name)}</h3>
              <p>${escHtml(it.description || "")}</p>
            </div>
            <div class="plugin-card-meta">v${escHtml(it.version || "—")}</div>
          </div>
          <div class="plugin-status">
            ${
              installedIds.has(it.id)
                ? `<span class="plugin-pill"><span class="dot"></span>Instalado</span>`
                : `<span class="plugin-pill"><span class="dot empty"></span>No instalado</span>`
            }
          </div>
        </div>`
          )
          .join("") || `<p class="tagline">Catálogo vacío.</p>`;
    } catch (err) {
      els.marketplaceBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
    }
  }

  function closeSysLogsPanel() {
    if (els.sysLogsPanel) els.sysLogsPanel.hidden = true;
  }

  function openSysLogsPanel() {
    if (!els.sysLogsPanel || !els.sysLogsBody) {
      toast("Registros no cargado — recarga la página");
      return;
    }
    closeSysHub();
    els.sysLogsPanel.hidden = false;
    const plist = state.plugins || [];
    els.sysLogsBody.innerHTML = plist.length
      ? plist
          .map(
            (p) => `<button type="button" class="sys-list-row" data-logs-open="${escHtml(p.id)}">
        <span>${escHtml(p.name)}</span>
        <span class="chev">›</span>
      </button>`
          )
          .join("")
      : `<p class="tagline">No hay plugins instalados.</p>`;
  }

  // —— 4.12 BMO AI ——
  els.aiPanel = document.getElementById("ai-panel");
  els.aiBody = document.getElementById("ai-body");
  els.aiBack = document.getElementById("ai-back");
  els.aiSettingsBtn = document.getElementById("ai-settings-btn");

  state.aiView = "chat"; // "chat" | "settings" | "history" | "audit" | "memory" | "tasks"
  state.aiStatus = null; // {provider, model, enabled, configured}
  state.aiLog = []; // [{role:"user"|"assistant", text, pending, pendingId, tool, params}]
  state.aiBusy = false;

  // 6.1.11 - tiles rapidos ampliados: no todo tiene que pasar por lenguaje
  // natural en una pantalla tactil pequena (mismo espiritu que el mockup
  // del spec). Siguen siendo prompts de texto normales, no accesos directos
  // a tools - la IA decide que hacer con cada uno igual que con cualquier
  // mensaje escrito a mano.
  // 6.1.8/6.1.11 - "No todo tiene que pasar por la IA": los 6 tiles del
  // mockup del spec son atajos reales a pantallas/acciones que YA existen
  // (Dispositivos, perfiles, Docker, Rendimiento, Alertas) - no pasan por
  // el modelo en absoluto, ni gastan una llamada ni esperan una respuesta.
  // El cuadro de texto de abajo sigue siendo el sitio para preguntas
  // abiertas de verdad.
  const AI_QUICK_TILES = [
    { label: "🖥️ Estado PC", action: "estado-pc" },
    { label: "🧑‍💻 Trabajo", action: "perfil-trabajo" },
    { label: "🎮 Gaming", action: "perfil-gaming" },
    { label: "🐳 Docker", action: "docker" },
    { label: "📊 Rendimiento", action: "rendimiento" },
    { label: "🔔 Alertas", action: "alertas" },
  ];

  // 6.4.8 - "¿Que ves?" SI pasa por el modelo (a diferencia de los tiles de
  // arriba, que son atajos directos sin IA) - es justo lo que activa
  // describeCameraView, no tiene sentido como atajo sin lenguaje natural.
  const AI_VISION_PROMPT = "¿Qué ves ahora mismo por la cámara?";

  function handleAiQuickTile(action) {
    closeAiPanel();
    if (action === "estado-pc") {
      state.agentFocusId = "mi-pc";
      openDevicesPanel();
    } else if (action === "perfil-trabajo") {
      runProfile("mi-pc", "trabajo");
    } else if (action === "perfil-gaming") {
      runProfile("mi-pc", "gaming");
    } else if (action === "docker") {
      openDockerPanel();
    } else if (action === "rendimiento") {
      openPerfPanel();
    } else if (action === "alertas") {
      openAlertsPanel();
    }
  }

  function closeAiPanel() {
    if (els.aiPanel) els.aiPanel.hidden = true;
  }

  // —— Gato-Cam (gesture-meme, iframe embebido, mismo origen) ——
  els.gesturememePanel = document.getElementById("gesturememe-panel");
  els.gesturememeBack = document.getElementById("gesturememe-back");
  els.gesturememeIframe = document.getElementById("gesturememe-iframe");

  function closeGesturememePanel() {
    if (els.gesturememePanel) els.gesturememePanel.hidden = true;
    // Al vaciar el src se libera la cámara (se detiene el stream de getUserMedia).
    if (els.gesturememeIframe) els.gesturememeIframe.src = "about:blank";
  }

  function openGesturememePanel() {
    closeSysHub();
    if (!els.gesturememePanel) return;
    els.gesturememePanel.hidden = false;
    if (els.gesturememeIframe) els.gesturememeIframe.src = "/gesture-meme/?t=" + Date.now();
  }

  els.gesturememeBack?.addEventListener("click", () => {
    closeGesturememePanel();
    openSysHub();
  });
  els.gesturememePanel?.addEventListener("click", (e) => {
    if (e.target === els.gesturememePanel) {
      closeGesturememePanel();
      openSysHub();
    }
  });

  // 6.1.6/6.1.9 - Confirmation System de 3 niveles reales: MEDIUM se ve
  // amarillo/aviso, HIGH_RISK/DANGEROUS rojo/peligro - antes toda
  // confirmacion se veia igual sin importar cuanto podia afectar.
  const AI_RISK_META = {
    MEDIUM: { cls: "warn", icon: "⚠️", label: "Confirmación" },
    HIGH_RISK: { cls: "danger", icon: "🔴", label: "Acción de riesgo" },
    DANGEROUS: { cls: "danger", icon: "🔴", label: "Acción peligrosa" },
  };

  // 6.8.3 - mismos iconos que agentRegistry.js en el backend (AGENT_META) -
  // duplicado a proposito, es solo presentacion, no logica.
  const AGENT_ICON = {
    system: "🖥️",
    vision: "👁️",
    voice: "🎙️",
    knowledge: "📚",
    automation: "⚙️",
    security: "🛡️",
    assistant: "🤖",
    coding: "💻",
    unassigned: "❓",
  };
  const AGENT_STATUS_META = {
    READY: { icon: "🟢", label: "Listo" },
    OFFLINE: { icon: "🔴", label: "Sin conexión" },
    PARKED: { icon: "🟡", label: "Aparcado" },
    DISABLED: { icon: "⚪", label: "Desactivado" },
  };

  function aiToolFriendlyName(tool) {
    const names = {
      executeScene: "Ejecutar escena",
      executeAutomation: "Ejecutar automatización",
      restartRecoverableService: "Reiniciar servicio",
      activateProfile: "Aplicar perfil",
      setContext: "Cambiar contexto",
    };
    return names[tool] || tool;
  }

  // 6.3.9/6.3.22 - el Audit Log ahora tambien registra lo que disparan las
  // automatizaciones (antes solo lo que pedia la IA por chat) - distinto
  // icono de fuente para no confundir "esto lo decidio la IA" con "esto ya
  // estaba pre-autorizado por ti al crear la automatizacion".
  function aiEntryLabel(e) {
    if (e.source === "automation") {
      return `⚙️ Automatización: ${e.params?.automationName || e.params?.automationId || "?"}`;
    }
    return `🤖 ${aiToolFriendlyName(e.tool)}`;
  }

  // 6.4.5 - Planificador: antes esto SIEMPRE era una unica tool (o el plan
  // real de una escena, o solo su nombre en crudo). Ahora "steps" es
  // siempre un array (aunque sea de 1) - cada paso trae su propio "label"
  // real (una escena trae ademas su propio desglose sceneName/steps), asi
  // que una orden compuesta ("prepara todo para jugar") puede mostrar varios
  // pasos heterogeneos juntos en una sola tarjeta, no fragmentados.
  // 7.1.8 (KAN-144) - Self-Critique: mismo lenguaje visual que el aviso de
  // calidad de KAN-151 (.ai-quality-warning) - esto es "presta atención
  // antes de confirmar", el mismo tipo de señal, no uno nuevo inventado
  // solo para esto.
  function aiSelfCritiqueHtml(step) {
    if (!step.selfCritique || !step.selfCritique.length) return "";
    return `<div class="ai-quality-warning">${step.selfCritique.map((w) => `<div>⚠️ ${escHtml(w)}</div>`).join("")}</div>`;
  }
  function aiStepHtml(step) {
    if (step.sceneName) {
      return `<div class="ai-plan-step">
        <p class="tagline"><strong>${escHtml(step.sceneIcon || "")} ${escHtml(step.sceneName)}</strong></p>
        ${aiSelfCritiqueHtml(step)}
        <ol class="ai-plan-steps">${(step.steps || []).map((s) => `<li>${escHtml(s)}</li>`).join("")}</ol>
      </div>`;
    }
    return `${aiSelfCritiqueHtml(step)}<p class="ai-plan-step-label">• ${escHtml(step.label || aiToolFriendlyName(step.tool))}</p>`;
  }

  function aiMsgBubbleHtml(entry) {
    if (entry.pending) {
      const risk = AI_RISK_META[entry.riskTier] || AI_RISK_META.HIGH_RISK;
      const steps = entry.steps || [];
      const title = steps.length > 1 ? `Plan de ${steps.length} pasos` : aiToolFriendlyName(steps[0]?.tool);
      return `<div class="ai-msg bot">
        <div class="ai-confirm-card ai-confirm-${risk.cls}">
          <p><strong>${risk.icon} ${risk.label}: ${escHtml(title)}</strong></p>
          <div class="ai-plan">${steps.map(aiStepHtml).join("")}</div>
          <div class="ai-confirm-actions">
            <button type="button" class="dk-btn ghost" data-ai-confirm="0" data-ai-pending="${escHtml(entry.pendingId)}">Cancelar</button>
            <button type="button" class="dk-btn" data-ai-confirm="1" data-ai-pending="${escHtml(entry.pendingId)}">Ejecutar</button>
          </div>
        </div>
      </div>`;
    }
    const cls = entry.role === "user" ? "user" : "bot";
    const proactiveCls = entry.proactive ? " proactive" : "";
    return `<div class="ai-msg ${cls}${proactiveCls}">${aiQualityWarningHtml(entry)}${escHtml(entry.text || "")}${aiSourcesFooterHtml(entry)}</div>`;
  }

  // 7.1.15 (KAN-151) - Response Quality Engine: hallucinationRisk/
  // verifyMismatch (KAN-152/141) ya viajaban dentro de outcome.text como
  // texto suelto - facil de pasar por alto. Esto NO es una comprobacion
  // nueva, es la MISMA senal real ('qualityFlags', ver aiService.js)
  // pintada como un aviso que no se puede ignorar, ANTES del texto de la
  // respuesta en vez de enterrado despues. Solo estos dos flags porque son
  // los unicos checks reales que existen hoy - fabricar una tarjeta de
  // "seguridad"/"estilo" sin una comprobacion real detras seria mostrar
  // algo que no corresponde, mismo criterio que BMO Brain (KAN-156) al NO
  // mostrar un indicador falso de Self-Critique.
  const AI_QUALITY_FLAG_META = {
    hallucinationRisk: "⚠️ Podría no ser exacto — lenguaje de verificación sin una comprobación real este turno",
    verifyMismatch: "⚠️ Números sin verificar — no coinciden con los datos reales consultados",
  };
  function aiQualityWarningHtml(entry) {
    const flags = entry.qualityFlags || [];
    if (!flags.length) return "";
    const lines = flags.map((f) => AI_QUALITY_FLAG_META[f]).filter(Boolean);
    if (!lines.length) return "";
    return `<div class="ai-quality-warning">${lines.map((l) => `<div>${escHtml(l)}</div>`).join("")}</div>`;
  }

  // 7.1.6 (KAN-142) - Confidence & Sources: aiService.sendMessageNow ya
  // adjunta 'confidence'/'sources' a la respuesta (datos reales que ya
  // calculaba contextService y antes se tiraban) - esto solo los pinta, sin
  // inventar nada nuevo. Mismo icono que ya usa el select de confidence en
  // el Memory Explorer (⭐/🤔/❓), para no introducir un lenguaje visual
  // distinto para el mismo concepto.
  // 7.1.6 (KAN-142) - solo dos niveles reales (ver aiService.js
  // computeAnswerConfidence): "high" = esfuerzo extra de verificacion para
  // esta pregunta en concreto (tool call o coincidencia semantica fuerte),
  // "medium" = respaldado por el snapshot general del sistema, no
  // re-verificado ahora mismo. No hay un "sin fuente" honesto de mostrar -
  // ver el comentario en buildSources() de por que se descarto.
  const AI_CONFIDENCE_META = {
    high: { icon: "🎯", label: "Verificado ahora" },
    medium: { icon: "📋", label: "Según el estado general" },
  };
  function aiSourcesSummary(sources) {
    if (!sources || !sources.length) return "";
    const parts = [];
    const tools = sources.find((s) => s.type === "tools");
    if (tools) parts.push("📡 datos en vivo");
    const memCount = sources.filter((s) => s.type === "memory").length;
    if (memCount) parts.push(`🧠 memoria (${memCount})`);
    const projCount = sources.filter((s) => s.type === "project").length;
    if (projCount) parts.push(`📁 proyecto${projCount > 1 ? "s" : ""}`);
    const docs = sources.filter((s) => s.type === "document");
    if (docs.length) parts.push(`📚 ${docs.map((d) => d.label).join(", ")}`);
    const ctx = sources.find((s) => s.type === "context");
    if (ctx && !parts.length) parts.push("🖥️ estado del sistema");
    return parts.join(" · ");
  }
  function aiSourcesFooterHtml(entry) {
    if (!entry.confidence) return "";
    const meta = AI_CONFIDENCE_META[entry.confidence];
    if (!meta) return "";
    const summary = aiSourcesSummary(entry.sources);
    return `<div class="meta" style="margin-top:6px;opacity:0.75;font-size:12px">${meta.icon} ${meta.label}${summary ? " · " + escHtml(summary) : ""}</div>`;
  }

  function renderAiChatView() {
    const isOllama = state.aiStatus && state.aiStatus.provider === "ollama";
    const quickHtml = AI_QUICK_TILES.map(
      (t) => `<button type="button" class="ai-quick-tile" data-ai-quick="${t.action}">${escHtml(t.label)}</button>`
    ).join("") + `<button type="button" class="ai-quick-tile" data-ai-quick="vision">👁️ ¿Qué ves?</button>`;
    const logHtml = state.aiLog.length
      ? state.aiLog.map(aiMsgBubbleHtml).join("")
      : `<p class="tagline" style="padding:12px 0">¿Qué necesitas? Puedo consultar el estado del sistema o ejecutar escenas (con tu confirmación).</p>`;
    els.aiBody.innerHTML = `
      ${isOllama ? `<p class="tagline ai-ollama-note">🐢 Modelo local (Ollama) — puede tardar varios minutos en responder.</p>` : ""}
      <div class="ai-quick-tiles">${quickHtml}</div>
      <div class="ai-chat-log" id="ai-chat-log">${logHtml}</div>
      <form id="ai-chat-form" class="ai-chat-form">
        <input type="text" id="ai-chat-input" placeholder="Escribe algo..." autocomplete="off" ${state.aiBusy ? "disabled" : ""} />
        <button type="submit" class="dk-btn" ${state.aiBusy ? "disabled" : ""}>${state.aiBusy ? "..." : "Enviar"}</button>
      </form>`;

    const log = document.getElementById("ai-chat-log");
    if (log) log.scrollTop = log.scrollHeight;

    document.getElementById("ai-chat-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("ai-chat-input");
      const text = (input?.value || "").trim();
      if (!text) return;
      input.value = "";
      submitAiChat(text);
    });
    els.aiBody.querySelectorAll("[data-ai-quick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-ai-quick");
        // 6.4.8 - a diferencia del resto de tiles (atajos directos SIN IA),
        // este SI pasa por el modelo - se queda en el panel de chat en vez
        // de navegar fuera.
        if (action === "vision") submitAiChat(AI_VISION_PROMPT);
        else handleAiQuickTile(action);
      });
    });
    els.aiBody.querySelectorAll("[data-ai-confirm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        confirmAiAction(btn.getAttribute("data-ai-pending"), btn.getAttribute("data-ai-confirm") === "1");
      });
    });
  }

  function renderAiNotConfiguredView() {
    els.aiBody.innerHTML = `
      <p class="tagline" style="padding:12px 0">BMO AI todavía no está configurada. Añade una API key de Anthropic para activarla.</p>
      <button type="button" class="dk-btn" id="ai-go-settings">Configurar ahora</button>`;
    document.getElementById("ai-go-settings")?.addEventListener("click", () => {
      state.aiView = "settings";
      renderAiPanel();
    });
  }

  const AI_PROVIDER_DEFAULT_MODEL = {
    anthropic: "claude-sonnet-4-5-20250929",
    ollama: "qwen3:4b",
    openai: "gpt-4o-mini",
    "ollama-cloud": "gpt-oss:20b",
  };
  const AI_PROVIDER_APIKEY_PLACEHOLDER = { openai: "sk-...", "ollama-cloud": "clave de ollama.com/settings/keys" };

  // 6.5.2 - Camara como disparador: APAGADO por defecto (opt-in real, no
  // solo un texto que lo diga) - este bloque es el unico sitio para
  // encenderlo/apagarlo. Vive en Ajustes de IA porque usa el mismo sistema
  // de vision (6.4.8), no es un ajuste de camara aparte.
  async function renderCameraTriggerBlock() {
    const el = document.getElementById("camera-trigger-block");
    if (!el) return;
    let status;
    try {
      status = await api("/api/system/camera-trigger");
    } catch (err) {
      el.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    el.innerHTML = `
      <strong>👀 Cámara como disparador</strong>
      <p class="tagline">Comprueba cada ${Math.round((status.pollMs || 90000) / 1000)}s si hay alguien delante de la cámara (usa el mismo modelo de visión) y genera un evento real que puedes usar en una automatización ("cuando la cámara detecte a alguien"). Se detiene solo en modo privacidad.</p>
      <label class="ai-settings-check">
        <input type="checkbox" id="camera-trigger-enabled" ${status.enabled ? "checked" : ""} />
        Activada
      </label>
      ${status.lastCheckAt ? `<p class="sic-sub">Última comprobación: ${escHtml(formatHistoryWhen(status.lastCheckAt))} · ${status.lastDetected == null ? "sin resultado" : status.lastDetected ? "👀 detectada" : "sin nadie"}</p>` : ""}
      ${status.framesAnalyzed || status.framesSkipped ? `<p class="tagline">${status.framesAnalyzed} análisis reales · ${status.framesSkipped} ahorrados (frame casi igual al anterior, no se llamó al modelo de visión)</p>` : ""}`;
    document.getElementById("camera-trigger-enabled")?.addEventListener("change", async (e) => {
      try {
        await api("/api/system/camera-trigger", { method: "POST", body: JSON.stringify({ enabled: e.target.checked }) });
        toast(e.target.checked ? "Activado" : "Desactivado");
        renderCameraTriggerBlock();
      } catch (err) {
        toast(err.message || "Error");
        e.target.checked = !e.target.checked;
      }
    });
    renderCameraCaptureSettingsBlock();
  }

  // 7.2.9 (KAN-167) - Camera Manager (alcance acotado, ver visionService.js
  // en el backend): resolucion/tiempo de calentamiento de la captura como
  // capacidad real gestionable, no solo constantes fijas en el codigo.
  async function renderCameraCaptureSettingsBlock() {
    const el = document.getElementById("camera-capture-settings-block");
    if (!el) return;
    let settings;
    try {
      settings = await api("/api/system/camera-capture-settings");
    } catch (err) {
      el.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    el.innerHTML = `
      <strong>📷 Ajustes de captura</strong>
      <p class="tagline">Resolución y tiempo de calentamiento reales que usa la cámara en cada captura (foto puntual o disparador).</p>
      <label>Resolución
        <select id="camera-capture-resolution">
          ${settings.presets.map((p) => `<option value="${escHtml(p)}" ${p === settings.resolution ? "selected" : ""}>${escHtml(p)}</option>`).join("")}
        </select>
      </label>
      <label>Tiempo de calentamiento (ms)
        <input type="number" id="camera-capture-warmup" min="100" max="2000" step="50" value="${settings.warmupMs}" />
      </label>
      <button type="button" class="dk-btn" id="camera-capture-settings-save">Guardar</button>`;
    document.getElementById("camera-capture-settings-save")?.addEventListener("click", async () => {
      const resolution = document.getElementById("camera-capture-resolution").value;
      const warmupMs = Number(document.getElementById("camera-capture-warmup").value);
      try {
        await api("/api/system/camera-capture-settings", { method: "POST", body: JSON.stringify({ resolution, warmupMs }) });
        toast("Ajustes de captura guardados");
        renderCameraCaptureSettingsBlock();
      } catch (err) {
        toast(err.message || "No se pudo guardar");
      }
    });
  }

  // 7.2.26 (KAN-184) - BMO Visual Interface: tarjeta real combinando
  // camara/presencia/voz, con analisis BAJO DEMANDA (no automatico al
  // abrir la pantalla, para no gastar una llamada real de vision cada vez).
  const VISUAL_PRESENCE_META = {
    PRESENT: { icon: "🟢", label: "Presente" },
    AWAY: { icon: "⚪", label: "Ausente" },
    UNKNOWN: { icon: "❔", label: "Desconocido" },
  };
  // BMO Voice F4 (KAN-409): clave de Fish Audio (cifrada en la Pi, nunca se
  // vuelve a mostrar), voz elegida y prueba que se escucha en ESTE navegador.
  async function renderBmoVoiceBlock() {
    const el = document.getElementById("bmo-voice-block");
    if (!el) return;
    let v;
    try {
      v = await api("/api/bmo/voice/settings");
    } catch (err) {
      el.innerHTML = `<strong>🗣️ Voz de BMO</strong><p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    const models = (v.fishModels || [""]).map(
      (m) => `<option value="${escHtml(m)}" ${m === v.fishModel ? "selected" : ""}>${m ? escHtml(m) : "Por defecto de Fish Audio"}</option>`
    );
    el.innerHTML = `
      <strong>🗣️ Voz de BMO (Fish Audio)</strong>
      <p class="tagline">Voz: <b>${escHtml(v.voiceName || "")}</b>. La clave se guarda cifrada en la Pi y nunca se vuelve a mostrar; el texto que BMO dice se envía a Fish Audio para generar la voz.</p>
      <p class="sic-sub" id="bmo-voice-keystate">${v.hasKey ? `✅ Clave guardada (${escHtml(v.hint || "")})` : "⚠️ Sin clave: BMO todavía no puede hablar con su voz"}</p>
      <label>Clave de API de Fish Audio ${v.hasKey ? "(deja en blanco para no cambiarla)" : ""}
        <input type="password" id="bmo-voice-key" autocomplete="new-password" spellcheck="false" placeholder="${v.hasKey ? "••••••••" : "sk-fish-…"}" />
      </label>
      <div class="docker-actions">
        <button type="button" class="dk-btn" id="bmo-voice-key-save">Guardar clave</button>
        ${v.hasKey ? `<button type="button" class="dk-btn ghost" id="bmo-voice-key-del">Borrar clave</button>` : ""}
      </div>
      <label>Id de la voz (fish.audio/m/…)
        <input type="text" id="bmo-voice-ref" value="${escHtml(v.referenceId || "")}" spellcheck="false" />
      </label>
      <label>Modelo de Fish Audio
        <select id="bmo-voice-model">${models.join("")}</select>
      </label>
      <label>Velocidad <span id="bmo-voice-speed-val">${Number(v.speed).toFixed(2)}×</span>
        <input type="range" id="bmo-voice-speed" min="0.5" max="2" step="0.05" value="${Number(v.speed)}" />
      </label>
      <label>Volumen <span id="bmo-voice-vol-val">${v.volumeDb > 0 ? "+" : ""}${v.volumeDb} dB</span>
        <input type="range" id="bmo-voice-vol" min="-12" max="12" step="1" value="${Number(v.volumeDb)}" />
      </label>
      <button type="button" class="dk-btn ghost" id="bmo-voice-save">Guardar ajustes de voz</button>
      <label style="margin-top:10px">Probar con esta frase
        <input type="text" id="bmo-voice-text" maxlength="500" value="¡Holaaaa! ¡BMO está preparado para hablar contigo!" />
      </label>
      <button type="button" class="dk-btn" id="bmo-voice-test" ${v.hasKey ? "" : "disabled"}>▶ Probar voz</button>
      <p class="tagline" id="bmo-voice-result"></p>`;

    const $ = (id) => document.getElementById(id);
    $("bmo-voice-speed")?.addEventListener("input", (e) => ($("bmo-voice-speed-val").textContent = `${Number(e.target.value).toFixed(2)}×`));
    $("bmo-voice-vol")?.addEventListener("input", (e) => ($("bmo-voice-vol-val").textContent = `${e.target.value > 0 ? "+" : ""}${e.target.value} dB`));

    $("bmo-voice-key-save")?.addEventListener("click", async () => {
      const input = $("bmo-voice-key");
      const key = (input.value || "").trim();
      if (!key) return toast("Pega primero la clave");
      try {
        await api("/api/bmo/voice/key", { method: "PUT", body: JSON.stringify({ key }) });
        input.value = ""; // no se queda en la pantalla
        toast("Clave guardada");
        renderBmoVoiceBlock();
      } catch (err) {
        toast(err.message || "Error");
      }
    });
    $("bmo-voice-key-del")?.addEventListener("click", async () => {
      try {
        await api("/api/bmo/voice/key", { method: "DELETE" });
        toast("Clave borrada");
        renderBmoVoiceBlock();
      } catch (err) {
        toast(err.message || "Error");
      }
    });
    $("bmo-voice-save")?.addEventListener("click", async () => {
      try {
        await api("/api/bmo/voice/settings", {
          method: "PUT",
          body: JSON.stringify({
            referenceId: $("bmo-voice-ref").value,
            fishModel: $("bmo-voice-model").value,
            speed: Number($("bmo-voice-speed").value),
            volumeDb: Number($("bmo-voice-vol").value),
          }),
        });
        toast("Ajustes de voz guardados");
      } catch (err) {
        toast(err.message || "Error");
      }
    });
    $("bmo-voice-test")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const out = $("bmo-voice-result");
      btn.disabled = true;
      out.textContent = "Generando la voz…";
      try {
        const r = await api("/api/bmo/voice/test", { method: "POST", body: JSON.stringify({ text: $("bmo-voice-text").value }) });
        // El audio se pide con la cabecera de BMO y se reproduce aquí mismo.
        const res = await fetch(`${API_BASE}/api/v1/bmo/voice/last-audio`, { headers: { "X-BMO-Key": API_KEY } });
        if (!res.ok) throw new Error(`No se pudo descargar el audio (HTTP ${res.status})`);
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        out.textContent = `✅ Generado en ${(r.ms / 1000).toFixed(1)} s (${Math.round(r.bytes / 1024)} KB). Sonando en este dispositivo…`;
        await audio.play().catch(() => {
          out.textContent += " (el navegador bloqueó la reproducción automática: pulsa de nuevo)";
        });
      } catch (err) {
        out.textContent = `⚠️ ${err.message || "Error"}`;
      } finally {
        btn.disabled = false;
      }
    });
  }

  async function renderVisualInterfaceBlock() {
    const el = document.getElementById("visual-interface-block");
    if (!el) return;
    let status;
    try {
      status = await api("/api/system/visual-interface");
    } catch (err) {
      el.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    const presenceMeta = VISUAL_PRESENCE_META[status.presence] || VISUAL_PRESENCE_META.UNKNOWN;
    el.innerHTML = `
      <strong>👁️ Interfaz Visual</strong>
      <p class="tagline">📷 Cámara: ${status.camera.enabled ? "activada" : "desactivada"}${
        status.camera.enabled
          ? ` · ${status.camera.lastDetected == null ? "sin resultado aún" : status.camera.lastDetected ? "detectada una persona" : "nadie detectado"}`
          : ""
      }</p>
      <p class="tagline">${presenceMeta.icon} Presencia fusionada: <strong>${presenceMeta.label}</strong></p>
      <p class="tagline">🎙️ Voz: no disponible (micrófono sin confirmar)</p>
      <button type="button" class="dk-btn" id="visual-interface-analyze">¿Qué ves ahora?</button>
      <div id="visual-interface-result"></div>`;
    document.getElementById("visual-interface-analyze")?.addEventListener("click", async (e) => {
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = "Analizando…";
      const resultEl = document.getElementById("visual-interface-result");
      try {
        const result = await api("/api/system/visual-interface/analyze", { method: "POST", body: JSON.stringify({}) });
        resultEl.innerHTML = `<p class="sic-sub">${escHtml(result.description)}</p>`;
      } catch (err) {
        resultEl.innerHTML = `<p class="tagline">${escHtml(err.message || "No se pudo analizar")}</p>`;
      } finally {
        btn.disabled = false;
        btn.textContent = "¿Qué ves ahora?";
      }
    });
  }

  function renderAiSettingsView() {
    const s = state.aiStatus || {};
    const provider = ["ollama", "openai", "ollama-cloud"].includes(s.provider) ? s.provider : "anthropic";
    const isLocalOllama = provider === "ollama";
    els.aiBody.innerHTML = `
      <form id="ai-settings-form" class="ai-settings-form">
        <label>Proveedor
          <select name="provider" id="ai-provider-select">
            <option value="anthropic" ${provider === "anthropic" ? "selected" : ""}>Anthropic Claude (nube)</option>
            <option value="openai" ${provider === "openai" ? "selected" : ""}>OpenAI (nube)</option>
            <option value="ollama-cloud" ${provider === "ollama-cloud" ? "selected" : ""}>Ollama Cloud/Turbo (nube, rápido)</option>
            <option value="ollama" ${provider === "ollama" ? "selected" : ""}>Ollama (local, en este Pi — lento)</option>
          </select>
        </label>
        <p class="tagline" id="ai-ollama-local-note" ${isLocalOllama ? "" : "hidden"}>
          Corre en la propia Raspberry Pi: gratis y sin API key, pero lento (varios minutos por respuesta con qwen3:4b en esta CPU).
        </p>
        <p class="tagline" id="ai-ollama-cloud-note" ${provider === "ollama-cloud" ? "" : "hidden"}>
          Mismo Ollama, pero corriendo en la nube de ollama.com en vez de la Pi — mucho más rápido. Necesita una API key propia de ollama.com/settings/keys (no la misma clave que usarías en local).
        </p>
        <div id="ai-apikey-field" ${isLocalOllama ? "hidden" : ""}>
          <label>API key ${s.configured && !isLocalOllama ? "(ya configurada — deja en blanco para no cambiarla)" : ""}
            <input type="password" name="apiKey" autocomplete="off" placeholder="${s.configured && !isLocalOllama ? "••••••••" : AI_PROVIDER_APIKEY_PLACEHOLDER[provider] || "sk-ant-..."}" />
          </label>
        </div>
        <label>Modelo
          <input type="text" name="model" value="${escHtml(s.model || AI_PROVIDER_DEFAULT_MODEL[provider])}" />
        </label>
        <label class="ai-settings-check">
          <input type="checkbox" name="enabled" ${s.enabled !== false ? "checked" : ""} />
          Activada
        </label>
        <label class="ai-settings-check">
          <input type="checkbox" name="multiAgentEnabled" ${s.multiAgentEnabled ? "checked" : ""} />
          Arquitectura multi-agente (llamadas separadas por agente — más coste y latencia por turno)
        </label>
        <p class="tagline">Desactivada por defecto: un único agente responde cada turno (más barato y rápido). Activarla reparte la pregunta entre varios agentes en paralelo y combina sus respuestas — solo tiene sentido si de verdad quieres probar ese modo, tiene un coste real por turno.</p>
        <button type="submit" class="dk-btn">Guardar</button>
      </form>
      <div id="bmo-voice-block" class="plugin-card" style="margin-top:12px"><p class="tagline">Cargando…</p></div>
      <div id="privacy-mode-block" class="plugin-card" style="margin-top:12px"><p class="tagline">Cargando…</p></div>
      ${aiPreferencesFormHtml()}
      <div id="camera-trigger-block" class="plugin-card" style="margin-top:12px"><p class="tagline">Cargando…</p></div>
      <div id="camera-capture-settings-block" class="plugin-card" style="margin-top:12px"><p class="tagline">Cargando…</p></div>
      <div id="visual-interface-block" class="plugin-card" style="margin-top:12px"><p class="tagline">Cargando…</p></div>
      <div class="docker-actions" style="margin-top:12px">
        <button type="button" class="dk-btn ghost" id="ai-history-btn">📜 Ver historial</button>
        <button type="button" class="dk-btn ghost" id="ai-audit-btn">📋 Ver registro de auditoría</button>
        <button type="button" class="dk-btn ghost" id="ai-memory-btn">🧠 Ver memoria</button>
        <button type="button" class="dk-btn ghost" id="ai-tasks-btn">✅ Ver tareas</button>
        <button type="button" class="dk-btn ghost" id="ai-knowledge-btn">📚 Conocimiento</button>
        <button type="button" class="dk-btn ghost" id="ai-agents-btn">🤖 BMO AI Center</button>
      </div>`;
    renderCameraTriggerBlock();
    renderVisualInterfaceBlock();
    renderBmoVoiceBlock();

    document.getElementById("ai-history-btn")?.addEventListener("click", () => {
      state.aiView = "history";
      renderAiPanel();
    });
    document.getElementById("ai-audit-btn")?.addEventListener("click", () => {
      state.aiView = "audit";
      renderAiPanel();
    });
    document.getElementById("ai-memory-btn")?.addEventListener("click", () => {
      state.aiView = "memory";
      renderAiPanel();
    });
    document.getElementById("ai-tasks-btn")?.addEventListener("click", () => {
      state.aiView = "tasks";
      renderAiPanel();
    });
    document.getElementById("ai-knowledge-btn")?.addEventListener("click", () => {
      state.aiView = "knowledge";
      renderAiPanel();
    });
    document.getElementById("ai-agents-btn")?.addEventListener("click", () => {
      state.aiView = "agents";
      renderAiPanel();
    });

    const providerSelect = document.getElementById("ai-provider-select");
    const apiKeyField = document.getElementById("ai-apikey-field");
    const apiKeyInput = document.querySelector("#ai-settings-form [name=apiKey]");
    const localNote = document.getElementById("ai-ollama-local-note");
    const cloudNote = document.getElementById("ai-ollama-cloud-note");
    const modelInput = document.querySelector("#ai-settings-form [name=model]");
    providerSelect?.addEventListener("change", () => {
      const nowLocal = providerSelect.value === "ollama";
      const nowCloud = providerSelect.value === "ollama-cloud";
      if (apiKeyField) apiKeyField.hidden = nowLocal;
      if (localNote) localNote.hidden = !nowLocal;
      if (cloudNote) cloudNote.hidden = !nowCloud;
      // 21/08/2026 - el placeholder tambien depende del proveedor (distinto
      // formato de key por proveedor) - antes solo se fijaba en el render
      // inicial y se quedaba obsoleto al cambiar de proveedor sin guardar.
      if (apiKeyInput && !(state.aiStatus?.configured && !nowLocal && state.aiStatus?.provider === providerSelect.value)) {
        apiKeyInput.placeholder = AI_PROVIDER_APIKEY_PLACEHOLDER[providerSelect.value] || "sk-ant-...";
      }
      if (modelInput && !modelInput.value) modelInput.value = AI_PROVIDER_DEFAULT_MODEL[providerSelect.value];
    });

    document.getElementById("ai-settings-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        state.aiStatus = await api("/api/ai/settings", {
          method: "POST",
          body: JSON.stringify({
            provider: fd.get("provider"),
            apiKey: fd.get("apiKey") || undefined,
            model: fd.get("model"),
            enabled: fd.get("enabled") === "on",
            multiAgentEnabled: fd.get("multiAgentEnabled") === "on",
          }),
        });
        toast("Ajustes de IA guardados");
        state.aiView = "chat";
        renderAiPanel();
      } catch (err) {
        toast(err.message || "No se pudo guardar");
      }
    });

    document.getElementById("ai-prefs-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const known = state.aiPreferencesKnown || {};
      const patch = {};
      for (const key of Object.keys(known)) {
        if (typeof known[key].default === "boolean") {
          patch[key] = fd.get(key) === "on";
        } else {
          const v = fd.get(key);
          patch[key] = v && String(v).trim() ? v : null;
        }
      }
      try {
        const res = await api("/api/ai/preferences", { method: "POST", body: JSON.stringify(patch) });
        state.aiPreferences = res.preferences;
        toast("Preferencias guardadas");
      } catch (err) {
        toast(err.message || "No se pudo guardar");
      }
    });

    // 7.1.10 (KAN-146) - aplicar/descartar la sugerencia: aplicar es un
    // cambio explicito de UN clic del usuario, no algo automatico.
    document.getElementById("ai-pref-suggestion-dismiss")?.addEventListener("click", () => {
      state.aiPreferenceSuggestions = [];
      renderAiPanel();
    });
    document.querySelectorAll("[data-apply-suggestion]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-apply-suggestion");
        const value = btn.getAttribute("data-apply-value") === "true";
        try {
          const res = await api("/api/ai/preferences", { method: "POST", body: JSON.stringify({ [key]: value }) });
          state.aiPreferences = res.preferences;
          state.aiPreferenceSuggestions = [];
          toast("Preferencia actualizada");
          renderAiPanel();
        } catch (err) {
          toast(err.message || "No se pudo guardar");
        }
      });
    });
    renderPrivacyModeBlock();
  }

  // 7.2.24 (KAN-182) - Privacy Modes: 4 presets reales sobre mecanismos ya
  // existentes (privacyMode/preferLocalModel/Vision Agent). El modo activo
  // se deriva del estado real, nunca de un campo guardado aparte - si no
  // coincide con ningun preset se muestra "personalizado", honestamente.
  const PRIVACY_MODE_META = {
    normal: { label: "Normal", desc: "Sin restricciones - todo como lo configures" },
    private: { label: "Private", desc: "IA forzada local, nada bloqueado" },
    full_privacy: { label: "Full Privacy", desc: "Bloquea procesos/logs/cámara + IA local" },
    vision_only: { label: "Vision Only", desc: "Bloquea procesos/logs + IA local, cámara permitida" },
    custom: { label: "Personalizado", desc: "Combinación manual, no coincide con ningún modo con nombre" },
  };
  async function renderPrivacyModeBlock() {
    const el = document.getElementById("privacy-mode-block");
    if (!el) return;
    let modeState;
    try {
      modeState = await api("/api/ai/privacy-mode");
    } catch (err) {
      el.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    el.innerHTML = `
      <strong>🔐 Modo de privacidad</strong>
      <p class="tagline">Actual: <strong>${escHtml(PRIVACY_MODE_META[modeState.mode]?.label || modeState.mode)}</strong> — ${escHtml(PRIVACY_MODE_META[modeState.mode]?.desc || "")}</p>
      <div class="docker-actions">
        ${["normal", "private", "full_privacy", "vision_only"]
          .map(
            (m) =>
              `<button type="button" class="dk-btn ${m === modeState.mode ? "" : "ghost"}" data-privacy-mode="${m}">${escHtml(PRIVACY_MODE_META[m].label)}</button>`
          )
          .join("")}
      </div>`;
    el.querySelectorAll("[data-privacy-mode]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const mode = btn.getAttribute("data-privacy-mode");
        try {
          await api("/api/ai/privacy-mode", { method: "POST", body: JSON.stringify({ mode }) });
          toast(`Modo ${PRIVACY_MODE_META[mode].label} aplicado`);
          const prefs = await api("/api/ai/preferences");
          state.aiPreferences = prefs.preferences;
          state.aiPreferencesKnown = prefs.known;
          renderAiSettingsView();
        } catch (err) {
          toast(err.message || "No se pudo cambiar el modo");
        }
      });
    });
  }

  // 4.12.7 - memoria de preferencias no-personales: formulario generado a
  // partir de la lista cerrada de claves conocidas que devuelve el backend
  // (aiPreferencesService.KNOWN_KEYS), para no tener que duplicar la lista
  // aqui a mano.
  function aiPreferencesFormHtml() {
    const known = state.aiPreferencesKnown;
    const prefs = state.aiPreferences;
    if (!known || !prefs) return "";
    const fields = Object.keys(known)
      .map((key) => {
        const meta = known[key];
        const value = prefs[key];
        if (typeof meta.default === "boolean") {
          return `<label class="ai-settings-check">
            <input type="checkbox" name="${escHtml(key)}" ${value ? "checked" : ""} />
            ${escHtml(meta.label)}
          </label>`;
        }
        // 6.1.18 - "proactivity" es de valores cerrados (off/critical/
        // recommendations), mejor un select que texto libre donde se
        // podria escribir cualquier cosa.
        if (key === "proactivity") {
          const options = [
            ["off", "Desactivada"],
            ["critical", "Solo críticas"],
            ["recommendations", "Críticas + recomendaciones"],
          ];
          return `<label>${escHtml(meta.label)}
            <select name="${escHtml(key)}">
              ${options.map(([v, l]) => `<option value="${v}" ${value === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </label>`;
        }
        // 7.1.11 (KAN-147) - Adaptive Behavior: mismo criterio que
        // proactivity - valores cerrados, select en vez de texto libre.
        if (key === "verbosity") {
          const options = [
            ["concise", "Conciso (respuestas cortas)"],
            ["normal", "Normal"],
            ["detailed", "Detallado (más contexto)"],
          ];
          return `<label>${escHtml(meta.label)}
            <select name="${escHtml(key)}">
              ${options.map(([v, l]) => `<option value="${v}" ${value === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </label>`;
        }
        if (key === "tone") {
          const options = [
            ["normal", "Normal"],
            ["urgent", "Urgente (sin bromas, directo)"],
          ];
          return `<label>${escHtml(meta.label)}
            <select name="${escHtml(key)}">
              ${options.map(([v, l]) => `<option value="${v}" ${value === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </label>`;
        }
        return `<label>${escHtml(meta.label)}
          <input type="text" name="${escHtml(key)}" value="${escHtml(value || "")}" placeholder="(sin fijar)" />
        </label>`;
      })
      .join("");
    // 7.1.10 (KAN-146) - banner de sugerencia basada en uso real, mismo
    // patron que el aviso de conflictos de memoria (KAN-140): solo lectura,
    // nunca cambia nada por su cuenta.
    const suggestions = state.aiPreferenceSuggestions || [];
    const suggestionsHtml = suggestions.length
      ? `<div class="ai-memory-conflict" style="margin-bottom:10px">
          ${suggestions
            .map(
              (s) => `<div style="flex:1 1 100%">💡 ${escHtml(s.message)}</div>
            <button type="button" class="dk-btn ghost" data-apply-suggestion="${escHtml(s.key)}" data-apply-value="${escHtml(String(s.value))}">Sí, cambiarlo</button>`
            )
            .join("")}
          <button type="button" class="dk-btn ghost" id="ai-pref-suggestion-dismiss" style="margin-top:6px">Ahora no</button>
        </div>`
      : "";
    return `<form id="ai-prefs-form" class="ai-settings-form" style="margin-top:18px">
      <h3 style="margin:0 0 4px;font-size:14px">Preferencias</h3>
      <p class="tagline" style="margin:0 0 4px">Configuración que BMO AI tiene en cuenta al responder (nada personal).</p>
      ${suggestionsHtml}
      ${fields}
      <button type="submit" class="dk-btn">Guardar preferencias</button>
    </form>`;
  }

  // 6.1.13 - Audit Log: lista lo que la IA ha ejecutado de verdad (tool,
  // parametros, si hizo falta confirmarlo, resultado), no el texto del
  // chat (eso ya lo tiene el Historial). Se carga bajo demanda, no en cada
  // apertura del panel de IA.
  async function renderAiAuditView() {
    els.aiBody.innerHTML = `<p class="tagline">Cargando...</p>`;
    let audit = [];
    try {
      const res = await api("/api/ai/audit?limit=50");
      audit = res.audit || [];
    } catch (err) {
      els.aiBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    const rows = audit.length
      ? audit
          .map((e) => {
            const icon = e.ok ? "✓" : "✗";
            const risk = AI_RISK_META[e.riskTier] ? AI_RISK_META[e.riskTier].icon : "";
            // 6.8.19 - Agent Audit Log: mismo registro de siempre, ahora con
            // el agente al que pertenece cada tool (ver agentRegistry.js).
            const agentIcon = AGENT_ICON[e.agent] || "";
            return `<div class="sys-list-row">
              <span>${icon} ${risk} ${escHtml(aiEntryLabel(e))}${e.confirmed ? " (confirmado)" : ""}</span>
              <span class="sic-sub">${agentIcon} ${escHtml(e.agent || "")} · ${escHtml(formatHistoryWhen(e.at))} · ${escHtml(JSON.stringify(e.params || {}))}</span>
            </div>`;
          })
          .join("")
      : `<p class="tagline">Todavía no hay acciones registradas.</p>`;
    els.aiBody.innerHTML = `
      <button type="button" class="dk-btn ghost" id="ai-audit-back">← Volver</button>
      <div style="margin-top:10px">${rows}</div>`;
    document.getElementById("ai-audit-back")?.addEventListener("click", () => {
      state.aiView = "settings";
      renderAiPanel();
    });
  }

  // 6.1.12 - dia legible ("Hoy"/"Ayer"/fecha) a partir de un ISO string,
  // en la zona horaria local del navegador (misma que ya usa el resto de
  // BMO para mostrar horas).
  function aiHistoryDayLabel(iso) {
    const d = new Date(iso);
    const now = new Date();
    const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  }

  // 6.1.12 - pantalla de historial agrupada por dia, la que el 4.12 dejo
  // explicitamente pendiente ("falta la pantalla") - el endpoint ya
  // existia y funcionaba, solo faltaba esta vista. Incluye "Borrar
  // historial" (tambien pedido en el mockup del spec, no existia ningun
  // borrado hasta ahora).
  async function renderAiHistoryView() {
    els.aiBody.innerHTML = `<p class="tagline">Cargando...</p>`;
    let history = [];
    try {
      const res = await api("/api/ai/history?limit=200");
      history = res.history || [];
    } catch (err) {
      els.aiBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    let bodyHtml;
    if (!history.length) {
      bodyHtml = `<p class="tagline">Todavía no hay conversaciones guardadas.</p>`;
    } else {
      const groups = [];
      let lastLabel = null;
      for (const entry of [...history].reverse()) {
        const label = aiHistoryDayLabel(entry.at);
        if (label !== lastLabel) {
          groups.push({ label, entries: [] });
          lastLabel = label;
        }
        groups[groups.length - 1].entries.push(entry);
      }
      bodyHtml = groups
        .map(
          (g) => `
        <h3 style="margin:14px 0 6px;font-size:13px;color:var(--muted)">${escHtml(g.label)}</h3>
        ${g.entries
          .map((e) => {
            const who = e.role === "user" ? "Tú" : "BMO";
            const icon = e.proactive ? "💡" : e.pending ? "⏳" : e.role === "user" ? "🗣️" : "🤖";
            return `<div class="sys-list-row">
              <span>${icon} ${escHtml(who)}: ${escHtml((e.text || "").slice(0, 140))}</span>
              <span class="sic-sub">${escHtml(formatHistoryWhen(e.at))}</span>
            </div>`;
          })
          .join("")}`
        )
        .join("");
    }
    els.aiBody.innerHTML = `
      <div class="docker-actions">
        <button type="button" class="dk-btn ghost" id="ai-history-back">← Volver</button>
        <button type="button" class="dk-btn ghost danger" id="ai-history-clear">🗑️ Borrar historial</button>
      </div>
      <div style="margin-top:10px">${bodyHtml}</div>`;
    document.getElementById("ai-history-back")?.addEventListener("click", () => {
      state.aiView = "settings";
      renderAiPanel();
    });
    document.getElementById("ai-history-clear")?.addEventListener("click", async () => {
      const ok = await showConfirmModal({
        title: "¿Borrar todo el historial de IA?",
        message: "Se eliminarán todas las conversaciones guardadas. Esta acción no se puede deshacer.",
        confirmLabel: "Borrar",
      });
      if (!ok) return;
      try {
        await api("/api/ai/history", { method: "DELETE" });
        toast("Historial borrado");
        renderAiHistoryView();
      } catch (err) {
        toast(err.message || "No se pudo borrar el historial");
      }
    });
  }

  // 6.4.2 - Memoria personal: pantalla de gestion (ademas de las tools
  // saveMemory/getMemory/deleteMemory que usa la IA por chat) - "control
  // explicito de que se guarda" tambien significa poder verlo/borrarlo a
  // mano sin depender del chat.
  const MEMORY_CATEGORY_LABEL = { usuario: "👤 Usuario", proyectos: "📁 Proyectos", rutinas: "🔁 Rutinas", eventos: "📌 Eventos", tecnico: "💻 Técnico", configuracion: "🔧 Configuración" };

  // 6.7.16/6.7.17/6.7.18 - Knowledge Dashboard + Memory/Project Explorer +
  // Backup, en una sola vista (mismo hueco de la app que memoria/tareas).
  // 6.7.6 - Knowledge Graph: iconos + etiqueta en castellano por tipo de
  // relacion real (ver knowledgeGraphService.js - proyecto->tecnologia,
  // dispositivo->grupo, escena->dispositivo, automatizacion->escena).
  const GRAPH_RELATION_LABEL = {
    usa: "📁 Proyectos y sus tecnologías",
    "pertenece a": "🗂️ Dispositivos y sus grupos",
    controla: "🎬 Escenas y sus dispositivos",
    ejecuta: "🤖 Automatizaciones y sus escenas",
  };

  async function renderAiKnowledgeView() {
    els.aiBody.innerHTML = `<p class="tagline">Cargando...</p>`;
    let dash, projects, documents, graph;
    try {
      [dash, projects, documents, graph] = await Promise.all([
        api("/api/ai/knowledge/dashboard"),
        api("/api/ai/projects").then((r) => r.projects || []),
        api("/api/ai/knowledge/documents").then((r) => r.documents || []),
        api("/api/ai/knowledge/graph"),
      ]);
    } catch (err) {
      els.aiBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    // 6.7.6 - agrupa las aristas reales por tipo de relacion, cada grupo
    // se renderiza como una lista legible "A → B" (mismo patron visual
    // que sys-list-row en vez de un diagrama con layout propio - honesto
    // con lo estrecha que es la pantalla del kiosco, 480px).
    const nodesById = Object.fromEntries((graph.nodes || []).map((n) => [n.id, n]));
    // 7.1.19 (KAN-155) - Personal Knowledge Graph: separa por 'domain'
    // (bmo/user, ver knowledgeGraphService.js) ANTES de agrupar por
    // relacion, en dos secciones con su propio titulo - la separacion que
    // pide el spec es real, no solo un renombrado del bloque unico de
    // antes.
    function graphGroupsHtml(domainEdges) {
      const edgesByRelation = {};
      for (const e of domainEdges) (edgesByRelation[e.relation] ||= []).push(e);
      if (!Object.keys(edgesByRelation).length) return null;
      return Object.entries(edgesByRelation)
        .map(
          ([relation, edges]) => `
            <h4 style="margin:10px 0 4px;font-size:13px">${escHtml(GRAPH_RELATION_LABEL[relation] || relation)}</h4>
            ${edges
              .map((e) => {
                const from = nodesById[e.from];
                const to = nodesById[e.to];
                return `<div class="sys-list-row"><span>${escHtml(from ? from.label : e.from)} → ${escHtml(to ? to.label : e.to)}</span></div>`;
              })
              .join("")}`
        )
        .join("");
    }
    const bmoEdges = (graph.edges || []).filter((e) => e.domain !== "user");
    const userEdges = (graph.edges || []).filter((e) => e.domain === "user");
    const bmoGroupsHtml = graphGroupsHtml(bmoEdges);
    const userGroupsHtml = graphGroupsHtml(userEdges);
    const graphGroups = `
      <h4 style="margin:10px 0 4px;font-size:13px;opacity:.8">🤖 Conocimiento de BMO</h4>
      ${bmoGroupsHtml || `<p class="tagline">Sin relaciones todavía — crea grupos de dispositivos, o escenas/automatizaciones para verlas aquí.</p>`}
      <h4 style="margin:14px 0 4px;font-size:13px;opacity:.8">👤 Tu conocimiento</h4>
      ${userGroupsHtml || `<p class="tagline">Sin relaciones todavía — crea proyectos con tecnologías, o guarda memoria/proyectos con descripción para verlas aquí.</p>`}`;
    // 7.1.18 (KAN-154) - Temporal Knowledge: changeLog (projectKnowledgeService.js)
    // solo existe cuando un campo cambio de verdad alguna vez - real, con
    // fechas reales, no un placeholder.
    function projectChangeLogHtml(changeLog) {
      if (!changeLog || !changeLog.length) return "";
      const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString("es-ES") : "?");
      return `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
        <strong>🕰️ Cambios anteriores</strong>
        ${[...changeLog]
          .reverse()
          .map(
            (c) =>
              `<div class="meta" style="margin-top:2px">${escHtml(PROJECT_FIELD_LABEL[c.field] || c.field)} era "${escHtml(c.previousValue)}" (${fmt(c.validFrom)} → ${fmt(c.validUntil)})</div>`
          )
          .join("")}
      </div>`;
    }
    const filledCount = (p) => Object.entries(p).filter(([k, v]) => projectKnowledgeFieldKeys.includes(k) && v).length;
    const projectRows = projects.length
      ? projects
          .map(
            (p) => `<div class="sys-list-row" data-project-row="${escHtml(p.id)}" style="cursor:pointer">
              <span>📁 <strong>${escHtml(p.name)}</strong>${p.status ? ` <span class="meta">· ${escHtml(p.status)}</span>` : ""}</span>
              <span class="docker-meta">${filledCount(p)}/9 campos</span>
            </div>
            <div class="project-detail" id="project-detail-${escHtml(p.id)}" hidden style="padding:8px 12px;font-size:13px">
              ${projectKnowledgeFieldKeys
                .map((k) => `<div><strong>${escHtml(PROJECT_FIELD_LABEL[k] || k)}:</strong> ${escHtml(p[k] || "—")}</div>`)
                .join("")}
              ${projectChangeLogHtml(p.changeLog)}
            </div>`
          )
          .join("")
      : `<p class="tagline">Sin proyectos todavía.</p>`;
    const docRows = documents.length
      ? documents
          .map(
            (d) => `<div class="sys-list-row" data-doc-row="${escHtml(d.id)}" style="cursor:pointer">
              <span>📄 <strong>${escHtml(d.label)}</strong></span>
              <span class="docker-meta">${d.chars.toLocaleString("es-ES")} car.</span>
            </div>
            <div class="project-detail" id="doc-detail-${escHtml(d.id)}" hidden style="padding:8px 12px;font-size:12px;white-space:pre-wrap;max-height:240px;overflow-y:auto"></div>`
          )
          .join("")
      : `<p class="tagline">Sin documentos.</p>`;
    els.aiBody.innerHTML = `
      <div class="docker-actions">
        <button type="button" class="dk-btn ghost" id="ai-knowledge-back">← Volver</button>
        <button type="button" class="dk-btn ghost" id="ai-knowledge-backup-btn">💾 Descargar backup</button>
      </div>
      <div class="perf-block" style="margin-top:10px">
        <h3>🧠 BMO Knowledge</h3>
        <div class="devices-kv">
          <div class="cell"><div class="label">Memorias</div><div class="value">${dash.memories}</div></div>
          <div class="cell"><div class="label">Proyectos</div><div class="value">${dash.projects}</div></div>
          <div class="cell"><div class="label">Documentos</div><div class="value">${dash.documents}</div></div>
          <div class="cell"><div class="label">Dispositivos</div><div class="value">${dash.devices}</div></div>
          <div class="cell"><div class="label">Versión</div><div class="value">${escHtml(dash.version)}</div></div>
        </div>
      </div>
      <h3 style="margin-top:14px">📁 Proyectos</h3>
      <div>${projectRows}</div>
      <h3 style="margin-top:14px">📄 Documentación de BMO</h3>
      <div>${docRows}</div>
      <h3 style="margin-top:14px">🕸️ Grafo de conocimiento</h3>
      <p class="tagline">${(graph.nodes || []).length} nodos · ${(graph.edges || []).length} relaciones reales (construido a partir de tus datos, no inventado)</p>
      <div>${graphGroups}</div>`;
    document.getElementById("ai-knowledge-back")?.addEventListener("click", () => {
      state.aiView = "settings";
      renderAiPanel();
    });
    document.getElementById("ai-knowledge-backup-btn")?.addEventListener("click", async () => {
      try {
        const backup = await api("/api/ai/knowledge/backup");
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bmo-knowledge-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast("Backup descargado");
      } catch (err) {
        toast(err.message || "No se pudo generar el backup");
      }
    });
    els.aiBody.querySelectorAll("[data-project-row]").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-project-row");
        const detail = document.getElementById(`project-detail-${id}`);
        if (detail) detail.hidden = !detail.hidden;
      });
    });
    els.aiBody.querySelectorAll("[data-doc-row]").forEach((row) => {
      row.addEventListener("click", async () => {
        const id = row.getAttribute("data-doc-row");
        const detail = document.getElementById(`doc-detail-${id}`);
        if (!detail) return;
        if (!detail.hidden) {
          detail.hidden = true;
          return;
        }
        if (!detail.dataset.loaded) {
          detail.textContent = "Cargando...";
          try {
            const doc = await api(`/api/ai/knowledge/documents/${id}`);
            detail.textContent = doc.content;
            detail.dataset.loaded = "1";
          } catch (err) {
            detail.textContent = err.message || "Error";
          }
        }
        detail.hidden = false;
      });
    });
  }

  // 6.8.26 - BMO AI Center: lista de agentes reales (agentRegistry.js en
  // el backend) con estado/permisos/capacidades - alcance "agentes
  // ligeros" (sin llamadas de modelo separadas por agente, ver
  // feature_multi_agent_architecture_design.md en memoria).
  async function renderAiAgentsView() {
    els.aiBody.innerHTML = `<p class="tagline">Cargando...</p>`;
    let agents = [];
    let lastCall = null;
    let queue = null;
    let cost = null;
    let agentActivity = {};
    let codingAllowlist = {};
    try {
      const res = await api("/api/ai/agents");
      agents = res.agents || [];
      lastCall = res.lastCall || null;
      queue = res.queue || null;
      cost = res.cost || null;
      agentActivity = res.agentActivity || {};
    } catch (err) {
      els.aiBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    try {
      codingAllowlist = (await api("/api/ai/coding/allowlist")).allowlist || {};
    } catch {
      /* opcional - no bloquea el resto de la pantalla si falla */
    }
    const multiAgentOn = !!(state.aiStatus && state.aiStatus.multiAgentEnabled);
    const queueHtml =
      queue && (queue.processing || queue.waiting)
        ? `<p class="tagline">⏳ ${queue.processing ? "hay un turno en curso" : ""}${queue.waiting ? `${queue.processing ? " · " : ""}${queue.waiting} esperando su turno` : ""}</p>`
        : "";
    const costHtml = cost
      ? `<p class="tagline">Uso real: ${cost.total.calls} llamada(s) · ${cost.total.inputTokens} tokens entrada / ${cost.total.outputTokens} salida en total${cost.fallbackCalls ? ` · ${cost.fallbackCalls} cayeron al respaldo local` : ""}</p>`
      : "";
    const lastCallHtml =
      lastCall && lastCall.at
        ? `<p class="tagline">Última llamada al modelo: ${lastCall.ok ? "✅" : "❌"} ${escHtml(formatHistoryWhen(lastCall.at))} · ${lastCall.latencyMs != null ? Math.round(lastCall.latencyMs / 100) / 10 + "s" : "?"}${lastCall.retried ? " · reintentada" : ""}${lastCall.fellBack ? " · 🔁 respaldo Ollama local" : ""}${lastCall.error ? ` · ${escHtml(lastCall.error)}` : ""}</p>`
        : `<p class="tagline">Todavía no se ha llamado al modelo en esta sesión.</p>`;
    const permHtml = (perm) =>
      Object.entries(perm || {})
        .filter(([, n]) => n > 0)
        .map(([tier, n]) => `${n} ${tier}`)
        .join(" · ") || "sin tools";
    const rows = agents
      .map((a) => {
        const statusMeta = AGENT_STATUS_META[a.status] || { icon: "⚪", label: a.status };
        const activity = agentActivity[a.id];
        const activityHtml = activity
          ? `<p><strong>Actividad (tool-calls):</strong> ${activity.calls} total · ${activity.ok} ok · ${activity.failed} fallidas${activity.lastAt ? ` · última ${escHtml(formatHistoryWhen(activity.lastAt))}` : ""}</p>`
          : `<p><strong>Actividad:</strong> sin registro todavía</p>`;
        const codingBlockHtml =
          a.id === "coding"
            ? `<div class="perf-block" style="margin-top:10px">
                <p><strong>Proyectos permitidos</strong> (solo estos puede leer/proponer cambios, en copia — nunca los toca de verdad):</p>
                ${
                  Object.keys(codingAllowlist).length
                    ? Object.entries(codingAllowlist)
                        .map(
                          ([name, e]) =>
                            `<div class="sys-list-row"><span><code>${escHtml(name)}</code> · ${escHtml(e.path)}${e.testCommand ? ` · tests: <code>${escHtml(e.testCommand)}</code>` : ""}</span><button type="button" class="dk-btn ghost" data-coding-remove="${escHtml(name)}">Quitar</button></div>`
                        )
                        .join("")
                    : `<p class="tagline">Ninguno todavía — sin proyectos añadidos, el Coding Agent no puede hacer nada.</p>`
                }
                <form id="coding-allowlist-form" class="ai-settings-form" style="margin-top:8px">
                  <label>Nombre (el que usarás al pedirle un cambio)<input type="text" name="name" required /></label>
                  <label>Ruta local completa del proyecto<input type="text" name="path" required /></label>
                  <label>Comando de tests (opcional)<input type="text" name="testCommand" placeholder="npm test" /></label>
                  <button type="submit" class="dk-btn">Añadir</button>
                </form>
              </div>`
            : "";
        return `<div class="sys-list-row" data-agent-row="${escHtml(a.id)}" style="cursor:pointer">
          <span>${AGENT_ICON[a.id] || "🤖"} <strong>${escHtml(a.name)}</strong>${a.protected ? ' <span class="meta">🔒 Protected</span>' : ""} <span class="meta">${statusMeta.icon} ${statusMeta.label}</span></span>
          <span class="docker-meta">${a.tools.length} tool(s)</span>
        </div>
        <div class="project-detail" id="agent-detail-${escHtml(a.id)}" hidden style="padding:8px 12px;font-size:13px">
          <p>${escHtml(a.description)}</p>
          <p><strong>Modelo:</strong> ${escHtml(a.model.provider || "—")} / ${escHtml(a.model.model || "—")}</p>
          <p><strong>Permisos:</strong> ${escHtml(permHtml(a.permissions))}${a.protected ? " · 🔒 Protected (usa datos sensibles)" : ""}</p>
          <p><button type="button" class="dk-btn ghost" data-agent-toggle="${escHtml(a.id)}">${a.enabled ? "Desactivar agente" : "Activar agente"}</button></p>
          ${activityHtml}
          ${a.can.length ? `<p><strong>Puede:</strong></p><ul>${a.can.map((c) => `<li>✓ ${escHtml(c)}</li>`).join("")}</ul>` : ""}
          ${a.cannot.length ? `<p><strong>No puede:</strong></p><ul>${a.cannot.map((c) => `<li>✗ ${escHtml(c)}</li>`).join("")}</ul>` : ""}
          ${a.tools.length ? `<p><strong>Tools:</strong> ${escHtml(a.tools.join(", "))}</p>` : ""}
          ${codingBlockHtml}
        </div>`;
      })
      .join("");
    els.aiBody.innerHTML = `
      <div class="docker-actions">
        <button type="button" class="dk-btn ghost" id="ai-agents-back">← Volver</button>
      </div>
      <div class="perf-block" style="margin-top:10px">
        <h3>🤖 BMO AI Center</h3>
        ${lastCallHtml}
        ${queueHtml}
        ${costHtml}
        <p class="tagline">${agents.filter((a) => a.status === "READY").length} de ${agents.length} agentes listos. ${multiAgentOn ? "🟡 Arquitectura multi-agente ACTIVA: cada turno puede repartirse en varias llamadas paralelas." : "Alcance actual: un modelo por turno, sin llamadas paralelas (activable en Ajustes)."}</p>
      </div>
      <div style="margin-top:10px">${rows}</div>`;
    document.getElementById("ai-agents-back")?.addEventListener("click", () => {
      state.aiView = "settings";
      renderAiPanel();
    });
    els.aiBody.querySelectorAll("[data-agent-row]").forEach((row) => {
      row.addEventListener("click", () => {
        const detail = document.getElementById(`agent-detail-${row.getAttribute("data-agent-row")}`);
        if (detail) detail.hidden = !detail.hidden;
      });
    });
    document.getElementById("coding-allowlist-form")?.addEventListener("click", (e) => e.stopPropagation());
    document.getElementById("coding-allowlist-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api("/api/ai/coding/allowlist", {
          method: "POST",
          body: JSON.stringify({ name: fd.get("name"), path: fd.get("path"), testCommand: fd.get("testCommand") || undefined }),
        });
        toast("Proyecto añadido");
        renderAiAgentsView();
      } catch (err) {
        toast(err.message || "No se pudo añadir");
      }
    });
    els.aiBody.querySelectorAll("[data-agent-toggle]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-agent-toggle");
        const a = agents.find((x) => x.id === id);
        try {
          await api(`/api/ai/agents/${id}/toggle`, {
            method: "POST",
            body: JSON.stringify({ enabled: !a.enabled }),
          });
          renderAiAgentsView();
        } catch (err) {
          toast(err.message || "No se pudo cambiar el estado del agente");
        }
      });
    });
    els.aiBody.querySelectorAll("[data-coding-remove]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await api(`/api/ai/coding/allowlist/${encodeURIComponent(btn.getAttribute("data-coding-remove"))}`, { method: "DELETE" });
          toast("Proyecto quitado");
          renderAiAgentsView();
        } catch (err) {
          toast(err.message || "No se pudo quitar");
        }
      });
    });
  }

  const projectKnowledgeFieldKeys = ["description", "technologies", "repository", "status", "tasks", "architecture", "documentation", "versions", "history"];
  const PROJECT_FIELD_LABEL = {
    description: "Descripción",
    technologies: "Tecnologías",
    repository: "Repositorio",
    status: "Estado",
    tasks: "Tareas",
    architecture: "Arquitectura",
    documentation: "Documentación",
    versions: "Versiones",
    history: "Historial",
  };

  // 6.7.7 - Semantic Search en la UI: aiMemoryQuery vive en el closure (no
  // en `state`, no necesita persistir entre vistas) para poder re-renderizar
  // sin perder lo que el usuario ya escribio en la caja de busqueda.
  let aiMemoryQuery = "";
  let aiMemorySearchTimer = null;
  // 7.1.4 (KAN-140) - Contradiction Detection: la deteccion (findConflicts,
  // palabra clave, 6.7.13) y el aviso a la IA por chat ya existian - el
  // hueco real era que guardar un dato aqui mismo, en la UI, sin pasar por
  // el chat, no avisaba nunca aunque el backend ya devuelve `conflicts` en
  // la respuesta del POST. Vive en el closure igual que aiMemoryQuery: solo
  // dura mientras se ve esta pantalla, se limpia sola al volver/borrar.
  let aiMemoryConflict = null;
  // 7.1.3 (KAN-139) - Memory Consolidation: resultado del barrido bajo
  // demanda sobre TODA la memoria (distinto de aiMemoryConflict, que solo
  // reacciona a lo que se acaba de guardar este turno).
  let aiMemoryDuplicateGroups = null;

  async function renderAiMemoryView() {
    els.aiBody.innerHTML = `<p class="tagline">Cargando...</p>`;
    let facts = [];
    try {
      const q = aiMemoryQuery.trim();
      const res = await api(q ? `/api/ai/memory?q=${encodeURIComponent(q)}` : "/api/ai/memory");
      facts = res.facts || [];
    } catch (err) {
      els.aiBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    const hasQuery = !!aiMemoryQuery.trim();
    // 6.7.7 - matchType/score solo vienen cuando hay busqueda activa (el
    // listado plano sin query no los tiene, ver aiMemoryService.list()).
    const matchBadge = (f) => {
      if (!hasQuery || !f.matchType) return "";
      return f.matchType === "semantic"
        ? `<span class="meta" title="Encontrado por significado, no por texto exacto">🧠 semántico · ${Math.round((f.score || 0) * 100)}%</span>`
        : `<span class="meta" title="Coincidencia de texto exacto">🔤 palabra clave</span>`;
    };
    // 6.7.3 - /api/ai/memory ya devuelve mas-reciente-primero desde el
    // backend (antes era orden de insercion, por eso hacia falta este
    // .reverse() aqui - ya no).
    const rows = facts.length
      ? facts
          .map(
            (f) => `<div class="sys-list-row" style="flex-wrap:wrap">
              <span style="flex:1 1 100%">${escHtml(MEMORY_CATEGORY_LABEL[f.category] || f.category)}: ${escHtml(f.text)} ${matchBadge(f)}${
                // 7.1.18 (KAN-154) - priorVersions solo existe si el texto
                // cambio de verdad alguna vez (aiMemoryService.js).
                f.priorVersions && f.priorVersions.length
                  ? ` <span class="meta" title="${escHtml(f.priorVersions.map((v) => v.text).join(" → "))}">🕰️ ${f.priorVersions.length} versión${f.priorVersions.length > 1 ? "es" : ""} anterior${f.priorVersions.length > 1 ? "es" : ""}</span>`
                  : ""
              }</span>
              <span class="meta" style="flex:1 1 auto;display:flex;gap:8px;align-items:center">
                🎯 <select data-memory-confidence="${escHtml(f.id)}" style="font-size:12px">
                  <option value="high" ${f.confidence === "high" ? "selected" : ""}>⭐ Alta</option>
                  <option value="medium" ${f.confidence === "medium" ? "selected" : ""}>🤔 Media</option>
                  <option value="low" ${f.confidence === "low" ? "selected" : ""}>❓ Baja</option>
                </select>
                🔏 <select data-memory-privacy="${escHtml(f.id)}" style="font-size:12px">
                  <option value="public" ${f.privacyLevel === "public" ? "selected" : ""}>🌐 Pública</option>
                  <option value="private" ${!f.privacyLevel || f.privacyLevel === "private" ? "selected" : ""}>🔒 Privada</option>
                  <option value="sensitive" ${f.privacyLevel === "sensitive" ? "selected" : ""}>⚠️ Sensible</option>
                  <option value="restricted" ${f.privacyLevel === "restricted" ? "selected" : ""}>⛔ Restringida</option>
                </select>
              </span>
              <span class="discovery-row-actions">
                <button type="button" class="activity-more" data-memory-edit="${escHtml(f.id)}" data-memory-text="${escHtml(f.text)}">✏️</button>
                <button type="button" class="activity-more" data-memory-delete="${escHtml(f.id)}">Borrar</button>
              </span>
            </div>`
          )
          .join("")
      : hasQuery
        ? `<p class="tagline">Sin resultados para "${escHtml(aiMemoryQuery.trim())}".</p>`
        : `<p class="tagline">Todavía no hay nada guardado. Pídeselo a BMO por chat ("recuerda que...") o añádelo aquí.</p>`;
    // 7.1.4 (KAN-140) - mismo mecanismo data-memory-delete que las filas
    // normales (el listener generico de mas abajo ya las recoge a todas,
    // no hace falta un handler aparte para el banner).
    const conflictBanner = aiMemoryConflict
      ? `<div class="sys-list-row" style="flex-wrap:wrap;border:1px solid #d9822b;background:rgba(217,130,43,0.12)">
          ${
            aiMemoryConflict.items && aiMemoryConflict.items.length
              ? `<span style="flex:1 1 100%">⚠️ Lo que acabas de guardar ("${escHtml(aiMemoryConflict.newText)}") puede contradecir esto que ya tenías:</span>
                ${aiMemoryConflict.items
                  .map(
                    (c) => `<span style="flex:1 1 100%;display:flex;justify-content:space-between;align-items:center;gap:8px">
                      <span>${escHtml(c.text)}</span>
                      <button type="button" class="activity-more" data-memory-delete="${escHtml(c.id)}">Borrar este</button>
                    </span>`
                  )
                  .join("")}`
              : ""
          }
          ${
            // 7.1.3 (KAN-139) - mismo banner, misma mecanica data-memory-delete
            // (reusa el listener generico de mas abajo) - distinto solo en el
            // mensaje, para no duplicar el aviso de contradiccion (KAN-140)
            // con el de redundancia genuina.
            aiMemoryConflict.duplicateItems && aiMemoryConflict.duplicateItems.length
              ? `<span style="flex:1 1 100%">🧹 Ya tenías guardado algo casi idéntico a esto:</span>
                ${aiMemoryConflict.duplicateItems
                  .map(
                    (d) => `<span style="flex:1 1 100%;display:flex;justify-content:space-between;align-items:center;gap:8px">
                      <span>${escHtml(d.text)}</span>
                      <button type="button" class="activity-more" data-memory-delete="${escHtml(d.id)}">Borrar este</button>
                    </span>`
                  )
                  .join("")}`
              : ""
          }
          <button type="button" class="dk-btn ghost" id="ai-memory-conflict-dismiss" style="margin-top:6px">Descartar aviso</button>
        </div>`
      : "";
    // 7.1.3 (KAN-139) - resultado del barrido bajo demanda: grupos de
    // duplicados reales YA existentes en la memoria (no solo lo de este
    // guardado). Cada grupo muestra todos los textos casi identicos y deja
    // borrar cualquiera excepto uno (mismo mecanismo data-memory-delete).
    const duplicateGroupsHtml =
      aiMemoryDuplicateGroups && aiMemoryDuplicateGroups.length
        ? `<div class="sys-list-row" style="flex-wrap:wrap;border:1px solid #d9822b;background:rgba(217,130,43,0.12);margin-top:10px">
            <span style="flex:1 1 100%">🧹 ${aiMemoryDuplicateGroups.length} grupo${aiMemoryDuplicateGroups.length > 1 ? "s" : ""} de recuerdos casi idénticos:</span>
            ${aiMemoryDuplicateGroups
              .map(
                (group) => `<div style="flex:1 1 100%;margin:4px 0;padding-left:8px;border-left:2px solid #d9822b">
                  ${group
                    .map(
                      (f) => `<span style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                        <span>${escHtml(MEMORY_CATEGORY_LABEL[f.category] || f.category)}: ${escHtml(f.text)}</span>
                        <button type="button" class="activity-more" data-memory-delete="${escHtml(f.id)}">Borrar este</button>
                      </span>`
                    )
                    .join("")}
                </div>`
              )
              .join("")}
            <button type="button" class="dk-btn ghost" id="ai-memory-duplicates-dismiss" style="margin-top:6px">Descartar</button>
          </div>`
        : aiMemoryDuplicateGroups
          ? `<p class="tagline" style="margin-top:10px">Sin duplicados reales encontrados.</p>`
          : "";
    els.aiBody.innerHTML = `
      <div class="docker-actions">
        <button type="button" class="dk-btn ghost" id="ai-memory-back">← Volver</button>
        <button type="button" class="dk-btn ghost" id="ai-memory-find-duplicates">🧹 Buscar duplicados</button>
      </div>
      ${conflictBanner}
      ${duplicateGroupsHtml}
      <form id="ai-memory-form" class="ai-settings-form" style="margin-top:10px">
        <label>Categoría
          <select name="category">
            <option value="usuario">👤 Usuario</option>
            <option value="proyectos">📁 Proyectos</option>
            <option value="rutinas">🔁 Rutinas</option>
            <option value="eventos">📌 Eventos</option>
            <option value="tecnico">💻 Técnico</option>
            <option value="configuracion">🔧 Configuración</option>
          </select>
        </label>
        <label>Dato a recordar
          <input type="text" name="text" placeholder="p.ej. mi restaurante favorito es..." required />
        </label>
        <label>Privacidad
          <select name="privacyLevel">
            <option value="private" selected>🔒 Privada (normal)</option>
            <option value="public">🌐 Pública</option>
            <option value="sensitive">⚠️ Sensible (solo si se pregunta)</option>
            <option value="restricted">⛔ Restringida (nunca a la IA)</option>
          </select>
        </label>
        <button type="submit" class="dk-btn">Guardar</button>
      </form>
      <label style="display:block;margin-top:12px">🔍 Buscar (por significado, no solo texto exacto)
        <input type="search" id="ai-memory-search" placeholder="p.ej. en qué tecnología está hecho el servidor" value="${escHtml(aiMemoryQuery)}" />
      </label>
      <div style="margin-top:10px">${rows}</div>`;
    document.getElementById("ai-memory-back")?.addEventListener("click", () => {
      aiMemoryQuery = "";
      aiMemoryConflict = null;
      aiMemoryDuplicateGroups = null;
      state.aiView = "settings";
      renderAiPanel();
    });
    document.getElementById("ai-memory-find-duplicates")?.addEventListener("click", async () => {
      try {
        const res = await api("/api/ai/memory/duplicates");
        aiMemoryDuplicateGroups = res.groups || [];
        renderAiMemoryView();
      } catch (err) {
        toast(err.message || "No se pudo buscar duplicados");
      }
    });
    document.getElementById("ai-memory-duplicates-dismiss")?.addEventListener("click", () => {
      aiMemoryDuplicateGroups = null;
      renderAiMemoryView();
    });
    document.getElementById("ai-memory-conflict-dismiss")?.addEventListener("click", () => {
      aiMemoryConflict = null;
      renderAiMemoryView();
    });
    document.getElementById("ai-memory-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const savedText = fd.get("text");
        const result = await api("/api/ai/memory", { method: "POST", body: JSON.stringify({ category: fd.get("category"), text: savedText, privacyLevel: fd.get("privacyLevel") }) });
        // 7.1.4 (KAN-140) - aiMemoryService.save() ya devuelve `conflicts`
        // cuando el texto nuevo choca con algo existente de la misma
        // categoria (6.7.13) - antes se ignoraba aqui por completo.
        // 7.1.3 (KAN-139) - result.duplicates (aiMemoryService.save(), junto
        // a conflicts ya existente) - mismo banner, aviso distinto.
        const hasConflicts = result && result.conflicts && result.conflicts.length;
        const hasDuplicates = result && result.duplicates && result.duplicates.length;
        aiMemoryConflict =
          hasConflicts || hasDuplicates
            ? { newText: savedText, items: result.conflicts || [], duplicateItems: result.duplicates || [] }
            : null;
        renderAiMemoryView();
      } catch (err) {
        toast(err.message || "No se pudo guardar");
      }
    });
    const searchInput = document.getElementById("ai-memory-search");
    if (searchInput) {
      // 6.7.7 - debounce a 400ms (esperar a que el embedding local termine
      // de calcularse cada vez seria demasiado lento tecla a tecla).
      searchInput.addEventListener("input", () => {
        clearTimeout(aiMemorySearchTimer);
        const value = searchInput.value;
        aiMemorySearchTimer = setTimeout(() => {
          aiMemoryQuery = value;
          renderAiMemoryView();
        }, 400);
      });
      if (hasQuery) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    }
    els.aiBody.querySelectorAll("[data-memory-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await api(`/api/ai/memory/${encodeURIComponent(btn.getAttribute("data-memory-delete"))}`, { method: "DELETE" });
          // 7.1.4 (KAN-140) - borrar (desde el banner o desde una fila
          // normal) da por resuelto cualquier aviso de conflicto pendiente.
          aiMemoryConflict = null;
          // 7.1.3 (KAN-139) - un grupo de duplicados listado puede haber
          // quedado obsoleto tras este borrado (ids que ya no existen) -
          // se descarta en vez de arriesgarse a mostrar un id borrado.
          aiMemoryDuplicateGroups = null;
          renderAiMemoryView();
        } catch (err) {
          toast(err.message || "No se pudo borrar");
        }
      });
    });
    // 6.7.11/6.7.15 - Confidence + Privacy Levels: cambio inmediato al
    // elegir en el select, sin necesidad de un boton "Guardar" aparte -
    // mismo criterio tactil que el resto de selects de la app.
    els.aiBody.querySelectorAll("[data-memory-confidence]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        try {
          await api(`/api/ai/memory/${encodeURIComponent(sel.getAttribute("data-memory-confidence"))}`, { method: "PUT", body: JSON.stringify({ confidence: sel.value }) });
          toast("Confianza actualizada");
        } catch (err) {
          toast(err.message || "No se pudo actualizar");
        }
      });
    });
    els.aiBody.querySelectorAll("[data-memory-privacy]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        try {
          await api(`/api/ai/memory/${encodeURIComponent(sel.getAttribute("data-memory-privacy"))}`, { method: "PUT", body: JSON.stringify({ privacyLevel: sel.value }) });
          toast("Privacidad actualizada");
        } catch (err) {
          toast(err.message || "No se pudo actualizar");
        }
      });
    });
    // 6.7.17 - Memory Explorer: Edit (la unica accion que faltaba, Delete
    // ya existia). Update ya existe en el backend desde 6.7.3.
    els.aiBody.querySelectorAll("[data-memory-edit]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-memory-edit");
        const current = btn.getAttribute("data-memory-text") || "";
        const next = window.prompt("Editar recuerdo:", current);
        if (next == null || next.trim() === "" || next === current) return;
        try {
          await api(`/api/ai/memory/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ text: next }) });
          renderAiMemoryView();
        } catch (err) {
          toast(err.message || "No se pudo editar");
        }
      });
    });
  }

  // 6.4.6 - Tareas/recordatorios personales: pantalla de gestion (ademas de
  // las tools createTask/listPersonalTasks/completeTask/deleteTask).
  async function renderAiTasksView() {
    els.aiBody.innerHTML = `<p class="tagline">Cargando...</p>`;
    let tasks = [];
    let summary = null;
    try {
      const res = await api("/api/ai/tasks");
      tasks = res.tasks || [];
      summary = res.summary;
    } catch (err) {
      els.aiBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
      return;
    }
    const summaryHtml = summary
      ? `<p class="tagline">🟡 ${summary.pendientes} pendiente(s) · 🔴 ${summary.urgentes} urgente(s) · ⏰ ${summary.programadas} programada(s) · 🟢 ${summary.completadas} completada(s)</p>`
      : "";
    const rows = tasks.length
      ? tasks
          .map((t) => {
            const dueHtml = t.dueAt ? ` · ⏰ ${escHtml(fmtEventTime(t.dueAt))}` : "";
            const urgentHtml = t.urgent ? " 🔴" : "";
            const recurringHtml = t.recurring ? ` · 🔁 ${escHtml(t.recurring)}` : "";
            const doneCls = t.status === "done" ? "style=\"opacity:.55\"" : "";
            return `<div class="sys-list-row" ${doneCls}>
              <span>${t.status === "done" ? "✅" : "⬜"} ${escHtml(t.text)}${urgentHtml}${dueHtml}${recurringHtml}</span>
              <span>
                <button type="button" class="activity-more" data-task-toggle="${escHtml(t.id)}" data-task-done="${t.status === "done" ? "1" : "0"}">${t.status === "done" ? "Reabrir" : "Completar"}</button>
                <button type="button" class="activity-more" data-task-delete="${escHtml(t.id)}">Borrar</button>
              </span>
            </div>`;
          })
          .join("")
      : `<p class="tagline">Sin tareas. Pídeselo a BMO por chat ("recuérdame...") o añádelo aquí.</p>`;
    els.aiBody.innerHTML = `
      <div class="docker-actions">
        <button type="button" class="dk-btn ghost" id="ai-tasks-back">← Volver</button>
      </div>
      ${summaryHtml}
      <form id="ai-task-form" class="ai-settings-form" style="margin-top:10px">
        <label>Nueva tarea
          <input type="text" name="text" placeholder="p.ej. revisar BMO" required />
        </label>
        <label class="ai-settings-check"><input type="checkbox" name="urgent" /> Urgente</label>
        <button type="submit" class="dk-btn">Añadir</button>
      </form>
      <div style="margin-top:10px">${rows}</div>`;
    document.getElementById("ai-tasks-back")?.addEventListener("click", () => {
      state.aiView = "settings";
      renderAiPanel();
    });
    document.getElementById("ai-task-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api("/api/ai/tasks", { method: "POST", body: JSON.stringify({ text: fd.get("text"), urgent: fd.get("urgent") === "on" }) });
        renderAiTasksView();
      } catch (err) {
        toast(err.message || "No se pudo crear la tarea");
      }
    });
    els.aiBody.querySelectorAll("[data-task-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-task-toggle");
        const wasDone = btn.getAttribute("data-task-done") === "1";
        try {
          await api(`/api/ai/tasks/${encodeURIComponent(id)}/${wasDone ? "uncomplete" : "complete"}`, { method: "POST" });
          renderAiTasksView();
        } catch (err) {
          toast(err.message || "Error");
        }
      });
    });
    els.aiBody.querySelectorAll("[data-task-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await api(`/api/ai/tasks/${encodeURIComponent(btn.getAttribute("data-task-delete"))}`, { method: "DELETE" });
          renderAiTasksView();
        } catch (err) {
          toast(err.message || "No se pudo borrar");
        }
      });
    });
  }

  function renderAiPanel() {
    if (!els.aiBody) return;
    if (state.aiView === "history") return renderAiHistoryView();
    if (state.aiView === "audit") return renderAiAuditView();
    if (state.aiView === "memory") return renderAiMemoryView();
    if (state.aiView === "tasks") return renderAiTasksView();
    if (state.aiView === "knowledge") return renderAiKnowledgeView();
    if (state.aiView === "agents") return renderAiAgentsView();
    if (state.aiView === "settings") return renderAiSettingsView();
    if (!state.aiStatus || !state.aiStatus.configured) return renderAiNotConfiguredView();
    return renderAiChatView();
  }

  async function submitAiChat(text) {
    if (state.aiBusy) return;
    state.aiLog.push({ role: "user", text });
    state.aiBusy = true;
    renderAiChatView();
    try {
      const outcome = await api("/api/ai/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      if (outcome.type === "confirmation_required") {
        state.aiLog.push({ pending: true, pendingId: outcome.pendingId, steps: outcome.steps, riskTier: outcome.highestRiskTier });
      } else {
        state.aiLog.push({ role: "assistant", text: outcome.text || "(sin respuesta)", confidence: outcome.confidence, sources: outcome.sources, qualityFlags: outcome.qualityFlags });
      }
    } catch (err) {
      state.aiLog.push({ role: "assistant", text: `⚠️ ${err.message || "Error hablando con la IA"}` });
    } finally {
      state.aiBusy = false;
      renderAiChatView();
    }
  }

  async function confirmAiAction(pendingId, approve) {
    state.aiLog = state.aiLog.filter((e) => !(e.pending && e.pendingId === pendingId));
    state.aiBusy = true;
    renderAiChatView();
    try {
      const outcome = await api("/api/ai/confirm", { method: "POST", body: JSON.stringify({ pendingId, approve }) });
      if (outcome.type === "confirmation_required") {
        state.aiLog.push({ pending: true, pendingId: outcome.pendingId, steps: outcome.steps, riskTier: outcome.highestRiskTier });
      } else {
        state.aiLog.push({ role: "assistant", text: outcome.text || (approve ? "Hecho." : "Cancelado.") });
      }
    } catch (err) {
      state.aiLog.push({ role: "assistant", text: `⚠️ ${err.message || "Error confirmando la acción"}` });
    } finally {
      state.aiBusy = false;
      renderAiChatView();
    }
  }

  async function openAiPanel(view) {
    if (!els.aiPanel || !els.aiBody) {
      toast("BMO AI no disponible — recarga la página");
      return;
    }
    closeSysHub();
    els.aiPanel.hidden = false;
    state.aiView = view || "chat";
    els.aiBody.innerHTML = `<p class="tagline">Cargando...</p>`;
    try {
      state.aiStatus = await api("/api/ai/status");
    } catch {
      state.aiStatus = { configured: false };
    }
    try {
      const prefs = await api("/api/ai/preferences");
      state.aiPreferences = prefs.preferences;
      state.aiPreferencesKnown = prefs.known;
      // 7.1.10 (KAN-146) - sugerencias reales de uso, nunca aplicadas solas.
      state.aiPreferenceSuggestions = prefs.suggestions || [];
    } catch {
      state.aiPreferences = null;
      state.aiPreferencesKnown = null;
      state.aiPreferenceSuggestions = [];
    }
    renderAiPanel();
  }

  els.aiBack?.addEventListener("click", () => {
    closeAiPanel();
    openSysHub();
  });
  els.aiSettingsBtn?.addEventListener("click", () => {
    state.aiView = state.aiView === "settings" ? "chat" : "settings";
    renderAiPanel();
  });
  els.aiPanel?.addEventListener("click", (e) => {
    if (e.target === els.aiPanel) {
      closeAiPanel();
      openSysHub();
    }
  });

  // —— 4.13.1/4.13.6/4.13.12/4.13.15 Centro de Integraciones ——
  // Reutiliza GET /api/system/state (el mismo endpoint que ya usaba
  // "Estado BMO" desde 4.10.2) en vez de crear un backend nuevo en
  // paralelo - solo le anadio "prometheus" al controller, que faltaba.
  // Cada fila conectada es un Deep Link (4.13.6) al panel real que ya
  // existe para ese servicio, en vez de duplicar su UI aqui.
  els.integrationsPanel = document.getElementById("integrations-panel");
  els.integrationsBody = document.getElementById("integrations-body");
  els.integrationsBack = document.getElementById("integrations-back");

  let sysStateCache = {};
  const INTEGRATIONS_META = [
    { key: "bmo", label: "BMO Core", icon: "⬡", open: () => openEstadoPanel().catch(() => {}) },
    { key: "mipc", label: "MI-PC", icon: "🖥️", open: () => { setAppNav("dispositivos", { keepPanels: true }); openDevicesPanel("hub").catch(() => {}); } },
    { key: "docker", label: "Docker", icon: "🐳", open: () => openDockerPanel().catch(() => {}) },
    { key: "spotify", label: "Spotify", icon: "🎵", open: () => openSpotifyPanel().catch(() => {}) },
    { key: "steam", label: "Steam", icon: "🎮", open: () => openSteamPanel().catch(() => {}) },
    { key: "grafana", label: "Grafana", icon: "📈", open: () => openMonitorPanel().catch(() => {}) },
    { key: "prometheus", label: "Prometheus", icon: "📊", open: () => openMonitorPanel().catch(() => {}) },
    // 4.13.5/KAN-31 - unica fila sin Deep Link real (es un proyecto externo
    // del usuario, no un subsistema propio de BMO) - abre la URL publica
    // real en una pestaña nueva en vez de un panel interno inexistente.
    { key: "supermarketComparator", label: "SupermarketComparator", icon: "🛒", open: () => window.open("https://supermarket-comparator-api.onrender.com/health", "_blank") },
    // 4.13.4/KAN-30 - Plex instalado en MI-PC 2026-08-25. Sin panel propio
    // en BMO (no es un subsistema suyo) - el Deep Link abre su web real,
    // con la IP que devolvio la comprobacion en vivo (sigue a MI-PC si
    // cambia de IP, no queda fija a la de hoy).
    { key: "plex", label: "Plex", icon: "🎬", open: () => window.open((sysStateCache.plex && sysStateCache.plex.webUrl) || "", "_blank") },
    // 4.13.9/KAN-10 - Home Assistant desplegado 2026-08-25 via el propio
    // sistema de Templates (docker-compose, stack "homeassistant") - mismo
    // contenedor propio de BMO que Grafana/Prometheus, viene ya incluido en
    // sysState (sin llamada de red aparte), Deep Link abre su web local.
    { key: "homeassistant", label: "Home Assistant", icon: "🏠", open: () => window.open(`http://${window.location.hostname}:8123`, "_blank") },
  ];

  // Steam (4.13.3), SupermarketComparator (4.13.5/KAN-31) y Plex
  // (4.13.4/KAN-30) ya se movieron arriba a INTEGRATIONS_META - los tres con
  // comprobacion real, no decorativa.
  const INTEGRATIONS_NOT_CONNECTED = [
    { label: "Home Assistant", icon: "🏠", note: "No configurado" },
    // 5.1.11 - registrado en el Integration Registry del backend
    // (GET /api/integrations) pero sin implementación real todavía.
    { label: "Telegram", icon: "✈️", note: "No configurado" },
  ];

  function integrationsDot(status) {
    if (["online", "healthy", "connected"].includes(status)) return "🟢";
    if (status === "warning") return "🟡";
    if (["offline", "disconnected", "critical"].includes(status)) return "🔴";
    return "⚪";
  }

  function closeIntegrationsPanel() {
    if (els.integrationsPanel) els.integrationsPanel.hidden = true;
  }

  async function openIntegrationsPanel() {
    if (!els.integrationsPanel || !els.integrationsBody) {
      toast("Integraciones no disponible");
      return;
    }
    closeSysHub();
    els.integrationsPanel.hidden = false;
    els.integrationsBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    let sysState = {};
    try {
      sysState = await api("/api/system/state");
    } catch {
      sysState = {};
    }
    // 4.13.5/KAN-31 - SupermarketComparator es una comprobacion HTTPS real
    // (proyecto externo en Render, cold start hasta 30-60s) - separada de
    // /api/system/state (todo lo demas ahi es local/sincrono) para no
    // bloquear el resto del panel si Render esta dormido. Fallo silencioso
    // (sysState.supermarketComparator queda undefined -> "desconocido").
    try {
      sysState.supermarketComparator = await api("/api/system/supermarket-comparator-status");
    } catch {
      /* opcional */
    }
    // 4.13.4/KAN-30 - Plex: comprobacion LAN real, sin cold-start (a
    // diferencia de SupermarketComparator en Render) pero igualmente
    // separada de /api/system/state por el mismo motivo (llamada de red).
    try {
      sysState.plex = await api("/api/system/plex-status");
    } catch {
      /* opcional */
    }
    sysStateCache = sysState;

    // 2026-08-25 (6.6.9) - config real del cliente HA (URL + token), para
    // que BMO pueda controlar entidades de verdad, no solo ver que el
    // contenedor esta arriba.
    let haStatus = { baseUrl: "http://127.0.0.1:8123", enabled: true, configured: false };
    try {
      haStatus = await api("/api/homeassistant/settings");
    } catch {
      /* opcional */
    }

    const connectedHtml = INTEGRATIONS_META.map((m) => {
      const s = sysState[m.key] || {};
      const dot = integrationsDot(s.status === "unknown" ? "warning" : s.status);
      let detail = s.status || "desconocido";
      if (m.key === "docker") detail = `${s.running || 0}/${s.total || 0} activos`;
      else if (m.key === "supermarketComparator") {
        detail = s.status === "online" ? `en línea · ${s.latencyMs || "?"}ms` : s.status === "unknown" ? "despertando (Render)…" : s.status || "desconocido";
      } else if (m.key === "plex") {
        detail = s.status === "online" ? `en línea · v${s.version || "?"}` : s.status || "desconocido";
      }
      return `<button type="button" class="integration-row" data-integration="${m.key}">
        <span class="integration-ico">${m.icon}</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(m.label)}</span>
          <span class="integration-detail">${dot} ${escHtml(String(detail))}</span>
        </span>
        <span class="chev">›</span>
      </button>`;
    }).join("");

    const notConnectedHtml = INTEGRATIONS_NOT_CONNECTED.map(
      (n) => `<div class="integration-row integration-row--stub">
        <span class="integration-ico">${n.icon}</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(n.label)}</span>
          <span class="integration-detail">⚪ ${escHtml(n.note)}</span>
        </span>
      </div>`
    ).join("");

    els.integrationsBody.innerHTML = `
      <h3 style="margin:0 0 4px;font-size:14px">Conectadas</h3>
      <div class="integrations-list">${connectedHtml}</div>
      <h3 style="margin:14px 0 4px;font-size:14px">No conectadas</h3>
      <div class="integrations-list">${notConnectedHtml}</div>
      <div class="perf-block" style="margin-top:14px">
        <h3 style="margin:0 0 4px;font-size:14px">🏠 Home Assistant — control real</h3>
        <p class="tagline">${haStatus.configured ? "Token configurado." : "Sin token todavía - BMO ve el contenedor arriba pero no puede controlar entidades reales hasta que le des un token."} Genéralo en HA: perfil (abajo del todo, icono de tu usuario) → Tokens de acceso de larga duración → Crear token.</p>
        <form id="ha-settings-form" class="ai-settings-form">
          <label>URL base<input type="text" name="baseUrl" value="${escHtml(haStatus.baseUrl || "")}" placeholder="http://127.0.0.1:8123" /></label>
          <label>Token ${haStatus.configured ? "(ya configurado — deja en blanco para no cambiarlo)" : ""}<input type="password" name="token" autocomplete="off" placeholder="${haStatus.configured ? "••••••••" : "eyJhbGciOi..."}" /></label>
          <button type="submit" class="dk-btn">Guardar</button>
          <button type="button" class="dk-btn ghost" id="ha-test-btn">Probar conexión</button>
        </form>
        <p class="tagline" id="ha-test-result"></p>
      </div>
    `;

    els.integrationsBody.querySelectorAll("[data-integration]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const meta = INTEGRATIONS_META.find((m) => m.key === btn.dataset.integration);
        if (meta && typeof meta.open === "function") {
          closeIntegrationsPanel();
          meta.open();
        }
      });
    });

    document.getElementById("ha-settings-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api("/api/homeassistant/settings", {
          method: "POST",
          body: JSON.stringify({ baseUrl: fd.get("baseUrl") || undefined, token: fd.get("token") || undefined }),
        });
        toast("Ajustes de Home Assistant guardados");
        openIntegrationsPanel();
      } catch (err) {
        toast(err.message || "No se pudo guardar");
      }
    });
    document.getElementById("ha-test-btn")?.addEventListener("click", async () => {
      const out = document.getElementById("ha-test-result");
      if (out) out.textContent = "Probando…";
      try {
        const res = await api("/api/homeassistant/test");
        if (out) {
          out.textContent = res.ok
            ? `✅ Conectado - Home Assistant ${res.version || "?"}${res.locationName ? ` (${res.locationName})` : ""}`
            : `❌ ${res.status === "not_configured" ? "Sin token configurado" : res.detail || "No se pudo conectar"}`;
        }
      } catch (err) {
        if (out) out.textContent = `❌ ${err.message || "Error"}`;
      }
    });
  }

  els.integrationsBack?.addEventListener("click", () => {
    closeIntegrationsPanel();
    openSysHub();
  });
  els.integrationsPanel?.addEventListener("click", (e) => {
    if (e.target === els.integrationsPanel) {
      closeIntegrationsPanel();
      openSysHub();
    }
  });

  // —— 4.13.13 Centro de cuentas ——
  // Distinto de Integraciones: aqui solo van servicios con login/credencial
  // propios (no Docker/Grafana, que no tienen "cuenta"). Spotify reutiliza
  // su panel real (que ya tenia conectar/desconectar via OAuth desde antes
  // de esta sesion) - no se duplica ese flujo aqui.
  els.accountsPanel = document.getElementById("accounts-panel");
  els.accountsBody = document.getElementById("accounts-body");
  els.accountsBack = document.getElementById("accounts-back");

  const ACCOUNTS_META = [
    { key: "spotify", label: "Spotify", icon: "🎵", open: () => openSpotifyPanel().catch(() => {}) },
    { key: "steam", label: "Steam", icon: "🎮", open: () => openSteamPanel().catch(() => {}) },
  ];
  const ACCOUNTS_NOT_CONNECTED = [
    { label: "Plex", icon: "🎬", note: "Pendiente de servidor Plex" },
  ];

  function closeAccountsPanel() {
    if (els.accountsPanel) els.accountsPanel.hidden = true;
  }

  async function openAccountsPanel() {
    if (!els.accountsPanel || !els.accountsBody) {
      toast("Cuentas no disponible");
      return;
    }
    closeSysHub();
    els.accountsPanel.hidden = false;
    els.accountsBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    let sysState = {};
    try {
      sysState = await api("/api/system/state");
    } catch {
      sysState = {};
    }

    const connectedHtml = ACCOUNTS_META.map((m) => {
      const s = sysState[m.key] || {};
      const dot = integrationsDot(s.status);
      const label = s.status === "connected" ? "Conectado" : s.status === "disconnected" ? "No conectado" : "Desconocido";
      return `<button type="button" class="integration-row" data-account="${m.key}">
        <span class="integration-ico">${m.icon}</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(m.label)}</span>
          <span class="integration-detail">${dot} ${escHtml(label)}</span>
        </span>
        <span class="chev">›</span>
      </button>`;
    }).join("");

    const notConnectedHtml = ACCOUNTS_NOT_CONNECTED.map(
      (n) => `<div class="integration-row integration-row--stub">
        <span class="integration-ico">${n.icon}</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(n.label)}</span>
          <span class="integration-detail">⚪ ${escHtml(n.note)}</span>
        </span>
      </div>`
    ).join("");

    els.accountsBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Los secretos de cada cuenta se guardan cifrados (Secret Store) — nunca en el frontend.</p>
      <div class="integrations-list">${connectedHtml}</div>
      <h3 style="margin:14px 0 4px;font-size:14px">No conectadas</h3>
      <div class="integrations-list">${notConnectedHtml}</div>
    `;

    els.accountsBody.querySelectorAll("[data-account]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const meta = ACCOUNTS_META.find((m) => m.key === btn.dataset.account);
        if (meta && typeof meta.open === "function") {
          closeAccountsPanel();
          meta.open();
        }
      });
    });
  }

  els.accountsBack?.addEventListener("click", () => {
    closeAccountsPanel();
    openSysHub();
  });
  els.accountsPanel?.addEventListener("click", (e) => {
    if (e.target === els.accountsPanel) {
      closeAccountsPanel();
      openSysHub();
    }
  });

  // —— 4.13.3 Steam ——
  // Solo API key + SteamID64 (no OAuth como Spotify) - ambos ya guardados
  // (key cifrada en el Secret Store, steamId en config.json). El backend
  // (api/services/steamService.js) llama a la Web API de Steam real.
  els.steamPanel = document.getElementById("steam-panel");
  els.steamBody = document.getElementById("steam-body");
  els.steamBack = document.getElementById("steam-back");

  function closeSteamPanel() {
    if (els.steamPanel) els.steamPanel.hidden = true;
  }

  const STEAM_STATUS_LABEL = {
    online: "🟢 Conectado",
    busy: "🟡 Ocupado",
    away: "🟡 Ausente",
    snooze: "⚪ Inactivo",
    looking_to_trade: "🟢 Buscando intercambio",
    looking_to_play: "🟢 Buscando partida",
    offline: "⚪ Desconectado",
    unknown: "⚪ Desconocido",
  };

  async function openSteamPanel() {
    if (!els.steamPanel || !els.steamBody) {
      toast("Steam no disponible");
      return;
    }
    closeSysHub();
    els.steamPanel.hidden = false;
    els.steamBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    const [profile, gamesData] = await Promise.all([
      api("/api/steam/status").catch(() => ({ configured: false })),
      api("/api/steam/games").catch(() => ({ configured: false, games: [] })),
    ]);

    if (!profile.configured) {
      els.steamBody.innerHTML = `<p class="tagline">Steam no está configurado todavía.</p>`;
      return;
    }

    const statusLine = profile.playing
      ? `🎮 Jugando ahora: ${escHtml(profile.gameName || "")}`
      : STEAM_STATUS_LABEL[profile.status] || STEAM_STATUS_LABEL.unknown;

    const games = (gamesData.games || []).slice(0, 30);
    const gamesHtml = games.map((g) => `
      <div class="integration-row integration-row--stub">
        ${g.iconUrl ? `<img src="${g.iconUrl}" alt="" class="integration-ico" style="border-radius:6px;width:32px;height:32px;object-fit:cover" />` : `<span class="integration-ico">🎮</span>`}
        <span class="integration-info">
          <span class="integration-name">${escHtml(g.name)}</span>
          <span class="integration-detail">${g.playtimeHours}h jugadas${g.playtime2WeeksMinutes ? ` · ${Math.round(g.playtime2WeeksMinutes / 6) / 10}h últimas 2 semanas` : ""}</span>
        </span>
      </div>`).join("") || `<p class="tagline">Sin juegos visibles</p>`;

    els.steamBody.innerHTML = `
      <div class="integration-row integration-row--stub" style="margin-bottom:12px">
        <img src="${profile.avatar}" alt="" class="integration-ico" style="border-radius:50%;width:40px;height:40px;object-fit:cover" />
        <span class="integration-info">
          <span class="integration-name">${escHtml(profile.name)}</span>
          <span class="integration-detail">${statusLine}</span>
        </span>
      </div>
      <h3 style="margin:0 0 4px;font-size:14px">Biblioteca (${gamesData.count || 0} juegos, top 30 por tiempo jugado)</h3>
      <div class="integrations-list">${gamesHtml}</div>
    `;
  }

  els.steamBack?.addEventListener("click", () => {
    closeSteamPanel();
    openSysHub();
  });
  els.steamPanel?.addEventListener("click", (e) => {
    if (e.target === els.steamPanel) {
      closeSteamPanel();
      openSysHub();
    }
  });

  // —— 4.14.6/4.14.17 Recovery Center ——
  // Vista unica que junta lo que 4.14.1-4.14.14 ya construyo en el backend
  // (watchdog continuo, guardian de disco/temperatura, retencion, crash
  // reports, recuperacion automatica reciente) en vez de repartirlo en
  // paneles sueltos - esta ES la "pantalla final de estado" del spec
  // (4.14.17), no una pantalla aparte.
  els.recoveryPanel = document.getElementById("recovery-panel");
  els.recoveryBody = document.getElementById("recovery-body");
  els.recoveryBack = document.getElementById("recovery-back");

  function watchdogDot(status) {
    if (status === "ok") return "🟢";
    if (status === "blocked") return "🟡";
    if (status === "down") return "🔴";
    return "⚪";
  }

  function closeRecoveryPanel() {
    if (els.recoveryPanel) els.recoveryPanel.hidden = true;
  }

  async function openRecoveryPanel() {
    if (!els.recoveryPanel || !els.recoveryBody) {
      toast("Recovery Center no disponible");
      return;
    }
    closeSysHub();
    els.recoveryPanel.hidden = false;
    els.recoveryBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    const [watchdog, crash, retention, guard, events] = await Promise.all([
      api("/api/system/watchdog").catch(() => ({ items: [] })),
      api("/api/system/crash-reports").catch(() => ({ reports: [] })),
      api("/api/system/retention").catch(() => ({ policy: {}, lastRun: null })),
      api("/api/system/thermal-guard").catch(() => ({})),
      api("/api/events?limit=40").catch(() => ({ recent: [] })),
    ]);

    const items = watchdog.items || [];
    const overallOk = items.length > 0 && items.every((i) => i.status === "ok");

    const watchdogHtml = items.map((i) => `
      <div class="integration-row integration-row--stub">
        <span class="integration-ico">${watchdogDot(i.status)}</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(i.label)}</span>
          <span class="integration-detail">${escHtml(i.detail || (i.status === "ok" ? "OK" : i.status))} · ${i.uptimePercent}% uptime</span>
        </span>
      </div>`).join("") || `<p class="tagline">Sin datos todavía</p>`;

    const RECOVERY_EVENT_TYPES = new Set([
      "auto_recovery.success", "auto_recovery.failed", "auto_recovery.escalated",
      "watchdog.subsystem_down", "watchdog.subsystem_recovered",
      "thermal_guard.ai_paused", "thermal_guard.ai_resumed",
      "retention.completed",
    ]);
    const recoveryEvents = (events.recent || []).filter((e) => RECOVERY_EVENT_TYPES.has(e.type)).slice(0, 8);
    const eventsHtml = recoveryEvents.map((e) => `
      <div class="integration-row integration-row--stub">
        <span class="integration-ico">${e.level === "critical" ? "🔴" : e.level === "warning" ? "🟡" : "🟢"}</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(e.title || e.type)}</span>
          <span class="integration-detail">${escHtml(e.message || "")} · ${formatBackupWhen(e.time)}</span>
        </span>
      </div>`).join("") || `<p class="tagline">Sin actividad reciente</p>`;

    const crashHtml = (crash.reports || []).slice(0, 5).map((r) => `
      <div class="integration-row integration-row--stub">
        <span class="integration-ico">💥</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(r.kind)}</span>
          <span class="integration-detail">${escHtml(r.message)} · ${formatBackupWhen(r.time)}</span>
        </span>
      </div>`).join("") || `<p class="tagline">Sin fallos registrados</p>`;

    const guardBits = [];
    if (guard.diskGuardActive) guardBits.push("🧹 Limpieza forzada por disco crítico");
    if (guard.tempGuardActive) guardBits.push("🌡️ Temperatura crítica");
    if (guard.aiPausedByThermal) guardBits.push("🤖 IA pausada por temperatura");
    const guardHtml = guardBits.length
      ? guardBits.map((b) => `<p class="tagline">${b}</p>`).join("")
      : `<p class="tagline">Todo normal</p>`;

    const lastRun = retention.lastRun;
    const retentionInfo = lastRun
      ? `Última limpieza: ${formatBackupWhen(lastRun.at)} · ${lastRun.backupsRemoved.length} backups eliminados · ${lastRun.logsRotated.length} logs rotados`
      : "Todavía no se ha ejecutado";

    els.recoveryBody.innerHTML = `
      <h3 style="margin:0 0 4px;font-size:14px">${overallOk ? "🟢 Todo en orden" : "🟡 Revisar subsistemas"}</h3>

      <h3 style="margin:14px 0 4px;font-size:14px">Vigilancia continua</h3>
      <div class="integrations-list">${watchdogHtml}</div>

      <h3 style="margin:14px 0 4px;font-size:14px">Guardián de disco/temperatura</h3>
      ${guardHtml}

      <h3 style="margin:14px 0 4px;font-size:14px">Recuperación automática reciente</h3>
      <div class="integrations-list">${eventsHtml}</div>

      <h3 style="margin:14px 0 4px;font-size:14px">Almacenamiento</h3>
      <p class="tagline">${escHtml(retentionInfo)}</p>
      <button type="button" id="recovery-run-retention" class="plugins-refresh">Limpiar ahora</button>

      <h3 style="margin:14px 0 4px;font-size:14px">Informes de fallo</h3>
      <div class="integrations-list">${crashHtml}</div>
    `;

    document.getElementById("recovery-run-retention")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = "Limpiando…";
      try {
        await api("/api/system/retention/run", { method: "POST", body: "{}" });
        toast("Limpieza completada");
        openRecoveryPanel();
      } catch (err) {
        toast(err.message || "Error");
        btn.disabled = false;
        btn.textContent = "Limpiar ahora";
      }
    });
  }

  els.recoveryBack?.addEventListener("click", () => {
    closeRecoveryPanel();
    openSysHub();
  });
  els.recoveryPanel?.addEventListener("click", (e) => {
    if (e.target === els.recoveryPanel) {
      closeRecoveryPanel();
      openSysHub();
    }
  });

  // 4.17.20 - Security Center: semaforo real por area (sin puntuacion
  // artificial, pedido explicitamente asi) - agrega lo que ya construyo
  // el resto de 4.17 en vez de duplicar logica.
  els.securityCenterPanel = document.getElementById("security-center-panel");
  els.securityCenterBody = document.getElementById("security-center-body");
  els.securityCenterBack = document.getElementById("security-center-back");

  function secDot(status) {
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    if (status === "red") return "🔴";
    return "⚪";
  }

  function closeSecurityCenterPanel() {
    if (els.securityCenterPanel) els.securityCenterPanel.hidden = true;
  }

  async function openSecurityCenterPanel() {
    if (!els.securityCenterPanel || !els.securityCenterBody) {
      toast("Security Center no disponible");
      return;
    }
    closeSysHub();
    els.securityCenterPanel.hidden = false;
    els.securityCenterBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    const overview = await api("/api/system/security-center").catch(() => ({ areas: [] }));
    const areas = overview.areas || [];

    const areasHtml = areas.map((a) => `
      <div class="integration-row integration-row--stub">
        <span class="integration-ico">${secDot(a.status)}</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(a.label)}</span>
          <span class="integration-detail">${escHtml(a.detail || "")}</span>
        </span>
      </div>`).join("") || `<p class="tagline">Sin datos todavía</p>`;

    // 7.6.40 (KAN-322) - consolida en esta MISMA seccion las piezas reales
    // que hasta ahora vivian repartidas en otros paneles del Sistema -
    // agrega, no duplica (cada fila llama a datos ya reales via el
    // endpoint agregador, sin inventar ningun dato nuevo).
    const full = await api("/api/system/security-center-full").catch(() => null);
    const summaryRow = (icon, name, detail) => `
      <div class="integration-row integration-row--stub">
        <span class="integration-ico">${icon}</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(name)}</span>
          <span class="integration-detail">${escHtml(detail)}</span>
        </span>
      </div>`;
    const summaryHtml = full ? [
      summaryRow("🪪", "Identidades", `${(full.identities || []).length} identidad(es) real(es)`),
      summaryRow("🔑", "Sesiones activas", `${(full.sessions || []).length} sesión(es)`),
      summaryRow("🗝️", "Secretos", `${(full.secrets || []).filter((s) => s.configured).length}/${(full.secrets || []).length} configurados`),
      summaryRow("🤖", "Agentes de IA", `${(full.agents || []).filter((a) => a.enabled).length}/${(full.agents || []).length} activos`),
      summaryRow("🌐", "Red", full.network ? (full.network.online ? "con salida a Internet" : "sin salida a Internet") : "sin datos"),
      summaryRow("🚨", "Amenazas/Avisos (24h)", full.threats ? `${full.threats.threats} amenaza(s) · ${full.threats.warnings} aviso(s) · ${full.threats.failedLogins} login(s) fallido(s)` : "sin datos"),
      summaryRow("🔒", "Cuarentena activa", `${(full.quarantine || []).length} elemento(s)`),
      summaryRow("💾", "Backups Docker", `${full.backups ? full.backups.count : 0} disponible(s)`),
      summaryRow("♻️", "Recuperaciones recientes", `${(full.recovery || []).length} evento(s)`),
    ].join("") : `<p class="tagline">Resumen consolidado no disponible</p>`;

    els.securityCenterBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Estado real por área — sin puntuación artificial.</p>
      <div class="integrations-list">${areasHtml}</div>
      <p class="tagline" style="margin:16px 0 10px">Resumen consolidado — Identidades/Sesiones/Permisos/Secretos/Dispositivos/Red/Agentes/Auditoría/Amenazas/Cuarentena/Backups/Recuperación en un solo sitio.</p>
      <div class="integrations-list">${summaryHtml}</div>
    `;
  }

  // 7.8.2 (KAN-335) - Pokédex real: agrega GET /api/pokemon/dex (SEEN/CAUGHT
  // por especie, "???" para lo no descubierto) + GET /api/pokemon/trainer
  // (resumen real) - mismo patron perf-sheet/perf-body que el resto de
  // sub-paneles de Sistema, sin CSS nuevo (reusa integration-row).
  els.pokedexPanel = document.getElementById("pokedex-panel");
  els.pokedexBody = document.getElementById("pokedex-body");
  els.pokedexBack = document.getElementById("pokedex-back");

  function closePokedexPanel() {
    if (els.pokedexPanel) els.pokedexPanel.hidden = true;
  }

  // 2026-08-31 - especie != individuo (propuesta del usuario): un Pokémon
  // capturado (dex.caught) es clicable y lleva a su COLECCIÓN real
  // (todos los ejemplares distintos que tienes de esa especie, cada uno
  // con su propia naturaleza/IVs/nivel/shiny/zona), no solo un check.
  async function renderPokedexList() {
    els.pokedexBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [dexData, overview, ballsData, goal] = await Promise.all([
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
      api("/api/pokemon/trainer").catch(() => null),
      api("/api/pokemon/balls").catch(() => ({ balls: [] })),
      api("/api/pokemon/dex/goal").catch(() => null),
    ]);
    const entries = dexData.entries || [];
    const seenCount = entries.filter((e) => e.seen).length;
    const caughtCount = entries.filter((e) => e.caught).length;

    // 7.8.11 (KAN-344) - inventario real de bolas, visible también fuera
    // de un encuentro (no solo en el momento de lanzarlas).
    const ballsRow = (ballsData.balls || [])
      .map((b) => `${b.emoji} ${b.unlimited ? "∞" : b.owned}`)
      .join("  ·  ");

    const summaryHtml = overview
      ? `<div class="perf-grid" style="margin-bottom:14px">
          <div class="perf-metric"><div class="label">🎒 Pokémon</div><div style="font-weight:700">${overview.pokemonOwned}</div></div>
          <div class="perf-metric"><div class="label">🐾 Equipo</div><div style="font-weight:700">${overview.teamSize}/${overview.teamMax}</div></div>
          <div class="perf-metric"><div class="label">📦 Cajas</div><div style="font-weight:700">${overview.boxCount}</div></div>
          <div class="perf-metric"><div class="label">🎾 Bolas</div><div style="font-weight:700;font-size:12px">${ballsRow || "—"}</div></div>
        </div>`
      : "";

    // 7.8.37 (KAN-370) - Objetivo real de Pokédex: implementado real
    // (`dexTotal()`) frente al total REAL de las 9 generaciones
    // oficiales (1025 especies) - crece de verdad solo cuando se
    // importa contenido real de una generación nueva (7.8.35/7.8.36).
    const goalHtml = goal
      ? `<div class="poke-hero" style="padding:12px 16px;margin-bottom:14px">
          <div class="poke-hero-avatar" style="font-size:22px">🎯</div>
          <div class="poke-hero-info">
            <div class="poke-hero-name poke-title" style="font-size:0.95rem">Objetivo de Pokédex</div>
            <div class="poke-hero-rank poke-num">${goal.implemented}/${goal.totalReal} implementados (${goal.percent}%)</div>
            <div class="poke-bar-track"><div class="poke-bar-fill xp" style="width:${goal.percent}%"></div></div>
            <div style="display:flex;gap:6px;overflow-x:auto;margin-top:8px;padding-bottom:2px">
              ${goal.byGeneration
                .map(
                  (g) =>
                    `<span class="poke-num" style="flex-shrink:0;font-size:11px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,0.06)">${g.complete ? "✅" : "⬜"} Gen ${g.generation} ${escHtml(g.name)} ${g.implemented}/${g.totalReal}</span>`
                )
                .join("")}
            </div>
          </div>
        </div>`
      : "";

    // 7.8.30 (KAN-363) - rareza real visible en la lista, mismo patrón
    // que tipos: solo se muestra si ya conoces la especie.
    const RARITY_LABELS = {
      common: "⚪ Común", uncommon: "🟢 Poco común", rare: "🔵 Raro",
      "very-rare": "🟣 Muy raro", legendary: "🟡 Legendario", mythical: "🌟 Mítico",
    };
    const rowsHtml = entries
      .map((e) => {
        const dexNum = String(e.dexNumber).padStart(3, "0");
        const status = e.caught ? `CAUGHT ✅${e.owned > 1 ? ` ×${e.owned}` : ""}` : e.seen ? "SEEN ✅" : "Sin descubrir";
        const rarityLabel = e.rarity && RARITY_LABELS[e.rarity] ? " · " + RARITY_LABELS[e.rarity] : "";
        const detail = `${status}${e.types && e.types.length ? " · " + e.types.map(escHtml).join("/") : ""}${rarityLabel}`;
        if (!e.caught) {
          return `<div class="poke-list-card${e.seen ? "" : " locked"}">
            <div class="poke-list-card-avatar">${spriteImg(e.sprites, "front", e.emoji, 48)}</div>
            <div class="poke-list-card-body">
              <div class="poke-list-card-title">#${dexNum} ${escHtml(e.name)}</div>
              <div class="poke-list-card-sub">${detail}</div>
            </div>
          </div>`;
        }
        return `<button type="button" class="poke-list-card" data-dex-species="${e.dexNumber}">
          <div class="poke-list-card-avatar">${spriteImg(e.sprites, "front", e.emoji, 48)}</div>
          <div class="poke-list-card-body">
            <div class="poke-list-card-title">#${dexNum} ${escHtml(e.name)}</div>
            <div class="poke-list-card-sub">${detail} · ver colección ›</div>
          </div>
        </button>`;
      })
      .join("");

    els.pokedexBody.innerHTML = `
      ${goalHtml}
      ${summaryHtml}
      <p class="tagline" style="margin:0 0 10px">${caughtCount}/${entries.length} capturados · ${seenCount}/${entries.length} vistos</p>
      <div>${rowsHtml || `<p class="tagline">Todavía no has visto ningún Pokémon.</p>`}</div>
    `;
    els.pokedexBody.querySelectorAll("[data-dex-species]").forEach((btn) => {
      btn.addEventListener("click", () => {
        renderSpeciesCollection(btn.getAttribute("data-dex-species")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function renderSpeciesCollection(dexNumber) {
    els.pokedexBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const data = await api(`/api/pokemon/collection/${dexNumber}`);
    const rowsHtml = data.individuals
      .map((ind, i) => {
        const ivs = ind.ivs || {};
        const ivSum = (ivs.hp || 0) + (ivs.attack || 0) + (ivs.defense || 0) + (ivs.spAttack || 0) + (ivs.spDefense || 0) + (ivs.speed || 0);
        const ivPct = Math.round((ivSum / (31 * 6)) * 100);
        const label = `${escHtml(data.species.name)} #${String(i + 1).padStart(3, "0")}`;
        const spriteVariant = ind.shiny ? "frontShiny" : "front";
        return `<div class="poke-list-card">
          <div class="poke-list-card-avatar">${spriteImg(data.species.sprites, spriteVariant, ind.shiny ? "✨" : data.species.emoji, 48)}</div>
          <div class="poke-list-card-body">
            <div class="poke-list-card-title">${label}${ind.shiny ? " · SHINY" : ""}</div>
            <div class="poke-list-card-sub">Nv.${ind.level} · ${escHtml(ind.nature)} · IV ${ivPct}%${ind.caughtZone ? " · " + escHtml(ind.caughtZone) : ""}</div>
          </div>
        </div>`;
      })
      .join("");
    els.pokedexBody.innerHTML = `
      <button type="button" class="dk-btn ghost" data-collection-back style="margin-bottom:12px">← Volver a la Pokédex</button>
      <div class="poke-result-card" style="padding:16px">
        ${spriteImg(data.species.sprites, "artwork", data.species.emoji, 140)}
        <p class="tagline" style="margin:8px 0 0;font-size:16px;color:#e8f4ff">${escHtml(data.species.name)} ${cryButton(data.species.cries)}</p>
        <p class="tagline" style="margin:2px 0 0">${data.count} ejemplar(es) en tu colección</p>
      </div>
      <div>${rowsHtml || `<p class="tagline">Sin ejemplares.</p>`}</div>
    `;
    // 7.8.33 (KAN-366) - grito real automático al abrir la ficha, igual
    // que la Pokédex real.
    playCry(data.species.cries);
    els.pokedexBody.querySelector("[data-collection-back]")?.addEventListener("click", () => {
      renderPokedexList().catch((err) => toast(err.message || "Error"));
    });
  }

  async function openPokedexPanel() {
    if (!els.pokedexPanel || !els.pokedexBody) {
      toast("Pokédex no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokedexPanel.hidden = false;
    await renderPokedexList();
  }

  els.pokedexBack?.addEventListener("click", () => {
    closePokedexPanel();
    setAppNav("servicios");
  });
  els.pokedexPanel?.addEventListener("click", (e) => {
    if (e.target === els.pokedexPanel) {
      closePokedexPanel();
      setAppNav("servicios");
    }
  });

  // 7.8.3 (KAN-336) - Explorar: zona real -> encuentro real -> captura
  // real, reusando /api/pokemon/zones + encounter + capture ya construidos
  // (KAN-333). Re-renderiza el mismo perf-body en 3 pasos (lista de
  // zonas -> resultado del encuentro -> resultado de la captura), mismo
  // patron de re-render+re-bind que el resto del panel de Dispositivos.
  els.pokemonExplorePanel = document.getElementById("pokemon-explore-panel");
  els.pokemonExploreBody = document.getElementById("pokemon-explore-body");
  els.pokemonExploreBack = document.getElementById("pokemon-explore-back");

  function closePokemonExplorePanel() {
    if (els.pokemonExplorePanel) els.pokemonExplorePanel.hidden = true;
  }

  // 7.8.27 (KAN-360) - mapa real de zonas conectadas: posiciones fijas
  // en octágono (mismo orden real que el anillo de progreso real -
  // forest→meadow→cave→beach→lake→mountain→city→volcano→forest) sobre
  // un SVG, con líneas reales entre zonas conectadas (`connectsTo`,
  // dato real del contenido) y color real según si está desbloqueada.
  const WORLD_MAP_POS = {
    forest: [150, 40], meadow: [228, 72], cave: [260, 150], beach: [228, 228],
    lake: [150, 260], mountain: [72, 228], city: [40, 150], volcano: [72, 72],
  };
  let exploreView = "map";

  // 7.8.40 (KAN-373) - a qué panel real volver al terminar un combate
  // (Continuar/Huir) - Explorar si el combate salió de ahí (salvaje o
  // entrenador itinerante), Medallero si salió de un reto de gimnasio -
  // se fija justo antes de entrar en cada tipo real de combate.
  let battleReturnTarget = null;

  // 7.8.42 (KAN-375) - a qué pantalla real volver tras un encuentro
  // (huir/tras capturar/tras luchar): la lista de zonas de siempre, o
  // el mapa 2D real en el punto donde saltó el encuentro si viniste
  // andando por él. Se fija justo antes de abrir cada encuentro real.
  let encounterReturnTarget = null;

  // 7.8.27 REVISIÓN - cuánto falta de verdad para desbloquear una zona
  // (no el umbral total, que confundía "12" con "te faltan 12").
  function zoneRemaining(z) {
    return Math.max(0, (z.unlockDexCaught || 0) - (z.dexCaught || 0));
  }

  function renderWorldMapSvg(zones) {
    const byId = {};
    for (const z of zones) byId[z.id] = z;
    const edges = new Set();
    for (const z of zones) {
      for (const other of z.connectsTo || []) {
        const key = [z.id, other].sort().join("|");
        edges.add(key);
      }
    }
    const lines = Array.from(edges)
      .map((key) => {
        const [a, b] = key.split("|");
        const [x1, y1] = WORLD_MAP_POS[a] || [150, 150];
        const [x2, y2] = WORLD_MAP_POS[b] || [150, 150];
        const bothUnlocked = byId[a] && byId[b] && byId[a].unlocked && byId[b].unlocked;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${bothUnlocked ? "#51cf66" : "#3a3a3a"}" stroke-width="2" />`;
      })
      .join("");
    const nodes = zones
      .map((z) => {
        const pos = WORLD_MAP_POS[z.id] || [150, 150];
        const fill = z.unlocked ? "#1f3d2b" : "#2a2a2a";
        const stroke = z.unlocked ? "#51cf66" : "#555";
        return `<g data-map-zone="${escHtml(z.id)}" style="cursor:pointer">
          <circle cx="${pos[0]}" cy="${pos[1]}" r="26" fill="${fill}" stroke="${stroke}" stroke-width="2" />
          <text x="${pos[0]}" y="${pos[1] + 6}" text-anchor="middle" font-size="22">${z.unlocked ? z.emoji : "🔒"}</text>
        </g>`;
      })
      .join("");
    return `<svg viewBox="0 0 300 300" style="width:100%;max-width:320px;display:block;margin:0 auto">${lines}${nodes}</svg>`;
  }

  async function renderExploreWorldMap() {
    const data = await api("/api/pokemon/zones").catch(() => ({ zones: [] }));
    const zones = data.zones || [];
    const svg = renderWorldMapSvg(zones);
    const legend = zones
      .map((z) => `<span class="integration-detail" style="margin-right:10px">${z.unlocked ? z.emoji : "🔒"} ${escHtml(z.name)}${!z.unlocked ? ` (${zoneRemaining(z)} más)` : ""}</span>`)
      .join("");
    els.pokemonExploreBody.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button type="button" class="dk-btn" data-explore-view="map">🗺️ Mapa</button>
        <button type="button" class="dk-btn ghost" data-explore-view="list">📋 Lista</button>
      </div>
      ${svg}
      <p class="tagline" style="margin:10px 0 0;line-height:1.8">${legend}</p>
    `;
    els.pokemonExploreBody.querySelectorAll("[data-explore-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        exploreView = btn.getAttribute("data-explore-view");
        renderExploreZoneList().catch((err) => toast(err.message || "Error"));
      });
    });
    els.pokemonExploreBody.querySelectorAll("[data-map-zone]").forEach((el) => {
      el.addEventListener("click", () => {
        const zoneId = el.getAttribute("data-map-zone");
        const zone = zones.find((z) => z.id === zoneId);
        if (!zone) return;
        if (!zone.unlocked) {
          toast(`${zone.name} está bloqueada - captura ${zoneRemaining(zone)} especie(s) más en la Pokédex para desbloquearla (${zone.dexCaught}/${zone.unlockDexCaught}).`);
          return;
        }
        // 7.8.42 (KAN-375) - mismo cambio que en la vista Lista: entrar
        // "a pie" desde el mapa del mundo abre ahora el mapa 2D real.
        renderZoneMap(zoneId).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function renderExploreZoneList() {
    if (exploreView === "map") {
      await renderExploreWorldMap();
      return;
    }
    const [data, clock, weather] = await Promise.all([
      api("/api/pokemon/zones").catch(() => ({ zones: [] })),
      api("/api/pokemon/clock").catch(() => null),
      api("/api/pokemon/weather").catch(() => null),
    ]);
    const zones = data.zones || [];
    // 7.8.6 - reloj real de BMO visible: así se ve de verdad por qué
    // ciertos Pokémon (Zubat/Gastly de noche, Clefairy de día) aparecen
    // o no ahora mismo, no es un filtro silencioso.
    const clockHtml = clock
      ? `<p class="tagline" style="margin:0 0 10px">${clock.emoji} ${escHtml(clock.label)} · ${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")} — algunos Pokémon solo aparecen de día o de noche.</p>`
      : "";
    // 7.8.7 - Clima real de BMO (mismo dato que el widget del dashboard,
    // Open-Meteo/Valladolid): visible igual que el reloj, no un filtro
    // escondido - explica por qué ciertos Pokémon (Dratini con tormenta,
    // Jynx con nieve, Magnemite con tormenta) aparecen ahora o no.
    const weatherHtml = weather
      ? `<p class="tagline" style="margin:0 0 10px">${weather.emoji} ${escHtml(weather.label)}${weather.temp != null ? ` · ${weather.temp}°` : ""} en ${escHtml(weather.city || "tu zona")} — favorece a ciertos tipos y desbloquea encuentros exclusivos.</p>`
      : "";
    // 7.8.8 - Métodos de encuentro: zonas de agua (Lake/Beach) tienen
    // tablas alternativas reales (surf/fish) además de caminar - se
    // muestran como botones extra solo si la zona los define de verdad.
    const METHOD_LABELS = { surf: "🏄 Surfear", fish: "🎣 Pescar" };
    els.pokemonExploreBody.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button type="button" class="dk-btn ghost" data-explore-view="map">🗺️ Mapa</button>
        <button type="button" class="dk-btn" data-explore-view="list">📋 Lista</button>
      </div>
      ${clockHtml}
      ${weatherHtml}
      <p class="tagline" style="margin:0 0 10px">Elige una zona para explorar.</p>
      <div class="integrations-list">
        ${zones.map((z) => {
          // 7.8.27 (KAN-360) - zona bloqueada real: no se puede tocar
          // (mismo bloqueo que aplica el servidor en /encounter, aquí
          // solo se refleja para no dejar tocar algo que va a fallar).
          if (!z.unlocked) {
            return `<div class="integration-row integration-row--stub" style="opacity:0.5">
              <span class="integration-ico">🔒</span>
              <span class="integration-info">
                <span class="integration-name">${escHtml(z.name)}</span>
                <span class="integration-detail">Bloqueada · captura ${zoneRemaining(z)} especie(s) más en la Pokédex (${z.dexCaught}/${z.unlockDexCaught})</span>
              </span>
            </div>`;
          }
          const methodButtons = z.methods
            ? Object.keys(z.methods)
                .map((m) => `<button type="button" class="dk-btn ghost" data-explore-zone="${escHtml(z.id)}" data-explore-method="${escHtml(m)}" style="margin-right:6px">${METHOD_LABELS[m] || m}</button>`)
                .join("")
            : "";
          // 7.8.40 (KAN-373) - entrenador itinerante real disponible
          // ahora mismo en esta zona (sin cooldown) - reto real, aparte
          // del encuentro Pokémon normal.
          const trainerButton = z.trainerAvailable
            ? `<button type="button" class="dk-btn ghost" data-explore-trainer="${escHtml(z.id)}" style="margin-right:6px">🥊 Entrenador</button>`
            : "";
          return `<div class="integration-row integration-row--stub" style="flex-wrap:wrap;gap:8px">
            <button type="button" data-explore-zone="${escHtml(z.id)}" data-explore-method="walk" style="display:flex;align-items:center;gap:10px;flex:1;min-width:180px;text-align:left;cursor:pointer;border:none;background:none;padding:0">
              <span class="integration-ico">${z.emoji}</span>
              <span class="integration-info">
                <span class="integration-name">${escHtml(z.name)}</span>
                <span class="integration-detail">Nivel ${z.levelRange[0]}-${z.levelRange[1]} · ${z.encounters.length} especie(s) a pie</span>
              </span>
            </button>
            ${methodButtons || trainerButton ? `<div style="width:100%;padding-left:38px">${methodButtons}${trainerButton}</div>` : ""}
          </div>`;
        }).join("") || `<p class="tagline">Sin zonas configuradas.</p>`}
      </div>
    `;
    els.pokemonExploreBody.querySelectorAll("[data-explore-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        exploreView = btn.getAttribute("data-explore-view");
        renderExploreZoneList().catch((err) => toast(err.message || "Error"));
      });
    });
    els.pokemonExploreBody.querySelectorAll("[data-explore-zone]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const zoneId = btn.getAttribute("data-explore-zone");
        const method = btn.getAttribute("data-explore-method");
        // 7.8.42 (KAN-375) - "a pie" ahora abre el mapa 2D real (te
        // mueves de verdad, el encuentro salta al pisar hierba/agua) en
        // vez de un encuentro instantáneo. Surfear/Pescar (botones
        // aparte) siguen siendo instantáneos, sin tocar - se puede
        // llegar al agua real también caminando dentro del mapa.
        if (method === "walk") {
          renderZoneEntry(zoneId).catch((err) => toast(err.message || "Error"));
        } else {
          startPokemonEncounter(zoneId, method).catch((err) => toast(err.message || "Error"));
        }
      });
    });
    els.pokemonExploreBody.querySelectorAll("[data-explore-trainer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const zoneId = btn.getAttribute("data-explore-trainer");
        battleReturnTarget = renderExploreZoneList;
        renderBattleTeamPicker({ kind: "trainer", opponentId: zoneId }).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  // 7.8.42 (KAN-375) - mapa 2D real: te mueves de verdad por una
  // cuadrícula real de la zona (pokemonMapService, misma cada vez que
  // vuelves), el encuentro real salta al pisar terreno salvaje/agua -
  // reutiliza el mismo /api/pokemon/encounter de siempre por debajo,
  // solo cambia CÓMO se dispara.
  const TILE_EMOJI = { obstacle: "🌲", path: "⬜", wild: "🌿", water: "🌊" };
  let mapRunning = false;

  // 7.8.59 (KAN-392) - punto de entrada real de una zona: lidera con
  // exploración automática (motor real del 7.8.48) en vez de abrir
  // directamente el D-pad manual. El D-pad (renderZoneMap, sin tocar)
  // sigue existiendo como opción secundaria explícita, no como pantalla
  // por defecto.
  async function renderZoneEntry(zoneId) {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const map = await api(`/api/pokemon/explore/map/${encodeURIComponent(zoneId)}`).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!map) {
      renderExploreZoneList().catch((err) => toast(err.message || "Error"));
      return;
    }
    els.pokemonExploreBody.innerHTML = `
      <div class="poke-result-card">
        <div class="poke-result-ico">${escHtml(map.zone.emoji || "🌍")}</div>
        <p class="tagline poke-title">${escHtml(map.zone.name)}</p>
        <p class="poke-num">Explora sola/o o toma tú el control</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
        <button type="button" class="dk-btn" data-zone-entry="quick">🟢 Exploración automática</button>
        <button type="button" class="dk-btn ghost" data-zone-entry="auto">🟡 Auto hasta encuentro</button>
        <button type="button" class="dk-btn ghost" data-zone-entry="manual">🔴 Caminar manualmente</button>
      </div>
      <div style="display:flex;justify-content:center;margin-top:14px">
        <button type="button" class="dk-btn ghost" data-zone-entry="back">◀ Elegir otra zona</button>
      </div>
    `;
    els.pokemonExploreBody.querySelector('[data-zone-entry="quick"]')?.addEventListener("click", () => {
      renderQuickExploreView(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector('[data-zone-entry="auto"]')?.addEventListener("click", () => {
      moveOnZoneMapAuto(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector('[data-zone-entry="manual"]')?.addEventListener("click", () => {
      renderZoneMap(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector('[data-zone-entry="back"]')?.addEventListener("click", () => {
      renderExploreZoneList().catch((err) => toast(err.message || "Error"));
    });
  }

  async function renderZoneMap(zoneId) {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Cargando el mapa…</p>`;
    const map = await api(`/api/pokemon/explore/map/${encodeURIComponent(zoneId)}`).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!map) {
      renderExploreZoneList().catch((err) => toast(err.message || "Error"));
      return;
    }
    const palette = map.palette || {};
    const tileHtml = (type, x, y) => {
      const emoji = type === "obstacle" ? palette.obstacleEmoji || TILE_EMOJI.obstacle
        : type === "water" ? palette.waterEmoji || TILE_EMOJI.water
        : type === "wild" ? palette.wildEmoji || TILE_EMOJI.wild
        : palette.pathEmoji || TILE_EMOJI.path;
      const isPlayer = map.position.x === x && map.position.y === y;
      return `<div class="poke-map-tile ${type}">${escHtml(emoji)}${isPlayer ? `<span class="poke-map-player">🧑</span>` : ""}</div>`;
    };
    const gridHtml = map.tiles.map((row, y) => row.map((type, x) => tileHtml(type, x, y)).join("")).join("");
    els.pokemonExploreBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">${map.zone.emoji} ${escHtml(map.zone.name)} — muévete y pisa hierba/agua para buscar Pokémon.</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px;flex-wrap:wrap">
        <button type="button" class="dk-btn" disabled title="Tú controlas cada paso con el D-pad de abajo">🔴 Manual</button>
        <button type="button" class="dk-btn ghost" data-map-auto>🟡 Auto (hasta encuentro)</button>
        <button type="button" class="dk-btn ghost" data-map-quick>🟢 Rápido (por minutos)</button>
      </div>
      <div class="poke-map-wrap">
        <div class="poke-map-grid" style="grid-template-columns:repeat(${map.width}, 38px)">${gridHtml}</div>
      </div>
      <div class="poke-dpad">
        <button type="button" class="poke-dpad-up" data-map-move="up">⬆️</button>
        <button type="button" class="poke-dpad-left" data-map-move="left">⬅️</button>
        <span class="poke-dpad-center">🚶</span>
        <button type="button" class="poke-dpad-right" data-map-move="right">➡️</button>
        <button type="button" class="poke-dpad-down" data-map-move="down">⬇️</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
        <button type="button" class="dk-btn${mapRunning ? "" : " ghost"}" data-map-run>🏃 Correr ${mapRunning ? "(activo)" : ""}</button>
        <button type="button" class="dk-btn ghost" data-map-rest>💤 Descansar</button>
        <button type="button" class="dk-btn ghost" data-map-exit>🚪 Salir</button>
      </div>
    `;
    els.pokemonExploreBody.querySelectorAll("[data-map-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        moveOnZoneMap(zoneId, btn.getAttribute("data-map-move")).catch((err) => toast(err.message || "Error"));
      });
    });
    els.pokemonExploreBody.querySelector("[data-map-run]")?.addEventListener("click", () => {
      mapRunning = !mapRunning;
      renderZoneMap(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-map-rest]")?.addEventListener("click", async () => {
      const rest = await api("/api/pokemon/explore/rest", { method: "POST", body: JSON.stringify({ zoneId }) }).catch((err) => {
        toast(err.message || "Error");
        return null;
      });
      if (rest) toast(rest.message);
    });
    els.pokemonExploreBody.querySelector("[data-map-exit]")?.addEventListener("click", () => {
      renderZoneEntry(zoneId).catch((err) => toast(err.message || "Error"));
    });
    // 7.8.48 (KAN-381) - niveles 🟡 Supervisado / 🟢 Rápido del motor de
    // exploración automática, el D-pad de arriba (🔴 Manual) no cambia.
    els.pokemonExploreBody.querySelector("[data-map-auto]")?.addEventListener("click", () => {
      moveOnZoneMapAuto(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-map-quick]")?.addEventListener("click", () => {
      renderQuickExploreView(zoneId).catch((err) => toast(err.message || "Error"));
    });
  }

  // 7.8.48 (KAN-381) - 🟡 Supervisado: autopiloto real (mismo motor de
  // movimiento/encuentro que el D-pad, solo que camina sola en el
  // servidor) que se detiene en cuanto pasa algo real y te devuelve el
  // control con la MISMA pantalla de resultado de encuentro de siempre.
  async function moveOnZoneMapAuto(zoneId) {
    toast("Caminando sola/o hasta que pase algo…");
    const result = await api(`/api/pokemon/explore/auto-walk/${encodeURIComponent(zoneId)}`, { method: "POST" }).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!result) {
      await renderZoneEntry(zoneId);
      return;
    }
    if (result.encounter) {
      const ballsData = await api("/api/pokemon/balls").catch(() => ({ balls: [] }));
      encounterReturnTarget = () => renderZoneEntry(zoneId);
      renderPokemonEncounterResult(result.encounter, ballsData.balls || []);
      return;
    }
    const reasonMsg = result.stoppedReason === "stuck" ? "te has quedado atascado" : "sin encontrar nada";
    toast(`Caminaste ${result.stepsWalked} pasos (${reasonMsg}).`);
    await renderZoneEntry(zoneId);
  }

  // 7.8.48 (KAN-381) - 🟢 Rápido: sesión real de minutos de reloj,
  // calculada de forma retroactiva en el backend (nunca un timer aquí
  // en el cliente) - esta vista solo consulta/inicia/detiene la sesión
  // real y muestra su resumen/registro real cuando termina.
  async function renderQuickExploreView(zoneId) {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const status = await api("/api/pokemon/explore/quick/status").catch(() => ({ status: "none" }));
    let bodyHtml = "";
    if (status.status === "running") {
      bodyHtml = `
        <div class="poke-result-card">
          <div class="poke-result-ico">🟢</div>
          <p class="tagline poke-title">Explorando ${escHtml(status.zoneId)}…</p>
          <p class="poke-num">${status.remainingMinutes} min restantes de ${status.durationMinutes}</p>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button type="button" class="dk-btn" data-quick-refresh>🔄 Actualizar</button>
          <button type="button" class="dk-btn ghost" data-quick-stop>⏹️ Detener ahora</button>
        </div>`;
    } else if (status.status === "completed") {
      const s = status.summary || {};
      const logHtml = (s.log || []).map((l) => `<p>${escHtml(l)}</p>`).join("") || `<p>Nada digno de mención.</p>`;
      bodyHtml = `
        <div class="poke-result-card">
          <div class="poke-result-ico">✅</div>
          <p class="tagline poke-title">Sesión terminada en ${escHtml(s.zoneName || status.zoneId)}</p>
          <p class="poke-num">${s.stepsWalked ?? 0} pasos · ${s.sightings ?? 0} avistamientos · ${(s.trainerBattles && s.trainerBattles.won) || 0} combates ganados / ${(s.trainerBattles && s.trainerBattles.lost) || 0} perdidos</p>
        </div>
        <div class="poke-log">${logHtml}</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button type="button" class="dk-btn" data-quick-close>Cerrar</button>
        </div>`;
    } else {
      bodyHtml = `
        <p class="tagline">🟢 Rápido explora sola/o durante los minutos que elijas. Nunca captura Pokémon (solo los avista) y solo combate contra entrenadores itinerantes si tu equipo está sano.</p>
        <div style="display:flex;gap:8px;align-items:center;justify-content:center;margin:10px 0">
          <label class="tagline" for="quick-minutes">Minutos:</label>
          <input id="quick-minutes" type="number" min="1" max="180" value="30" style="width:70px" />
        </div>
        <div style="display:flex;justify-content:center">
          <button type="button" class="dk-btn" data-quick-start>▶️ Empezar</button>
        </div>`;
    }
    els.pokemonExploreBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">🟢 Exploración Rápida</p>
      ${bodyHtml}
      <div style="display:flex;justify-content:center;margin-top:12px">
        <button type="button" class="dk-btn ghost" data-quick-back>◀ Volver</button>
      </div>
    `;
    els.pokemonExploreBody.querySelector("[data-quick-back]")?.addEventListener("click", () => {
      renderZoneEntry(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-quick-refresh]")?.addEventListener("click", () => {
      renderQuickExploreView(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-quick-close]")?.addEventListener("click", async () => {
      await api("/api/pokemon/explore/quick/clear", { method: "POST" }).catch(() => null);
      renderQuickExploreView(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-quick-stop]")?.addEventListener("click", async () => {
      await api("/api/pokemon/explore/quick/stop", { method: "POST" }).catch((err) => toast(err.message || "Error"));
      renderQuickExploreView(zoneId).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-quick-start]")?.addEventListener("click", async () => {
      const minutesInput = els.pokemonExploreBody.querySelector("#quick-minutes");
      const minutes = Number(minutesInput && minutesInput.value) || 30;
      await api(`/api/pokemon/explore/quick/${encodeURIComponent(zoneId)}/start`, { method: "POST", body: JSON.stringify({ durationMinutes: minutes }) }).catch((err) => {
        toast(err.message || "Error");
      });
      renderQuickExploreView(zoneId).catch((err) => toast(err.message || "Error"));
    });
  }

  async function moveOnZoneMap(zoneId, direction) {
    const result = await api("/api/pokemon/explore/move", {
      method: "POST",
      body: JSON.stringify({ zoneId, direction, running: mapRunning }),
    });
    if (result.encounter) {
      const ballsData = await api("/api/pokemon/balls").catch(() => ({ balls: [] }));
      encounterReturnTarget = () => renderZoneMap(zoneId);
      renderPokemonEncounterResult(result.encounter, ballsData.balls || []);
      return;
    }
    if (result.blocked) toast("No puedes pasar por ahí.");
    await renderZoneMap(zoneId);
  }

  async function startPokemonEncounter(zoneId, method) {
    // 7.8.42 (KAN-375) - este flujo instantáneo (Surfear/Pescar) sigue
    // volviendo siempre a la lista de zonas, nunca al mapa 2D - se
    // reinicia por si quedó fijado un mapa de un encuentro anterior.
    encounterReturnTarget = renderExploreZoneList;
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Explorando…</p>`;
    const [enc, ballsData] = await Promise.all([
      api("/api/pokemon/encounter", { method: "POST", body: JSON.stringify({ zoneId, method }) }),
      api("/api/pokemon/balls").catch(() => ({ balls: [] })),
    ]);
    renderPokemonEncounterResult(enc, ballsData.balls || []);
  }

  function renderPokemonEncounterResult(enc, balls) {
    // 7.8.33 (KAN-366) - grito real automático al aparecer el salvaje,
    // igual que en el juego real.
    playCry(enc.wild && enc.wild.cries);
    const wild = enc.wild;
    const legendaryBanner = wild.legendary
      ? `<p class="tagline" style="margin:0 0 10px;color:#f5c542;font-weight:600">🌟 ¡ENCUENTRO LEGENDARIO! 🌟</p>`
      : "";
    const methodLabels = { walk: "🚶 A pie", surf: "🏄 Surfeando", fish: "🎣 Pescando" };
    const methodBanner = enc.method && enc.method !== "walk"
      ? `<p class="tagline" style="margin:0 0 10px">${methodLabels[enc.method] || enc.method}</p>`
      : "";
    // 7.8.7 - el clima real bajo el que ocurrió este encuentro concreto,
    // solo si el backend lo mandó (los legendarios son independientes
    // del clima, igual que ya lo eran de la hora).
    const weatherBanner = enc.weather
      ? `<p class="tagline" style="margin:0 0 10px">${enc.weather.emoji} ${escHtml(enc.weather.label)}</p>`
      : "";
    // 7.8.34/7.8.44 (KAN-367/KAN-377) - evento(s) real(es) activo(s)
    // ahora mismo, si los hay - nunca oculto, mismo espíritu que el
    // aviso de clima/hora.
    const eventsBanner = enc.activeEvents && enc.activeEvents.length
      ? `<p class="tagline" style="margin:0 0 10px;color:#f5c542;font-weight:600">${enc.activeEvents.map((ev) => `${ev.emoji} ${escHtml(ev.name)}`).join(" · ")}</p>`
      : "";
    // 7.8.30 (KAN-363) - solo se destaca lo genuinamente especial: raro
    // y muy raro llevan su propio aviso, común/poco común no interrumpen
    // (y legendario ya tiene el suyo propio dorado, más arriba).
    const RARITY_BANNERS = {
      rare: { text: "🔵 ¡Encuentro raro!", color: "#4dabf7" },
      "very-rare": { text: "🟣 ¡Encuentro MUY raro!", color: "#b197fc" },
    };
    const rarityBanner = !wild.legendary && RARITY_BANNERS[wild.rarity]
      ? `<p class="tagline" style="margin:0 0 10px;color:${RARITY_BANNERS[wild.rarity].color};font-weight:600">${RARITY_BANNERS[wild.rarity].text}</p>`
      : "";
    const wildSpriteVariant = wild.shiny ? "frontShiny" : "front";
    els.pokemonExploreBody.innerHTML = `
      ${legendaryBanner}
      ${methodBanner}
      ${weatherBanner}
      ${eventsBanner}
      ${rarityBanner}
      <div style="text-align:center;margin-bottom:8px">${spriteImg(wild.sprites, wildSpriteVariant, wild.emoji, 120)}</div>
      <div class="integrations-list">
        <div class="integration-row integration-row--stub"${wild.legendary ? ' style="border:1px solid #f5c542"' : ""}>
          <span class="integration-ico">${spriteImg(wild.sprites, wildSpriteVariant, wild.emoji, 32)}</span>
          <span class="integration-info">
            <span class="integration-name">${wild.shiny ? "✨ " : ""}${escHtml(wild.name)} salvaje (Nv. ${wild.level}) ${cryButton(wild.cries)}</span>
            <span class="integration-detail">${wild.types.map(escHtml).join("/")} · ${escHtml(wild.nature)}${wild.shiny ? " · ¡SHINY!" : ""}</span>
          </span>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <button type="button" class="dk-btn" data-explore-fight="${escHtml(wild.instanceId)}">⚔️ Luchar</button>
        ${(balls || [])
          .map((b) => {
            const disabled = !b.unlimited && b.owned <= 0;
            const countLabel = b.unlimited ? "∞" : b.owned;
            return `<button type="button" class="dk-btn${disabled ? " ghost" : ""}" data-explore-capture-ball="${escHtml(b.id)}" data-explore-capture-instance="${escHtml(wild.instanceId)}"${disabled ? " disabled" : ""}>${b.emoji} ${escHtml(b.name)} (${countLabel})</button>`;
          })
          .join("")}
        <button type="button" class="dk-btn ghost" data-explore-run>Huir</button>
      </div>
    `;
    els.pokemonExploreBody.querySelectorAll("[data-explore-capture-ball]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const t = e.currentTarget;
        doPokemonCapture(t.getAttribute("data-explore-capture-instance"), t.getAttribute("data-explore-capture-ball")).catch((err) => toast(err.message || "Error"));
      });
    });
    els.pokemonExploreBody.querySelector("[data-explore-fight]")?.addEventListener("click", () => {
      battleReturnTarget = encounterReturnTarget || renderExploreZoneList;
      renderBattleTeamPicker().catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-explore-run]")?.addEventListener("click", () => {
      (encounterReturnTarget || renderExploreZoneList)().catch((err) => toast(err.message || "Error"));
    });
  }

  // 7.8.12 (KAN-345) - Sistema de combate real: barra de HP real de
  // ambos lados, registro de golpes real, Atacar/Capturar/Cambiar/Huir.
  // Usa el MISMO /api/pokemon/encounter activo que ya usaba la captura
  // directa - luchar y capturar sin luchar siguen conviviendo.
  // 7.8.45 (KAN-378) - reestilizado: barra de HP real con las clases
  // compartidas del 7.8.41 (mismo verde/ámbar/rojo real por umbral, sin
  // duplicar el color a mano en cada sitio que la usa).
  function hpBarHtml(current, max) {
    const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
    const tier = pct > 50 ? "hp-high" : pct > 20 ? "hp-mid" : "hp-low";
    return `<div class="poke-bar-track"><div class="poke-bar-fill ${tier}" style="width:${pct}%"></div></div><span class="integration-detail poke-num">${current}/${max} HP</span>`;
  }

  // 7.8.40 (KAN-373) - mismo selector real de equipo, ahora reutilizado
  // también para retar a un entrenador itinerante o a un líder de
  // gimnasio real - `trainerChallenge` (opcional) es {kind, opponentId}.
  async function renderBattleTeamPicker(trainerChallenge, cancelTarget) {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [teamData, dexData] = await Promise.all([
      api("/api/pokemon/team").catch(() => ({ team: [] })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
    ]);
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const usable = (teamData.team || []).filter((p) => !p.fainted);
    const rows = usable
      .map((p) => {
        const sp = namesByDex[p.dexNumber];
        const label = sp && sp.name !== "???" ? `${spriteImg(sp.sprites, p.shiny ? "frontShiny" : "front", sp.emoji, 20)} ${escHtml(sp.name)}` : `#${String(p.dexNumber).padStart(3, "0")}`;
        return `<button type="button" class="dk-btn ghost" data-battle-pick="${escHtml(p.instanceId)}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${p.shiny ? "✨ " : ""}${label} · Nv.${p.level} · ${p.currentHp}/${p.maxHp ?? p.stats.hp} HP</button>`;
      })
      .join("");
    els.pokemonExploreBody.innerHTML = `
      <button type="button" class="dk-btn ghost" data-battle-cancel style="margin-bottom:12px">← Cancelar</button>
      <p class="tagline" style="margin:0 0 10px">Elige con quién luchar.</p>
      <div class="integrations-list">${rows || `<p class="tagline">No tienes Pokémon disponibles (todos debilitados).</p>`}</div>
    `;
    els.pokemonExploreBody.querySelector("[data-battle-cancel]")?.addEventListener("click", () => {
      (cancelTarget || renderExploreZoneList)().catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelectorAll("[data-battle-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const instanceId = btn.getAttribute("data-battle-pick");
        if (trainerChallenge) {
          startTrainerBattleFlow(trainerChallenge.kind, trainerChallenge.opponentId, instanceId).catch((err) => toast(err.message || "Error"));
        } else {
          startBattleFlow(instanceId).catch((err) => toast(err.message || "Error"));
        }
      });
    });
  }

  // 7.8.45 (KAN-378) - hueco real encontrado en la propia verificación:
  // si el backend rechaza el combate (p.ej. un Pokémon real "Enfermo"
  // de verdad, mecánica del 7.8.24), la pantalla se quedaba colgada en
  // "Empezando el combate…" para siempre (el toast del error se veía y
  // desaparecía, pero no había forma real de volver salvo la barra de
  // navegación) - ahora se captura el error real y se vuelve al
  // selector de equipo con el motivo real visible.
  async function startBattleFlow(teamInstanceId) {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Empezando el combate…</p>`;
    try {
      const state = await api("/api/pokemon/battle/start", { method: "POST", body: JSON.stringify({ teamInstanceId }) });
      renderBattleScreen(state);
    } catch (err) {
      toast(err.message || "Error");
      await renderBattleTeamPicker();
    }
  }

  // 7.8.40 (KAN-373) - inicia un combate real contra un entrenador
  // itinerante o un líder de gimnasio real - mismo motor/pantalla de
  // combate real ya construidos, solo cambia quién es el rival.
  async function startTrainerBattleFlow(kind, opponentId, teamInstanceId) {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Empezando el combate…</p>`;
    try {
      const state = await api("/api/pokemon/battle/trainer-start", { method: "POST", body: JSON.stringify({ kind, opponentId, teamInstanceId }) });
      renderBattleScreen(state);
    } catch (err) {
      toast(err.message || "Error");
      await renderBattleTeamPicker({ kind, opponentId });
    }
  }

  // 7.8.32 (KAN-365) - sprite real oficial por especie (front/back/
  // shiny/artwork, servido como estático desde ui/assets/pokemon-
  // sprites/). Si `sprites` no viene (especie todavía no vista en la
  // Pokédex) o la imagen falla al cargar, cae al emoji de siempre - el
  // emoji nunca desaparece, es el respaldo real, no un roto.
  function spriteImg(sprites, variant, emoji, size) {
    const url = sprites && sprites[variant];
    const fallback = escHtml(emoji || "❓");
    if (!url) return fallback;
    const safeFallback = fallback.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    return `<img src="${escHtml(url)}" alt="" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:pixelated" onerror="this.outerHTML='${safeFallback}'">`;
  }

  // 7.8.33 (KAN-366) - grito real oficial por especie (repositorio
  // público PokeAPI/cries, mismo contexto de uso personal no comercial
  // ya confirmado por el usuario en 7.8.32). Botón real para
  // reproducirlo bajo demanda + reproducción automática una vez en los
  // momentos reales donde el juego original también lo hace (aparece
  // un salvaje, abres la ficha de un Pokémon).
  function cryButton(cries, size) {
    const url = cries && cries.latest;
    if (!url) return "";
    return `<button type="button" class="poke-cry-btn" data-cry-url="${escHtml(url)}" style="font-size:${size || 16}px;background:none;border:none;cursor:pointer;line-height:1;vertical-align:middle" aria-label="Reproducir grito">🔊</button>`;
  }

  function playCry(cries) {
    const url = cries && cries.latest;
    if (!url) return;
    try {
      const audio = new Audio(url);
      audio.play().catch(() => {});
    } catch {
      /* reproducción de audio no disponible - no bloquea nada */
    }
  }

  // Un único listener delegado para cualquier botón de grito ya
  // pintado en la pantalla (mismo patrón que la barra de pestañas del
  // 7.8.41 - no hace falta enganchar cada botón a mano).
  document.body.addEventListener("click", (e) => {
    const cryBtn = e.target.closest("[data-cry-url]");
    if (cryBtn) {
      try {
        new Audio(cryBtn.getAttribute("data-cry-url")).play().catch(() => {});
      } catch {
        /* ignorado */
      }
    }
  });

  // 7.8.15 (KAN-348) - nombre real de la habilidad bajo cada Pokémon
  // (incluye la posibilidad de que le haya tocado la oculta, real pero
  // rara - 1/20, ver pokemonEngineService.js).
  function abilityTagHtml(ability) {
    return ability ? `<span class="integration-detail">Habilidad: ${escHtml(ability.name)}</span>` : "";
  }

  // 7.8.38 (KAN-371) - insignia real de estado alterado (quemadura/
  // veneno/parálisis/sueño/congelación) y flechas reales de stat stage
  // (-6..+6) todavía activas este combate, para que se vea de verdad lo
  // que está afectando al Pokémon ahora mismo.
  const STAT_STAGE_SHORT = { attack: "ATQ", defense: "DEF", spAttack: "ATE", spDefense: "DFE", speed: "VEL" };
  function statusBadgeHtml(status) {
    return status ? `<span class="integration-detail" style="color:#ffa94d">${status.emoji} ${escHtml(status.label)}</span>` : "";
  }
  function stagesHtml(stages) {
    if (!stages) return "";
    const parts = Object.entries(stages)
      .filter(([, v]) => v)
      .map(([k, v]) => `${STAT_STAGE_SHORT[k] || k}${v > 0 ? "+" : ""}${v}`);
    return parts.length ? `<span class="integration-detail">${parts.join(" · ")}</span>` : "";
  }

  function renderBattleScreen(state) {
    const logHtml = state.log
      .slice(-6)
      .map((l) => `<p class="tagline" style="margin:2px 0;font-size:13px">${escHtml(l)}</p>`)
      .join("");
    // 7.8.40 (KAN-373) - rival real: "salvaje" para un encuentro de
    // zona real, o el nombre real del entrenador/líder + progreso real
    // de su equipo (p.ej. "de Brock · Pokémon 1/2") - nunca se puede
    // Capturar el Pokémon de un entrenador real, el botón ni aparece.
    const isTrainerBattle = state.wild.opponentKind && state.wild.opponentKind !== "wild";
    const wildSideLabel = isTrainerBattle
      ? `de ${escHtml(state.wild.opponentName)} · Pokémon ${state.wild.opponentIndex + 1}/${state.wild.opponentTeamSize}`
      : "salvaje";
    const badgeBanner = state.badgeEarned
      ? `<p class="tagline" style="margin:0 0 10px;color:#f5c542;font-weight:600">${state.badgeEarned.emoji} ¡Has ganado la ${escHtml(state.badgeEarned.name)}!</p>`
      : "";
    const trainerDefeatBanner = state.message && !state.badgeEarned
      ? `<p class="tagline" style="margin:0 0 10px;color:#51cf66;font-weight:600">${escHtml(state.message)}</p>`
      : "";
    const outcomeBanner = badgeBanner || trainerDefeatBanner || (state.outcome === "wild_fainted"
      ? `<p class="tagline" style="margin:0 0 10px;color:#51cf66;font-weight:600">¡Has ganado el combate!</p>`
      : state.outcome === "player_fainted"
        ? `<p class="tagline" style="margin:0 0 10px;color:#ff6b6b;font-weight:600">${escHtml(state.player.name)} se ha debilitado.</p>`
        : "");
    els.pokemonExploreBody.innerHTML = `
      <div class="poke-combatant"${state.wild.legendary ? ' style="border-color:#f5c542"' : ""}>
        <div class="poke-combatant-avatar">${spriteImg(state.wild.sprites, "front", state.wild.emoji, 48)}</div>
        <div class="poke-combatant-info">
          <div style="font-weight:700" class="poke-title">${escHtml(state.wild.name)} ${wildSideLabel} <span class="poke-num">(Nv.${state.wild.level})</span> ${cryButton(state.wild.cries)}</div>
          ${hpBarHtml(state.wild.currentHp, state.wild.maxHp)}
          <div>${abilityTagHtml(state.wild.ability)} ${statusBadgeHtml(state.wild.status)} ${stagesHtml(state.wild.stages)}</div>
        </div>
      </div>
      <div class="poke-combatant">
        <div class="poke-combatant-avatar">${spriteImg(state.player.sprites, "back", state.player.emoji, 48)}</div>
        <div class="poke-combatant-info">
          <div style="font-weight:700" class="poke-title">${escHtml(state.player.name)} <span class="poke-num">(Nv.${state.player.level})</span> ${cryButton(state.player.cries)}</div>
          ${hpBarHtml(state.player.currentHp, state.player.maxHp)}
          <div>${abilityTagHtml(state.player.ability)} ${statusBadgeHtml(state.player.status)} ${stagesHtml(state.player.stages)}</div>
        </div>
      </div>
      ${outcomeBanner}
      <div class="poke-log">${logHtml}</div>
      <div class="poke-action-grid">
        ${!state.over ? `<button type="button" class="poke-action attack" data-battle-attack>⚔️ Atacar</button>` : ""}
        ${!state.over ? `<button type="button" class="poke-action item" data-battle-item>🧪 Objeto</button>` : ""}
        ${!state.over && !isTrainerBattle ? `<button type="button" class="poke-action capture" data-battle-capture>🔴 Capturar</button>` : ""}
        ${!state.over || state.outcome === "player_fainted" ? `<button type="button" class="poke-action switch" data-battle-switch>🔄 Cambiar</button>` : ""}
        ${state.outcome === "wild_fainted" ? `<button type="button" class="poke-action continue-battle" data-battle-continue>Continuar</button>` : `<button type="button" class="poke-action flee" data-battle-flee>Huir</button>`}
      </div>
    `;
    els.pokemonExploreBody.querySelector("[data-battle-attack]")?.addEventListener("click", () => {
      renderBattleMovePicker(state).catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-battle-item]")?.addEventListener("click", () => {
      renderBattleItemPicker().catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-battle-capture]")?.addEventListener("click", () => {
      renderBattleCaptureBallPicker().catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-battle-switch]")?.addEventListener("click", () => {
      renderBattleSwitchPicker().catch((err) => toast(err.message || "Error"));
    });
    els.pokemonExploreBody.querySelector("[data-battle-flee]")?.addEventListener("click", () => {
      doBattleFlee().catch((err) => toast(err.message || "Error"));
    });
    // Un salvaje debilitado en combate ya no se puede capturar (igual
    // que en el juego real) - el servidor ya limpió el encuentro al
    // terminar el combate, así que "Continuar" solo vuelve al panel real
    // de origen (Explorar o Medallero) sin llamar de nuevo a
    // /battle/flee (ya no hay nada activo).
    els.pokemonExploreBody.querySelector("[data-battle-continue]")?.addEventListener("click", () => {
      (battleReturnTarget || renderExploreZoneList)().catch((err) => toast(err.message || "Error"));
    });
  }

  // 7.8.14 (KAN-347) - selector real de movimiento: los 4 reales del
  // Pokémon (tipo/potencia/PP restante), deshabilitado si no le queda
  // PP - o Forcejeo si de verdad ya no le queda ninguno (mecánica real
  // de respaldo, siempre disponible).
  const MOVE_TYPE_EMOJI = {
    normal: "⚪", fire: "🔥", water: "💧", electric: "⚡", grass: "🌿", ice: "❄️", fighting: "🥊", poison: "☠️",
    ground: "🌍", flying: "🕊️", psychic: "🔮", bug: "🐛", rock: "🪨", ghost: "👻", dragon: "🐉", steel: "⚙️",
    dark: "🌑", fairy: "✨",
  };
  async function renderBattleMovePicker(state) {
    const moveset = state.player.moveset || [];
    const anyPpLeft = moveset.some((m) => m.ppRemaining > 0);
    // 7.8.38 (KAN-371) - los movimientos de apoyo reales (categoría
    // "status": Gruñido, Danza Espada, Onda Trueno...) no tienen
    // potencia de daño ni siempre precisión numérica (los que se
    // dirigen a uno mismo, accuracy null, siempre aciertan) - se
    // muestran con su propio texto en vez de "Pot.0 · Prec.null%".
    const rows = anyPpLeft
      ? moveset
          .map((m) => {
            const disabled = m.ppRemaining <= 0;
            const isStatus = m.category === "status";
            const statLine = isStatus
              ? `Apoyo${m.accuracy != null ? ` · Prec.${m.accuracy}%` : ""}`
              : `Pot.${m.power} · Prec.${m.accuracy}%`;
            return `<button type="button" class="dk-btn${disabled ? " ghost" : ""}" data-battle-move="${escHtml(m.id)}"${disabled ? " disabled" : ""} style="display:block;width:100%;text-align:left;margin-bottom:6px">${MOVE_TYPE_EMOJI[m.type] || ""} ${escHtml(m.name)} · ${statLine} · PP ${m.ppRemaining}/${m.pp}</button>`;
          })
          .join("")
      : `<button type="button" class="dk-btn" data-battle-move="struggle" style="display:block;width:100%;text-align:left;margin-bottom:6px">💢 Forcejeo (sin PP - daña también a quien lo usa)</button>`;
    els.pokemonExploreBody.innerHTML = `
      <button type="button" class="dk-btn ghost" data-battle-cancel style="margin-bottom:12px">← Cancelar</button>
      <p class="tagline" style="margin:0 0 10px">Elige un movimiento.</p>
      <div class="integrations-list">${rows}</div>
    `;
    els.pokemonExploreBody.querySelector("[data-battle-cancel]")?.addEventListener("click", () => {
      renderBattleScreen(state);
    });
    els.pokemonExploreBody.querySelectorAll("[data-battle-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doBattleAttack(btn.getAttribute("data-battle-move")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function doBattleAttack(moveId) {
    const state = await api("/api/pokemon/battle/attack", { method: "POST", body: JSON.stringify({ moveId }) });
    renderBattleScreen(state);
  }

  // 7.8.38 (KAN-371) - objetos de combate reales (X Attack/X Defense/X
  // Speed/X Special, catálogo del 7.8.10, ahora sí funcionales): solo
  // se listan los que el jugador de verdad tiene, filtrados por
  // categoría "battle" del mismo catálogo real que usa la tienda.
  async function renderBattleItemPicker() {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const data = await api("/api/pokemon/shop").catch(() => ({ catalog: [] }));
    const owned = (data.catalog || []).filter((it) => it.category === "battle" && it.owned > 0);
    const rows = owned
      .map((it) => `<button type="button" class="dk-btn ghost" data-battle-item-use="${escHtml(it.id)}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${it.emoji} ${escHtml(it.name)} (×${it.owned})</button>`)
      .join("");
    els.pokemonExploreBody.innerHTML = `
      <button type="button" class="dk-btn ghost" data-battle-cancel style="margin-bottom:12px">← Cancelar</button>
      <p class="tagline" style="margin:0 0 10px">Elige un objeto (gastas el turno).</p>
      <div class="integrations-list">${rows || `<p class="tagline">No tienes objetos de combate.</p>`}</div>
    `;
    els.pokemonExploreBody.querySelector("[data-battle-cancel]")?.addEventListener("click", async () => {
      const state = await api("/api/pokemon/battle").then((d) => d.active).catch(() => null);
      if (state) renderBattleScreen(state);
    });
    els.pokemonExploreBody.querySelectorAll("[data-battle-item-use]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const state = await api("/api/pokemon/battle/item", { method: "POST", body: JSON.stringify({ itemId: btn.getAttribute("data-battle-item-use") }) }).catch((err) => {
          toast(err.message || "Error");
          return null;
        });
        if (state) renderBattleScreen(state);
      });
    });
  }

  // Capturar a media pelea reusa exactamente el mismo flujo real de
  // captura (mismo endpoint, misma animación de sacudidas) - la única
  // diferencia es que ahora el HP real ya debilitado por el combate
  // decide la probabilidad, no la aproximación del 7.8.9.
  async function renderBattleCaptureBallPicker() {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [active, ballsData] = await Promise.all([
      api("/api/pokemon/encounter").catch(() => ({ active: null })),
      api("/api/pokemon/balls").catch(() => ({ balls: [] })),
    ]);
    if (!active.active) {
      toast("No hay encuentro activo");
      renderExploreZoneList().catch((err) => toast(err.message || "Error"));
      return;
    }
    const instanceId = active.active.instanceId;
    const rows = (ballsData.balls || [])
      .map((b) => {
        const disabled = !b.unlimited && b.owned <= 0;
        const countLabel = b.unlimited ? "∞" : b.owned;
        return `<button type="button" class="dk-btn${disabled ? " ghost" : ""}" data-battle-capture-ball="${escHtml(b.id)}"${disabled ? " disabled" : ""} style="display:block;width:100%;text-align:left;margin-bottom:6px">${b.emoji} ${escHtml(b.name)} (${countLabel})</button>`;
      })
      .join("");
    els.pokemonExploreBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Elige con qué bola capturar.</p>
      <div class="integrations-list">${rows}</div>
    `;
    els.pokemonExploreBody.querySelectorAll("[data-battle-capture-ball]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doPokemonCapture(instanceId, btn.getAttribute("data-battle-capture-ball")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function renderBattleSwitchPicker() {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [teamData, dexData] = await Promise.all([
      api("/api/pokemon/team").catch(() => ({ team: [] })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
    ]);
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const usable = (teamData.team || []).filter((p) => !p.fainted);
    const rows = usable
      .map((p) => {
        const sp = namesByDex[p.dexNumber];
        const label = sp && sp.name !== "???" ? `${spriteImg(sp.sprites, p.shiny ? "frontShiny" : "front", sp.emoji, 20)} ${escHtml(sp.name)}` : `#${String(p.dexNumber).padStart(3, "0")}`;
        return `<button type="button" class="dk-btn ghost" data-battle-switch-to="${escHtml(p.instanceId)}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${label} · Nv.${p.level} · ${p.currentHp}/${p.maxHp ?? p.stats.hp} HP</button>`;
      })
      .join("");
    els.pokemonExploreBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Elige a quién cambiar.</p>
      <div class="integrations-list">${rows || `<p class="tagline">No tienes más Pokémon disponibles.</p>`}</div>
    `;
    els.pokemonExploreBody.querySelectorAll("[data-battle-switch-to]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const state = await api("/api/pokemon/battle/switch", { method: "POST", body: JSON.stringify({ instanceId: btn.getAttribute("data-battle-switch-to") }) }).catch((err) => {
          toast(err.message || "Error");
          return null;
        });
        if (state) renderBattleScreen(state);
      });
    });
  }

  async function doBattleFlee() {
    await api("/api/pokemon/battle/flee", { method: "POST" });
    (battleReturnTarget || renderExploreZoneList)().catch((err) => toast(err.message || "Error"));
  }

  async function doPokemonCapture(instanceId, ballId) {
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Lanzando ${escHtml(ballId || "pokeball")}…</p>`;
    const result = await api("/api/pokemon/capture", {
      method: "POST",
      body: JSON.stringify({ instanceId, ballId: ballId || "pokeball" }),
    });
    // 7.8.9 (KAN-342) - animación real de sacudidas (0-4), una a una,
    // antes de revelar el resultado - refleja el mecanismo real de
    // captura (backend ya decidió cuántas superó) en vez de un
    // resultado plano sin suspense. 7.8.45 (KAN-378) - reestilizado:
    // bola real con tambaleo real por CSS + puntos de progreso reales.
    const shakeCount = result.shakes || 0;
    for (let i = 0; i < shakeCount; i++) {
      els.pokemonExploreBody.innerHTML = `
        <div class="poke-ball-shake">🔴</div>
        <div class="poke-shake-dots">${"● ".repeat(i + 1)}${"○ ".repeat(Math.max(0, 3 - i))}</div>
        <p class="tagline" style="text-align:center">sacudida ${i + 1}${i === 3 ? "..." : ""}</p>
      `;
      await new Promise((r) => setTimeout(r, 450));
    }
    els.pokemonExploreBody.innerHTML = `
      <div class="poke-result-card">
        <div class="poke-result-ico">${result.success ? "✅" : "❌"}</div>
        <p class="tagline" style="font-size:16px;margin:0">${escHtml(result.message)}</p>
      </div>
      <button type="button" class="poke-action switch" style="width:100%" data-explore-again>Seguir explorando</button>
    `;
    els.pokemonExploreBody.querySelector("[data-explore-again]")?.addEventListener("click", () => {
      (encounterReturnTarget || renderExploreZoneList)().catch((err) => toast(err.message || "Error"));
    });
  }

  async function openPokemonExplorePanel() {
    if (!els.pokemonExplorePanel || !els.pokemonExploreBody) {
      toast("Explorar no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokemonExplorePanel.hidden = false;
    els.pokemonExploreBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await renderExploreZoneList();
  }

  els.pokemonExploreBack?.addEventListener("click", () => {
    closePokemonExplorePanel();
    setAppNav("servicios");
  });
  els.pokemonExplorePanel?.addEventListener("click", (e) => {
    if (e.target === els.pokemonExplorePanel) {
      closePokemonExplorePanel();
      setAppNav("servicios");
    }
  });

  // 7.8.10 (KAN-343) - Mochila real: inventario + tienda + Poké$, mismo
  // catálogo real (content/pokemon/items.json) que ya usa la fórmula de
  // captura para las bolas. Comida/Caramelo Raro/piedras evolutivas
  // tienen efecto real (amistad/nivel/evolución); pociones/curas de
  // estado/objetos de combate se pueden poseer/comprar/vender pero su
  // "usar" se rechaza con un mensaje honesto (necesitan combate real,
  // 7.8.12, todavía sin construir).
  els.pokebagPanel = document.getElementById("pokebag-panel");
  els.pokebagBody = document.getElementById("pokebag-body");
  els.pokebagBack = document.getElementById("pokebag-back");

  const POKEBAG_CATEGORY_LABELS = {
    balls: "🎯 Bolas",
    potions: "💊 Pociones",
    status: "🧪 Curas de estado",
    evolution: "💎 Piedras evolutivas",
    battle: "⚔️ Objetos de combate",
    special: "🍬 Especiales",
    food: "🍇 Comida",
  };
  // 7.8.38 (KAN-371) - "cure" (curas de estado) ya tiene efecto real -
  // el estado alterado ahora existe de verdad y persiste como el HP.
  // Hueco real encontrado de paso al verificar en vivo: "heal"/
  // "heal_and_cure"/"revive" (Pociones/Full Restore/Revivir) llevan
  // funcionando de verdad desde el 7.8.12 (currentHp real), pero nunca
  // se habían añadido aquí - la Mochila los mostraba como si no
  // tuvieran efecto reconocido. Se arregla de paso, mismo alcance.
  const POKEBAG_USABLE_TYPES = ["friendship", "level_up", "evolve_item", "cure", "heal", "heal_and_cure", "revive"];
  let pokebagView = "inventory";

  function closePokebagPanel() {
    if (els.pokebagPanel) els.pokebagPanel.hidden = true;
  }

  function pokebagTabsHtml() {
    return `<div style="display:flex;gap:8px;margin-bottom:12px">
      <button type="button" class="dk-btn${pokebagView === "inventory" ? "" : " ghost"}" data-pokebag-tab="inventory">🎒 Mochila</button>
      <button type="button" class="dk-btn${pokebagView === "shop" ? "" : " ghost"}" data-pokebag-tab="shop">🏪 Tienda</button>
    </div>`;
  }

  async function renderPokebagPanel() {
    els.pokebagBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const data = await api("/api/pokemon/shop").catch(() => ({ money: 0, catalog: [] }));
    const moneyHtml = `<div class="poke-list-card" style="margin-bottom:12px">
      <div class="poke-list-card-avatar">💰</div>
      <div class="poke-list-card-body"><div class="poke-list-card-title">${data.money} Poké$</div></div>
    </div>`;

    const catalog = data.catalog || [];
    const grouped = {};
    for (const it of catalog) {
      if (pokebagView === "inventory" && it.owned <= 0 && !it.unlimited) continue;
      (grouped[it.category] = grouped[it.category] || []).push(it);
    }
    const categories = Object.keys(POKEBAG_CATEGORY_LABELS).filter((c) => grouped[c]);

    const rowsHtml =
      categories
        .map((cat) => {
          const rows = grouped[cat]
            .map((it) => {
              const ownedLabel = it.unlimited ? "∞" : it.owned;
              const usable = POKEBAG_USABLE_TYPES.includes(it.effect.type);
              let actionsHtml;
              if (pokebagView === "shop") {
                const buyBtn = it.buyable ? `<button type="button" class="dk-btn ghost" data-pokebag-buy="${escHtml(it.id)}">Comprar (${it.price} 💰)</button>` : "";
                const sellBtn = it.sellable && it.owned > 0 ? `<button type="button" class="dk-btn ghost" data-pokebag-sell="${escHtml(it.id)}">Vender (${it.sellPrice} 💰)</button>` : "";
                actionsHtml = `<div style="display:flex;gap:6px;flex-wrap:wrap">${buyBtn}${sellBtn}</div>`;
              } else if (usable) {
                actionsHtml = `<button type="button" class="dk-btn ghost" data-pokebag-use="${escHtml(it.id)}">Usar</button>`;
              } else if (it.effect.type === "battle_boost") {
                // 7.8.38 (KAN-371) - objetos de combate reales, pero
                // solo se pueden usar DURANTE un combate activo (suben
                // un stat stage real que no existe fuera de combate).
                actionsHtml = `<span class="integration-detail">se usa durante el combate</span>`;
              } else if (it.category === "balls") {
                actionsHtml = `<span class="integration-detail">se usa al capturar</span>`;
              } else {
                actionsHtml = `<span class="integration-detail">sin efecto reconocido</span>`;
              }
              return `<div class="poke-list-card" style="flex-wrap:wrap">
                <div class="poke-list-card-avatar">${it.emoji}</div>
                <div class="poke-list-card-body">
                  <div class="poke-list-card-title">${escHtml(it.name)}${pokebagView === "inventory" ? ` (×${ownedLabel})` : ""}</div>
                  <div class="poke-list-card-sub">${pokebagView === "shop" ? `Tienes: ${ownedLabel}` : ""}</div>
                </div>
                ${actionsHtml}
              </div>`;
            })
            .join("");
          return `<p class="tagline" style="margin:14px 0 6px;font-weight:600">${POKEBAG_CATEGORY_LABELS[cat]}</p><div>${rows}</div>`;
        })
        .join("") || `<p class="tagline">${pokebagView === "inventory" ? "No tienes objetos todavía." : "Sin objetos."}</p>`;

    els.pokebagBody.innerHTML = `${moneyHtml}${pokebagTabsHtml()}${rowsHtml}`;

    els.pokebagBody.querySelectorAll("[data-pokebag-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        pokebagView = btn.getAttribute("data-pokebag-tab");
        renderPokebagPanel().catch((err) => toast(err.message || "Error"));
      });
    });
    els.pokebagBody.querySelectorAll("[data-pokebag-buy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doPokebagTransaction("buy", btn.getAttribute("data-pokebag-buy")).catch((err) => toast(err.message || "Error"));
      });
    });
    els.pokebagBody.querySelectorAll("[data-pokebag-sell]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doPokebagTransaction("sell", btn.getAttribute("data-pokebag-sell")).catch((err) => toast(err.message || "Error"));
      });
    });
    els.pokebagBody.querySelectorAll("[data-pokebag-use]").forEach((btn) => {
      btn.addEventListener("click", () => {
        renderPokebagUsePicker(btn.getAttribute("data-pokebag-use")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function doPokebagTransaction(action, itemId) {
    await api(`/api/pokemon/shop/${action}`, { method: "POST", body: JSON.stringify({ itemId, quantity: 1 }) });
    await renderPokebagPanel();
  }

  async function renderPokebagUsePicker(itemId) {
    els.pokebagBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [teamData, dexData] = await Promise.all([
      api("/api/pokemon/team").catch(() => ({ team: [] })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
    ]);
    const team = teamData.team || [];
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const rows = team
      .map((p) => {
        const sp = namesByDex[p.dexNumber];
        const label = sp && sp.name !== "???" ? `${spriteImg(sp.sprites, p.shiny ? "frontShiny" : "front", sp.emoji, 20)} ${escHtml(sp.name)}` : `#${String(p.dexNumber).padStart(3, "0")}`;
        return `<button type="button" class="dk-btn ghost" data-pokebag-use-target="${escHtml(p.instanceId)}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${p.shiny ? "✨ " : ""}${label} · Nv.${p.level}</button>`;
      })
      .join("");
    els.pokebagBody.innerHTML = `
      <button type="button" class="dk-btn ghost" data-pokebag-cancel style="margin-bottom:12px">← Cancelar</button>
      <p class="tagline" style="margin:0 0 10px">Elige un Pokémon de tu equipo para usar el objeto.</p>
      <div class="integrations-list">${rows || `<p class="tagline">No tienes Pokémon en el equipo.</p>`}</div>
    `;
    els.pokebagBody.querySelector("[data-pokebag-cancel]")?.addEventListener("click", () => {
      renderPokebagPanel().catch((err) => toast(err.message || "Error"));
    });
    els.pokebagBody.querySelectorAll("[data-pokebag-use-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doUseItem(itemId, btn.getAttribute("data-pokebag-use-target")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function doUseItem(itemId, instanceId) {
    els.pokebagBody.innerHTML = `<p class="tagline">Usando objeto…</p>`;
    const result = await api("/api/pokemon/items/use", { method: "POST", body: JSON.stringify({ itemId, instanceId }) });
    els.pokebagBody.innerHTML = `
      <p class="tagline" style="font-size:16px;margin:0 0 14px">✅ ${escHtml(result.message)}</p>
      <button type="button" class="dk-btn" data-pokebag-continue>Volver a la mochila</button>
    `;
    els.pokebagBody.querySelector("[data-pokebag-continue]")?.addEventListener("click", () => {
      renderPokebagPanel().catch((err) => toast(err.message || "Error"));
    });
  }

  async function openPokebagPanel() {
    if (!els.pokebagPanel || !els.pokebagBody) {
      toast("Mochila no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    pokebagView = "inventory";
    els.pokebagPanel.hidden = false;
    await renderPokebagPanel();
  }

  els.pokebagBack?.addEventListener("click", () => {
    closePokebagPanel();
    setAppNav("servicios");
  });
  els.pokebagPanel?.addEventListener("click", (e) => {
    if (e.target === els.pokebagPanel) {
      closePokebagPanel();
      setAppNav("servicios");
    }
  });

  // 7.8.38 (KAN-371) - selector real de movimientos: elige un Pokémon
  // del equipo, luego marca hasta 4 movimientos reales del pool
  // disponible (su moveset canónico + apoyo universal) y guarda.
  els.pokemovesPanel = document.getElementById("pokemoves-panel");
  els.pokemovesBody = document.getElementById("pokemoves-body");
  els.pokemovesBack = document.getElementById("pokemoves-back");

  function closePokemovesPanel() {
    if (els.pokemovesPanel) els.pokemovesPanel.hidden = true;
  }

  async function openPokemovesPanel() {
    if (!els.pokemovesPanel || !els.pokemovesBody) {
      toast("Movimientos no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokemovesPanel.hidden = false;
    await renderPokemovesTeamPicker();
  }

  async function renderPokemovesTeamPicker() {
    els.pokemovesBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [teamData, dexData] = await Promise.all([
      api("/api/pokemon/team").catch(() => ({ team: [] })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
    ]);
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const team = teamData.team || [];
    const rows = team
      .map((p) => {
        const sp = namesByDex[p.dexNumber];
        const label = sp && sp.name !== "???" ? `${spriteImg(sp.sprites, p.shiny ? "frontShiny" : "front", sp.emoji, 20)} ${escHtml(sp.name)}` : `#${String(p.dexNumber).padStart(3, "0")}`;
        return `<button type="button" class="dk-btn ghost" data-pokemoves-pick="${escHtml(p.instanceId)}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${p.shiny ? "✨ " : ""}${label} · Nv.${p.level}</button>`;
      })
      .join("");
    els.pokemovesBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Elige un Pokémon de tu equipo.</p>
      <div class="integrations-list">${rows || `<p class="tagline">No tienes Pokémon en el equipo.</p>`}</div>
    `;
    els.pokemovesBody.querySelectorAll("[data-pokemoves-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        renderPokemovesEditor(btn.getAttribute("data-pokemoves-pick")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function renderPokemovesEditor(instanceId) {
    els.pokemovesBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const data = await api(`/api/pokemon/team/${instanceId}/moves`).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!data) {
      renderPokemovesTeamPicker().catch((err) => toast(err.message || "Error"));
      return;
    }
    let selected = [...data.equipped];
    const renderRows = () => {
      return data.pool
        .map((m) => {
          const isOn = selected.includes(m.id);
          const isStatus = m.category === "status";
          const statLine = isStatus ? `Apoyo${m.accuracy != null ? ` · Prec.${m.accuracy}%` : ""}` : `Pot.${m.power} · Prec.${m.accuracy}%`;
          return `<button type="button" class="dk-btn${isOn ? "" : " ghost"}" data-pokemoves-toggle="${escHtml(m.id)}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${isOn ? "✅" : "⬜"} ${escHtml(m.name)} · ${statLine} · PP ${m.pp}</button>`;
        })
        .join("");
    };
    const renderBody = () => {
      els.pokemovesBody.innerHTML = `
        <button type="button" class="dk-btn ghost" data-pokemoves-cancel style="margin-bottom:12px">← Cambiar de Pokémon</button>
        <p class="tagline" style="margin:0 0 10px">Marca hasta 4 movimientos (${selected.length}/4). Puedes traer movimientos de apoyo aunque sacrifiques daño.</p>
        <div class="integrations-list">${renderRows()}</div>
        <button type="button" class="dk-btn" data-pokemoves-save style="margin-top:12px" ${selected.length ? "" : "disabled"}>Guardar</button>
      `;
      els.pokemovesBody.querySelector("[data-pokemoves-cancel]")?.addEventListener("click", () => {
        renderPokemovesTeamPicker().catch((err) => toast(err.message || "Error"));
      });
      els.pokemovesBody.querySelectorAll("[data-pokemoves-toggle]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-pokemoves-toggle");
          if (selected.includes(id)) {
            selected = selected.filter((x) => x !== id);
          } else if (selected.length < 4) {
            selected.push(id);
          } else {
            toast("Ya tienes 4 movimientos marcados - quita uno primero");
            return;
          }
          renderBody();
        });
      });
      els.pokemovesBody.querySelector("[data-pokemoves-save]")?.addEventListener("click", async () => {
        await api(`/api/pokemon/team/${instanceId}/moves`, { method: "POST", body: JSON.stringify({ moves: selected }) }).catch((err) => {
          toast(err.message || "Error");
          return null;
        });
        toast("Movimientos guardados");
        renderPokemovesTeamPicker().catch((err) => toast(err.message || "Error"));
      });
    };
    renderBody();
  }

  els.pokemovesBack?.addEventListener("click", () => {
    closePokemovesPanel();
    setAppNav("servicios");
  });
  els.pokemovesPanel?.addEventListener("click", (e) => {
    if (e.target === els.pokemovesPanel) {
      closePokemovesPanel();
      setAppNav("servicios");
    }
  });

  // 7.8.43 (KAN-376) - Entrenamiento real: asignación de puntos EV por
  // Pokémon del equipo, mismo patrón exacto que Movimientos (selector
  // de Pokémon → editor), reglas reales (máx 252/stat, máx 510 total)
  // ya validadas en el backend - aquí solo se refleja/envía.
  els.poketrainPanel = document.getElementById("poketrain-panel");
  els.poketrainBody = document.getElementById("poketrain-body");
  els.poketrainBack = document.getElementById("poketrain-back");

  function closePoketrainPanel() {
    if (els.poketrainPanel) els.poketrainPanel.hidden = true;
  }

  async function openPoketrainPanel() {
    if (!els.poketrainPanel || !els.poketrainBody) {
      toast("Entrenamiento no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.poketrainPanel.hidden = false;
    await renderPoketrainTeamPicker();
  }

  async function renderPoketrainTeamPicker() {
    els.poketrainBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [teamData, dexData] = await Promise.all([
      api("/api/pokemon/team").catch(() => ({ team: [] })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
    ]);
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const team = teamData.team || [];
    const rows = team
      .map((p) => {
        const sp = namesByDex[p.dexNumber];
        const label = sp && sp.name !== "???" ? `${spriteImg(sp.sprites, p.shiny ? "frontShiny" : "front", sp.emoji, 20)} ${escHtml(sp.name)}` : `#${String(p.dexNumber).padStart(3, "0")}`;
        return `<button type="button" class="dk-btn ghost" data-poketrain-pick="${escHtml(p.instanceId)}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${p.shiny ? "✨ " : ""}${label} · Nv.${p.level}</button>`;
      })
      .join("");
    els.poketrainBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Elige un Pokémon de tu equipo para entrenar sus EVs.</p>
      <div class="integrations-list">${rows || `<p class="tagline">No tienes Pokémon en el equipo.</p>`}</div>
    `;
    els.poketrainBody.querySelectorAll("[data-poketrain-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        renderPoketrainEditor(btn.getAttribute("data-poketrain-pick")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  const EV_STAT_LABELS = { hp: "PS", attack: "Ataque", defense: "Defensa", spAttack: "At. Especial", spDefense: "Def. Especial", speed: "Velocidad" };

  async function renderPoketrainEditor(instanceId) {
    els.poketrainBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const data = await api(`/api/pokemon/team/${instanceId}/evs`).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!data) {
      renderPoketrainTeamPicker().catch((err) => toast(err.message || "Error"));
      return;
    }
    let evs = { ...data.evs };
    const renderBody = () => {
      const total = Object.values(evs).reduce((sum, v) => sum + v, 0);
      const overTotal = total > data.maxTotal;
      const rows = Object.keys(EV_STAT_LABELS)
        .map((key) => {
          const val = evs[key] || 0;
          const pct = Math.round((val / data.maxPerStat) * 100);
          return `
            <div style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span>${EV_STAT_LABELS[key]}</span>
                <span class="poke-num">${val}/${data.maxPerStat}</span>
              </div>
              <div class="poke-bar-track"><div class="poke-bar-fill xp" style="width:${pct}%"></div></div>
              <div style="display:flex;gap:6px;justify-content:center;margin-top:4px">
                <button type="button" class="dk-btn ghost" data-ev-step="${key}" data-ev-delta="-4">-4</button>
                <button type="button" class="dk-btn ghost" data-ev-step="${key}" data-ev-delta="-1">-1</button>
                <button type="button" class="dk-btn ghost" data-ev-step="${key}" data-ev-delta="1">+1</button>
                <button type="button" class="dk-btn ghost" data-ev-step="${key}" data-ev-delta="4">+4</button>
              </div>
            </div>`;
        })
        .join("");
      els.poketrainBody.innerHTML = `
        <button type="button" class="dk-btn ghost" data-poketrain-cancel style="margin-bottom:12px">← Cambiar de Pokémon</button>
        <p class="tagline poke-title" style="margin:0 0 4px">${escHtml(data.name)} · Nv.${data.level}</p>
        <p class="tagline poke-num" style="margin:0 0 12px${overTotal ? ";color:var(--poke-red)" : ""}">${total}/${data.maxTotal} EVs totales</p>
        ${rows}
        <button type="button" class="dk-btn" data-poketrain-save style="margin-top:8px" ${overTotal ? "disabled" : ""}>Guardar</button>
        <button type="button" class="dk-btn ghost" data-poketrain-reset style="margin-top:8px">Reiniciar a 0</button>
      `;
      els.poketrainBody.querySelector("[data-poketrain-cancel]")?.addEventListener("click", () => {
        renderPoketrainTeamPicker().catch((err) => toast(err.message || "Error"));
      });
      els.poketrainBody.querySelectorAll("[data-ev-step]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.getAttribute("data-ev-step");
          const delta = Number(btn.getAttribute("data-ev-delta")) || 0;
          evs[key] = Math.max(0, Math.min(data.maxPerStat, (evs[key] || 0) + delta));
          renderBody();
        });
      });
      els.poketrainBody.querySelector("[data-poketrain-reset]")?.addEventListener("click", () => {
        evs = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
        renderBody();
      });
      els.poketrainBody.querySelector("[data-poketrain-save]")?.addEventListener("click", async () => {
        const result = await api(`/api/pokemon/team/${instanceId}/evs`, { method: "POST", body: JSON.stringify({ evs }) }).catch((err) => {
          toast(err.message || "Error");
          return null;
        });
        if (!result) return;
        toast(result.message || "Entrenamiento guardado");
        renderPoketrainTeamPicker().catch((err) => toast(err.message || "Error"));
      });
    };
    renderBody();
  }

  els.poketrainBack?.addEventListener("click", () => {
    closePoketrainPanel();
    setAppNav("servicios");
  });
  els.poketrainPanel?.addEventListener("click", (e) => {
    if (e.target === els.poketrainPanel) {
      closePoketrainPanel();
      setAppNav("servicios");
    }
  });

  // 7.8.17 (KAN-350) - amistad real: cada Pokémon del equipo muestra su
  // amistad real (0-255) y su nivel (Baja/Media/Alta/Máxima), con un
  // botón "Jugar" real (sube amistad, con cooldown real de 4h - el
  // servidor rechaza con un mensaje claro si todavía no toca). Curar/
  // alimentar/subir de nivel/ganar combates/debilitarse ya suben o bajan
  // amistad de verdad desde otros flujos existentes (Mochila/combate) -
  // este panel es solo para ver el estado real y para la acción nueva.
  els.pokecarePanel = document.getElementById("pokecare-panel");
  els.pokecareBody = document.getElementById("pokecare-body");
  els.pokecareBack = document.getElementById("pokecare-back");

  function closePokecarePanel() {
    if (els.pokecarePanel) els.pokecarePanel.hidden = true;
  }

  function friendshipTierLabel(v) {
    if (v >= 220) return "Máxima";
    if (v >= 150) return "Alta";
    if (v >= 70) return "Media";
    return "Baja";
  }

  async function openPokecarePanel() {
    if (!els.pokecarePanel || !els.pokecareBody) {
      toast("Cuidar no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokecarePanel.hidden = false;
    await renderPokecarePanel();
  }

  async function renderPokecarePanel() {
    els.pokecareBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [teamData, dexData] = await Promise.all([
      api("/api/pokemon/team").catch(() => ({ team: [] })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
    ]);
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const team = teamData.team || [];
    const rows = team
      .map((p) => {
        const sp = namesByDex[p.dexNumber];
        const speciesName = sp && sp.name !== "???" ? sp.name : `#${String(p.dexNumber).padStart(3, "0")}`;
        // 7.8.51 (KAN-384) - apodo real: si está puesto, es el nombre
        // principal (mismo criterio que el juego real), con la especie
        // real entre paréntesis para no perder de vista quién es.
        const nameHtml = p.nickname
          ? `${escHtml(p.nickname)} <span class="poke-list-card-sub" style="display:inline">(${escHtml(speciesName)})</span>`
          : escHtml(speciesName);
        const label = `${spriteImg(sp && sp.sprites, p.shiny ? "frontShiny" : "front", sp ? sp.emoji : "❓", 20)} ${nameHtml}`;
        const friendship = p.friendship || 0;
        const pct = Math.max(0, Math.min(100, Math.round((friendship / 255) * 100)));
        // 7.8.24 (KAN-357) - capa Tamagotchi real: Hambre/Energía/
        // Felicidad reales (ya vienen calculadas en vivo desde el
        // backend, mismo patrón que HP/PP) + Salud derivada + su
        // comportamiento base real (dormilón/energético/...).
        const healthColor = { Sano: "#51cf66", "Decaído": "#fab005", Enfermo: "#ff6b6b", "Debilitado": "#868e96" }[p.healthTier] || "#51cf66";
        const statBar = (icon, label2, value, cls) => `
          <div class="poke-list-card-sub" style="margin-top:6px">${icon} ${label2} ${value ?? "-"}/100</div>
          <div class="poke-bar-track"><div class="poke-bar-fill ${cls}" style="width:${Math.max(0, Math.min(100, value ?? 0))}%"></div></div>`;
        return `<div class="poke-combatant" style="align-items:flex-start;flex-wrap:wrap">
          <div class="poke-combatant-avatar">${spriteImg(sp && sp.sprites, p.shiny ? "frontShiny" : "front", sp ? sp.emoji : "❓", 40)}</div>
          <div class="poke-combatant-info">
            <div style="font-weight:700">${label} · Nv.${p.level} <button type="button" class="dk-btn ghost" data-pokecare-rename="${escHtml(p.instanceId)}" style="padding:2px 8px;font-size:11px">✏️</button></div>
            <div class="poke-list-card-sub"><span style="color:${healthColor}">${p.healthTier}</span>${p.behavior ? ` · ${p.behavior.emoji} ${escHtml(p.behavior.label)}` : ""}${p.activity ? ` · ${p.activity.emoji} ${escHtml(p.activity.label)}` : ""}</div>
            ${statBar("🍗", "Hambre", p.hunger, "hunger")}
            ${statBar("⚡", "Energía", p.energy, "energy")}
            ${statBar("😊", "Felicidad", p.happiness, "happiness")}
            <div class="poke-list-card-sub" style="margin-top:6px">💗 Amistad ${friendship}/255 · ${friendshipTierLabel(friendship)}</div>
            <div class="poke-bar-track"><div class="poke-bar-fill friend" style="width:${pct}%"></div></div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
              <button type="button" class="dk-btn ghost" data-pokecare-play="${escHtml(p.instanceId)}">🎾 Jugar</button>
              <button type="button" class="dk-btn ghost" data-pokecare-rest="${escHtml(p.instanceId)}">💤 Descansar</button>
              <button type="button" class="dk-btn ghost" data-pokecare-to-box="${escHtml(p.instanceId)}">📦 A caja</button>
            </div>
          </div>
        </div>`;
      })
      .join("");
    // 7.8.50 (KAN-383) - Centro Pokémon real: curación gratuita de todo
    // el equipo, accesible desde el mismo panel donde ya se cuida al
    // equipo (contextualmente es el mismo sitio).
    els.pokecareBody.innerHTML = `
      <div style="display:flex;justify-content:center;margin-bottom:14px">
        <button type="button" class="dk-btn" data-pokecare-heal-center>🏥 Centro Pokémon (curar equipo gratis)</button>
      </div>
      <div>${rows || `<p class="tagline">No tienes Pokémon en el equipo.</p>`}</div>
    `;
    els.pokecareBody.querySelector("[data-pokecare-heal-center]")?.addEventListener("click", () => {
      doPokecareHealCenter().catch((err) => toast(err.message || "Error"));
    });
    els.pokecareBody.querySelectorAll("[data-pokecare-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doPokecarePlay(btn.getAttribute("data-pokecare-play")).catch((err) => toast(err.message || "Error"));
      });
    });
    els.pokecareBody.querySelectorAll("[data-pokecare-rest]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doPokecareRest(btn.getAttribute("data-pokecare-rest")).catch((err) => toast(err.message || "Error"));
      });
    });
    // 7.8.46 (KAN-379) - viaje real de vuelta a caja, cierra el bucle
    // real con el nuevo panel de Cajas (equipo -> caja -> equipo).
    els.pokecareBody.querySelectorAll("[data-pokecare-to-box]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doPokecareToBox(btn.getAttribute("data-pokecare-to-box")).catch((err) => toast(err.message || "Error"));
      });
    });
    // 7.8.51 (KAN-384) - apodo real, editable con un prompt simple.
    els.pokecareBody.querySelectorAll("[data-pokecare-rename]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        doPokecareRename(btn.getAttribute("data-pokecare-rename")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function doPokecareHealCenter() {
    const result = await api("/api/pokemon/center/heal", { method: "POST" }).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!result) return;
    toast(result.message);
    renderPokecarePanel().catch((err) => toast(err.message || "Error"));
  }

  async function doPokecareRename(instanceId) {
    const nickname = window.prompt(`Nuevo apodo (máx 12 caracteres, vacío para quitarlo):`, "");
    if (nickname === null) return; // cancelado
    const result = await api(`/api/pokemon/team/${instanceId}/nickname`, { method: "POST", body: JSON.stringify({ nickname }) }).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!result) return;
    toast(result.message);
    renderPokecarePanel().catch((err) => toast(err.message || "Error"));
  }

  async function doPokecareToBox(instanceId) {
    const result = await api(`/api/pokemon/team/${instanceId}`, { method: "DELETE" }).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (result) {
      toast("Movido a una caja real.");
      await renderPokecarePanel();
    }
  }

  async function doPokecarePlay(instanceId) {
    const result = await api(`/api/pokemon/team/${instanceId}/play`, { method: "POST" });
    toast(result.message);
    await renderPokecarePanel();
  }

  // 7.8.24 (KAN-357) - descansar real: sube energía real (nunca se
  // regenera sola con el tiempo), con su propio cooldown real de 6h.
  async function doPokecareRest(instanceId) {
    const result = await api(`/api/pokemon/team/${instanceId}/rest`, { method: "POST" });
    toast(result.message);
    await renderPokecarePanel();
  }

  els.pokecareBack?.addEventListener("click", () => {
    closePokecarePanel();
    setAppNav("servicios");
  });
  els.pokecarePanel?.addEventListener("click", (e) => {
    if (e.target === els.pokecarePanel) {
      closePokecarePanel();
      setAppNav("servicios");
    }
  });

  // 7.8.40 (KAN-373) - medallero real: las 8 medallas reales de Kanto
  // (una por gimnasio), conseguida/pendiente según el estado real del
  // entrenador, con un botón "Desafiar" real que abre el mismo selector
  // de equipo + motor de combate ya usados para encuentros salvajes y
  // entrenadores itinerantes (el combate se muestra en el panel de
  // Explorar; al terminar/huir se vuelve aquí).
  els.pokemedalsPanel = document.getElementById("pokemedals-panel");
  els.pokemedalsBody = document.getElementById("pokemedals-body");
  els.pokemedalsBack = document.getElementById("pokemedals-back");

  function closePokemedalsPanel() {
    if (els.pokemedalsPanel) els.pokemedalsPanel.hidden = true;
  }

  async function openPokemedalsPanel() {
    if (!els.pokemedalsPanel || !els.pokemedalsBody) {
      toast("Medallero no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokemedalsPanel.hidden = false;
    await renderMedalleroPanel();
  }

  async function renderMedalleroPanel() {
    els.pokemedalsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [gymsData, zonesData] = await Promise.all([
      api("/api/pokemon/gyms").catch(() => ({ gyms: [] })),
      api("/api/pokemon/zones").catch(() => ({ zones: [] })),
    ]);
    const zonesById = {};
    for (const z of zonesData.zones || []) zonesById[z.id] = z;
    const gyms = (gymsData.gyms || []).slice().sort((a, b) => a.order - b.order);
    const earnedCount = gyms.filter((g) => g.earned).length;
    const rows = gyms
      .map((g) => {
        const zone = zonesById[g.zoneId];
        const zoneLabel = zone ? `${zone.emoji} ${escHtml(zone.name)}` : escHtml(g.zoneId);
        return `<div class="integration-row integration-row--stub" style="flex-wrap:wrap;gap:8px">
          <span class="integration-ico">${g.earned ? g.badgeEmoji : "❔"}</span>
          <span class="integration-info">
            <span class="integration-name">${escHtml(g.leaderName)} · Tipo ${escHtml(g.type)}</span>
            <span class="integration-detail">${zoneLabel} · Equipo de ${g.teamSize} · ${escHtml(g.badgeName)}</span>
            <span class="integration-detail" style="color:${g.earned ? "#51cf66" : "#868e96"}">${g.earned ? "🏅 Medalla conseguida" : "Medalla pendiente"}</span>
          </span>
          ${g.earned ? "" : `<button type="button" class="dk-btn ghost" data-medal-challenge="${escHtml(g.id)}">🥊 Desafiar</button>`}
        </div>`;
      })
      .join("");
    els.pokemedalsBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">${earnedCount}/${gyms.length} medallas conseguidas</p>
      <div class="integrations-list">${rows || `<p class="tagline">No hay gimnasios disponibles.</p>`}</div>
    `;
    els.pokemedalsBody.querySelectorAll("[data-medal-challenge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const gymId = btn.getAttribute("data-medal-challenge");
        if (els.pokemedalsPanel) els.pokemedalsPanel.hidden = true;
        if (els.pokemonExplorePanel) els.pokemonExplorePanel.hidden = false;
        battleReturnTarget = returnToMedalleroFromBattle;
        renderBattleTeamPicker({ kind: "gym", opponentId: gymId }, returnToMedalleroFromBattle).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function returnToMedalleroFromBattle() {
    if (els.pokemonExplorePanel) els.pokemonExplorePanel.hidden = true;
    if (els.pokemedalsPanel) els.pokemedalsPanel.hidden = false;
    await renderMedalleroPanel();
  }

  els.pokemedalsBack?.addEventListener("click", () => {
    closePokemedalsPanel();
    setAppNav("servicios");
  });
  els.pokemedalsPanel?.addEventListener("click", (e) => {
    if (e.target === els.pokemedalsPanel) {
      closePokemedalsPanel();
      setAppNav("servicios");
    }
  });

  // 7.8.29 (KAN-362) - Logros reales: calculados en vivo por el backend
  // (nunca un flag guardado que se pueda desincronizar), mismo patrón
  // visual que el Medallero.
  els.pokeachievementsPanel = document.getElementById("pokeachievements-panel");
  els.pokeachievementsBody = document.getElementById("pokeachievements-body");
  els.pokeachievementsBack = document.getElementById("pokeachievements-back");

  function closePokeachievementsPanel() {
    if (els.pokeachievementsPanel) els.pokeachievementsPanel.hidden = true;
  }

  async function openPokeachievementsPanel() {
    if (!els.pokeachievementsPanel || !els.pokeachievementsBody) {
      toast("Logros no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokeachievementsPanel.hidden = false;
    await renderPokeachievementsPanel();
  }

  async function renderPokeachievementsPanel() {
    els.pokeachievementsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const data = await api("/api/pokemon/achievements").catch(() => ({ achievements: [], unlockedCount: 0, total: 0 }));
    const rows = (data.achievements || [])
      .map((a) => {
        // 7.8.56 (KAN-389) - recompensa real: botón "Reclamar" solo si
        // está desbloqueado de verdad Y todavía no se ha cobrado.
        const statusHtml = a.claimed ? " · ✅ Conseguido y reclamado" : a.unlocked ? ` · ✅ Conseguido (+${a.reward} Poké$ sin reclamar)` : "";
        const claimBtn = a.claimable ? `<button type="button" class="dk-btn" data-achievement-claim="${escHtml(a.id)}">🎁 Reclamar +${a.reward}</button>` : "";
        return `<div class="poke-list-card${a.unlocked ? "" : " locked"}" style="flex-wrap:wrap">
          <div class="poke-list-card-avatar">${a.unlocked ? a.emoji : "🔒"}</div>
          <div class="poke-list-card-body">
            <div class="poke-list-card-title">${escHtml(a.name)}</div>
            <div class="poke-list-card-sub">${escHtml(a.description)}${statusHtml}</div>
          </div>
          ${claimBtn}
        </div>`;
      })
      .join("");
    els.pokeachievementsBody.innerHTML = `
      <p class="tagline poke-num" style="margin:0 0 10px">${data.unlockedCount}/${data.total} logros conseguidos</p>
      <div>${rows || `<p class="tagline">No hay logros disponibles.</p>`}</div>
    `;
    els.pokeachievementsBody.querySelectorAll("[data-achievement-claim]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-achievement-claim");
        const result = await api(`/api/pokemon/achievements/${id}/claim`, { method: "POST" }).catch((err) => {
          toast(err.message || "Error");
          return null;
        });
        if (!result) return;
        toast(result.message);
        renderPokeachievementsPanel().catch((err) => toast(err.message || "Error"));
      });
    });
  }

  els.pokeachievementsBack?.addEventListener("click", () => {
    closePokeachievementsPanel();
    setAppNav("servicios");
  });
  els.pokeachievementsPanel?.addEventListener("click", (e) => {
    if (e.target === els.pokeachievementsPanel) {
      closePokeachievementsPanel();
      setAppNav("servicios");
    }
  });

  // 7.8.54 (KAN-387) - Guardería real: 2 Pokémon propios (equipo o
  // caja) se dejan en pareja, caminar de verdad acumula pasos reales
  // (los 3 niveles de exploración ya pasan por el mismo moveOnMap()
  // real) hacia un huevo real. Simplificación honesta: sin géneros ni
  // grupos huevo reales (no existen en los datos de especies de hoy).
  els.pokedaycarePanel = document.getElementById("pokedaycare-panel");
  els.pokedaycareBody = document.getElementById("pokedaycare-body");
  els.pokedaycareBack = document.getElementById("pokedaycare-back");

  function closePokedaycarePanel() {
    if (els.pokedaycarePanel) els.pokedaycarePanel.hidden = true;
  }

  async function openPokedaycarePanel() {
    if (!els.pokedaycarePanel || !els.pokedaycareBody) {
      toast("Guardería no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokedaycarePanel.hidden = false;
    await renderPokedaycarePanel();
  }

  async function renderPokedaycarePanel() {
    els.pokedaycareBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const status = await api("/api/pokemon/daycare/status").catch(() => ({ active: false }));

    if (status.active) {
      const pct = Math.max(0, Math.min(100, Math.round((status.stepsAccumulated / status.targetSteps) * 100)));
      els.pokedaycareBody.innerHTML = `
        <p class="tagline" style="margin:0 0 10px">🐣 Guardería</p>
        <div class="poke-result-card">
          <div class="poke-result-ico">🐣</div>
          <p class="tagline poke-title">${status.parentA ? escHtml(status.parentA.emoji + " " + status.parentA.name) : "?"} + ${status.parentB ? escHtml(status.parentB.emoji + " " + status.parentB.name) : "?"}</p>
          <p class="poke-num">${status.stepsAccumulated}/${status.targetSteps} pasos reales${status.ready ? " · ¡listo!" : ""}</p>
          <div class="poke-bar-track"><div class="poke-bar-fill xp" style="width:${pct}%"></div></div>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button type="button" class="dk-btn" data-daycare-collect${status.ready ? "" : " disabled"}>🥚 Recoger huevo</button>
          <button type="button" class="dk-btn ghost" data-daycare-withdraw>❌ Sacar sin huevo</button>
        </div>
      `;
      els.pokedaycareBody.querySelector("[data-daycare-collect]")?.addEventListener("click", async () => {
        const result = await api("/api/pokemon/daycare/collect", { method: "POST" }).catch((err) => {
          toast(err.message || "Error");
          return null;
        });
        if (!result) return;
        toast(result.message);
        renderPokedaycarePanel().catch((err) => toast(err.message || "Error"));
      });
      els.pokedaycareBody.querySelector("[data-daycare-withdraw]")?.addEventListener("click", async () => {
        const result = await api("/api/pokemon/daycare/withdraw", { method: "POST" }).catch((err) => {
          toast(err.message || "Error");
          return null;
        });
        if (!result) return;
        toast(result.message);
        renderPokedaycarePanel().catch((err) => toast(err.message || "Error"));
      });
      return;
    }

    const [teamData, storageData, dexData] = await Promise.all([
      api("/api/pokemon/team").catch(() => ({ team: [] })),
      api("/api/pokemon/storage").catch(() => ({ boxes: {} })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
    ]);
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const boxed = Object.values(storageData.boxes || {}).flat();
    const all = [...(teamData.team || []), ...boxed];
    let selected = [];
    const renderPicker = () => {
      const rows = all
        .map((p) => {
          const sp = namesByDex[p.dexNumber];
          const label = sp && sp.name !== "???" ? `${spriteImg(sp.sprites, p.shiny ? "frontShiny" : "front", sp.emoji, 20)} ${escHtml(sp.name)}` : `#${String(p.dexNumber).padStart(3, "0")}`;
          const isSelected = selected.includes(p.instanceId);
          return `<button type="button" class="dk-btn${isSelected ? "" : " ghost"}" data-daycare-pick="${escHtml(p.instanceId)}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${isSelected ? "✅ " : ""}${p.shiny ? "✨ " : ""}${label} · Nv.${p.level}</button>`;
        })
        .join("");
      els.pokedaycareBody.innerHTML = `
        <p class="tagline" style="margin:0 0 10px">🐣 Guardería</p>
        <p class="tagline">Deja una pareja real (equipo o caja, cualquier combinación) y camina de verdad para que aparezca un huevo. Elige 2:</p>
        <div class="integrations-list">${rows || `<p class="tagline">No tienes Pokémon.</p>`}</div>
        <div style="display:flex;justify-content:center;margin-top:10px">
          <button type="button" class="dk-btn" data-daycare-confirm${selected.length === 2 ? "" : " disabled"}>Dejar pareja en la Guardería</button>
        </div>
      `;
      els.pokedaycareBody.querySelectorAll("[data-daycare-pick]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-daycare-pick");
          if (selected.includes(id)) {
            selected = selected.filter((x) => x !== id);
          } else if (selected.length < 2) {
            selected.push(id);
          } else {
            toast("Ya has elegido 2 - quita uno primero");
            return;
          }
          renderPicker();
        });
      });
      els.pokedaycareBody.querySelector("[data-daycare-confirm]")?.addEventListener("click", async () => {
        const result = await api("/api/pokemon/daycare/deposit", { method: "POST", body: JSON.stringify({ instanceIdA: selected[0], instanceIdB: selected[1] }) }).catch((err) => {
          toast(err.message || "Error");
          return null;
        });
        if (!result) return;
        toast(result.message);
        renderPokedaycarePanel().catch((err) => toast(err.message || "Error"));
      });
    };
    renderPicker();
  }

  els.pokedaycareBack?.addEventListener("click", () => {
    closePokedaycarePanel();
    setAppNav("servicios");
  });
  els.pokedaycarePanel?.addEventListener("click", (e) => {
    if (e.target === els.pokedaycarePanel) {
      closePokedaycarePanel();
      setAppNav("servicios");
    }
  });

  // 7.8.41 (KAN-374) - rediseño visual unificado: dashboard "Inicio"
  // real (nivel/XP/equipo/progreso) + barra de navegación inferior
  // compartida entre Inicio/Explorar/Pokémon/Mochila/Pokédex - los 5
  // paneles ya existentes se mantienen intactos (misma lógica, mismo
  // estado), la barra solo permite saltar entre ellos sin volver cada
  // vez al hub Sistema, para que se sienta como una sola app.
  els.pokemonHomePanel = document.getElementById("pokemon-home-panel");
  els.pokemonHomeBody = document.getElementById("pokemon-home-body");
  els.pokemonHomeBack = document.getElementById("pokemon-home-back");

  function closePokemonHomePanel() {
    if (els.pokemonHomePanel) els.pokemonHomePanel.hidden = true;
  }

  async function openPokemonHomePanel() {
    if (!els.pokemonHomePanel || !els.pokemonHomeBody) {
      toast("Pokémon no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokemonHomePanel.hidden = false;
    await renderPokemonHome();
  }

  // 7.8.61 - fecha/hora real de un evento -> "hace N min/h/d", mismo
  // espíritu que formatConnectedAgo pero con el texto corto que pide
  // una fila de notificación (sin el prefijo "conectado").
  function pokeTimeAgo(iso) {
    if (!iso) return "";
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms < 0) return "";
    const s = Math.round(ms / 1000);
    if (s < 60) return "ahora mismo";
    const m = Math.round(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60);
    if (h < 48) return `hace ${h} h`;
    return `hace ${Math.round(h / 24)} d`;
  }

  async function renderPokemonHome() {
    els.pokemonHomeBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [progression, teamData, dexData, goal, achievementsData, quickStatus, eventsData] = await Promise.all([
      api("/api/pokemon/progression").catch(() => null),
      api("/api/pokemon/team").catch(() => ({ team: [] })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
      api("/api/pokemon/dex/goal").catch(() => null),
      api("/api/pokemon/achievements").catch(() => ({ achievements: [] })),
      api("/api/pokemon/explore/quick/status").catch(() => ({ status: "none" })),
      api("/api/events?limit=50").catch(() => ({ recent: [] })),
    ]);
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const team = teamData.team || [];
    const xpPct = progression ? Math.max(0, Math.min(100, Math.round((progression.xpIntoLevel / progression.xpForNextLevel) * 100))) : 0;
    const trainerName = escHtml((progression && progression.trainerName) || "Entrenador BMO");

    const teamSlotsHtml = Array.from({ length: 6 })
      .map((_, i) => {
        const p = team[i];
        if (!p) return `<div class="poke-team-slot empty"><div style="font-size:22px">➕</div><div class="lvl poke-num">Vacío</div></div>`;
        const sp = namesByDex[p.dexNumber];
        const spriteHtml = spriteImg(sp && sp.sprites, p.shiny ? "frontShiny" : "front", sp ? sp.emoji : "❓", 64);
        return `<div class="poke-team-slot">${spriteHtml}<div class="lvl poke-num">Nv.${p.level}</div></div>`;
      })
      .join("");

    // 7.8.61 - objetivo real de Pokédex (7.8.37) + logros reales
    // (7.8.29/7.8.56) como barras laterales reales, en vez del grid
    // suelto de antes - mismo dato, presentación más cercana al
    // mockup del usuario.
    const achievements = achievementsData.achievements || [];
    const achievedCount = achievements.filter((a) => a.unlocked).length;
    const dexGoalPct = goal ? goal.percent : 0;
    const achPct = achievements.length ? Math.round((achievedCount / achievements.length) * 100) : 0;

    // 7.8.61 - "consejo del día" real: derivado del estado real del
    // equipo/logros, nunca texto de relleno fijo. Prioridad: salud del
    // equipo > logro reclamable > hueco libre en el equipo > genérico.
    const sickMember = team.find((p) => p.healthTier === "Enfermo");
    const tiredMember = team.find((p) => p.healthTier === "Decaído" || p.healthTier === "Cansado");
    const claimable = achievements.find((a) => a.unlocked && !a.claimed);
    let bmoTip;
    if (sickMember) {
      const sp = namesByDex[sickMember.dexNumber];
      bmoTip = `${escHtml(sickMember.nickname || (sp && sp.name) || "Uno de tu equipo")} está enfermo/a - pásate por 🏥 Centro Pokémon o ❤️ Cuidar.`;
    } else if (tiredMember) {
      bmoTip = `Tu equipo tiene la energía baja - un 💤 Descanso en Cuidar les vendría bien.`;
    } else if (claimable) {
      bmoTip = `Tienes un logro real desbloqueado esperando en 🏆 Logros - ¡ve a reclamarlo!`;
    } else if (team.length < 6) {
      bmoTip = `Te quedan ${6 - team.length} hueco${6 - team.length === 1 ? "" : "s"} libres en el equipo - buen momento para explorar.`;
    } else {
      bmoTip = `Tu equipo está sano y completo. ¡Buen día para explorar!`;
    }

    // 7.8.61 - tarjeta de exploración activa: solo aparece si hay de
    // verdad una sesión 🟢 Rápido corriendo (7.8.48/7.8.59) - sin
    // arte de zona inventado, solo datos reales.
    let explorationHtml = "";
    if (quickStatus.status === "running") {
      const donePct = quickStatus.durationMinutes
        ? Math.max(0, Math.min(100, Math.round(((quickStatus.durationMinutes - quickStatus.remainingMinutes) / quickStatus.durationMinutes) * 100)))
        : 0;
      explorationHtml = `
        <p class="tagline" style="margin:14px 0 8px">Exploración activa</p>
        <button type="button" class="poke-explore-active" data-poke-quick="explore">
          <div class="poke-explore-active-head">
            <span class="poke-title">🟢 Explorando ${escHtml(quickStatus.zoneId)}…</span>
          </div>
          <p class="poke-num" style="margin:4px 0">${quickStatus.remainingMinutes} min restantes de ${quickStatus.durationMinutes}</p>
          <div class="poke-bar-track"><div class="poke-bar-fill xp" style="width:${donePct}%"></div></div>
        </button>`;
    }

    // 7.8.61 - notificaciones reales del Event Center filtradas a
    // eventos "pokemon.*" (hoy solo emite pokemon.fainted del 7.8.52 -
    // el resto de hitos todavía no emiten evento real, así que la
    // lista puede salir vacía de verdad; estado honesto, no relleno).
    const pokeEvents = (eventsData.recent || []).filter((e) => String(e.type || "").startsWith("pokemon."));
    const notifHtml = pokeEvents.length
      ? pokeEvents
          .slice(0, 5)
          .map(
            (e) => `
        <div class="poke-notif-row">
          <div class="poke-notif-title">${escHtml(e.title || e.type)}</div>
          <div class="poke-notif-sub">${escHtml(e.message || "")}</div>
          <div class="poke-notif-time poke-num">${pokeTimeAgo(e.time)}</div>
        </div>`
          )
          .join("")
      : `<p class="tagline">Sin notificaciones recientes de Pokémon.</p>`;

    els.pokemonHomeBody.innerHTML = `
      <div class="poke-hero poke-hero-withside">
        <img class="poke-hero-avatar poke-hero-avatar-img" src="./assets/bmo.webp" alt="" />
        <div class="poke-hero-info">
          <div class="poke-hero-name poke-title">${trainerName}${progression ? " · Nv." + progression.trainerLevel : ""} <button type="button" class="dk-btn ghost" data-poke-rename-trainer style="padding:2px 8px;font-size:11px">✏️</button></div>
          <div class="poke-hero-rank poke-num">${progression ? `${progression.xpIntoLevel}/${progression.xpForNextLevel} XP` : "Cargando progreso…"}</div>
          <div class="poke-bar-track"><div class="poke-bar-fill xp" style="width:${xpPct}%"></div></div>
          <div class="poke-hero-money poke-num">💰 ${progression ? progression.money : "…"} Poké$</div>
        </div>
        <div class="poke-progress-side">
          <div class="poke-progress-row"><span>📖 Pokédex</span><span class="poke-num">${goal ? `${goal.implemented}/${goal.totalReal}` : "…"}</span></div>
          <div class="poke-bar-track sm"><div class="poke-bar-fill xp" style="width:${dexGoalPct}%"></div></div>
          <div class="poke-progress-row"><span>🏆 Logros</span><span class="poke-num">${achievedCount}/${achievements.length}</span></div>
          <div class="poke-bar-track sm"><div class="poke-bar-fill gold" style="width:${achPct}%"></div></div>
        </div>
      </div>

      <p class="tagline" style="margin:0 0 8px">Tu equipo</p>
      <div class="poke-team-strip">${teamSlotsHtml}</div>

      <div class="poke-tip-card">
        <img class="poke-tip-avatar" src="./assets/bmo.webp" alt="" />
        <div class="poke-tip-body">
          <div class="poke-title" style="font-size:0.95rem">¡Hola ${trainerName}!</div>
          <p class="poke-tip-text">${bmoTip}</p>
        </div>
      </div>

      ${explorationHtml}

      <p class="tagline" style="margin:14px 0 8px">Accesos rápidos</p>
      <div class="poke-quick-grid">
        <button type="button" class="poke-quick-btn" data-poke-quick="explore"><span class="poke-quick-ico poke-ico-green"><img src="./assets/icon_tree.svg" alt="" /></span><span>Explorar</span></button>
        <button type="button" class="poke-quick-btn" data-poke-quick="dex"><span class="poke-quick-ico poke-ico-red"><img src="./assets/icon_book.svg" alt="" /></span><span>Pokédex</span></button>
        <button type="button" class="poke-quick-btn" data-poke-quick="bag"><span class="poke-quick-ico poke-ico-brown"><img src="./assets/icon_bag.svg" alt="" /></span><span>Mochila</span></button>
        <button type="button" class="poke-quick-btn" data-poke-quick="box"><span class="poke-quick-ico poke-ico-blue"><img src="./assets/icon_monitor.svg" alt="" /></span><span>Cajas</span></button>
        <button type="button" class="poke-quick-btn" data-poke-quick="events"><span class="poke-quick-ico poke-ico-gold"><img src="./assets/icon_calendar.svg" alt="" /></span><span>Eventos</span></button>
        <button type="button" class="poke-quick-btn" data-poke-quick="train"><span class="poke-quick-ico poke-ico-purple"><img src="./assets/icon_dumbbell.svg" alt="" /></span><span>Entrenar</span></button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
        <button type="button" class="dk-btn ghost" data-poke-quick="moves">🥋 Movimientos</button>
        <button type="button" class="dk-btn ghost" data-poke-quick="heal">🏥 Centro Pokémon</button>
        <button type="button" class="dk-btn ghost" data-poke-quick="achievements">🏆 Logros</button>
        <button type="button" class="dk-btn ghost" data-poke-quick="shiny">✨ Shiny</button>
        <button type="button" class="dk-btn ghost" data-poke-quick="daycare">🐣 Guardería</button>
        <button type="button" class="dk-btn ghost" data-poke-quick="medals">🎖️ Medallero</button>
        <button type="button" class="dk-btn ghost" data-poke-quick="progress">📊 Progresión</button>
      </div>

      <p class="tagline" style="margin:14px 0 8px">Notificaciones</p>
      <div class="poke-notif-list">${notifHtml}</div>
    `;
    els.pokemonHomeBody.querySelectorAll("[data-poke-quick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-poke-quick");
        if (target === "explore") switchPokeTab("explore");
        else if (target === "dex") switchPokeTab("dex");
        else if (target === "bag") switchPokeTab("bag");
        else if (target === "medals") openPokemedalsPanel().catch((err) => toast(err.message || "Error"));
        else if (target === "progress") openPokeprogressPanel().catch((err) => toast(err.message || "Error"));
        else if (target === "events") openPokeeventsPanel().catch((err) => toast(err.message || "Error"));
        else if (target === "box") openPokeboxPanel().catch((err) => toast(err.message || "Error"));
        else if (target === "train") openPoketrainPanel().catch((err) => toast(err.message || "Error"));
        else if (target === "moves") openPokemovesPanel().catch((err) => toast(err.message || "Error"));
        else if (target === "heal") {
          api("/api/pokemon/center/heal", { method: "POST" })
            .then((result) => toast(result.message))
            .catch((err) => toast(err.message || "Error"));
        } else if (target === "achievements") {
          openPokeachievementsPanel().catch((err) => toast(err.message || "Error"));
        } else if (target === "shiny") {
          doPokeShinySettings().catch((err) => toast(err.message || "Error"));
        } else if (target === "daycare") {
          openPokedaycarePanel().catch((err) => toast(err.message || "Error"));
        }
      });
    });
    // 7.8.55 (KAN-388) - nombre real de entrenador, editable con un
    // prompt simple - mismo patrón que los apodos de Pokémon.
    els.pokemonHomeBody.querySelector("[data-poke-rename-trainer]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      doPokeRenameTrainer().catch((err) => toast(err.message || "Error"));
    });
  }

  async function doPokeRenameTrainer() {
    const current = await api("/api/pokemon/trainer/name").catch(() => ({ trainerName: "Entrenador BMO" }));
    const input = window.prompt("Nuevo nombre de entrenador (máx 16 caracteres, vacío para volver a \"Entrenador BMO\"):", current.trainerName);
    if (input === null) return; // cancelado
    const result = await api("/api/pokemon/trainer/name", { method: "POST", body: JSON.stringify({ name: input }) }).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!result) return;
    toast(result.message);
    renderPokemonHome().catch((err) => toast(err.message || "Error"));
  }

  // 7.8.31 (KAN-364) - probabilidad real configurable de shiny: mismo
  // patrón simple de prompt ya usado para apodos (sin construir una
  // pantalla dedicada para un único número real).
  async function doPokeShinySettings() {
    const current = await api("/api/pokemon/settings/shiny").catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!current) return;
    const input = window.prompt(
      `Probabilidad real de Shiny actual: ${current.chancePercent}% (por defecto real: ${current.defaultChancePercent}%).\nEscribe un nuevo porcentaje (0-100):`,
      String(current.chancePercent)
    );
    if (input === null) return; // cancelado
    const percent = Number(input);
    if (!Number.isFinite(percent)) {
      toast("Introduce un número real válido");
      return;
    }
    const result = await api("/api/pokemon/settings/shiny", { method: "POST", body: JSON.stringify({ chance: percent / 100 }) }).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (!result) return;
    toast(`Probabilidad de Shiny real ahora: ${result.chancePercent}%`);
  }

  // Router real de la barra inferior: oculta el panel Pokémon
  // actualmente visible y abre el destino real (misma función de
  // apertura ya usada por cada tile del hub Sistema, sin duplicar
  // lógica) - la barra es solo navegación, nunca reimplementa nada.
  // 7.8.46 (KAN-379) - hueco real encontrado en la propia verificación:
  // la barra inferior solo ocultaba los 5 paneles principales - un
  // panel secundario abierto desde Inicio (Medallero/Progresión/
  // Eventos/Cajas) se quedaba apilado encima al cambiar de pestaña,
  // rompiendo la sensación de "una sola app" que pedía el usuario.
  // Ahora la barra cierra CUALQUIER panel real de Pokémon, principal o
  // secundario, antes de abrir el destino nuevo.
  function hideAllPokeScreens() {
    [
      els.pokemonHomePanel, els.pokedexPanel, els.pokemonExplorePanel, els.pokebagPanel, els.pokecarePanel,
      els.pokemedalsPanel, els.pokeprogressPanel, els.pokeeventsPanel, els.pokeboxPanel, els.pokemovesPanel, els.poketrainPanel, els.pokeachievementsPanel, els.pokedaycarePanel,
    ].forEach((panel) => {
      if (panel) panel.hidden = true;
    });
  }

  function switchPokeTab(tab) {
    hideAllPokeScreens();
    if (tab === "home") openPokemonHomePanel().catch((err) => toast(err.message || "Error"));
    else if (tab === "explore") openPokemonExplorePanel().catch((err) => toast(err.message || "Error"));
    else if (tab === "team") openPokecarePanel().catch((err) => toast(err.message || "Error"));
    else if (tab === "bag") openPokebagPanel().catch((err) => toast(err.message || "Error"));
    else if (tab === "dex") openPokedexPanel().catch((err) => toast(err.message || "Error"));
  }

  // Un único listener delegado cubre las 5 copias de la barra (una por
  // pantalla) - no hace falta enganchar 25 botones a mano.
  document.body.addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-poke-tab]");
    if (tabBtn) switchPokeTab(tabBtn.getAttribute("data-poke-tab"));
  });

  els.pokemonHomeBack?.addEventListener("click", () => {
    closePokemonHomePanel();
    setAppNav("servicios");
  });
  els.pokemonHomePanel?.addEventListener("click", (e) => {
    if (e.target === els.pokemonHomePanel) {
      closePokemonHomePanel();
      setAppNav("servicios");
    }
  });

  // 7.8.28 (KAN-361) - progresión real: todo calculado en vivo por el
  // backend (GET /api/pokemon/progression) a partir de estado ya real
  // y existente (Pokédex/zonas/equipo/insignias/combates) - este panel
  // solo muestra los números reales, no inventa ni duplica nada.
  els.pokeprogressPanel = document.getElementById("pokeprogress-panel");
  els.pokeprogressBody = document.getElementById("pokeprogress-body");
  els.pokeprogressBack = document.getElementById("pokeprogress-back");

  function closePokeprogressPanel() {
    if (els.pokeprogressPanel) els.pokeprogressPanel.hidden = true;
  }

  async function openPokeprogressPanel() {
    if (!els.pokeprogressPanel || !els.pokeprogressBody) {
      toast("Progresión no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokeprogressPanel.hidden = false;
    await renderPokeprogressPanel();
  }

  function progressStat(icon, label, value) {
    return `<div class="integration-row integration-row--stub">
      <span class="integration-ico">${icon}</span>
      <span class="integration-info">
        <span class="integration-name">${escHtml(label)}</span>
        <span class="integration-detail poke-num">${escHtml(value)}</span>
      </span>
    </div>`;
  }

  async function renderPokeprogressPanel() {
    els.pokeprogressBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const p = await api("/api/pokemon/progression").catch(() => null);
    if (!p) {
      els.pokeprogressBody.innerHTML = `<p class="tagline">No se pudo cargar la progresión.</p>`;
      return;
    }
    const xpPct = Math.max(0, Math.min(100, Math.round((p.xpIntoLevel / p.xpForNextLevel) * 100)));
    els.pokeprogressBody.innerHTML = `
      <div class="integration-row integration-row--stub" style="flex-wrap:wrap;gap:8px">
        <span class="integration-ico">🎓</span>
        <span class="integration-info">
          <span class="integration-name poke-title">Nivel de Entrenador <span class="poke-num">${p.trainerLevel}</span></span>
          <span class="integration-detail poke-num">${p.xpIntoLevel}/${p.xpForNextLevel} XP para el siguiente nivel</span>
          <div style="background:#222;border-radius:4px;height:8px;overflow:hidden;margin:4px 0;max-width:220px"><div style="width:${xpPct}%;height:100%;background:linear-gradient(90deg,var(--poke-accent),var(--poke-green))"></div></div>
        </span>
      </div>
      <div class="integrations-list">
        ${progressStat("📖", "Pokédex", `${p.pokedex.caught} capturados / ${p.pokedex.seen} vistos / ${p.pokedex.total} totales`)}
        ${progressStat("🗺️", "Zonas descubiertas", `${p.areasDiscovered.unlocked}/${p.areasDiscovered.total}`)}
        ${progressStat("🎒", "Pokémon capturados", `${p.pokemonCaught}`)}
        ${progressStat("⚔️", "Combates", `${p.battles.won} ganados · ${p.battles.lost} perdidos`)}
        ${progressStat("🎖️", "Medallas", `${p.badges.earned}/${p.badges.total}`)}
        ${progressStat("💰", "Poké$", `${p.money}`)}
        ${progressStat("🏆", "Logros", p.achievements.note)}
      </div>
    `;
  }

  els.pokeprogressBack?.addEventListener("click", () => {
    closePokeprogressPanel();
    setAppNav("servicios");
  });
  els.pokeprogressPanel?.addEventListener("click", (e) => {
    if (e.target === els.pokeprogressPanel) {
      closePokeprogressPanel();
      setAppNav("servicios");
    }
  });

  // 7.8.34/7.8.44 (KAN-367/KAN-377) - eventos reales: activo/pendiente
  // + cuenta atrás real (fase lunar real / día de la semana real del
  // propio Pi), nunca un texto inventado.
  els.pokeeventsPanel = document.getElementById("pokeevents-panel");
  els.pokeeventsBody = document.getElementById("pokeevents-body");
  els.pokeeventsBack = document.getElementById("pokeevents-back");

  function closePokeeventsPanel() {
    if (els.pokeeventsPanel) els.pokeeventsPanel.hidden = true;
  }

  async function openPokeeventsPanel() {
    if (!els.pokeeventsPanel || !els.pokeeventsBody) {
      toast("Eventos no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokeeventsPanel.hidden = false;
    await renderPokeeventsPanel();
  }

  function formatHours(h) {
    if (h == null) return "";
    const totalMinutes = Math.round(h * 60);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  }

  async function renderPokeeventsPanel() {
    els.pokeeventsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const data = await api("/api/pokemon/events").catch(() => null);
    if (!data) {
      els.pokeeventsBody.innerHTML = `<p class="tagline">No se pudieron cargar los eventos.</p>`;
      return;
    }
    const rows = (data.events || [])
      .map((e) => {
        const statusHtml = e.active
          ? `<span style="color:var(--poke-green);font-weight:600">🟢 Activo ahora · termina en ${formatHours(e.endsInHours)}</span>`
          : `<span style="color:#8aa0b5">⚪ Inactivo · empieza en ${formatHours(e.startsInHours)}</span>`;
        return `<div class="poke-hero" style="margin-bottom:10px${e.active ? ";border-color:rgba(124,255,107,0.4)" : ""}">
          <div class="poke-hero-avatar">${e.emoji}</div>
          <div class="poke-hero-info">
            <div class="poke-hero-name poke-title">${escHtml(e.name)}</div>
            <div class="poke-hero-rank">${escHtml(e.description)}</div>
            <p class="tagline" style="margin:4px 0 0">${statusHtml}</p>
          </div>
        </div>`;
      })
      .join("");
    els.pokeeventsBody.innerHTML = rows || `<p class="tagline">No hay eventos configurados.</p>`;
  }

  els.pokeeventsBack?.addEventListener("click", () => {
    closePokeeventsPanel();
    setAppNav("servicios");
  });
  els.pokeeventsPanel?.addEventListener("click", (e) => {
    if (e.target === els.pokeeventsPanel) {
      closePokeeventsPanel();
      setAppNav("servicios");
    }
  });

  // 7.8.46 (KAN-379) - Cajas real: hasta ahora la mecánica real ya
  // existía en el backend (guardar/sacar del equipo real) pero no
  // tenía panel real todavía - se construye aquí de cero con el
  // estilo ya compartido, no es un reestilizado de algo que ya
  // existiera.
  els.pokeboxPanel = document.getElementById("pokebox-panel");
  els.pokeboxBody = document.getElementById("pokebox-body");
  els.pokeboxBack = document.getElementById("pokebox-back");

  function closePokeboxPanel() {
    if (els.pokeboxPanel) els.pokeboxPanel.hidden = true;
  }

  async function openPokeboxPanel() {
    if (!els.pokeboxPanel || !els.pokeboxBody) {
      toast("Cajas no disponible");
      return;
    }
    closeSysHub();
    hideAllPokeScreens();
    els.pokeboxPanel.hidden = false;
    await renderPokeboxPanel();
  }

  async function renderPokeboxPanel() {
    els.pokeboxBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    const [storageData, dexData, teamData] = await Promise.all([
      api("/api/pokemon/storage").catch(() => ({ boxes: {} })),
      api("/api/pokemon/dex").catch(() => ({ entries: [] })),
      api("/api/pokemon/team").catch(() => ({ team: [], max: 6 })),
    ]);
    const namesByDex = {};
    for (const e of dexData.entries || []) namesByDex[e.dexNumber] = e;
    const teamFull = (teamData.team || []).length >= (teamData.max || 6);
    const boxes = storageData.boxes || {};
    const boxNames = Object.keys(boxes);
    const sectionsHtml = boxNames
      .map((boxName) => {
        const individuals = boxes[boxName] || [];
        const rows = individuals
          .map((p) => {
            const sp = namesByDex[p.dexNumber];
            const label = sp && sp.name !== "???" ? escHtml(sp.name) : `#${String(p.dexNumber).padStart(3, "0")}`;
            return `<div class="poke-list-card">
              <div class="poke-list-card-avatar">${spriteImg(sp && sp.sprites, p.shiny ? "frontShiny" : "front", sp ? sp.emoji : "❓", 28)}</div>
              <div class="poke-list-card-body">
                <div class="poke-list-card-title">${p.shiny ? "✨ " : ""}${label} · Nv.${p.level}</div>
                <div class="poke-list-card-sub">${escHtml(p.nature || "")}${p.healthTier ? " · " + escHtml(p.healthTier) : ""}</div>
              </div>
              <button type="button" class="dk-btn ghost" data-pokebox-to-team="${escHtml(p.instanceId)}"${teamFull ? " disabled" : ""}>${teamFull ? "Equipo lleno" : "➡️ Al equipo"}</button>
            </div>`;
          })
          .join("");
        return `<p class="tagline" style="margin:14px 0 6px;font-weight:600">📦 ${escHtml(boxName)} (${individuals.length})</p>${rows || `<p class="tagline">Vacía.</p>`}`;
      })
      .join("");
    els.pokeboxBody.innerHTML = sectionsHtml || `<p class="tagline">No tienes cajas todavía.</p>`;
    els.pokeboxBody.querySelectorAll("[data-pokebox-to-team]").forEach((btn) => {
      btn.addEventListener("click", () => {
        doPokeboxToTeam(btn.getAttribute("data-pokebox-to-team")).catch((err) => toast(err.message || "Error"));
      });
    });
  }

  async function doPokeboxToTeam(instanceId) {
    const result = await api(`/api/pokemon/team/${instanceId}`, { method: "POST" }).catch((err) => {
      toast(err.message || "Error");
      return null;
    });
    if (result) {
      toast("Movido a tu equipo real.");
      await renderPokeboxPanel();
    }
  }

  els.pokeboxBack?.addEventListener("click", () => {
    closePokeboxPanel();
    setAppNav("servicios");
  });
  els.pokeboxPanel?.addEventListener("click", (e) => {
    if (e.target === els.pokeboxPanel) {
      closePokeboxPanel();
      setAppNav("servicios");
    }
  });

  els.securityCenterBack?.addEventListener("click", () => {
    closeSecurityCenterPanel();
    openSysHub();
  });
  els.securityCenterPanel?.addEventListener("click", (e) => {
    if (e.target === els.securityCenterPanel) {
      closeSecurityCenterPanel();
      openSysHub();
    }
  });

  // 7.4.17 - Mapa de Infraestructura: Internet -> Router -> dispositivos ->
  // Docker, sobre datos ya reales (deviceAgentService/dockerService). Arbol
  // indentado reutilizando las cajas .wf-box del visor de flowcharts (6.5.5)
  // en vez de inventar un componente de grafo nuevo.
  els.infraMapPanel = document.getElementById("infra-map-panel");
  els.infraMapBody = document.getElementById("infra-map-body");
  els.infraMapBack = document.getElementById("infra-map-back");

  function infraMapNodeHtml(node, depth) {
    const indent = depth > 0 ? `style="margin-left:${Math.min(depth, 6) * 16}px"` : "";
    const cls = depth === 0 ? "wf-box wf-trigger" : depth <= 2 ? "wf-box" : "wf-box wf-branch";
    const detail = node.detail ? `<div class="wf-box-detail">${escHtml(node.detail)}</div>` : "";
    const self = `<div class="${cls}" ${indent}>${escHtml(node.icon || "•")} <strong>${escHtml(node.label)}</strong>${detail}</div>`;
    const children = (node.children || []).map((c) => infraMapNodeHtml(c, depth + 1)).join("");
    return self + children;
  }

  function closeInfraMapPanel() {
    if (els.infraMapPanel) els.infraMapPanel.hidden = true;
  }

  async function openInfraMapPanel() {
    if (!els.infraMapPanel || !els.infraMapBody) {
      toast("Mapa de Infraestructura no disponible");
      return;
    }
    closeSysHub();
    els.infraMapPanel.hidden = false;
    els.infraMapBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    const map = await api("/api/system/infrastructure-map").catch(() => null);
    if (!map || !map.root) {
      els.infraMapBody.innerHTML = `<p class="tagline">No se pudo cargar el mapa.</p>`;
      return;
    }
    els.infraMapBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Topología real del ecosistema BMO.</p>
      <div class="wf-flow">${infraMapNodeHtml(map.root, 0)}</div>
    `;
  }

  els.infraMapBack?.addEventListener("click", () => {
    closeInfraMapPanel();
    openSysHub();
  });
  els.infraMapPanel?.addEventListener("click", (e) => {
    if (e.target === els.infraMapPanel) {
      closeInfraMapPanel();
      openSysHub();
    }
  });

  // 7.4.24 (KAN-244) - Modo Offline: estado unico y real de que sigue
  // funcionando sin Internet y que externo queda marcado no disponible,
  // sobre offlineModeService.js. No cambia ningun comportamiento, solo lo
  // hace visible (mismas filas .integration-row que Security Center).
  els.offlineStatusPanel = document.getElementById("offline-status-panel");
  els.offlineStatusBody = document.getElementById("offline-status-body");
  els.offlineStatusBack = document.getElementById("offline-status-back");

  function offlineRowHtml(item) {
    const dot = item.available ? "🟢" : "🔴";
    return `<div class="integration-row integration-row--stub">
      <span class="integration-ico">${dot}</span>
      <span class="integration-info">
        <span class="integration-name">${escHtml(item.label)}</span>
        <span class="integration-detail">${escHtml(item.note || (item.available ? "disponible" : "no disponible"))}</span>
      </span>
    </div>`;
  }

  function closeOfflineStatusPanel() {
    if (els.offlineStatusPanel) els.offlineStatusPanel.hidden = true;
  }

  async function openOfflineStatusPanel() {
    if (!els.offlineStatusPanel || !els.offlineStatusBody) {
      toast("Modo Offline no disponible");
      return;
    }
    closeSysHub();
    els.offlineStatusPanel.hidden = false;
    els.offlineStatusBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    const status = await api("/api/system/offline-status").catch(() => null);
    if (!status) {
      els.offlineStatusBody.innerHTML = `<p class="tagline">No se pudo cargar el estado.</p>`;
      return;
    }
    const headline = status.online
      ? "🟢 Con Internet — todo disponible."
      : "🔴 Sin Internet — funcionando en modo local.";
    const external = (status.externalServices || []).map(offlineRowHtml).join("");
    const local = (status.localServices || []).map(offlineRowHtml).join("");
    els.offlineStatusBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">${headline}</p>
      <h3 style="margin:10px 0 4px">Externos (necesitan Internet)</h3>
      <div class="integrations-list">${external}</div>
      <h3 style="margin:14px 0 4px">Locales (siguen funcionando en LAN)</h3>
      <div class="integrations-list">${local}</div>
    `;
  }

  els.offlineStatusBack?.addEventListener("click", () => {
    closeOfflineStatusPanel();
    openSysHub();
  });
  els.offlineStatusPanel?.addEventListener("click", (e) => {
    if (e.target === els.offlineStatusPanel) {
      closeOfflineStatusPanel();
      openSysHub();
    }
  });

  // 7.4.29 (KAN-249) - Ecosistema BMO: los 7 bloques del mockup del spec
  // (Sistema/Dispositivos/Servicios/Proyectos/Docker/Red/Seguridad) en una
  // sola vista, sobre ecosystemCoreService.getEcosystemOverview() ya real
  // (7.4.1/KAN-221, ampliado en 7.4.29 con network/security) - sin
  // duplicar ninguna pestaña existente, solo consolidarlas visualmente.
  els.ecoDashboardPanel = document.getElementById("eco-dashboard-panel");
  els.ecoDashboardBody = document.getElementById("eco-dashboard-body");
  els.ecoDashboardBack = document.getElementById("eco-dashboard-back");
  // 7.5.4 (KAN-255) - Modos Personales: superficie de UI directa que faltaba
  // para configurationProfilesService.js (7.0.9) - hasta ahora solo se
  // aplicaba un perfil via escenas/automatizaciones o la IA, nunca a mano
  // desde la interfaz.
  els.modosPanel = document.getElementById("modos-panel");
  els.modosBody = document.getElementById("modos-body");
  els.modosBack = document.getElementById("modos-back");

  function ecoTileHtml(icon, title, lines) {
    return `<div class="wf-box" style="text-align:left">
      <div>${icon} <strong>${escHtml(title)}</strong></div>
      ${lines.map((l) => `<div class="wf-box-detail">${escHtml(l)}</div>`).join("")}
    </div>`;
  }

  function closeEcoDashboardPanel() {
    if (els.ecoDashboardPanel) els.ecoDashboardPanel.hidden = true;
  }

  async function openEcoDashboardPanel() {
    if (!els.ecoDashboardPanel || !els.ecoDashboardBody) {
      toast("Ecosistema BMO no disponible");
      return;
    }
    closeSysHub();
    els.ecoDashboardPanel.hidden = false;
    els.ecoDashboardBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    const o = await api("/api/system/ecosystem-overview").catch(() => null);
    if (!o) {
      els.ecoDashboardBody.innerHTML = `<p class="tagline">No se pudo cargar el ecosistema.</p>`;
      return;
    }
    const tiles = [
      ecoTileHtml("⚙️", "Sistema", [`Perfil activo: ${o.activeProfile || "—"}`, `Actualizado: ${formatHistoryWhen(o.updatedAt)}`]),
      ecoTileHtml("📟", "Dispositivos", o.devices ? [`${o.devices.online}/${o.devices.total} online`] : ["Sin datos"]),
      ecoTileHtml("🩺", "Servicios", o.health ? [`Estado: ${o.health.overallStatus}`, `${o.health.items} comprobaciones`] : ["Sin datos"]),
      ecoTileHtml("📁", "Proyectos", o.projects ? [`${o.projects.total} proyecto(s)`] : ["Sin datos"]),
      ecoTileHtml("🐳", "Docker", o.docker ? [`${o.docker.running}/${o.docker.containers} contenedores activos`] : ["Sin datos"]),
      ecoTileHtml("📡", "Red", o.network ? [o.network.online ? "Con Internet" : "Sin Internet"] : ["Sin datos"]),
      ecoTileHtml("🛡️", "Seguridad", o.security ? [`${o.security.green || 0} 🟢 · ${o.security.yellow || 0} 🟡 · ${o.security.red || 0} 🔴`] : ["Sin datos"]),
    ];
    els.ecoDashboardBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Vista consolidada real del ecosistema BMO.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">${tiles.join("")}</div>
    `;
  }

  els.ecoDashboardBack?.addEventListener("click", () => {
    closeEcoDashboardPanel();
    openSysHub();
  });
  els.ecoDashboardPanel?.addEventListener("click", (e) => {
    if (e.target === els.ecoDashboardPanel) {
      closeEcoDashboardPanel();
      openSysHub();
    }
  });

  // 7.5.4 (KAN-255) - Modos Personales
  function closeModosPanel() {
    if (els.modosPanel) els.modosPanel.hidden = true;
  }

  async function openModosPanel() {
    if (!els.modosPanel || !els.modosBody) {
      toast("Modos Personales no disponible");
      return;
    }
    closeSysHub();
    els.modosPanel.hidden = false;
    els.modosBody.innerHTML = `<p class="tagline">Cargando…</p>`;

    const data = await api("/api/profiles").catch(() => null);
    if (!data) {
      els.modosBody.innerHTML = `<p class="tagline">No se pudieron cargar los modos.</p>`;
      return;
    }
    const profiles = data.profiles || [];
    const active = data.active;
    els.modosBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Aplica un modo real a todo BMO de una vez: autonomía, cámara, IA, privacidad, avisos y tono.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${profiles
          .map((p) => {
            const isActive = p.id === active;
            return `<div class="docker-actions" style="justify-content:space-between${isActive ? ";border-color:var(--accent, #6cf)" : ""}">
              <span style="flex:1">${escHtml(p.settings?.label || p.label || p.id)}${isActive ? " · <strong>activo</strong>" : ""}</span>
              <button type="button" class="dk-btn ${isActive ? "ghost" : "primary"}" data-modo-apply="${escHtml(p.id)}" ${isActive ? "disabled" : ""}>${isActive ? "Activo" : "Aplicar"}</button>
            </div>`;
          })
          .join("") || `<p class="sic-sub">No hay modos configurados.</p>`}
      </div>
    `;
    els.modosBody.querySelectorAll("[data-modo-apply]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const name = btn.getAttribute("data-modo-apply");
        btn.disabled = true;
        try {
          await api("/api/profiles/apply", { method: "POST", body: JSON.stringify({ name }) });
          toast(`Modo "${name}" aplicado`);
          openModosPanel();
        } catch (err) {
          toast(err.message || "Error al aplicar el modo");
          btn.disabled = false;
        }
      });
    });
  }

  els.modosBack?.addEventListener("click", () => {
    closeModosPanel();
    openSysHub();
  });
  els.modosPanel?.addEventListener("click", (e) => {
    if (e.target === els.modosPanel) {
      closeModosPanel();
      openSysHub();
    }
  });

  // 7.5.6/7.5.7 (KAN-257/258) - Mi Espacio Personal: Dashboard + Command
  // Center consolidados en UN panel con pestañas (mismo criterio de reuso
  // que 7.0.16/17 con BMO Brain) en vez de 8 paneles sueltos - cada
  // pestaña es la superficie directa de un servicio de 7.5 que antes solo
  // existia en el backend.
  els.personalPanel = document.getElementById("personal-panel");
  els.personalBody = document.getElementById("personal-body");
  els.personalBack = document.getElementById("personal-back");
  state.personalTab = "resumen";
  state.personalProjectView = null;

  function closePersonalPanel() {
    if (els.personalPanel) els.personalPanel.hidden = true;
  }

  async function openPersonalPanel(tab) {
    if (!els.personalPanel || !els.personalBody) {
      toast("Mi Espacio Personal no disponible");
      return;
    }
    closeSysHub();
    els.personalPanel.hidden = false;
    if (tab) state.personalTab = tab;
    state.personalProjectView = null;
    document.querySelectorAll("[data-personal-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.personalTab === state.personalTab);
    });
    await renderPersonalTab();
  }

  async function renderPersonalTab() {
    if (!els.personalBody) return;
    els.personalBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    try {
      if (state.personalTab === "resumen") await renderPersonalResumen();
      else if (state.personalTab === "tareas") await renderPersonalTareas();
      else if (state.personalTab === "proyectos") await renderPersonalProyectos();
      else if (state.personalTab === "notas") await renderPersonalNotas();
      else if (state.personalTab === "decisiones") await renderPersonalDecisiones();
      else if (state.personalTab === "rutinas") await renderPersonalRutinas();
      else if (state.personalTab === "calendario") await renderPersonalCalendario();
      else if (state.personalTab === "analitica") await renderPersonalAnalitica();
      else if (state.personalTab === "privacidad") await renderPersonalPrivacidad();
    } catch (err) {
      els.personalBody.innerHTML = `<p class="tagline">Error: ${escHtml(err.message || "desconocido")}</p>`;
    }
  }

  async function renderPersonalResumen() {
    const o = await api("/api/personal/overview");
    const t = o.tasks || {};
    const tiles = [
      ecoTileHtml("👤", "Perfil", [o.profile?.name || "Sin nombre", `Modo activo: ${o.activeProfile || "—"}`]),
      ecoTileHtml("✅", "Tareas", [`${t.pendientes || 0} pendientes`, `${t.urgentes || 0} urgentes · ${t.programadas || 0} programadas`]),
      ecoTileHtml("📁", "Proyectos", [`${o.projects?.total || 0} proyecto(s)`]),
      ecoTileHtml("🗒️", "Notas", [`${o.notes?.total || 0} nota(s)`]),
      ecoTileHtml("⚖️", "Decisiones", [`${o.decisions?.total || 0} registrada(s)`]),
      ecoTileHtml("🧭", "Rutinas", [`${o.routines?.total || 0} configurada(s)`]),
    ];
    els.personalBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Tu resumen personal real en BMO.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:14px">${tiles.join("")}</div>
      <div class="docker-actions" style="gap:8px">
        <input type="text" id="personal-quick-task" placeholder="Añadir tarea rápida (ej: comprar pan mañana)" style="flex:1" />
        <button type="button" class="dk-btn primary" id="personal-quick-task-add">Añadir</button>
      </div>
    `;
    document.getElementById("personal-quick-task-add")?.addEventListener("click", async () => {
      const input = document.getElementById("personal-quick-task");
      const text = input?.value?.trim();
      if (!text) return;
      try {
        await api("/api/personal/tasks", { method: "POST", body: JSON.stringify({ text }) });
        if (input) input.value = "";
        toast("Tarea añadida");
        await renderPersonalResumen();
      } catch (err) {
        toast(err.message || "Error al añadir");
      }
    });
  }

  function taskRowHtml(t) {
    const prioIcon = { high: "🔴", medium: "🟡", low: "🟢" }[t.priority] || "🟡";
    const due = t.dueAt ? new Date(t.dueAt).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : null;
    return `<div class="docker-actions" style="justify-content:space-between;margin-bottom:6px;opacity:${t.status === "done" ? 0.55 : 1}">
      <label style="flex:1;display:flex;gap:8px;align-items:center;cursor:pointer">
        <input type="checkbox" data-task-toggle="${t.id}" ${t.status === "done" ? "checked" : ""} />
        <span>${prioIcon} ${escHtml(t.text)}${due ? ` <span class="sic-sub">· ${due}</span>` : ""}${t.tags?.length ? ` <span class="sic-sub">#${t.tags.map(escHtml).join(" #")}</span>` : ""}</span>
      </label>
      <button type="button" class="dk-btn danger" data-task-delete="${t.id}">🗑️</button>
    </div>`;
  }

  async function renderPersonalTareas() {
    const { tasks } = await api("/api/personal/tasks");
    const pending = tasks.filter((t) => t.status === "pending");
    const done = tasks.filter((t) => t.status === "done");
    els.personalBody.innerHTML = `
      <div class="docker-actions" style="gap:8px;margin-bottom:10px">
        <input type="text" id="personal-task-input" placeholder="Nueva tarea (entiende 'mañana', 'viernes', 'urgente'…)" style="flex:1" />
        <button type="button" class="dk-btn primary" id="personal-task-add">Añadir</button>
      </div>
      <p class="sic-sub">Pendientes (${pending.length})</p>
      ${pending.map(taskRowHtml).join("") || `<p class="sic-sub">Sin tareas pendientes</p>`}
      ${done.length ? `<p class="sic-sub" style="margin-top:10px">Completadas (${done.length})</p>${done.slice(0, 20).map(taskRowHtml).join("")}` : ""}
    `;
    document.getElementById("personal-task-add")?.addEventListener("click", async () => {
      const input = document.getElementById("personal-task-input");
      const text = input?.value?.trim();
      if (!text) return;
      try {
        await api("/api/personal/tasks", { method: "POST", body: JSON.stringify({ text }) });
        if (input) input.value = "";
        await renderPersonalTareas();
      } catch (err) {
        toast(err.message || "Error al añadir");
      }
    });
    els.personalBody.querySelectorAll("[data-task-toggle]").forEach((cb) => {
      cb.addEventListener("change", async () => {
        const id = cb.getAttribute("data-task-toggle");
        try {
          await api(`/api/personal/tasks/${id}/${cb.checked ? "complete" : "uncomplete"}`, { method: "POST", body: "{}" });
          await renderPersonalTareas();
        } catch (err) {
          toast(err.message || "Error");
        }
      });
    });
    els.personalBody.querySelectorAll("[data-task-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await api(`/api/personal/tasks/${btn.getAttribute("data-task-delete")}`, { method: "DELETE" });
          await renderPersonalTareas();
        } catch (err) {
          toast(err.message || "Error");
        }
      });
    });
  }

  async function renderPersonalProyectos() {
    if (state.personalProjectView) {
      return renderPersonalProjectWorkspace(state.personalProjectView);
    }
    const { projects } = await api("/api/personal/projects");
    els.personalBody.innerHTML = `
      <div class="docker-actions" style="margin-bottom:10px">
        <button type="button" class="dk-btn primary" id="personal-project-add">➕ Nuevo proyecto</button>
      </div>
      ${
        projects
          .map(
            (p) => `<div class="docker-actions" style="justify-content:space-between;margin-bottom:6px">
        <button type="button" class="dk-btn ghost" data-project-open="${escHtml(p.id)}" style="flex:1;text-align:left">📁 ${escHtml(p.name)}${p.status ? ` <span class="sic-sub">· ${escHtml(p.status)}</span>` : ""}</button>
      </div>`
          )
          .join("") || `<p class="sic-sub">Sin proyectos todavía</p>`
      }
    `;
    document.getElementById("personal-project-add")?.addEventListener("click", async () => {
      const name = window.prompt("Nombre del proyecto:");
      if (!name?.trim()) return;
      try {
        await api("/api/personal/projects", { method: "POST", body: JSON.stringify({ name: name.trim() }) });
        await renderPersonalProyectos();
      } catch (err) {
        toast(err.message || "Error al crear");
      }
    });
    els.personalBody.querySelectorAll("[data-project-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.personalProjectView = btn.getAttribute("data-project-open");
        renderPersonalProjectWorkspace(state.personalProjectView);
      });
    });
  }

  async function renderPersonalProjectWorkspace(id) {
    const ws = await api(`/api/personal/projects/${encodeURIComponent(id)}`);
    els.personalBody.innerHTML = `
      <button type="button" class="dk-btn ghost" id="personal-project-back">← Proyectos</button>
      <h3 style="margin:10px 0 4px">📁 ${escHtml(ws.project.name)}</h3>
      <p class="sic-sub" style="margin:0 0 10px">${escHtml(ws.project.description || "Sin descripción")}</p>
      <p class="sic-sub">Tareas del proyecto (${ws.tasks.length})</p>
      ${ws.tasks.map(taskRowHtml).join("") || `<p class="sic-sub">Ninguna</p>`}
      <p class="sic-sub" style="margin-top:10px">Notas del proyecto (${ws.notes.length})</p>
      ${ws.notes.map((n) => `<div class="wf-box" style="text-align:left;margin-bottom:6px">🗒️ <strong>${escHtml(n.title || "(sin título)")}</strong><div class="wf-box-detail">${escHtml(n.body.slice(0, 140))}</div></div>`).join("") || `<p class="sic-sub">Ninguna</p>`}
      <p class="sic-sub" style="margin-top:10px">Decisiones del proyecto (${ws.decisions.length})</p>
      ${ws.decisions.map((d) => `<div class="wf-box" style="text-align:left;margin-bottom:6px">⚖️ <strong>${escHtml(d.title)}</strong><div class="wf-box-detail">${escHtml(d.decision)}</div></div>`).join("") || `<p class="sic-sub">Ninguna</p>`}
    `;
    document.getElementById("personal-project-back")?.addEventListener("click", () => {
      state.personalProjectView = null;
      renderPersonalProyectos();
    });
  }

  async function renderPersonalNotas() {
    const { notes } = await api("/api/personal/notes");
    els.personalBody.innerHTML = `
      <div class="docker-actions" style="margin-bottom:10px">
        <button type="button" class="dk-btn primary" id="personal-note-add">➕ Nueva nota</button>
      </div>
      ${
        notes
          .map(
            (n) => `<div class="docker-actions" style="justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div class="wf-box" style="text-align:left;flex:1">🗒️ <strong>${escHtml(n.title || "(sin título)")}</strong><div class="wf-box-detail">${escHtml(n.body.slice(0, 160))}</div></div>
        <button type="button" class="dk-btn danger" data-note-delete="${n.id}">🗑️</button>
      </div>`
          )
          .join("") || `<p class="sic-sub">Sin notas todavía</p>`
      }
    `;
    document.getElementById("personal-note-add")?.addEventListener("click", async () => {
      const title = window.prompt("Título de la nota:") || "";
      const body = window.prompt("Contenido:") || "";
      if (!title.trim() && !body.trim()) return;
      try {
        await api("/api/personal/notes", { method: "POST", body: JSON.stringify({ title, body }) });
        await renderPersonalNotas();
      } catch (err) {
        toast(err.message || "Error al crear");
      }
    });
    els.personalBody.querySelectorAll("[data-note-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await api(`/api/personal/notes/${btn.getAttribute("data-note-delete")}`, { method: "DELETE" });
          await renderPersonalNotas();
        } catch (err) {
          toast(err.message || "Error");
        }
      });
    });
  }

  async function renderPersonalDecisiones() {
    const { decisions } = await api("/api/personal/decisions");
    els.personalBody.innerHTML = `
      <div class="docker-actions" style="margin-bottom:10px">
        <button type="button" class="dk-btn primary" id="personal-decision-add">➕ Nueva decisión</button>
      </div>
      ${
        decisions
          .map(
            (d) => `<div class="docker-actions" style="justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div class="wf-box" style="text-align:left;flex:1">⚖️ <strong>${escHtml(d.title)}</strong><div class="wf-box-detail">${escHtml(d.decision)}</div>${d.context ? `<div class="wf-box-detail">Contexto: ${escHtml(d.context)}</div>` : ""}</div>
        <button type="button" class="dk-btn danger" data-decision-delete="${d.id}">🗑️</button>
      </div>`
          )
          .join("") || `<p class="sic-sub">Sin decisiones registradas</p>`
      }
    `;
    document.getElementById("personal-decision-add")?.addEventListener("click", async () => {
      const title = window.prompt("¿Qué se decidió (título)?") || "";
      const decision = window.prompt("¿Cuál fue la decisión?") || "";
      if (!title.trim() || !decision.trim()) return;
      try {
        await api("/api/personal/decisions", { method: "POST", body: JSON.stringify({ title, decision }) });
        await renderPersonalDecisiones();
      } catch (err) {
        toast(err.message || "Error al crear");
      }
    });
    els.personalBody.querySelectorAll("[data-decision-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await api(`/api/personal/decisions/${btn.getAttribute("data-decision-delete")}`, { method: "DELETE" });
          await renderPersonalDecisiones();
        } catch (err) {
          toast(err.message || "Error");
        }
      });
    });
  }

  async function renderPersonalRutinas() {
    const { routines } = await api("/api/personal/routines");
    els.personalBody.innerHTML = routines
      .map(
        (r) => `<div class="docker-actions" style="justify-content:space-between;margin-bottom:6px">
      <span style="flex:1">${escHtml(r.icon || "🧭")} ${escHtml(r.name)} <span class="sic-sub">(${r.steps.length} paso(s))</span></span>
      <button type="button" class="dk-btn primary" data-routine-run="${escHtml(r.id)}">▶️ Ejecutar</button>
    </div>`
      )
      .join("");
    els.personalBody.querySelectorAll("[data-routine-run]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          const result = await api(`/api/personal/routines/${btn.getAttribute("data-routine-run")}/run`, { method: "POST", body: "{}" });
          const ok = result.results.filter((r) => r.ok).length;
          toast(`Rutina "${result.routine}" ejecutada (${ok}/${result.results.length} pasos ok)`);
        } catch (err) {
          toast(err.message || "Error al ejecutar");
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  async function renderPersonalCalendario() {
    const data = await api("/api/personal/calendar").catch((err) => ({ error: err.message }));
    if (data.error) {
      els.personalBody.innerHTML = `<p class="tagline">${escHtml(data.error)}</p>`;
      return;
    }
    const fmt = (iso) => {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    };
    els.personalBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">📅 Próximos eventos de tu Google Calendar (solo lectura, nunca se mezcla con tus tareas).</p>
      ${
        data.events
          .map(
            (e) => `<div class="wf-box" style="text-align:left;margin-bottom:6px">📅 <strong>${escHtml(e.summary)}</strong><div class="wf-box-detail">${fmt(e.start)}${e.location ? ` · ${escHtml(e.location)}` : ""}</div></div>`
          )
          .join("") || `<p class="sic-sub">Sin eventos próximos</p>`
      }
    `;
  }

  async function renderPersonalAnalitica() {
    const a = await api("/api/personal/analytics");
    const tiles = [
      ecoTileHtml("✅", "Tareas", [`${a.tasks.pending} pendientes`, `${a.tasks.completedLast7d} completadas (7d)`, `${a.tasks.completedLast30d} completadas (30d)`]),
      ecoTileHtml("📁", "Proyectos", [`${a.projects.active}/${a.projects.total} activos`]),
      ecoTileHtml("🧭", "Rutinas", [`${a.routines.configured} configurada(s)`]),
      ecoTileHtml("⚙️", "Automatizaciones", [`${a.automations.configured} configurada(s)`]),
    ];
    els.personalBody.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${tiles.join("")}</div>`;
  }

  async function renderPersonalPrivacidad() {
    const { categories, aiPrivacyMode } = await api("/api/personal/privacy");
    els.personalBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">🔒 Mis Datos — qué guarda BMO de ti realmente.</p>
      ${categories
        .map(
          (c) => `<div class="docker-actions" style="justify-content:space-between;margin-bottom:6px">
        <span>${escHtml(c.label)}</span>
        <span class="sic-sub">${c.error ? "no disponible" : `${c.count} item(s)`}</span>
      </div>`
        )
        .join("")}
      <p class="sic-sub" style="margin-top:8px">Modo privacidad IA: ${aiPrivacyMode ? "activado" : "desactivado"}</p>
      <div class="docker-actions" style="margin-top:14px">
        <button type="button" class="dk-btn primary" id="personal-export-btn">⬇️ Exportar mis datos (JSON)</button>
      </div>
      <pre id="personal-export-output" class="sic-sub" style="white-space:pre-wrap;max-height:240px;overflow:auto;margin-top:10px;display:none;background:rgba(255,255,255,0.04);padding:8px;border-radius:6px"></pre>
    `;
    document.getElementById("personal-export-btn")?.addEventListener("click", async () => {
      try {
        const data = await api("/api/personal/export");
        const out = document.getElementById("personal-export-output");
        if (out) {
          out.textContent = JSON.stringify(data, null, 2);
          out.style.display = "block";
        }
        toast("Export generado abajo");
      } catch (err) {
        toast(err.message || "Error al exportar");
      }
    });
  }

  document.querySelectorAll("[data-personal-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.personalTab = btn.getAttribute("data-personal-tab");
      state.personalProjectView = null;
      document.querySelectorAll("[data-personal-tab]").forEach((b) => b.classList.toggle("active", b === btn));
      renderPersonalTab().catch((err) => toast(err.message || "Error"));
    });
  });

  els.personalBack?.addEventListener("click", () => {
    closePersonalPanel();
    openSysHub();
  });
  els.personalPanel?.addEventListener("click", (e) => {
    if (e.target === els.personalPanel) {
      closePersonalPanel();
      openSysHub();
    }
  });

  // —— 4.13.10/4.13.11 API pública / BMO Bridge ——
  // "BMO Bridge" del spec (aplicacion externa -> Bridge -> BMO Core) es en
  // la practica esta misma API publica con Bearer tokens: no se construyo
  // un concepto separado porque seria la misma pieza dos veces.
  els.publicapiPanel = document.getElementById("publicapi-panel");
  els.publicapiBody = document.getElementById("publicapi-body");
  els.publicapiBack = document.getElementById("publicapi-back");

  function closePublicApiPanel() {
    if (els.publicapiPanel) els.publicapiPanel.hidden = true;
  }

  async function renderPublicApiBody(justCreatedKey) {
    let data = { keys: [], scopes: {} };
    try {
      data = await api("/api/public-keys");
    } catch {
      /* se muestra vacio si falla */
    }

    const revealHtml = justCreatedKey
      ? `<div class="ai-ollama-note" style="color:#2ee59d;border-color:rgba(46,229,157,0.3);background:rgba(46,229,157,0.1)">
          <strong>Clave creada — cópiala ahora, no se volverá a mostrar:</strong><br>
          <code style="user-select:all;word-break:break-all">${escHtml(justCreatedKey)}</code>
        </div>`
      : "";

    const keysHtml = (data.keys || []).length
      ? data.keys
          .map(
            (k) => `<div class="integration-row integration-row--stub" style="align-items:flex-start">
        <span class="integration-ico">🔑</span>
        <span class="integration-info">
          <span class="integration-name">${escHtml(k.name)} ${
              k.revoked
                ? '<span class="docker-badge community">Revocada</span>'
                : '<span class="docker-badge official">Activa</span>'
            }</span>
          <span class="integration-detail">Scopes: ${escHtml((k.scopes || []).join(", "))} · ${k.rateLimitPerMin}/min${
              k.lastUsedAt ? " · último uso " + new Date(k.lastUsedAt).toLocaleString("es-ES") : " · sin usar"
            }</span>
        </span>
        ${!k.revoked ? `<button type="button" class="dk-btn ghost" data-revoke="${k.id}">Revocar</button>` : ""}
      </div>`
          )
          .join("")
      : `<p class="tagline">Sin claves todavía.</p>`;

    const scopeChecks = Object.keys(data.scopes || {})
      .map(
        (s) =>
          `<label class="ai-settings-check"><input type="checkbox" name="scope" value="${s}" checked /> ${escHtml(data.scopes[s])}</label>`
      )
      .join("");

    els.publicapiBody.innerHTML = `
      ${revealHtml}
      <p class="tagline" style="margin:0 0 8px">Para que tus propios proyectos (p.ej. SupermarketComparator) hablen con BMO sin acceso a Docker/sistema. Cada clave se autentica con "Authorization: Bearer &lt;clave&gt;".</p>
      <h3 style="margin:0 0 4px;font-size:14px">Claves</h3>
      <div class="integrations-list">${keysHtml}</div>
      <h3 style="margin:14px 0 4px;font-size:14px">Nueva clave</h3>
      <form id="publicapi-create-form" class="ai-settings-form">
        <label>Nombre <input type="text" name="name" placeholder="p.ej. SupermarketComparator" required /></label>
        ${scopeChecks}
        <label>Límite de peticiones/min <input type="number" name="rateLimitPerMin" value="30" min="1" max="600" /></label>
        <button type="submit" class="dk-btn">Crear clave</button>
      </form>
    `;

    els.publicapiBody.querySelectorAll("[data-revoke]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await api(`/api/public-keys/${btn.dataset.revoke}/revoke`, { method: "POST", body: "{}" });
          toast("Clave revocada");
          renderPublicApiBody();
        } catch (err) {
          toast(err.message || "Error al revocar");
        }
      });
    });

    document.getElementById("publicapi-create-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const scopes = fd.getAll("scope");
      try {
        const created = await api("/api/public-keys", {
          method: "POST",
          body: JSON.stringify({
            name: fd.get("name"),
            scopes,
            rateLimitPerMin: Number(fd.get("rateLimitPerMin")) || 30,
          }),
        });
        toast(`Clave "${created.name}" creada`);
        renderPublicApiBody(created.key);
      } catch (err) {
        toast(err.message || "Error al crear la clave");
      }
    });
  }

  async function openPublicApiPanel() {
    if (!els.publicapiPanel || !els.publicapiBody) {
      toast("API pública no disponible");
      return;
    }
    closeSysHub();
    els.publicapiPanel.hidden = false;
    els.publicapiBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await renderPublicApiBody();
  }

  els.publicapiBack?.addEventListener("click", () => {
    closePublicApiPanel();
    openSysHub();
  });
  els.publicapiPanel?.addEventListener("click", (e) => {
    if (e.target === els.publicapiPanel) {
      closePublicApiPanel();
      openSysHub();
    }
  });

  function closeSysPermsPanel() {
    if (els.sysPermsPanel) els.sysPermsPanel.hidden = true;
  }

  function openSysPermsHub() {
    if (!els.sysPermsPanel || !els.sysPermsBody) {
      toast("Permisos no cargado — recarga la página");
      return;
    }
    closeSysHub();
    els.sysPermsPanel.hidden = false;
    const plist = state.plugins || [];
    els.sysPermsBody.innerHTML = plist.length
      ? plist
          .map(
            (p) => `<button type="button" class="sys-list-row" data-perms-open="${escHtml(p.id)}">
        <span>${escHtml(p.name)}</span>
        <span class="chev">›</span>
      </button>`
          )
          .join("")
      : `<p class="tagline">No hay plugins instalados.</p>`;
  }

  function closeSysUsersPanel() {
    if (els.sysUsersPanel) els.sysUsersPanel.hidden = true;
  }

  async function openSysUsersPanel() {
    if (!els.sysUsersPanel || !els.sysUsersBody) {
      toast("Usuarios no cargado — recarga la página");
      return;
    }
    closeSysHub();
    els.sysUsersPanel.hidden = false;
    els.sysUsersBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await refreshSysUsers();
  }

  async function refreshSysUsers() {
    try {
      const data = await api("/api/users");
      state.sysUsers = data.users || [];
      renderSysUsersBody();
    } catch (err) {
      els.sysUsersBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
    }
  }

  function renderSysUsersBody() {
    const list = state.sysUsers || [];
    const roleLabel = { admin: "Administrador", invitado: "Invitado" };
    const rows = list.length
      ? list
          .map(
            (u) => `
      <div class="sys-list-row">
        <span>${escHtml(u.username)} <span class="sic-sub">· ${escHtml(roleLabel[u.role] || u.role)}</span></span>
        <button type="button" class="dk-btn ghost" data-user-del="${escHtml(u.id)}" aria-label="Eliminar cuenta">✕</button>
      </div>`
          )
          .join("")
      : `<p class="tagline">Sin cuentas todavía — crea la primera abajo.</p>`;

    els.sysUsersBody.innerHTML = `
      ${rows}
      <form id="sys-user-form" class="config-form" style="margin-top:16px">
        <div class="config-field"><label>Usuario
          <input type="text" id="su-username" required minlength="2" autocomplete="off" />
        </label></div>
        <div class="config-field"><label>Contraseña
          <input type="password" id="su-password" required minlength="8" autocomplete="new-password" />
        </label></div>
        <div class="config-field"><label>Rol
          <select id="su-role">
            <option value="invitado" selected>Invitado (Spotify y estado, sin Docker/energía)</option>
            <option value="admin">Administrador (acceso completo)</option>
          </select>
        </label></div>
        <button type="submit" class="config-save">Crear cuenta</button>
      </form>
      <p class="tagline" style="margin-top:12px">Estas cuentas son para el futuro acceso remoto — el kiosco sigue funcionando igual con la clave del dispositivo.</p>`;

    els.sysUsersBody.querySelector("#sys-user-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = els.sysUsersBody.querySelector("#su-username").value;
      const password = els.sysUsersBody.querySelector("#su-password").value;
      const role = els.sysUsersBody.querySelector("#su-role").value;
      try {
        await api("/api/users", {
          method: "POST",
          body: JSON.stringify({ username, password, role }),
        });
        toast("Cuenta creada");
        await refreshSysUsers();
      } catch (err) {
        toast(err.message || "Error creando cuenta");
      }
    });

    els.sysUsersBody.querySelectorAll("[data-user-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-user-del");
        try {
          await api(`/api/users/${id}`, { method: "DELETE" });
          toast("Cuenta eliminada");
          await refreshSysUsers();
        } catch (err) {
          toast(err.message || "Error eliminando cuenta");
        }
      });
    });
  }

  const MIPC_APPS = ["notepad", "steam", "spotify", "chrome", "code", "discord", "obs"];

  function mipcAppOptionsHtml(selected) {
    const catalog = (state.appCatalog || []).filter((a) => a.allowed !== false);
    if (!catalog.length) {
      return MIPC_APPS.map(
        (app) => `<option value="${app}" ${selected === app ? "selected" : ""}>${app}</option>`
      ).join("");
    }
    const order = ["desarrollo", "gaming", "multimedia", "sistema"];
    return order
      .map((cat) => {
        const items = catalog.filter((a) => a.category === cat);
        if (!items.length) return "";
        const opts = items
          .map(
            (a) => `<option value="${escHtml(a.id)}" ${selected === a.id ? "selected" : ""}>${escHtml(a.name)}</option>`
          )
          .join("");
        return `<optgroup label="${escHtml(APP_CATEGORY_LABELS[cat] || cat)}">${opts}</optgroup>`;
      })
      .join("");
  }
  const SPOTIFY_ACTIONS = [
    { value: "play", label: "Reproducir" },
    { value: "pause", label: "Pausar" },
    { value: "next", label: "Siguiente" },
    { value: "previous", label: "Anterior" },
    { value: "device", label: "Cambiar dispositivo" },
    { value: "volume", label: "Cambiar volumen" },
    { value: "play-context", label: "Reproducir playlist" },
  ];
  const MIPC_ACTIONS = [
    { value: "open-app", label: "Abrir aplicación" },
    { value: "close-app", label: "Cerrar aplicación" },
    { value: "sleep", label: "Suspender" },
    { value: "reboot", label: "Reiniciar" },
    { value: "shutdown", label: "Apagar" },
    { value: "wol", label: "Encender (WOL) y esperar" },
    { value: "set-estado", label: "Cambiar Estado BMO" },
  ];
  const DOCKER_ACTIONS = [
    { value: "start", label: "Iniciar contenedor" },
    { value: "restart", label: "Reiniciar contenedor" },
    { value: "stop", label: "Parar contenedor" },
    { value: "compose-deploy", label: "Redesplegar stack" },
  ];
  const BMO_ACTIONS = [
    { value: "message", label: "Mostrar mensaje (en Eventos)" },
    { value: "log", label: "Escribir en el log" },
    { value: "backup", label: "Backup de configuración" },
  ];
  const SYSTEM_ACTIONS = [{ value: "wait", label: "Esperar" }];

  function closeScenesPanel() {
    if (els.scenesPanel) els.scenesPanel.hidden = true;
  }

  async function openScenesPanel() {
    if (!els.scenesPanel || !els.scenesBody) {
      toast("Escenas no cargado — recarga la página");
      return;
    }
    closeSysHub();
    els.scenesPanel.hidden = false;
    state.scenesView = "list";
    state.sceneEditor = null;
    state.sceneRunResult = null;
    if (els.scenesTitle) els.scenesTitle.textContent = "Escenas";
    els.scenesBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    await refreshScenesList();
  }

  async function refreshScenesList() {
    try {
      const data = await api("/api/scenes");
      state.scenes = data.scenes || [];
      if (state.scenesView === "list") renderScenesBody();
    } catch (err) {
      els.scenesBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
    }
  }

  function actionSummary(a) {
    if (a.target === "spotify") {
      const label = (SPOTIFY_ACTIONS.find((x) => x.value === a.action) || {}).label || a.action;
      if (a.action === "device") return `Spotify · ${label}: ${escHtml(a.params?.deviceName || a.params?.deviceId || "")}`;
      if (a.action === "volume") return `Spotify · ${label}: ${escHtml(a.params?.volume ?? "")}`;
      if (a.action === "play-context") return `Spotify · ${label}: ${escHtml(a.params?.playlistName || a.params?.contextUri || "")}`;
      return `Spotify · ${label}`;
    }
    if (a.target === "docker") {
      const label = (DOCKER_ACTIONS.find((x) => x.value === a.action) || {}).label || a.action;
      const ref = a.action === "compose-deploy" ? a.params?.stackId : a.params?.container;
      return `Docker · ${label}: ${escHtml(ref || "")}`;
    }
    if (a.target === "bmo") {
      const label = (BMO_ACTIONS.find((x) => x.value === a.action) || {}).label || a.action;
      if (a.action === "backup") return `BMO · ${label}`;
      return `BMO · ${label}: ${escHtml(a.params?.text || "")}`;
    }
    if (a.target === "system") {
      if (a.action === "wait_until") {
        return `Sistema · Esperar hasta: ${escHtml(a.params?.deviceId || "")} = ${escHtml(a.params?.state || "")} (máx ${escHtml(a.params?.timeoutSeconds ?? "")}s)`;
      }
      if (a.action === "if") {
        const c = a.params?.condition || {};
        return `Sistema · SI ${escHtml(c.deviceId || c.container || "")} ${escHtml(c.type || "")}…`;
      }
      return `Sistema · Esperar: ${escHtml(a.params?.seconds ?? "")}s`;
    }
    const label = (MIPC_ACTIONS.find((x) => x.value === a.action) || {}).label || a.action;
    if (a.action === "open-app" || a.action === "close-app") {
      return `${escHtml(a.target)} · ${label}: ${escHtml(a.params?.app || "")}`;
    }
    if (a.action === "set-estado") {
      const meta = ESTADO_META[a.params?.estado] || {};
      return `${escHtml(a.target)} · ${label}: ${meta.emoji || ""} ${escHtml(meta.label || a.params?.estado || "")}`;
    }
    return `${escHtml(a.target)} · ${label}`;
  }

  function renderScenesBody() {
    if (els.scenesTitle) els.scenesTitle.textContent = "Escenas";
    const list = state.scenes || [];
    const cards = list.length
      ? list
          .map(
            (s) => `
      <div class="plugin-card">
        <div class="plugin-card-top">
          <div>
            <h3>${escHtml(s.icon || "✨")} ${escHtml(s.name)}</h3>
            <p>${escHtml(s.description || `${s.actions.length} acción${s.actions.length === 1 ? "" : "es"}`)}</p>
          </div>
        </div>
        <div class="docker-actions">
          <button type="button" class="dk-btn" data-scene-run="${escHtml(s.id)}">Ejecutar</button>
          <button type="button" class="dk-btn ghost" data-scene-flow="${escHtml(s.id)}">🔀 Diagrama</button>
          <button type="button" class="dk-btn ghost" data-scene-edit="${escHtml(s.id)}">Editar</button>
          <button type="button" class="dk-btn ghost danger" data-scene-del="${escHtml(s.id)}">Eliminar</button>
        </div>
      </div>`
          )
          .join("")
      : `<p class="tagline">Sin escenas todavía.</p>`;

    els.scenesBody.innerHTML = `
      ${cards}
      <div class="docker-actions" style="margin-top:16px">
        <button type="button" class="config-save" id="scene-create-btn">+ Crear escena</button>
        <button type="button" class="config-btn" id="scene-history-btn">Historial</button>
      </div>`;

    els.scenesBody.querySelectorAll("[data-scene-run]").forEach((btn) => {
      btn.addEventListener("click", () => runSceneFromPanel(btn.getAttribute("data-scene-run")));
    });
    els.scenesBody.querySelectorAll("[data-scene-flow]").forEach((btn) => {
      btn.addEventListener("click", () => openSceneFlowchartView(btn.getAttribute("data-scene-flow")));
    });
    els.scenesBody.querySelectorAll("[data-scene-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const scene = (state.scenes || []).find((s) => s.id === btn.getAttribute("data-scene-edit"));
        if (scene) openSceneEditor(scene);
      });
    });
    els.scenesBody.querySelectorAll("[data-scene-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await api(`/api/scenes/${btn.getAttribute("data-scene-del")}`, { method: "DELETE" });
          toast("Escena eliminada");
          await refreshScenesList();
        } catch (err) {
          toast(err.message || "Error eliminando escena");
        }
      });
    });
    els.scenesBody.querySelector("#scene-create-btn")?.addEventListener("click", () => openSceneEditor(null));
    els.scenesBody.querySelector("#scene-history-btn")?.addEventListener("click", () => openHistoryView());
  }

  function formatHistoryWhen(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mo} ${hh}:${mm}`;
  }

  function openSceneFlowchartView(sceneId) {
    const scene = (state.scenes || []).find((s) => s.id === sceneId);
    if (!scene || !els.scenesBody) return;
    if (els.scenesTitle) els.scenesTitle.textContent = "Diagrama";
    els.scenesBody.innerHTML = `
      <button type="button" class="dk-btn ghost" id="scene-flow-back">← Volver</button>
      <h3 style="margin:10px 0 4px">${escHtml(scene.icon || "✨")} ${escHtml(scene.name)}</h3>
      ${renderWorkflowFlowchartHtml(null, scene)}`;
    document.getElementById("scene-flow-back")?.addEventListener("click", () => {
      if (els.scenesTitle) els.scenesTitle.textContent = "Escenas";
      renderScenesBody();
    });
  }

  async function openHistoryView() {
    state.scenesView = "history";
    if (els.scenesTitle) els.scenesTitle.textContent = "Historial";
    els.scenesBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    try {
      const data = await api("/api/scenes/history?limit=50");
      state.scenesHistory = data.history || [];
      renderHistoryBody();
    } catch (err) {
      els.scenesBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
    }
  }

  function renderHistoryBody() {
    if (els.scenesTitle) els.scenesTitle.textContent = "Historial";
    const list = state.scenesHistory || [];
    const rows = list.length
      ? list
          .map(
            (h, idx) => `
      <button type="button" class="sys-list-row" data-history-idx="${idx}">
        <span>${escHtml(h.sceneIcon || "✨")} ${escHtml(h.sceneName)} <span class="sic-sub">${formatHistoryWhen(h.at)}</span></span>
        <span class="sic-sub">${automationRunStatusEmoji(h)} ${h.completed}/${h.total}</span>
      </button>`
          )
          .join("")
      : `<p class="tagline">Sin ejecuciones todavía.</p>`;

    els.scenesBody.innerHTML = `
      ${rows}
      <button type="button" class="config-btn" id="history-back-btn" style="margin-top:12px">← Volver a escenas</button>`;

    els.scenesBody.querySelectorAll("[data-history-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const h = list[Number(btn.getAttribute("data-history-idx"))];
        state.scenesView = "result";
        state.sceneResultFrom = "history";
        state.sceneRunResult = h;
        renderSceneResult();
      });
    });
    els.scenesBody.querySelector("#history-back-btn")?.addEventListener("click", () => {
      state.scenesView = "list";
      renderScenesBody();
    });
  }

  // 5.2.17 - dispara en segundo plano (run-async) y sondea la tarea, en vez
  // de dejar la petición HTTP colgada hasta el final (que con un
  // wait/wait_until puede tardar minutos) - mismo patrón que ya usa el
  // Remote Work Engine (pollRemoteWorkTask), aplicado aquí a escenas.
  async function runSceneFromPanel(id) {
    state.scenesView = "result";
    state.sceneResultFrom = "list";
    state.sceneRunResult = { sceneName: "…", steps: [], phase: "queued" };
    if (els.scenesTitle) els.scenesTitle.textContent = "Ejecutando…";
    els.scenesBody.innerHTML = `<p class="tagline">Poniendo en cola…</p>`;
    try {
      const { taskId } = await api(`/api/scenes/${id}/run-async`, { method: "POST", body: "{}" });
      pollSceneRunTask(taskId);
    } catch (err) {
      state.scenesView = "list";
      toast(err.message || "Error ejecutando escena");
      await refreshScenesList();
    }
  }

  function pollSceneRunTask(taskId) {
    if (state.sceneRunTimer) clearInterval(state.sceneRunTimer);
    state.sceneRunTaskId = taskId;
    const tick = async () => {
      let task;
      try {
        ({ task } = await api(`/api/tasks/${taskId}`));
      } catch {
        return; // sondeo transitorio
      }
      if (!task) return;
      state.sceneRunResult = { ...(task.detail || {}), taskStatus: task.status };
      renderSceneResult();
      if (task.status !== "running") {
        clearInterval(state.sceneRunTimer);
        state.sceneRunTimer = null;
        state.sceneRunTaskId = null;
      }
    };
    tick();
    state.sceneRunTimer = setInterval(tick, 2000);
  }

  async function cancelSceneRun() {
    if (!state.sceneRunTaskId) return;
    try {
      await api(`/api/scenes/runs/${state.sceneRunTaskId}/cancel`, { method: "POST", body: "{}" });
      toast("Cancelando…");
    } catch (err) {
      toast(err.message || "No se pudo cancelar");
    }
  }

  // 5.2.4 - un paso "if" trae su propia sub-lista de pasos (la rama que se
  // eligió) - se renderiza igual que cualquier fila, pero anidada, para que
  // se vea qué rama se tomó y qué hizo, no solo "condición cumplida".
  function stepRowHtml(s, depth) {
    const indent = depth > 0 ? `style="margin-left:${depth * 16}px"` : "";
    if (s.blocked) {
      return `<div class="sys-list-row blocked" ${indent}>
        <span>⚠️ Acción bloqueada — ${actionSummary(s)}</span>
        <span class="sic-sub">Falta el permiso "${escHtml(s.permission)}" en este dispositivo</span>
      </div>`;
    }
    const icon = s.status === "cancelled" ? "⏹" : s.status === "timeout" ? "⏱" : s.status === "skipped" ? "⏭️" : s.ok ? "✓" : s.recoveryFailed ? "🔴" : "✗";
    const row = `<div class="sys-list-row" ${indent}>
        <span>${icon} ${actionSummary(s)}</span>
        <span class="sic-sub">${escHtml(s.detail || "")}</span>
      </div>`;
    if (s.target === "system" && s.action === "if" && Array.isArray(s.steps)) {
      return row + s.steps.map((sub) => stepRowHtml(sub, depth + 1)).join("");
    }
    return row;
  }

  function renderSceneResult() {
    const r = state.sceneRunResult;
    if (els.scenesTitle) els.scenesTitle.textContent = r.sceneName || "Resultado";
    const running = r.taskStatus === "running";
    if (running && (r.phase === "queued" || r.phase === "running") && !(r.steps || []).length) {
      els.scenesBody.innerHTML = `<p class="tagline">${r.phase === "queued" ? "En cola…" : "Ejecutando…"}</p>`;
      return;
    }
    if (running && r.phase === "waiting") {
      const cs = r.currentStep || {};
      const waitTxt =
        cs.action === "wait_until"
          ? `esperando ${escHtml(cs.params?.deviceId || "")} = ${escHtml(cs.params?.state || "")}`
          : "esperando";
      els.scenesBody.innerHTML = `
        <p class="tagline scene-result-status warn">🟡 ${escHtml((r.sceneName || "Escena").toUpperCase())} — ${waitTxt}…</p>
        ${(r.steps || []).map((s) => stepRowHtml(s, 0)).join("")}
        <div class="docker-actions" style="margin-top:12px">
          <button type="button" class="danger" id="scene-result-cancel">⏹ Cancelar</button>
        </div>`;
      els.scenesBody.querySelector("#scene-result-cancel")?.addEventListener("click", cancelSceneRun);
      return;
    }
    const rows = (r.steps || []).map((s) => stepRowHtml(s, 0)).join("");
    const total = r.total || (r.steps || []).length;
    const completed = r.completed ?? (r.steps || []).filter((s) => s.ok).length;
    const failedSteps = (r.steps || []).filter((s) => !s.ok);
    const nameUpper = escHtml((r.sceneName || "Escena").toUpperCase());
    let statusLine;
    if (r.phase === "cancelled") {
      statusLine = `<p class="tagline scene-result-status warn" style="margin-top:12px">⏹ ${nameUpper} CANCELADO</p>`;
    } else if (completed === total && total > 0) {
      statusLine = `<p class="tagline scene-result-status ok" style="margin-top:12px">✓ ${nameUpper} COMPLETADO</p>`;
    } else if (completed > 0) {
      statusLine = `<p class="tagline scene-result-status warn" style="margin-top:12px">⚠️ ${nameUpper} PARCIAL</p>`;
    } else {
      statusLine = `<p class="tagline scene-result-status fail" style="margin-top:12px">✗ ${nameUpper} FALLIDO</p>`;
    }
    const failSummary = failedSteps.length
      ? `<p class="tagline">${failedSteps.map((s) => `✗ ${actionSummary(s)}${s.detail ? `: ${escHtml(s.detail)}` : ""}`).join("<br>")}</p>`
      : "";
    const backLabel = state.sceneResultFrom === "history" ? "← Volver al historial" : "← Volver a escenas";
    const retryBtn =
      state.sceneResultFrom !== "history" && r.sceneId && completed < total
        ? `<button type="button" class="dk-btn" id="scene-result-retry">🔄 Reintentar</button>`
        : "";
    els.scenesBody.innerHTML = `
      ${statusLine}
      <p class="tagline">${completed}/${total} acciones completadas</p>
      ${failSummary}
      ${rows}
      <div class="docker-actions" style="margin-top:12px">
        ${retryBtn}
        <button type="button" class="config-btn" id="scene-result-back">${completed < total ? "Continuar" : backLabel}</button>
      </div>`;
    els.scenesBody.querySelector("#scene-result-retry")?.addEventListener("click", () => {
      runSceneFromPanel(r.sceneId).catch((err) => toast(err.message || "Error"));
    });
    els.scenesBody.querySelector("#scene-result-back")?.addEventListener("click", () => {
      if (state.sceneResultFrom === "history") {
        openHistoryView();
      } else {
        state.scenesView = "list";
        renderScenesBody();
      }
    });
  }

  function openSceneEditor(scene) {
    state.scenesView = "editor";
    state.sceneEditor = scene
      ? { id: scene.id, name: scene.name, icon: scene.icon, description: scene.description, actions: scene.actions.map((a) => ({ ...a, params: { ...a.params } })) }
      : { id: null, name: "", icon: "✨", description: "", actions: [] };
    renderSceneEditor();
  }

  function actionParamFieldHtml(idx, a) {
    if (a.target === "mi-pc" && (a.action === "open-app" || a.action === "close-app")) {
      return `<label>App
        <select data-act-param="app" data-act-idx="${idx}">
          ${mipcAppOptionsHtml(a.params?.app)}
        </select>
      </label>`;
    }
    if (a.target === "mi-pc" && a.action === "set-estado") {
      return `<label>Estado
        <select data-act-param="estado" data-act-idx="${idx}">
          ${Object.entries(ESTADO_META)
            .map(
              ([key, meta]) =>
                `<option value="${key}" ${a.params?.estado === key ? "selected" : ""}>${meta.emoji} ${meta.label}</option>`
            )
            .join("")}
        </select>
      </label>`;
    }
    if (a.target === "spotify" && a.action === "device") {
      return `<label>Dispositivo Spotify
        <select data-act-param="deviceId" data-act-idx="${idx}" data-needs-devices="1">
          <option value="${escHtml(a.params?.deviceId || "")}">${escHtml(a.params?.deviceName || "Cargando…")}</option>
        </select>
      </label>`;
    }
    if (a.target === "spotify" && a.action === "volume") {
      return `<label>Volumen (0-100)
        <input type="number" min="0" max="100" data-act-param="volume" data-act-idx="${idx}" value="${a.params?.volume ?? 50}" />
      </label>`;
    }
    if (a.target === "spotify" && a.action === "play-context") {
      return `<label>Playlist
        <select data-act-param="contextUri" data-act-idx="${idx}" data-needs-playlists="1">
          <option value="${escHtml(a.params?.contextUri || "")}">${escHtml(a.params?.playlistName || "Cargando…")}</option>
        </select>
      </label>`;
    }
    if (a.target === "docker") {
      return `<label>Contenedor
        <select data-act-param="container" data-act-idx="${idx}" data-needs-containers="1">
          <option value="${escHtml(a.params?.container || "")}">${escHtml(a.params?.container || "Cargando…")}</option>
        </select>
      </label>`;
    }
    if (a.target === "bmo" && a.action === "message") {
      return `<label>Mensaje
        <input type="text" data-act-param="text" data-act-idx="${idx}" value="${escHtml(a.params?.text || "")}" />
      </label>`;
    }
    if (a.target === "system" && a.action === "wait") {
      return `<label>Segundos
        <input type="number" min="1" max="300" data-act-param="seconds" data-act-idx="${idx}" value="${a.params?.seconds ?? 5}" />
      </label>`;
    }
    return "";
  }

  function renderSceneEditor() {
    const draft = state.sceneEditor;
    if (els.scenesTitle) els.scenesTitle.textContent = draft.id ? "Editar escena" : "Nueva escena";

    const actionOptionsByTarget = {
      spotify: SPOTIFY_ACTIONS,
      docker: DOCKER_ACTIONS,
      bmo: BMO_ACTIONS,
      "mi-pc": MIPC_ACTIONS,
      system: SYSTEM_ACTIONS,
    };
    const actionsHtml = draft.actions
      .map((a, idx) => {
        const actionOptions = actionOptionsByTarget[a.target] || MIPC_ACTIONS;
        return `<div class="plugin-card" style="margin-bottom:10px">
          <div class="docker-actions" style="justify-content:space-between">
            <strong>Acción ${idx + 1}</strong>
            <button type="button" class="dk-btn ghost danger" data-act-remove="${idx}">Quitar</button>
          </div>
          <label>Destino
            <select data-act-target="${idx}">
              <option value="mi-pc" ${a.target === "mi-pc" ? "selected" : ""}>MI-PC</option>
              <option value="spotify" ${a.target === "spotify" ? "selected" : ""}>Spotify</option>
              <option value="docker" ${a.target === "docker" ? "selected" : ""}>Docker</option>
              <option value="bmo" ${a.target === "bmo" ? "selected" : ""}>BMO</option>
              <option value="system" ${a.target === "system" ? "selected" : ""}>Sistema (esperar)</option>
            </select>
          </label>
          <label>Acción
            <select data-act-action="${idx}">
              ${actionOptions.map((o) => `<option value="${o.value}" ${a.action === o.value ? "selected" : ""}>${o.label}</option>`).join("")}
            </select>
          </label>
          ${actionParamFieldHtml(idx, a)}
        </div>`;
      })
      .join("");

    els.scenesBody.innerHTML = `
      <form id="scene-editor-form" class="config-form">
        <label>Nombre
          <input type="text" id="se-name" required value="${escHtml(draft.name)}" />
        </label>
        <label>Icono (emoji)
          <input type="text" id="se-icon" maxlength="4" value="${escHtml(draft.icon)}" />
        </label>
        <label>Descripción
          <input type="text" id="se-description" value="${escHtml(draft.description)}" />
        </label>
      </form>
      <div id="scene-actions-list">${actionsHtml || `<p class="tagline">Sin acciones — añade la primera abajo.</p>`}</div>
      <button type="button" class="dk-btn" id="scene-add-action" style="margin-top:8px">+ Añadir acción</button>
      <div class="docker-actions" style="margin-top:16px">
        <button type="button" class="config-save" id="scene-editor-save">Guardar escena</button>
        <button type="button" class="config-btn" id="scene-editor-cancel">Cancelar</button>
      </div>`;

    // rellenar dispositivos Spotify reales si hace falta
    els.scenesBody.querySelectorAll("[data-needs-devices]").forEach(async (sel) => {
      try {
        const res = await api("/api/spotify/devices");
        const devices = res.devices || [];
        const idx = Number(sel.getAttribute("data-act-idx"));
        const current = draft.actions[idx]?.params?.deviceId || "";
        sel.innerHTML = devices
          .map((d) => `<option value="${escHtml(d.id)}" ${d.id === current ? "selected" : ""}>${escHtml(d.name)}</option>`)
          .join("") || `<option value="">Sin dispositivos Spotify activos</option>`;
      } catch {
        sel.innerHTML = `<option value="">No se pudo cargar dispositivos</option>`;
      }
    });

    // rellenar playlists de Spotify reales si hace falta
    els.scenesBody.querySelectorAll("[data-needs-playlists]").forEach(async (sel) => {
      try {
        const res = await api("/api/spotify/playlists");
        const playlists = res.items || [];
        const idx = Number(sel.getAttribute("data-act-idx"));
        const current = draft.actions[idx]?.params?.contextUri || "";
        sel.innerHTML = playlists
          .map((p) => `<option value="${escHtml(p.uri)}" ${p.uri === current ? "selected" : ""}>${escHtml(p.name)}</option>`)
          .join("") || `<option value="">Sin playlists en tu cuenta</option>`;
      } catch {
        sel.innerHTML = `<option value="">No se pudo cargar playlists</option>`;
      }
    });

    // rellenar contenedores Docker reales si hace falta
    els.scenesBody.querySelectorAll("[data-needs-containers]").forEach(async (sel) => {
      try {
        const res = await api("/api/docker/containers");
        const containers = res.containers || [];
        const idx = Number(sel.getAttribute("data-act-idx"));
        const current = draft.actions[idx]?.params?.container || "";
        sel.innerHTML = containers
          .map(
            (c) =>
              `<option value="${escHtml(c.name)}" ${c.name === current ? "selected" : ""}>${escHtml(c.name)}${c.protected ? " 🔒" : ""}</option>`
          )
          .join("") || `<option value="">Sin contenedores</option>`;
      } catch {
        sel.innerHTML = `<option value="">No se pudo cargar contenedores</option>`;
      }
    });

    const defaultActionByTarget = { spotify: "play", docker: "restart", bmo: "message", "mi-pc": "open-app", system: "wait" };
    els.scenesBody.querySelectorAll("[data-act-target]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const idx = Number(sel.getAttribute("data-act-target"));
        draft.actions[idx].target = sel.value;
        draft.actions[idx].action = defaultActionByTarget[sel.value] || "open-app";
        draft.actions[idx].params = {};
        renderSceneEditor();
      });
    });
    els.scenesBody.querySelectorAll("[data-act-action]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const idx = Number(sel.getAttribute("data-act-action"));
        draft.actions[idx].action = sel.value;
        draft.actions[idx].params = {};
        renderSceneEditor();
      });
    });
    els.scenesBody.querySelectorAll("[data-act-param]").forEach((input) => {
      input.addEventListener("change", () => {
        const idx = Number(input.getAttribute("data-act-idx"));
        const key = input.getAttribute("data-act-param");
        let value = input.value;
        if (key === "volume" || key === "seconds") value = Number(value);
        draft.actions[idx].params[key] = value;
        if (key === "deviceId") {
          draft.actions[idx].params.deviceName = input.options[input.selectedIndex]?.textContent || "";
        }
        if (key === "contextUri") {
          draft.actions[idx].params.playlistName = input.options[input.selectedIndex]?.textContent || "";
        }
      });
    });
    els.scenesBody.querySelectorAll("[data-act-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        draft.actions.splice(Number(btn.getAttribute("data-act-remove")), 1);
        renderSceneEditor();
      });
    });
    els.scenesBody.querySelector("#scene-add-action")?.addEventListener("click", () => {
      draft.actions.push({ target: "mi-pc", action: "open-app", params: {} });
      renderSceneEditor();
    });
    els.scenesBody.querySelector("#scene-editor-cancel")?.addEventListener("click", () => {
      state.scenesView = "list";
      renderScenesBody();
    });
    els.scenesBody.querySelector("#scene-editor-save")?.addEventListener("click", async () => {
      draft.name = els.scenesBody.querySelector("#se-name").value;
      draft.icon = els.scenesBody.querySelector("#se-icon").value;
      draft.description = els.scenesBody.querySelector("#se-description").value;
      try {
        const body = { name: draft.name, icon: draft.icon, description: draft.description, actions: draft.actions };
        if (draft.id) {
          await api(`/api/scenes/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
        } else {
          await api("/api/scenes", { method: "POST", body: JSON.stringify(body) });
        }
        toast("Escena guardada");
        state.scenesView = "list";
        await refreshScenesList();
      } catch (err) {
        toast(err.message || "Error guardando escena");
      }
    });
  }

  const METRIC_OPTIONS = [
    { value: "cpu", label: "CPU %" },
    { value: "ram", label: "RAM %" },
    { value: "disk", label: "Disco %" },
    { value: "temp", label: "Temperatura" },
    { value: "gpuTemp", label: "Temperatura GPU" },
  ];

  function closeAutomationsPanel() {
    if (els.automationsPanel) els.automationsPanel.hidden = true;
  }

  async function openAutomationsPanel() {
    if (!els.automationsPanel || !els.automationsBody) {
      toast("Automatizaciones no cargado — recarga la página");
      return;
    }
    closeSysHub();
    els.automationsPanel.hidden = false;
    els.automationsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    try {
      const [autoData, sceneData, devicesData, dockerData, permsData, favData] = await Promise.all([
        api("/api/automations"),
        api("/api/scenes"),
        api("/api/devices"),
        api("/api/docker").catch(() => null),
        api("/api/permissions").catch(() => null),
        api("/api/ui/favorites").catch(() => null),
      ]);
      state.automations = autoData.automations || [];
      state.automationScenes = sceneData.scenes || [];
      state.automationDevices = devicesData.devices || [];
      if (favData) state.automationFavorites = favData.automations || [];
      if (dockerData) state.docker = dockerData;
      if (permsData) state.globalPermissions = permsData;
      renderAutomationsBody();
    } catch (err) {
      els.automationsBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
    }
  }

  const DAY_LABELS = { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D" };

  function conditionSummary(c) {
    if (!c) return "";
    let base = conditionSummaryCore(c);
    if (c.negate) base = `NO (${base})`;
    if (c.debounceSeconds) base = `${base}, confirmado ${c.debounceSeconds}s`;
    return base;
  }

  function conditionSummaryCore(c) {
    if (c.type === "device_status") {
      return `${escHtml(c.deviceId)} pasa a ${c.state === "online" ? "online" : "offline"}`;
    }
    if (c.type === "schedule") {
      const days = c.days === "all" ? "todos los días" : (c.days || []).map((d) => DAY_LABELS[d] || d).join(",");
      return `a las ${escHtml(c.time)} (${days})`;
    }
    if (c.type === "idle_threshold") {
      const mins = Math.round((Number(c.value) || 0) / 60);
      return `${escHtml(c.deviceId)} · inactivo ${c.operator === "gt" ? ">" : "<"} ${mins} min`;
    }
    if (c.type === "uptime") {
      return `${escHtml(c.deviceId)} · encendido ${c.operator === "gt" ? ">" : "<"} ${c.value}h`;
    }
    if (c.type === "time_window") {
      const days = c.days === "all" ? "todos los días" : (c.days || []).map((d) => DAY_LABELS[d] || d).join(",");
      return `hora ${c.operator === "gt" ? ">" : "<"} ${escHtml(c.time)} (${days})`;
    }
    if (c.type === "docker_status") {
      return `Docker ${escHtml(c.container)} ${c.state === "running" ? "en ejecución" : "detenido"}`;
    }
    if (c.type === "docker_health") {
      return `Docker ${escHtml(c.container)} · salud: ${escHtml(c.health)}`;
    }
    if (c.type === "interval") {
      return `cada ${c.minutes} min`;
    }
    if (c.type === "spotify_playing") {
      return `Spotify ${c.playing !== false ? "reproduciendo" : "parado"}`;
    }
    if (c.type === "process_running") {
      return `${escHtml(c.deviceId)} · ${escHtml(c.processName)} ${c.running ? "abierto" : "cerrado"}`;
    }
    // 6.5.5 - BUG REAL encontrado al construir el diagrama de flujo: estos
    // dos tipos (event_fired de 4.13.8, context de 6.3.5) no tenian caso
    // propio aqui - caian al fallback generico de metric_threshold de mas
    // abajo, que asume deviceId/metric/operator/value y por tanto mostraba
    // literalmente "undefined · undefined > undefined" para cualquier
    // automatizacion con estas condiciones. Bug silencioso desde que se
    // añadio "context" en 6.3, solo visible ahora al mostrar condiciones de
    // forma mas prominente.
    if (c.type === "event_fired") {
      return `ocurre el evento "${escHtml(c.eventType)}"`;
    }
    if (c.type === "context") {
      return `el contexto de BMO ${c.op === "neq" ? "deja de ser" : "pasa a ser"} ${escHtml(c.value)}`;
    }
    const metricLabel = (METRIC_OPTIONS.find((m) => m.value === c.metric) || {}).label || c.metric;
    return `${escHtml(c.deviceId)} · ${metricLabel} ${c.operator === "gt" ? ">" : "<"} ${c.value}`;
  }

  function automationSummary(a) {
    const parts = (a.conditions || []).map(conditionSummary);
    const joiner = a.combinator === "OR" ? " O " : " Y ";
    return parts.join(joiner);
  }

  // 6.5.5 - Workflow Builder: diagrama de flujo REAL (no un editor de nodos
  // arrastrables - en una pantalla de 480px de ancho eso seria peor que el
  // formulario que ya existe, no mejor) - una vista de solo lectura que
  // dibuja Trigger->Acciones(con ramas SI/NO reales)->Resultado en vertical,
  // reutilizando actionSummary/conditionSummary/automationSummary tal cual
  // ya las usa el resto del panel, para que el texto sea identico al que ya
  // ve el usuario en las listas.
  function workflowActionIcon(a) {
    if (a.target === "docker") return "🐳";
    if (a.target === "spotify") return "🎵";
    if (a.target === "bmo") return "🤖";
    if (a.target === "system") return "⏱️";
    return "💻";
  }

  function workflowActionBoxHtml(a, depth) {
    const indentStyle = depth > 0 ? ` style="margin-left:${depth * 14}px"` : "";
    if (a.target === "system" && a.action === "if") {
      const c = a.params?.condition || {};
      const thenSteps = a.params?.then || [];
      const elseSteps = a.params?.else || [];
      return `<div class="wf-box wf-branch"${indentStyle}>🔀 <strong>¿${escHtml(conditionSummary(c))}?</strong></div>
        <div class="wf-branch-block">
          <div class="wf-branch-label">SÍ ↓</div>
          ${thenSteps.length ? thenSteps.map((s) => workflowFlowStepHtml(s, depth + 1)).join("") : '<p class="wf-empty">(nada)</p>'}
          ${
            elseSteps.length
              ? `<div class="wf-branch-label">NO ↓</div>${elseSteps.map((s) => workflowFlowStepHtml(s, depth + 1)).join("")}`
              : ""
          }
        </div>`;
    }
    return `<div class="wf-box wf-action"${indentStyle}>${workflowActionIcon(a)} <strong>${escHtml(actionSummary(a))}</strong></div>`;
  }

  function workflowFlowStepHtml(a, depth) {
    return workflowActionBoxHtml(a, depth) + '<div class="wf-arrow">↓</div>';
  }

  function renderWorkflowFlowchartHtml(automation, scene) {
    const parts = [];
    if (automation) {
      parts.push(
        `<div class="wf-box wf-trigger">⚡ <strong>TRIGGER</strong><div class="wf-box-detail">Cuando ${escHtml(automationSummary(automation))} (${automation.combinator === "OR" ? "cualquiera" : "todas"})</div></div>`
      );
    } else {
      parts.push(`<div class="wf-box wf-trigger">👆 <strong>MANUAL</strong><div class="wf-box-detail">Se ejecuta al pulsar "Ejecutar"</div></div>`);
    }
    parts.push('<div class="wf-arrow">↓</div>');
    const actions = (scene && scene.actions) || [];
    if (!actions.length) {
      parts.push('<p class="wf-empty">(sin acciones)</p>');
    } else {
      actions.forEach((a, i) => {
        parts.push(workflowActionBoxHtml(a, 0));
        if (i < actions.length - 1) parts.push('<div class="wf-arrow">↓</div>');
      });
    }
    parts.push('<div class="wf-arrow">↓</div>');
    parts.push('<div class="wf-box wf-result">🟢 <strong>RESULTADO</strong></div>');
    return `<div class="wf-flow">${parts.join("")}</div>`;
  }

  function openAutomationFlowchartView(automationId) {
    const automation = (state.automations || []).find((a) => a.id === automationId);
    if (!automation || !els.automationsBody) return;
    const scene = (state.automationScenes || []).find((s) => s.id === automation.sceneId);
    if (els.automationsTitle) els.automationsTitle.textContent = "Diagrama";
    els.automationsBody.innerHTML = `
      <button type="button" class="dk-btn ghost" id="auto-flow-back">← Volver</button>
      <h3 style="margin:10px 0 4px">${escHtml(automation.name)}</h3>
      ${renderWorkflowFlowchartHtml(automation, scene)}`;
    document.getElementById("auto-flow-back")?.addEventListener("click", () => {
      if (els.automationsTitle) els.automationsTitle.textContent = "Automatizaciones";
      renderAutomationsBody();
    });
  }

  function newAutomationDraft() {
    return {
      id: null,
      name: "",
      sceneId: (state.automationScenes && state.automationScenes[0] && state.automationScenes[0].id) || "",
      combinator: "AND",
      enabled: true,
      conditions: [{ type: "device_status", deviceId: (state.automationDevices?.[0]?.id) || "mi-pc", state: "online" }],
    };
  }

  function automationEditDraft(a) {
    return {
      id: a.id,
      name: a.name,
      sceneId: a.sceneId,
      combinator: a.combinator,
      enabled: a.enabled,
      conditions: (a.conditions || []).map((c) => ({ ...c })),
    };
  }

  function renderAutomationsBody() {
    const list = state.automations || [];
    const scenesById = Object.fromEntries((state.automationScenes || []).map((s) => [s.id, s]));
    const editing = state.automationsView === "edit" && state.automationEditingId;
    const rows = editing
      ? ""
      : list.length
      ? list
          .map((a) => {
            const scene = scenesById[a.sceneId];
            const isFavAuto = (state.automationFavorites || []).includes(a.id);
            return `<div class="plugin-card">
        <div class="plugin-card-top" style="display:flex;align-items:flex-start;gap:6px">
          <button type="button" class="dk-btn ghost" style="text-align:left;padding:0;border:none;background:none;display:block;width:100%;flex:1" data-auto-open="${escHtml(a.id)}">
            <h3>${a.enabled ? "🟢" : "⚪"} ${escHtml(a.name)}</h3>
            <p>Cuando ${automationSummary(a)} → escena "${escHtml(scene ? scene.name : "?")}"</p>
          </button>
          <button type="button" class="dk-btn ghost" style="padding:6px 10px;flex-shrink:0" data-auto-fav="${escHtml(a.id)}" aria-label="Favorito">${isFavAuto ? "⭐" : "☆"}</button>
        </div>
        <div class="docker-actions">
          <button type="button" class="dk-btn ghost" data-auto-flow="${escHtml(a.id)}">🔀 Diagrama</button>
          <button type="button" class="dk-btn ghost" data-auto-toggle="${escHtml(a.id)}">${a.enabled ? "Desactivar" : "Activar"}</button>
          <button type="button" class="dk-btn ghost danger" data-auto-del="${escHtml(a.id)}">Eliminar</button>
        </div>
      </div>`;
          })
          .join("")
      : `<p class="tagline">Sin automatizaciones todavía.</p>`;

    if (!state.automationScenes || !state.automationScenes.length) {
      els.automationsBody.innerHTML = `
        ${rows}
        <p class="tagline" style="margin-top:16px">Crea primero una escena en "Escenas" — una automatización necesita una escena que ejecutar.</p>`;
      return;
    }

    if (!state.automationDraft) state.automationDraft = newAutomationDraft();
    const draft = state.automationDraft;

    const deviceOptions = (state.automationDevices || [])
      .map((d) => `<option value="${escHtml(d.id)}">${escHtml(d.name || d.id)}</option>`)
      .join("");
    const sceneOptions = (state.automationScenes || [])
      .map((s) => `<option value="${escHtml(s.id)}" ${s.id === draft.sceneId ? "selected" : ""}>${escHtml(s.name)}</option>`)
      .join("");

    const conditionsHtml = draft.conditions
      .map((c, idx) => {
        let paramsHtml;
        if (c.type === "device_status") {
          paramsHtml = `<label>Pasa a
                <select data-c-state="${idx}">
                  <option value="online" ${c.state === "online" ? "selected" : ""}>Online</option>
                  <option value="offline" ${c.state === "offline" ? "selected" : ""}>Offline</option>
                </select>
              </label>`;
        } else if (c.type === "schedule") {
          const activeDays = c.days === "all" ? Object.keys(DAY_LABELS) : c.days || [];
          paramsHtml = `<label>Hora
                <input type="time" data-c-time="${idx}" value="${escHtml(c.time || "21:00")}" />
              </label>
              <label>Días</label>
              <div class="docker-actions">
                ${Object.entries(DAY_LABELS)
                  .map(
                    ([key, label]) =>
                      `<label style="display:flex;align-items:center;gap:4px;flex-direction:row">
                        <input type="checkbox" data-c-day="${idx}" value="${key}" ${activeDays.includes(key) ? "checked" : ""} style="width:auto" />${label}
                      </label>`
                  )
                  .join("")}
              </div>`;
        } else if (c.type === "time_window") {
          const activeDays = c.days === "all" ? Object.keys(DAY_LABELS) : c.days || [];
          paramsHtml = `<label>Condición
                <select data-c-operator="${idx}">
                  <option value="gt" ${c.operator === "gt" ? "selected" : ""}>Después de</option>
                  <option value="lt" ${c.operator === "lt" ? "selected" : ""}>Antes de</option>
                </select>
              </label>
              <label>Hora
                <input type="time" data-c-time="${idx}" value="${escHtml(c.time || "18:00")}" />
              </label>
              <label>Días</label>
              <div class="docker-actions">
                ${Object.entries(DAY_LABELS)
                  .map(
                    ([key, label]) =>
                      `<label style="display:flex;align-items:center;gap:4px;flex-direction:row">
                        <input type="checkbox" data-c-day="${idx}" value="${key}" ${activeDays.includes(key) ? "checked" : ""} style="width:auto" />${label}
                      </label>`
                  )
                  .join("")}
              </div>`;
        } else if (c.type === "interval") {
          paramsHtml = `<label>Minutos
                <input type="number" min="1" max="1440" data-c-minutes="${idx}" value="${c.minutes ?? 30}" />
              </label>`;
        } else if (c.type === "docker_status") {
          const containers = (state.docker && state.docker.containers) || [];
          paramsHtml = `<label>Contenedor
                <select data-c-container="${idx}">${containers.map((ct) => `<option value="${escHtml(ct.name)}" ${c.container === ct.name ? "selected" : ""}>${escHtml(ct.name)}</option>`).join("")}</select>
              </label>
              <label>Estado
                <select data-c-docker-state="${idx}">
                  <option value="running" ${c.state === "running" ? "selected" : ""}>En ejecución</option>
                  <option value="stopped" ${c.state === "stopped" ? "selected" : ""}>Detenido</option>
                </select>
              </label>`;
        } else if (c.type === "docker_health") {
          const containers = (state.docker && state.docker.containers) || [];
          paramsHtml = `<label>Contenedor
                <select data-c-container="${idx}">${containers.map((ct) => `<option value="${escHtml(ct.name)}" ${c.container === ct.name ? "selected" : ""}>${escHtml(ct.name)}</option>`).join("")}</select>
              </label>
              <label>Salud
                <select data-c-docker-health="${idx}">
                  <option value="healthy" ${c.health === "healthy" ? "selected" : ""}>Saludable</option>
                  <option value="unhealthy" ${c.health === "unhealthy" ? "selected" : ""}>No saludable</option>
                  <option value="starting" ${c.health === "starting" ? "selected" : ""}>Arrancando</option>
                  <option value="none" ${c.health === "none" ? "selected" : ""}>Sin healthcheck</option>
                </select>
              </label>`;
        } else if (c.type === "spotify_playing") {
          paramsHtml = `<label>Estado
                <select data-c-spotify-playing="${idx}">
                  <option value="1" ${c.playing !== false ? "selected" : ""}>Reproduciendo</option>
                  <option value="0" ${c.playing === false ? "selected" : ""}>Parado</option>
                </select>
              </label>`;
        } else if (c.type === "idle_threshold") {
          const mins = Math.round((Number(c.value) || 1800) / 60);
          paramsHtml = `<label>Condición
                <select data-c-operator="${idx}">
                  <option value="gt" ${c.operator === "gt" ? "selected" : ""}>Más de</option>
                  <option value="lt" ${c.operator === "lt" ? "selected" : ""}>Menos de</option>
                </select>
              </label>
              <label>Minutos inactivo
                <input type="number" min="1" data-c-idle-min="${idx}" value="${mins}" />
              </label>`;
        } else if (c.type === "uptime") {
          paramsHtml = `<label>Condición
                <select data-c-operator="${idx}">
                  <option value="gt" ${c.operator === "gt" ? "selected" : ""}>Más de</option>
                  <option value="lt" ${c.operator === "lt" ? "selected" : ""}>Menos de</option>
                </select>
              </label>
              <label>Horas encendido
                <input type="number" min="0" step="0.5" data-c-uptime-hours="${idx}" value="${c.value ?? 24}" />
              </label>`;
        } else if (c.type === "process_running") {
          paramsHtml = `<label>Proceso (nombre)
                <input type="text" data-c-process-name="${idx}" placeholder="steam.exe" value="${escHtml(c.processName || "")}" />
              </label>
              <label>Estado
                <select data-c-process-running="${idx}">
                  <option value="1" ${c.running !== false ? "selected" : ""}>Abierto</option>
                  <option value="0" ${c.running === false ? "selected" : ""}>Cerrado</option>
                </select>
              </label>`;
        } else {
          paramsHtml = `<label>Métrica
                <select data-c-metric="${idx}">${METRIC_OPTIONS.map((m) => `<option value="${m.value}" ${c.metric === m.value ? "selected" : ""}>${m.label}</option>`).join("")}</select>
              </label>
              <label>Condición
                <select data-c-operator="${idx}">
                  <option value="gt" ${c.operator === "gt" ? "selected" : ""}>Mayor que</option>
                  <option value="lt" ${c.operator === "lt" ? "selected" : ""}>Menor que</option>
                </select>
              </label>
              <label>Valor
                <input type="number" data-c-value="${idx}" value="${c.value ?? 80}" />
              </label>`;
        }
        const deviceFieldHtml =
          c.type === "schedule" || c.type === "time_window" || c.type === "docker_status" || c.type === "docker_health" || c.type === "spotify_playing" || c.type === "interval"
            ? ""
            : `<label>Dispositivo
            <select data-c-device="${idx}">${(state.automationDevices || []).map((d) => `<option value="${escHtml(d.id)}" ${c.deviceId === d.id ? "selected" : ""}>${escHtml(d.name || d.id)}</option>`).join("")}</select>
          </label>`;
        const connectorHtml =
          idx > 0
            ? `<div class="auto-flow-arrow"><span class="auto-flow-line"></span><span class="auto-flow-connector">${draft.combinator === "OR" ? "O" : "Y"}</span></div>`
            : `<div class="auto-flow-label">CUANDO</div>`;
        return `${connectorHtml}<div class="plugin-card auto-flow-block" style="margin-bottom:10px">
          <div class="docker-actions" style="justify-content:space-between">
            <strong>Condición ${idx + 1}</strong>
            <button type="button" class="dk-btn ghost danger" data-c-remove="${idx}">Quitar</button>
          </div>
          <label>Tipo
            <select data-c-type="${idx}">
              <option value="device_status" ${c.type === "device_status" ? "selected" : ""}>Estado de dispositivo</option>
              <option value="metric_threshold" ${c.type === "metric_threshold" ? "selected" : ""}>Umbral de métrica</option>
              <option value="schedule" ${c.type === "schedule" ? "selected" : ""}>Programación horaria</option>
              <option value="time_window" ${c.type === "time_window" ? "selected" : ""}>Franja horaria (antes/después de)</option>
              <option value="interval" ${c.type === "interval" ? "selected" : ""}>Cada X minutos</option>
              <option value="docker_status" ${c.type === "docker_status" ? "selected" : ""}>Estado de contenedor Docker</option>
              <option value="docker_health" ${c.type === "docker_health" ? "selected" : ""}>Salud de contenedor Docker</option>
              <option value="spotify_playing" ${c.type === "spotify_playing" ? "selected" : ""}>Spotify reproduciendo</option>
              <option value="idle_threshold" ${c.type === "idle_threshold" ? "selected" : ""}>Inactividad</option>
              <option value="uptime" ${c.type === "uptime" ? "selected" : ""}>Tiempo encendido</option>
              <option value="process_running" ${c.type === "process_running" ? "selected" : ""}>Proceso abierto/cerrado</option>
            </select>
          </label>
          ${deviceFieldHtml}
          ${paramsHtml}
          <label style="display:flex;align-items:center;gap:8px;flex-direction:row;background:none;border:none;padding:0;text-transform:none;font-weight:400;color:var(--text)">
            <input type="checkbox" data-c-negate="${idx}" ${c.negate ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" /> NO (invertir esta condición)
          </label>
          <label>Confirmar durante (segundos, 0 = sin confirmación)
            <input type="number" min="0" max="3600" data-c-debounce="${idx}" value="${c.debounceSeconds ?? 0}" />
          </label>
        </div>`;
      })
      .join("");

    if (editing) {
      const scene = scenesById[draft.sceneId];
      if (els.automationsTitle) els.automationsTitle.textContent = `${scene ? scene.icon : "🤖"} ${draft.name || "Automatización"}`.trim();
    } else if (els.automationsTitle) {
      els.automationsTitle.textContent = "Automatizaciones";
    }

    els.automationsBody.innerHTML = `
      ${rows}
      ${
        editing
          ? `<button type="button" class="config-btn" id="automations-edit-back" style="margin-bottom:16px">← Volver a automatizaciones</button>`
          : `<div class="docker-actions" style="margin-bottom:16px">
              <button type="button" class="config-btn" id="automations-presets-btn">🎯 Presets</button>
              <button type="button" class="config-btn" id="automations-history-btn">📜 Historial</button>
            </div>
            <div class="plugin-card" style="margin-bottom:16px">
              <h3 style="margin:0 0 8px">Permisos de escenas/automatizaciones</h3>
              <label style="display:flex;align-items:center;gap:8px;flex-direction:row;background:none;border:none;padding:0;text-transform:none;font-weight:400;color:var(--text)">
                <input type="checkbox" id="au-perm-docker" ${(state.globalPermissions?.docker ?? true) ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" /> Permitir controlar Docker
              </label>
              <label style="display:flex;align-items:center;gap:8px;flex-direction:row;background:none;border:none;padding:0;text-transform:none;font-weight:400;color:var(--text)">
                <input type="checkbox" id="au-perm-spotify" ${(state.globalPermissions?.spotify ?? true) ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" /> Permitir controlar Spotify
              </label>
              <button type="button" class="config-btn" id="au-perm-save" style="margin-top:8px">Guardar permisos</button>
            </div>`
      }
      <form id="automation-form" class="config-form" style="margin-top:16px">
        <label>Nombre
          <input type="text" id="au-name" required value="${escHtml(draft.name)}" />
        </label>
        <div class="auto-flow">
          <div id="au-conditions-list">${conditionsHtml}</div>
          <button type="button" class="dk-btn" id="au-add-condition" style="margin-bottom:12px">+ Añadir condición</button>
          ${
            draft.conditions.length > 1
              ? `<label>Combinar condiciones con
                  <select id="au-combinator">
                    <option value="AND" ${draft.combinator === "AND" ? "selected" : ""}>Y (todas deben cumplirse)</option>
                    <option value="OR" ${draft.combinator === "OR" ? "selected" : ""}>O (con una basta)</option>
                  </select>
                </label>`
              : ""
          }
          <div class="auto-flow-arrow"><span class="auto-flow-line"></span></div>
          <div class="auto-flow-label auto-flow-then">ENTONCES</div>
          <div class="plugin-card auto-flow-block auto-flow-action">
            <label>🎬 Ejecutar escena
              <select id="au-scene">${sceneOptions}</select>
            </label>
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;flex-direction:row;background:none;border:none;padding:0;text-transform:none;font-weight:400;color:var(--text)">
          <input type="checkbox" id="au-enabled" ${draft.enabled ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)" /> Activada
        </label>
        <div class="docker-actions">
          ${editing ? `<button type="button" class="dk-btn" id="au-test">▶ Probar</button>` : ""}
          <button type="submit" class="config-save">${editing ? "💾 Guardar cambios" : "Crear automatización"}</button>
        </div>
        ${editing ? `<button type="button" class="config-btn" id="au-view-history" style="margin-top:8px">📜 Historial de esta automatización</button>` : ""}
      </form>`;

    els.automationsBody.querySelectorAll("[data-c-type]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const idx = Number(sel.getAttribute("data-c-type"));
        const deviceId = draft.conditions[idx].deviceId || (state.automationDevices?.[0]?.id) || "mi-pc";
        if (sel.value === "device_status") {
          draft.conditions[idx] = { type: "device_status", deviceId, state: "online" };
        } else if (sel.value === "schedule") {
          draft.conditions[idx] = { type: "schedule", time: "21:00", days: "all" };
        } else if (sel.value === "time_window") {
          draft.conditions[idx] = { type: "time_window", time: "18:00", operator: "gt", days: "all" };
        } else if (sel.value === "interval") {
          draft.conditions[idx] = { type: "interval", minutes: 30 };
        } else if (sel.value === "docker_status") {
          const firstContainer = (state.docker && state.docker.containers && state.docker.containers[0] && state.docker.containers[0].name) || "";
          draft.conditions[idx] = { type: "docker_status", container: firstContainer, state: "running" };
        } else if (sel.value === "docker_health") {
          const firstContainer = (state.docker && state.docker.containers && state.docker.containers[0] && state.docker.containers[0].name) || "";
          draft.conditions[idx] = { type: "docker_health", container: firstContainer, health: "unhealthy" };
        } else if (sel.value === "spotify_playing") {
          draft.conditions[idx] = { type: "spotify_playing", playing: true };
        } else if (sel.value === "idle_threshold") {
          draft.conditions[idx] = { type: "idle_threshold", deviceId, operator: "gt", value: 1800 };
        } else if (sel.value === "uptime") {
          draft.conditions[idx] = { type: "uptime", deviceId, operator: "gt", value: 24 };
        } else if (sel.value === "process_running") {
          draft.conditions[idx] = { type: "process_running", deviceId, processName: "", running: false };
        } else {
          draft.conditions[idx] = { type: "metric_threshold", deviceId, metric: "temp", operator: "gt", value: 80 };
        }
        renderAutomationsBody();
      });
    });
    els.automationsBody.querySelectorAll("[data-c-time]").forEach((input) => {
      input.addEventListener("change", () => {
        draft.conditions[Number(input.getAttribute("data-c-time"))].time = input.value;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-day]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const idx = Number(cb.getAttribute("data-c-day"));
        const cond = draft.conditions[idx];
        let days = cond.days === "all" ? Object.keys(DAY_LABELS) : [...(cond.days || [])];
        if (cb.checked) {
          if (!days.includes(cb.value)) days.push(cb.value);
        } else {
          const next = days.filter((d) => d !== cb.value);
          if (!next.length) {
            cb.checked = true;
            toast("Debe quedar al menos un día seleccionado");
            return;
          }
          days = next;
        }
        cond.days = days.length === Object.keys(DAY_LABELS).length ? "all" : days;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-device]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-device"))].deviceId = sel.value;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-state]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-state"))].state = sel.value;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-metric]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-metric"))].metric = sel.value;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-operator]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-operator"))].operator = sel.value;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-value]").forEach((input) => {
      input.addEventListener("change", () => {
        draft.conditions[Number(input.getAttribute("data-c-value"))].value = Number(input.value);
      });
    });
    els.automationsBody.querySelectorAll("[data-c-negate]").forEach((cb) => {
      cb.addEventListener("change", () => {
        draft.conditions[Number(cb.getAttribute("data-c-negate"))].negate = cb.checked;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-debounce]").forEach((input) => {
      input.addEventListener("change", () => {
        draft.conditions[Number(input.getAttribute("data-c-debounce"))].debounceSeconds = Number(input.value) || 0;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-minutes]").forEach((input) => {
      input.addEventListener("change", () => {
        draft.conditions[Number(input.getAttribute("data-c-minutes"))].minutes = Number(input.value);
      });
    });
    els.automationsBody.querySelectorAll("[data-c-container]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-container"))].container = sel.value;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-docker-state]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-docker-state"))].state = sel.value;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-docker-health]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-docker-health"))].health = sel.value;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-spotify-playing]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-spotify-playing"))].playing = sel.value === "1";
      });
    });
    els.automationsBody.querySelectorAll("[data-c-idle-min]").forEach((input) => {
      input.addEventListener("change", () => {
        const idx = Number(input.getAttribute("data-c-idle-min"));
        draft.conditions[idx].value = Math.max(1, Number(input.value) || 1) * 60;
      });
    });
    els.automationsBody.querySelectorAll("[data-c-uptime-hours]").forEach((input) => {
      input.addEventListener("change", () => {
        const idx = Number(input.getAttribute("data-c-uptime-hours"));
        draft.conditions[idx].value = Math.max(0, Number(input.value) || 0);
      });
    });
    els.automationsBody.querySelectorAll("[data-c-process-name]").forEach((input) => {
      input.addEventListener("change", () => {
        draft.conditions[Number(input.getAttribute("data-c-process-name"))].processName = input.value.trim();
      });
    });
    els.automationsBody.querySelectorAll("[data-c-process-running]").forEach((sel) => {
      sel.addEventListener("change", () => {
        draft.conditions[Number(sel.getAttribute("data-c-process-running"))].running = sel.value === "1";
      });
    });
    els.automationsBody.querySelectorAll("[data-c-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (draft.conditions.length <= 1) {
          toast("Necesitas al menos una condición");
          return;
        }
        draft.conditions.splice(Number(btn.getAttribute("data-c-remove")), 1);
        renderAutomationsBody();
      });
    });
    els.automationsBody.querySelector("#au-add-condition")?.addEventListener("click", () => {
      draft.conditions.push({ type: "device_status", deviceId: (state.automationDevices?.[0]?.id) || "mi-pc", state: "online" });
      renderAutomationsBody();
    });
    els.automationsBody.querySelector("#au-combinator")?.addEventListener("change", (e) => {
      draft.combinator = e.target.value;
    });
    els.automationsBody.querySelector("#au-scene")?.addEventListener("change", (e) => {
      draft.sceneId = e.target.value;
    });
    els.automationsBody.querySelector("#au-enabled")?.addEventListener("change", (e) => {
      draft.enabled = e.target.checked;
    });

    els.automationsBody.querySelectorAll("[data-auto-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = list.find((x) => x.id === btn.getAttribute("data-auto-open"));
        if (!a) return;
        state.automationDraft = automationEditDraft(a);
        state.automationEditingId = a.id;
        state.automationsView = "edit";
        renderAutomationsBody();
      });
    });
    els.automationsBody.querySelectorAll("[data-auto-flow]").forEach((btn) => {
      btn.addEventListener("click", () => openAutomationFlowchartView(btn.getAttribute("data-auto-flow")));
    });
    els.automationsBody.querySelector("#automations-edit-back")?.addEventListener("click", () => {
      state.automationDraft = null;
      state.automationEditingId = null;
      state.automationsView = "list";
      openAutomationsPanel().catch((err) => toast(err.message || "Error"));
    });
    els.automationsBody.querySelector("#au-test")?.addEventListener("click", async () => {
      try {
        const result = await api(`/api/scenes/${draft.sceneId}/run`, { method: "POST", body: "{}" });
        toast(`${result.success ? "✓" : "⚠️"} ${result.sceneName}: ${result.completed}/${result.total} acciones`);
      } catch (err) {
        toast(err.message || "Error al probar");
      }
    });
    els.automationsBody.querySelector("#au-view-history")?.addEventListener("click", () => {
      openAutomationsHistoryView(state.automationEditingId).catch((err) => toast(err.message || "Error"));
    });
    els.automationsBody.querySelectorAll("[data-auto-fav]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-auto-fav");
        const set = new Set(state.automationFavorites || []);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        const ids = [...set];
        state.automationFavorites = ids;
        renderAutomationsBody();
        try {
          await api("/api/ui/favorites/automations", { method: "PUT", body: JSON.stringify({ ids }) });
        } catch (err) {
          toast(err.message || "Error guardando favorito");
        }
      });
    });
    els.automationsBody.querySelectorAll("[data-auto-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-auto-toggle");
        const a = list.find((x) => x.id === id);
        try {
          await api(`/api/automations/${id}`, {
            method: "PUT",
            body: JSON.stringify({ enabled: !a.enabled }),
          });
          await openAutomationsPanel();
        } catch (err) {
          toast(err.message || "Error");
        }
      });
    });
    els.automationsBody.querySelectorAll("[data-auto-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await api(`/api/automations/${btn.getAttribute("data-auto-del")}`, { method: "DELETE" });
          toast("Automatización eliminada");
          await openAutomationsPanel();
        } catch (err) {
          toast(err.message || "Error");
        }
      });
    });
    els.automationsBody.querySelector("#automations-history-btn")?.addEventListener("click", () => {
      openAutomationsHistoryView().catch((err) => toast(err.message || "Error"));
    });
    els.automationsBody.querySelector("#automations-presets-btn")?.addEventListener("click", () => {
      renderAutomationsPresetsView();
    });
    els.automationsBody.querySelector("#au-perm-save")?.addEventListener("click", async () => {
      const docker = els.automationsBody.querySelector("#au-perm-docker")?.checked ?? true;
      const spotify = els.automationsBody.querySelector("#au-perm-spotify")?.checked ?? true;
      try {
        const updated = await api("/api/permissions", { method: "PUT", body: JSON.stringify({ docker, spotify }) });
        state.globalPermissions = updated;
        toast("Permisos guardados");
      } catch (err) {
        toast(err.message || "Error guardando permisos");
      }
    });
    els.automationsBody.querySelector("#automation-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      draft.name = els.automationsBody.querySelector("#au-name").value;
      const body = {
        name: draft.name,
        sceneId: draft.sceneId,
        combinator: draft.combinator,
        conditions: draft.conditions,
        enabled: draft.enabled,
      };
      try {
        if (draft.id) {
          await api(`/api/automations/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
          toast("Automatización actualizada");
        } else {
          await api("/api/automations", { method: "POST", body: JSON.stringify(body) });
          toast("Automatización creada");
        }
        state.automationDraft = null;
        state.automationEditingId = null;
        state.automationsView = "list";
        await openAutomationsPanel();
      } catch (err) {
        toast(err.message || "Error guardando automatización");
      }
    });
  }

  const AUTOMATION_PRESETS = [
    {
      icon: "🎮",
      label: "Gaming",
      hint: "MI-PC pasa a online",
      build: () => ({
        name: "Gaming automático",
        combinator: "AND",
        conditions: [{ type: "device_status", deviceId: "mi-pc", state: "online" }],
      }),
    },
    {
      icon: "💻",
      label: "Trabajo",
      hint: "Todos los días a las 08:00",
      build: () => ({
        name: "Inicio Trabajo",
        combinator: "AND",
        conditions: [{ type: "schedule", time: "08:00", days: "all" }],
      }),
    },
    {
      icon: "🌙",
      label: "Noche",
      hint: "Todos los días a las 00:00",
      build: () => ({
        name: "Noche",
        combinator: "AND",
        conditions: [{ type: "schedule", time: "00:00", days: "all" }],
      }),
    },
    {
      icon: "🚨",
      label: "Temperatura",
      hint: "GPU MI-PC > 80°C, confirmado 60s (evita falsas alarmas)",
      build: () => ({
        name: "GPU caliente",
        combinator: "AND",
        conditions: [
          { type: "metric_threshold", deviceId: "mi-pc", metric: "gpuTemp", operator: "gt", value: 80, debounceSeconds: 60 },
        ],
      }),
    },
    {
      icon: "🔄",
      label: "Recuperación Docker",
      hint: "Contenedor no saludable",
      build: () => {
        const firstContainer = (state.docker && state.docker.containers && state.docker.containers[0] && state.docker.containers[0].name) || "";
        return {
          name: "Recuperación Docker",
          combinator: "AND",
          conditions: [{ type: "docker_health", container: firstContainer, health: "unhealthy" }],
        };
      },
    },
  ];

  function renderAutomationsPresetsView() {
    if (els.automationsTitle) els.automationsTitle.textContent = "Presets";
    const cards = AUTOMATION_PRESETS.map(
      (p, idx) => `<button type="button" class="plugin-card" style="text-align:left;width:100%" data-preset-idx="${idx}">
        <h3>${p.icon} ${escHtml(p.label)}</h3>
        <p class="sic-sub">${escHtml(p.hint)}</p>
      </button>`
    ).join("");
    els.automationsBody.innerHTML = `
      ${cards}
      <button type="button" class="config-btn" id="automations-presets-back" style="margin-top:12px">← Volver a automatizaciones</button>`;
    els.automationsBody.querySelectorAll("[data-preset-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = AUTOMATION_PRESETS[Number(btn.getAttribute("data-preset-idx"))];
        const built = preset.build();
        state.automationDraft = {
          name: built.name,
          sceneId: (state.automationScenes && state.automationScenes[0] && state.automationScenes[0].id) || "",
          combinator: built.combinator,
          enabled: true,
          conditions: built.conditions,
        };
        if (els.automationsTitle) els.automationsTitle.textContent = "Automatizaciones";
        toast(`Preset "${preset.label}" cargado — revisa la escena y guarda`);
        renderAutomationsBody();
      });
    });
    els.automationsBody.querySelector("#automations-presets-back")?.addEventListener("click", () => {
      if (els.automationsTitle) els.automationsTitle.textContent = "Automatizaciones";
      renderAutomationsBody();
    });
  }

  function automationRunStatusEmoji(h) {
    const total = h.total || (h.steps || []).length;
    const completed = h.completed ?? (h.steps || []).filter((s) => s.ok).length;
    if (total === 0) return "⚪";
    if (completed === total) return "🟢";
    // 6.5.10 - un workflow parado a mitad por un fallo sin recuperar (ver
    // sceneService.js) es distinto de un "parcial" organico (p.ej. un
    // wait_until que expiro) - se marca en rojo, no en naranja, para que se
    // note que necesita revision, no solo que "algo no llego".
    if (h.stoppedEarly) return "🔴";
    if (completed > 0) return "🟠";
    return "🔴";
  }

  async function openAutomationsHistoryView(filterAutomationId) {
    state.automationsView = "history";
    state.automationsHistoryFilterId = filterAutomationId || null;
    if (els.automationsTitle) els.automationsTitle.textContent = "Historial de automatizaciones";
    els.automationsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    try {
      const data = await api("/api/scenes/history?limit=100");
      state.automationsHistory = (data.history || []).filter(
        (h) => h.source === "automation" && (!filterAutomationId || h.automationId === filterAutomationId)
      );
      renderAutomationsHistoryList();
    } catch (err) {
      els.automationsBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
    }
  }

  function renderAutomationsHistoryList() {
    if (els.automationsTitle) els.automationsTitle.textContent = "Historial de automatizaciones";
    const list = state.automationsHistory || [];
    const rows = list.length
      ? list
          .map((h, idx) => {
            const total = h.total || (h.steps || []).length;
            const completed = h.completed ?? (h.steps || []).filter((s) => s.ok).length;
            const warnLine = completed < total && completed > 0 ? `<br>${total - completed} advertencia${total - completed === 1 ? "" : "s"}` : "";
            return `<button type="button" class="sys-list-row" data-auto-history-idx="${idx}">
              <span>${formatHistoryWhen(h.at)} ${automationRunStatusEmoji(h)} ${escHtml(h.automationName || h.sceneName || "?")}</span>
              <span class="sic-sub">${total} acción${total === 1 ? "" : "es"}<br>${completed} correcta${completed === 1 ? "" : "s"}${warnLine}</span>
            </button>`;
          })
          .join("")
      : `<p class="tagline">Sin automatizaciones disparadas todavía.</p>`;

    els.automationsBody.innerHTML = `
      ${rows}
      <button type="button" class="config-btn" id="automations-history-back" style="margin-top:12px">← Volver a automatizaciones</button>`;

    els.automationsBody.querySelectorAll("[data-auto-history-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.automationsHistoryItem = list[Number(btn.getAttribute("data-auto-history-idx"))];
        renderAutomationsHistoryDetail();
      });
    });
    els.automationsBody.querySelector("#automations-history-back")?.addEventListener("click", () => {
      state.automationsView = "list";
      if (els.automationsTitle) els.automationsTitle.textContent = "Automatizaciones";
      openAutomationsPanel().catch((err) => toast(err.message || "Error"));
    });
  }

  function renderAutomationsHistoryDetail() {
    const h = state.automationsHistoryItem;
    const name = h.automationName || h.sceneName || "Automatización";
    if (els.automationsTitle) els.automationsTitle.textContent = name;
    const rows = (h.steps || [])
      .map((s) => {
        if (s.blocked) {
          return `<div class="sys-list-row blocked">
            <span>⚠️ Acción bloqueada — ${actionSummary(s)}</span>
            <span class="sic-sub">Falta el permiso "${escHtml(s.permission)}" en este dispositivo</span>
          </div>`;
        }
        return `<div class="sys-list-row">
        <span>${s.ok ? "✓" : "✗"} ${actionSummary(s)}</span>
        <span class="sic-sub">${escHtml(s.detail || "")}</span>
      </div>`;
      })
      .join("");
    const durationLine =
      h.durationMs != null ? `<p class="tagline">Duración: ${(h.durationMs / 1000).toFixed(1)} s</p>` : "";

    els.automationsBody.innerHTML = `
      <p class="tagline">${formatHistoryWhen(h.at)} · escena "${escHtml(h.sceneName || "?")}"</p>
      ${durationLine}
      ${rows}
      <button type="button" class="config-btn" id="automations-history-detail-back" style="margin-top:12px">← Volver al historial</button>`;

    els.automationsBody.querySelector("#automations-history-detail-back")?.addEventListener("click", () => {
      if (els.automationsTitle) els.automationsTitle.textContent = "Historial de automatizaciones";
      renderAutomationsHistoryList();
    });
  }

  function setAppNav(nav, opts = {}) {
    state.appNav = nav;
    document.querySelectorAll(".nav-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.nav === nav);
    });
    const viewInicio = document.getElementById("view-inicio");
    const viewServicios = document.getElementById("view-servicios");
    const viewSistema = document.getElementById("view-sistema");
    const viewDispositivos = document.getElementById("view-dispositivos");
    if (viewInicio) viewInicio.hidden = nav !== "inicio";
    if (viewServicios) viewServicios.hidden = nav !== "servicios";
    if (viewSistema) viewSistema.hidden = nav !== "sistema";
    if (viewDispositivos) viewDispositivos.hidden = nav !== "dispositivos";
    if (els.headerSub) {
      const labels = {
        inicio: "Control Center · Inicio",
        servicios: "Control Center · Servicios",
        sistema: "Control Center · Sistema",
        dispositivos: "Control Center · Dispositivos",
      };
      els.headerSub.textContent = labels[nav] || "Control Center";
    }
    if (opts.keepPanels) return;
    if (nav === "inicio") {
      closeOverlayPanels();
    } else if (nav === "servicios") {
      closeOverlayPanels();
    } else if (nav === "sistema") {
      closeOverlayPanels();
      openSysHub();
    } else if (nav === "dispositivos") {
      closeOverlayPanels();
      openDevicesPanel("nav").catch((err) => toast(err.message || "Error"));
    }
  }

  function closeMonitorPanel() {
    if (els.monitorPanel) els.monitorPanel.hidden = true;
    if (state.monitorTimer) {
      clearInterval(state.monitorTimer);
      state.monitorTimer = null;
    }
  }

  function renderMonitorBody() {
    if (!els.monitorBody) return;
    const st = state.promStatus;
    if (!st) {
      els.monitorBody.innerHTML = `<p class="tagline">Cargando estado…</p>`;
      return;
    }
    const active = !!(st.prometheusContainer || st.active);
    const dot = active ? "🟢" : "🔴";
    const estado = active ? "Activo" : "Inactivo";
    const last = st.lastScrapeAt
      ? String(st.lastScrapeAt).replace("T", " ").replace("Z", " UTC")
      : "sin scrapes aún";
    const metrics = st.metricCount != null ? st.metricCount : "—";
    const retention = st.retention || "30d";
    const graf =
      st.grafanaUrl || st.prometheusContainer !== false
        ? `<button type="button" class="prom-link grafana" data-open-grafana>Abrir Grafana</button>`
        : `<div class="meta">Grafana: desplegar stack Monitoring para el enlace</div>`;
    const hint = st.stackHint
      ? `<div class="meta">${escHtml(st.stackHint)}</div>`
      : `<div class="meta">Plantilla Compose → Monitoring · stack en docker/stacks/monitoring</div>`;
    const sec = st.securityNote
      ? `<div class="meta">${escHtml(st.securityNote)}</div>`
      : "";

    els.monitorBody.innerHTML = `
      <h2 class="perf-title">PROMETHEUS STATUS</h2>
      <div class="perf-block prom-status">
        <div class="row"><span class="label">Estado</span> <strong>${dot} ${estado}</strong></div>
        <div class="row"><span class="label">Última recogida</span> <span>${escHtml(last)}</span></div>
        <div class="row"><span class="label">Métricas</span> <span>${escHtml(String(metrics))}</span></div>
        <div class="row"><span class="label">Retención</span> <span>${escHtml(String(retention))}</span></div>
        <div class="row"><span class="label">Exporter</span> <span>${
          st.exporterReady ? "listo · /api/metrics/prometheus" : "—"
        }</span></div>
        ${graf}
        ${hint}
        ${sec}
      </div>
      <div class="perf-block">
        <h3>Históricos</h3>
        <div class="meta">Stub — series largas vía Prometheus/Grafana (próximamente en UI).</div>
      </div>
    `;
    els.monitorBody.querySelector("[data-open-grafana]")?.addEventListener("click", () => {
      openServiceFrame("Grafana", GRAFANA_URL);
    });
  }

  async function refreshMonitor() {
    try {
      state.promStatus = await api("/api/metrics/prometheus/status");
      renderMonitorBody();
    } catch (err) {
      try {
        state.promStatus = await api("/api/monitoring/prometheus");
        renderMonitorBody();
      } catch (err2) {
        if (els.monitorBody) {
          els.monitorBody.innerHTML = `<p class="tagline">${escHtml(
            err2.message || err.message || "Error monitorización"
          )}</p>`;
        }
      }
    }
  }

  async function openMonitorPanel() {
    if (!els.monitorPanel || !els.monitorBody) {
      toast("Panel monitorización no disponible");
      return;
    }
    closeSysHub();
    closePerfPanel();
    closePluginsPanel();
    closePermsPanel();
    closeConsentPanel();
    closeLogsPanel();
    closeSpotifyPanel();
    closeConfigPanel();
    els.monitorPanel.hidden = false;
    els.monitorBody.innerHTML = `<p class="tagline">Cargando Prometheus…</p>`;
    await refreshMonitor();
    if (state.monitorTimer) clearInterval(state.monitorTimer);
    state.monitorTimer = setInterval(() => {
      refreshMonitor().catch(() => {});
    }, 12000);
  }


  async function openPerfPanel() {
    if (!els.perfPanel || !els.perfBody) {
      toast("Panel rendimiento no disponible");
      return;
    }
    closeSysHub();
    closeMonitorPanel();
    closePluginsPanel();
    closePermsPanel();
    closeConsentPanel();
    closeLogsPanel();
    closeSpotifyPanel();
    closeConfigPanel();
    els.perfPanel.hidden = false;
    els.perfBody.innerHTML = `<p class="tagline">Cargando métricas…</p>`;
    await refreshPerf();
    if (state.perfTimer) clearInterval(state.perfTimer);
    state.perfTimer = setInterval(() => {
      refreshPerf().catch(() => {});
    }, 8000);
  }


  function closePluginsPanel() {
    if (els.pluginsPanel) els.pluginsPanel.hidden = true;
  }

  function closePermsPanel() {
    if (els.permsPanel) els.permsPanel.hidden = true;
    state.permsPluginId = null;
    if (els.permsSave) els.permsSave.hidden = true;
  }


  function closeLogsPanel() {
    if (els.logsPanel) els.logsPanel.hidden = true;
    state.logsPluginId = null;
    state.logsEntries = [];
  }

  function renderLogsBody(entries) {
    if (!els.logsBody) return;
    const list = entries || [];
    if (!list.length) {
      els.logsBody.innerHTML = `<p class="perm-note">Sin entradas de log.</p>`;
      return;
    }
    els.logsBody.innerHTML = list
      .map((e) => {
        const lvl = String(e.level || "INFO").toLowerCase();
        const time = String(e.time || "").replace("T", " ").replace("Z", "");
        return `<div class="log-line ${lvl}"><span class="lvl">${e.level || "INFO"}</span><span class="time">${time}</span><span class="msg">${escHtml(e.message || "")}</span></div>`;
      })
      .join("");
    els.logsBody.scrollTop = els.logsBody.scrollHeight;
  }

  async function refreshLogsPanel() {
    if (!state.logsPluginId) return;
    const level = els.logsFilter?.value || "ALL";
    const q = level && level !== "ALL" ? `?level=${encodeURIComponent(level)}&limit=300` : "?limit=300";
    const data = await api(`/api/plugins/${state.logsPluginId}/logs${q}`);
    state.logsEntries = data.entries || [];
    renderLogsBody(state.logsEntries);
  }

  async function openLogsPanel(plugin) {
    if (!els.logsPanel || !els.logsBody) return;
    state.logsPluginId = plugin.id;
    els.logsTitle.textContent = `Logs · ${plugin.name}`;
    els.logsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    els.logsPanel.hidden = false;
    try {
      await refreshLogsPanel();
    } catch (err) {
      els.logsBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
    }
  }

  async function downloadLogsPanel() {
    if (!state.logsPluginId) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/plugins/${state.logsPluginId}/logs/download`, {
        headers: { "X-BMO-Key": API_KEY },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${state.logsPluginId}-latest.log`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Log descargado");
    } catch (err) {
      toast(err.message);
    }
  }

  async function copyLogsPanel() {
    const text = (state.logsEntries || [])
      .map((e) => `${e.time || ""} ${e.level || ""} ${e.message || ""}`.trim())
      .join("\n");
    try {
      await navigator.clipboard.writeText(text || "");
      toast("Logs copiados");
    } catch (_) {
      toast("No se pudo copiar");
    }
  }

  async function clearLogsPanel() {
    if (!state.logsPluginId) return;
    if (!confirm("¿Limpiar el log de este plugin?")) return;
    try {
      await api(`/api/plugins/${state.logsPluginId}/logs/clear`, {
        method: "POST",
        body: "{}",
      });
      toast("Logs limpiados");
      await refreshLogsPanel();
    } catch (err) {
      toast(err.message);
    }
  }

  function closeConsentPanel() {
    if (els.consentPanel) els.consentPanel.hidden = true;
    state.consentPlugin = null;
    state.consentNeedsDeps = false;
  }

  function renderDependencyPreview(plugin) {
    const deps = plugin.dependencies || [];
    if (!deps.length) return "";
    const status = plugin.dependencyStatus || {};
    const rows = deps
      .map((depId) => {
        const meta = (state.plugins || []).find((p) => p.id === depId);
        const name = meta?.name || depId;
        const ok = status[depId] === "installed" || Boolean(meta?.installed);
        return `<div class="dep-row ${ok ? "ok" : "missing"}">
          <span class="dep-mark">${ok ? "✓" : "✗"}</span>
          <span class="dep-name">${escHtml(name)}</span>
          <span class="dep-state">${ok ? "instalado" : "faltante"}</span>
        </div>`;
      })
      .join("");
    const missing = (plugin.missingDependencies || []).length;
    const ask =
      missing > 0
        ? `<p class="perm-note dep-ask">¿Instalar ${missing === 1 && deps.length === 1 ? "ambos" : "el plugin y sus dependencias"}?</p>`
        : `<p class="perm-note">Dependencias satisfechas.</p>`;
    return `<div class="dep-block">
      <p class="consent-intro dep-intro">${escHtml(plugin.name)} necesita:</p>
      ${rows}
      ${ask}
    </div>`;
  }

  function renderPermChecks(container, items, { checkedDefault = false } = {}) {
    if (!container) return;
    const list = items || [];
    if (!list.length) {
      container.innerHTML = `<p class="perm-note">Este plugin no declara permisos.</p>`;
      return;
    }
    container.innerHTML = list
      .map((item) => {
        const id = item.id || item;
        const label = item.label || permissionLabel(id);
        const desc = item.description ? `<small>${item.description}</small>` : "";
        const checked =
          item.granted != null ? Boolean(item.granted) : Boolean(checkedDefault);
        return `<label class="perm-row checkable">
          <input type="checkbox" data-perm="${id}" ${checked ? "checked" : ""} />
          <span class="perm-text"><strong>${label}</strong>${desc}</span>
        </label>`;
      })
      .join("");
  }

  function readPermChecks(container) {
    const out = {};
    container?.querySelectorAll("[data-perm]").forEach((el) => {
      out[el.dataset.perm] = !!el.checked;
    });
    return out;
  }

  async function openPermsPanel(plugin) {
    if (!els.permsPanel || !els.permsBody) return;
    state.permsPluginId = plugin.id;
    els.permsTitle.textContent = `Permisos · ${plugin.name}`;
    els.permsBody.innerHTML = `<p class="tagline">Cargando…</p>`;
    if (els.permsSave) els.permsSave.hidden = true;
    els.permsPanel.hidden = false;
    try {
      const data = await api(`/api/plugins/${plugin.id}/permissions`);
      renderPermChecks(els.permsBody, data.items || []);
      if (els.permsSave) els.permsSave.hidden = !data.installed;
      if (!data.installed) {
        els.permsBody.innerHTML += `<p class="perm-note">Instala el plugin para conceder permisos.</p>`;
      }
    } catch (err) {
      els.permsBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
    }
  }

  async function savePermsPanel() {
    if (!state.permsPluginId) return;
    try {
      const grants = readPermChecks(els.permsBody);
      await api(`/api/plugins/${state.permsPluginId}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissions: grants }),
      });
      toast("Permisos guardados");
      closePermsPanel();
      await refreshPlugins();
    } catch (err) {
      toast(err.message);
    }
  }

  async function openInstallConsent(plugin) {
    state.consentPlugin = plugin;
    state.consentNeedsDeps = Boolean((plugin.missingDependencies || []).length);
    els.consentTitle.textContent = plugin.name;
    const hasPerms = (plugin.permissions || []).length > 0;
    const hasDeps = (plugin.dependencies || []).length > 0;
    if (hasDeps && !hasPerms) {
      els.consentIntro.textContent = `${plugin.name} declara dependencias:`;
    } else {
      els.consentIntro.textContent = `${plugin.name} necesita estos permisos:`;
    }
    const depHtml = renderDependencyPreview(plugin);
    try {
      const data = await api(`/api/plugins/${plugin.id}/permissions`);
      renderPermChecks(els.consentBody, data.items || [], { checkedDefault: true });
      els.consentBody.querySelectorAll("[data-perm]").forEach((el) => {
        el.checked = true;
      });
      if (depHtml) els.consentBody.insertAdjacentHTML("afterbegin", depHtml);
    } catch (_) {
      renderPermChecks(
        els.consentBody,
        (plugin.permissions || []).map((id) => ({ id, label: permissionLabel(id) })),
        { checkedDefault: true }
      );
      els.consentBody.querySelectorAll("[data-perm]").forEach((el) => {
        el.checked = true;
      });
      if (depHtml) els.consentBody.insertAdjacentHTML("afterbegin", depHtml);
    }
    if (els.consentAccept) {
      els.consentAccept.textContent = state.consentNeedsDeps ? "Instalar" : "Aceptar";
    }
    els.consentPanel.hidden = false;
  }

  async function acceptInstallConsent() {
    const plugin = state.consentPlugin;
    if (!plugin) return;
    const grants = readPermChecks(els.consentBody);
    const withDependencies =
      state.consentNeedsDeps || Boolean((plugin.dependencies || []).length);
    closeConsentPanel();
    try {
      toast(`Instalando ${plugin.name}…`);
      await api(`/api/plugins/${plugin.id}/install`, {
        method: "POST",
        body: JSON.stringify({
          permissions: grants,
          withDependencies,
          installDependencies: withDependencies,
        }),
      });
      toast(`${plugin.name} instalado`);
      await refreshPlugins();
    } catch (err) {
      const missing = err.payload?.missingDependencies;
      if (missing?.length) {
        toast(err.message || `Faltan dependencias: ${missing.join(", ")}`);
      } else {
        toast(err.message || "Error al instalar");
      }
    }
  }

  // 4.13.2 - categorias del Marketplace: el campo "category" ya existia en
  // cada plugin.json (usado hasta ahora solo como dato suelto, sin filtro
  // ni agrupacion en la UI). Mapeo de las categorias que pide el spec del
  // usuario + fallback al id crudo para las que ya traian los plugins reales
  // (demo/system/monitoring/media).
  const PLUGIN_CATEGORY_LABELS = {
    system: "Sistema",
    media: "Multimedia",
    gaming: "Gaming",
    home: "Casa",
    dev: "Desarrollo",
    productivity: "Productividad",
    automation: "Automatización",
    monitoring: "Monitorización",
    demo: "Demo",
  };
  state.pluginSearch = state.pluginSearch || "";
  state.pluginCategory = state.pluginCategory || "all";
  // 4.13.16 - "Destacados"/"Nuevos": vista aparte de la categoria (son ejes
  // distintos - un plugin puede ser "destacado" en cualquier categoria).
  // "featured" = official===true (senal real ya existente, 4.13.18) -
  // hoy coincide con "Todos" porque los 4 plugins del catalogo son
  // oficiales, se separara solo cuando exista alguno de comunidad.
  // "new" no oculta nada, solo reordena por fecha real de instalacion
  // (mtime del directorio instalado) en vez de por nombre.
  state.pluginView = state.pluginView || "all";
  const PLUGIN_VIEW_META = {
    all: "Todos",
    featured: "⭐ Destacados",
    new: "🆕 Nuevos",
  };

  function renderPluginsBody() {
    if (!els.pluginsBody) return;
    const all = state.plugins || [];
    if (!all.length) {
      els.pluginsBody.innerHTML = `<p class="tagline">No hay plugins en el repositorio.</p>`;
      if (els.pluginsCategoryChips) els.pluginsCategoryChips.innerHTML = "";
      return;
    }

    const categories = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
    if (els.pluginsCategoryChips) {
      els.pluginsCategoryChips.innerHTML = ["all", ...categories]
        .map((c) => {
          const label = c === "all" ? "Todas" : PLUGIN_CATEGORY_LABELS[c] || c;
          const active = state.pluginCategory === c ? " active" : "";
          return `<button type="button" class="plugin-cat-chip${active}" data-cat="${escHtml(c)}">${escHtml(label)}</button>`;
        })
        .join("");
      els.pluginsCategoryChips.querySelectorAll("[data-cat]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.pluginCategory = btn.dataset.cat;
          renderPluginsBody();
        });
      });
    }

    const q = state.pluginSearch.trim().toLowerCase();
    let list = all.filter((p) => {
      if (state.pluginCategory !== "all" && p.category !== state.pluginCategory) return false;
      if (state.pluginView === "featured" && !p.official) return false;
      if (q && !`${p.name} ${p.description || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (state.pluginView === "new") {
      list = [...list].sort((a, b) => {
        const da = a.installedAt ? Date.parse(a.installedAt) : 0;
        const db = b.installedAt ? Date.parse(b.installedAt) : 0;
        return db - da;
      });
    }

    const viewTabsHtml = `<div class="plugin-view-tabs">${Object.entries(PLUGIN_VIEW_META)
      .map(([v, label]) => `<button type="button" class="plugin-cat-chip${state.pluginView === v ? " active" : ""}" data-view="${v}">${label}</button>`)
      .join("")}</div>`;

    if (!list.length) {
      els.pluginsBody.innerHTML = viewTabsHtml + `<p class="tagline">Sin resultados para este filtro.</p>`;
      els.pluginsBody.querySelectorAll("[data-view]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.pluginView = btn.dataset.view;
          renderPluginsBody();
        });
      });
      return;
    }

    els.pluginsBody.innerHTML = viewTabsHtml + list
      .map((p) => {
        const installed = Boolean(p.installed);
        const enabled = Boolean(p.enabled);
        const version = p.installedVersion || p.version || "—";
        const latest = p.latestVersion || p.repoVersion || null;
        const canUpdate = Boolean(installed && p.updateAvailable && latest);
        const statusPills = [];
        if (installed) {
          statusPills.push(`<span class="plugin-pill"><span class="dot"></span>Instalado</span>`);
          statusPills.push(
            `<span class="plugin-pill"><span class="dot ${enabled ? "" : "off"}"></span>${enabled ? "Activo" : "Desactivado"}</span>`
          );
        } else {
          statusPills.push(`<span class="plugin-pill"><span class="dot empty"></span>No instalado</span>`);
        }
        if (canUpdate) {
          statusPills.push(
            `<span class="plugin-pill plugin-update-pill"><span class="dot update"></span>${version} → ${latest} disponible</span>`
          );
        }
        if (p.compatible === false && p.compatibilityMessage) {
          statusPills.push(
            `<span class="plugin-pill plugin-warn-pill">${p.compatibilityMessage}</span>`
          );
        }

        const incompatibleAttrs =
          p.compatible === false
            ? ` disabled title="${String(p.compatibilityMessage || "Incompatible con esta versión de BMO").replace(/"/g, "&quot;")}"`
            : "";
        const actions = [];
        if (!installed) {
          actions.push(`<button type="button" class="primary" data-act="install" data-id="${p.id}"${incompatibleAttrs}>Instalar</button>`);
        } else {
          if (canUpdate) {
            actions.push(
              `<button type="button" class="primary" data-act="update" data-id="${p.id}"${incompatibleAttrs}>Actualizar</button>`
            );
          }
          if (enabled) {
            actions.push(`<button type="button" data-act="disable" data-id="${p.id}">Desactivar</button>`);
          } else {
            actions.push(`<button type="button" data-act="enable" data-id="${p.id}">Activar</button>`);
          }
          if (p.hasConfig) {
            actions.push(`<button type="button" data-act="config" data-id="${p.id}">Configurar</button>`);
          }
          actions.push(`<button type="button" data-act="perms" data-id="${p.id}">Permisos</button>`);
          actions.push(`<button type="button" data-act="logs" data-id="${p.id}">Logs</button>`);
          if (p.canUninstall === false) {
            const usedBy = (p.dependents || [])
              .map((d) => {
                const meta = list.find((x) => x.id === d);
                return meta?.name || d;
              })
              .join(", ");
            const title = usedBy
              ? `Usado por: ${usedBy}`
              : "No se puede desinstalar: otros plugins dependen de él";
            actions.push(
              `<button type="button" class="danger" data-act="uninstall" data-id="${p.id}" disabled title="${escHtml(title)}">Desinstalar</button>`
            );
          } else {
            actions.push(
              `<button type="button" class="danger" data-act="uninstall" data-id="${p.id}">Desinstalar</button>`
            );
          }
        }
        if ((p.dependencies || []).length) {
          const depBits = (p.dependencies || [])
            .map((d) => {
              const st = (p.dependencyStatus && p.dependencyStatus[d]) || "missing";
              const mark = st === "installed" ? "✓" : "✗";
              const meta = list.find((x) => x.id === d);
              return `${mark} ${escHtml(meta?.name || d)}`;
            })
            .join(" · ");
          statusPills.push(`<span class="plugin-pill plugin-deps-pill">Deps: ${depBits}</span>`);
        }

        const installedAtLine =
          state.pluginView === "new" && p.installedAt
            ? `<br><span class="plugin-installed-at">Instalado ${formatHistoryWhen(p.installedAt)}</span>`
            : "";
        const meta = canUpdate
          ? `<div class="plugin-card-meta">v${version}<br><span class="plugin-latest">→ ${latest}</span>${installedAtLine}</div>`
          : `<div class="plugin-card-meta">v${version}${installedAtLine}</div>`;

        // 4.13.18 - distincion oficial vs comunidad: mismo patron visual que
        // ya se usaba para imagenes Docker oficiales (docker-badge official).
        const officialBadge = p.official
          ? `<span class="docker-badge official">Oficial</span>`
          : `<span class="docker-badge community">Comunidad</span>`;
        const externalWarning = p.official
          ? ""
          : `<p class="plugin-external-warning">⚠️ Plugin externo — no está desarrollado por BMO. Revisa sus permisos antes de instalar.</p>`;

        return `<article class="plugin-card${canUpdate ? " plugin-card--update" : ""}" data-plugin="${p.id}">
          <div class="plugin-card-top">
            <div>
              <h3>${escHtml(p.name)} ${officialBadge}</h3>
              <p>${escHtml(p.description || "")}</p>
              ${externalWarning}
            </div>
            ${meta}
          </div>
          <div class="plugin-status">${statusPills.join("")}</div>
          <div class="plugin-actions">${actions.join("")}</div>
        </article>`;
      })
      .join("");

    els.pluginsBody.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => handlePluginAction(btn.dataset.act, btn.dataset.id));
    });
    els.pluginsBody.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.pluginView = btn.dataset.view;
        renderPluginsBody();
      });
    });
  }

  async function refreshPlugins() {
    state.plugins = await api("/api/plugins");
    renderPluginsBody();
  }

  async function openPluginsPanel() {
    if (!els.pluginsPanel || !els.pluginsBody) {
      toast("Panel Plugins no cargado — recarga la página");
      return;
    }
    els.pluginsPanel.hidden = false;
    els.pluginsBody.innerHTML = `<p class="tagline">Cargando plugins…</p>`;
    try {
      await refreshPlugins();
    } catch (err) {
      els.pluginsBody.innerHTML = `<p class="tagline">${escHtml(err.message)}</p>`;
      toast(err.message);
    }
  }

  async function handlePluginAction(act, id) {
    const plugin = (state.plugins || []).find((p) => p.id === id);
    if (!plugin) return;
    try {
      if (act === "install") {
        await openInstallConsent(plugin);
        return;
      }
      if (act === "update") {
        toast(`Actualizando ${plugin.name}…`);
        const from = plugin.installedVersion || plugin.version || "?";
        const to = plugin.latestVersion || plugin.repoVersion || "?";
        await api(`/api/plugins/${id}/update`, {
          method: "POST",
          body: "{}",
        });
        toast(`${plugin.name} actualizado ${from} → ${to}`);
        await refreshPlugins();
        return;
      }
      if (act === "uninstall") {
        if (plugin.canUninstall === false) {
          const names = (plugin.dependents || [])
            .map((d) => {
              const meta = (state.plugins || []).find((p) => p.id === d);
              return meta?.name || d;
            })
            .join(", ");
          toast(
            names
              ? `No permitido. Está siendo utilizado por: ${names}`
              : "No se puede desinstalar: otros plugins dependen de él"
          );
          return;
        }
        toast(`Desinstalando ${plugin.name}…`);
        await api(`/api/plugins/${id}/uninstall`, { method: "POST", body: "{}" });
        toast(`${plugin.name} desinstalado`);
        await refreshPlugins();
        return;
      }
      if (act === "enable") {
        await api(`/api/plugins/${id}/enable`, { method: "POST", body: "{}" });
        toast(`${plugin.name} activado`);
        await refreshPlugins();
        return;
      }
      if (act === "disable") {
        await api(`/api/plugins/${id}/disable`, { method: "POST", body: "{}" });
        toast(`${plugin.name} desactivado`);
        await refreshPlugins();
        return;
      }
      if (act === "config") {
        closePluginsPanel();
        openConfigPanel(id, plugin.name);
        return;
      }
      if (act === "perms") {
        state.permsFrom = "plugins";
        openPermsPanel(plugin);
        return;
      }
      if (act === "logs") {
        state.logsFrom = "plugins";
        openLogsPanel(plugin);
        return;
      }
    } catch (err) {
      toast(err.message || "Error en plugin");
    }
  }



  els.sysHubPanel?.addEventListener("click", (e) => {
    if (e.target === els.sysHubPanel) setAppNav("inicio");
    const card = e.target.closest("[data-sys-open]");
    if (!card || !els.sysHubPanel.contains(card)) return;
    const kind = card.getAttribute("data-sys-open");
    if (kind === "estado") openEstadoPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "actividad") openActividadPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "tareas") openTareasPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "health") openHealthPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "maintenance") openMaintenancePanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "settings") openSettingsPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "personalizacion") openPersonalizacionPanel();
    else if (kind === "quickmenu") openQuickMenuPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "perf") openPerfPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "monitor") openMonitorPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "plugins") openPluginsPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "alerts") openAlertsPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "events") openEventsPanel().catch((err) => toast(err.message || "Error"));
    else if (kind === "history") toast("Históricos: próximamente (usa Grafana)");
    else if (kind === "devices") {
      setAppNav("dispositivos", { keepPanels: true });
      openDevicesPanel("hub").catch((err) => toast(err.message || "Error"));
    } else if (kind === "marketplace") {
      openMarketplacePanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "registros") {
      openSysLogsPanel();
    } else if (kind === "permisos") {
      openSysPermsHub();
    } else if (kind === "usuarios") {
      openSysUsersPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "backup") {
      state.dockerTab = "backup";
      openDockerPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "updates") {
      state.dockerTab = "updates";
      openDockerPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "escenas") {
      openScenesPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "automatizaciones") {
      openAutomationsPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "ai") {
      openAiPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "gesturememe") {
      openGesturememePanel();
    } else if (kind === "integrations") {
      openIntegrationsPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "accounts") {
      openAccountsPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "publicapi") {
      openPublicApiPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "recovery") {
      openRecoveryPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "securitycenter") {
      openSecurityCenterPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokedex") {
      openPokedexPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "explore") {
      openPokemonExplorePanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokebag") {
      openPokebagPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokemoves") {
      openPokemovesPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokecare") {
      openPokecarePanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokemonhome") {
      openPokemonHomePanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokemedals") {
      openPokemedalsPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokeevents") {
      openPokeeventsPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokebox") {
      openPokeboxPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "pokeprogress") {
      openPokeprogressPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "inframap") {
      openInfraMapPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "offline") {
      openOfflineStatusPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "ecodash") {
      openEcoDashboardPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "modos") {
      openModosPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "personal") {
      openPersonalPanel().catch((err) => toast(err.message || "Error"));
    } else if (kind === "bmovoice") {
      openBmoVoicePanel();
    } else if (kind === "brain") {
      openBrainPanel().catch((err) => toast(err.message || "Error"));
    }
  });

  els.marketplaceBack?.addEventListener("click", () => {
    closeMarketplacePanel();
    openSysHub();
  });
  els.marketplaceRefresh?.addEventListener("click", () => {
    openMarketplacePanel().catch((err) => toast(err.message || "Error"));
  });
  els.marketplacePanel?.addEventListener("click", (e) => {
    if (e.target === els.marketplacePanel) {
      closeMarketplacePanel();
      openSysHub();
    }
  });

  els.sysLogsBack?.addEventListener("click", () => {
    closeSysLogsPanel();
    openSysHub();
  });
  els.sysLogsPanel?.addEventListener("click", (e) => {
    if (e.target === els.sysLogsPanel) {
      closeSysLogsPanel();
      openSysHub();
    }
    const row = e.target.closest("[data-logs-open]");
    if (!row || !els.sysLogsPanel.contains(row)) return;
    const id = row.getAttribute("data-logs-open");
    const plugin = (state.plugins || []).find((p) => p.id === id);
    if (plugin) {
      state.logsFrom = "sys";
      closeSysLogsPanel();
      openLogsPanel(plugin).catch((err) => toast(err.message || "Error"));
    }
  });

  els.sysPermsBack?.addEventListener("click", () => {
    closeSysPermsPanel();
    openSysHub();
  });
  els.sysPermsPanel?.addEventListener("click", (e) => {
    if (e.target === els.sysPermsPanel) {
      closeSysPermsPanel();
      openSysHub();
    }
    const row = e.target.closest("[data-perms-open]");
    if (!row || !els.sysPermsPanel.contains(row)) return;
    const id = row.getAttribute("data-perms-open");
    const plugin = (state.plugins || []).find((p) => p.id === id);
    if (plugin) {
      state.permsFrom = "sys";
      closeSysPermsPanel();
      openPermsPanel(plugin).catch((err) => toast(err.message || "Error"));
    }
  });

  els.sysUsersBack?.addEventListener("click", () => {
    closeSysUsersPanel();
    openSysHub();
  });
  els.sysUsersPanel?.addEventListener("click", (e) => {
    if (e.target === els.sysUsersPanel) {
      closeSysUsersPanel();
      openSysHub();
    }
  });
  els.scenesBack?.addEventListener("click", () => {
    if (state.scenesView === "result") {
      if (state.sceneResultFrom === "history") {
        openHistoryView();
      } else {
        state.scenesView = "list";
        renderScenesBody();
      }
      return;
    }
    if (state.scenesView === "editor" || state.scenesView === "history") {
      state.scenesView = "list";
      renderScenesBody();
      return;
    }
    closeScenesPanel();
    openSysHub();
  });
  els.scenesPanel?.addEventListener("click", (e) => {
    if (e.target === els.scenesPanel) {
      closeScenesPanel();
      openSysHub();
    }
  });
  els.automationsBack?.addEventListener("click", () => {
    closeAutomationsPanel();
    openSysHub();
  });
  els.automationsPanel?.addEventListener("click", (e) => {
    if (e.target === els.automationsPanel) {
      closeAutomationsPanel();
      openSysHub();
    }
  });
  els.alertsBack?.addEventListener("click", () => {
    closeAlertsPanel();
    openSysHub();
  });
  els.alertsRefresh?.addEventListener("click", () => {
    refreshAlerts().catch((err) => toast(err.message));
  });
  els.alertsTest?.addEventListener("click", () => {
    testAlerts("all").catch((err) => toast(err.message));
  });
  els.alertsPanel?.addEventListener("click", (e) => {
    if (e.target === els.alertsPanel) {
      closeAlertsPanel();
      openSysHub();
    }
    const tabBtn = e.target.closest("[data-alerts-tab]");
    if (tabBtn && els.alertsPanel.contains(tabBtn)) {
      state.alertsTab = tabBtn.getAttribute("data-alerts-tab") || "active";
      renderAlertsBody();
    }
  });
  document.getElementById("home-open-devices")?.addEventListener("click", () => {
    setAppNav("dispositivos");
  });
  document.getElementById("home-open-mipc")?.addEventListener("click", () => {
    state.agentFocusId = state.homeDeviceId || "mi-pc";
    setAppNav("dispositivos");
  });
  document.getElementById("home-open-services")?.addEventListener("click", () => {
    setAppNav("servicios");
  });
  document.getElementById("home-open-scenes")?.addEventListener("click", () => {
    setAppNav("sistema", { keepPanels: true });
    openScenesPanel().catch((err) => toast(err.message || "Error"));
  });
  els.devicesRefresh?.addEventListener("click", () => {
    refreshDevicesPanel().catch((err) => toast(err.message));
  });
  els.devicesPanel?.addEventListener("click", (e) => {
    if (e.target === els.devicesPanel) {
      closeDevicesPanel();
      if (state.devicesFrom === "hub") openSysHub();
      else setAppNav("inicio");
    }
  });
  els.appCatalogBack?.addEventListener("click", closeAppCatalogPanel);
  els.appCatalogPanel?.addEventListener("click", (e) => {
    if (e.target === els.appCatalogPanel) closeAppCatalogPanel();
  });
  els.deviceHistoryBack?.addEventListener("click", closeDeviceHistoryPanel);
  els.deviceHistoryPanel?.addEventListener("click", (e) => {
    if (e.target === els.deviceHistoryPanel) closeDeviceHistoryPanel();
  });
  els.eventsBack?.addEventListener("click", () => {
    closeEventsPanel();
    openSysHub();
  });
  els.eventsRefresh?.addEventListener("click", () => {
    refreshEvents().catch((err) => toast(err.message));
  });
  els.estadoPanel?.addEventListener("click", (e) => {
    if (e.target === els.estadoPanel) {
      closeEstadoPanel();
      openSysHub();
    }
  });
  els.actividadPanel?.addEventListener("click", (e) => {
    if (e.target === els.actividadPanel) {
      closeActividadPanel();
      openSysHub();
    }
  });
  els.tareasPanel?.addEventListener("click", (e) => {
    if (e.target === els.tareasPanel) {
      closeTareasPanel();
      openSysHub();
    }
  });
  els.healthPanel?.addEventListener("click", (e) => {
    if (e.target === els.healthPanel) {
      closeHealthPanel();
      openSysHub();
    }
  });
  els.maintenancePanel?.addEventListener("click", (e) => {
    if (e.target === els.maintenancePanel) {
      closeMaintenancePanel();
      openSysHub();
    }
  });
  els.settingsPanel?.addEventListener("click", (e) => {
    if (e.target === els.settingsPanel) {
      closeSettingsPanel();
      openSysHub();
    }
  });
  els.personalizacionPanel?.addEventListener("click", (e) => {
    if (e.target === els.personalizacionPanel) {
      closePersonalizacionPanel();
      openSysHub();
    }
  });
  els.navegacionPanel?.addEventListener("click", (e) => {
    if (e.target === els.navegacionPanel) {
      closeNavegacionPanel();
      openPersonalizacionPanel();
    }
  });
  els.customPagePanel?.addEventListener("click", (e) => {
    if (e.target === els.customPagePanel) {
      closeCustomPagePanel();
      openNavegacionPanel().catch(() => {});
    }
  });
  els.quickMenuPanel?.addEventListener("click", (e) => {
    if (e.target === els.quickMenuPanel) {
      closeQuickMenuPanel();
      openSysHub();
    }
  });
  els.aparienciaPanel?.addEventListener("click", (e) => {
    if (e.target === els.aparienciaPanel) {
      closeAparienciaPanel();
      openPersonalizacionPanel();
    }
  });
  els.pantallasPanel?.addEventListener("click", (e) => {
    if (e.target === els.pantallasPanel) {
      closePantallasPanel();
      openPersonalizacionPanel();
    }
  });
  els.eventsPanel?.addEventListener("click", (e) => {
    if (e.target === els.eventsPanel) {
      closeEventsPanel();
      openSysHub();
    }
    const fBtn = e.target.closest("[data-events-filter]");
    if (fBtn && els.eventsPanel.contains(fBtn)) {
      state.eventsFilter = fBtn.getAttribute("data-events-filter") || "all";
      renderEventsBody();
    }
  });
  els.monitorBack?.addEventListener("click", () => {
    closeMonitorPanel();
    openSysHub();
  });
  els.monitorRefresh?.addEventListener("click", () => {
    refreshMonitor().catch((err) => toast(err.message));
  });
  els.monitorPanel?.addEventListener("click", (e) => {
    if (e.target === els.monitorPanel) {
      closeMonitorPanel();
      openSysHub();
    }
  });
  els.perfBack?.addEventListener("click", () => {
    closePerfPanel();
    openSysHub();
  });
  els.perfMonitor?.addEventListener("click", () => {
    openMonitorPanel().catch((err) => toast(err.message || "Error monitorización"));
  });
  els.perfPlugins?.addEventListener("click", () => {
    closePerfPanel();
    openPluginsPanel();
  });
  els.perfPanel?.addEventListener("click", (e) => {
    if (e.target === els.perfPanel) {
      closePerfPanel();
      openSysHub();
    }
  });

  els.pluginsBack?.addEventListener("click", closePluginsPanel);
  els.pluginsPanel?.addEventListener("click", (e) => {
    if (e.target === els.pluginsPanel) closePluginsPanel();
  });
  els.pluginsSearch?.addEventListener("input", () => {
    state.pluginSearch = els.pluginsSearch.value || "";
    renderPluginsBody();
  });
  function returnFromPermsPanel() {
    closePermsPanel();
    if (state.permsFrom === "sys") openSysPermsHub();
  }
  els.permsBack?.addEventListener("click", returnFromPermsPanel);
  els.permsSave?.addEventListener("click", savePermsPanel);
  els.permsPanel?.addEventListener("click", (e) => {
    if (e.target === els.permsPanel) returnFromPermsPanel();
  });
  els.consentAccept?.addEventListener("click", acceptInstallConsent);
  els.consentDeny?.addEventListener("click", closeConsentPanel);
  els.consentCancel?.addEventListener("click", closeConsentPanel);
  els.consentPanel?.addEventListener("click", (e) => {
    if (e.target === els.consentPanel) closeConsentPanel();
  });

  function returnFromLogsPanel() {
    closeLogsPanel();
    if (state.logsFrom === "sys") openSysLogsPanel();
  }
  els.logsBack?.addEventListener("click", returnFromLogsPanel);
  els.logsRefresh?.addEventListener("click", () => {
    refreshLogsPanel().catch((err) => toast(err.message));
  });
  els.logsFilter?.addEventListener("change", () => {
    refreshLogsPanel().catch((err) => toast(err.message));
  });
  els.logsCopy?.addEventListener("click", copyLogsPanel);
  els.logsDownload?.addEventListener("click", downloadLogsPanel);
  els.logsClear?.addEventListener("click", clearLogsPanel);
  els.logsPanel?.addEventListener("click", (e) => {
    if (e.target === els.logsPanel) returnFromLogsPanel();
  });

  // 4.11.7 - El dock ahora se renderiza dinamicamente (ver renderDock()),
  // que ya se encarga de enlazar los clicks de sus propios botones - no
  // hace falta un binding estatico aqui.
  renderDock();
  loadDockConfig();
  initGlobalGestures();
  // Vista inicial
  setAppNav("inicio", { keepPanels: true });
  api("/api/applications")
    .then((data) => {
      state.appCatalog = data.apps || [];
    })
    .catch(() => {});
  // 4.11.10 - cache de escenas para los tiles de Inicio/Menu rapido; se
  // recarga tambien cada vez que se abre el Menu rapido (por si el usuario
  // creo/borro una escena entretanto), esto es solo la carga inicial.
  api("/api/scenes")
    .then((data) => {
      state.scenes = data.scenes || [];
      renderHome();
    })
    .catch(() => {});

  async function refresh() {
    try {
      const [system, docker, homepageDevices, agentDevices, metricsSnap] = await Promise.all([
        api("/api/system"),
        api("/api/docker"),
        api("/api/homepage/devices").catch(() => ({ devices: [] })),
        api("/api/devices").catch(() => null),
        api("/api/metrics").catch(() => null),
      ]);
      state.system = system;
      state.docker = docker;
      state.devicesApi = homepageDevices.devices || [];
      if (agentDevices) state.agentDevices = agentDevices;
      if (metricsSnap) state.metricsSnap = metricsSnap;
      // No bloquear el dashboard si Spotify falla
      if (document.getElementById("bmomusic-panel")?.hidden !== false) {
        await refreshSpotifyStatus().catch(() => {});
      }
      // No re-renderizar la grid de Servicios mientras el usuario esta
      // reordenando: reconstruiria el DOM desde el array `services` y
      // perderia el arrastre en curso (4.11.2).
      if (!state.reorderingServices) renderServices();
      renderHome();
      // refreshEvents() ya actualiza el badge de notificaciones con el mismo
      // fetch (ver 4.10.18) - no hace falta un refreshNotificationBadge() aparte aqui.
      refreshEvents().catch(() => {});
    } catch (err) {
      console.error(err);
      toast("Error hablando con la API BMO");
    }
  }

  renderClock();
  setInterval(renderClock, 1000);
  // Aplica el orden guardado de Servicios ANTES del primer render, para que
  // no haya un parpadeo con el orden por defecto seguido de un reordenado.
  api("/api/ui/services-order")
    .then((data) => applyServiceOrder(data.order))
    .catch(() => {})
    .finally(() => {
      api("/api/ui/favorites")
        .then((data) => {
          state.serviceFavorites = data.services || [];
          sortFavoritesFirst();
        })
        .catch(() => {})
        .finally(() => {
          refresh();
          setInterval(refresh, 10000);
        });
    });
  api("/api/system/settings")
    .then((data) => {
      state.settingsData = data;
      applyBrandName(data.general?.name);
      applyTheme(data.general?.theme);
      applyAccent(data.general?.accentColor, data.general?.accentCustomHex);
      // 4.16.19 - Pagina de inicio configurable: solo se aplica a las 4
      // paginas fijas (inicio/servicios/sistema/dispositivos), nunca a una
      // pagina personalizada - arrancar directo en una pagina custom
      // dependeria de que sus datos (uiPages) ya estuvieran cargados en
      // este punto del arranque, un riesgo real de pantalla rota que no
      // compensa para este caso de uso.
      const FIXED_START_PAGES = new Set(["inicio", "servicios", "sistema", "dispositivos"]);
      if (data.general?.startPage && FIXED_START_PAGES.has(data.general.startPage) && data.general.startPage !== "inicio") {
        setAppNav(data.general.startPage);
      }
    })
    .catch(() => {});
  api("/api/ui/background")
    .then((data) => {
      state.background = data;
      applyBackground(data);
    })
    .catch(() => {});
  connectEventsWs();
  refreshWeather();
  setInterval(refreshWeather, 12 * 60 * 1000);

  // 4.16.13 - Responsive interno con nombre: los breakpoints CSS reales ya
  // existian desde 4.11.18 (768px tablet, 1200px desktop, verificados con
  // getComputedStyle contra la Pi real) - esto no los reconstruye, solo
  // expone un concepto con nombre (PORTRAIT_SMALL/PORTRAIT_MEDIUM/etc) que
  // el resto de la app puede consultar via state.screenMode en vez de
  // reinventar sus propios chequeos de ancho sueltos.
  function computeScreenMode() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const portrait = h >= w;
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const size = w < 768 ? "small" : w < 1200 ? "medium" : "large";
    const mode = `${portrait ? "PORTRAIT" : "LANDSCAPE"}_${size.toUpperCase()}`;
    return { mode, width: w, height: h, portrait, touch, dpr: window.devicePixelRatio || 1 };
  }
  function applyScreenMode() {
    state.screenMode = computeScreenMode();
    document.documentElement.setAttribute("data-screen-mode", state.screenMode.mode);
    document.documentElement.setAttribute("data-touch", state.screenMode.touch ? "1" : "0");
  }
  applyScreenMode();
  window.addEventListener("resize", applyScreenMode);

  // 4.16.15 - Accesibilidad: se aplica lo antes posible al arrancar (no
  // espera a que se abra Configuracion), para que texto grande/contraste/
  // reducir animaciones esten activos desde el primer render si el
  // usuario ya los tenia puestos.
  function applyAccessibility(prefs) {
    state.accessibility = prefs;
    const html = document.documentElement;
    html.toggleAttribute("data-a11y-large-text", !!prefs.largeText);
    html.toggleAttribute("data-a11y-high-contrast", !!prefs.highContrast);
    html.toggleAttribute("data-a11y-reduce-motion", !!prefs.reduceMotion);
    html.toggleAttribute("data-a11y-visual-vibration", !!prefs.visualVibration);
  }
  api("/api/ui/accessibility")
    .then(applyAccessibility)
    .catch(() => {});

  // Tras OAuth callback: /?spotify=connected|error
  try {
    const params = new URLSearchParams(window.location.search);
    const sp = params.get("spotify");
    if (sp === "connected") {
      toast("Spotify conectado");
      history.replaceState({}, "", "/");
      setTimeout(() => openSpotifyPanel(), 400);
    } else if (sp === "error") {
      toast(params.get("msg") || "Error al conectar Spotify");
      history.replaceState({}, "", "/");
      setTimeout(() => openSpotifyPanel(), 400);
    }
  } catch (_) {}
})();
