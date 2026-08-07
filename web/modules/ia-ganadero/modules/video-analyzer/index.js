/**
 * Analizador de Video IA — módulo futuro.
 * Evaluará marcha, comportamiento y signos clínicos en video.
 *
 * Estado: stub — próximamente disponible.
 */

export const VIDEO_ANALYZER_CONFIG = {
  id:          "video-analyzer",
  label:       "Analizador de Video IA",
  icono:       "🎥",
  descripcion: "Análisis de marcha, comportamiento y signos clínicos en video",
  estado:      "proximamente",
  version:     null,
  especialistasCompatibles: ["veterinario", "corrales", "bienestar"],
  capacidades: [
    "Evaluación de cojera (scoring de marcha)",
    "Detección de comportamientos anómalos",
    "Conteo de animales por video",
    "Evaluación de flujo en corrales",
    "Detección de signos respiratorios visibles",
  ],
};

export function isVideoAnalyzerAvailable() {
  return false;
}
