import { IA_ACTION, PROVIDER_ID, CONVERSATION_STATUS } from "../constants/index.js";

/** @type {import('../types').IAState} */
export const INITIAL_STATE = {
  conversations:      [],
  activeId:           null,
  status:             CONVERSATION_STATUS.IDLE,
  error:              null,
  providerId:         PROVIDER_ID.MOCK,
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
