/**
 * Abstract base for all AI providers.
 * Every adapter must extend this and implement the methods below.
 */
export class BaseProvider {
  constructor(config) {
    this.id     = config.id;
    this.label  = config.label;
    this.config = config;
  }

  /** @returns {boolean} true if the provider has a valid API key configured */
  isAvailable() { throw new Error("Not implemented"); }

  /**
   * Streaming chat completion.
   * Yields SSE-compatible chunks: { type: "delta"|"tool_call"|"done"|"error", ... }
   * @param {object} opts
   * @param {string} opts.model
   * @param {Array}  opts.messages
   * @param {Array}  opts.tools
   * @param {number} opts.temperature
   * @param {AbortSignal} opts.signal
   * @returns {AsyncGenerator}
   */
  // eslint-disable-next-line require-yield
  async *stream(opts) { throw new Error("Not implemented"); }

  /**
   * Non-streaming completion (for summaries, embeddings, etc.)
   */
  async complete(opts) { throw new Error("Not implemented"); }

  /**
   * Generate image.
   * @returns {{ url: string, revised_prompt: string }}
   */
  async generateImage(opts) { throw new Error("Not implemented: images"); }

  /**
   * Generate embedding vector for a text.
   * @returns {number[]}
   */
  async embed(text) { throw new Error("Not implemented: embeddings"); }
}
