/**
 * Diseñador de Infraestructura IA — módulo futuro.
 * Generará planos de instalaciones ganaderas (corrales, lecherías, bodegas).
 *
 * Estado: stub — próximamente disponible.
 */

export const INFRASTRUCTURE_DESIGNER_CONFIG = {
  id:          "infrastructure-designer",
  label:       "Diseñador de Infraestructura IA",
  icono:       "🏗️",
  descripcion: "Diseño asistido de corrales, lecherías y otras instalaciones ganaderas",
  estado:      "proximamente",
  version:     null,
  especialistasCompatibles: ["infraestructura", "corrales"],
  capacidades: [
    "Plano de corrales de manejo con manga y brete",
    "Diseño de sala de ordeño",
    "Distribución de bebederos y saladeros",
    "Estimación de materiales y costos",
    "Exportar plano como imagen o PDF",
    "Cálculo de dimensiones por número de animales",
  ],
};

export function isInfrastructureDesignerAvailable() {
  return false;
}
