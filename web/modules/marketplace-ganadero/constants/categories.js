/**
 * Categorías y subcategorías del Marketplace Ganadero.
 */

export const MKT_CATEGORY = {
  GANADO:       "ganado",
  GENETICA:     "genetica",
  SEMEN:        "semen",
  EMBRIONES:    "embriones",
  MEDICAMENTOS: "medicamentos",
  VACUNAS:      "vacunas",
  VITAMINAS:    "vitaminas",
  MINERALES:    "minerales",
  CONCENTRADOS: "concentrados",
  EQUIPOS:      "equipos",
  MAQUINARIA:   "maquinaria",
  VEHICULOS:    "vehiculos",
  CERCAS:       "cercas",
  CORRALES:     "corrales",
  BASCULAS:     "basculas",
  PANELES:      "paneles",
  DRONES:       "drones",
  GPS:          "gps",
  RFID:         "rfid",
  INSUMOS:      "insumos",
  SERVICIOS:    "servicios",
};

export const MKT_CATEGORY_CONFIG = {
  ganado:       { label: "Ganado",           icono: "🐄", color: "#92400e", bg: "#fef3c7", grupo: "animales",    popular: true  },
  genetica:     { label: "Genética",         icono: "🧬", color: "#7c3aed", bg: "#f5f3ff", grupo: "animales",    popular: true  },
  semen:        { label: "Semen",            icono: "🔬", color: "#6d28d9", bg: "#ede9fe", grupo: "animales",    popular: false },
  embriones:    { label: "Embriones",        icono: "🧪", color: "#5b21b6", bg: "#ede9fe", grupo: "animales",    popular: false },
  medicamentos: { label: "Medicamentos",     icono: "💊", color: "#dc2626", bg: "#fef2f2", grupo: "salud",       popular: true  },
  vacunas:      { label: "Vacunas",          icono: "💉", color: "#b91c1c", bg: "#fef2f2", grupo: "salud",       popular: true  },
  vitaminas:    { label: "Vitaminas",        icono: "🌿", color: "#16a34a", bg: "#f0fdf4", grupo: "salud",       popular: false },
  minerales:    { label: "Minerales",        icono: "🪨",  color: "#78716c", bg: "#fafaf9", grupo: "salud",       popular: true  },
  concentrados: { label: "Concentrados",     icono: "🌾", color: "#d97706", bg: "#fffbeb", grupo: "alimentacion",popular: true  },
  equipos:      { label: "Equipos",          icono: "⚙️",  color: "#374151", bg: "#f9fafb", grupo: "infraestructura", popular: false },
  maquinaria:   { label: "Maquinaria",       icono: "🚜", color: "#1f2937", bg: "#f9fafb", grupo: "infraestructura", popular: false },
  vehiculos:    { label: "Vehículos",        icono: "🚗", color: "#0f172a", bg: "#f8fafc", grupo: "infraestructura", popular: false },
  cercas:       { label: "Cercas",           icono: "🔌", color: "#b45309", bg: "#fffbeb", grupo: "infraestructura", popular: false },
  corrales:     { label: "Corrales",         icono: "🏠", color: "#ca8a04", bg: "#fefce8", grupo: "infraestructura", popular: false },
  basculas:     { label: "Básculas",         icono: "⚖️",  color: "#0369a1", bg: "#eff6ff", grupo: "iot",         popular: false },
  paneles:      { label: "Paneles Solares",  icono: "☀️",  color: "#d97706", bg: "#fffbeb", grupo: "iot",         popular: false },
  drones:       { label: "Drones",           icono: "🚁", color: "#111827", bg: "#f1f5f9", grupo: "iot",         popular: false },
  gps:          { label: "GPS",              icono: "🛰️", color: "#2563eb", bg: "#eff6ff", grupo: "iot",         popular: false },
  rfid:         { label: "RFID",             icono: "📡", color: "#6366f1", bg: "#eef2ff", grupo: "iot",         popular: false },
  insumos:      { label: "Insumos Agrícolas",icono: "🧺", color: "#16a34a", bg: "#f0fdf4", grupo: "insumos",     popular: false },
  servicios:    { label: "Servicios",        icono: "🤝", color: "#0891b2", bg: "#ecfeff", grupo: "servicios",   popular: true  },
};

export const GRUPOS_CONFIG = {
  animales:       { label: "Animales y Genética", icono: "🐄" },
  salud:          { label: "Salud Animal",         icono: "💊" },
  alimentacion:   { label: "Alimentación",         icono: "🌾" },
  infraestructura:{ label: "Infraestructura",      icono: "🏗️" },
  iot:            { label: "IoT y Tecnología",     icono: "📡" },
  insumos:        { label: "Insumos",              icono: "🧺" },
  servicios:      { label: "Servicios",            icono: "🤝" },
};

export const SUBCATEGORIAS_GANADO = [
  "toro", "vaca", "novilla", "ternero", "novillo", "lote", "reproductor", "donadora",
];

export const SUBCATEGORIAS_SERVICIOS = [
  "veterinario", "ingeniero", "nutricionista", "inseminador", "transportista",
  "constructor_corrales", "laboratorio", "tecnico", "consultor",
];

export const RAZAS_BOVINAS = [
  "Brahman", "Simmental", "Angus", "Holstein", "Cebu", "Gyr", "Girolando",
  "Normando", "Blanco Orejinegro", "Romosinuano", "Sanmartinero", "Costeño con Cuernos",
  "Senepol", "Wagyu", "Charolais", "Limousin", "Santa Gertrudis", "Brangus",
  "Criollo", "Mestizo",
];

export const CATEGORIAS_LISTA = Object.entries(MKT_CATEGORY_CONFIG).map(([id, cfg]) => ({ id, ...cfg }));
