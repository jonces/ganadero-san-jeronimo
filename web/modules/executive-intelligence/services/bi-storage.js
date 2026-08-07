const KEYS = {
  kpis:      "bi_kpis_v1",
  scores:    "bi_scores_v1",
  summary:   "bi_summary_v1",
  lastRun:   "bi_last_run_v1",
  empresas:  "bi_empresas_v1",
  schedules: "bi_schedules_v1",
  audit:     "bi_audit_v1",
};
const TTL = 2 * 60 * 60 * 1000;

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ── KPIs & Scores ────────────────────────────────────────────────
export function saveKPIs(kpis)   { save(KEYS.kpis, { kpis, ts: Date.now() }); }
export function loadKPIs() {
  const r = load(KEYS.kpis);
  return r && Date.now() - r.ts < TTL ? r.kpis : null;
}

export function saveScores(scores) { save(KEYS.scores, { scores, ts: Date.now() }); }
export function loadScores() {
  const r = load(KEYS.scores);
  return r && Date.now() - r.ts < TTL ? r.scores : null;
}

export function saveSummary(summary) { save(KEYS.summary, { summary, ts: Date.now() }); }
export function loadSummary() {
  const r = load(KEYS.summary);
  return r && Date.now() - r.ts < TTL ? r.summary : null;
}

export function getLastRunTs()  { return load(KEYS.lastRun); }
export function markLastRun()   { save(KEYS.lastRun, Date.now()); }

export function invalidateBICache() {
  [KEYS.kpis, KEYS.scores, KEYS.summary, KEYS.lastRun].forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });
}

// ── Empresas ─────────────────────────────────────────────────────
const DEFAULT_EMPRESAS = [
  { id: "emp-1", nombre: "Finca San Jerónimo",    tipo: "finca",   activa: true },
  { id: "emp-2", nombre: "Empresa Ganadera SG",   tipo: "empresa", activa: true },
];

export function getEmpresas() {
  const stored = load(KEYS.empresas);
  if (stored) return stored;
  save(KEYS.empresas, DEFAULT_EMPRESAS);
  return DEFAULT_EMPRESAS;
}
export function saveEmpresas(list) { save(KEYS.empresas, list); }

// ── Schedules ────────────────────────────────────────────────────
export function getSchedules()            { return load(KEYS.schedules) ?? []; }
export function saveSchedules(list)       { save(KEYS.schedules, list); }

// ── Audit ─────────────────────────────────────────────────────────
export function getAuditLog()             { return load(KEYS.audit) ?? []; }
export function appendAuditEntry(entry) {
  const log = getAuditLog();
  log.unshift({ ...entry, id: crypto.randomUUID(), ts: new Date().toISOString() });
  if (log.length > 500) log.splice(500);
  save(KEYS.audit, log);
}

// ── History (KPI trends) ──────────────────────────────────────────
export function getKPIHistory() {
  try { return JSON.parse(localStorage.getItem("bi_history_v1") ?? "{}"); } catch { return {}; }
}
export function appendHistory(kpis) {
  const hist = getKPIHistory();
  const key  = new Date().toISOString().slice(0, 7);
  hist[key]  = { ingresos: kpis.ingresos, gastos: kpis.gastos, utilidad: kpis.utilidad, total_animales: kpis.total_animales, ts: Date.now() };
  try { localStorage.setItem("bi_history_v1", JSON.stringify(hist)); } catch {}
}
