// ── Categorías de archivo ─────────────────────────────────────────────────────
export const FILE_CATEGORY = {
  IMAGE:    "image",
  VIDEO:    "video",
  AUDIO:    "audio",
  PDF:      "pdf",
  EXCEL:    "excel",
  WORD:     "word",
  UNKNOWN:  "unknown",
};

// ── Configuración visual por categoría ───────────────────────────────────────
export const FILE_CATEGORY_CONFIG = {
  [FILE_CATEGORY.IMAGE]: {
    label:    "Imagen",
    icono:    "🖼️",
    color:    "#0EA5E9",
    bg:       "#F0F9FF",
    border:   "#BAE6FD",
    exts:     ["JPG", "PNG", "WEBP", "GIF", "HEIC", "BMP"],
    preview:  true,   // se puede mostrar preview visual
  },
  [FILE_CATEGORY.VIDEO]: {
    label:    "Video",
    icono:    "🎬",
    color:    "#8B5CF6",
    bg:       "#F5F3FF",
    border:   "#DDD6FE",
    exts:     ["MP4", "MOV", "AVI", "MKV", "WEBM"],
    preview:  true,
  },
  [FILE_CATEGORY.AUDIO]: {
    label:    "Audio",
    icono:    "🎵",
    color:    "#EC4899",
    bg:       "#FDF2F8",
    border:   "#FBCFE8",
    exts:     ["MP3", "M4A", "WAV", "OGG", "AAC"],
    preview:  false,
  },
  [FILE_CATEGORY.PDF]: {
    label:    "PDF",
    icono:    "📄",
    color:    "#EF4444",
    bg:       "#FEF2F2",
    border:   "#FECACA",
    exts:     ["PDF"],
    preview:  false,
  },
  [FILE_CATEGORY.EXCEL]: {
    label:    "Excel",
    icono:    "📊",
    color:    "#10A37F",
    bg:       "#F0FDF4",
    border:   "#A7F3D0",
    exts:     ["XLS", "XLSX", "CSV"],
    preview:  false,
  },
  [FILE_CATEGORY.WORD]: {
    label:    "Word",
    icono:    "📝",
    color:    "#2563EB",
    bg:       "#EFF6FF",
    border:   "#BFDBFE",
    exts:     ["DOC", "DOCX", "RTF", "ODT"],
    preview:  false,
  },
  [FILE_CATEGORY.UNKNOWN]: {
    label:    "Archivo",
    icono:    "📎",
    color:    "#6B7280",
    bg:       "#F9FAFB",
    border:   "#E5E7EB",
    exts:     [],
    preview:  false,
  },
};

// ── Mapeo MIME → categoría ────────────────────────────────────────────────────
export const MIME_TO_CATEGORY = {
  // Imágenes
  "image/jpeg":        FILE_CATEGORY.IMAGE,
  "image/jpg":         FILE_CATEGORY.IMAGE,
  "image/png":         FILE_CATEGORY.IMAGE,
  "image/webp":        FILE_CATEGORY.IMAGE,
  "image/gif":         FILE_CATEGORY.IMAGE,
  "image/heic":        FILE_CATEGORY.IMAGE,
  "image/bmp":         FILE_CATEGORY.IMAGE,
  // Videos
  "video/mp4":         FILE_CATEGORY.VIDEO,
  "video/quicktime":   FILE_CATEGORY.VIDEO,
  "video/x-msvideo":   FILE_CATEGORY.VIDEO,
  "video/x-matroska":  FILE_CATEGORY.VIDEO,
  "video/webm":        FILE_CATEGORY.VIDEO,
  "video/mpeg":        FILE_CATEGORY.VIDEO,
  // Audios
  "audio/mpeg":        FILE_CATEGORY.AUDIO,
  "audio/mp3":         FILE_CATEGORY.AUDIO,
  "audio/mp4":         FILE_CATEGORY.AUDIO,
  "audio/x-m4a":       FILE_CATEGORY.AUDIO,
  "audio/wav":         FILE_CATEGORY.AUDIO,
  "audio/ogg":         FILE_CATEGORY.AUDIO,
  "audio/aac":         FILE_CATEGORY.AUDIO,
  // PDF
  "application/pdf":   FILE_CATEGORY.PDF,
  // Excel
  "application/vnd.ms-excel":                                          FILE_CATEGORY.EXCEL,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FILE_CATEGORY.EXCEL,
  "text/csv":                                                           FILE_CATEGORY.EXCEL,
  // Word
  "application/msword":                                                       FILE_CATEGORY.WORD,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":  FILE_CATEGORY.WORD,
  "application/rtf":                                                           FILE_CATEGORY.WORD,
  "application/vnd.oasis.opendocument.text":                                   FILE_CATEGORY.WORD,
};

// ── Límites por categoría (MB) ────────────────────────────────────────────────
export const FILE_SIZE_LIMIT_MB = {
  [FILE_CATEGORY.IMAGE]:   20,
  [FILE_CATEGORY.VIDEO]:  200,
  [FILE_CATEGORY.AUDIO]:   50,
  [FILE_CATEGORY.PDF]:     50,
  [FILE_CATEGORY.EXCEL]:   20,
  [FILE_CATEGORY.WORD]:    20,
  [FILE_CATEGORY.UNKNOWN]: 10,
};

// ── accept string para <input type="file"> ────────────────────────────────────
export const ACCEPT_ALL = [
  // Imágenes
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/bmp",
  // Videos
  "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/mpeg",
  // Audios
  "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/ogg", "audio/aac",
  // PDF
  "application/pdf",
  // Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  // Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
].join(",");

// ── Estado de un archivo en cola ──────────────────────────────────────────────
export const UPLOAD_STATUS = {
  PENDING:  "pending",   // recién agregado, sin procesar
  READY:    "ready",     // validado y listo para enviar
  ERROR:    "error",     // error de validación
};
