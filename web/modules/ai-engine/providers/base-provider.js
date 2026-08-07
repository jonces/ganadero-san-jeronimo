import { NotImplementedError, NotConfiguredError } from "../errors/ai-error.js";
import { DEFAULT_CHAT_OPTIONS }                    from "../constants/providers.js";

/**
 * Clase base abstracta para todos los proveedores de IA.
 *
 * Contrato que debe respetar cualquier implementación:
 *  - chat()      → ChatCompletion
 *  - stream()    → AsyncGenerator<StreamChunk>
 *  - embed()     → EmbeddingResult
 *  - getModels() → ModelInfo[]
 *  - isAvailable() → boolean  (solo verifica configuración local, sin red)
 *
 * Los métodos lanzan NotImplementedError por defecto; subclases los sobreescriben.
 */
export class AIProvider {
  /**
   * @param {string}        id        — identificador único (PROVIDER_ID)
   * @param {string}        name      — nombre legible
   * @param {import('../types/config').ProviderConfig} config
   */
  constructor(id, name, config = {}) {
    if (new.target === AIProvider) {
      throw new TypeError("AIProvider es abstracta; instancia una subclase concreta");
    }
    this.id     = id;
    this.name   = name;
    this.config = config;
    this._defaultOptions = { ...DEFAULT_CHAT_OPTIONS };
  }

  // ── Métodos que DEBEN sobreescribir las subclases ─────────────────────────

  /**
   * Genera una respuesta completa (no streaming).
   * @param {import('../types/message').Message[]}  messages
   * @param {import('../types/message').ChatOptions} [options]
   * @returns {Promise<import('../types/message').ChatCompletion>}
   */
  async chat(messages, options) {                     // eslint-disable-line no-unused-vars
    throw new NotImplementedError("chat", this.name);
  }

  /**
   * Genera una respuesta en modo streaming.
   * @param {import('../types/message').Message[]}  messages
   * @param {import('../types/message').ChatOptions} [options]
   * @returns {AsyncGenerator<import('../types/message').StreamChunk>}
   */
  async *stream(messages, options) {                  // eslint-disable-line no-unused-vars
    throw new NotImplementedError("stream", this.name);
  }

  /**
   * Genera embeddings para un texto.
   * @param {string}  text
   * @param {string}  [model]
   * @returns {Promise<import('../types/message').EmbeddingResult>}
   */
  async embed(text, model) {                          // eslint-disable-line no-unused-vars
    throw new NotImplementedError("embed", this.name);
  }

  /**
   * Lista los modelos disponibles en este proveedor.
   * @returns {Promise<import('../types/message').ModelInfo[]>}
   */
  async getModels() {
    throw new NotImplementedError("getModels", this.name);
  }

  // ── Métodos que PUEDEN sobreescribir las subclases ────────────────────────

  /**
   * Verifica si el proveedor está configurado (sin red).
   * @returns {boolean}
   */
  isAvailable() {
    return false;
  }

  /**
   * Valida la configuración y lanza NotConfiguredError si falta algo crítico.
   * Llamar al inicio de chat() / stream().
   */
  _assertConfigured() {
    if (!this.isAvailable()) {
      throw new NotConfiguredError(this.name);
    }
  }

  /**
   * Combina las opciones por defecto con las del llamador.
   * @param {import('../types/message').ChatOptions} [options]
   * @returns {import('../types/message').ChatOptions}
   */
  _mergeOptions(options) {
    return {
      model: this.config.model,
      ...this._defaultOptions,
      ...options,
    };
  }

  /** Serialización simple para logs/debug. */
  toJSON() {
    return { id: this.id, name: this.name, available: this.isAvailable() };
  }
}
