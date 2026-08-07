/**
 * @typedef {Object} BaseProviderConfig
 * @property {string}  [model]        — modelo por defecto
 * @property {number}  [timeout]      — ms antes de abort (default 30000)
 * @property {number}  [maxRetries]   — reintentos en error de red (default 2)
 */

/**
 * @typedef {BaseProviderConfig} OpenAIConfig
 * @property {string}  apiKey
 * @property {string}  [baseUrl]      — override para Azure / proxies
 * @property {string}  [organization]
 */

/**
 * @typedef {BaseProviderConfig} ClaudeConfig
 * @property {string}  apiKey
 * @property {string}  [baseUrl]
 * @property {string}  [anthropicVersion]   — default "2023-06-01"
 */

/**
 * @typedef {BaseProviderConfig} GeminiConfig
 * @property {string}  apiKey
 * @property {string}  [projectId]    — para Vertex AI
 * @property {string}  [location]     — para Vertex AI (e.g. "us-central1")
 */

/**
 * @typedef {BaseProviderConfig} LocalConfig
 * @property {string}  baseUrl        — URL del servidor local (e.g. "http://localhost:11434")
 * @property {"ollama"|"lm-studio"|"llamacpp"|"custom"} [backend]
 */

/**
 * @typedef {OpenAIConfig | ClaudeConfig | GeminiConfig | LocalConfig} ProviderConfig
 */
