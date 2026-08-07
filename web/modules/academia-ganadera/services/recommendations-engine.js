/**
 * Motor de recomendaciones de la Academia.
 * Usa datos de la finca (vía Copiloto) para sugerir cursos relevantes.
 * Desacoplado: funciona con o sin datos de la finca.
 */

import { CURSO_CATALOG } from "../constants/catalog.js";
import { getProgresoGlobal, getCursosRecientes } from "./academia-storage.js";

/**
 * Genera recomendaciones de cursos basadas en:
 * 1. Alertas activas del Copiloto Ganadero
 * 2. Categorías con menos progreso del usuario
 * 3. Cursos populares que el usuario no ha iniciado
 *
 * @param {object} opts
 * @param {Array}  opts.alerts        — alertas del copiloto (opcional)
 * @param {object} opts.dashData      — datos del dashboard (opcional)
 * @param {number} opts.limit         — máximo de recomendaciones
 * @returns {Array<{ cursoId, razon, prioridad }>}
 */
export function getRecomendaciones({ alerts = [], dashData = null, limit = 6 } = {}) {
  const progreso = getProgresoGlobal();
  const recientes = new Set(getCursosRecientes(20));
  const scored = [];

  for (const curso of CURSO_CATALOG) {
    const prog = progreso[curso.id];
    if (prog?.completado) continue; // ya completado, no recomendar

    let score = 0;
    let razon = null;

    // 1. Alertas del Copiloto → cursos de la misma categoría/especialista
    for (const alert of alerts) {
      const catMatch = alertToCategorias(alert.type);
      if (catMatch.includes(curso.categoria)) {
        score += alert.priority === "critica" ? 20 : alert.priority === "alta" ? 14 : 8;
        razon = razon ?? `Detectamos ${alert.titulo?.toLowerCase() ?? "un problema"} en tu finca`;
      }
    }

    // 2. Dashboard data → baja preñez → reproducción
    if (dashData) {
      const hato = dashData.hato ?? {};
      if (hato.tasaPrenez < 50 && ["reproduccion", "inseminacion"].includes(curso.categoria)) {
        score += 12;
        razon = razon ?? "Tu tasa de preñez puede mejorar";
      }
      if ((dashData.finanzas?.margenGanancia ?? 100) < 15 && ["finanzas", "administracion"].includes(curso.categoria)) {
        score += 12;
        razon = razon ?? "Mejora la rentabilidad de tu finca";
      }
    }

    // 3. Cursos populares sin iniciar
    if (curso.popular && !prog) { score += 5; razon = razon ?? "Recomendado para ganaderos"; }

    // 4. Penalizar vistos recientemente
    if (recientes.has(curso.id)) score -= 3;

    // 5. Sin progreso, leve boost
    if (!prog) score += 2;

    if (score > 0 || curso.popular) {
      scored.push({ curso, score, razon: razon ?? "Relevante para tu perfil" });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ curso, razon }) => ({ cursoId: curso.id, razon, curso }));
}

/**
 * Mapea tipos de alerta del Copiloto a categorías de la Academia.
 */
function alertToCategorias(alertType) {
  const MAP = {
    PERDIDA_NETA:       ["finanzas", "administracion"],
    FLUJO_NEGATIVO:     ["finanzas"],
    MARGEN_BAJO:        ["finanzas", "administracion"],
    BAJA_PRENEZ:        ["reproduccion", "inseminacion"],
    ANESTRO_PROBABLE:   ["reproduccion", "nutricion"],
    MORTALIDAD_ALTA:    ["sanidad", "bienestar"],
    INCIDENTE_ABIERTO:  ["sanidad"],
    MEDICAMENTO_VENCER: ["sanidad"],
    OPORTUNIDAD_VENTA:  ["administracion", "finanzas"],
    EVENTO_PROXIMO:     ["administracion"],
    META_ALCANZADA:     ["administracion"],
  };
  return MAP[alertType] ?? [];
}

/**
 * Dado un tema libre, busca cursos relacionados en el catálogo.
 */
export function buscarCursos(query, { categoria, nivel } = {}) {
  if (!query && !categoria && !nivel) return CURSO_CATALOG;
  const q = (query ?? "").toLowerCase();
  return CURSO_CATALOG.filter(c => {
    const matchQ = !q ||
      c.titulo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      c.categoria.toLowerCase().includes(q) ||
      c.objetivos.some(o => o.toLowerCase().includes(q));
    const matchCat = !categoria || c.categoria === categoria;
    const matchNiv = !nivel || c.nivel === nivel;
    return matchQ && matchCat && matchNiv;
  });
}
