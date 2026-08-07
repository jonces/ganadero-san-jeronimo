/**
 * @typedef {"system" | "user" | "assistant"} MessageRole
 */

/**
 * @typedef {Object} Message
 * @property {MessageRole}  role
 * @property {string}       content
 * @property {string}       [name]          — nombre del remitente (opcional)
 */

/**
 * @typedef {Object} ChatOptions
 * @property {string}   [model]             — modelo específico a usar
 * @property {number}   [temperature]       — 0.0–2.0
 * @property {number}   [maxTokens]         — límite de tokens en la respuesta
 * @property {number}   [topP]
 * @property {string[]} [stop]              — secuencias de parada
 * @property {boolean}  [stream]            — si true, usa streaming
 * @property {Object}   [extra]             — parámetros específicos del proveedor
 */

/**
 * @typedef {Object} Usage
 * @property {number} promptTokens
 * @property {number} completionTokens
 * @property {number} totalTokens
 */

/**
 * @typedef {Object} ChatCompletion
 * @property {string}  id              — id único de la respuesta
 * @property {string}  content         — texto generado
 * @property {string}  model           — modelo usado
 * @property {string}  provider        — id del proveedor
 * @property {Usage}   [usage]
 * @property {string}  [finishReason]  — "stop" | "length" | "content_filter"
 */

/**
 * @typedef {Object} StreamChunk
 * @property {string}   delta           — fragmento de texto nuevo
 * @property {boolean}  done            — true en el último chunk
 * @property {string}   [finishReason]
 * @property {Usage}    [usage]         — solo en el último chunk (si el proveedor lo soporta)
 */

/**
 * @typedef {Object} EmbeddingResult
 * @property {number[]}  vector         — vector de embeddings
 * @property {string}    model
 * @property {string}    provider
 * @property {number}    [tokens]
 */

/**
 * @typedef {Object} ModelInfo
 * @property {string}   id
 * @property {string}   name
 * @property {number}   [contextWindow]
 * @property {boolean}  [supportsVision]
 * @property {boolean}  [supportsTools]
 * @property {boolean}  [supportsEmbedding]
 */
