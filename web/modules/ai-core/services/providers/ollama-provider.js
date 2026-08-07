import { BaseProvider } from "./base-provider.js";

export class OllamaProvider extends BaseProvider {
  constructor() { super({ id: "ollama", label: "Ollama (local)" }); }

  #base() { return process.env.OLLAMA_URL ?? "http://localhost:11434"; }

  isAvailable() { return !!process.env.OLLAMA_URL || process.env.OLLAMA_ENABLED === "true"; }

  async *stream({ model, messages, temperature = 0.7, signal }) {
    const res = await fetch(`${this.#base()}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ model, messages, stream: true, options: { temperature } }),
      signal,
    });
    if (!res.ok) { yield { type: "error", message: `Ollama error: ${res.statusText}` }; return; }

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
        if (!line.trim()) continue;
        let chunk;
        try { chunk = JSON.parse(line); } catch { continue; }
        if (chunk.message?.content) yield { type: "delta", content: chunk.message.content };
        if (chunk.done) { yield { type: "done" }; return; }
      }
    }
    yield { type: "done" };
  }

  async complete({ model, messages }) {
    const res  = await fetch(`${this.#base()}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false }),
    });
    const data = await res.json();
    return data.message?.content ?? "";
  }

  async generateImage() { throw new Error("Ollama does not support image generation."); }
  async embed(text) {
    const res  = await fetch(`${this.#base()}/api/embeddings`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
    });
    const data = await res.json();
    return data.embedding ?? [];
  }
}
