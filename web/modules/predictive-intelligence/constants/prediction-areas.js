export const PREDICTION_AREA = {
  SANIDAD:        "sanidad",
  REPRODUCCION:   "reproduccion",
  PRODUCCION:     "produccion",
  FINANZAS:       "finanzas",
  INVENTARIO:     "inventario",
  PASTURAS:       "pasturas",
  CLIMA:          "clima",
  MERCADO:        "mercado",
  COMPRAS:        "compras",
  VENTAS:         "ventas",
};

export const PREDICTION_AREA_CONFIG = {
  sanidad:      { id: "sanidad",      label: "Sanidad",         icono: "🏥", color: "#DC2626", bg: "#FEF2F2" },
  reproduccion: { id: "reproduccion", label: "Reproducción",    icono: "🐄", color: "#7C3AED", bg: "#F5F3FF" },
  produccion:   { id: "produccion",   label: "Producción",      icono: "📈", color: "#0284C7", bg: "#F0F9FF" },
  finanzas:     { id: "finanzas",     label: "Finanzas",        icono: "💰", color: "#0F766E", bg: "#F0FDFA" },
  inventario:   { id: "inventario",   label: "Inventario",      icono: "📦", color: "#B45309", bg: "#FFFBEB" },
  pasturas:     { id: "pasturas",     label: "Pasturas",        icono: "🌾", color: "#065F46", bg: "#ECFDF5" },
  clima:        { id: "clima",        label: "Clima",           icono: "🌦️", color: "#0369A1", bg: "#F0F9FF" },
  mercado:      { id: "mercado",      label: "Mercado",         icono: "📊", color: "#4F46E5", bg: "#EEF2FF" },
  compras:      { id: "compras",      label: "Compras",         icono: "🛒", color: "#D97706", bg: "#FFFBEB" },
  ventas:       { id: "ventas",       label: "Ventas",          icono: "🤝", color: "#15803D", bg: "#F0FDF4" },
};

export const AREAS_LISTA = Object.values(PREDICTION_AREA_CONFIG);
