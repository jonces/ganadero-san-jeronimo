/**
 * Clase abstracta base para resolver el contexto de una conversación.
 *
 * Implementa esta interfaz para cada fuente de datos:
 *   - MockResolver     → datos hardcodeados (desarrollo/demo)
 *   - ApiResolver      → llama al backend REST de GanaderoSG
 *   - LocalResolver    → lee del localStorage / estado global de la app
 *
 * Nunca importes un resolver concreto directamente desde la UI.
 * Usa siempre createContextResolver() desde context-resolvers/index.js.
 */
export class ContextResolver {
  /** @type {string} Identificador del resolver */
  id = "base";

  /**
   * Inicializa el resolver (autenticación, caché, etc.).
   * Se llama una sola vez al montar el ConversationContextProvider.
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error(`${this.constructor.name}.initialize() no implementado`);
  }

  /**
   * Resuelve la finca activa para el usuario.
   * @returns {Promise<import('../types/conversation-context').FincaContext>}
   */
  async resolveFinca() {
    throw new Error(`${this.constructor.name}.resolveFinca() no implementado`);
  }

  /**
   * Resuelve la empresa propietaria de la finca activa.
   * @returns {Promise<import('../types/conversation-context').EmpresaContext>}
   */
  async resolveEmpresa() {
    throw new Error(`${this.constructor.name}.resolveEmpresa() no implementado`);
  }

  /**
   * Resuelve el usuario autenticado y sus roles en la finca activa.
   * @returns {Promise<import('../types/conversation-context').UsuarioContext>}
   */
  async resolveUsuario() {
    throw new Error(`${this.constructor.name}.resolveUsuario() no implementado`);
  }

  /**
   * Resuelve la localización (idioma, moneda, zona horaria).
   * Puede derivarse del usuario, la empresa o el navegador.
   * @returns {Promise<import('../types/conversation-context').LocalizacionContext>}
   */
  async resolveLocalizacion() {
    throw new Error(`${this.constructor.name}.resolveLocalizacion() no implementado`);
  }

  /**
   * Construye el ConversationContext completo.
   * Llama a los cuatro métodos resolve* en paralelo.
   * No necesita override en subclases — sobreescribe los métodos individuales.
   * @returns {Promise<import('../types/conversation-context').ConversationContext>}
   */
  async resolve() {
    const [finca, empresa, usuario, localizacion] = await Promise.all([
      this.resolveFinca(),
      this.resolveEmpresa(),
      this.resolveUsuario(),
      this.resolveLocalizacion(),
    ]);

    return {
      version:     "1.0",
      resolvedAt:  new Date().toISOString(),
      finca,
      empresa,
      usuario,
      localizacion,
    };
  }

  /**
   * Cambia la finca activa y devuelve el contexto actualizado.
   * Útil cuando el usuario tiene acceso a múltiples fincas.
   * @param {string} fincaId
   * @returns {Promise<import('../types/conversation-context').ConversationContext>}
   */
  async switchFinca(fincaId) {
    throw new Error(`${this.constructor.name}.switchFinca() no implementado`);
  }

  /**
   * Libera recursos (timers, suscripciones, etc.).
   * Se llama al desmontar el ConversationContextProvider.
   */
  destroy() {}
}
