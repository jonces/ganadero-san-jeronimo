/**
 * Persistencia de predicciones en localStorage.
 * Cachea los resultados por hasta 4 horas para evitar recálculos.
 */

const KEY_PREDICTIONS = "predictive_predictions_v1";
const KEY_SUMMARY     = "predictive_summary_v1";
const KEY_LAST_RUN    = "predictive_last_run_v1";
const KEY_SCENARIOS   = "predictive_scenarios_v1";
const TTL_MS          = 4 * 60 * 60 * 1000; // 4 horas

function now() { return Date.now(); }
function isBrowser() { return typeof window !== "undefined"; }
function getItem(key) {
  if (!isBrowser()) return null;
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function setItem(key, value) {
  if (!isBrowser()) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/** Guarda las predicciones calculadas junto con su timestamp. */
export function savePredictions(predictions, summary) {
  setItem(KEY_PREDICTIONS, { predictions, ts: now() });
  if (summary) setItem(KEY_SUMMARY, { summary, ts: now() });
  setItem(KEY_LAST_RUN, now());
}

/** Recupera las predicciones si están dentro del TTL. */
export function loadPredictions() {
  const cached = getItem(KEY_PREDICTIONS);
  if (!cached || now() - cached.ts > TTL_MS) return null;
  return cached.predictions ?? null;
}

/** Recupera el resumen si está dentro del TTL. */
export function loadSummary() {
  const cached = getItem(KEY_SUMMARY);
  if (!cached || now() - cached.ts > TTL_MS) return null;
  return cached.summary ?? null;
}

/** Retorna el timestamp del último cálculo o null. */
export function getLastRunTime() {
  return getItem(KEY_LAST_RUN);
}

/** Invalida el caché para forzar recálculo. */
export function invalidateCache() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY_PREDICTIONS);
  localStorage.removeItem(KEY_SUMMARY);
  localStorage.removeItem(KEY_LAST_RUN);
}

/** Guarda el resultado de un escenario simulado. */
export function saveScenarioResult(scenarioId, result) {
  const all = getItem(KEY_SCENARIOS) ?? {};
  all[scenarioId] = { result, ts: now() };
  setItem(KEY_SCENARIOS, all);
}

/** Recupera el resultado de un escenario guardado. */
export function loadScenarioResult(scenarioId) {
  const all = getItem(KEY_SCENARIOS) ?? {};
  const entry = all[scenarioId];
  if (!entry || now() - entry.ts > TTL_MS) return null;
  return entry.result;
}

/** Borra todos los escenarios guardados. */
export function clearScenarios() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY_SCENARIOS);
}
