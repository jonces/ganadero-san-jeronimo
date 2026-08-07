/**
 * Diseñador de Potreros IA — módulo futuro.
 * Generará planos de distribución de potreros optimizados para rotación.
 *
 * Estado: stub — próximamente disponible.
 */

export const POTRERO_DESIGNER_CONFIG = {
  id:          "potrero-designer",
  label:       "Diseñador de Potreros IA",
  icono:       "🗺️",
  descripcion: "Diseño de distribución óptima de potreros para pastoreo rotacional",
  estado:      "proximamente",
  version:     null,
  especialistasCompatibles: ["pasturas", "infraestructura"],
  capacidades: [
    "Cálculo de número y tamaño de potreros",
    "Distribución de bebederos y saladeros",
    "Diseño de corredores de acceso",
    "Optimización de cercas eléctricas",
    "Integración de árboles y cercas vivas",
    "Exportar plano como imagen",
  ],
};

export function isPotreroDesigerAvailable() {
  return false;
}
