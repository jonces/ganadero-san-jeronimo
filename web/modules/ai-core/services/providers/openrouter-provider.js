import { BaseProvider } from "./base-provider.js";

export class OpenRouterProvider extends BaseProvider {
  constructor() { super({ id: "openrouter", label: "OpenRouter" }); }

  isAvailable() { return !!process.env.OPENROUTER_API_KEY; }

  #headers() {
    return {
      "Content-Type":    "application/json",
      "Authorization":   `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer":    "https://ganaderosg.app",
      "X-Title":         "GanaderoSG",
    };
  }

  // OpenRouter uses OpenAI-compatible endpoint
  async *stream({ model, messages, tools = [], temperature = 0.7, signal }) {
    const body = { model, messages, stream: true, temperature, max_tokens: 4096, ...(tools.length ? { tools, tool_choice: "auto" } : {}) };
    const res  = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: this.#headers(), body: JSON.stringify(body), signal,
    });
    if (!res.ok) { yield { type: "error", message: `OpenRouter error: ${res.statusText}` }; return; }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") { yield { type: "done" }; return; }
        let chunk; try { chunk = JSON.parse(raw); } catch { continue; }
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) yield { type: "delta", content: delta.content };
        const fin = chunk.choices?.[0]?.finish_reason;
        if (fin === "stop" || fin === "end_turn") { yield { type: "done" }; return; }
      }
    }
    yield { type: "done" };
  }

  async complete({ model, messages, temperature = 0.3 }) {
    const res  = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: this.#headers(), body: JSON.stringify({ model, messages, temperature }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async generateImage() { throw new Error("Use OpenAI DALL-E for images."); }
  async embed() { throw new Error("OpenRouter does not provide embeddings directly."); }
}
