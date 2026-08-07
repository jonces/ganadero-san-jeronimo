/**
 * Simulador de escenarios predictivos "¿Qué pasa si…?"
 * Genera proyecciones financieras y productivas con comparación gráfica.
 */

const PRECIO_KG   = 8500;
const PRECIO_LECHE = 1200;

export const ESCENARIOS_PREDICTIVOS = [
  {
    id:     "comprar-vacas",
    titulo: "¿Qué pasa si compro 100 vacas?",
    icono:  "🐄",
    tipo:   "comprar_vacas",
    params: { cantidad: 100, precioUnitario: 4500000, preñadas: 60 },
  },
  {
    id:     "vender-novillos",
    titulo: "¿Qué pasa si vendo 50 novillos?",
    icono:  "🤝",
    tipo:   "vender_novillos",
    params: { cantidad: 50, pesoPromedio: 400, precioKg: PRECIO_KG },
  },
  {
    id:     "aumentar-potreros",
    titulo: "¿Qué pasa si aumento los potreros?",
    icono:  "🌾",
    tipo:   "aumentar_potreros",
    params: { hectareasNuevas: 20, costoHa: 800000, tipoGraminea: "brachiaria" },
  },
  {
    id:     "sube-alimento",
    titulo: "¿Qué pasa si sube el precio del alimento 20%?",
    icono:  "📈",
    tipo:   "sube_insumos",
    params: { pctAumento: 20 },
  },
  {
    id:     "baja-ganado",
    titulo: "¿Qué pasa si baja el precio del ganado 15%?",
    icono:  "📉",
    tipo:   "baja_precio_ganado",
    params: { pctBaja: 15 },
  },
  {
    id:     "sistema-intensivo",
    titulo: "¿Qué pasa si paso a sistema intensivo?",
    icono:  "🏗️",
    tipo:   "cambiar_sistema",
    params: { sistemaNuevo: "intensivo", inversion: 80000000 },
  },
];

/**
 * Ejecuta un escenario predictivo y retorna la comparación.
 * @param {object} dashData — datos actuales de la finca
 * @param {object} escenario — { tipo, params }
 * @returns {EscenarioResult}
 */
export function simularEscenario(dashData, escenario) {
  const fn = SIMULADORES[escenario.tipo];
  if (!fn) return { error: "Escenario no reconocido" };
  try {
    return fn(dashData ?? {}, escenario.params ?? {});
  } catch (e) {
    return { error: e.message };
  }
}

const SIMULADORES = {

  comprar_vacas(data, { cantidad = 100, precioUnitario = 4500000, preñadas = 60 }) {
    const fin   = data.finanzas ?? {};
    const hato  = data.hato     ?? {};
    const inversion = cantidad * precioUnitario;
    const ingresosLeche = preñadas * 15 * PRECIO_LECHE * 305; // 305 días lactación
    const ingresosGanado = (cantidad - preñadas) * 380 * PRECIO_KG * 0.7; // engorde
    const gastosMant    = cantidad * 450000 * 12; // mantenimiento anual/animal
    const roi12m        = ingresosLeche + ingresosGanado - inversion - gastosMant;
    const roiPct        = ((roi12m / inversion) * 100).toFixed(1);

    return {
      titulo:    `Compra de ${cantidad} vacas`,
      escenario: escenario_desc(escenario),
      proyecciones: [
        { label: "Inversión total",           actual: 0,            proyectado: -inversion,         formato: "moneda",     positivo: false },
        { label: "Ingresos adicionales/año",  actual: fin.ingresos ?? 0, proyectado: (fin.ingresos ?? 0) + ingresosLeche + ingresosGanado, formato: "moneda", positivo: true },
        { label: "Retorno en 12 meses",       actual: 0,            proyectado: roi12m,             formato: "moneda",     positivo: roi12m > 0 },
        { label: "ROI proyectado",            actual: 0,            proyectado: parseFloat(roiPct), formato: "porcentaje", positivo: roi12m > 0 },
        { label: "Hato total proyectado",     actual: (hato.vacas ?? 0), proyectado: (hato.vacas ?? 0) + cantidad, formato: "numero", unidad: "animales", positivo: true },
      ],
      analisis: [
        `La inversión de ${fmt(inversion)} se recuperaría en aproximadamente ${roi12m > 0 ? Math.round(inversion/((roi12m)/12)) : "más de 24"} meses.`,
        `Se proyectan ${preñadas} vacas preñadas generando ingresos de leche y ${cantidad - preñadas} en engorde.`,
        roi12m > 0 ? `ROI positivo de ${roiPct}% en el primer año.` : "Analizar financiamiento antes de proceder.",
      ],
      recomendaciones: [
        "Evaluar capacidad de forraje antes de la compra — revisar UA/ha",
        "Negociar precio con al menos 3 proveedores",
        "Considerar financiamiento Finagro si no hay capital propio disponible",
        "Revisar capacidad de infraestructura (corrales, agua, ordeño)",
      ],
      timeline: [
        { mes: 1,  label: "Mes 1",  valor: -inversion },
        { mes: 3,  label: "Mes 3",  valor: -inversion + (ingresosLeche + ingresosGanado) / 4 - gastosMant / 4 },
        { mes: 6,  label: "Mes 6",  valor: -inversion + (ingresosLeche + ingresosGanado) / 2 - gastosMant / 2 },
        { mes: 12, label: "Mes 12", valor: roi12m },
      ],
    };
  },

  vender_novillos(data, { cantidad = 50, pesoPromedio = 400, precioKg = PRECIO_KG }) {
    const fin  = data.finanzas ?? {};
    const hato = data.hato     ?? {};
    const ingreso = cantidad * pesoPromedio * precioKg;
    const costoProduccion = ingreso * 0.65; // margen ganadero típico 35%
    const utilidad = ingreso - costoProduccion;
    const margenPct = ((utilidad / ingreso) * 100).toFixed(1);

    return {
      titulo: `Venta de ${cantidad} novillos`,
      proyecciones: [
        { label: "Ingreso total venta",   actual: 0,             proyectado: ingreso,             formato: "moneda",     positivo: true },
        { label: "Utilidad estimada",      actual: 0,             proyectado: utilidad,            formato: "moneda",     positivo: true },
        { label: "Margen de la venta",     actual: 0,             proyectado: parseFloat(margenPct), formato: "porcentaje", positivo: true },
        { label: "Caja después de venta",  actual: fin.cajaDisponible ?? 0, proyectado: (fin.cajaDisponible ?? 0) + utilidad, formato: "moneda", positivo: true },
        { label: "Novillos restantes",     actual: hato.novillos ?? 0, proyectado: Math.max(0, (hato.novillos ?? 0) - cantidad), formato: "numero", unidad: "animales", positivo: null },
      ],
      analisis: [
        `La venta de ${cantidad} novillos a ${fmt(precioKg)}/kg generaría ${fmt(ingreso)} en caja.`,
        `Con un margen del ${margenPct}%, la utilidad neta estimada es ${fmt(utilidad)}.`,
        `La caja disponible pasaría de ${fmt(fin.cajaDisponible ?? 0)} a ${fmt((fin.cajaDisponible ?? 0) + utilidad)}.`,
      ],
      recomendaciones: [
        "Pesar los novillos antes de negociar para maximizar el precio",
        "Comparar precio ofrecido vs. precio de referencia regional",
        "Evaluar si conviene retener para mayor peso o vender al precio actual",
      ],
      timeline: [
        { mes: 0, label: "Hoy",    valor: 0 },
        { mes: 1, label: "Mes 1",  valor: ingreso },
      ],
    };
  },

  aumentar_potreros(data, { hectareasNuevas = 20, costoHa = 800000 }) {
    const hato   = data.hato   ?? {};
    const finca  = data.finca  ?? {};
    const inversion     = hectareasNuevas * costoHa;
    const haActual      = finca.hectareas ?? 100;
    const haNuevo       = haActual + hectareasNuevas;
    const uaActual      = (hato.vacas ?? 0) + (hato.novillos ?? 0) * 0.8;
    const capacidadNueva = Math.round(haNuevo * 1.8); // 1.8 UA/ha
    const animalesExtra  = Math.max(0, capacidadNueva - uaActual);
    const ingresoExtra   = animalesExtra * 0.4 * 380 * PRECIO_KG; // engorde anual

    return {
      titulo: `Ampliar ${hectareasNuevas} ha de pasturas`,
      proyecciones: [
        { label: "Inversión",          actual: 0,       proyectado: -inversion,      formato: "moneda",     positivo: false },
        { label: "Capacidad UA nueva", actual: Math.round(uaActual), proyectado: capacidadNueva, formato: "numero", unidad: "UA", positivo: true },
        { label: "Animales adicionales posibles", actual: 0, proyectado: animalesExtra, formato: "numero", unidad: "animales", positivo: true },
        { label: "Ingreso adicional proyectado/año", actual: 0, proyectado: ingresoExtra, formato: "moneda", positivo: ingresoExtra > 0 },
      ],
      analisis: [
        `Las ${hectareasNuevas} ha adicionales permitirían aumentar la capacidad a ~${capacidadNueva} UA (${animalesExtra} animales más).`,
        `Recuperación de inversión estimada: ${ingresoExtra > 0 ? Math.round(inversion / (ingresoExtra / 12)) : "+"} meses.`,
      ],
      recomendaciones: [
        "Realizar análisis de suelo antes de la siembra",
        "Seleccionar especie forrajera según zona y disponibilidad de agua",
        "Considerar sistemas silvopastoriles para mayor sostenibilidad",
      ],
      timeline: [
        { mes: 0,  label: "Inversión",  valor: -inversion },
        { mes: 6,  label: "Mes 6",      valor: -inversion + ingresoExtra * 0.4 },
        { mes: 12, label: "Año 1",      valor: -inversion + ingresoExtra },
        { mes: 24, label: "Año 2",      valor: -inversion + ingresoExtra * 2 },
      ],
    };
  },

  sube_insumos(data, { pctAumento = 20 }) {
    const fin      = data.finanzas ?? {};
    const gastos   = fin.gastos    ?? 0;
    const ingresos = fin.ingresos  ?? 0;
    const insumosEst   = gastos * 0.35; // ~35% de gastos son insumos
    const aumento      = insumosEst * (pctAumento / 100);
    const gastosProy   = gastos + aumento;
    const margenActual = ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0;
    const margenProy   = ingresos > 0 ? ((ingresos - gastosProy) / ingresos) * 100 : 0;

    return {
      titulo: `Alza del ${pctAumento}% en insumos`,
      proyecciones: [
        { label: "Gastos actuales",      actual: 0,           proyectado: gastos,             formato: "moneda", positivo: null },
        { label: "Gastos con alza",      actual: gastos,      proyectado: gastosProy,         formato: "moneda", positivo: false },
        { label: "Aumento en gastos",    actual: 0,           proyectado: aumento,            formato: "moneda", positivo: false },
        { label: "Margen actual",        actual: margenActual,proyectado: margenProy,         formato: "porcentaje", positivo: margenProy > 10 },
        { label: "Impacto en utilidad",  actual: 0,           proyectado: -aumento,           formato: "moneda", positivo: false },
      ],
      analisis: [
        `Un alza del ${pctAumento}% en insumos aumentaría los gastos en ${fmt(aumento)}/mes.`,
        `El margen de ganancia caería del ${margenActual.toFixed(1)}% al ${margenProy.toFixed(1)}%.`,
        margenProy < 5 ? "⚠️ El margen quedaría por debajo del 5% — zona de riesgo alto." : "El margen se mantendría en zona aceptable.",
      ],
      recomendaciones: [
        "Negociar contratos de precio fijo con proveedores clave",
        "Evaluar producción propia de proteína y forraje para reducir dependencia",
        "Revisar dosis y eficiencia de medicamentos — evitar subdosificación o sobredosificación",
      ],
      timeline: [
        { mes: 1,  label: "Mes 1",  valor: -aumento },
        { mes: 6,  label: "Mes 6",  valor: -aumento * 6 },
        { mes: 12, label: "Año 1",  valor: -aumento * 12 },
      ],
    };
  },

  baja_precio_ganado(data, { pctBaja = 15 }) {
    const fin      = data.finanzas ?? {};
    const hato     = data.hato     ?? {};
    const ingresos = fin.ingresos  ?? 0;
    const ventasEst = ingresos * 0.6;
    const impacto   = ventasEst * (pctBaja / 100);
    const ingresosProy = ingresos - impacto;
    const margenActual = fin.margenGanancia ?? ((ingresos - (fin.gastos ?? 0)) / Math.max(1, ingresos) * 100);
    const margenProy   = ingresosProy > 0 ? ((ingresosProy - (fin.gastos ?? 0)) / ingresosProy * 100) : 0;

    return {
      titulo: `Baja del ${pctBaja}% en precio del ganado`,
      proyecciones: [
        { label: "Ingresos actuales",   actual: 0,       proyectado: ingresos,      formato: "moneda",     positivo: null },
        { label: "Ingresos proyectados",actual: ingresos,proyectado: ingresosProy,  formato: "moneda",     positivo: false },
        { label: "Pérdida mensual",     actual: 0,       proyectado: -impacto,      formato: "moneda",     positivo: false },
        { label: "Margen proyectado",   actual: margenActual, proyectado: margenProy, formato: "porcentaje", positivo: margenProy > 10 },
      ],
      analisis: [
        `Una baja del ${pctBaja}% en precios reduciría los ingresos en ~${fmt(impacto)}/mes.`,
        `El margen caería del ${margenActual.toFixed(1)}% al ${margenProy.toFixed(1)}%.`,
        margenProy < 0 ? "⚠️ La finca operaría con pérdidas." : margenProy < 10 ? "Margen crítico — revisar gastos urgentemente." : "Margen sostenible pero reducido.",
      ],
      recomendaciones: [
        "Retener animales si el precio baja temporalmente y hay capacidad de alimentación",
        "Diversificar ingresos — leche, queso, pie de cría, turismo ganadero",
        "Ajustar costos variables si la baja de precio es prolongada",
      ],
      timeline: [
        { mes: 1,  label: "Mes 1",  valor: -impacto },
        { mes: 6,  label: "Mes 6",  valor: -impacto * 6 },
        { mes: 12, label: "Año 1",  valor: -impacto * 12 },
      ],
    };
  },

  cambiar_sistema(data, { sistemaNuevo = "intensivo", inversion = 80000000 }) {
    const GMD_SISTEMAS = { extensivo: 350, semi: 550, intensivo: 750 };
    const COSTO_SISTEMAS = { extensivo: 300000, semi: 500000, intensivo: 900000 };
    const hato = data.hato ?? {};
    const fin  = data.finanzas ?? {};
    const novillos = hato.novillos ?? 50;
    const sistemaActual = hato.sistema ?? "semi";
    const gmdActual  = GMD_SISTEMAS[sistemaActual]  ?? 500;
    const gmdNuevo   = GMD_SISTEMAS[sistemaNuevo]   ?? 750;
    const costoExtra = (COSTO_SISTEMAS[sistemaNuevo] - COSTO_SISTEMAS[sistemaActual]) * novillos * 12;
    const ingresoExtra = novillos * ((gmdNuevo - gmdActual) / 1000) * 12 * PRECIO_KG * 30 * 0.3;
    const roi12m = ingresoExtra - inversion - costoExtra;

    return {
      titulo: `Cambio a sistema ${sistemaNuevo}`,
      proyecciones: [
        { label: "Inversión inicial",      actual: 0,       proyectado: -inversion,    formato: "moneda",     positivo: false },
        { label: "GMD actual vs nueva",    actual: gmdActual, proyectado: gmdNuevo,    formato: "numero",     unidad: "g/día", positivo: true },
        { label: "Ingreso extra/año",      actual: 0,       proyectado: ingresoExtra,  formato: "moneda",     positivo: ingresoExtra > 0 },
        { label: "ROI primer año",         actual: 0,       proyectado: roi12m,        formato: "moneda",     positivo: roi12m > 0 },
      ],
      analisis: [
        `Pasar de sistema ${sistemaActual} a ${sistemaNuevo} aumentaría la GMD de ${gmdActual} a ${gmdNuevo} g/día.`,
        `El mayor costo de alimentación sería de ~${fmt(costoExtra)}/año.`,
        roi12m > 0 ? `ROI positivo en el primer año: ${fmt(roi12m)}.` : `Se necesitarían ~${Math.round(inversion / (ingresoExtra / 12))} meses para recuperar la inversión.`,
      ],
      recomendaciones: [
        "Evaluar capacidad de instalaciones para el sistema intensivo",
        "Planificar suministro de insumos (concentrado, agua, energía)",
        "Hacer prueba piloto con el 20% del hato antes de escalar",
      ],
      timeline: [
        { mes: 0,  label: "Inversión",  valor: -inversion },
        { mes: 6,  label: "Mes 6",      valor: -inversion + (ingresoExtra - costoExtra) * 0.5 },
        { mes: 12, label: "Año 1",      valor: roi12m },
        { mes: 24, label: "Año 2",      valor: roi12m + (ingresoExtra - costoExtra) },
      ],
    };
  },
};

function escenario_desc(esc) { return esc?.tipo ?? "Escenario"; }
function fmt(v) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v ?? 0);
}
