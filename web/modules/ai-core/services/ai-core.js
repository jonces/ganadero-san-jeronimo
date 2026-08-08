/**
 * AI Core — central orchestrator.
 * Interfaces: UI → AI Core → Provider → Response
 * Never bypass this class to call providers directly.
 *
 * Usage (server-side only, inside API routes):
 *   import { getAICore } from "@/modules/ai-core/services/ai-core.js";
 *   const core = getAICore();
 *   yield* core.stream(request);
 */

import { OpenAIProvider }      from "./providers/openai-provider.js";
import { ClaudeProvider }      from "./providers/claude-provider.js";
import { GeminiProvider }      from "./providers/gemini-provider.js";
import { OllamaProvider }      from "./providers/ollama-provider.js";
import { AzureOpenAIProvider } from "./providers/azure-provider.js";
import { OpenRouterProvider }  from "./providers/openrouter-provider.js";
import { selectAgent, getAgentTools, buildSystemPrompt, buildToolResultMessages } from "./agent-orchestrator.js";
import { buildContext }        from "./context-builder.js";
import { executeTool }         from "./tool-runner.js";
import { validateInput, validateToolCall } from "./security-guard.js";
import { selectModel }         from "./model-selector.js";
import { trackRequest, trackError } from "./observability.js";

const PROVIDERS = [
  new OpenAIProvider(),
  new ClaudeProvider(),
  new GeminiProvider(),
  new OllamaProvider(),
  new AzureOpenAIProvider(),
  new OpenRouterProvider(),
];

class AICore {
  // Returns the first available provider, respecting priority
  getProvider(preferredId = null) {
    if (preferredId) {
      const p = PROVIDERS.find(p => p.id === preferredId && p.isAvailable());
      if (p) return p;
    }
    // Auto-select: first available by priority order
    return PROVIDERS.find(p => p.isAvailable()) ?? null;
  }

  listAvailableProviders() {
    return PROVIDERS.filter(p => p.isAvailable()).map(p => ({ id: p.id, label: p.label }));
  }

  /**
   * Main streaming endpoint.
   * Yields SSE-compatible objects throughout the lifecycle.
   *
   * @param {object} req
   * @param {string}   req.message          - User message
   * @param {Array}    req.history          - Conversation history [{role, content}]
   * @param {string}   req.agentId          - Requested specialist agent
   * @param {string}   req.providerId       - Preferred provider (optional)
   * @param {string}   req.overrideModel    - Override model selection (optional)
   * @param {object}   req.userCtx          - { usuario, empresa, finca }
   * @param {AbortSignal} req.signal
   */
  async *stream(req) {
    const { message, history = [], agentId, providerId, overrideModel, userCtx = {}, authToken = "", signal } = req;
    const startMs = Date.now();

    // 1. Security validation
    const guard = validateInput(message);
    if (!guard.ok) {
      yield { type: "error", message: guard.reason };
      return;
    }

    // 2. Provider selection
    const provider = this.getProvider(providerId);
    if (!provider) {
      yield { type: "error", message: "No hay proveedor de IA configurado. Configura OPENAI_API_KEY en las variables de entorno de Railway." };
      return;
    }

    // 3. Agent selection
    const agent = selectAgent(message, agentId);
    yield { type: "agent", agent: { id: agent.id, label: agent.label, emoji: agent.emoji } };

    // 4. Model selection (cost-optimized)
    const model = selectModel(message, agent.id, overrideModel ?? agent.model);

    // 5. Context building
    let contextStr = "";
    try {
      contextStr = await buildContext({ ...userCtx, agentId: agent.id, authToken });
    } catch {}

    // 6. System prompt + tools
    const systemPrompt = buildSystemPrompt(agent, contextStr);
    const tools        = getAgentTools(agent);

    // 7. Build messages array
    const messages = [
      { role: "system",    content: systemPrompt },
      ...history.slice(-20), // last 20 turns for context window efficiency
      { role: "user",      content: message },
    ];

    let inputTokenEstimate = messages.reduce((s, m) => s + (m.content?.length ?? 0) / 4, 0);
    let outputTokens       = 0;
    let usedTools          = [];

    try {
      // 8. Stream from provider (with tool-calling loop)
      yield* this.#streamWithTools({ provider, model, messages, tools, signal, authToken, onToken: () => outputTokens++ });
    } catch (e) {
      trackError({ model, provider: provider.id, agent: agent.id, error: e.message, durationMs: Date.now() - startMs });
      yield { type: "error", message: `Error IA: ${e.message}` };
      return;
    }

    // 9. Track observability
    trackRequest({
      model, provider: provider.id, agent: agent.id,
      tokens: { input: Math.round(inputTokenEstimate), output: outputTokens },
      durationMs: Date.now() - startMs,
      tools: usedTools,
    });
  }

  async *#streamWithTools({ provider, model, messages, tools, signal, authToken, onToken }) {
    let loopMessages = [...messages];
    let iterations   = 0;

    while (iterations < 5) { // max tool-call iterations
      iterations++;

      let pendingToolCalls = null;

      for await (const chunk of provider.stream({ model, messages: loopMessages, tools, signal })) {
        if (chunk.type === "delta") {
          onToken?.();
          yield chunk;
        } else if (chunk.type === "tool_calls") {
          pendingToolCalls = chunk.calls;
          yield { type: "tool_calls", calls: chunk.calls };
        } else if (chunk.type === "error") {
          yield chunk;
          return;
        } else if (chunk.type === "done" && !pendingToolCalls) {
          yield { type: "done" };
          return;
        }
      }

      // If we got tool calls, execute them and continue
      if (pendingToolCalls?.length) {
        // Add assistant's tool_calls message
        loopMessages.push({
          role:       "assistant",
          content:    null,
          tool_calls: pendingToolCalls.map(tc => ({
            id:       tc.id,
            type:     "function",
            function: { name: tc.name, arguments: JSON.stringify(tc.args) },
          })),
        });

        // Execute all tools in parallel
        const results = await Promise.all(
          pendingToolCalls.map(tc => {
            const guard = validateToolCall(tc.name, tc.args);
            if (!guard.ok) return Promise.resolve({ ok: false, data: { error: guard.reason } });
            return executeTool(tc.name, tc.args, authToken);
          })
        );

        // Emit tool results to client
        for (let i = 0; i < pendingToolCalls.length; i++) {
          yield {
            type:   "tool_result",
            name:   pendingToolCalls[i].name,
            result: results[i],
          };
        }

        // Add tool results to messages and continue loop
        const toolMsgs = buildToolResultMessages(pendingToolCalls, results);
        loopMessages.push(...toolMsgs);
        continue;
      }

      break; // no tool calls — done
    }

    yield { type: "done" };
  }

  // Non-streaming for summaries, context pre-processing etc.
  async complete(req) {
    const { message, agentId, userCtx = {}, history = [] } = req;
    const provider = this.getProvider();
    if (!provider) throw new Error("No AI provider configured");

    const agent    = selectAgent(message, agentId);
    const model    = selectModel(message, agent.id, agent.model);
    const ctx      = await buildContext({ ...userCtx, agentId: agent.id });
    const sys      = buildSystemPrompt(agent, ctx);

    return provider.complete({
      model,
      messages: [{ role: "system", content: sys }, ...history.slice(-10), { role: "user", content: message }],
    });
  }

  // Image generation — always uses OpenAI DALL-E 3
  async generateImage(prompt, options = {}) {
    const openai = PROVIDERS.find(p => p.id === "openai" && p.isAvailable());
    if (!openai) throw new Error("DALL-E requiere OPENAI_API_KEY configurada.");
    return openai.generateImage({ prompt, ...options });
  }
}

// Singleton — safe because isAvailable() reads process.env at call time
let _core = null;
export function getAICore() {
  if (!_core) _core = new AICore();
  return _core;
}
