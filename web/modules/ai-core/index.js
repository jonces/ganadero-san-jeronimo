// Constants (safe to import anywhere)
export * from "./constants/providers.js";
export * from "./constants/models.js";
export * from "./constants/tools.js";
export * from "./constants/agents.js";

// Client hook
export { useAICore } from "./hooks/useAICore.js";

// Server-side exports (only import inside API routes / server components)
// export { getAICore }         from "./services/ai-core.js";
// export { buildContext }      from "./services/context-builder.js";
// export { executeTool }       from "./services/tool-runner.js";
// export { getMetrics }        from "./services/observability.js";
// export { getVectorStore }    from "./services/vector-store.js";
