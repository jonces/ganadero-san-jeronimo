/**
 * Motor predictivo financiero.
 * Predice: ingresos, gastos, flujo de caja, rentabilidad, punto de equilibrio.
 */
import { getRiskLevel, getConfidence, DISCLAIMER } from "../constants/risk-levels.js";

const AREA = "finanzas";

export function runFinanzasEngine(data, extras = {}) {
  const predictions = [];
  const fin  = data?.finanzas ?? {};
  const hato = data?.hato     ?? {};

  const ingresos      = fin.ingresos      ?? 0;
  const gastos        = fin.gastos        ?? 0;
  const gananciaNeta  = fin.gananciaNeta  ?? (ingresos - gastos);
  const margen        = ingresos > 0 ? (gananciaNeta / ingresos) * 100 : 0;
  const caja          = fin.cajaDisponible  ?? 0;
  const cuentasPagar  = fin.cuentasPagar    ?? 0;
  const meses         = data?.graficaMeses  ?? [];

  // ── 1. Proyección de flujo de caja 30 días ────────────────────────────────
  const tendenciaGastos = calcularTendencia(meses.map(m => m.gastos ?? 0));
  const gastosProyectados30d = Math.round(gastos * (1 + tendenciaGastos * 0.01));
  const ingresosProyectados30d = Math.round(ingresos * 1.02); // crecimiento conservador 2%
  const flujoProy = ingresosProyectados30d - gastosProyectados30d;
  const cajaFinal = caja + flujoProy;
  const riesgoLiquidez = cajaFinal < 0 || (cuentasPagar > caja * 1.1);

  predictions.push({
    id:           "fin-flujo-30d",
    area:         AREA,
    titulo:       `Flujo de caja proyectado: ${formatCOP(flujoProy)} en 30 días`,
    descripcion:  riesgoLiquidez
      ? `⚠️ Riesgo de liquidez detectado. Con gastos proyectados de ${formatCOP(gastosProyectados30d)} e ingresos estimados de ${formatCOP(ingresosProyectados30d)}, la caja podría quedar en ${formatCOP(cajaFinal)}.`
      : `El flujo de caja proyectado para los próximos 30 días es positivo: ${formatCOP(flujoProy)}. Caja estimada al mes: ${formatCOP(cajaFinal)}.`,
    probabilidad: riesgoLiquidez ? 75 : 40,
    nivel:        riesgoLiquidez ? getRiskLevel(75) : "bajo",
    horizonte:    "30d",
    confianza:    getConfidence(meses.length + 2, 6),
    datosUtilizados:  [
      `Ingresos mes actual: ${formatCOP(ingresos)}`,
      `Gastos mes actual: ${formatCOP(gastos)}`,
      `Caja disponible: ${formatCOP(caja)}`,
      `Cuentas por pagar: ${formatCOP(cuentasPagar)}`,
    ],
    variablesConsideradas: ["ingresos actuales", "gastos actuales", "tendencia histórica de gastos", "cuentas por pagar"],
    limitaciones:          ["Sin datos de ingresos futuros confirmados", "Proyección basada en tendencia de hasta 6 meses"],
    acciones: riesgoLiquidez
      ? ["Priorizar cobro de cuentas pendientes", "Posponer compras no urgentes", "Evaluar línea de crédito si es necesario"]
      : ["Mantener disciplina de gastos actual", "Considerar inversiones con el excedente"],
    proyeccion: { actual: gananciaNeta, proyectado: flujoProy, formato: "moneda" },
    tendencia: flujoProy >= gananciaNeta ? "subiendo" : "bajando",
    disclaimer: DISCLAIMER,
  });

  // ── 2. Rentabilidad proyectada 90 días ────────────────────────────────────
  const margenProy90d = Math.max(0, margen + tendenciaGastos * -0.5); // gastos suben, margen baja
  const riesgoRentabilidad = margenProy90d < 10;

  predictions.push({
    id:           "fin-margen-90d",
    area:         AREA,
    titulo:       `Margen proyectado a 90 días: ${margenProy90d.toFixed(1)}%`,
    descripcion:  riesgoRentabilidad
      ? `La tendencia de gastos indica que el margen de rentabilidad puede caer por debajo del 10% en los próximos 90 días. Se requieren acciones para controlar costos o aumentar ingresos.`
      : `El margen de rentabilidad se mantiene proyectado en ${margenProy90d.toFixed(1)}% para los próximos 90 días, dentro del rango aceptable (>10%).`,
    probabilidad: riesgoRentabilidad ? 70 : 35,
    nivel:        riesgoRentabilidad ? getRiskLevel(70) : "bajo",
    horizonte:    "90d",
    confianza:    getConfidence(meses.length + 1, 6),
    datosUtilizados:  [`Margen actual: ${margen.toFixed(1)}%`, `Tendencia gastos: ${tendenciaGastos > 0 ? "+" : ""}${tendenciaGastos.toFixed(1)}%/mes`],
    variablesConsideradas: ["margen de ganancia actual", "tendencia histórica de costos", "ingresos proyectados"],
    limitaciones:          ["Sin datos de precios futuros de insumos", "Asume estabilidad de precios de venta"],
    acciones: riesgoRentabilidad
      ? ["Identificar los 3 principales costos controlables", "Revisar precios de venta vs costos de producción", "Optimizar eficiencia productiva por animal"]
      : ["Monitorear mensualmente para detectar desviaciones"],
    proyeccion: { actual: margen, proyectado: margenProy90d, formato: "porcentaje" },
    tendencia: margenProy90d < margen ? "bajando" : "estable",
    disclaimer: DISCLAIMER,
  });

  // ── 3. Punto de equilibrio ────────────────────────────────────────────────
  if (gastos > 0) {
    const puntoEquilibrio = gastos; // ingresos mínimos necesarios
    const distancia = ingresos - puntoEquilibrio;
    const margenSeguridad = ingresos > 0 ? (distancia / ingresos) * 100 : 0;
    const prob = margenSeguridad < 10 ? 80 : margenSeguridad < 25 ? 50 : 20;

    predictions.push({
      id:           "fin-punto-equilibrio",
      area:         AREA,
      titulo:       `Margen de seguridad sobre punto de equilibrio: ${margenSeguridad.toFixed(1)}%`,
      descripcion:  margenSeguridad < 10
        ? `⚠️ La finca opera muy cerca del punto de equilibrio (${formatCOP(puntoEquilibrio)}). Un aumento de costos o caída de ingresos del ${margenSeguridad.toFixed(0)}% generaría pérdidas.`
        : `El punto de equilibrio es ${formatCOP(puntoEquilibrio)}. Los ingresos actuales superan este umbral en ${formatCOP(distancia)}, dando un margen de seguridad del ${margenSeguridad.toFixed(1)}%.`,
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "6m",
      confianza:    getConfidence(3, 4),
      datosUtilizados:  [`Ingresos: ${formatCOP(ingresos)}`, `Gastos totales: ${formatCOP(gastos)}`],
      variablesConsideradas: ["costos fijos", "costos variables", "ingresos actuales"],
      limitaciones:          ["Asume estructura de costos estable", "Sin separación de costos fijos/variables"],
      acciones: margenSeguridad < 10
        ? ["Aumentar producción o precio de venta para ampliar margen", "Reducir costos variables no productivos"]
        : ["Mantener control de costos para preservar margen de seguridad"],
      proyeccion: { actual: ingresos, proyectado: puntoEquilibrio, formato: "moneda" },
      tendencia: margenSeguridad < 15 ? "subiendo" : "estable",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 4. Proyección capital e inversión 1 año ───────────────────────────────
  const capitalAnual = gananciaNeta * 12;
  predictions.push({
    id:           "fin-capital-1y",
    area:         AREA,
    titulo:       `Capital proyectado en 1 año: ${formatCOP(capitalAnual)}`,
    descripcion:  `Si se mantiene el ritmo financiero actual, la utilidad acumulada en los próximos 12 meses sería de aproximadamente ${formatCOP(capitalAnual)}, disponibles para reinversión o distribución.`,
    probabilidad: 60,
    nivel:        capitalAnual < 0 ? getRiskLevel(80) : "bajo",
    horizonte:    "1y",
    confianza:    getConfidence(2, 5),
    datosUtilizados:  [`Ganancia neta mensual: ${formatCOP(gananciaNeta)}`],
    variablesConsideradas: ["ganancia neta mensual", "estacionalidad estimada", "tendencia de 12 meses"],
    limitaciones:          ["Alta incertidumbre a 12 meses", "No incluye variaciones estacionales de precios"],
    acciones: capitalAnual > 0
      ? ["Definir plan de inversión para el excedente proyectado", "Evaluar expansión de hato o infraestructura"]
      : ["Revisar estructura de costos urgentemente", "Buscar asesoría financiera especializada"],
    proyeccion: { actual: gananciaNeta, proyectado: capitalAnual, formato: "moneda" },
    tendencia: capitalAnual > 0 ? "estable" : "bajando",
    disclaimer: DISCLAIMER,
  });

  return predictions;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function calcularTendencia(valores) {
  if (valores.length < 2) return 0;
  const ultimos = valores.filter(v => v > 0).slice(-3);
  if (ultimos.length < 2) return 0;
  const delta = ultimos[ultimos.length - 1] - ultimos[0];
  return ultimos[0] > 0 ? (delta / ultimos[0]) * 100 : 0;
}

function formatCOP(val) {
  if (!val && val !== 0) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
}
