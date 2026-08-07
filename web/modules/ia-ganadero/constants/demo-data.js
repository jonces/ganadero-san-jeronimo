// Datos simulados del panel derecho — se reemplazarán por API en Fase 2.

export const DEMO_FINCA = {
  nombre:         "Finca San Jerónimo",
  animalesTotal:  34,
  animalesSanos:  31,
  enVenta:         4,
  prenadas:         7,
  pesoPromedio:   "382 kg",
  cajaDisponible: "C$ 84,500",
  ventasMes:      "C$ 126,000",
  gastosMes:      "C$ 38,200",
  hatoStatus:     "bueno",   // "bueno" | "alerta" | "critico"
};

export const DEMO_RECOMENDACIONES = [
  { id: "r1", prioridad: "alta",  titulo: "3 vacas sin vacunar",       detalle: "Las vacas #012, #027 y #031 no tienen vacunación registrada este ciclo.", icono: "💉", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", accion: "Ver animales" },
  { id: "r2", prioridad: "alta",  titulo: "Stock crítico: Vacunas",    detalle: "Solo quedan 2 frascos. El mínimo recomendado es 10.",                     icono: "📦", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", accion: "Ver inventario" },
  { id: "r3", prioridad: "media", titulo: "Rotación de Potrero 3",     detalle: "Lleva 18 días en uso. Se recomienda rotar antes de los 21 días.",          icono: "🌿", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", accion: "Ver potreros" },
  { id: "r4", prioridad: "media", titulo: "Pesaje pendiente",          detalle: "12 animales no tienen registro de peso en los últimos 30 días.",           icono: "⚖️", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", accion: "Registrar pesaje" },
  { id: "r5", prioridad: "baja",  titulo: "Vaca #008 próxima a parir", detalle: "Gestación en día 268. Se estima parto en los próximos 7 días.",            icono: "🤰", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", accion: "Ver reproducción" },
];

export const DEMO_ACCIONES = [
  { id: "a1", label: "Registrar venta",  icono: "💰", color: "#10A37F", bg: "#F0FDF4" },
  { id: "a2", label: "Nuevo gasto",      icono: "💸", color: "#EF4444", bg: "#FEF2F2" },
  { id: "a3", label: "Nuevo animal",     icono: "🐄", color: "#0EA5E9", bg: "#F0F9FF" },
  { id: "a4", label: "Registrar evento", icono: "📋", color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "a5", label: "Generar reporte",  icono: "📊", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "a6", label: "Plan sanitario",   icono: "💉", color: "#EC4899", bg: "#FDF2F8" },
];

export const DEMO_DOCS = [
  { id: "d1", nombre: "Reporte mensual julio 2026",  tipo: "PDF",  fecha: "Hoy",          icono: "📄", color: "#EF4444" },
  { id: "d2", nombre: "Inventario de medicamentos",  tipo: "XLSX", fecha: "Ayer",          icono: "📊", color: "#10A37F" },
  { id: "d3", nombre: "Protocolo de vacunación Q3",  tipo: "PDF",  fecha: "Hace 3 días",   icono: "📄", color: "#EF4444" },
  { id: "d4", nombre: "Plan de rotación agosto",     tipo: "DOC",  fecha: "Hace 5 días",   icono: "📝", color: "#0EA5E9" },
  { id: "d5", nombre: "Registro de partos 2026",     tipo: "XLSX", fecha: "Hace 1 semana", icono: "📊", color: "#10A37F" },
];
