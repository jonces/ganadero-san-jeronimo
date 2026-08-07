// Model catalog — cost in USD per 1M tokens {input, output}
export const MODELS = {
  // ── OpenAI ────────────────────────────────────────────────────
  "gpt-5.5": {
    provider: "openai", label: "GPT-5.5", tier: "flagship",
    cost: { input: 15, output: 60 }, ctx: 256000,
    caps: ["chat", "analysis", "tools", "vision", "code"],
  },
  "gpt-5.5-mini": {
    provider: "openai", label: "GPT-5.5 Mini", tier: "mid",
    cost: { input: 3, output: 12 }, ctx: 128000,
    caps: ["chat", "analysis", "tools"],
  },
  "gpt-4o": {
    provider: "openai", label: "GPT-4o", tier: "mid",
    cost: { input: 2.5, output: 10 }, ctx: 128000,
    caps: ["chat", "analysis", "tools", "vision"],
  },
  "gpt-4o-mini": {
    provider: "openai", label: "GPT-4o Mini", tier: "economy",
    cost: { input: 0.15, output: 0.6 }, ctx: 128000,
    caps: ["chat", "tools"],
  },
  "dall-e-3": {
    provider: "openai", label: "DALL·E 3", tier: "image",
    cost: { input: 0, output: 0 }, ctx: 0,
    caps: ["images"],
  },
  // ── Claude ───────────────────────────────────────────────────
  "claude-opus-5": {
    provider: "claude", label: "Claude Opus 5", tier: "flagship",
    cost: { input: 15, output: 75 }, ctx: 200000,
    caps: ["chat", "analysis", "tools", "vision", "code"],
  },
  "claude-sonnet-5": {
    provider: "claude", label: "Claude Sonnet 5", tier: "mid",
    cost: { input: 3, output: 15 }, ctx: 200000,
    caps: ["chat", "analysis", "tools", "vision"],
  },
  "claude-haiku-4-5": {
    provider: "claude", label: "Claude Haiku 4.5", tier: "economy",
    cost: { input: 0.8, output: 4 }, ctx: 200000,
    caps: ["chat", "tools"],
  },
  // ── Gemini ───────────────────────────────────────────────────
  "gemini-2.5-pro": {
    provider: "gemini", label: "Gemini 2.5 Pro", tier: "flagship",
    cost: { input: 7, output: 21 }, ctx: 1000000,
    caps: ["chat", "analysis", "tools", "vision"],
  },
  "gemini-2.5-flash": {
    provider: "gemini", label: "Gemini 2.5 Flash", tier: "economy",
    cost: { input: 0.3, output: 1.2 }, ctx: 1000000,
    caps: ["chat", "tools"],
  },
  // ── Ollama (local) ────────────────────────────────────────────
  "llama3.3:70b": {
    provider: "ollama", label: "Llama 3.3 70B", tier: "local",
    cost: { input: 0, output: 0 }, ctx: 128000,
    caps: ["chat", "analysis"],
  },
};

// Routing rules — complexity → model
export const MODEL_ROUTING = {
  simple:    "gpt-4o-mini",   // greetings, yes/no, simple lookups
  standard:  "gpt-4o",       // normal conversation, analysis
  complex:   "gpt-5.5",      // multi-step reasoning, large analysis
  image:     "dall-e-3",
  vision:    "gpt-5.5",
  code:      "gpt-5.5",
};

export const PRIMARY_MODEL   = "gpt-5.5";
export const ECONOMY_MODEL   = "gpt-4o-mini";
export const STANDARD_MODEL  = "gpt-4o";
export const IMAGE_MODEL     = "dall-e-3";
