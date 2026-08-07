/**
 * Orquestador del Predictive Intelligence Engine.
 * Ejecuta todos los motores y agrega los resultados.
 */
import { runSanidadEngine }        from "../engines/sanidad-engine.js";
import { runReproduccionEngine }   from "../engines/reproduccion-engine.js";
import { runFinanzasEngine }       from "../engines/finanzas-engine.js";
import { runProduccionEngine }     from "../engines/produccion-engine.js";
import { runInventarioEngine }     from "../engines/inventario-engine.js";
import { runPasturasEngine }       from "../engines/pasturas-engine.js";
import { runClimaEngine, runMercadoEngine } from "../engines/clima-mercado-engine.js";
import { sortPredictions }         from "./risk-aggregator.js";

/**
 * Ejecuta todos los motores predictivos en paralelo.
 * @param {object} dashData  — datos completos del dashboard
 * @param {object} extras    — { incidentes[], insumos[], eventos[] }
 * @returns {Prediction[]}   — todas las predicciones ordenadas por prioridad
 */
export function runAllEngines(dashData, extras = {}) {
  if (!dashData) return [];

  const results = [
    ...runSanidadEngine(dashData, extras),
    ...runReproduccionEngine(dashData, extras),
    ...runFinanzasEngine(dashData, extras),
    ...runProduccionEngine(dashData, extras),
    ...runInventarioEngine(dashData, extras),
    ...runPasturasEngine(dashData, extras),
    ...runClimaEngine(dashData, extras),
    ...runMercadoEngine(dashData, extras),
  ];

  return sortPredictions(results);
}

/**
 * Ejecuta solo los motores de un área específica.
 */
export function runAreaEngine(area, dashData, extras = {}) {
  const engines = {
    sanidad:      () => runSanidadEngine(dashData, extras),
    reproduccion: () => runReproduccionEngine(dashData, extras),
    finanzas:     () => runFinanzasEngine(dashData, extras),
    produccion:   () => runProduccionEngine(dashData, extras),
    inventario:   () => runInventarioEngine(dashData, extras),
    pasturas:     () => runPasturasEngine(dashData, extras),
    clima:        () => runClimaEngine(dashData, extras),
    mercado:      () => runMercadoEngine(dashData, extras),
  };
  return sortPredictions(engines[area]?.() ?? []);
}

/**
 * Filtra predicciones por horizonte temporal.
 */
export function filterByHorizon(predictions, horizonte) {
  if (!horizonte) return predictions;
  const HORIZON_ORDER = { "7d": 1, "30d": 2, "90d": 3, "6m": 4, "1y": 5 };
  const targetOrder = HORIZON_ORDER[horizonte] ?? 5;
  return predictions.filter(p => (HORIZON_ORDER[p.horizonte] ?? 5) <= targetOrder);
}

/**
 * Genera el resumen ejecutivo del estado predictivo de la finca.
 */
export function generatePredictiveSummary(predictions) {
  const total    = predictions.length;
  const criticos = predictions.filter(p => p.nivel === "critico").length;
  const altos    = predictions.filter(p => p.nivel === "alto").length;
  const medios   = predictions.filter(p => p.nivel === "medio").length;

  let semaforo = "verde";
  if (criticos > 0) semaforo = "rojo";
  else if (altos > 1) semaforo = "rojo";
  else if (altos > 0 || medios > 2) semaforo = "amarillo";

  const puntaje = Math.max(0, 100 - criticos * 20 - altos * 10 - medios * 4);

  const areas = [...new Set(predictions.map(p => p.area))];

  const texto = criticos > 0
    ? `${criticos} predicción(es) crítica(s) requieren atención inmediata`
    : altos > 0
    ? `${altos} riesgo(s) alto(s) identificados — revisar esta semana`
    : "Sin riesgos críticos detectados en el horizonte analizado";

  return { semaforo, puntaje, texto, total, criticos, altos, medios, areas };
}
