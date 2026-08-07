export const AIErrorCode = /** @type {const} */ ({
  NOT_IMPLEMENTED:    "NOT_IMPLEMENTED",
  NOT_CONFIGURED:     "NOT_CONFIGURED",
  PROVIDER_ERROR:     "PROVIDER_ERROR",
  AUTH_ERROR:         "AUTH_ERROR",
  RATE_LIMIT:         "RATE_LIMIT",
  CONTEXT_TOO_LONG:   "CONTEXT_TOO_LONG",
  CONTENT_FILTERED:   "CONTENT_FILTERED",
  NETWORK_ERROR:      "NETWORK_ERROR",
  TIMEOUT:            "TIMEOUT",
  MODEL_NOT_FOUND:    "MODEL_NOT_FOUND",
  UNSUPPORTED:        "UNSUPPORTED",
});

export class AIError extends Error {
  /**
   * @param {string}  message
   * @param {string}  code         — AIErrorCode
   * @param {string}  [provider]
   * @param {unknown} [cause]
   */
  constructor(message, code, provider, cause) {
    super(message);
    this.name    = "AIError";
    this.code    = code;
    this.provider = provider ?? null;
    this.cause   = cause ?? null;
  }
}

export class NotImplementedError extends AIError {
  /** @param {string} method  @param {string} providerName */
  constructor(method, providerName) {
    super(
      `${providerName}.${method}() no está implementado todavía`,
      AIErrorCode.NOT_IMPLEMENTED,
      providerName,
    );
    this.name = "NotImplementedError";
  }
}

export class NotConfiguredError extends AIError {
  /** @param {string} providerName */
  constructor(providerName) {
    super(
      `El proveedor "${providerName}" no está configurado (faltan credenciales o URL)`,
      AIErrorCode.NOT_CONFIGURED,
      providerName,
    );
    this.name = "NotConfiguredError";
  }
}
