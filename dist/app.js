(() => {
  // IP de la Pi en la LAN: único punto a tocar si cambia de dirección.
  const BMO_HOST = "192.168.1.40";
  const API_BASE =
    window.location.port === "8080" || window.location.hostname === "127.0.0.1"
      ? ""
      : `http://${BMO_HOST}:8080`;
  const API_KEY = "6cf4e9146401b55bfb0f324e00b916981e0afe5c5705af46dc58a55cefd12495";
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
    spotifyPanel: document.getElementById("spotify-panel"),
    spotifyBody: document.getElementById("spotify-body"),
    spotifyBack: document.getElementById("spotify-back"),
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
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
    if (els.spotifyPanel) els.spotifyPanel.hidden = true;
  }

  function fmtMs(ms) {
    const n = Math.max(0, Math.floor(Number(ms) || 0) / 1000);
    const m = Math.floor(n / 60);
    const s = Math.floor(n % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function updateSpotifyChrome(s) {
    const conn = document.getElementById("spotify-conn");
    const oauth = document.getElementById("spotify-oauth-line");
    if (conn) {
      if (!s.configured) {
        conn.className = "sp-conn off";
        conn.innerHTML = `<span class="sp-conn-dot"></span> Sin config`;
      } else if (!s.connected) {
        conn.className = "sp-conn off";
        conn.innerHTML = `<span class="sp-conn-dot"></span> Desconectado`;
      } else {
        conn.className = "sp-conn";
        conn.innerHTML = `<span class="sp-conn-dot"></span> Conectado`;
      }
    }
    if (oauth) {
      if (!s.configured) oauth.innerHTML = `OAuth <span class="off">pendiente</span>`;
      else if (!s.connected) oauth.innerHTML = `OAuth <span class="off">sin cuenta</span>`;
      else oauth.innerHTML = `OAuth <span class="on">activo</span>`;
    }
  }

  function spotifyTrackRow(track, subText, opts) {
    const thumb = track.image
      ? `<img class="sp-q-thumb" src="${escHtml(track.image)}" alt="" />`
      : `<div class="sp-q-thumb" aria-hidden="true"></div>`;
    const inner = `
        ${thumb}
        <div class="sp-q-meta">
          <h4>${escHtml(track.name)}</h4>
          <p>${escHtml(subText || track.artists || "—")}</p>
        </div>`;
    if (opts && opts.clickable && track.uri) {
      return `<button type="button" class="sp-q-row sp-q-row-btn" data-sp-play-track="${escHtml(track.uri)}">${inner}</button>`;
    }
    return `<div class="sp-q-row">${inner}</div>`;
  }

  function spotifyPlaylistRow(pl) {
    const thumb = pl.image
      ? `<img class="sp-q-thumb" src="${escHtml(pl.image)}" alt="" />`
      : `<div class="sp-q-thumb" aria-hidden="true"></div>`;
    return `
      <button type="button" class="sp-q-row sp-q-row-btn" data-sp-play-playlist="${escHtml(pl.uri)}">
        ${thumb}
        <div class="sp-q-meta">
          <h4>${escHtml(pl.name)}</h4>
          <p>${escHtml(pl.tracksTotal || 0)} canciones${pl.owner ? " · " + escHtml(pl.owner) : ""}</p>
        </div>
      </button>`;
  }

  function spotifyScopeErrorHtml(err) {
    const insufficient =
      /insufficient client scope/i.test(err?.message || "") ||
      err?.details?.error?.status === 403;
    if (insufficient) {
      return `<div class="sp-stub">Tu conexión con Spotify no tiene permiso para esto todavía. Desconecta y vuelve a conectar tu cuenta para concederlo.</div>`;
    }
    return `<div class="sp-stub">${escHtml(err?.message || "Error cargando datos de Spotify")}</div>`;
  }

  async function loadSpotifyTabData(tab) {
    if (tab === "cola" && state.spotifyQueueData) return;
    if (tab === "favoritos" && state.spotifyFavorites) return;
    if (tab === "playlists" && state.spotifyPlaylists) return;
    state.spotifyTabLoading = true;
    state.spotifyTabError = null;
    renderSpotifyBody();
    try {
      if (tab === "cola") {
        state.spotifyQueueData = await api("/api/spotify/queue");
      } else if (tab === "favoritos") {
        const res = await api("/api/spotify/saved-tracks");
        state.spotifyFavorites = res.items || [];
      } else if (tab === "playlists") {
        const res = await api("/api/spotify/playlists");
        state.spotifyPlaylists = res.items || [];
      }
    } catch (err) {
      state.spotifyTabError = err;
    } finally {
      state.spotifyTabLoading = false;
      renderSpotifyBody();
    }
  }

  function spotifyTabBody(s) {
    const tab = state.spotifyTab || "cola";

    if (state.spotifyTabLoading) {
      return `<div class="sp-stub">Cargando…</div>`;
    }
    if (state.spotifyTabError) {
      return spotifyScopeErrorHtml(state.spotifyTabError);
    }

    if (tab === "favoritos") {
      const items = state.spotifyFavorites || [];
      if (!items.length) return `<div class="sp-stub">Sin canciones guardadas en tu cuenta de Spotify.</div>`;
      return `
        <div class="sp-list-head">
          <h3>Favoritos · ${items.length}</h3>
          <button type="button" class="dk-btn" data-sp-play-favorites>▶ Reproducir todo</button>
        </div>
        <div class="sp-queue">${items.map((t) => spotifyTrackRow(t, t.artists, { clickable: true })).join("")}</div>`;
    }

    if (tab === "playlists") {
      const items = state.spotifyPlaylists || [];
      if (!items.length) return `<div class="sp-stub">No tienes playlists en tu cuenta de Spotify.</div>`;
      return `
        <div class="sp-list-head"><h3>Playlists · ${items.length}</h3></div>
        <div class="sp-queue">${items.map(spotifyPlaylistRow).join("")}</div>`;
    }

    const data = state.spotifyQueueData;
    const current = (data && data.currentlyPlaying) || s.track;
    const queue = (data && data.queue) || [];
    const q = (state.spotifySearch || "").trim().toLowerCase();
    let items = [];
    if (current) items.push({ ...current, sub: "Sonando ahora" });
    items = items.concat(queue.map((t) => ({ ...t, sub: t.artists })));
    if (q) {
      items = items.filter((t) =>
        `${t.name || ""} ${t.artists || ""} ${t.album || ""}`.toLowerCase().includes(q)
      );
    }
    const rows = items.length
      ? `<div class="sp-queue">${items.map((t) => spotifyTrackRow(t, t.sub)).join("")}</div>`
      : q
        ? `<div class="sp-stub">Sin coincidencias para «${escHtml(state.spotifySearch)}».</div>`
        : `<div class="sp-stub">Nada en cola ahora mismo.</div>`;
    return `
      <div class="sp-list-head">
        <h3>En cola · ${items.length}</h3>
      </div>
      ${rows}`;
  }

  function bindSpotifyControls(s) {
    els.spotifyBody.querySelector("#sp-device")?.addEventListener("change", async (e) => {
      try {
        await api("/api/spotify/device", {
          method: "POST",
          body: JSON.stringify({ deviceId: e.target.value }),
        });
        toast("Dispositivo Spotify fijado");
        await refreshSpotifyStatus();
      } catch (err) {
        toast(err.message);
      }
    });
    els.spotifyBody.querySelector("#sp-prev")?.addEventListener("click", () => spotifyAction("previous"));
    els.spotifyBody.querySelector("#sp-next")?.addEventListener("click", () => spotifyAction("next"));
    els.spotifyBody.querySelector("#sp-toggle")?.addEventListener("click", () =>
      spotifyAction(s.playing ? "pause" : "play")
    );
    els.spotifyBody.querySelector("#sp-shuffle")?.addEventListener("click", async () => {
      try {
        await api("/api/spotify/shuffle", {
          method: "POST",
          body: JSON.stringify({ state: !s.shuffleState }),
        });
        await refreshSpotifyStatus();
      } catch (err) {
        toast(err.message || "No se pudo cambiar aleatorio");
      }
    });
    els.spotifyBody.querySelector("#sp-queue-jump")?.addEventListener("click", () => {
      state.spotifyTab = "cola";
      renderSpotifyBody();
      loadSpotifyTabData("cola").catch(() => {});
    });
    const vol = els.spotifyBody.querySelector("#sp-volume");
    const volLabel = els.spotifyBody.querySelector("#sp-vol-label");
    vol?.addEventListener("pointerdown", () => {
      state.spotifyVolDragging = true;
    });
    vol?.addEventListener("pointerup", () => {
      state.spotifyVolDragging = false;
    });
    vol?.addEventListener("input", () => {
      if (volLabel) volLabel.textContent = `${vol.value}%`;
    });
    vol?.addEventListener("change", async () => {
      state.spotifyVolDragging = false;
      try {
        await api("/api/spotify/volume", {
          method: "POST",
          body: JSON.stringify({ volume: Number(vol.value) }),
        });
      } catch (err) {
        toast(err.message);
      }
    });
    els.spotifyBody.querySelector("#sp-heart")?.addEventListener("click", () => {
      toast("Favoritos: aún no hay API en BMO");
    });
    els.spotifyBody.querySelectorAll(".sp-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.spotifyTab = btn.dataset.spTab || "cola";
        renderSpotifyBody();
        loadSpotifyTabData(state.spotifyTab).catch(() => {});
      });
    });
    els.spotifyBody.querySelectorAll("[data-sp-play-playlist]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const contextUri = btn.getAttribute("data-sp-play-playlist");
        try {
          await api("/api/spotify/play-context", {
            method: "POST",
            body: JSON.stringify({ contextUri }),
          });
          toast("▶ Reproduciendo playlist");
          state.spotifyQueueData = null;
          await refreshSpotifyStatus();
        } catch (err) {
          toast(err.message || "No se pudo reproducir la playlist");
        }
      });
    });
    els.spotifyBody.querySelector("[data-sp-play-favorites]")?.addEventListener("click", async () => {
      const uris = (state.spotifyFavorites || []).map((t) => t.uri).filter(Boolean);
      if (!uris.length) {
        toast("Sin canciones guardadas para reproducir");
        return;
      }
      try {
        await api("/api/spotify/play-context", {
          method: "POST",
          body: JSON.stringify({ uris }),
        });
        toast("▶ Reproduciendo Favoritos");
        state.spotifyQueueData = null;
        await refreshSpotifyStatus();
      } catch (err) {
        toast(err.message || "No se pudieron reproducir los favoritos");
      }
    });
    els.spotifyBody.querySelectorAll("[data-sp-play-track]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const uri = btn.getAttribute("data-sp-play-track");
        const uris = (state.spotifyFavorites || []).map((t) => t.uri).filter(Boolean);
        try {
          await api("/api/spotify/play-context", {
            method: "POST",
            body: JSON.stringify({ uris, offset: { uri } }),
          });
          toast("▶ Reproduciendo");
          state.spotifyQueueData = null;
          await refreshSpotifyStatus();
        } catch (err) {
          toast(err.message || "No se pudo reproducir la canción");
        }
      });
    });
    const search = els.spotifyBody.querySelector("#sp-search");
    search?.addEventListener("input", () => {
      state.spotifySearch = search.value || "";
      const host = els.spotifyBody.querySelector("#sp-tab-host");
      if (host) host.innerHTML = spotifyTabBody(s);
    });
    els.spotifyBody.querySelector("#sp-disconnect")?.addEventListener("click", async () => {
      try {
        await api("/api/spotify/disconnect", { method: "POST", body: "{}" });
        state.spotifyQueueData = null;
        state.spotifyFavorites = null;
        state.spotifyPlaylists = null;
        toast("Spotify desconectado");
        await refreshSpotifyStatus();
      } catch (err) {
        toast(err.message);
      }
    });
    els.spotifyBody.querySelector("#sp-open-cfg")?.addEventListener("click", () => {
      closeSpotifyPanel();
      openConfigPanel("spotify", "Spotify");
    });
    els.spotifyBody.querySelector("#sp-connect")?.addEventListener("click", connectSpotify);
  }

  function renderSpotifyBody() {
    const s = state.spotify || {
      connected: false,
      configured: false,
      playing: false,
      track: null,
      device: null,
      devices: [],
      volume: 70,
      progressMs: 0,
    };
    updateSpotifyChrome(s);

    if (!s.configured) {
      els.spotifyBody.innerHTML = `
        <div class="spotify-setup">
          <p>Para controlar Spotify en tu PC:</p>
          <ol>
            <li>Crea una app en developer.spotify.com</li>
            <li>Redirect URI: <code>http://${BMO_HOST}:8080/api/spotify/callback</code></li>
            <li>Guarda Client ID + Secret en la config del plugin</li>
            <li>Vuelve aquí y conecta tu cuenta Premium</li>
          </ol>
          <button type="button" class="sp-btn secondary" id="sp-open-cfg">Abrir configuración</button>
        </div>`;
      bindSpotifyControls(s);
      return;
    }

    if (!s.connected) {
      els.spotifyBody.innerHTML = `
        <div class="spotify-setup">
          <p>Credenciales listas. Conecta tu cuenta Premium para controlar el PC.</p>
          <button type="button" class="sp-btn" id="sp-connect">Conectar con Spotify</button>
          <button type="button" class="sp-btn secondary" id="sp-open-cfg">Editar Client ID / Secret</button>
        </div>`;
      bindSpotifyControls(s);
      return;
    }

    const track = s.track;
    const title = escHtml(track?.name || "Nada en reproducción");
    const artists = escHtml(track?.artists || "Abre Spotify en el PC y dale al play una vez");
    const album = escHtml(track?.album || "");
    const art = track?.image
      ? `<img class="sp-art" src="${escHtml(track.image)}" alt="" />`
      : `<div class="sp-art" aria-hidden="true"></div>`;
    const devices = s.devices || [];
    const deviceOpts = devices.length
      ? devices
          .map(
            (d) =>
              `<option value="${escHtml(d.id)}" ${
                s.deviceId === d.id || d.isActive ? "selected" : ""
              }>${escHtml(d.name)}</option>`
          )
          .join("")
      : `<option value="">No hay dispositivos — abre Spotify Desktop</option>`;
    const dur = track?.durationMs || 0;
    const prog = Math.min(Number(s.progressMs) || 0, dur || 0);
    const pct = dur > 0 ? Math.round((prog / dur) * 1000) / 10 : 0;
    const vol = state.spotifyVolDragging
      ? Number(els.spotifyBody.querySelector("#sp-volume")?.value ?? s.volume ?? 70)
      : s.volume ?? 70;
    const tab = state.spotifyTab || "cola";
    const pauseIcon =
      '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    const playIcon =
      '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    const skipPrev =
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>';
    const skipNext =
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M16 6h2v12h-2zm-1.5 6L6 18V6z"/></svg>';
    const shuffleIcon =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>';
    const queueIcon =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg>';

    els.spotifyBody.innerHTML = `
      <div class="spotify-player">
        <div class="sp-now">
          <div class="sp-art-wrap">
            ${art}
            <button type="button" class="sp-heart" id="sp-heart" aria-label="Favorito">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.4-9.5-8.2C.7 9.7 2.2 6 6 6c2 0 3.2 1.1 4 2.2C10.8 7.1 12 6 14 6c3.8 0 5.3 3.7 3.5 6.8C19 16.6 12 21 12 21z"/></svg>
            </button>
          </div>
          <div class="sp-meta">
            <h3>${title}</h3>
            <p>${artists}${album ? ` · ${album}` : ""}</p>
          </div>
          <div class="sp-progress">
            <span class="sp-time" id="sp-t0">${fmtMs(prog)}</span>
            <input class="sp-bar" id="sp-progress" type="range" min="0" max="1000" value="${Math.round(
              pct * 10
            )}" style="--sp-pct:${pct}%" disabled aria-label="Progreso" />
            <span class="sp-time" id="sp-t1">${fmtMs(dur)}</span>
          </div>
          <div class="sp-controls">
            <button type="button" id="sp-shuffle" class="sp-toggle-btn ${s.shuffleState ? "active" : ""}" aria-label="Aleatorio" aria-pressed="${s.shuffleState ? "true" : "false"}">${shuffleIcon}</button>
            <button type="button" id="sp-prev" aria-label="Anterior">${skipPrev}</button>
            <button type="button" class="play" id="sp-toggle" aria-label="Play/Pause">${
              s.playing ? pauseIcon : playIcon
            }</button>
            <button type="button" id="sp-next" aria-label="Siguiente">${skipNext}</button>
            <button type="button" id="sp-queue-jump" class="sp-toggle-btn ${tab === "cola" ? "active" : ""}" aria-label="Cola">${queueIcon}</button>
          </div>
        </div>

        <div class="sp-row2">
          <div class="sp-mini-card">
            <div class="sp-mini-label">Reproduciendo en</div>
            <select id="sp-device" class="sp-device-select">${deviceOpts}</select>
          </div>
          <div class="sp-mini-card">
            <div class="sp-vol-head">
              <div class="sp-mini-label">Volumen</div>
              <div class="sp-vol-pct" id="sp-vol-label">${vol}%</div>
            </div>
            <input id="sp-volume" class="sp-vol-range" type="range" min="0" max="100" value="${vol}" />
          </div>
        </div>

        <div class="sp-tabs" role="tablist">
          <button type="button" class="sp-tab ${tab === "cola" ? "active" : ""}" data-sp-tab="cola" role="tab">Cola</button>
          <button type="button" class="sp-tab ${tab === "favoritos" ? "active" : ""}" data-sp-tab="favoritos" role="tab">Favoritos</button>
          <button type="button" class="sp-tab ${tab === "playlists" ? "active" : ""}" data-sp-tab="playlists" role="tab">Playlists</button>
        </div>
        <input id="sp-search" class="sp-search" type="search" placeholder="Buscar canciones, artistas o álbumes..." value="${escHtml(
          state.spotifySearch || ""
        )}" />
        <div id="sp-tab-host">${spotifyTabBody(s)}</div>
        <button type="button" class="sp-btn secondary" id="sp-disconnect">Desconectar cuenta</button>
      </div>`;

    bindSpotifyControls(s);
  }

  async function refreshSpotifyQueueIfStale() {
    const trackId = state.spotify?.track?.id || null;
    if (trackId === state.spotifyLastTrackId) return;
    state.spotifyLastTrackId = trackId;
    if (!state.spotifyQueueData) return; // never loaded yet, loadSpotifyTabData will handle it
    try {
      state.spotifyQueueData = await api("/api/spotify/queue");
      if (state.spotifyTab === "cola") renderSpotifyBody();
    } catch {
      /* keep showing the last known queue on transient errors */
    }
  }

  async function refreshSpotifyStatus() {
    try {
      state.spotify = await api("/api/spotify/status");
      if (!els.spotifyPanel.hidden && state.spotifyTab === "cola") {
        await refreshSpotifyQueueIfStale();
      }
      if (!els.spotifyPanel.hidden) {
        if (state.spotifyVolDragging) {
          updateSpotifyChrome(state.spotify);
          const t0 = document.getElementById("sp-t0");
          const bar = document.getElementById("sp-progress");
          const track = state.spotify?.track;
          const dur = track?.durationMs || 0;
          const prog = Math.min(Number(state.spotify.progressMs) || 0, dur || 0);
          if (t0) t0.textContent = fmtMs(prog);
          if (bar && dur > 0) bar.value = String(Math.round((prog / dur) * 1000));
        } else {
          renderSpotifyBody();
        }
      }
      renderServices();
      const sub = els.homeServices?.querySelector('[data-home-svc="spotify"] .hs-sub');
      if (sub) {
        const sp = state.spotify;
        let spotifySub = "—";
        if (!sp) spotifySub = "cargando…";
        else if (!sp.configured) spotifySub = "sin config";
        else if (!sp.connected) spotifySub = "desconectado";
        else spotifySub = (sp.device && sp.device.name) || "conectado";
        sub.textContent = spotifySub;
      }
    } catch (err) {
      if (!els.spotifyPanel.hidden) toast(`Spotify: ${err.message}`);
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

  async function spotifyAction(action) {
    try {
      await api(`/api/spotify/${action}`, { method: "POST", body: "{}" });
      await refreshSpotifyStatus();
    } catch (err) {
      toast(err.message);
    }
  }

  async function openSpotifyPanel() {
    if (!els.spotifyPanel || !els.spotifyBody) {
      toast("Panel Spotify no cargado — recarga la página");
      console.error("spotify-panel missing in DOM");
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
    els.spotifyPanel.hidden = false;
    state.spotifyQueueData = null;
    try {
      await refreshSpotifyStatus();
      renderSpotifyBody();
      loadSpotifyTabData(state.spotifyTab || "cola").catch(() => {});
    } catch (err) {
      toast(err.message || "Error Spotify");
    }
    stopSpotifyPolling();
    // 18/08/2026 - Bajado de 4s a 8s: el refresh() general del dashboard
    // (cada 10s, siempre activo, no solo con el panel abierto) YA pide
    // /api/spotify/status para la tarjeta de servicio - con el panel
    // abierto sumaban ~21 peticiones/min a la Web API de Spotify, lo
    // bastante para agotar su cuota real y devolver 429 QUOTA_EXCEEDED de
    // verdad (confirmado en logs: 342 llamadas en 10 min, muy por encima
    // de lo esperado). Con 8s la carga combinada baja a ~13-14/min.
    state.spotifyTimer = setInterval(refreshSpotifyStatus, 8000);
  }

  els.spotifyBack?.addEventListener("click", () => {
    closeSpotifyPanel();
    setAppNav("servicios");
  });
  els.spotifyPanel?.addEventListener("click", (e) => {
    if (e.target === els.spotifyPanel) {
      closeSpotifyPanel();
      setAppNav("servicios");
    }
  });

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
        <div class="home-hw-pill">${escHtml(cpuModel)} · ${escHtml(gpuModel)}</div>
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

    const cards = [
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
    const sp = state.spotify;
    let spotifySub = "—";
    if (!sp) spotifySub = "cargando…";
    else if (!sp.configured) spotifySub = "sin config";
    else if (!sp.connected) spotifySub = "desconectado";
    else spotifySub = (sp.device && sp.device.name) || "conectado";

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

    // 4.11.10 - Escenas como tiles en Inicio. Deliberadamente oculto por
    // completo si no hay escenas reales creadas - un mensaje "sin escenas"
    // en la pantalla principal seria ruido, no informacion util; en el
    // Menu rapido (4.11.9) SI se muestra ese mensaje, porque ahi el usuario
    // fue a buscar escenas especificamente.
    const homeScenesSection = document.getElementById("home-scenes-section");
    const homeScenesGrid = document.getElementById("home-scenes");
    if (homeScenesSection && homeScenesGrid) {
      const scenesArr = state.scenes || [];
      homeScenesSection.hidden = scenesArr.length === 0;
      if (scenesArr.length) {
        homeScenesGrid.innerHTML = scenesArr.map(sceneTileHtml).join("");
        bindSceneTiles(homeScenesGrid, scenesArr);
      }
    }

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
    els.healthBody.innerHTML = list.length
      ? list.map(healthRowHtml).join("")
      : `<p class="tagline">Sin datos.</p>`;
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

  async function refreshHealth() {
    try {
      const data = await api("/api/health/manager");
      state.healthItems = data.items || [];
      renderHealthBody();
    } catch (err) {
      if (els.healthBody) els.healthBody.innerHTML = `<p class="tagline">${escHtml(err.message || "Error")}</p>`;
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
    if (state.healthTimer) clearInterval(state.healthTimer);
    state.healthTimer = setInterval(() => refreshHealth().catch(() => {}), 10000);
  }

  els.healthBack?.addEventListener("click", () => {
    closeHealthPanel();
    openSysHub();
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
        await fetch("/api/auth/logout", {
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
        if (sp?.connected) v = sp.playing ? "▶ Reproduciendo" : "⏸ Listo";
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
      badge: true,
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

    els.quickMenuBody.innerHTML = statusHtml + scenesHtml;
    bindSceneTiles(els.quickMenuBody, scenesArr);
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

  function eventLevelBadge(level) {
    const lvl = String(level || "info").toLowerCase();
    const emoji = lvl === "critical" ? "🔴" : lvl === "warning" ? "🟡" : "🟢";
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
    if (filter !== "all") {
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

  function deviceIcon(d) {
    if (d.type === "self" || d.id === "raspberry") {
      return `<img src="./assets/raspberry.png" alt="" style="width:24px;height:24px;object-fit:contain" />`;
    }
    if (d.type === "android") return "📱";
    if (d.type === "linux-ssh") return "🐧";
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
      const data = await api("/api/events/history?limit=200");
      const events = (data.events || []).filter(
        (e) => e.data && e.data.deviceId === deviceId && e.type.startsWith("device.")
      );
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
        return `<button type="button" class="devices-card-btn ${selected}" data-agent-device="${d.id}">
          <span class="ico">${deviceIcon(d)}</span>
          <span><div class="title">${escHtml(d.name || d.id)}</div>
          <div class="sub">${escHtml(d.os || d.type || "")} · ${escHtml(d.ip || "—")}</div></span>
          <span class="status-line"><span class="dot ${dot}"></span><span>${status}</span></span>
        </button>`;
      })
      .join("");

    let detail = "";
    if (focus.stub) {
      detail = `<div class="perf-block devices-detail">
        <h3>${escHtml(focus.name)}</h3>
        <div class="meta">Placeholder — agente ${escHtml(focus.type)} aún no implementado.</div>
      </div>`;
    } else if (focus.id === "raspberry" || focus.type === "self") {
      const m = focus.metrics || {};
      detail = `<div class="perf-block devices-detail">
        <h3>${escHtml(focus.name)}</h3>
        <div class="devices-kv">
          <div class="cell"><div class="label">Estado</div><div class="value">Online (self) · ${estadoBadge(focus.estado)}</div></div>
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
        <div class="devices-actions-group">
          <h4>Escenas rápidas</h4>
          <div class="devices-actions">
            <button type="button" data-dev-profile="gaming" ${focus.online && perms.apps ? "" : "disabled"}>Gaming</button>
            <button type="button" data-dev-profile="trabajo" ${focus.online && perms.apps ? "" : "disabled"}>Trabajo</button>
            <button type="button" data-dev-profile="streaming" ${focus.online && perms.apps ? "" : "disabled"}>Streaming</button>
            <button type="button" data-dev-open-catalog>Catálogo de apps</button>
            <button type="button" data-dev-open-history>Historial</button>
            ${wolBtn}
          </div>
        </div>
        <div class="devices-actions-group">
          <h4>Acciones de energía</h4>
          <div class="devices-actions">
            <button type="button" class="danger" data-dev-power="shutdown" ${focus.online && perms.power ? "" : "disabled"}>Apagar</button>
            <button type="button" class="danger" data-dev-power="reboot" ${focus.online && perms.power ? "" : "disabled"}>Reiniciar</button>
            <button type="button" data-dev-power="sleep" ${focus.online && perms.power ? "" : "disabled"}>Suspender</button>
          </div>
        </div>
        <h3>Aplicaciones</h3>
        <div class="devices-apps">
          ${launcherAppsHtml(focus)}
        </div>
        <h3>Permisos</h3>
        <div class="devices-perms">
          ${["metrics","power","apps","processes","wol","terminal"].map((k) =>
            `<label><input type="checkbox" data-perm="${k}" ${perms[k] ? "checked" : ""} ${k === "terminal" ? "" : ""}/> ${k}</label>`
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

    els.devicesBody.innerHTML = `<div class="devices-list">${listHtml}</div>${detail}`;

    els.devicesBody.querySelectorAll("[data-agent-device]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.agentFocusId = btn.getAttribute("data-agent-device");
        refreshDevicesPanel().catch((err) => toast(err.message));
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
  }

  const POWER_META = {
    shutdown: { title: "¿Apagar MI-PC?", msg: "El equipo se apagará inmediatamente.", verb: "Apagar" },
    reboot: { title: "¿Reiniciar MI-PC?", msg: "El equipo se reiniciará inmediatamente.", verb: "Reiniciar" },
    sleep: { title: "¿Suspender MI-PC?", msg: "El equipo entrará en suspensión.", verb: "Suspender" },
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

  async function refreshDevicesPanel() {
    const [list, profiles] = await Promise.all([
      api("/api/devices"),
      api("/api/devices/profiles").catch(() => ({ profiles: {} })),
    ]);
    state.agentDevices = list;
    state.agentProfiles = profiles;
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
    closeSteamPanel();
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

  state.aiView = "chat"; // "chat" | "settings"
  state.aiStatus = null; // {provider, model, enabled, configured}
  state.aiLog = []; // [{role:"user"|"assistant", text, pending, pendingId, tool, params}]
  state.aiBusy = false;

  const AI_QUICK_PROMPTS = [
    "¿Cómo está MI-PC?",
    "¿Hay alguna alerta?",
    "Estado general del sistema",
    "¿Por qué va lento MI-PC?",
  ];

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

  function aiMsgBubbleHtml(entry) {
    if (entry.pending) {
      return `<div class="ai-msg bot">
        <div class="ai-confirm-card">
          <p><strong>Confirmación necesaria</strong></p>
          <p class="tagline">${escHtml(entry.tool)} · ${escHtml(JSON.stringify(entry.params || {}))}</p>
          <div class="ai-confirm-actions">
            <button type="button" class="dk-btn ghost" data-ai-confirm="0" data-ai-pending="${escHtml(entry.pendingId)}">Cancelar</button>
            <button type="button" class="dk-btn" data-ai-confirm="1" data-ai-pending="${escHtml(entry.pendingId)}">Ejecutar</button>
          </div>
        </div>
      </div>`;
    }
    const cls = entry.role === "user" ? "user" : "bot";
    return `<div class="ai-msg ${cls}">${escHtml(entry.text || "")}</div>`;
  }

  function renderAiChatView() {
    const isOllama = state.aiStatus && state.aiStatus.provider === "ollama";
    const quickHtml = AI_QUICK_PROMPTS.map(
      (q) => `<button type="button" class="ai-quick-tile" data-ai-quick="${escHtml(q)}">${escHtml(q)}</button>`
    ).join("");
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
      btn.addEventListener("click", () => submitAiChat(btn.getAttribute("data-ai-quick")));
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

  const AI_PROVIDER_DEFAULT_MODEL = { anthropic: "claude-sonnet-4-5-20250929", ollama: "qwen3:4b" };

  function renderAiSettingsView() {
    const s = state.aiStatus || {};
    const provider = s.provider === "ollama" ? "ollama" : "anthropic";
    els.aiBody.innerHTML = `
      <form id="ai-settings-form" class="ai-settings-form">
        <label>Proveedor
          <select name="provider" id="ai-provider-select">
            <option value="anthropic" ${provider === "anthropic" ? "selected" : ""}>Anthropic Claude (nube)</option>
            <option value="ollama" ${provider === "ollama" ? "selected" : ""}>Ollama (local, en este Pi)</option>
          </select>
        </label>
        <p class="tagline ai-ollama-note" ${provider === "ollama" ? "" : "hidden"}>
          Corre en la propia Raspberry Pi: gratis y sin API key, pero lento (varios minutos por respuesta con qwen3:4b en esta CPU).
        </p>
        <div id="ai-apikey-field" ${provider === "ollama" ? "hidden" : ""}>
          <label>API key ${s.configured && provider === "anthropic" ? "(ya configurada — deja en blanco para no cambiarla)" : ""}
            <input type="password" name="apiKey" autocomplete="off" placeholder="${s.configured && provider === "anthropic" ? "••••••••" : "sk-ant-..."}" />
          </label>
        </div>
        <label>Modelo
          <input type="text" name="model" value="${escHtml(s.model || AI_PROVIDER_DEFAULT_MODEL[provider])}" />
        </label>
        <label class="ai-settings-check">
          <input type="checkbox" name="enabled" ${s.enabled !== false ? "checked" : ""} />
          Activada
        </label>
        <button type="submit" class="dk-btn">Guardar</button>
      </form>
      ${aiPreferencesFormHtml()}`;

    const providerSelect = document.getElementById("ai-provider-select");
    const apiKeyField = document.getElementById("ai-apikey-field");
    const ollamaNote = els.aiBody.querySelector(".ai-ollama-note");
    const modelInput = document.querySelector("#ai-settings-form [name=model]");
    providerSelect?.addEventListener("change", () => {
      const isOllama = providerSelect.value === "ollama";
      if (apiKeyField) apiKeyField.hidden = isOllama;
      if (ollamaNote) ollamaNote.hidden = !isOllama;
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
        return `<label>${escHtml(meta.label)}
          <input type="text" name="${escHtml(key)}" value="${escHtml(value || "")}" placeholder="(sin fijar)" />
        </label>`;
      })
      .join("");
    return `<form id="ai-prefs-form" class="ai-settings-form" style="margin-top:18px">
      <h3 style="margin:0 0 4px;font-size:14px">Preferencias</h3>
      <p class="tagline" style="margin:0 0 4px">Configuración que BMO AI tiene en cuenta al responder (nada personal).</p>
      ${fields}
      <button type="submit" class="dk-btn">Guardar preferencias</button>
    </form>`;
  }

  function renderAiPanel() {
    if (!els.aiBody) return;
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
        state.aiLog.push({ pending: true, pendingId: outcome.pendingId, tool: outcome.tool, params: outcome.params });
      } else {
        state.aiLog.push({ role: "assistant", text: outcome.text || "(sin respuesta)" });
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
        state.aiLog.push({ pending: true, pendingId: outcome.pendingId, tool: outcome.tool, params: outcome.params });
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

  async function openAiPanel() {
    if (!els.aiPanel || !els.aiBody) {
      toast("BMO AI no disponible — recarga la página");
      return;
    }
    closeSysHub();
    els.aiPanel.hidden = false;
    state.aiView = "chat";
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
    } catch {
      state.aiPreferences = null;
      state.aiPreferencesKnown = null;
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

  const INTEGRATIONS_META = [
    { key: "bmo", label: "BMO Core", icon: "⬡", open: () => openEstadoPanel().catch(() => {}) },
    { key: "mipc", label: "MI-PC", icon: "🖥️", open: () => { setAppNav("dispositivos", { keepPanels: true }); openDevicesPanel("hub").catch(() => {}); } },
    { key: "docker", label: "Docker", icon: "🐳", open: () => openDockerPanel().catch(() => {}) },
    { key: "spotify", label: "Spotify", icon: "🎵", open: () => openSpotifyPanel().catch(() => {}) },
    { key: "steam", label: "Steam", icon: "🎮", open: () => openSteamPanel().catch(() => {}) },
    { key: "grafana", label: "Grafana", icon: "📈", open: () => openMonitorPanel().catch(() => {}) },
    { key: "prometheus", label: "Prometheus", icon: "📊", open: () => openMonitorPanel().catch(() => {}) },
  ];

  // 4.13.4/4.13.5 - Plex/SupermarketComparator siguen bloqueados a
  // proposito hasta tener servidor Plex o mas detalle - ver memoria de
  // sesion. Steam (4.13.3) ya esta completo (18/08/2026), se movio a
  // INTEGRATIONS_META arriba.
  const INTEGRATIONS_NOT_CONNECTED = [
    { label: "Plex", icon: "🎬", note: "Pendiente de servidor Plex" },
    { label: "Home Assistant", icon: "🏠", note: "No configurado" },
    { label: "SupermarketComparator", icon: "🛒", note: "Pendiente de definir integración" },
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

    const connectedHtml = INTEGRATIONS_META.map((m) => {
      const s = sysState[m.key] || {};
      const dot = integrationsDot(s.status);
      const detail =
        m.key === "docker" ? `${s.running || 0}/${s.total || 0} activos` : s.status || "desconocido";
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

    els.securityCenterBody.innerHTML = `
      <p class="tagline" style="margin:0 0 10px">Estado real por área — sin puntuación artificial.</p>
      <div class="integrations-list">${areasHtml}</div>
    `;
  }

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
  ];
  const BMO_ACTIONS = [{ value: "message", label: "Mostrar mensaje (en Eventos)" }];
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
      return `Docker · ${label}: ${escHtml(a.params?.container || "")}`;
    }
    if (a.target === "bmo") {
      const label = (BMO_ACTIONS.find((x) => x.value === a.action) || {}).label || a.action;
      return `BMO · ${label}: ${escHtml(a.params?.text || "")}`;
    }
    if (a.target === "system") {
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
        <span class="sic-sub">${h.success ? "✓" : "⚠"} ${h.completed}/${h.total}</span>
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

  async function runSceneFromPanel(id) {
    state.scenesView = "result";
    state.sceneResultFrom = "list";
    state.sceneRunResult = { sceneName: "…", steps: [], running: true };
    if (els.scenesTitle) els.scenesTitle.textContent = "Ejecutando…";
    els.scenesBody.innerHTML = `<p class="tagline">Ejecutando escena…</p>`;
    try {
      const result = await api(`/api/scenes/${id}/run`, { method: "POST", body: "{}" });
      state.sceneRunResult = result;
      renderSceneResult();
    } catch (err) {
      state.scenesView = "list";
      toast(err.message || "Error ejecutando escena");
      await refreshScenesList();
    }
  }

  function renderSceneResult() {
    const r = state.sceneRunResult;
    if (els.scenesTitle) els.scenesTitle.textContent = r.sceneName || "Resultado";
    const rows = (r.steps || [])
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
    const total = r.total || (r.steps || []).length;
    const completed = r.completed ?? (r.steps || []).filter((s) => s.ok).length;
    const failedSteps = (r.steps || []).filter((s) => !s.ok);
    const nameUpper = escHtml((r.sceneName || "Escena").toUpperCase());
    let statusLine;
    if (completed === total && total > 0) {
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
    const metricLabel = (METRIC_OPTIONS.find((m) => m.value === c.metric) || {}).label || c.metric;
    return `${escHtml(c.deviceId)} · ${metricLabel} ${c.operator === "gt" ? ">" : "<"} ${c.value}`;
  }

  function automationSummary(a) {
    const parts = (a.conditions || []).map(conditionSummary);
    const joiner = a.combinator === "OR" ? " O " : " Y ";
    return parts.join(joiner);
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
      const res = await fetch(`${API_BASE}/api/plugins/${state.logsPluginId}/logs/download`, {
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
    const list = all.filter((p) => {
      if (state.pluginCategory !== "all" && p.category !== state.pluginCategory) return false;
      if (q && !`${p.name} ${p.description || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });

    if (!list.length) {
      els.pluginsBody.innerHTML = `<p class="tagline">Sin resultados para este filtro.</p>`;
      return;
    }

    els.pluginsBody.innerHTML = list
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

        const meta = canUpdate
          ? `<div class="plugin-card-meta">v${version}<br><span class="plugin-latest">→ ${latest}</span></div>`
          : `<div class="plugin-card-meta">v${version}</div>`;

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
      await refreshSpotifyStatus().catch(() => {});
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
