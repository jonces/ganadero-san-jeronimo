import { SENDER, MESSAGE_STATUS, CONVERSATION_STATUS } from "../constants/index.js";

function uuid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Crea un objeto Message con valores por defecto.
 * @param {string}     sender      - SENDER
 * @param {string}     text        - Contenido
 * @param {import('../types').Attachment[]} [attachments]
 * @param {string}     [status]    - MESSAGE_STATUS (default: SENT)
 * @returns {import('../types').Message}
 */
export function createMessage(sender, text, attachments = [], status = MESSAGE_STATUS.SENT) {
  return {
    id:          uuid(),
    sender,
    text,
    status,
    timestamp:   Date.now(),
    attachments: attachments ?? [],
  };
}

/**
 * Crea un objeto Conversation vacío.
 * @param {string} [providerId]
 * @returns {import('../types').Conversation}
 */
export function createConversation(providerId = null) {
  const now = new Date().toISOString();
  return {
    id:         uuid(),
    title:      "Nueva conversación",
    messages:   [],
    createdAt:  now,
    updatedAt:  now,
    providerId,
  };
}

/**
 * Genera un título automático a partir del primer mensaje del usuario.
 * Máximo 40 caracteres.
 * @param {string} text
 * @returns {string}
 */
export function autoTitle(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 40 ? clean.slice(0, 37) + "…" : clean;
}
