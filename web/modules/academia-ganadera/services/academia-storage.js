/**
 * Persistencia en localStorage para la Academia Ganadera.
 * Claves aisladas del resto del sistema.
 */

const KEYS = {
  PROGRESO:      "ganaderosg_academia_progreso",      // { cursoId: { pct, leccionActual, completado, ts } }
  CURSOS_CONTENT:"ganaderosg_academia_cursos_content", // { cursoId: { lecciones[], generadoTs } }
  CERTIFICADOS:  "ganaderosg_academia_certificados",   // [{ id, cursoId, fecha, codigo, ... }]
  BIBLIOTECA:    "ganaderosg_academia_biblioteca",     // [{ id, tipo, titulo, contenido, categoria, ts }]
  FAVORITOS:     "ganaderosg_academia_favoritos",      // Set<cursoId|itemId>
  HISTORIAL:     "ganaderosg_academia_historial",      // [{ cursoId, accion, ts }]
  TIEMPO:        "ganaderosg_academia_tiempo",         // { cursoId: segundosTotales }
  EXAMENES:      "ganaderosg_academia_examenes",       // { cursoId: { preguntas[], respuestas{}, calificacion } }
};

// ── Progreso ──────────────────────────────────────────────────────────────

export function getProgreso(cursoId) {
  return cargar(KEYS.PROGRESO)[cursoId] ?? { pct: 0, leccionActual: 0, completado: false, ts: null };
}

export function saveProgreso(cursoId, datos) {
  const todos = cargar(KEYS.PROGRESO);
  todos[cursoId] = { ...datos, ts: Date.now() };
  guardar(KEYS.PROGRESO, todos);
}

export function getProgresoGlobal() {
  return cargar(KEYS.PROGRESO);
}

export function marcarLeccionCompletada(cursoId, leccionIdx, totalLecciones) {
  const actual = getProgreso(cursoId);
  const nuevaLeccion = Math.max(actual.leccionActual, leccionIdx + 1);
  const pct = Math.round((nuevaLeccion / totalLecciones) * 100);
  saveProgreso(cursoId, {
    ...actual,
    leccionActual: nuevaLeccion,
    pct,
    completado: pct >= 100,
  });
  if (pct >= 100) return "completado";
  return null;
}

// ── Contenido generado por IA ─────────────────────────────────────────────

export function getCursoContent(cursoId) {
  return cargar(KEYS.CURSOS_CONTENT)[cursoId] ?? null;
}

export function saveCursoContent(cursoId, content) {
  const todos = cargar(KEYS.CURSOS_CONTENT);
  todos[cursoId] = { ...content, generadoTs: Date.now() };
  guardar(KEYS.CURSOS_CONTENT, todos);
}

// ── Certificados ──────────────────────────────────────────────────────────

export function getCertificados() {
  return cargarArray(KEYS.CERTIFICADOS);
}

export function saveCertificado(cert) {
  const todos = getCertificados();
  if (!todos.find(c => c.cursoId === cert.cursoId)) {
    todos.unshift(cert);
    guardarArray(KEYS.CERTIFICADOS, todos);
  }
  return cert;
}

export function getCertificadoByCurso(cursoId) {
  return getCertificados().find(c => c.cursoId === cursoId) ?? null;
}

// ── Biblioteca personal ───────────────────────────────────────────────────

export function getBiblioteca({ categoria, search } = {}) {
  let items = cargarArray(KEYS.BIBLIOTECA);
  if (categoria) items = items.filter(i => i.categoria === categoria);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      i.titulo?.toLowerCase().includes(q) ||
      i.contenido?.toLowerCase().includes(q) ||
      i.categoria?.toLowerCase().includes(q)
    );
  }
  return items;
}

export function saveBibliotecaItem(item) {
  const todos = cargarArray(KEYS.BIBLIOTECA);
  todos.unshift({ ...item, id: item.id ?? crypto.randomUUID(), ts: Date.now() });
  guardarArray(KEYS.BIBLIOTECA, todos.slice(0, 500));
}

export function deleteBibliotecaItem(id) {
  guardarArray(KEYS.BIBLIOTECA, cargarArray(KEYS.BIBLIOTECA).filter(i => i.id !== id));
}

// ── Favoritos ─────────────────────────────────────────────────────────────

export function getFavoritos() {
  return new Set(cargarArray(KEYS.FAVORITOS));
}

export function toggleFavorito(id) {
  const set = getFavoritos();
  if (set.has(id)) set.delete(id); else set.add(id);
  guardarArray(KEYS.FAVORITOS, [...set]);
  return set.has(id);
}

export function isFavorito(id) {
  return getFavoritos().has(id);
}

// ── Historial ─────────────────────────────────────────────────────────────

export function addHistorial(cursoId, accion) {
  const todos = cargarArray(KEYS.HISTORIAL).slice(0, 199);
  todos.unshift({ cursoId, accion, ts: Date.now() });
  guardarArray(KEYS.HISTORIAL, todos);
}

export function getHistorial(limit = 10) {
  return cargarArray(KEYS.HISTORIAL).slice(0, limit);
}

export function getCursosRecientes(limit = 5) {
  const hist = getHistorial(100);
  const seen = new Set();
  return hist
    .filter(h => { if (seen.has(h.cursoId)) return false; seen.add(h.cursoId); return true; })
    .slice(0, limit)
    .map(h => h.cursoId);
}

// ── Tiempo de estudio ─────────────────────────────────────────────────────

export function addTiempoEstudio(cursoId, segundos) {
  const todos = cargar(KEYS.TIEMPO);
  todos[cursoId] = (todos[cursoId] ?? 0) + segundos;
  guardar(KEYS.TIEMPO, todos);
}

export function getTiempoTotal() {
  const todos = cargar(KEYS.TIEMPO);
  return Object.values(todos).reduce((a, b) => a + b, 0);
}

// ── Exámenes ──────────────────────────────────────────────────────────────

export function saveExamen(cursoId, datos) {
  const todos = cargar(KEYS.EXAMENES);
  todos[cursoId] = { ...datos, ts: Date.now() };
  guardar(KEYS.EXAMENES, todos);
}

export function getExamen(cursoId) {
  return cargar(KEYS.EXAMENES)[cursoId] ?? null;
}

// ── Estadísticas globales ─────────────────────────────────────────────────

export function getEstadisticasGlobales() {
  const progreso     = cargar(KEYS.PROGRESO);
  const certificados = getCertificados();
  const tiempoSecs   = getTiempoTotal();
  const cursosEntries = Object.entries(progreso);
  const completados  = cursosEntries.filter(([, v]) => v.completado).length;
  const enProgreso   = cursosEntries.filter(([, v]) => !v.completado && v.pct > 0).length;
  return {
    cursosCompletados: completados,
    cursosEnProgreso:  enProgreso,
    certificados:      certificados.length,
    tiempoEstudio:     tiempoSecs,
    tiempoLabel:       formatTime(tiempoSecs),
  };
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function cargar(key)        { try { return JSON.parse(localStorage.getItem(key) ?? "{}"); }  catch { return {}; } }
function cargarArray(key)   { try { return JSON.parse(localStorage.getItem(key) ?? "[]"); }  catch { return []; } }
function guardar(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); }        catch {} }
function guardarArray(key, a){ try { localStorage.setItem(key, JSON.stringify(a)); }          catch {} }
