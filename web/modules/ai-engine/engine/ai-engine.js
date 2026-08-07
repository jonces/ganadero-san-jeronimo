import { ProviderRegistry }  from "./provider-registry.js";
import { AIProvider }        from "../providers/base-provider.js";
import { AIError, AIErrorCode, NotConfiguredError } from "../errors/ai-error.js";
import { OpenAIProvider }    from "../providers/openai-provider.js";
import { ClaudeProvider }    from "../providers/claude-provider.js";
import { GeminiProvider }    from "../providers/gemini-provider.js";
import { LocalProvider }     from "../providers/local-provider.js";
import { PROVIDER_ID }       from "../constants/providers.js";

/**
 * Motor principal de IA.
 *
 * Gestiona el proveedor activo y delega todas las llamadas a él.
 * Cambiar de proveedor en runtime = una línea: engine.setProvider(id)
 *
 * @example
 *   const engine = AIEngine.create();
 *   engine.configure(PROVIDER_ID.OPENAI, { apiKey: "sk-..." });
 *   engine.use(PROVIDER_ID.OPENAI);
 *   const reply = await engine.chat([{ role: "user", content: "Hola" }]);
 */
export class AIEngine {
  constructor() {
    this._registry  = new ProviderRegistry();
    /** @type {AIProvider | null} */
    this._active    = null;
    this._listeners = new Set();
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  /**
   * Crea un engine con los 4 proveedores pre-registrados (sin credenciales).
   * @returns {AIEngine}
   */
  static create() {
    const engine = new AIEngine();
    engine._registry
      .register(new OpenAIProvider())
      .register(new ClaudeProvider())
      .register(new GeminiProvider())
      .register(new LocalProvider());
    return engine;
  }

  // ── Configuración ──────────────────────────────────────────────────────────

  /**
   * Actualiza la configuración de un proveedor registrado (credenciales, modelo, etc.).
   * @param {string} providerId
   * @param {import('../types/config').ProviderConfig} config
   */
  configure(providerId, config) {
    const provider = this._registry.get(providerId);
    provider.config = { ...provider.config, ...config };
    return this;
  }

  /**
   * Activa un proveedor por id.
   * @param {string} providerId
   */
  use(providerId) {
    const provider = this._registry.get(providerId);
    this._active = provider;
    this._emit("providerChanged", provider);
    return this;
  }

  /**
   * Registra un proveedor personalizado y lo activa opcionalmente.
   * @param {AIProvider} provider
   * @param {boolean}    [activate=false]
   */
  register(provider, activate = false) {
    this._registry.register(provider);
    if (activate) this.use(provider.id);
    return this;
  }

  // ── Delegación de llamadas ─────────────────────────────────────────────────

  /**
   * @returns {AIProvider}
   */
  get activeProvider() {
    if (!this._active) {
      throw new NotConfiguredError("ningún proveedor activo — llama engine.use(PROVIDER_ID.XXX)");
    }
    return this._active;
  }

  /**
   * Chat sin streaming.
   * @param {import('../types/message').Message[]}   messages
   * @param {import('../types/message').ChatOptions} [options]
   * @returns {Promise<import('../types/message').ChatCompletion>}
   */
  chat(messages, options) {
    return this.activeProvider.chat(messages, options);
  }

  /**
   * Chat con streaming.
   * @param {import('../types/message').Message[]}   messages
   * @param {import('../types/message').ChatOptions} [options]
   * @returns {AsyncGenerator<import('../types/message').StreamChunk>}
   */
  stream(messages, options) {
    return this.activeProvider.stream(messages, options);
  }

  /**
   * Embeddings.
   * @param {string}  text
   * @param {string}  [model]
   * @returns {Promise<import('../types/message').EmbeddingResult>}
   */
  embed(text, model) {
    return this.activeProvider.embed(text, model);
  }

  /**
   * Lista modelos del proveedor activo.
   * @returns {Promise<import('../types/message').ModelInfo[]>}
   */
  getModels() {
    return this.activeProvider.getModels();
  }

  // ── Introspección ──────────────────────────────────────────────────────────

  /** @returns {import('../providers/base-provider').AIProvider[]} */
  listProviders() {
    return this._registry.list();
  }

  /** @returns {import('../providers/base-provider').AIProvider[]} */
  listAvailableProviders() {
    return this._registry.listAvailable();
  }

  /** @returns {{ id: string, name: string, active: boolean, available: boolean }[]} */
  status() {
    return this._registry.list().map(p => ({
      id:        p.id,
      name:      p.name,
      active:    this._active?.id === p.id,
      available: p.isAvailable(),
    }));
  }

  // ── Eventos ────────────────────────────────────────────────────────────────

  /**
   * Suscribe a cambios de proveedor activo.
   * @param {(provider: AIProvider) => void} fn
   * @returns {() => void} — función para desuscribirse
   */
  onProviderChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /** @private */
  _emit(event, payload) {
    if (event === "providerChanged") {
      this._listeners.forEach(fn => fn(payload));
    }
  }
}
