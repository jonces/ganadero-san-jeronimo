/**
 * Motor de aprendizaje — registra qué recomendaciones fueron aceptadas, ignoradas o ejecutadas.
 * Permite al copiloto priorizar mejor las futuras sugerencias.
 */

const KEYS = {
  FEEDBACK:   "ganaderosg_copiloto_feedback",
  OBJETIVOS:  "ganaderosg_copiloto_objetivos",
  PLANES:     "ganaderosg_copiloto_planes",
  HISTORIAL:  "ganaderosg_copiloto_historial",
};

// ── Feedback sobre alertas / recomendaciones ──────────────────────────────

export function registrarAccion(alertId, alertType, accion) {
  const key    = KEYS.FEEDBACK;
  const todos  = cargar(key);
  todos[alertId] = { alertType, accion, ts: Date.now() };
  guardar(key, todos);
}

export function getAlertFeedback(alertId) {
  return cargar(KEYS.FEEDBACK)[alertId] ?? null;
}

/** Retorna las alertas más frecuentemente aceptadas. */
export function getPatronAceptacion() {
  const feedback = cargar(KEYS.FEEDBACK);
  const conteo   = {};
  for (const { alertType, accion } of Object.values(feedback)) {
    if (accion === "aceptar" || accion === "ejecutar") {
      conteo[alertType] = (conteo[alertType] ?? 0) + 1;
    }
  }
  return conteo; // { tipo_alerta: veces_aceptada }
}

/** Retorna las alertas frecuentemente ignoradas. */
export function getPatronIgnorado() {
  const feedback = cargar(KEYS.FEEDBACK);
  const conteo   = {};
  for (const { alertType, accion } of Object.values(feedback)) {
    if (accion === "ignorar" || accion === "descartar") {
      conteo[alertType] = (conteo[alertType] ?? 0) + 1;
    }
  }
  return conteo;
}

// ── Objetivos ─────────────────────────────────────────────────────────────

export function saveObjetivo(objetivo) {
  const todos = cargarArray(KEYS.OBJETIVOS);
  const idx = todos.findIndex(o => o.id === objetivo.id);
  if (idx >= 0) todos[idx] = objetivo;
  else          todos.unshift(objetivo);
  guardarArray(KEYS.OBJETIVOS, todos);
}

export function loadObjetivos() {
  return cargarArray(KEYS.OBJETIVOS);
}

export function deleteObjetivo(id) {
  guardarArray(KEYS.OBJETIVOS, cargarArray(KEYS.OBJETIVOS).filter(o => o.id !== id));
}

export function updateObjetivoEtapa(objetivoId, etapaId, completada) {
  const todos = cargarArray(KEYS.OBJETIVOS);
  const obj   = todos.find(o => o.id === objetivoId);
  if (!obj) return;
  const etapa = obj.etapas?.find(e => e.id === etapaId);
  if (etapa) etapa.completada = completada;
  const totalEtapas     = obj.etapas?.length ?? 1;
  const completadas     = obj.etapas?.filter(e => e.completada).length ?? 0;
  obj.progreso          = Math.round((completadas / totalEtapas) * 100);
  if (obj.progreso === 100) obj.estado = "completado";
  guardarArray(KEYS.OBJETIVOS, todos);
  return obj;
}

// ── Historial de acciones ─────────────────────────────────────────────────

export function addHistorial(entrada) {
  const todos = cargarArray(KEYS.HISTORIAL).slice(0, 199);
  todos.unshift({ ...entrada, ts: Date.now() });
  guardarArray(KEYS.HISTORIAL, todos);
}

export function loadHistorial(limit = 50) {
  return cargarArray(KEYS.HISTORIAL).slice(0, limit);
}

// ── Utils ─────────────────────────────────────────────────────────────────

function cargar(key)          { try { return JSON.parse(localStorage.getItem(key) ?? "{}");  } catch { return {}; } }
function cargarArray(key)     { try { return JSON.parse(localStorage.getItem(key) ?? "[]");  } catch { return []; } }
function guardar(key, data)   { try { localStorage.setItem(key, JSON.stringify(data)); }      catch {}              }
function guardarArray(key, a) { try { localStorage.setItem(key, JSON.stringify(a)); }          catch {}              }
