// ── AI Engine — API pública ───────────────────────────────────────────────────
// Importar siempre desde aquí, nunca desde subcarpetas directamente.

// Motor principal
export { AIEngine }           from "./engine/ai-engine.js";
export { ProviderRegistry }   from "./engine/provider-registry.js";

// Proveedores
export { AIProvider }         from "./providers/base-provider.js";
export { OpenAIProvider }     from "./providers/openai-provider.js";
export { ClaudeProvider }     from "./providers/claude-provider.js";
export { GeminiProvider }     from "./providers/gemini-provider.js";
export { LocalProvider }      from "./providers/local-provider.js";

// Constantes
export { PROVIDER_ID, DEFAULT_MODELS, DEFAULT_CHAT_OPTIONS } from "./constants/providers.js";

// Errores
export { AIError, NotImplementedError, NotConfiguredError, AIErrorCode } from "./errors/ai-error.js";

// Servicios de medios y generación
export { fileToBase64, resizeIfNeeded, generateThumbnail, getImageDimensions, isSupportedByVision } from "./services/image-processor.js";
export { extractText, documentTypeLabel }    from "./services/document-processor.js";
export { extractVideoInfo, extractFrames, formatDuration } from "./services/video-processor.js";
export { startRecording, getAudioDuration, isRecordingSupported } from "./services/audio-processor.js";
export { generateImage, buildGanaderiaPrompt, isImageGenerationAvailable } from "./services/image-generator.js";
