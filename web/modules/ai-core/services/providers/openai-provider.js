import { BaseProvider } from "./base-provider.js";

const BASE = "https://api.openai.com/v1";

export class OpenAIProvider extends BaseProvider {
  constructor() {
    super({ id: "openai", label: "OpenAI" });
  }

  #key() {
    return (process.env.OPENAI_API_KEY ?? "").replace(/\s+/g, "");
  }

  isAvailable() {
    const ok = this.#key().length > 10;
    console.log("[OpenAIProvider] isAvailable():", ok, "keyLen:", this.#key().length);
    return ok;
  }

  #headers() {
    return {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${this.#key()}`,
    };
  }

  async *stream({ model, messages, tools = [], temperature = 0.7, signal }) {
    const body = {
      model,
      messages,
      stream:      true,
      temperature,
      max_tokens:  4096,
    };
    if (tools.length) {
      body.tools       = tools;
      body.tool_choice = "auto";
    }

    console.log("[OpenAIProvider] stream() — model:", model, "— key prefix:", process.env.OPENAI_API_KEY?.slice(0, 10));

    const res = await fetch(`${BASE}/chat/completions`, {
      method:  "POST",
      headers: this.#headers(),
      body:    JSON.stringify(body),
      signal,
    });

    console.log("[OpenAIProvider] HTTP status:", res.status);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg = err.error?.message ?? JSON.stringify(err);
      console.error("[OpenAIProvider] ✗ Error OpenAI:", res.status, msg);
      yield { type: "error", message: `OpenAI ${res.status}: ${msg}` };
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = "";

    // Accumulate tool calls across chunks
    const toolCallAccum = {};

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

        let chunk;
        try { chunk = JSON.parse(raw); } catch { continue; }

        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        // Text delta
        if (delta.content) {
          yield { type: "delta", content: delta.content };
        }

        // Tool call accumulation
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallAccum[idx]) {
              toolCallAccum[idx] = { id: "", name: "", arguments: "" };
            }
            if (tc.id)                             toolCallAccum[idx].id        += tc.id;
            if (tc.function?.name)                 toolCallAccum[idx].name      += tc.function.name;
            if (tc.function?.arguments)            toolCallAccum[idx].arguments += tc.function.arguments;
          }
        }

        // Finish reason
        const finishReason = chunk.choices?.[0]?.finish_reason;
        if (finishReason === "tool_calls") {
          const calls = Object.values(toolCallAccum).map(tc => ({
            id:   tc.id,
            name: tc.name,
            args: (() => { try { return JSON.parse(tc.arguments); } catch { return {}; } })(),
          }));
          yield { type: "tool_calls", calls };
          return;
        }
        if (finishReason === "stop") {
          yield { type: "done" };
          return;
        }
      }
    }
    yield { type: "done" };
  }

  async complete({ model, messages, temperature = 0.3 }) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method:  "POST",
      headers: this.#headers(),
      body:    JSON.stringify({ model, messages, temperature, max_tokens: 2048 }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async generateImage({ prompt, size = "1024x1024", style = "natural" }) {
    const res = await fetch(`${BASE}/images/generations`, {
      method:  "POST",
      headers: this.#headers(),
      body:    JSON.stringify({
        model:           "dall-e-3",
        prompt,
        n:               1,
        size,
        style,
        response_format: "url",
      }),
    });
    if (!res.ok) throw new Error(`DALL-E error: ${res.statusText}`);
    const data = await res.json();
    return {
      url:            data.data?.[0]?.url ?? "",
      revised_prompt: data.data?.[0]?.revised_prompt ?? prompt,
    };
  }

  async embed(text) {
    const res = await fetch(`${BASE}/embeddings`, {
      method:  "POST",
      headers: this.#headers(),
      body:    JSON.stringify({ model: "text-embedding-3-small", input: text }),
    });
    if (!res.ok) throw new Error(`Embedding error: ${res.statusText}`);
    const data = await res.json();
    return data.data?.[0]?.embedding ?? [];
  }
}
