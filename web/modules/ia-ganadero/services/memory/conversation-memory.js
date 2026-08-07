const STORAGE_KEY = "ganaderosg_ia_conversations";
const MAX_STORED  = 100;    // máximo de conversaciones a persistir
const MAX_MSG_PER = 200;    // máximo de mensajes por conversación

/**
 * Lee todas las conversaciones guardadas del localStorage.
 * Devuelve [] si no hay nada o si localStorage no está disponible.
 * @returns {import('../../types').Conversation[]}
 */
export function loadConversations() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Persiste el array de conversaciones en localStorage.
 * Recorta automáticamente si excede el límite.
 * @param {import('../../types').Conversation[]} conversations
 */
export function saveConversations(conversations) {
  if (typeof window === "undefined") return;
  try {
    // Ordena por updatedAt desc, mantiene las más recientes
    const sorted = [...conversations]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, MAX_STORED)
      .map(conv => ({
        ...conv,
        // Recorta mensajes muy largos para no saturar localStorage
        messages: (conv.messages ?? []).slice(-MAX_MSG_PER),
      }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    // localStorage lleno — silencia el error para no romper la UI
  }
}

/**
 * Elimina una conversación del localStorage.
 * @param {string} id
 */
export function deleteConversationFromStorage(id) {
  const convs = loadConversations().filter(c => c.id !== id);
  saveConversations(convs);
}

/**
 * Limpia todo el historial guardado.
 */
export function clearAllConversations() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
