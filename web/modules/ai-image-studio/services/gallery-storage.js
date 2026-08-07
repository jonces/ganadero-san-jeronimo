/**
 * Galería de imágenes generadas — persistencia en localStorage.
 */

const STORAGE_KEY  = "ganaderosg_image_gallery";
const MAX_ENTRIES  = 200;

/**
 * @typedef {object} GalleryEntry
 * @property {string}  id
 * @property {string}  url              — URL temporal de la imagen (expira en 1h con DALL-E)
 * @property {string}  dataUrl          — Base64 permanente (guardado tras descarga)
 * @property {string}  prompt           — Prompt enviado a DALL-E
 * @property {string}  userText         — Texto original del usuario
 * @property {string}  specialistId
 * @property {string}  categoryId
 * @property {string}  size
 * @property {string}  conversationId
 * @property {string}  messageId        — ID del mensaje IA al que está asociada
 * @property {string}  fincaId
 * @property {string}  fincaNombre
 * @property {number}  createdAt        — timestamp ms
 */

function load() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function save(entries) {
  if (typeof window === "undefined") return;
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_ENTRIES);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted)); } catch { /* quota */ }
}

/** Agrega una entrada nueva a la galería. */
export function addToGallery(entry) {
  const all = load();
  all.unshift({ ...entry, createdAt: entry.createdAt ?? Date.now() });
  save(all);
}

/** Actualiza una entrada existente (p.ej. para guardar el dataUrl). */
export function updateGalleryEntry(id, changes) {
  const all = load();
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...changes };
    save(all);
  }
}

/** Elimina una entrada de la galería. */
export function removeFromGallery(id) {
  save(load().filter(e => e.id !== id));
}

/** Retorna todas las entradas. */
export function loadGallery() {
  return load();
}

/** Limpia toda la galería. */
export function clearGallery() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Filtra la galería.
 * @param {{ specialistId?, categoryId?, fincaId?, search?, dateFrom?, dateTo? }} filters
 */
export function filterGallery({ specialistId, categoryId, fincaId, search, dateFrom, dateTo } = {}) {
  return load().filter(e => {
    if (specialistId && e.specialistId !== specialistId) return false;
    if (categoryId   && e.categoryId   !== categoryId)   return false;
    if (fincaId      && e.fincaId      !== fincaId)       return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.userText?.toLowerCase().includes(q) && !e.prompt?.toLowerCase().includes(q)) return false;
    }
    if (dateFrom && e.createdAt < dateFrom) return false;
    if (dateTo   && e.createdAt > dateTo)   return false;
    return true;
  });
}
