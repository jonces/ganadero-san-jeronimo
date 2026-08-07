import { BaseProvider } from "./base-provider.js";

export class AzureOpenAIProvider extends BaseProvider {
  constructor() { super({ id: "azure", label: "Azure OpenAI" }); }

  isAvailable() {
    return !!(process.env.AZURE_OPENAI_KEY && process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_DEPLOYMENT);
  }

  #headers() {
    return { "Content-Type": "application/json", "api-key": process.env.AZURE_OPENAI_KEY ?? "" };
  }

  #url() {
    const endpoint   = process.env.AZURE_OPENAI_ENDPOINT ?? "";
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "";
    return `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-12-01-preview`;
  }

  async *stream({ messages, tools = [], temperature = 0.7, signal }) {
    const body = { messages, temperature, stream: true, max_tokens: 4096, ...(tools.length ? { tools, tool_choice: "auto" } : {}) };
    const res  = await fetch(this.#url(), { method: "POST", headers: this.#headers(), body: JSON.stringify(body), signal });
    if (!res.ok) { yield { type: "error", message: `Azure error: ${res.statusText}` }; return; }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = "";
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
        let chunk; try { chunk = JSON.parse(raw); } catch { continue; }
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content)     yield { type: "delta", content: delta.content };
        if (delta?.tool_calls)  {
          for (const tc of delta.tool_calls) {
            const i = tc.index ?? 0;
            if (!toolCallAccum[i]) toolCallAccum[i] = { id: "", name: "", arguments: "" };
            if (tc.id)                  toolCallAccum[i].id        += tc.id;
            if (tc.function?.name)      toolCallAccum[i].name      += tc.function.name;
            if (tc.function?.arguments) toolCallAccum[i].arguments += tc.function.arguments;
          }
        }
        const fin = chunk.choices?.[0]?.finish_reason;
        if (fin === "tool_calls") {
          yield { type: "tool_calls", calls: Object.values(toolCallAccum).map(tc => ({ id: tc.id, name: tc.name, args: (() => { try { return JSON.parse(tc.arguments); } catch { return {}; } })() })) };
          return;
        }
        if (fin === "stop") { yield { type: "done" }; return; }
      }
    }
    yield { type: "done" };
  }

  async complete({ messages, temperature = 0.3 }) {
    const res  = await fetch(this.#url(), { method: "POST", headers: this.#headers(), body: JSON.stringify({ messages, temperature, max_tokens: 2048 }) });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async generateImage() { throw new Error("Use dedicated Azure DALL-E endpoint."); }
  async embed(text) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT ?? "";
    const res  = await fetch(`${endpoint}/openai/deployments/text-embedding-3-small/embeddings?api-version=2024-02-01`, {
      method: "POST", headers: this.#headers(), body: JSON.stringify({ input: text }),
    });
    const data = await res.json();
    return data.data?.[0]?.embedding ?? [];
  }
}
