// ── Tipos de remitente ──────────────────────────────────────────────────────
export const SENDER = {
  USER: "user",
  AI:   "ai",
  SYSTEM: "system",
};

// ── Estados de un mensaje ───────────────────────────────────────────────────
export const MESSAGE_STATUS = {
  SENDING:  "sending",   // en tránsito
  SENT:     "sent",      // entregado al provider
  RECEIVED: "received",  // respuesta recibida
  ERROR:    "error",     // falló el envío o la respuesta
};

// ── Estados de la conversación ──────────────────────────────────────────────
export const CONVERSATION_STATUS = {
  IDLE:     "idle",      // sin actividad
  LOADING:  "loading",   // esperando respuesta IA
  STREAMING:"streaming", // respuesta llegando en tiempo real
  ERROR:    "error",
};

// ── IDs de providers de IA ──────────────────────────────────────────────────
// Agregar aquí cuando se integre un proveedor real
export const PROVIDER_ID = {
  MOCK:    "mock",       // demo sin IA real
  CLAUDE:  "claude",     // Anthropic Claude (futuro)
  OPENAI:  "openai",     // OpenAI GPT    (futuro)
  GEMINI:  "gemini",     // Google Gemini (futuro)
  OLLAMA:  "ollama",     // Ollama local  (futuro)
};

// ── Tipos de adjunto ────────────────────────────────────────────────────────
export const ATTACHMENT_TYPE = {
  IMAGE:    "image",
  DOCUMENT: "document",
  AUDIO:    "audio",
};

// ── Límites ─────────────────────────────────────────────────────────────────
export const LIMITS = {
  MAX_ATTACHMENT_MB:  10,
  MAX_INPUT_CHARS:    4000,
  MAX_HISTORY_ITEMS:  50,
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ACCEPTED_DOC_TYPES:   ["application/pdf", "text/plain"],
};

// ── Consultas rápidas predefinidas ──────────────────────────────────────────
export const QUICK_QUERIES = [
  { id: "q1", texto: "¿Qué animales necesitan vacuna esta semana?",    icono: "💉", categoria: "sanidad"    },
  { id: "q2", texto: "Resumen financiero del mes actual",              icono: "📊", categoria: "finanzas"   },
  { id: "q3", texto: "¿Qué potreros conviene rotar esta semana?",      icono: "🌿", categoria: "potreros"   },
  { id: "q4", texto: "Animales con bajo peso o sin registro de pesaje",icono: "⚖️", categoria: "produccion" },
  { id: "q5", texto: "Hembras próximas a parir",                       icono: "🐄", categoria: "reproduccion"},
  { id: "q6", texto: "Insumos con stock crítico o por vencer",         icono: "📦", categoria: "inventario" },
  { id: "q7", texto: "Eventos y actividades de esta semana",            icono: "📅", categoria: "agenda"     },
  { id: "q8", texto: "Análisis de gastos por categoría",               icono: "💸", categoria: "finanzas"   },
];

// ── Acciones del reducer ────────────────────────────────────────────────────
export const IA_ACTION = {
  // Conversaciones
  SET_CONVERSATIONS:       "SET_CONVERSATIONS",
  SELECT_CONVERSATION:     "SELECT_CONVERSATION",
  CREATE_CONVERSATION:     "CREATE_CONVERSATION",
  DELETE_CONVERSATION:     "DELETE_CONVERSATION",
  RENAME_CONVERSATION:     "RENAME_CONVERSATION",
  // Mensajes
  ADD_MESSAGE:             "ADD_MESSAGE",
  UPDATE_MESSAGE:          "UPDATE_MESSAGE",
  SET_MESSAGES:            "SET_MESSAGES",
  CLEAR_MESSAGES:          "CLEAR_MESSAGES",
  // Estado de carga
  SET_STATUS:              "SET_STATUS",
  SET_ERROR:               "SET_ERROR",
  CLEAR_ERROR:             "CLEAR_ERROR",
  // Provider
  SET_PROVIDER:            "SET_PROVIDER",
  // Adjuntos
  ADD_ATTACHMENT:          "ADD_ATTACHMENT",
  REMOVE_ATTACHMENT:       "REMOVE_ATTACHMENT",
  CLEAR_ATTACHMENTS:       "CLEAR_ATTACHMENTS",
  // Input
  SET_INPUT:               "SET_INPUT",
};
