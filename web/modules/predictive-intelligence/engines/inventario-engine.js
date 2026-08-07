/**
 * Motor predictivo de inventario.
 * Detecta con anticipación agotamientos de medicamentos, vacunas, minerales, concentrados.
 */
import { getRiskLevel, getConfidence, DISCLAIMER } from "../constants/risk-levels.js";

const AREA = "inventario";

// Días de anticipación recomendados para reposición por categoría
const REPOSICION_DIAS = {
  medicamento: 15,
  vacuna:      21,
  mineral:     10,
  vitamina:    10,
  concentrado: 7,
  material:    14,
  default:     10,
};

export function runInventarioEngine(data, extras = {}) {
  const predictions = [];
  const insumos     = extras.insumos ?? [];
  const hato        = data?.hato ?? {};
  const totalAnimales = (hato.vacas ?? 0) + (hato.novillos ?? 0) + (hato.terneros ?? 0) + (hato.toros ?? 0);

  if (insumos.length === 0) {
    predictions.push({
      id:           "inv-sin-datos",
      area:         AREA,
      titulo:       "Sin datos de inventario disponibles",
      descripcion:  "No hay registros de insumos en el sistema. Registrar medicamentos, vacunas y materiales para activar las predicciones de inventario.",
      probabilidad: 0,
      nivel:        "bajo",
      horizonte:    "30d",
      confianza:    "insuficiente",
      datosUtilizados:      [],
      variablesConsideradas:[],
      limitaciones:         ["Sin datos de inventario en el sistema"],
      acciones:             ["Registrar insumos en el módulo de Inventario para activar predicciones"],
      tendencia:  "estable",
      disclaimer: DISCLAIMER,
    });
    return predictions;
  }

  // ── Agrupar insumos en riesgo por categoría ───────────────────────────────
  const criticos = [];
  const proximos = [];
  const venciendo = [];

  for (const ins of insumos) {
    const categoria  = ins.categoria ?? "default";
    const diasRepo   = REPOSICION_DIAS[categoria] ?? REPOSICION_DIAS.default;
    const existencia = ins.existencia ?? ins.cantidad ?? 0;
    const stockMin   = ins.stockMinimo ?? ins.minimo ?? 0;
    const consumoDia = ins.consumoDiario ?? (ins.consumoMensual ? ins.consumoMensual / 30 : null);
    const diasRestantes = consumoDia > 0 ? Math.round(existencia / consumoDia) : null;
    const fechaVencimiento = ins.fechaVencimiento ? new Date(ins.fechaVencimiento) : null;
    const diasAlVencimiento = fechaVencimiento
      ? Math.round((fechaVencimiento - Date.now()) / 86400000)
      : null;

    // Stock crítico
    if (existencia <= stockMin && stockMin > 0) {
      criticos.push({ ...ins, diasRestantes, diasAlVencimiento });
    }
    // Agotamiento próximo por consumo
    else if (diasRestantes !== null && diasRestantes <= diasRepo) {
      proximos.push({ ...ins, diasRestantes, diasAlVencimiento });
    }
    // Vencimiento próximo
    if (diasAlVencimiento !== null && diasAlVencimiento <= 30 && diasAlVencimiento > 0) {
      venciendo.push({ ...ins, diasRestantes, diasAlVencimiento });
    }
  }

  // ── 1. Insumos en stock crítico ───────────────────────────────────────────
  if (criticos.length > 0) {
    predictions.push({
      id:           "inv-critico",
      area:         AREA,
      titulo:       `${criticos.length} insumo(s) en stock crítico`,
      descripcion:  `Los siguientes insumos están por debajo del stock mínimo: ${criticos.map(i => i.nombre).join(", ")}. Riesgo de desabastecimiento inmediato.`,
      probabilidad: 90,
      nivel:        getRiskLevel(90),
      horizonte:    "7d",
      confianza:    getConfidence(3, 3),
      datosUtilizados:      criticos.map(i => `${i.nombre}: ${i.existencia ?? 0} / mínimo ${i.stockMinimo ?? 0}`),
      variablesConsideradas:["stock actual", "stock mínimo definido"],
      limitaciones:         [],
      acciones:             criticos.map(i => `Reponer ${i.nombre} inmediatamente (stock: ${i.existencia ?? 0})`),
      tendencia:  "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 2. Insumos próximos a agotarse ────────────────────────────────────────
  if (proximos.length > 0) {
    predictions.push({
      id:           "inv-proximos-agotar",
      area:         AREA,
      titulo:       `${proximos.length} insumo(s) se agotan en los próximos días`,
      descripcion:  `Los siguientes insumos se agotarán pronto según el consumo actual: ${proximos.map(i => `${i.nombre} (~${i.diasRestantes} días)`).join(", ")}.`,
      probabilidad: 78,
      nivel:        getRiskLevel(78),
      horizonte:    "30d",
      confianza:    getConfidence(3, 4),
      datosUtilizados:      proximos.map(i => `${i.nombre}: ~${i.diasRestantes} días restantes`),
      variablesConsideradas:["stock actual", "consumo diario estimado"],
      limitaciones:         ["Consumo diario basado en promedio mensual"],
      acciones:             proximos.map(i => `Programar compra de ${i.nombre} en máximo ${Math.max(1, (i.diasRestantes ?? 14) - 7)} días`),
      tendencia: "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 3. Insumos próximos a vencer ──────────────────────────────────────────
  if (venciendo.length > 0) {
    predictions.push({
      id:           "inv-vencimiento",
      area:         AREA,
      titulo:       `${venciendo.length} insumo(s) próximos a vencer`,
      descripcion:  `Los siguientes insumos vencen en menos de 30 días: ${venciendo.map(i => `${i.nombre} (${i.diasAlVencimiento} días)`).join(", ")}. Usar antes de vencimiento o gestionar devolución.`,
      probabilidad: 95,
      nivel:        getRiskLevel(95),
      horizonte:    "30d",
      confianza:    getConfidence(3, 3),
      datosUtilizados:      venciendo.map(i => `${i.nombre}: vence en ${i.diasAlVencimiento} días`),
      variablesConsideradas:["fecha de vencimiento registrada", "existencia disponible"],
      limitaciones:         [],
      acciones:             venciendo.map(i => `Usar o gestionar ${i.nombre} antes de ${new Date(i.fechaVencimiento).toLocaleDateString("es-CO")}`),
      tendencia: "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 4. Estimación de consumo mineral por tamaño de hato ──────────────────
  if (totalAnimales > 0) {
    const mineralMensual = Math.round(totalAnimales * 0.08); // ~80g/animal/día → kg/mes
    predictions.push({
      id:           "inv-minerales-estimado",
      area:         AREA,
      titulo:       `Consumo estimado de sal/mineral: ${mineralMensual} kg/mes`,
      descripcion:  `Con ${totalAnimales} animales en pastoreo y un consumo promedio de 80 g/animal/día, se estima un consumo mensual de ${mineralMensual} kg de sal mineralizada. Verificar stock disponible.`,
      probabilidad: 70,
      nivel:        "bajo",
      horizonte:    "30d",
      confianza:    getConfidence(2, 4),
      datosUtilizados:      [`Total animales: ${totalAnimales}`, `Consumo promedio referencia: 80 g/animal/día`],
      variablesConsideradas:["número de animales", "consumo promedio referencial"],
      limitaciones:         ["Sin registro de consumo real por potrero", "Varía por tipo de mineral y disponibilidad de pasto"],
      acciones:             [`Verificar que haya stock ≥ ${mineralMensual * 2} kg de sal mineralizada`, "Revisar saladeros cada 15 días"],
      tendencia: "estable",
      disclaimer: DISCLAIMER,
    });
  }

  return predictions;
}
