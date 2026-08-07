import { BaseProvider } from "./base-provider.js";

const BASE = "https://api.anthropic.com/v1";

export class ClaudeProvider extends BaseProvider {
  constructor() {
    super({ id: "claude", label: "Anthropic Claude" });
  }

  isAvailable() { return !!process.env.ANTHROPIC_API_KEY; }

  #headers() {
    return {
      "Content-Type":      "application/json",
      "x-api-key":         process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    };
  }

  async *stream({ model, messages, tools = [], temperature = 0.7, signal }) {
    // Separate system message from conversation
    const system   = messages.find(m => m.role === "system")?.content ?? "";
    const convo    = messages.filter(m => m.role !== "system");

    const body = {
      model,
      system,
      messages:   convo,
      max_tokens: 4096,
      temperature,
      stream:     true,
    };
    if (tools.length) {
      body.tools = tools.map(t => ({
        name:         t.function.name,
        description:  t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    const res = await fetch(`${BASE}/messages`, {
      method: "POST", headers: this.#headers(), body: JSON.stringify(body), signal,
    });
    if (!res.ok) {
      yield { type: "error", message: `Claude error: ${res.statusText}` };
      return;
    }

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
        let event;
        try { event = JSON.parse(line.slice(6)); } catch { continue; }

        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          yield { type: "delta", content: event.delta.text };
        }
        if (event.type === "message_stop") {
          yield { type: "done" };
          return;
        }
      }
    }
    yield { type: "done" };
  }

  async complete({ model, messages, temperature = 0.3 }) {
    const system = messages.find(m => m.role === "system")?.content ?? "";
    const convo  = messages.filter(m => m.role !== "system");
    const res    = await fetch(`${BASE}/messages`, {
      method:  "POST",
      headers: this.#headers(),
      body:    JSON.stringify({ model, system, messages: convo, max_tokens: 2048, temperature }),
    });
    if (!res.ok) throw new Error(`Claude error: ${res.statusText}`);
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  }

  async generateImage() {
    throw new Error("Claude does not support image generation. Use OpenAI DALL-E.");
  }

  async embed() {
    throw new Error("Claude does not provide embeddings. Use OpenAI text-embedding-3-small.");
  }
}
