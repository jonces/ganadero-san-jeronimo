/**
 * Servicio principal del AI Image Studio.
 * Orquesta detección, generación, almacenamiento y descarga de imágenes.
 */

import { detectImageTrigger, detectImageCategory } from "../constants/image-triggers.js";
import { buildImagePrompt }                         from "./prompt-builder.js";
import { addToGallery, updateGalleryEntry }         from "./gallery-storage.js";

/**
 * Genera una imagen para el chat si el mensaje del usuario lo requiere.
 *
 * @param {object} opts
 * @param {string}  opts.userText       — Texto del mensaje del usuario
 * @param {string}  opts.specialistId
 * @param {string}  opts.conversationId
 * @param {string}  opts.messageId      — ID del mensaje IA al que se asociará
 * @param {object|null} opts.fincaCtx   — Contexto de finca (opcional)
 * @param {function} opts.onStart       — Callback cuando empieza a generar
 * @param {function} opts.onSuccess     — Callback(imageData) cuando termina
 * @param {function} opts.onError       — Callback(errorMsg) en error
 * @returns {Promise<void>}
 */
export async function generateChatImage({
  userText,
  specialistId = "default",
  conversationId,
  messageId,
  fincaCtx = null,
  onStart,
  onSuccess,
  onError,
}) {
  const { shouldGenerate } = detectImageTrigger(userText);
  if (!shouldGenerate) return;

  const fincaContext = fincaCtx?.finca
    ? `${fincaCtx.finca.nombre ?? "cattle farm"}`
    : null;

  const { prompt, categoryId, size, style } = buildImagePrompt({
    userText,
    specialistId,
    fincaContext,
  });

  onStart?.();

  try {
    const res = await fetch("/api/ia/images", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt, size, style, quality: "standard", n: 1 }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Error ${res.status}`);
    }

    const data = await res.json();
    const imageUrl = data.images?.[0]?.url;
    const revisedPrompt = data.images?.[0]?.revised_prompt ?? prompt;

    if (!imageUrl) throw new Error("No se recibió URL de imagen");

    // Guardar en galería
    const entryId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry = {
      id:             entryId,
      url:            imageUrl,
      dataUrl:        null,
      prompt:         revisedPrompt,
      userText,
      specialistId,
      categoryId,
      size,
      conversationId,
      messageId,
      fincaId:        fincaCtx?.finca?.id   ?? null,
      fincaNombre:    fincaCtx?.finca?.nombre ?? null,
      createdAt:      Date.now(),
    };
    addToGallery(entry);

    // Descargar como dataUrl para persistencia (URL de DALL-E expira en 1h)
    downloadToDataUrl(imageUrl)
      .then(dataUrl => updateGalleryEntry(entryId, { dataUrl }))
      .catch(() => { /* URL expirada — el dataUrl quedará null */ });

    onSuccess?.({ ...entry, url: imageUrl });
  } catch (err) {
    onError?.(err.message);
  }
}

/**
 * Re-genera una imagen con el mismo prompt o uno modificado.
 */
export async function regenerateImage({ originalPrompt, userText, specialistId, conversationId, messageId, fincaCtx, onStart, onSuccess, onError }) {
  onStart?.();
  try {
    const { categoryId, size, style } = buildImagePrompt({ userText: originalPrompt ?? userText, specialistId });

    const res = await fetch("/api/ia/images", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt: originalPrompt, size, style, quality: "standard", n: 1 }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Error ${res.status}`);
    }

    const data = await res.json();
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) throw new Error("No se recibió URL de imagen");

    const entryId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry = {
      id: entryId, url: imageUrl, dataUrl: null,
      prompt: originalPrompt, userText, specialistId, categoryId, size,
      conversationId, messageId, fincaId: fincaCtx?.finca?.id ?? null,
      fincaNombre: fincaCtx?.finca?.nombre ?? null, createdAt: Date.now(),
    };
    addToGallery(entry);
    downloadToDataUrl(imageUrl)
      .then(dataUrl => updateGalleryEntry(entryId, { dataUrl }))
      .catch(() => {});

    onSuccess?.({ ...entry, url: imageUrl });
  } catch (err) {
    onError?.(err.message);
  }
}

/**
 * Descarga una imagen URL como dataUrl (base64).
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function downloadToDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Descarga directa de imagen al dispositivo.
 * @param {string} url
 * @param {string} [filename]
 */
export async function downloadImage(url, filename = "ganaderosg-imagen.png") {
  try {
    const dataUrl = url.startsWith("data:") ? url : await downloadToDataUrl(url);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  } catch {
    // Fallback: abrir en nueva pestaña
    window.open(url, "_blank");
  }
}

/**
 * Verifica si la generación de imágenes está disponible (OPENAI_API_KEY configurada).
 * @returns {Promise<boolean>}
 */
export async function isImageStudioAvailable() {
  try {
    const res  = await fetch("/api/ia/status");
    const data = await res.json();
    return Boolean(data?.openai?.configured) || Boolean(data?.images?.configured);
  } catch { return false; }
}
