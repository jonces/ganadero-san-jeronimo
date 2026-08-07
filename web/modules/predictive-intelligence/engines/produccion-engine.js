/**
 * Motor predictivo de producción.
 * Predice: peso, leche, destetes, nacimientos, ventas.
 */
import { getRiskLevel, getConfidence, DISCLAIMER } from "../constants/risk-levels.js";

const AREA = "produccion";

// GMD promedio por sistema (g/día)
const GMD_REF = { extensivo: 350, semi: 550, intensivo: 750, silvopastoril: 500 };
// Precio promedio kg en pie Colombia 2024
const PRECIO_KG_REFERENCIA = 8500;

export function runProduccionEngine(data, extras = {}) {
  const predictions = [];
  const hato   = data?.hato     ?? {};
  const stats  = data?.stats    ?? {};
  const fin    = data?.finanzas ?? {};

  const novillos  = hato.novillos  ?? 0;
  const terneros  = hato.terneros  ?? 0;
  const vacas     = hato.vacas     ?? 0;
  const prenadas  = hato.prenadas  ?? 0;
  const sistema   = hato.sistema   ?? "semi";
  const gmd       = GMD_REF[sistema] ?? 500;

  // ── 1. Proyección de peso / ganancia 30-90 días ─────────────────────────
  if (novillos > 0) {
    const pesoActualEstimado = hato.pesoPromedioNovillos ?? 280; // kg
    const gananciaMes        = Math.round(gmd * 30 / 1000); // kg/mes
    const peso30d  = pesoActualEstimado + gananciaMes;
    const peso90d  = pesoActualEstimado + gananciaMes * 3;
    const valor30d = Math.round(novillos * peso30d * PRECIO_KG_REFERENCIA);
    const valor90d = Math.round(novillos * peso90d * PRECIO_KG_REFERENCIA);

    predictions.push({
      id:           "prod-peso-novillos",
      area:         AREA,
      titulo:       `Proyección de peso: novillos a ${peso30d} kg en 30 días`,
      descripcion:  `Con una GMD estimada de ${gmd} g/día para sistema ${sistema}, los ${novillos} novillos ganarían ~${gananciaMes} kg/mes. A 30 días: ~${peso30d} kg/animal (valor total: ${formatCOP(valor30d)}). A 90 días: ~${peso90d} kg/animal (valor total: ${formatCOP(valor90d)}).`,
      probabilidad: 70,
      nivel:        "bajo",
      horizonte:    "30d",
      confianza:    getConfidence(3, 6),
      datosUtilizados:  [`Novillos: ${novillos}`, `Sistema: ${sistema}`, `Peso estimado: ${pesoActualEstimado} kg`, `GMD referencia: ${gmd} g/día`],
      variablesConsideradas: ["GMD por sistema productivo", "peso promedio estimado", "precio de referencia kg en pie"],
      limitaciones:          ["Sin pesajes reales registrados en sistema", "GMD variable según nutrición y sanidad individual", "Precio de mercado puede variar"],
      acciones: [
        "Registrar pesajes reales para mejorar la precisión de la predicción",
        `Evaluar venta cuando novillos superen ${hato.pesoVenta ?? 420} kg`,
        "Ajustar plan de alimentación según GMD objetivo",
      ],
      proyeccion: { actual: pesoActualEstimado, proyectado: peso90d, formato: "numero", unidad: "kg" },
      tendencia: "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 2. Proyección de destetes ─────────────────────────────────────────────
  if (prenadas > 0 || terneros > 0) {
    const destetes90d = Math.round((prenadas * 0.3) + terneros * 0.5);
    if (destetes90d > 0) {
      predictions.push({
        id:           "prod-destetes",
        area:         AREA,
        titulo:       `~${destetes90d} destetes proyectados en 90 días`,
        descripcion:  `Considerando gestantes y terneros lactantes actuales, se proyectan aproximadamente ${destetes90d} destetes en los próximos 90 días. Planificar instalaciones y manejo post-destete.`,
        probabilidad: 65,
        nivel:        "bajo",
        horizonte:    "90d",
        confianza:    getConfidence(2, 4),
        datosUtilizados:  [`Gestantes: ${prenadas}`, `Terneros en cría: ${terneros}`],
        variablesConsideradas: ["gestantes", "terneros lactantes", "mortalidad neonatal estimada (5%)"],
        limitaciones:          ["Sin fechas exactas de nacimiento registradas"],
        acciones: [
          "Preparar instalaciones para terneros post-destete",
          "Planificar alimento de arranque para terneros destetados",
          "Registrar pesos al destete para evaluar desempeño de cría",
        ],
        tendencia: "estable",
        disclaimer: DISCLAIMER,
      });
    }
  }

  // ── 3. Proyección de producción de leche ──────────────────────────────────
  const litrosDia = stats?.litrosDia ?? hato.produccionLeche ?? 0;
  if (litrosDia > 0) {
    const vacasOrdeño = hato.vacasOrdeño ?? Math.round(vacas * 0.7);
    const proyeccion30d = litrosDia * 30 * 0.97; // pequeña caída natural
    const proyeccion90d = litrosDia * 90 * 0.94;
    const tendenciaLeche = hato.tendenciaLeche ?? 0; // % mensual
    const valorLeche30d = Math.round(proyeccion30d * (fin.precioLeche ?? 1200));

    predictions.push({
      id:           "prod-leche",
      area:         AREA,
      titulo:       `Producción de leche proyectada: ${Math.round(proyeccion30d).toLocaleString()} lt (30 días)`,
      descripcion:  `Con ${litrosDia} lt/día actuales y ${vacasOrdeño} vacas en ordeño, la proyección a 30 días es ${Math.round(proyeccion30d).toLocaleString()} litros (valor estimado: ${formatCOP(valorLeche30d)}). A 90 días: ${Math.round(proyeccion90d).toLocaleString()} lt, considerando la curva natural de lactación.`,
      probabilidad: 72,
      nivel:        "bajo",
      horizonte:    "30d",
      confianza:    getConfidence(3, 5),
      datosUtilizados:  [`Producción actual: ${litrosDia} lt/día`, `Vacas en ordeño: ${vacasOrdeño}`],
      variablesConsideradas: ["producción diaria actual", "curva de lactación", "vacas en ordeño", "precio de leche"],
      limitaciones:          ["Sin etapa de lactación individual por vaca", "Sin datos de CCS que afecten calidad"],
      acciones: [
        "Monitorear CCS mensualmente para mantener calidad",
        "Revisar protocolo de ordeño si la producción baja más del 5% en un mes",
        "Planificar secado de vacas con >300 días de lactación",
      ],
      proyeccion: { actual: litrosDia * 30, proyectado: Math.round(proyeccion30d), formato: "numero", unidad: "lt" },
      tendencia: tendenciaLeche < 0 ? "bajando" : "estable",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 4. Proyección de ventas de carne 90 días ──────────────────────────────
  if (novillos > 10) {
    const novillosParaVenta = Math.round(novillos * 0.3);
    const pesoPromedio = hato.pesoPromedioNovillos ?? 380;
    const valorVenta = novillosParaVenta * pesoPromedio * PRECIO_KG_REFERENCIA;

    predictions.push({
      id:           "prod-ventas-carne",
      area:         AREA,
      titulo:       `Oportunidad de venta: ~${novillosParaVenta} novillos en 90 días`,
      descripcion:  `Con ${novillos} novillos en el hato, se estima que ~${novillosParaVenta} estarán listos para venta en los próximos 90 días (>${hato.pesoVenta ?? 420} kg). Valor estimado: ${formatCOP(valorVenta)}.`,
      probabilidad: 60,
      nivel:        "bajo",
      horizonte:    "90d",
      confianza:    getConfidence(2, 5),
      datosUtilizados:  [`Novillos en hato: ${novillos}`, `Peso promedio estimado: ${pesoPromedio} kg`],
      variablesConsideradas: ["número de novillos", "peso de venta objetivo", "GMD estimada"],
      limitaciones:          ["Sin pesajes individuales reales", "Precio de mercado sujeto a variación"],
      acciones: [
        "Pesar novillos en los próximos 15 días para identificar los listos para venta",
        "Contactar compradores con anticipación para negociar precio",
        "Evaluar si convenga retener hasta mayor peso o vender al precio actual",
      ],
      proyeccion: { actual: 0, proyectado: valorVenta, formato: "moneda" },
      tendencia: "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  return predictions;
}

function formatCOP(val) {
  if (!val && val !== 0) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
}
