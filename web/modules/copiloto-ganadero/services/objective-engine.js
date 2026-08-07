/**
 * Motor de objetivos — convierte metas del usuario en roadmap con etapas, KPIs y riesgos.
 */

/**
 * Tipos de objetivo predefinidos con su análisis.
 */
const OBJETIVO_TEMPLATES = {
  "aumentar_hato": {
    titulo: "Aumentar el hato",
    icono:  "🐄",
    fases:  ["Evaluación de capacidad actual", "Plan de compras o reproducción", "Mejora de infraestructura", "Consolidación"],
    kpis:   ["Número total de animales", "Tasa de natalidad", "Tasa de mortalidad", "Peso promedio"],
    riesgos:["Capacidad forrajera insuficiente", "Enfermedades al aumentar densidad", "Flujo de caja negativo por inversión"],
    horizonte: "12–18 meses",
  },
  "aumentar_leche": {
    titulo: "Aumentar producción de leche",
    icono:  "🥛",
    fases:  ["Diagnóstico genético y nutricional", "Mejora de alimentación", "Protocolo de ordeño", "Mejoramiento genético"],
    kpis:   ["Litros/vaca/día", "Período de lactancia", "Tasa de preñez", "BCS promedio"],
    riesgos:["Mastitis por aumento de presión productiva", "Déficit nutricional", "Anestro posparto"],
    horizonte: "6–12 meses",
  },
  "mejorar_rentabilidad": {
    titulo: "Mejorar rentabilidad",
    icono:  "💰",
    fases:  ["Análisis de costos actuales", "Identificación de ineficiencias", "Optimización de procesos", "Diversificación de ingresos"],
    kpis:   ["Margen de ganancia (%)", "Costo/kg carne o leche", "Flujo de caja mensual", "Ganancia neta"],
    riesgos:["Caída de precios del mercado", "Aumento de insumos", "Pérdidas por mortalidad"],
    horizonte: "6–12 meses",
  },
  "mejorar_fertilidad": {
    titulo: "Mejorar fertilidad del hato",
    icono:  "🐮",
    fases:  ["Evaluación reproductiva completa", "Mejora nutricional (BCS)", "Protocolo de sincronización", "Seguimiento por 3 ciclos"],
    kpis:   ["Tasa de preñez (%)", "Intervalo entre partos (días)", "Días abiertos", "Tasa de detección de celo"],
    riesgos:["Enfermedades reproductivas (brucelosis, DVB)", "Déficit nutricional persistente", "Toros subfértiles"],
    horizonte: "6–9 meses",
  },
  "mejorar_pasturas": {
    titulo: "Mejorar sistema de pasturas",
    icono:  "🌿",
    fases:  ["Evaluación y aforo de potreros", "Plan de rotación", "Fertilización y recuperación", "Implementación silvopastoril"],
    kpis:   ["Carga animal (UA/ha)", "Período de descanso promedio", "Cobertura vegetal (%)", "GMD en pastoreo"],
    riesgos:["Sequía prolongada", "Invasión de malezas", "Presupuesto insuficiente para fertilización"],
    horizonte: "12–24 meses",
  },
  "reducir_costos": {
    titulo: "Reducir costos de producción",
    icono:  "📉",
    fases:  ["Mapeo de todos los costos", "Priorización de reducción", "Eficiencia en sanidad y nutrición", "Automatización básica"],
    kpis:   ["Costo/animal/mes", "Costo/kg producido", "% costos sobre ingresos", "Tiempo de mano de obra"],
    riesgos:["Recortes que afecten salud animal", "Pérdida de calidad del producto", "Desmotivación del equipo"],
    horizonte: "3–6 meses",
  },
};

/**
 * Detecta el tipo de objetivo más cercano al texto del usuario.
 * @param {string} texto
 * @returns {string} templateKey
 */
function detectObjectiveType(texto) {
  const lower = texto.toLowerCase();
  if (/300|400|500|más animales|aumentar.*(hato|ganado|animales)|comprar.*(vacas|animales)/.test(lower)) return "aumentar_hato";
  if (/leche|producción|litros|lechería/.test(lower)) return "aumentar_leche";
  if (/rentabilidad|ganancias|utilidad|rentable/.test(lower)) return "mejorar_rentabilidad";
  if (/fertilidad|preñez|reproducción|celo|IA|inseminación/.test(lower)) return "mejorar_fertilidad";
  if (/pasto|potrero|forraje|pasturas|rotación/.test(lower)) return "mejorar_pasturas";
  if (/costo|gasto|reducir|ahorrar|eficiencia/.test(lower)) return "reducir_costos";
  return "mejorar_rentabilidad"; // default
}

/**
 * Genera un roadmap completo a partir del texto del objetivo del usuario.
 * @param {string} textoObjetivo
 * @param {object} [dashData]  — Datos del dashboard para contextualizar
 * @returns {import('../types').CopilotoObjetivo}
 */
export function generateObjectiveRoadmap(textoObjetivo, dashData = null) {
  const tipo     = detectObjectiveType(textoObjetivo);
  const template = OBJETIVO_TEMPLATES[tipo] ?? OBJETIVO_TEMPLATES.mejorar_rentabilidad;
  const hoy      = new Date();

  // Extrae número meta si hay uno en el texto
  const numMatch = textoObjetivo.match(/\d+/);
  const numMeta  = numMatch ? parseInt(numMatch[0]) : null;
  const actualAnimales = dashData?.animalesActivos ?? 0;

  const etapas = template.fases.map((fase, i) => {
    const inicioMes = i * 3;
    const inicio    = new Date(hoy);
    inicio.setMonth(inicio.getMonth() + inicioMes);
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + 3);
    return {
      id:          `etapa-${i + 1}`,
      numero:      i + 1,
      titulo:      fase,
      inicio:      inicio.toISOString().slice(0, 10),
      fin:         fin.toISOString().slice(0, 10),
      completada:  false,
      tareas:      [],
    };
  });

  const kpis = template.kpis.map((kpi, i) => ({
    id:          `kpi-${i}`,
    label:       kpi,
    actual:      kpiActual(kpi, dashData),
    meta:        kpiMeta(kpi, dashData, numMeta),
    unidad:      kpiUnidad(kpi),
    progreso:    0,
  }));

  return {
    id:              `obj-${tipo}-${Date.now()}`,
    tipo,
    textoOriginal:   textoObjetivo,
    titulo:          template.titulo,
    icono:           template.icono,
    horizonte:       template.horizonte,
    creadoEn:        hoy.toISOString(),
    estado:          "activo",
    etapas,
    kpis,
    riesgos:         template.riesgos,
    numMeta,
    actualAnimales,
    progreso:        0,
  };
}

function kpiActual(kpi, data) {
  if (!data) return null;
  if (kpi.includes("animales"))     return data.animalesActivos;
  if (kpi.includes("preñez"))       return data.tasaPrenez;
  if (kpi.includes("mortalidad"))   return data.mortalidad;
  if (kpi.includes("margen"))       return data.margenGanancia;
  if (kpi.includes("ganancia"))     return data.gananciaNeta;
  return null;
}

function kpiMeta(kpi, data, numMeta) {
  if (kpi.includes("animales") && numMeta) return numMeta;
  if (kpi.includes("preñez"))   return 65;
  if (kpi.includes("mortalidad")) return 2;
  if (kpi.includes("margen"))   return 20;
  if (kpi.includes("días") && kpi.includes("parto")) return 85;
  return null;
}

function kpiUnidad(kpi) {
  if (kpi.includes("%"))    return "%";
  if (kpi.includes("días")) return "días";
  if (kpi.includes("litros") || kpi.includes("/día")) return "L/día";
  if (kpi.includes("kg"))   return "kg";
  if (kpi.includes("L/vaca")) return "L";
  return "";
}

/** Lista de tipos de objetivo disponibles para el UI. */
export const TIPOS_OBJETIVO = Object.entries(OBJETIVO_TEMPLATES).map(([key, t]) => ({
  key,
  titulo: t.titulo,
  icono:  t.icono,
  horizonte: t.horizonte,
}));
