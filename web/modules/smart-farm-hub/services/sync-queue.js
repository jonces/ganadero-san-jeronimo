/**
 * Cola de sincronización offline-first.
 * Persiste operaciones en localStorage y las reintenta cuando hay conexión.
 */
import { SYNC_STATUS, SYNC_CONFIG, OPERATION_TYPE } from "../constants/sync-config.js";

const Q_KEY  = SYNC_CONFIG.offlineQueueKey;

function isBrowser() { return typeof window !== "undefined"; }
function getQ()  {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(Q_KEY)) ?? []; } catch { return []; }
}
function setQ(q) {
  if (!isBrowser()) return;
  try { localStorage.setItem(Q_KEY, JSON.stringify(q)); } catch {}
}

let _idSeq = 0;
function newOpId() { return `op-${Date.now()}-${++_idSeq}`; }

/** Encola una operación para sincronización diferencial. */
export function enqueue({ entidad, operacion, payload, deviceId = null }) {
  const q = getQ();
  if (q.length >= SYNC_CONFIG.maxQueueSize) {
    q.pop(); // Descarta la más antigua si está llena
  }
  q.unshift({
    id:        newOpId(),
    entidad,
    operacion,
    payload,
    deviceId,
    status:    SYNC_STATUS.PENDING,
    intentos:  0,
    creadoTs:  Date.now(),
    sincTs:    null,
  });
  setQ(q);
  return q;
}

/** Marca una operación como sincronizada. */
export function markSynced(opId) {
  const q = getQ().map(op =>
    op.id === opId ? { ...op, status: SYNC_STATUS.SYNCED, sincTs: Date.now() } : op
  );
  setQ(q);
  return q;
}

/** Marca una operación como fallida e incrementa intentos. */
export function markFailed(opId) {
  const q = getQ().map(op => {
    if (op.id !== opId) return op;
    const intentos = (op.intentos ?? 0) + 1;
    return {
      ...op,
      intentos,
      status: intentos >= SYNC_CONFIG.maxRetries ? SYNC_STATUS.FAILED : SYNC_STATUS.PENDING,
    };
  });
  setQ(q);
  return q;
}

/** Retorna operaciones pendientes (listas para reintentar). */
export function getPending() {
  return getQ().filter(op => op.status === SYNC_STATUS.PENDING);
}

/** Retorna todas las operaciones para visualización. */
export function getQueueStats() {
  const q = getQ();
  return {
    total:    q.length,
    pending:  q.filter(o => o.status === SYNC_STATUS.PENDING).length,
    synced:   q.filter(o => o.status === SYNC_STATUS.SYNCED).length,
    failed:   q.filter(o => o.status === SYNC_STATUS.FAILED).length,
    conflict: q.filter(o => o.status === SYNC_STATUS.CONFLICT).length,
    items:    q.slice(0, 30),
  };
}

/** Limpia operaciones ya sincronizadas (mantiene pendientes y fallidas). */
export function cleanup() {
  const q = getQ().filter(op => op.status !== SYNC_STATUS.SYNCED);
  setQ(q);
  return q;
}

/**
 * Intenta sincronizar las operaciones pendientes.
 * En esta versión stub, simula la sincronización.
 * En producción: hacer fetch al API y procesar la respuesta.
 */
export async function runSync(apiBase) {
  const pending = getPending();
  if (!pending.length) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;

  for (const op of pending.slice(0, SYNC_CONFIG.batchSize)) {
    try {
      // Intento real de sincronización (stub — siempre OK en demo)
      await new Promise(r => setTimeout(r, 50)); // simula latencia
      markSynced(op.id);
      synced++;
    } catch {
      markFailed(op.id);
      failed++;
    }
  }

  return { synced, failed };
}
