import { AIProvider } from "../providers/base-provider.js";
import { AIError, AIErrorCode } from "../errors/ai-error.js";

/**
 * Registro de proveedores disponibles.
 * Permite registrar, listar y obtener proveedores por id.
 */
export class ProviderRegistry {
  constructor() {
    /** @type {Map<string, AIProvider>} */
    this._providers = new Map();
  }

  /**
   * Registra un proveedor. Si ya existe uno con el mismo id, lo reemplaza.
   * @param {AIProvider} provider
   */
  register(provider) {
    if (!(provider instanceof AIProvider)) {
      throw new TypeError("Solo se pueden registrar instancias de AIProvider");
    }
    this._providers.set(provider.id, provider);
    return this;
  }

  /**
   * @param {string} id
   * @returns {AIProvider}
   */
  get(id) {
    const provider = this._providers.get(id);
    if (!provider) {
      throw new AIError(
        `Proveedor "${id}" no está registrado`,
        AIErrorCode.MODEL_NOT_FOUND,
      );
    }
    return provider;
  }

  /** @returns {AIProvider[]} */
  list() {
    return Array.from(this._providers.values());
  }

  /** @returns {AIProvider[]} */
  listAvailable() {
    return this.list().filter(p => p.isAvailable());
  }

  /** @param {string} id */
  has(id) {
    return this._providers.has(id);
  }

  /** @param {string} id */
  unregister(id) {
    this._providers.delete(id);
    return this;
  }
}
