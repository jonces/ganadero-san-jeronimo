"use client";

/**
 * Codifica los adjuntos de un mensaje al formato multimodal de Anthropic.
 * Devuelve un array de content blocks listos para incluir en messages[].content.
 *
 * Soporta:
 *   - Imágenes (image/jpeg, image/png, image/gif, image/webp) → base64
 *   - Documentos de texto (text/plain, text/csv)             → text block
 *   - PDF (application/pdf)                                  → stub (requiere PDF.js)
 *   - Resto (video, audio, Excel, Word)                      → referencia de texto
 *
 * @param {import('../utils/file-handler').FileItem[]} attachments
 * @param {string} [userText]  - Texto del usuario que acompaña los adjuntos
 * @returns {Promise<object[]>}  Array de Anthropic content blocks
 */
export async function encodeAttachmentsForClaude(attachments, userText = "") {
  const blocks = [];

  for (const att of attachments) {
    try {
      const block = await encodeOne(att);
      if (block) blocks.push(block);
    } catch {
      // Si falla la codificación, agrega referencia de texto en su lugar
      blocks.push({
        type: "text",
        text: `[Archivo adjunto: ${att.name} (${att.category ?? att.type}) — no se pudo procesar]`,
      });
    }
  }

  // El texto del usuario va al final
  if (userText.trim()) {
    blocks.push({ type: "text", text: userText });
  }

  return blocks;
}

async function encodeOne(att) {
  const file = att.file;
  if (!file) return null;

  const mime = file.type || att.mime || "";

  // ── Imágenes → base64 ─────────────────────────────────────────────────────
  if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mime)) {
    const base64 = await fileToBase64(file);
    return {
      type:   "image",
      source: {
        type:       "base64",
        media_type: mime,
        data:       base64,
      },
    };
  }

  // ── Texto plano / CSV → text block ────────────────────────────────────────
  if (mime.startsWith("text/")) {
    const text = await file.text();
    return {
      type: "text",
      text: `[Archivo: ${att.name}]\n${text}`,
    };
  }

  // ── PDF → stub hasta integrar PDF.js ─────────────────────────────────────
  if (mime === "application/pdf") {
    return {
      type: "text",
      text: `[PDF adjunto: ${att.name} — análisis de PDF disponible próximamente. Por ahora describe su contenido en tu mensaje.]`,
    };
  }

  // ── Excel / Word / otros documentos ──────────────────────────────────────
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("word") ||
    mime.includes("document")
  ) {
    return {
      type: "text",
      text: `[Documento adjunto: ${att.name} (${mime}) — extracción de texto de Office disponible próximamente. Por favor copia y pega el contenido relevante en tu mensaje.]`,
    };
  }

  // ── Video / Audio → referencia ────────────────────────────────────────────
  if (mime.startsWith("video/") || mime.startsWith("audio/")) {
    const kind = mime.startsWith("video/") ? "Video" : "Audio";
    return {
      type: "text",
      text: `[${kind} adjunto: ${att.name} — el análisis de ${kind.toLowerCase()} estará disponible próximamente.]`,
    };
  }

  // Fallback genérico
  return {
    type: "text",
    text: `[Archivo adjunto: ${att.name} (${mime || "tipo desconocido"})]`,
  };
}

/** Convierte un File a string base64 sin el prefijo data: */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsDataURL(file);
  });
}

/**
 * Estima si los adjuntos pueden enviarse a la IA directamente.
 * @param {import('../utils/file-handler').FileItem[]} attachments
 * @returns {{ canSend: boolean, reasons: string[] }}
 */
export function validateAttachmentsForAI(attachments) {
  const reasons = [];
  const SUPPORTED_IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const MAX_IMAGE_SIZE_MB = 5;

  for (const att of attachments) {
    const mime = att.file?.type ?? "";
    if (SUPPORTED_IMAGES.includes(mime)) {
      const sizeMB = (att.file?.size ?? 0) / 1_048_576;
      if (sizeMB > MAX_IMAGE_SIZE_MB) {
        reasons.push(`${att.name}: imagen demasiado grande (máx ${MAX_IMAGE_SIZE_MB} MB)`);
      }
    }
  }

  return { canSend: reasons.length === 0, reasons };
}
