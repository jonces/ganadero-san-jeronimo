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
