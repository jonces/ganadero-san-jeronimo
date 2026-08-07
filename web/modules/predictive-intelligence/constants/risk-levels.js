export const RISK_LEVEL = {
  CRITICO: "critico",
  ALTO:    "alto",
  MEDIO:   "medio",
  BAJO:    "bajo",
};

export const RISK_LEVEL_CONFIG = {
  critico: { id: "critico", label: "Crítico",  icono: "🔴", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", order: 0, umbral: 80 },
  alto:    { id: "alto",    label: "Alto",     icono: "🟠", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", order: 1, umbral: 60 },
  medio:   { id: "medio",   label: "Medio",    icono: "🟡", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", order: 2, umbral: 35 },
  bajo:    { id: "bajo",    label: "Bajo",     icono: "🔵", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", order: 3, umbral: 0  },
};

export const CONFIDENCE = {
  ALTA:         "alta",
  MEDIA:        "media",
  BAJA:         "baja",
  INSUFICIENTE: "insuficiente",
};

export const CONFIDENCE_CONFIG = {
  alta:         { id: "alta",         label: "Alta confianza",         icono: "✅", color: "#059669", min: 75 },
  media:        { id: "media",        label: "Confianza media",        icono: "⚠️", color: "#D97706", min: 50 },
  baja:         { id: "baja",         label: "Baja confianza",         icono: "❓", color: "#6B7280", min: 25 },
  insuficiente: { id: "insuficiente", label: "Datos insuficientes",    icono: "📊", color: "#9CA3AF", min: 0  },
};

export function getRiskLevel(probabilidad) {
  if (probabilidad >= 80) return RISK_LEVEL.CRITICO;
  if (probabilidad >= 60) return RISK_LEVEL.ALTO;
  if (probabilidad >= 35) return RISK_LEVEL.MEDIO;
  return RISK_LEVEL.BAJO;
}

export function getConfidence(datosDisponibles, datosRequeridos) {
  const pct = Math.min(100, Math.round((datosDisponibles / datosRequeridos) * 100));
  if (pct >= 75) return CONFIDENCE.ALTA;
  if (pct >= 50) return CONFIDENCE.MEDIA;
  if (pct >= 25) return CONFIDENCE.BAJA;
  return CONFIDENCE.INSUFICIENTE;
}

export const DISCLAIMER = "Esta predicción es una estimación basada en datos históricos y reglas de experto. No constituye una certeza. Consulte con su especialista antes de tomar decisiones.";

export const HORIZON = {
  D7:   "7d",
  D30:  "30d",
  D90:  "90d",
  M6:   "6m",
  Y1:   "1y",
};

export const HORIZON_LABEL = {
  "7d":  "Próximos 7 días",
  "30d": "Próximos 30 días",
  "90d": "Próximos 90 días",
  "6m":  "Próximos 6 meses",
  "1y":  "Próximo año",
};
