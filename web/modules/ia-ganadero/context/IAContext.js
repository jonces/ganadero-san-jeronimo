"use client";
import { createContext, useReducer, useRef, useEffect, useContext, useCallback } from "react";
import { iaReducer, INITIAL_STATE }       from "./IAReducer.js";
import { createProvider }                 from "../services/providers/index.js";
import { IA_ACTION, CONVERSATION_STATUS, MESSAGE_STATUS, SENDER } from "../constants/index.js";
import { createMessage, createConversation } from "../utils/message-factory.js";
import { ConversationContextCtx }         from "./ConversationContextContext.js";
import { AIEngine }                       from "../../ai-engine/index.js";
import { loadConversations, saveConversations } from "../services/memory/conversation-memory.js";

export const IAContext = createContext(null);

export function IAProvider({ children }) {
  const persisted            = loadConversations();
  const initialWithMemory    = persisted.length > 0
    ? { ...INITIAL_STATE, conversations: persisted, activeId: persisted[0]?.id ?? null }
    : INITIAL_STATE;

  const [state, dispatch]  = useReducer(iaReducer, initialWithMemory);
  const clientRef          = useRef(null);
  const cancelStreamRef    = useRef(null);
  const engineRef          = useRef(AIEngine.create());
  const specialistIdRef    = useRef("veterinario");

  const convCtx = useContext(ConversationContextCtx);

  // Persiste conversaciones en localStorage cada vez que cambian
  useEffect(() => {
    saveConversations(state.conversations);
  }, [state.conversations]);

  // Inicializa el provider cuando cambia
  useEffect(() => {
    let destroyed = false;

    async function initProvider() {
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

  // ── Acciones ──────────────────────────────────────────────────────────────

  const selectConversation = useCallback((id) => {
    cancelStreamRef.current?.();
    dispatch({ type: IA_ACTION.SELECT_CONVERSATION, payload: id });
  }, []);

  const newConversation = useCallback(() => {
    cancelStreamRef.current?.();
    const conv = createConversation(state.providerId, convCtx?.context ?? null);
    dispatch({ type: IA_ACTION.CREATE_CONVERSATION, payload: conv });
  }, [state.providerId, convCtx?.context]);

  const deleteConversation = useCallback((id) => {
    dispatch({ type: IA_ACTION.DELETE_CONVERSATION, payload: id });
  }, []);

  const renameConversation = useCallback((id, title) => {
    dispatch({ type: IA_ACTION.RENAME_CONVERSATION, payload: { id, title } });
  }, []);

  const toggleFavorite = useCallback((id) => {
    dispatch({ type: IA_ACTION.TOGGLE_FAVORITE, payload: id });
  }, []);

  const setInput = useCallback((text) => {
    dispatch({ type: IA_ACTION.SET_INPUT, payload: text });
  }, []);

  const addAttachment = useCallback((attachment) => {
    dispatch({ type: IA_ACTION.ADD_ATTACHMENT, payload: attachment });
  }, []);

  const removeAttachment = useCallback((id) => {
    dispatch({ type: IA_ACTION.REMOVE_ATTACHMENT, payload: id });
  }, []);

  const setProvider = useCallback((providerId) => {
    cancelStreamRef.current?.();
    dispatch({ type: IA_ACTION.SET_PROVIDER, payload: providerId });
  }, []);

  // Actualiza el especialista activo (ej: "veterinario", "nutricionista")
  // IAContext lo necesita para construir el system prompt correcto.
  const setSpecialist = useCallback((id) => {
    specialistIdRef.current = id;
  }, []);

  async function sendMessage(overrideSpecialist) {
    const text        = state.inputText.trim();
    const attachments = state.pendingAttachments;
    if (!text && attachments.length === 0) return;
    if (!clientRef.current) return;

    const activeConv = state.conversations.find(c => c.id === state.activeId);

    if (!activeConv) newConversation();

    dispatch({ type: IA_ACTION.SET_INPUT,        payload: "" });
    dispatch({ type: IA_ACTION.CLEAR_ATTACHMENTS });

    const userMsg = createMessage(SENDER.USER, text, attachments);
    dispatch({ type: IA_ACTION.ADD_MESSAGE, payload: userMsg });
    dispatch({ type: IA_ACTION.SET_STATUS,  payload: CONVERSATION_STATUS.LOADING });

    const aiMsg = createMessage(SENDER.AI, "", [], MESSAGE_STATUS.SENDING);
    // Marca el mensaje IA como "en streaming" desde el inicio
    aiMsg.isStreaming = true;
    dispatch({ type: IA_ACTION.ADD_MESSAGE, payload: aiMsg });

    const payload = {
      conversationId: state.activeId,
      text,
      attachments,
      history:        activeConv?.messages ?? [],
      context:        activeConv?.context ?? convCtx?.context ?? null,
      // Permite que el provider construya el system prompt con el especialista activo
      specialistId:   overrideSpecialist ?? specialistIdRef.current ?? "veterinario",
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
            payload: {
              id:      aiMsg.id,
              changes: { text: accumulated, status: MESSAGE_STATUS.RECEIVED, isStreaming: true },
            },
          });
        },
        () => {
          // Stream terminado — quita el cursor de streaming
          dispatch({
            type:    IA_ACTION.UPDATE_MESSAGE,
            payload: { id: aiMsg.id, changes: { isStreaming: false } },
          });
          dispatch({ type: IA_ACTION.SET_STATUS, payload: CONVERSATION_STATUS.IDLE });
          cancelStreamRef.current = null;
        },
        (err) => {
          dispatch({ type: IA_ACTION.SET_ERROR,  payload: err.message });
          dispatch({
            type:    IA_ACTION.UPDATE_MESSAGE,
            payload: { id: aiMsg.id, changes: { status: MESSAGE_STATUS.ERROR, isStreaming: false } },
          });
        },
      );
      cancelStreamRef.current = cancel;
    } else {
      try {
        const responseText = await clientRef.current.sendMessage(payload);
        dispatch({
          type:    IA_ACTION.UPDATE_MESSAGE,
          payload: {
            id:      aiMsg.id,
            changes: { text: responseText, status: MESSAGE_STATUS.RECEIVED, isStreaming: false },
          },
        });
        dispatch({ type: IA_ACTION.SET_STATUS, payload: CONVERSATION_STATUS.IDLE });
      } catch (err) {
        dispatch({ type: IA_ACTION.SET_ERROR, payload: err.message });
        dispatch({
          type:    IA_ACTION.UPDATE_MESSAGE,
          payload: { id: aiMsg.id, changes: { status: MESSAGE_STATUS.ERROR, isStreaming: false } },
        });
      }
    }
  }

  const value = {
    state,
    dispatch,
    engine: engineRef.current,
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
    setSpecialist,
  };

  return <IAContext.Provider value={value}>{children}</IAContext.Provider>;
}
