import { ATTACHMENT_TYPE, LIMITS } from "../constants/index.js";

function uuid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Valida y convierte un File del input a un objeto Attachment.
 * Lanza Error si el archivo no pasa la validación.
 * @param {File} file
 * @returns {Promise<import('../types').Attachment>}
 */
export async function fileToAttachment(file) {
  const maxBytes = LIMITS.MAX_ATTACHMENT_MB * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(`El archivo "${file.name}" supera el límite de ${LIMITS.MAX_ATTACHMENT_MB} MB.`);
  }

  const isImage = LIMITS.ACCEPTED_IMAGE_TYPES.includes(file.type);
  const isDoc   = LIMITS.ACCEPTED_DOC_TYPES.includes(file.type);

  if (!isImage && !isDoc) {
    throw new Error(`Tipo de archivo no soportado: ${file.type}`);
  }

  const type = isImage ? ATTACHMENT_TYPE.IMAGE : ATTACHMENT_TYPE.DOCUMENT;
  const url  = isImage ? URL.createObjectURL(file) : null;

  return {
    id:       uuid(),
    type,
    name:     file.name,
    size:     file.size,
    mimeType: file.type,
    url,
    file,
  };
}

/**
 * Revoca URLs de objeto para liberar memoria.
 * Llamar al eliminar adjuntos o desmontar el componente.
 * @param {import('../types').Attachment[]} attachments
 */
export function revokeAttachmentUrls(attachments) {
  for (const a of attachments) {
    if (a.url && a.url.startsWith("blob:")) URL.revokeObjectURL(a.url);
  }
}

/** Formatea bytes en unidad legible (KB / MB) */
export function formatFileSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
