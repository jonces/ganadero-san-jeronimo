/**
 * Simulador de escenarios ganaderos — proyecciones "¿Qué pasa si…?".
 */

/**
 * @param {object} dashData   — Datos actuales de la finca
 * @param {object} escenario  — Cambio a simular
 * @param {string} escenario.tipo   — Tipo de escenario
 * @param {object} escenario.params — Parámetros del escenario
 * @returns {import('../types').SimulationResult}
 */
export function simular(dashData, escenario) {
  const handlers = {
    vender_animales:    simVenta,
    comprar_animales:   simCompra,
    cambiar_sistema:    simSistema,
    aumentar_potreros:  simPotreros,
    cambiar_alimentacion: simAlimentacion,
    aumentar_precio:    simPrecio,
  };

  const handler = handlers[escenario.tipo];
  if (!handler) return { error: "Tipo de escenario no reconocido" };
  return handler(dashData, escenario.params);
}

// ── Handlers de escenarios ────────────────────────────────────────────────

function simVenta(data, params) {
  const { cantidad = 10, precioKg = 5000, pesoPromedio = 450 } = params;
  const ingreso      = cantidad * pesoPromedio * precioKg;
  const nuevosAnim   = (data.animalesActivos ?? 0) - cantidad;
  const nuevoValor   = (data.valorEstimadoHato ?? 0) - ingreso;
  const nuevaCaja    = (data.cajaDisponible    ?? 0) + ingreso;

  return {
    tipo: "vender_animales",
    titulo: `¿Qué pasa si vendo ${cantidad} animales?`,
    escenario: { cantidad, precioKg, pesoPromedio },
    proyecciones: [
      { label: "Ingreso por venta",       actual: null, proyectado: ingreso, formato: "moneda", positivo: true },
      { label: "Animales en el hato",     actual: data.animalesActivos, proyectado: nuevosAnim, formato: "numero" },
      { label: "Valor del hato",          actual: data.valorEstimadoHato, proyectado: nuevoValor, formato: "moneda" },
      { label: "Caja disponible",         actual: data.cajaDisponible, proyectado: nuevaCaja, formato: "moneda", positivo: true },
    ],
    analisis: [
      `Vender ${cantidad} animales genera un ingreso de ${fmtCOP(ingreso)}.`,
      `El hato quedaría con ${nuevosAnim} animales activos.`,
      nuevoCaja > 0
        ? `La caja disponible aumentaría a ${fmtCOP(nuevaCaja)}.`
        : "La caja quedaría comprometida. Evalúa el timing de la venta.",
    ],
    recomendaciones: [
      cantidad > (data.animalesActivos ?? 0) * 0.3
        ? "⚠️ Vender más del 30% del hato puede afectar la capacidad reproductiva futura."
        : "✅ Una venta moderada puede mejorar el flujo de caja sin impactar el hato base.",
    ],
  };
}

function simCompra(data, params) {
  const { cantidad = 20, precioUnidad = 2500000, categoria = "novillas" } = params;
  const costo       = cantidad * precioUnidad;
  const nuevosAnim  = (data.animalesActivos ?? 0) + cantidad;
  const nuevoValor  = (data.valorEstimadoHato ?? 0) + costo;
  const nuevaCaja   = (data.cajaDisponible   ?? 0) - costo;
  const nuevaDeuda  = (data.cuentasPagar     ?? 0) + (nuevaCaja < 0 ? Math.abs(nuevaCaja) : 0);

  return {
    tipo: "comprar_animales",
    titulo: `¿Qué pasa si compro ${cantidad} ${categoria}?`,
    escenario: { cantidad, precioUnidad, categoria },
    proyecciones: [
      { label: "Inversión requerida",     actual: null, proyectado: costo, formato: "moneda", positivo: false },
      { label: "Animales en el hato",     actual: data.animalesActivos, proyectado: nuevosAnim, formato: "numero", positivo: true },
      { label: "Valor del hato",          actual: data.valorEstimadoHato, proyectado: nuevoValor, formato: "moneda", positivo: true },
      { label: "Caja disponible",         actual: data.cajaDisponible, proyectado: Math.max(0, nuevaCaja), formato: "moneda" },
    ],
    analisis: [
      `Comprar ${cantidad} ${categoria} requiere una inversión de ${fmtCOP(costo)}.`,
      nuevaCaja < 0
        ? `⚠️ La caja actual (${fmtCOP(data.cajaDisponible ?? 0)}) no cubre la compra. Considera financiamiento.`
        : `La caja disponible cubre la inversión. Quedaría con ${fmtCOP(nuevaCaja)}.`,
      `El hato crecería a ${nuevosAnim} animales, aumentando el valor estimado a ${fmtCOP(nuevoValor)}.`,
    ],
    recomendaciones: [
      nuevaCaja < 0
        ? "Considera crédito Finagro o financiamiento del vendedor (30–60 días)."
        : "✅ Compra viable con flujo actual.",
      "Asegúrate de tener capacidad forrajera suficiente para los nuevos animales.",
    ],
  };
}

function simSistema(data, params) {
  const { sistema = "intensivo" } = params;
  const configs = {
    extensivo:    { multGMD: 0.7, multCapacidad: 1.0, costoExtra: 0,          label: "Extensivo (pastoreo libre)" },
    semi:         { multGMD: 1.0, multCapacidad: 1.0, costoExtra: 500000,     label: "Semi-intensivo (rotación simple)" },
    intensivo:    { multGMD: 1.3, multCapacidad: 1.5, costoExtra: 2000000,    label: "Intensivo (suplementado)" },
    silvopastoril:{ multGMD: 1.2, multCapacidad: 2.0, costoExtra: 3000000,    label: "Silvopastoril (SSP)" },
  };
  const cfg = configs[sistema] ?? configs.semi;

  const gmActual = 600; // g/día estimado sin datos específicos
  const nuevaGMD = Math.round(gmActual * cfg.multGMD);
  const nuevoCapacidad = Math.round((data.animalesActivos ?? 50) * cfg.multCapacidad);
  const nuevosGastosMes = (data.gastosMes?.total ?? 0) + cfg.costoExtra;
  const mejoraMes = cfg.costoExtra > 0
    ? nuevaGMD * (data.animalesActivos ?? 50) * 30 / 1000 * 5000 - cfg.costoExtra
    : 0;

  return {
    tipo: "cambiar_sistema",
    titulo: `¿Qué pasa si cambio a sistema ${cfg.label}?`,
    escenario: { sistema, label: cfg.label },
    proyecciones: [
      { label: "GMD estimada",            actual: gmActual, proyectado: nuevaGMD, formato: "gramos", positivo: cfg.multGMD > 1 },
      { label: "Capacidad de carga",      actual: data.animalesActivos ?? 0, proyectado: nuevoCapacidad, formato: "numero", positivo: true },
      { label: "Costo adicional/mes",     actual: 0, proyectado: cfg.costoExtra, formato: "moneda" },
      { label: "Mejora ingreso estimado", actual: null, proyectado: mejoraMes, formato: "moneda", positivo: mejoraMes > 0 },
    ],
    analisis: [
      `Con sistema ${cfg.label} la GMD estimada sería de ${nuevaGMD} g/día.`,
      `La capacidad del potrero podría aumentar a ~${nuevoCapacidad} animales.`,
      cfg.costoExtra > 0
        ? `El costo adicional mensual sería de ${fmtCOP(cfg.costoExtra)}.`
        : "El cambio no requiere inversión adicional significativa.",
    ],
    recomendaciones: [
      sistema === "silvopastoril"
        ? "El SSP puede aplicar a incentivos ICR de Finagro. Consulta con el banco agrario."
        : "Implementa gradualmente comenzando con un potrero piloto.",
    ],
  };
}

function simPotreros(data, params) {
  const { hectareasNuevas = 10, tipoGraminea = "brachiaria" } = params;
  const cargas = { brachiaria: 2.0, kikuyu: 3.5, estrella: 3.0, guinea: 2.5 };
  const cargaPorHa = cargas[tipoGraminea] ?? 2.0;
  const nuevosAnimales = Math.round(hectareasNuevas * cargaPorHa);
  const ingresoExtra = nuevosAnimales * 2500000 * 0.15; // 15% retorno anual estimado

  return {
    tipo: "aumentar_potreros",
    titulo: `¿Qué pasa si aumento ${hectareasNuevas} ha de potrero?`,
    escenario: { hectareasNuevas, tipoGraminea },
    proyecciones: [
      { label: "Animales adicionales soportables", actual: 0, proyectado: nuevosAnimales, formato: "numero", positivo: true },
      { label: "Ingreso adicional anual estimado",  actual: null, proyectado: ingresoExtra, formato: "moneda", positivo: true },
    ],
    analisis: [
      `Con ${hectareasNuevas} ha de ${tipoGraminea} puedes soportar ~${nuevosAnimales} animales adicionales.`,
      `El ingreso adicional estimado sería de ${fmtCOP(ingresoExtra)} por año.`,
    ],
    recomendaciones: [
      "Asegúrate de contar con fuente de agua para los nuevos potreros.",
      "Instala cercas y bebederos antes de introducir los animales.",
    ],
  };
}

function simAlimentacion(data, params) {
  const { cambio = "suplementacion" } = params;
  const configs = {
    suplementacion: { costoAnimal: 35000, mejorGMD: 200, label: "suplementación estratégica" },
    bloque_mineral: { costoAnimal: 15000, mejorGMD: 80,  label: "bloque mineral" },
    silo:           { costoAnimal: 20000, mejorGMD: 150, label: "ensilaje de reserva" },
  };
  const cfg = configs[cambio] ?? configs.suplementacion;
  const n = data.animalesActivos ?? 50;
  const costoTotal = n * cfg.costoAnimal;
  const mejoraPeso = cfg.mejorGMD * 30 / 1000 * n; // kg extra por mes
  const ingresoExtra = mejoraPeso * 5000;
  const roi = ((ingresoExtra - costoTotal) / costoTotal * 100).toFixed(0);

  return {
    tipo: "cambiar_alimentacion",
    titulo: `¿Qué pasa si implemento ${cfg.label}?`,
    escenario: { cambio, label: cfg.label },
    proyecciones: [
      { label: "Costo adicional/mes",       actual: 0, proyectado: costoTotal, formato: "moneda" },
      { label: "GMD extra estimada",        actual: null, proyectado: cfg.mejorGMD, formato: "gramos", positivo: true },
      { label: "Ingreso extra estimado/mes",actual: null, proyectado: ingresoExtra, formato: "moneda", positivo: true },
      { label: "ROI estimado",              actual: null, proyectado: parseFloat(roi), formato: "porcentaje", positivo: parseFloat(roi) > 0 },
    ],
    analisis: [
      `Implementar ${cfg.label} costaría ${fmtCOP(costoTotal)}/mes para ${n} animales.`,
      `Se estima una mejora de ${cfg.mejorGMD} g/día en GMD, generando ${fmtCOP(ingresoExtra)} adicionales/mes.`,
      `ROI estimado: ${roi}%`,
    ],
    recomendaciones: [
      parseFloat(roi) > 20
        ? "✅ La inversión tiene ROI positivo. Recomendado implementar."
        : "Evalúa reducir el costo por animal o aumentar el volumen para mejorar el ROI.",
    ],
  };
}

function simPrecio(data, params) {
  const { pctAumento = 10 } = params;
  const precioActual   = data.ventasMes?.total ?? 0;
  const nuevoPrecio    = precioActual * (1 + pctAumento / 100);
  const diferencia     = nuevoPrecio - precioActual;
  const nuevoMargen    = data.margenGanancia != null ? data.margenGanancia + pctAumento * 0.6 : null;

  return {
    tipo: "aumentar_precio",
    titulo: `¿Qué pasa si aumento precios un ${pctAumento}%?`,
    escenario: { pctAumento },
    proyecciones: [
      { label: "Ingresos mensuales actuales",    actual: precioActual, proyectado: nuevoPrecio, formato: "moneda", positivo: true },
      { label: "Ingreso adicional mensual",      actual: null, proyectado: diferencia, formato: "moneda", positivo: true },
      nuevoMargen != null
        ? { label: "Nuevo margen estimado",       actual: data.margenGanancia, proyectado: nuevoMargen, formato: "porcentaje", positivo: true }
        : null,
    ].filter(Boolean),
    analisis: [
      `Un aumento del ${pctAumento}% generaría ${fmtCOP(diferencia)} adicionales por mes.`,
      nuevoMargen != null ? `El margen de ganancia estimado sería del ${nuevoMargen.toFixed(1)}%.` : "",
    ],
    recomendaciones: [
      "Asegúrate de que el mercado local soporte el aumento de precio.",
      "Diferencia por calidad (trazabilidad, BPA) para justificar precio mayor.",
    ],
  };
}

/** Escenarios predefinidos para acceso rápido en la UI */
export const ESCENARIOS_RAPIDOS = [
  { tipo: "vender_animales",     label: "Vender animales",           icono: "🤝", params: { cantidad: 20, precioKg: 5000, pesoPromedio: 450 } },
  { tipo: "comprar_animales",    label: "Comprar novillas",          icono: "🛒", params: { cantidad: 20, precioUnidad: 2500000, categoria: "novillas" } },
  { tipo: "cambiar_sistema",     label: "Ir a silvopastoril",        icono: "🌳", params: { sistema: "silvopastoril" } },
  { tipo: "aumentar_potreros",   label: "Ampliar potreros",          icono: "🌿", params: { hectareasNuevas: 20, tipoGraminea: "brachiaria" } },
  { tipo: "cambiar_alimentacion",label: "Agregar suplementación",    icono: "🌾", params: { cambio: "suplementacion" } },
  { tipo: "aumentar_precio",     label: "Aumentar precio de venta",  icono: "📈", params: { pctAumento: 10 } },
];

function fmtCOP(n) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n ?? 0);
}
