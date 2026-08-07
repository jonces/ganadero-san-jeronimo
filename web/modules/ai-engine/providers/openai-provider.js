import { AIProvider }       from "./base-provider.js";
import { PROVIDER_ID, DEFAULT_MODELS } from "../constants/providers.js";

/**
 * Proveedor OpenAI — stub sin conexión real.
 *
 * Cuando se conecte: instanciar openai SDK, implementar chat() / stream() / embed().
 *
 * @example
 *   const provider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
 *   engine.setProvider(provider);
 */
export class OpenAIProvider extends AIProvider {
  /** @param {import('../types/config').OpenAIConfig} config */
  constructor(config = {}) {
    super(
      PROVIDER_ID.OPENAI,
      "OpenAI",
      { model: DEFAULT_MODELS[PROVIDER_ID.OPENAI], ...config },
    );
  }

  isAvailable() {
    return Boolean(this.config.apiKey);
  }

  /** @returns {Promise<import('../types/message').ChatCompletion>} */
  async chat(messages, options) {
    this._assertConfigured();
    const opts = this._mergeOptions(options);
    // TODO: implementar con openai SDK
    // const openai = new OpenAI({ apiKey: this.config.apiKey, baseURL: this.config.baseUrl });
    // const res = await openai.chat.completions.create({ model: opts.model, messages, ... });
    void messages; void opts;
    throw new Error("OpenAIProvider.chat() — pendiente de implementación");
  }

  async *stream(messages, options) {
    this._assertConfigured();
    const opts = this._mergeOptions(options);
    // TODO: stream con openai SDK (stream: true)
    void messages; void opts;
    throw new Error("OpenAIProvider.stream() — pendiente de implementación");
  }

  async embed(text, model) {
    this._assertConfigured();
    // TODO: openai.embeddings.create({ model: model ?? "text-embedding-3-small", input: text })
    void text; void model;
    throw new Error("OpenAIProvider.embed() — pendiente de implementación");
  }

  async getModels() {
    this._assertConfigured();
    // TODO: openai.models.list()
    // Lista estática para referencia hasta conectar la API
    return [
      { id: "gpt-4o",           name: "GPT-4o",            contextWindow: 128_000, supportsVision: true,  supportsTools: true },
      { id: "gpt-4o-mini",      name: "GPT-4o mini",       contextWindow: 128_000, supportsVision: true,  supportsTools: true },
      { id: "gpt-4-turbo",      name: "GPT-4 Turbo",       contextWindow: 128_000, supportsVision: true,  supportsTools: true },
      { id: "gpt-3.5-turbo",    name: "GPT-3.5 Turbo",     contextWindow: 16_385,  supportsVision: false, supportsTools: true },
      { id: "text-embedding-3-small", name: "Embedding 3 Small", supportsEmbedding: true },
      { id: "text-embedding-3-large", name: "Embedding 3 Large", supportsEmbedding: true },
    ];
  }
}
