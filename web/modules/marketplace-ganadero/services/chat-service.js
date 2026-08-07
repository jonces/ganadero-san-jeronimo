/**
 * Chat comercial entre comprador y vendedor.
 * localStorage en demo; en producción → WebSocket.
 */
import { addChatMessage, getChatMessages } from "./marketplace-storage.js";

export const MSG_TYPE = {
  TEXTO:      "texto",
  IMAGEN:     "imagen",
  VIDEO:      "video",
  DOCUMENTO:  "documento",
  COTIZACION: "cotizacion",
  UBICACION:  "ubicacion",
  SISTEMA:    "sistema",
};

/** Genera un ID de chat reproducible a partir de dos usuarios y un listing. */
export function buildChatId(userId1, userId2, listingId) {
  const sorted = [userId1, userId2].sort().join("_");
  return `chat_${sorted}_${listingId}`;
}

export function sendMessage(chatId, { remitente, tipo = MSG_TYPE.TEXTO, contenido, metadata = {} }) {
  return addChatMessage(chatId, { remitente, tipo, contenido, metadata, leido: false });
}

export function getMessages(chatId) {
  return getChatMessages(chatId);
}

export function getConversations(userId) {
  // Retorna lista de chats donde participa userId
  if (typeof window === "undefined") return [];
  try {
    const chats = JSON.parse(localStorage.getItem("mkt_chats_v1")) ?? {};
    return Object.entries(chats)
      .filter(([chatId]) => chatId.includes(userId))
      .map(([chatId, messages]) => {
        const last = messages[messages.length - 1];
        return { chatId, last, total: messages.length, sinLeer: messages.filter(m => !m.leido && m.remitente?.id !== userId).length };
      })
      .sort((a, b) => (b.last?.ts ?? 0) - (a.last?.ts ?? 0));
  } catch { return []; }
}
