import { AIProvider }       from "./base-provider.js";
import { PROVIDER_ID, DEFAULT_MODELS } from "../constants/providers.js";

/**
 * Proveedor Google Gemini — stub sin conexión real.
 *
 * Soporta chat, streaming y embeddings.
 * Puede conectar via AI Studio (apiKey) o Vertex AI (projectId + location).
 *
 * @example
 *   const provider = new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY });
 *   engine.setProvider(provider);
 */
export class GeminiProvider extends AIProvider {
  /** @param {import('../types/config').GeminiConfig} config */
  constructor(config = {}) {
    super(
      PROVIDER_ID.GEMINI,
      "Gemini",
      { model: DEFAULT_MODELS[PROVIDER_ID.GEMINI], ...config },
    );
  }

  isAvailable() {
    // Válido con API key (AI Studio) o con projectId (Vertex AI)
    return Boolean(this.config.apiKey || this.config.projectId);
  }

  /** @returns {Promise<import('../types/message').ChatCompletion>} */
  async chat(messages, options) {
    this._assertConfigured();
    const opts = this._mergeOptions(options);
    // TODO: implementar con @google/generative-ai
    // const genAI = new GoogleGenerativeAI(this.config.apiKey);
    // const model = genAI.getGenerativeModel({ model: opts.model });
    // Gemini usa "parts" en lugar de "content" string — se necesita adaptar el formato
    // const history = messages.slice(0, -1).map(adaptMessage);
    // const chat = model.startChat({ history });
    // const res = await chat.sendMessage(messages.at(-1).content);
    void messages; void opts;
    throw new Error("GeminiProvider.chat() — pendiente de implementación");
  }

  async *stream(messages, options) {
    this._assertConfigured();
    const opts = this._mergeOptions(options);
    // TODO: chat.sendMessageStream(...)
    void messages; void opts;
    throw new Error("GeminiProvider.stream() — pendiente de implementación");
  }

  async embed(text, model) {
    this._assertConfigured();
    // TODO: genAI.getGenerativeModel({ model: model ?? "text-embedding-004" }).embedContent(text)
    void text; void model;
    throw new Error("GeminiProvider.embed() — pendiente de implementación");
  }

  async getModels() {
    return [
      { id: "gemini-2.0-flash",         name: "Gemini 2.0 Flash",        contextWindow: 1_000_000, supportsVision: true,  supportsTools: true },
      { id: "gemini-2.0-flash-lite",    name: "Gemini 2.0 Flash Lite",   contextWindow: 1_000_000, supportsVision: true,  supportsTools: true },
      { id: "gemini-1.5-pro",           name: "Gemini 1.5 Pro",          contextWindow: 2_000_000, supportsVision: true,  supportsTools: true },
      { id: "gemini-1.5-flash",         name: "Gemini 1.5 Flash",        contextWindow: 1_000_000, supportsVision: true,  supportsTools: true },
      { id: "text-embedding-004",       name: "Text Embedding 004",       supportsEmbedding: true },
    ];
  }
}
