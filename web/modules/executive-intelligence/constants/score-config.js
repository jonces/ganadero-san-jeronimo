export const SCORES = {
  financiero: {
    id: "financiero", label: "Score Financiero", icono: "💰", color: "#6366f1",
    descripcion: "Mide rentabilidad, liquidez, margen y ROI de la operación.",
  },
  sanitario: {
    id: "sanitario", label: "Score Sanitario", icono: "🏥", color: "#16a34a",
    descripcion: "Evalúa cobertura de vacunación, morbilidad y mortalidad del hato.",
  },
  reproductivo: {
    id: "reproductivo", label: "Score Reproductivo", icono: "🐄", color: "#d97706",
    descripcion: "Analiza tasa de preñez, natalidad, destete e intervalo entre partos.",
  },
  administrativo: {
    id: "administrativo", label: "Score Administrativo", icono: "📋", color: "#0891b2",
    descripcion: "Refleja eficiencia operativa, liquidez y uso de la plataforma.",
  },
  productivo: {
    id: "productivo", label: "Score Productivo", icono: "⚡", color: "#7c3aed",
    descripcion: "Ganancia diaria de peso, producción de leche y carne.",
  },
  ambiental: {
    id: "ambiental", label: "Score Ambiental", icono: "🌿", color: "#059669",
    descripcion: "Rotación de potreros y prácticas sostenibles de pastoreo.",
  },
  general: {
    id: "general", label: "Score General", icono: "🏆", color: "#1e40af",
    descripcion: "Índice compuesto de todos los scores de la operación.",
  },
};

export const SCORE_ORDER = ["financiero", "sanitario", "reproductivo", "administrativo", "productivo", "ambiental", "general"];

export const SCORE_LEVELS = [
  { min: 80, label: "Excelente", color: "#16a34a", bg: "#f0fdf4" },
  { min: 60, label: "Bueno",     color: "#2563eb", bg: "#eff6ff" },
  { min: 40, label: "Regular",   color: "#d97706", bg: "#fffbeb" },
  { min: 0,  label: "Crítico",   color: "#dc2626", bg: "#fef2f2" },
];

export function getScoreLevel(score) {
  return SCORE_LEVELS.find(l => score >= l.min) ?? SCORE_LEVELS[SCORE_LEVELS.length - 1];
}
