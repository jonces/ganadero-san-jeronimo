import {
  FILE_CATEGORY, MIME_TO_CATEGORY, FILE_SIZE_LIMIT_MB,
  FILE_CATEGORY_CONFIG, UPLOAD_STATUS,
} from "../constants/files.js";

function uuid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Devuelve la categoría de un archivo según su MIME type.
 * Si no reconoce el MIME, intenta inferirlo por extensión.
 * @param {File} file
 * @returns {string} FILE_CATEGORY
 */
export function detectCategory(file) {
  const byMime = MIME_TO_CATEGORY[file.type];
  if (byMime) return byMime;

  // Fallback por extensión
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","webp","gif","heic","bmp"].includes(ext)) return FILE_CATEGORY.IMAGE;
  if (["mp4","mov","avi","mkv","webm","mpeg"].includes(ext))         return FILE_CATEGORY.VIDEO;
  if (["mp3","m4a","wav","ogg","aac"].includes(ext))                 return FILE_CATEGORY.AUDIO;
  if (["pdf"].includes(ext))                                          return FILE_CATEGORY.PDF;
  if (["xls","xlsx","csv"].includes(ext))                             return FILE_CATEGORY.EXCEL;
  if (["doc","docx","rtf","odt"].includes(ext))                       return FILE_CATEGORY.WORD;
  return FILE_CATEGORY.UNKNOWN;
}

/**
 * Valida un archivo contra los límites de su categoría.
 * @param {File}   file
 * @param {string} category  FILE_CATEGORY
 * @returns {{ ok: boolean, error: string|null }}
 */
export function validateFile(file, category) {
  const limitMB  = FILE_SIZE_LIMIT_MB[category] ?? FILE_SIZE_LIMIT_MB[FILE_CATEGORY.UNKNOWN];
  const limitBytes = limitMB * 1024 * 1024;

  if (file.size > limitBytes) {
    const config = FILE_CATEGORY_CONFIG[category];
    return {
      ok:    false,
      error: `El archivo supera el límite de ${limitMB} MB para ${config.label}.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: "El archivo está vacío." };
  }
  return { ok: true, error: null };
}

/**
 * Genera una URL de previsualización para imágenes y videos.
 * Devuelve null para otros tipos.
 * IMPORTANTE: llamar a revokeFileUrls() al eliminar el archivo.
 * @param {File}   file
 * @param {string} category
 * @returns {string|null}
 */
export function createPreviewUrl(file, category) {
  if (category === FILE_CATEGORY.IMAGE || category === FILE_CATEGORY.VIDEO) {
    return URL.createObjectURL(file);
  }
  return null;
}

/**
 * Extrae metadatos útiles del archivo.
 * @param {File}   file
 * @param {string} category
 * @returns {Object}
 */
export function extractMeta(file, category) {
  const meta = {
    lastModified: new Date(file.lastModified).toISOString(),
    type:         file.type || "desconocido",
  };

  // Para imágenes: ancho/alto se resuelve de forma asíncrona después
  // Para audio/video: duración se resuelve de forma asíncrona después
  // Aquí solo devolvemos lo síncrono

  return meta;
}

/**
 * Convierte un File en un FileItem completo, listo para mostrar en la UI.
 * No sube nada al servidor.
 *
 * @param {File} file
 * @returns {{ item: FileItem, error: string|null }}
 *
 * @typedef {Object} FileItem
 * @property {string}      id
 * @property {string}      name
 * @property {number}      size
 * @property {string}      mimeType
 * @property {string}      category      - FILE_CATEGORY
 * @property {string}      status        - UPLOAD_STATUS
 * @property {string|null} previewUrl    - Blob URL para imagen/video (revocar al eliminar)
 * @property {Object}      meta          - Metadatos adicionales
 * @property {File}        file          - Referencia al File original
 * @property {string|null} error         - Mensaje de error si status === "error"
 * @property {number}      addedAt       - Date.now()
 */
export function buildFileItem(file) {
  const category = detectCategory(file);
  const { ok, error } = validateFile(file, category);

  if (!ok) {
    return {
      item: {
        id:         uuid(),
        name:       file.name,
        size:       file.size,
        mimeType:   file.type,
        category,
        status:     UPLOAD_STATUS.ERROR,
        previewUrl: null,
        meta:       {},
        file,
        error,
        addedAt:    Date.now(),
      },
      error,
    };
  }

  const previewUrl = createPreviewUrl(file, category);

  return {
    item: {
      id:         uuid(),
      name:       file.name,
      size:       file.size,
      mimeType:   file.type,
      category,
      status:     UPLOAD_STATUS.READY,
      previewUrl,
      meta:       extractMeta(file, category),
      file,
      error:      null,
      addedAt:    Date.now(),
    },
    error: null,
  };
}

/**
 * Procesa una lista de Files (de un input o drop event).
 * Devuelve items válidos y lista de errores.
 * @param {File[]} files
 * @returns {{ items: FileItem[], errors: string[] }}
 */
export function processFiles(files) {
  const items  = [];
  const errors = [];

  for (const file of files) {
    const { item, error } = buildFileItem(file);
    items.push(item);
    if (error) errors.push(`${file.name}: ${error}`);
  }

  return { items, errors };
}

/**
 * Revoca todas las Blob URLs generadas para liberar memoria.
 * Llamar al eliminar items o desmontar el componente.
 * @param {FileItem[]} items
 */
export function revokeFileUrls(items) {
  for (const item of items) {
    if (item.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}

/** Formatea bytes en unidad legible */
export function formatFileSize(bytes) {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Mantener compatibilidad con el file-handler anterior
export { buildFileItem as fileToAttachment };
export function revokeAttachmentUrls(attachments) {
  revokeFileUrls(attachments);
}
