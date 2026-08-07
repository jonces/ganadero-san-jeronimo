/**
 * @typedef {Object} Attachment
 * @property {string}  id        - UUID único
 * @property {string}  type      - ATTACHMENT_TYPE (image | document | audio)
 * @property {string}  name      - Nombre original del archivo
 * @property {number}  size      - Tamaño en bytes
 * @property {string}  mimeType  - MIME type
 * @property {string}  [url]     - URL de previsualización (si es imagen)
 * @property {File}    [file]    - Objeto File original (antes de subir)
 */

/**
 * @typedef {Object} Message
 * @property {string}     id          - UUID único
 * @property {string}     sender      - SENDER (user | ai | system)
 * @property {string}     text        - Contenido de texto
 * @property {string}     status      - MESSAGE_STATUS
 * @property {number}     timestamp   - Date.now()
 * @property {Attachment[]} [attachments] - Archivos adjuntos
 * @property {string}     [providerId]    - Qué provider generó esta respuesta
 * @property {Object}     [meta]          - Metadatos libres del provider
 */

/**
 * @typedef {Object} Conversation
 * @property {string}   id          - UUID único
 * @property {string}   title       - Título corto (primeras palabras del usuario)
 * @property {Message[]} messages   - Mensajes de la conversación
 * @property {string}   createdAt   - ISO string
 * @property {string}   updatedAt   - ISO string
 * @property {string}   [providerId] - Provider usado en esta conversación
 */

/**
 * @typedef {Object} ProviderCapabilities
 * @property {boolean} streaming    - Soporta respuestas en tiempo real
 * @property {boolean} vision       - Soporta imágenes como entrada
 * @property {boolean} documents    - Soporta PDFs / texto como entrada
 * @property {boolean} audio        - Soporta audio como entrada
 * @property {number}  maxTokens    - Límite de tokens por respuesta
 */

/**
 * @typedef {Object} ProviderConfig
 * @property {string}               id           - PROVIDER_ID
 * @property {string}               name         - Nombre para mostrar ("Claude 3.5", "GPT-4o"…)
 * @property {string}               icon         - Emoji o URL de logo
 * @property {string}               description  - Descripción corta
 * @property {boolean}              available    - Si está habilitado en este entorno
 * @property {ProviderCapabilities} capabilities - Qué soporta este provider
 */

/**
 * @typedef {Object} SendMessagePayload
 * @property {string}     conversationId - Conversación destino
 * @property {string}     text           - Texto del usuario
 * @property {Attachment[]} [attachments] - Adjuntos opcionales
 * @property {Message[]}  [history]      - Historial previo para contexto
 */

/**
 * @typedef {Object} IAState
 * @property {Conversation[]} conversations    - Todas las conversaciones
 * @property {string|null}    activeId         - ID de la conversación activa
 * @property {string}         status           - CONVERSATION_STATUS
 * @property {string|null}    error            - Mensaje de error o null
 * @property {string}         providerId       - Provider activo (PROVIDER_ID)
 * @property {Attachment[]}   pendingAttachments - Adjuntos del input actual
 * @property {string}         inputText        - Texto actual del input
 */
