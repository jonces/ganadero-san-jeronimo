import { IA_ACTION, PROVIDER_ID, CONVERSATION_STATUS } from "../constants/index.js";

function demoDate(daysAgo, h = 10, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function demoMsg(sender, text, daysAgo, h) {
  return { id: Math.random().toString(36).slice(2), sender, text, status: "received", timestamp: new Date(demoDate(daysAgo, h)).getTime(), attachments: [] };
}

const DEMO_CONVERSATIONS = [
  {
    id: "demo-1", title: "Vacunación agosto — protocolo",
    favorite: true, providerId: "mock",
    createdAt: demoDate(0, 9), updatedAt: demoDate(0, 9, 32),
    messages: [
      demoMsg("user", "¿Qué animales necesitan vacuna esta semana?", 0, 9),
      demoMsg("ai",   "Esta funcionalidad estará disponible cuando se conecte un modelo de IA. Por ahora estoy en modo demostración.", 0, 9),
    ],
  },
  {
    id: "demo-2", title: "Análisis de gastos del mes",
    favorite: false, providerId: "mock",
    createdAt: demoDate(0, 14), updatedAt: demoDate(0, 14, 45),
    messages: [
      demoMsg("user", "Resumen financiero del mes actual", 0, 14),
      demoMsg("ai",   "Entendido. Cuando se active la IA, analizaré los datos de tu finca para darte una respuesta precisa.", 0, 14),
    ],
  },
  {
    id: "demo-3", title: "Rotación de potreros",
    favorite: true, providerId: "mock",
    createdAt: demoDate(1, 8), updatedAt: demoDate(1, 8, 20),
    messages: [
      demoMsg("user", "¿Qué potreros conviene rotar esta semana?", 1, 8),
      demoMsg("ai",   "Buena pregunta. El módulo de IA está en construcción. Pronto podrás recibir análisis inteligentes aquí.", 1, 8),
    ],
  },
  {
    id: "demo-4", title: "Hembras próximas a parir",
    favorite: false, providerId: "mock",
    createdAt: demoDate(2, 11), updatedAt: demoDate(2, 11, 10),
    messages: [
      demoMsg("user", "Hembras próximas a parir", 2, 11),
      demoMsg("ai",   "Eso requiere acceso a los datos de tu hato. La integración con IA se configurará próximamente.", 2, 11),
    ],
  },
  {
    id: "demo-5", title: "Peso promedio del hato",
    favorite: false, providerId: "mock",
    createdAt: demoDate(4, 16), updatedAt: demoDate(4, 16, 5),
    messages: [
      demoMsg("user", "Animales con bajo peso o sin registro de pesaje", 4, 16),
      demoMsg("ai",   "Anotado. En la versión con IA real, procesaré esta consulta y te daré recomendaciones personalizadas.", 4, 16),
    ],
  },
  {
    id: "demo-6", title: "Plan sanitario — desparasitación",
    favorite: false, providerId: "mock",
    createdAt: demoDate(6, 10), updatedAt: demoDate(6, 10, 50),
    messages: [
      demoMsg("user", "¿Cuándo toca la próxima desparasitación?", 6, 10),
      demoMsg("ai",   "Esta funcionalidad estará disponible cuando se conecte un modelo de IA.", 6, 10),
    ],
  },
  {
    id: "demo-7", title: "Proyección de ventas Q3",
    favorite: false, providerId: "mock",
    createdAt: demoDate(14, 9), updatedAt: demoDate(14, 9, 15),
    messages: [
      demoMsg("user", "Análisis de gastos por categoría", 14, 9),
      demoMsg("ai",   "Entendido. Cuando se active la IA, analizaré los datos de tu finca.", 14, 9),
    ],
  },
];

/** @type {import('../types').IAState} */
export const INITIAL_STATE = {
  conversations:      DEMO_CONVERSATIONS,
  activeId:           null,
  status:             CONVERSATION_STATUS.IDLE,
  error:              null,
  providerId:         PROVIDER_ID.OPENAI,
  pendingAttachments: [],
  inputText:          "",
};

/**
 * Reducer puro del módulo IA.
 * No tiene efectos secundarios ni llamadas async.
 * @param {import('../types').IAState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {import('../types').IAState}
 */
export function iaReducer(state, action) {
  switch (action.type) {

    // ── Conversaciones ──────────────────────────────────────────────────────
    case IA_ACTION.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload };

    case IA_ACTION.SELECT_CONVERSATION:
      return { ...state, activeId: action.payload, error: null };

    case IA_ACTION.CREATE_CONVERSATION: {
      const conv = action.payload; // objeto Conversation completo
      return {
        ...state,
        conversations: [conv, ...state.conversations],
        activeId:       conv.id,
      };
    }

    case IA_ACTION.DELETE_CONVERSATION: {
      const remaining = state.conversations.filter(c => c.id !== action.payload);
      const newActive = state.activeId === action.payload
        ? (remaining[0]?.id ?? null)
        : state.activeId;
      return { ...state, conversations: remaining, activeId: newActive };
    }

    case IA_ACTION.RENAME_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.id ? { ...c, title: action.payload.title } : c
        ),
      };

    case IA_ACTION.TOGGLE_FAVORITE:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload ? { ...c, favorite: !c.favorite } : c
        ),
      };

    // ── Mensajes ────────────────────────────────────────────────────────────
    case IA_ACTION.ADD_MESSAGE:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === state.activeId
            ? { ...c, messages: [...c.messages, action.payload], updatedAt: new Date().toISOString() }
            : c
        ),
      };

    case IA_ACTION.UPDATE_MESSAGE:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === state.activeId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === action.payload.id ? { ...m, ...action.payload.changes } : m
                ),
              }
            : c
        ),
      };

    case IA_ACTION.SET_MESSAGES:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === state.activeId ? { ...c, messages: action.payload } : c
        ),
      };

    case IA_ACTION.CLEAR_MESSAGES:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === state.activeId ? { ...c, messages: [] } : c
        ),
      };

    // ── Estado ──────────────────────────────────────────────────────────────
    case IA_ACTION.SET_STATUS:
      return { ...state, status: action.payload };

    case IA_ACTION.SET_ERROR:
      return { ...state, error: action.payload, status: CONVERSATION_STATUS.ERROR };

    case IA_ACTION.CLEAR_ERROR:
      return { ...state, error: null, status: CONVERSATION_STATUS.IDLE };

    // ── Provider ────────────────────────────────────────────────────────────
    case IA_ACTION.SET_PROVIDER:
      return { ...state, providerId: action.payload };

    // ── Adjuntos ────────────────────────────────────────────────────────────
    case IA_ACTION.ADD_ATTACHMENT:
      return { ...state, pendingAttachments: [...state.pendingAttachments, action.payload] };

    case IA_ACTION.REMOVE_ATTACHMENT:
      return {
        ...state,
        pendingAttachments: state.pendingAttachments.filter(a => a.id !== action.payload),
      };

    case IA_ACTION.CLEAR_ATTACHMENTS:
      return { ...state, pendingAttachments: [] };

    // ── Input ───────────────────────────────────────────────────────────────
    case IA_ACTION.SET_INPUT:
      return { ...state, inputText: action.payload };

    default:
      return state;
  }
}
