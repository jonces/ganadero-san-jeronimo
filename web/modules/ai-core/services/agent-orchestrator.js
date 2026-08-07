import { AGENTS, AGENT_KEYWORDS, DEFAULT_AGENT } from "../constants/agents.js";
import { TOOL_DEFS } from "../constants/tools.js";

// Selects the best agent based on message content
export function selectAgent(message, requestedAgentId = null) {
  if (requestedAgentId && AGENTS[requestedAgentId]) {
    return AGENTS[requestedAgentId];
  }

  const lower = message.toLowerCase();
  const scores = {};

  for (const [agentId, keywords] of Object.entries(AGENT_KEYWORDS)) {
    scores[agentId] = keywords.filter(k => lower.includes(k)).length;
  }

  const best = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .find(([, score]) => score > 0);

  return AGENTS[best?.[0] ?? DEFAULT_AGENT];
}

// Builds the tools list for a specific agent (filtered by what that agent can use)
export function getAgentTools(agent) {
  const allowed = new Set(agent.tools ?? []);
  return TOOL_DEFS.filter(t => allowed.has(t.function.name));
}

// Builds the full system prompt for an agent with context injected
export function buildSystemPrompt(agent, contextStr) {
  return [
    agent.systemPrompt,
    "",
    contextStr,
    "",
    "FORMATO DE RESPUESTA:",
    "• Responde siempre en español colombiano formal.",
    "• Usa markdown: tablas, listas, negritas para organizar la información.",
    "• Si tienes datos reales del hato, úsalos — nunca inventes cifras.",
    "• Cuando generes una imagen, describe primero qué generarás.",
    "• Sé conciso pero completo. El propietario tiene poco tiempo.",
  ].join("\n");
}

// Merges tool results back into the message history
export function buildToolResultMessages(toolCalls, results) {
  return toolCalls.map((call, i) => ({
    role:         "tool",
    tool_call_id: call.id,
    name:         call.name,
    content:      JSON.stringify(results[i]?.data ?? { error: "No result" }),
  }));
}
