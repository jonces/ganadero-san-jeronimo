/**
 * Persistencia localStorage para el Smart Farm Hub.
 */

const KEYS = {
  DEVICES:    "sfh_devices_v1",
  READINGS:   "sfh_readings_v1",
  RULES:      "sfh_rules_v1",
  ALERTS:     "sfh_alerts_v1",
  GEOCERCAS:  "sfh_geocercas_v1",
  MAP_ITEMS:  "sfh_map_items_v1",
};

function isBrowser() { return typeof window !== "undefined"; }
function get(key) {
  if (!isBrowser()) return null;
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function set(key, val) {
  if (!isBrowser()) return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ─── Devices ─────────────────────────────────────────────────────────────── */
export function getDevices()         { return get(KEYS.DEVICES) ?? []; }
export function saveDevices(list)    { set(KEYS.DEVICES, list); }

export function upsertDevice(device) {
  const list = getDevices();
  const idx  = list.findIndex(d => d.id === device.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...device, updatedAt: Date.now() };
  else          list.unshift({ ...device, createdAt: Date.now(), updatedAt: Date.now() });
  saveDevices(list);
  return list;
}

export function deleteDevice(id) {
  const list = getDevices().filter(d => d.id !== id);
  saveDevices(list);
  return list;
}

/* ─── Readings ────────────────────────────────────────────────────────────── */
export function getReadings(deviceId) {
  const all = get(KEYS.READINGS) ?? {};
  return all[deviceId] ?? [];
}
export function addReading(deviceId, reading) {
  const all = get(KEYS.READINGS) ?? {};
  if (!all[deviceId]) all[deviceId] = [];
  all[deviceId].unshift({ ...reading, ts: Date.now() });
  if (all[deviceId].length > 200) all[deviceId] = all[deviceId].slice(0, 200);
  set(KEYS.READINGS, all);
}

/* ─── Rules ───────────────────────────────────────────────────────────────── */
export function getRules()        { return get(KEYS.RULES) ?? []; }
export function saveRules(list)   { set(KEYS.RULES, list); }
export function upsertRule(rule)  {
  const list = getRules();
  const idx  = list.findIndex(r => r.id === rule.id);
  if (idx >= 0) list[idx] = rule;
  else          list.unshift(rule);
  saveRules(list);
  return list;
}
export function deleteRule(id) {
  const list = getRules().filter(r => r.id !== id);
  saveRules(list);
  return list;
}

/* ─── Alerts ──────────────────────────────────────────────────────────────── */
export function getAlerts()         { return get(KEYS.ALERTS) ?? []; }
export function addAlert(alert)     {
  const list = getAlerts();
  list.unshift({ ...alert, id: `alert-${Date.now()}`, ts: Date.now(), leida: false });
  if (list.length > 300) list.splice(300);
  set(KEYS.ALERTS, list);
  return list;
}
export function markAlertRead(id)   {
  const list = getAlerts().map(a => a.id === id ? { ...a, leida: true } : a);
  set(KEYS.ALERTS, list);
  return list;
}
export function clearAlerts()       { set(KEYS.ALERTS, []); }

/* ─── Geocercas ───────────────────────────────────────────────────────────── */
export function getGeocercas()      { return get(KEYS.GEOCERCAS) ?? []; }
export function saveGeocercas(list) { set(KEYS.GEOCERCAS, list); }

/* ─── Mapa ────────────────────────────────────────────────────────────────── */
export function getMapItems()       { return get(KEYS.MAP_ITEMS) ?? []; }
export function saveMapItems(list)  { set(KEYS.MAP_ITEMS, list); }
