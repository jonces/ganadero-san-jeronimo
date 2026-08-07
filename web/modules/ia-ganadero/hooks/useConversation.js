"use client";
import { useIA }      from "../context/useIA.js";
import { autoTitle }  from "../utils/message-factory.js";
import { IA_ACTION, SENDER } from "../constants/index.js";

/**
 * Acceso a la conversación activa y sus mensajes.
 * Abstrae la búsqueda en el array de state.conversations.
 */
export function useConversation() {
  const { state, dispatch, selectConversation, newConversation,
          deleteConversation, renameConversation } = useIA();

  const active = state.conversations.find(c => c.id === state.activeId) ?? null;
  const messages = active?.messages ?? [];

  // Auto-titula la conversación cuando llega el primer mensaje del usuario
  function maybeAutoTitle(messageText) {
    if (!active) return;
    if (active.title !== "Nueva conversación") return;
    const firstUser = active.messages.find(m => m.sender === SENDER.USER);
    if (firstUser) return;
    dispatch({
      type:    IA_ACTION.RENAME_CONVERSATION,
      payload: { id: active.id, title: autoTitle(messageText) },
    });
  }

  return {
    active,
    messages,
    conversations:     state.conversations,
    activeId:          state.activeId,
    selectConversation,
    newConversation,
    deleteConversation,
    renameConversation,
    maybeAutoTitle,
  };
}
