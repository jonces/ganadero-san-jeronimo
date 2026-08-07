/**
 * Agrega predicciones y genera el Centro de Riesgos unificado.
 */
import { RISK_LEVEL_CONFIG } from "../constants/risk-levels.js";

const NIVEL_ORDER = { critico: 0, alto: 1, medio: 2, bajo: 3 };

export function sortPredictions(predictions) {
  return [...predictions].sort((a, b) => {
    const levelDiff = (NIVEL_ORDER[a.nivel] ?? 4) - (NIVEL_ORDER[b.nivel] ?? 4);
    if (levelDiff !== 0) return levelDiff;
    return (b.probabilidad ?? 0) - (a.probabilidad ?? 0);
  });
}

/**
 * Convierte predicciones en registros de riesgos para el Centro de Riesgos.
 * Solo incluye predicciones de nivel CRITICO, ALTO y MEDIO.
 */
export function buildRiskCenter(predictions) {
  return predictions
    .filter(p => p.nivel !== "bajo" || p.probabilidad >= 70)
    .map(p => ({
      id:           p.id,
      area:         p.area,
      titulo:       p.titulo,
      descripcion:  p.descripcion,
      nivel:        p.nivel,
      probabilidad: p.probabilidad,
      impacto:      calcularImpacto(p),
      horizonte:    p.horizonte,
      confianza:    p.confianza,
      acciones:     p.acciones ?? [],
      tendencia:    p.tendencia ?? "estable",
      iotReady:     p.iotReady ?? false,
      iotLabel:     p.iotLabel ?? null,
    }));
}

/**
 * Agrupa riesgos por área para el panel de Centro de Riesgos.
 */
export function groupRisksByArea(risks) {
  const groups = {};
  for (const risk of risks) {
    if (!groups[risk.area]) groups[risk.area] = [];
    groups[risk.area].push(risk);
  }
  return groups;
}

/**
 * Calcula el impacto estimado en texto.
 */
function calcularImpacto(p) {
  if (p.nivel === "critico") return "Muy alto — puede afectar la viabilidad de la finca";
  if (p.nivel === "alto")    return "Alto — impacto significativo en producción o finanzas";
  if (p.nivel === "medio")   return "Moderado — pérdida de eficiencia o ingresos";
  return "Bajo — monitorear para prevenir escalada";
}

/**
 * Calcula el score global de riesgo de la finca (0–100, menor es mejor).
 */
export function calcularRiskScore(predictions) {
  const weights = { critico: 25, alto: 12, medio: 5, bajo: 1 };
  const total   = predictions.reduce((sum, p) => sum + (weights[p.nivel] ?? 0), 0);
  return Math.min(100, total);
}

/**
 * Genera la línea de tiempo de predicciones (agrupadas por horizonte).
 */
export function buildTimeline(predictions) {
  const horizontes = ["7d", "30d", "90d", "6m", "1y"];
  return horizontes.map(h => ({
    horizonte:  h,
    label:      HORIZON_LABEL[h],
    items:      predictions.filter(p => p.horizonte === h),
    criticos:   predictions.filter(p => p.horizonte === h && p.nivel === "critico").length,
    altos:      predictions.filter(p => p.horizonte === h && p.nivel === "alto").length,
  }));
}

const HORIZON_LABEL = {
  "7d":  "Próximos 7 días",
  "30d": "Próximos 30 días",
  "90d": "Próximos 90 días",
  "6m":  "Próximos 6 meses",
  "1y":  "Próximo año",
};
