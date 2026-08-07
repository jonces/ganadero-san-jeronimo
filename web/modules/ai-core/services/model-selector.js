import { MODEL_ROUTING, ECONOMY_MODEL, STANDARD_MODEL, PRIMARY_MODEL } from "../constants/models.js";

// Heuristics to classify query complexity
const COMPLEX_SIGNALS = [
  "analiza", "análisis", "compara", "estrategia", "plan", "informe", "reporte",
  "diagnóstico", "protocolo", "proyección", "rentabilidad", "optimiza",
  "¿por qué", "explica en detalle", "cuál es la mejor", "qué hacer si",
];
const SIMPLE_SIGNALS = [
  "hola", "gracias", "sí", "no", "ok", "cuántos", "cuánto vale", "listar",
  "¿cuántos", "¿cuántas", "dame el total",
];
const IMAGE_SIGNALS  = ["genera una imagen", "crea una imagen", "dibuja", "muéstrame una foto", "visualiza"];

export function selectModel(message, agentId, overrideModel = null) {
  if (overrideModel) return overrideModel;

  const lower = message.toLowerCase();

  if (IMAGE_SIGNALS.some(s => lower.includes(s))) return MODEL_ROUTING.image;

  const hasFile    = lower.includes("[archivo]") || lower.includes("[imagen]");
  if (hasFile) return MODEL_ROUTING.vision;

  const isComplex  = COMPLEX_SIGNALS.some(s => lower.includes(s));
  const isSimple   = SIMPLE_SIGNALS.some(s => lower.includes(s)) && message.length < 80;

  // Specialists with heavy analysis always get flagship
  const heavyAgents = ["veterinario", "finanzas", "reproduccion"];
  if (heavyAgents.includes(agentId) && isComplex) return PRIMARY_MODEL;

  if (isSimple)   return ECONOMY_MODEL;
  if (isComplex)  return PRIMARY_MODEL;
  return STANDARD_MODEL;
}

export function estimateCost(model, inputTokens, outputTokens) {
  const costs = {
    "gpt-5.5":      { i: 15,   o: 60   },
    "gpt-4o":       { i: 2.5,  o: 10   },
    "gpt-4o-mini":  { i: 0.15, o: 0.6  },
    "dall-e-3":     { i: 0.04, o: 0     }, // per image
  };
  const c = costs[model];
  if (!c) return 0;
  return (inputTokens / 1e6) * c.i + (outputTokens / 1e6) * c.o;
}
