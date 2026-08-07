import { BaseProvider } from "./base-provider.js";

export class GeminiProvider extends BaseProvider {
  constructor() { super({ id: "gemini", label: "Google Gemini" }); }

  isAvailable() { return !!process.env.GEMINI_API_KEY; }

  #url(model) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}&alt=sse`;
  }

  async *stream({ model, messages, temperature = 0.7, signal }) {
    const contents = messages
      .filter(m => m.role !== "system")
      .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

    const systemInstruction = messages.find(m => m.role === "system")?.content;
    const body = {
      contents,
      generationConfig: { temperature, maxOutputTokens: 4096 },
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
    };

    const res = await fetch(this.#url(model), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      yield { type: "error", message: `Gemini error: ${res.statusText}` };
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
        let chunk;
        try { chunk = JSON.parse(line.slice(6)); } catch { continue; }
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield { type: "delta", content: text };
        if (chunk.candidates?.[0]?.finishReason === "STOP") { yield { type: "done" }; return; }
      }
    }
    yield { type: "done" };
  }

  async complete({ model, messages, temperature = 0.3 }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const contents = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const res  = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents, generationConfig: { temperature } }) });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  async generateImage() { throw new Error("Use OpenAI DALL-E for image generation."); }
  async embed(text) {
    const url  = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
    const res  = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: { parts: [{ text }] } }) });
    const data = await res.json();
    return data.embedding?.values ?? [];
  }
}
