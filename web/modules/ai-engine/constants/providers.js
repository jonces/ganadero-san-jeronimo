export const PROVIDER_ID = /** @type {const} */ ({
  OPENAI:  "openai",
  CLAUDE:  "claude",
  GEMINI:  "gemini",
  LOCAL:   "local",
});

/** Modelos por defecto de cada proveedor */
export const DEFAULT_MODELS = /** @type {const} */ ({
  [PROVIDER_ID.OPENAI]: "gpt-4o",
  [PROVIDER_ID.CLAUDE]: "claude-opus-5",
  [PROVIDER_ID.GEMINI]: "gemini-2.0-flash",
  [PROVIDER_ID.LOCAL]:  "llama3.2",
});

/** Opciones de chat por defecto (se pueden sobrescribir en cada llamada) */
export const DEFAULT_CHAT_OPTIONS = {
  temperature: 0.7,
  maxTokens:   2048,
};
