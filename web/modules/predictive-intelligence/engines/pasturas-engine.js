/**
 * Motor predictivo de pasturas.
 * Analiza carga animal, disponibilidad de forraje, rotación y riesgo de sobrepastoreo.
 */
import { getRiskLevel, getConfidence, DISCLAIMER } from "../constants/risk-levels.js";

const AREA = "pasturas";

// Referencias técnicas
const UA_HA_OPTIMO    = 1.5; // Unidades Animal por hectárea (trópico bajo)
const UA_HA_MAXIMO    = 2.5;
const DIAS_OCUPACION  = 3;   // días máximos por potrero (pastoreo intensivo)
const DIAS_DESCANSO   = 35;  // días de descanso recomendados (trópico)

// Factor de conversión a Unidades Animal
const UA_FACTOR = { vaca: 1.0, novillo: 0.8, ternero: 0.4, toro: 1.2, default: 1.0 };

export function runPasturasEngine(data, extras = {}) {
  const predictions = [];
  const hato        = data?.hato    ?? {};
  const finca       = data?.finca   ?? {};

  const vacas     = hato.vacas     ?? 0;
  const novillos  = hato.novillos  ?? 0;
  const terneros  = hato.terneros  ?? 0;
  const toros     = hato.toros     ?? 0;
  const hectareas = finca.hectareas ?? finca.area ?? hato.hectareas ?? 0;
  const potreros  = finca.potreros  ?? hato.potreros ?? 0;

  // Calcular UA total
  const uaTotal = (vacas * UA_FACTOR.vaca) + (novillos * UA_FACTOR.novillo) +
                  (terneros * UA_FACTOR.ternero) + (toros * UA_FACTOR.toro);

  const totalAnimales = vacas + novillos + terneros + toros;

  // ── 1. Carga animal y sobrepastoreo ───────────────────────────────────────
  if (hectareas > 0 && uaTotal > 0) {
    const uaHa  = uaTotal / hectareas;
    const exceso = uaHa - UA_HA_MAXIMO;
    const prob  = uaHa > UA_HA_MAXIMO ? Math.min(90, (exceso / UA_HA_MAXIMO) * 100 + 60)
                : uaHa > UA_HA_OPTIMO ? 35 : 15;

    predictions.push({
      id:           "past-carga-animal",
      area:         AREA,
      titulo:       `Carga animal: ${uaHa.toFixed(2)} UA/ha ${uaHa > UA_HA_MAXIMO ? "⚠️ SOBREPASTOREO" : "✓ Aceptable"}`,
      descripcion:  uaHa > UA_HA_MAXIMO
        ? `La carga animal actual (${uaHa.toFixed(2)} UA/ha) supera el máximo recomendado (${UA_HA_MAXIMO} UA/ha). Riesgo de degradación del pasto, erosión del suelo y desnutrición del hato.`
        : uaHa > UA_HA_OPTIMO
        ? `La carga animal (${uaHa.toFixed(2)} UA/ha) está dentro de los límites aceptables pero por encima del óptimo (${UA_HA_OPTIMO} UA/ha). Monitorear la recuperación de potreros.`
        : `La carga animal (${uaHa.toFixed(2)} UA/ha) es adecuada para las ${hectareas} ha disponibles.`,
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "30d",
      confianza:    getConfidence(3, 5),
      datosUtilizados:      [`UA total: ${uaTotal.toFixed(1)}`, `Hectáreas: ${hectareas}`, `Carga: ${uaHa.toFixed(2)} UA/ha`],
      variablesConsideradas:["unidades animal por especie", "hectáreas totales", "referencia tropical (max 2.5 UA/ha)"],
      limitaciones:         ["Sin datos de producción de forraje real por potrero", "No considera potreros en descanso"],
      acciones: uaHa > UA_HA_MAXIMO
        ? [
          `Reducir hato en ~${Math.ceil((uaTotal - UA_HA_MAXIMO * hectareas) / UA_FACTOR.novillo)} novillos o equivalente`,
          "Dividir potreros actuales para implementar rotación intensiva",
          "Resembrar potreros degradados si hay más del 30% de rastrojo",
        ]
        : ["Mantener carga actual y monitorear mensualmente", "Implementar rotación estricta"],
      proyeccion: { actual: uaHa, proyectado: UA_HA_OPTIMO, formato: "numero", unidad: "UA/ha" },
      tendencia: uaHa > UA_HA_MAXIMO ? "subiendo" : "estable",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 2. Disponibilidad de forraje en época seca ────────────────────────────
  const mes = new Date().getMonth();
  const esEpocaSeca = mes < 2 || mes > 10; // Dic–Feb aprox Colombia

  if (hectareas > 0) {
    const prob = esEpocaSeca ? 70 : 20;
    predictions.push({
      id:           "past-forraje-seco",
      area:         AREA,
      titulo:       esEpocaSeca ? "Riesgo de déficit forrajero — época seca" : "Forraje disponible — época de lluvias",
      descripcion:  esEpocaSeca
        ? `En época seca, la producción de forraje puede reducirse hasta un 60%. Con ${uaTotal.toFixed(0)} UA en ${hectareas} ha, el riesgo de subnutrición es ${prob > 60 ? "alto" : "moderado"}.`
        : `La época de lluvias favorece la producción forrajera. Aprovechar para aumentar disponibilidad de heno, ensilaje o banco de proteínas.`,
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "30d",
      confianza:    getConfidence(2, 5),
      datosUtilizados:      [`Época del año`, `Hectáreas: ${hectareas}`, `UA total: ${uaTotal.toFixed(0)}`],
      variablesConsideradas:["estacionalidad", "carga animal", "hectáreas disponibles"],
      limitaciones:         ["Sin datos de aforo real de potreros", "Sin historial de producción forrajera registrada"],
      acciones: esEpocaSeca
        ? ["Implementar suplementación estratégica (melaza, caña, bloque)", "Restringir acceso a potreros débiles", "Activar reservas de heno o ensilaje"]
        : ["Aprovechar para hacer heno/ensilaje de reserva", "Establecer banco de proteínas (mataratón, leucaena)", "Resembrar potreros degradados"],
      tendencia: esEpocaSeca ? "subiendo" : "estable",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 3. Plan de rotación ───────────────────────────────────────────────────
  if (potreros > 0 && totalAnimales > 0) {
    const diasOcupacionActual = DIAS_DESCANSO / potreros;
    const okRotacion = diasOcupacionActual >= DIAS_DESCANSO * 0.7;
    const prob = okRotacion ? 20 : 55;

    predictions.push({
      id:           "past-rotacion",
      area:         AREA,
      titulo:       `Rotación: ${potreros} potreros — descanso ~${Math.round(diasOcupacionActual)} días`,
      descripcion:  okRotacion
        ? `Con ${potreros} potreros y ${totalAnimales} animales, el período de descanso estimado es de ~${Math.round(diasOcupacionActual)} días, cercano al óptimo (${DIAS_DESCANSO} días).`
        : `Con ${potreros} potreros, el período de descanso es insuficiente (~${Math.round(diasOcupacionActual)} días vs ${DIAS_DESCANSO} recomendados). Los pastos no se recuperan adecuadamente.`,
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "30d",
      confianza:    getConfidence(2, 4),
      datosUtilizados:      [`Potreros: ${potreros}`, `Animales: ${totalAnimales}`, `Descanso estimado: ${Math.round(diasOcupacionActual)} días`],
      variablesConsideradas:["número de potreros", "período de descanso recomendado (35 días trópico)"],
      limitaciones:         ["Sin datos de altura de pasto por potrero", "Sin registro de ocupación histórica"],
      acciones: !okRotacion
        ? [`Dividir potreros actuales — necesitas al menos ${Math.ceil(DIAS_DESCANSO / DIAS_OCUPACION)} potreros`, "Instalar cerca eléctrica para subdivisión económica"]
        : ["Mantener plan de rotación actual", "Registrar entrada/salida de cada potrero"],
      tendencia: okRotacion ? "estable" : "bajando",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 4. Necesidad de fertilización ─────────────────────────────────────────
  if (hectareas > 0) {
    const prob = esEpocaSeca ? 30 : 50;
    predictions.push({
      id:           "past-fertilizacion",
      area:         AREA,
      titulo:       `Evaluación de fertilización de potreros`,
      descripcion:  `${esEpocaSeca ? "Planificar" : "Momento óptimo para"} fertilización de potreros. Las lluvias actuales favorecen la respuesta a nitrógeno. Estimar ${Math.round(hectareas * 50)} kg de urea para ${hectareas} ha.`,
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "30d",
      confianza:    getConfidence(2, 5),
      datosUtilizados:      [`Hectáreas: ${hectareas}`, `Época lluviosa: ${!esEpocaSeca}`],
      variablesConsideradas:["estacionalidad", "hectáreas a fertilizar", "dosis referencial (50 kg urea/ha)"],
      limitaciones:         ["Sin análisis de suelo reciente", "Sin datos de especie forrajera por potrero"],
      acciones: [
        !esEpocaSeca ? "Aplicar urea (50 kg/ha) en los primeros días de lluvia" : "Posponer fertilización hasta las lluvias",
        "Realizar análisis de suelo si no se ha hecho en los últimos 2 años",
        "Considerar mezclas NPK según análisis de suelo",
      ],
      tendencia: "estable",
      disclaimer: DISCLAIMER,
    });
  }

  return predictions;
}
