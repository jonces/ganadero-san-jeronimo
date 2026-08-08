/**
 * Provider que conecta el Centro IA al AI Core (FASE 11.5).
 * Llama a /api/ai/chat via SSE — mismo contrato que los otros providers.
 * No lee process.env directamente (es client-side); delega al servidor.
 */
import { IAClient }    from "../ia-client.js";
import { PROVIDER_ID } from "../../constants/index.js";

export const OPENAI_CORE_CONFIG = {
  id:          PROVIDER_ID.OPENAI,
  name:        "IA Ganadera (GPT-4o)",
  icon:        "🤖",
  description: "Inteligencia artificial real conectada a OpenAI GPT-4o con datos de tu finca.",
  available:   true,
  capabilities: {
    streaming:  true,
    vision:     false,
    documents:  false,
    audio:      false,
    maxTokens:  4096,
  },
};

export class OpenAICoreProvider extends IAClient {
  constructor() {
    super(OPENAI_CORE_CONFIG);
    this._abortController = null;
    this._available       = false;
  }

  async initialize() {
    // Nunca lanza — el stream maneja los errores de API key
    try {
      const res  = await fetch("/api/ai/context");
      const data = await res.json();
      this._available = data.hasAI === true;
    } catch {
      this._available = true; // asumir disponible; el stream reportará el error real
    }
  }

  // Convierte mensajes del formato interno {sender, text} al formato OpenAI {role, content}
  #buildHistory(history) {
    return (history ?? [])
      .filter(m => m.text && m.sender !== "system")
      .slice(-20)
      .map(m => ({
        role:    m.sender === "user" ? "user" : "assistant",
        content: m.text ?? "",
      }));
  }

  streamMessage(payload, onChunk, onDone, onError) {
    const { text, history, specialistId } = payload;

    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    // Ejecutar async en background
    (async () => {
      try {
        const token   = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers,
          signal,
          body: JSON.stringify({
            message:   text,
            history:   this.#buildHistory(history),
            agentId:   specialistId ?? "orquestador",
            userCtx:   {},
          }),
        });

        if (!res.ok) {
          let detail = res.status;
          try { const d = await res.json(); detail = d.error ?? d.message ?? res.status; } catch {}
          onError(new Error(`Error del servidor: ${detail}`));
          return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   buffer  = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let chunk;
            try { chunk = JSON.parse(line.slice(6)); } catch { continue; }

            if (chunk.type === "delta" && chunk.content) {
              onChunk(chunk.content);
            }

            if (chunk.type === "error") {
              onError(new Error(chunk.message ?? "Error IA"));
              return;
            }

            if (chunk.type === "done") {
              onDone();
              return;
            }
          }
        }

        onDone();
      } catch (e) {
        if (e.name !== "AbortError") onError(e);
      }
    })();

    // Retorna función de cancelación
    return () => this._abortController?.abort();
  }

  async sendMessage(payload) {
    return new Promise((resolve, reject) => {
      let full = "";
      this.streamMessage(
        payload,
        (chunk) => { full += chunk; },
        ()      => resolve(full),
        (err)   => reject(err),
      );
    });
  }

  abort() {
    this._abortController?.abort();
  }

  destroy() {
    this.abort();
  }
}
