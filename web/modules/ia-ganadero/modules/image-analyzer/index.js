/**
 * Analizador de Imágenes IA — módulo futuro.
 * Analizará fotos de animales, potreros, lesiones y condición corporal
 * usando visión por computador y Claude Vision.
 *
 * Estado: stub — próximamente disponible.
 */

export const IMAGE_ANALYZER_CONFIG = {
  id:          "image-analyzer",
  label:       "Analizador de Imágenes IA",
  icono:       "📷",
  descripcion: "Análisis automático de fotos de animales, lesiones y pasturas",
  estado:      "proximamente",
  version:     null,
  especialistasCompatibles: ["veterinario", "nutricionista", "pasturas", "bienestar", "produccion", "infraestructura"],
  capacidades: [
    "Evaluación de condición corporal (BCS) por foto",
    "Detección de lesiones cutáneas y podales",
    "Diagnóstico diferencial por imagen",
    "Análisis de cobertura de potreros",
    "Evaluación de infraestructura",
    "Detección de signos clínicos visibles",
  ],
};

/** @throws {Error} Siempre — módulo no implementado aún */
export function analyzeImage(_imageData, _context) {
  throw new Error("El Analizador de Imágenes IA estará disponible próximamente.");
}

export function isImageAnalyzerAvailable() {
  return false;
}
