"use client";
import { createContext, useReducer, useRef, useEffect } from "react";
import { iaReducer, INITIAL_STATE } from "./IAReducer.js";
import { createProvider }           from "../services/providers/index.js";
import { IA_ACTION, CONVERSATION_STATUS, MESSAGE_STATUS, SENDER } from "../constants/index.js";
import { createMessage, createConversation } from "../utils/message-factory.js";

export const IAContext = createContext(null);

export function IAProvider({ children }) {
  const [state, dispatch] = useReducer(iaReducer, INITIAL_STATE);
  const clientRef         = useRef(null);  // instancia activa del IAClient
  const cancelStreamRef   = useRef(null);  // función para abortar stream

  // Inicializa el provider cuando cambia
  useEffect(() => {
    let destroyed = false;

    async function initProvider() {
      // Destruye el anterior
      clientRef.current?.destroy();
      clientRef.current = null;

      const client = createProvider(state.providerId);
      try {
        await client.initialize();
        if (!destroyed) clientRef.current = client;
      } catch (err) {
        if (!destroyed) dispatch({ type: IA_ACTION.SET_ERROR, payload: err.message });
      }
    }

    initProvider();
    return () => {
      destroyed = true;
      clientRef.current?.destroy();
    };
  }, [state.providerId]);

  // ── Acciones expuestas al resto de la app ─────────────────────────────────

  function selectConversation(id) {
    cancelStreamRef.current?.();
    dispatch({ type: IA_ACTION.SELECT_CONVERSATION, payload: id });
  }

  function newConversation() {
    cancelStreamRef.current?.();
    const conv = createConversation(state.providerId);
    dispatch({ type: IA_ACTION.CREATE_CONVERSATION, payload: conv });
  }

  function deleteConversation(id) {
    dispatch({ type: IA_ACTION.DELETE_CONVERSATION, payload: id });
  }

  function renameConversation(id, title) {
    dispatch({ type: IA_ACTION.RENAME_CONVERSATION, payload: { id, title } });
  }

  function toggleFavorite(id) {
    dispatch({ type: IA_ACTION.TOGGLE_FAVORITE, payload: id });
  }

  function setInput(text) {
    dispatch({ type: IA_ACTION.SET_INPUT, payload: text });
  }

  function addAttachment(attachment) {
    dispatch({ type: IA_ACTION.ADD_ATTACHMENT, payload: attachment });
  }

  function removeAttachment(id) {
    dispatch({ type: IA_ACTION.REMOVE_ATTACHMENT, payload: id });
  }

  function setProvider(providerId) {
    cancelStreamRef.current?.();
    dispatch({ type: IA_ACTION.SET_PROVIDER, payload: providerId });
  }

  async function sendMessage() {
    const text        = state.inputText.trim();
    const attachments = state.pendingAttachments;
    if (!text && attachments.length === 0) return;
    if (!clientRef.current) return;

    // Obtiene el historial de la conversación activa
    const activeConv = state.conversations.find(c => c.id === state.activeId);

    // Si no hay conversación activa, crea una nueva
    if (!activeConv) newConversation();

    // Limpia input y adjuntos
    dispatch({ type: IA_ACTION.SET_INPUT,          payload: "" });
    dispatch({ type: IA_ACTION.CLEAR_ATTACHMENTS });

    // Agrega mensaje del usuario
    const userMsg = createMessage(SENDER.USER, text, attachments);
    dispatch({ type: IA_ACTION.ADD_MESSAGE, payload: userMsg });
    dispatch({ type: IA_ACTION.SET_STATUS,  payload: CONVERSATION_STATUS.LOADING });

    // Placeholder del mensaje IA (irá actualizándose durante el stream)
    const aiMsg = createMessage(SENDER.AI, "", [], MESSAGE_STATUS.SENDING);
    dispatch({ type: IA_ACTION.ADD_MESSAGE, payload: aiMsg });

    const payload = {
      conversationId: state.activeId,
      text,
      attachments,
      history: activeConv?.messages ?? [],
    };

    if (clientRef.current.config.capabilities.streaming) {
      dispatch({ type: IA_ACTION.SET_STATUS, payload: CONVERSATION_STATUS.STREAMING });
      let accumulated = "";

      const cancel = clientRef.current.streamMessage(
        payload,
        (chunk) => {
          accumulated += chunk;
          dispatch({
            type:    IA_ACTION.UPDATE_MESSAGE,
            payload: { id: aiMsg.id, changes: { text: accumulated, status: MESSAGE_STATUS.RECEIVED } },
          });
        },
        () => {
          dispatch({ type: IA_ACTION.SET_STATUS, payload: CONVERSATION_STATUS.IDLE });
          cancelStreamRef.current = null;
        },
        (err) => {
          dispatch({ type: IA_ACTION.SET_ERROR,  payload: err.message });
          dispatch({
            type:    IA_ACTION.UPDATE_MESSAGE,
            payload: { id: aiMsg.id, changes: { status: MESSAGE_STATUS.ERROR } },
          });
        },
      );
      cancelStreamRef.current = cancel;
    } else {
      try {
        const responseText = await clientRef.current.sendMessage(payload);
        dispatch({
          type:    IA_ACTION.UPDATE_MESSAGE,
          payload: { id: aiMsg.id, changes: { text: responseText, status: MESSAGE_STATUS.RECEIVED } },
        });
        dispatch({ type: IA_ACTION.SET_STATUS, payload: CONVERSATION_STATUS.IDLE });
      } catch (err) {
        dispatch({ type: IA_ACTION.SET_ERROR,  payload: err.message });
        dispatch({
          type:    IA_ACTION.UPDATE_MESSAGE,
          payload: { id: aiMsg.id, changes: { status: MESSAGE_STATUS.ERROR } },
        });
      }
    }
  }

  const value = {
    state,
    dispatch,
    // Acciones
    selectConversation,
    newConversation,
    deleteConversation,
    renameConversation,
    toggleFavorite,
    sendMessage,
    setInput,
    addAttachment,
    removeAttachment,
    setProvider,
  };

  return <IAContext.Provider value={value}>{children}</IAContext.Provider>;
}
