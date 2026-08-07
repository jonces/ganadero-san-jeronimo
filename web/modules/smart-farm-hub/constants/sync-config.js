/**
 * Configuración de la cola de sincronización offline-first.
 */

export const SYNC_STATUS = {
  PENDING:   "pending",
  SYNCING:   "syncing",
  SYNCED:    "synced",
  FAILED:    "failed",
  CONFLICT:  "conflict",
};

export const SYNC_STATUS_CONFIG = {
  pending:  { label: "Pendiente",  icono: "⏳", color: "#d97706" },
  syncing:  { label: "Sincronizando…", icono: "🔄", color: "#2563eb" },
  synced:   { label: "Sincronizado", icono: "✅", color: "#16a34a" },
  failed:   { label: "Fallido",    icono: "❌", color: "#dc2626" },
  conflict: { label: "Conflicto",  icono: "⚠️", color: "#9333ea" },
};

export const SYNC_CONFIG = {
  maxRetries:          3,
  retryDelayMs:        5000,
  batchSize:           50,
  conflictStrategy:    "server_wins", // "server_wins" | "client_wins" | "manual"
  offlineQueueKey:     "sfh_sync_queue_v1",
  maxQueueSize:        500,
};

export const OPERATION_TYPE = {
  CREATE:  "create",
  UPDATE:  "update",
  DELETE:  "delete",
  READING: "reading",
};
