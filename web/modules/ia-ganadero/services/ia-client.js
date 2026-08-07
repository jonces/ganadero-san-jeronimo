/**
 * Contrato que todo provider de IA debe implementar.
 *
 * Para agregar un nuevo provider (Claude, OpenAI, Gemini…):
 *   1. Crear web/modules/ia-ganadero/services/providers/<nombre>.js
 *   2. Extender IAClient e implementar los métodos abstractos
 *   3. Registrar el provider en services/providers/index.js
 *   4. Agregar su PROVIDER_ID en constants/index.js
 *
 * La interfaz de usuario nunca importa un provider directamente;
 * siempre usa el hook useProvider() que devuelve la instancia activa.
 */
export class IAClient {
  /** @param {import('../types').ProviderConfig} config */
  constructor(config) {
    if (new.target === IAClient) {
      throw new Error("IAClient es abstracta. Usa un provider concreto.");
    }
    this.config = config;
  }

  /**
   * Inicializa el provider (valida credenciales, conecta WebSocket, etc.).
   * Se llama una vez al seleccionar el provider.
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error("initialize() no implementado");
  }

  /**
   * Envía un mensaje y devuelve la respuesta completa.
   * @param {import('../types').SendMessagePayload} payload
   * @returns {Promise<string>} Texto de respuesta
   */
  async sendMessage(payload) {
    throw new Error("sendMessage() no implementado");
  }

  /**
   * Envía un mensaje y emite la respuesta token por token.
   * Llamar solo si config.capabilities.streaming === true.
   * @param {import('../types').SendMessagePayload} payload
   * @param {(chunk: string) => void} onChunk  - Callback por cada fragmento
   * @param {() => void}              onDone   - Callback al terminar
   * @param {(err: Error) => void}    onError  - Callback de error
   * @returns {() => void} Función para cancelar el stream
   */
  streamMessage(payload, onChunk, onDone, onError) {
    throw new Error("streamMessage() no implementado");
  }

  /**
   * Cancela cualquier request en curso.
   * @returns {void}
   */
  abort() {}

  /**
   * Libera recursos (cierra conexiones, limpia timers).
   * Se llama al desmontar el contexto o cambiar de provider.
   * @returns {void}
   */
  destroy() {}
}
