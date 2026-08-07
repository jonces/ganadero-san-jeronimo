export const NIVEL = {
  PRINCIPIANTE: "principiante",
  INTERMEDIO:   "intermedio",
  AVANZADO:     "avanzado",
  EXPERTO:      "experto",
};

export const NIVEL_CONFIG = {
  principiante: { id: "principiante", label: "Principiante", icono: "🌱", color: "#16A34A", bg: "#F0FDF4", order: 0 },
  intermedio:   { id: "intermedio",   label: "Intermedio",   icono: "🌿", color: "#D97706", bg: "#FFFBEB", order: 1 },
  avanzado:     { id: "avanzado",     label: "Avanzado",     icono: "🌳", color: "#7C3AED", bg: "#F5F3FF", order: 2 },
  experto:      { id: "experto",      label: "Experto",      icono: "🏆", color: "#DC2626", bg: "#FEF2F2", order: 3 },
};

export function getNivelConfig(id) {
  return NIVEL_CONFIG[id] ?? NIVEL_CONFIG.principiante;
}
