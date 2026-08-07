import { IAClient }    from "../ia-client.js";
import { PROVIDER_ID } from "../../constants/index.js";
import { buildSystemPrompt, buildAnthropicMessages } from "../context-builder.js";
import { encodeAttachmentsForClaude }                from "../multimodal-encoder.js";

/** @type {import('../../types').ProviderConfig} */
export const CLAUDE_CONFIG = {
  id:          PROVIDER_ID.CLAUDE,
  name:        "Claude (Anthropic)",
  icon:        "🧠",
  description: "Claude de Anthropic — análisis profundo, visión, multimodal.",
  available:   true,
  capabilities: {
    streaming:  true,
    vision:     true,
    documents:  true,
    audio:      false,
    maxTokens:  4096,
  },
};

/**
 * Provider real para Anthropic Claude.
 * Las llamadas van a través de /api/ia/chat y /api/ia/stream para
 * mantener la API key en el servidor y nunca exponerla al cliente.
 */
export class ClaudeProvider extends IAClient {
  constructor(opts = {}) {
    super({ ...CLAUDE_CONFIG, ...opts });
    this._abort = null;
  }

  async initialize() {
    // Verifica que el servidor tenga la API key configurada
    try {
      const res = await fetch("/api/ia/status");
      const data = await res.json();
      if (!data.claude?.configured) {
        throw new Error("ANTHROPIC_API_KEY no configurada en el servidor. Contacta al administrador.");
      }
    } catch (err) {
      if (err.message.includes("ANTHROPIC_API_KEY")) throw err;
      // Si el endpoint falla por red, continuamos (se detectará al enviar)
    }
  }

  /**
   * Envía un mensaje y espera la respuesta completa.
   * @param {object} payload
   * @returns {Promise<string>}
   */
  async sendMessage(payload) {
    const { messages, context, text, attachments, specialistId } = payload;
    const system        = buildSystemPrompt({ context, specialistId });
    const userContent   = attachments?.length
      ? await encodeAttachmentsForClaude(attachments, text)
      : null;
    const anthropicMsgs = buildAnthropicMessages(messages ?? [], text, userContent);

    const res = await fetch("/api/ia/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ messages: anthropicMsgs, system }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Error ${res.status}`);
    }

    const data = await res.json();
    return data.text ?? "";
  }

  /**
   * Envía un mensaje y transmite la respuesta en tiempo real via SSE.
   * @param {object}   payload
   * @param {Function} onChunk  - (chunk: string) => void
   * @param {Function} onDone   - () => void
   * @param {Function} onError  - (err: Error) => void
   * @returns {Function} cancel — cancela el stream
   */
  streamMessage(payload, onChunk, onDone, onError) {
    const { messages, context, text, attachments, specialistId } = payload;

    let cancelled = false;
    const controller = new AbortController();
    this._abort = () => { cancelled = true; controller.abort(); };

    (async () => {
      try {
        const system        = buildSystemPrompt({ context, specialistId });
        const userContent   = attachments?.length
          ? await encodeAttachmentsForClaude(attachments, text)
          : null;
        const anthropicMsgs = buildAnthropicMessages(messages ?? [], text, userContent);

        const res = await fetch("/api/ia/stream", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ messages: anthropicMsgs, system }),
          signal:  controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Error ${res.status}`);
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (json === "[DONE]") { onDone(); return; }

            let evt;
            try { evt = JSON.parse(json); } catch { continue; }

            // Error embebido en stream
            if (evt.error) { onError(new Error(evt.error)); return; }

            // Anthropic SSE: content_block_delta
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              onChunk(evt.delta.text);
            }
            // Fin del mensaje
            if (evt.type === "message_stop") { onDone(); return; }
          }
        }

        if (!cancelled) onDone();
      } catch (err) {
        if (err.name === "AbortError" || cancelled) return;
        onError(err);
      }
    })();

    return () => this._abort?.();
  }

  abort() {
    this._abort?.();
  }

  destroy() {
    this.abort();
  }
}
