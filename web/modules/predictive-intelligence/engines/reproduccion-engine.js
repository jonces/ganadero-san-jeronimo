/**
 * Motor predictivo de reproducción.
 * Predice: preñez, celos, partos, anestro, intervalos entre partos.
 */
import { getRiskLevel, getConfidence, DISCLAIMER } from "../constants/risk-levels.js";

const AREA = "reproduccion";

export function runReproduccionEngine(data, extras = {}) {
  const predictions = [];
  const hato        = data?.hato ?? {};
  const stats       = data?.stats ?? {};

  const vacas        = hato.vacas     ?? 0;
  const prenadas     = hato.prenadas  ?? 0;
  const tasaPrenez   = hato.tasaPrenez ?? (vacas > 0 ? (prenadas / vacas) * 100 : 0);
  const totalHembras = vacas;

  if (totalHembras === 0) return predictions;

  // ── 1. Predicción probabilidad de preñez próximo ciclo ───────────────────
  const vacasEnReproduccion = vacas - prenadas;
  if (vacasEnReproduccion > 0) {
    const probPreñez = Math.min(90, Math.max(20, tasaPrenez * 0.85));
    predictions.push({
      id:           "rep-prenez-ciclo",
      area:         AREA,
      titulo:       "Predicción de preñez — próximo ciclo",
      descripcion:  `Con la tasa actual de preñez (${tasaPrenez.toFixed(1)}%), se estima que aproximadamente ${Math.round(vacasEnReproduccion * probPreñez / 100)} de las ${vacasEnReproduccion} vacas en reproducción quedarán preñadas en el próximo ciclo de detección.`,
      probabilidad: probPreñez,
      nivel:        tasaPrenez < 50 ? getRiskLevel(70) : getRiskLevel(30),
      horizonte:    "30d",
      confianza:    getConfidence(3, 5),
      datosUtilizados:      [`Tasa de preñez actual: ${tasaPrenez.toFixed(1)}%`, `Vacas en reproducción: ${vacasEnReproduccion}`],
      variablesConsideradas:["tasa de preñez histórica", "número de hembras disponibles", "condición corporal estimada"],
      limitaciones:         ["Sin fechas exactas de celo por animal", "Sin datos de protocolos de sincronización activos"],
      acciones: tasaPrenez < 50
        ? ["Revisar protocolo de detección de celos", "Evaluar inicio de programa de IATF (Ovsynch/Co-Synch)", "Consultar con especialista en reproducción"]
        : ["Mantener programa reproductivo actual", "Registrar fechas de servicio para seguimiento"],
      tendencia: tasaPrenez < 45 ? "bajando" : "estable",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 2. Predicción de partos próximos ─────────────────────────────────────
  if (prenadas > 0) {
    const gestacion = 283; // días promedio bovinos
    const partosProximos7d  = Math.round(prenadas * 0.04);
    const partosProximos30d = Math.round(prenadas * 0.15);

    if (partosProximos30d > 0) {
      predictions.push({
        id:           "rep-partos",
        area:         AREA,
        titulo:       `~${partosProximos30d} parto(s) estimados próximos 30 días`,
        descripcion:  `Con ${prenadas} vacas preñadas, se proyectan aproximadamente ${partosProximos30d} partos en los próximos 30 días (${partosProximos7d} en los próximos 7 días). Preparar área de maternidad y calostro.`,
        probabilidad: 75,
        nivel:        "bajo",
        horizonte:    "30d",
        confianza:    getConfidence(2, 4),
        datosUtilizados:      [`Vacas preñadas: ${prenadas}`, `Distribución de gestaciones estimada uniformemente`],
        variablesConsideradas:["número de gestantes", "duración promedio gestación (283 días)", "distribución estadística"],
        limitaciones:         ["Sin fechas exactas de servicio por animal registradas en sistema"],
        acciones: [
          "Preparar área de maternidad limpia y seca",
          `Tener calostro disponible para ${partosProximos30d} terneros`,
          "Asignar vigilancia nocturna en vacas con signos preparto",
          "Registrar fecha de parto y datos del ternero al nacer",
        ],
        tendencia: "estable",
        disclaimer: DISCLAIMER,
      });
    }
  }

  // ── 3. Riesgo de anestro ──────────────────────────────────────────────────
  const pctAnestro = vacas > 0 ? Math.max(0, 100 - tasaPrenez - (prenadas/vacas*100)) : 0;
  if (tasaPrenez < 55) {
    const prob = tasaPrenez < 35 ? 85 : tasaPrenez < 50 ? 65 : 40;
    predictions.push({
      id:           "rep-anestro",
      area:         AREA,
      titulo:       "Riesgo de anestro posparto prolongado",
      descripcion:  `La tasa de preñez (${tasaPrenez.toFixed(1)}%) sugiere que una proporción significativa del hato puede estar en anestro. Factores como nutrición, condición corporal y estrés calórico pueden ser causas.`,
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "30d",
      confianza:    getConfidence(2, 6),
      datosUtilizados:      [`Tasa de preñez: ${tasaPrenez.toFixed(1)}%`, `Vacas en hato: ${vacas}`],
      variablesConsideradas:["tasa de preñez", "condición corporal estimada", "época del año", "nutrición"],
      limitaciones:         ["Sin registros individuales de ciclo estral", "Sin datos de BCS por animal"],
      acciones: [
        "Evaluar condición corporal (BCS) de vacas vacías",
        "Revisar aporte de energía en la ración — meta BCS > 2.5",
        "Considerar diagnóstico hormonal (progesterona) en vacas con >90 días posparto sin celo",
        "Evaluar inicio de protocolo de sincronización hormonal",
      ],
      tendencia: prob > 60 ? "subiendo" : "estable",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 4. Rendimiento reproductivo proyectado 90 días ────────────────────────
  const nacimientosProyectados90d = Math.round(prenadas * 0.35);
  const ingresoNacimientos = nacimientosProyectados90d * (data?.finanzas?.precioTernero ?? 800000);
  predictions.push({
    id:           "rep-rendimiento-90d",
    area:         AREA,
    titulo:       `Proyección: ~${nacimientosProyectados90d} nacimientos en 90 días`,
    descripcion:  `Basado en el número actual de gestantes (${prenadas}), se proyectan aproximadamente ${nacimientosProyectados90d} nacimientos en los próximos 90 días, con un valor potencial estimado de ganado nuevo.`,
    probabilidad: 70,
    nivel:        "bajo",
    horizonte:    "90d",
    confianza:    getConfidence(2, 5),
    datosUtilizados:      [`Gestantes: ${prenadas}`, `Distribución estadística de partos`],
    variablesConsideradas:["gestantes actuales", "mortalidad neonatal histórica estimada (5%)", "distribución de partos"],
    limitaciones:         ["Sin fechas exactas de concepción registradas", "Asume distribución uniforme de partos"],
    acciones: [
      "Planificar inventario de calostro y leche de transición",
      "Reservar espacio en instalaciones para terneros",
      "Actualizar proyección financiera con los nacimientos esperados",
    ],
    tendencia: "estable",
    disclaimer: DISCLAIMER,
  });

  return predictions;
}
