import { AIProvider }       from "./base-provider.js";
import { PROVIDER_ID, DEFAULT_MODELS } from "../constants/providers.js";

/**
 * Proveedor Anthropic Claude — stub sin conexión real.
 *
 * Cuando se conecte: instanciar @anthropic-ai/sdk, implementar chat() / stream().
 * Claude no soporta embeddings nativos (usar OpenAI o Gemini para eso).
 *
 * @example
 *   const provider = new ClaudeProvider({ apiKey: process.env.ANTHROPIC_API_KEY });
 *   engine.setProvider(provider);
 */
export class ClaudeProvider extends AIProvider {
  /** @param {import('../types/config').ClaudeConfig} config */
  constructor(config = {}) {
    super(
      PROVIDER_ID.CLAUDE,
      "Claude",
      {
        model: DEFAULT_MODELS[PROVIDER_ID.CLAUDE],
        anthropicVersion: "2023-06-01",
        ...config,
      },
    );
  }

  isAvailable() {
    return Boolean(this.config.apiKey);
  }

  /** @returns {Promise<import('../types/message').ChatCompletion>} */
  async chat(messages, options) {
    this._assertConfigured();
    const opts = this._mergeOptions(options);
    // TODO: implementar con @anthropic-ai/sdk
    // const client = new Anthropic({ apiKey: this.config.apiKey });
    // Anthropic separa el system message de los demás:
    //   const system  = messages.find(m => m.role === "system")?.content;
    //   const history = messages.filter(m => m.role !== "system");
    //   const res = await client.messages.create({ model: opts.model, max_tokens: opts.maxTokens, system, messages: history });
    void messages; void opts;
    throw new Error("ClaudeProvider.chat() — pendiente de implementación");
  }

  async *stream(messages, options) {
    this._assertConfigured();
    const opts = this._mergeOptions(options);
    // TODO: client.messages.stream({ ..., stream: true }) con SSE
    void messages; void opts;
    throw new Error("ClaudeProvider.stream() — pendiente de implementación");
  }

  async embed(text, model) {
    // Claude no tiene API de embeddings; delegar a otro proveedor
    void text; void model;
    throw new Error("ClaudeProvider no soporta embeddings — usa OpenAIProvider o GeminiProvider");
  }

  async getModels() {
    // Lista estática; Claude no expone endpoint de modelos en v1
    return [
      { id: "claude-opus-5",             name: "Claude Opus 5",        contextWindow: 200_000, supportsVision: true,  supportsTools: true },
      { id: "claude-sonnet-5",           name: "Claude Sonnet 5",      contextWindow: 200_000, supportsVision: true,  supportsTools: true },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5",     contextWindow: 200_000, supportsVision: true,  supportsTools: true },
    ];
  }
}
