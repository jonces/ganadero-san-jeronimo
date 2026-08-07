/**
 * Recomendaciones IA del Marketplace.
 * Usa las alertas del Copiloto Ganadero (FASE 6) para sugerir productos/servicios.
 */
import { getListings } from "./marketplace-storage.js";

/** Mapeo de tipo de alerta → categorías recomendadas. */
const ALERTA_A_CATEGORIAS = {
  // Salud
  brote_infeccioso:     ["medicamentos", "vacunas", "servicios"],
  parasitario:          ["medicamentos", "vitaminas"],
  condicion_corporal:   ["concentrados", "minerales", "vitaminas"],
  vacunaciones:         ["vacunas", "servicios"],
  medicamentos:         ["medicamentos"],

  // Reproducción
  anestro:              ["servicios", "vitaminas", "minerales"],
  fertilidad:           ["semen", "embriones", "servicios", "vitaminas"],
  parto:                ["servicios", "medicamentos"],

  // Finanzas
  flujo_caja:           ["servicios"],
  margen:               ["concentrados", "minerales"],

  // Producción
  peso_gmd:             ["concentrados", "servicios"],
  leche:                ["concentrados", "vitaminas"],

  // Pasturas
  carga_animal:         ["corrales", "cercas"],
  forraje:              ["concentrados", "insumos"],

  // Infraestructura
  inventario:           ["medicamentos", "vacunas", "minerales"],
};

const AREA_A_CATEGORIAS = {
  sanidad:      ["medicamentos", "vacunas", "servicios"],
  reproduccion: ["semen", "embriones", "servicios"],
  produccion:   ["concentrados", "vitaminas"],
  finanzas:     ["servicios"],
  inventario:   ["medicamentos", "vacunas", "minerales"],
  pasturas:     ["insumos", "corrales"],
  clima:        ["equipos"],
  mercado:      ["servicios"],
};

/**
 * Genera recomendaciones de marketplace basadas en predicciones/alertas activas.
 * @param {object[]} predictions — del motor predictivo (FASE 8)
 * @param {object[]} alerts      — del Copiloto Ganadero (FASE 6)
 * @param {number}   limit
 */
export function getIARecommendations({ predictions = [], alerts = [], limit = 6 }) {
  const categoriaScores = {};

  // Puntúa categorías por predicciones activas
  predictions.forEach(p => {
    const cats = AREA_A_CATEGORIAS[p.area] ?? [];
    const peso = p.nivel === "critico" ? 5 : p.nivel === "alto" ? 3 : p.nivel === "medio" ? 2 : 1;
    cats.forEach(c => { categoriaScores[c] = (categoriaScores[c] ?? 0) + peso; });
  });

  // Puntúa por alertas del Copiloto
  alerts.forEach(a => {
    const tipo = a.tipo ?? a.categoria ?? "";
    const cats = ALERTA_A_CATEGORIAS[tipo] ?? [];
    cats.forEach(c => { categoriaScores[c] = (categoriaScores[c] ?? 0) + 2; });
  });

  // Ordena categorías por score
  const topCats = Object.entries(categoriaScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c]) => c);

  if (!topCats.length) return [];

  // Selecciona publicaciones de esas categorías
  const listings = getListings().filter(l => l.status === "activa" && topCats.includes(l.categoria));

  // Enriquece con razón de recomendación
  const result = listings.map(l => {
    const pred = predictions.find(p => (AREA_A_CATEGORIAS[p.area] ?? []).includes(l.categoria));
    const razon = pred
      ? `Recomendado por: ${pred.titulo}`
      : `Recomendado para mejorar ${l.categoria}`;
    return { ...l, razon, score: categoriaScores[l.categoria] ?? 1 };
  });

  return result.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Texto explicativo para una recomendación.
 */
export function buildRecommendationReason(categoria, predictions) {
  const pred = predictions.find(p => (AREA_A_CATEGORIAS[p.area] ?? []).includes(categoria));
  if (pred) return `El sistema detectó: "${pred.titulo}" (${pred.nivel})`;
  return "Recomendado según el análisis de tu finca";
}
