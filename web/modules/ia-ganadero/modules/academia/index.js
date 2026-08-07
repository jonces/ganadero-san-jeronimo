/**
 * Academia Ganadera IA — módulo futuro.
 * Cursos, tutoriales y capacitación ganadera generados por IA.
 *
 * Estado: stub — próximamente disponible.
 */

export const ACADEMIA_CONFIG = {
  id:          "academia",
  label:       "Academia Ganadera IA",
  icono:       "🎓",
  descripcion: "Cursos y tutoriales de ganadería generados y personalizados por IA",
  estado:      "proximamente",
  version:     null,
  especialistasCompatibles: [
    "veterinario", "nutricionista", "reproduccion", "pasturas",
    "infraestructura", "corrales", "finanzas", "produccion", "bienestar",
  ],
  capacidades: [
    "Módulos de capacitación por especialidad",
    "Quiz y evaluaciones adaptativas",
    "Tutoriales paso a paso con imágenes",
    "Certificados de capacitación",
    "Biblioteca de protocolos descargables",
    "Videos explicativos generados por IA",
  ],
};

export function isAcademiaAvailable() {
  return false;
}
