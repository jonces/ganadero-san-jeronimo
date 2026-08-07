// ── API pública del módulo AI Image Studio ────────────────────────────────────
// Importar siempre desde aquí, nunca desde subcarpetas directamente.

// Constantes
export { IMAGE_CATEGORIES, QUALITY_SUFFIX, getCategoryConfig } from "./constants/categories.js";
export { IMAGE_TRIGGER_VERBS, IMAGE_TRIGGER_NOUNS, detectImageTrigger, detectImageCategory } from "./constants/image-triggers.js";
export { SPECIALIST_PROMPT_PREFIXES, PROMPT_TEMPLATES, getSpecialistPrefix, findMatchingTemplate } from "./constants/specialist-prompts.js";

// Servicios
export { buildImagePrompt }                                          from "./services/prompt-builder.js";
export { generateChatImage, regenerateImage, downloadImage, downloadToDataUrl, isImageStudioAvailable } from "./services/image-studio-service.js";
export { addToGallery, updateGalleryEntry, removeFromGallery, loadGallery, clearGallery, filterGallery } from "./services/gallery-storage.js";

// Componentes
export { ImageResultCard } from "./components/ImageResultCard.js";
export { ImageGallery }    from "./components/ImageGallery.js";
