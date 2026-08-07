import { AIProvider }       from "./base-provider.js";
import { PROVIDER_ID, DEFAULT_MODELS } from "../constants/providers.js";

/**
 * Proveedor de modelos locales — stub sin conexión real.
 *
 * Soporta backends compatibles con la API de Ollama o OpenAI-compatible
 * (Ollama, LM Studio, llama.cpp server, Jan, GPT4All, etc.).
 *
 * @example
 *   const provider = new LocalProvider({ baseUrl: "http://localhost:11434", backend: "ollama" });
 *   engine.setProvider(provider);
 */
export class LocalProvider extends AIProvider {
  /** @param {import('../types/config').LocalConfig} config */
  constructor(config = {}) {
    super(
      PROVIDER_ID.LOCAL,
      "Modelo Local",
      {
        baseUrl: "http://localhost:11434",
        backend: "ollama",
        model:   DEFAULT_MODELS[PROVIDER_ID.LOCAL],
        ...config,
      },
    );
  }

  isAvailable() {
    return Boolean(this.config.baseUrl);
  }

  /** @returns {Promise<import('../types/message').ChatCompletion>} */
  async chat(messages, options) {
    this._assertConfigured();
    const opts = this._mergeOptions(options);
    // TODO: según backend, usar endpoint diferente:
    //   Ollama:    POST {baseUrl}/api/chat  — body: { model, messages, stream: false }
    //   LM Studio: POST {baseUrl}/v1/chat/completions  (compatible OpenAI)
    //   llama.cpp: POST {baseUrl}/v1/chat/completions  (compatible OpenAI)
    void messages; void opts;
    throw new Error("LocalProvider.chat() — pendiente de implementación");
  }

  async *stream(messages, options) {
    this._assertConfigured();
    const opts = this._mergeOptions(options);
    // TODO: Ollama stream: POST /api/chat con stream: true, leer NDJSON
    //       LM Studio / llama.cpp: SSE estándar OpenAI-compatible
    void messages; void opts;
    throw new Error("LocalProvider.stream() — pendiente de implementación");
  }

  async embed(text, model) {
    this._assertConfigured();
    // TODO: Ollama: POST {baseUrl}/api/embeddings — body: { model, prompt: text }
    //       LM Studio: POST {baseUrl}/v1/embeddings
    void text; void model;
    throw new Error("LocalProvider.embed() — pendiente de implementación");
  }

  async getModels() {
    this._assertConfigured();
    // TODO: Ollama: GET {baseUrl}/api/tags
    //       LM Studio: GET {baseUrl}/v1/models
    throw new Error("LocalProvider.getModels() — pendiente de implementación");
  }
}
