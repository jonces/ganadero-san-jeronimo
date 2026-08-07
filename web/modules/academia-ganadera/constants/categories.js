/**
 * Categorías de la Academia Ganadera.
 * Mapeadas al especialista de Centro IA correspondiente para personalización.
 */

export const ACADEMIA_CATEGORIA = {
  SANIDAD:          "sanidad",
  NUTRICION:        "nutricion",
  REPRODUCCION:     "reproduccion",
  PASTURAS:         "pasturas",
  INFRAESTRUCTURA:  "infraestructura",
  ADMINISTRACION:   "administracion",
  FINANZAS:         "finanzas",
  BIENESTAR:        "bienestar",
  CORRALES:         "corrales",
  LECHE:            "leche",
  CARNE:            "carne",
  GENETICA:         "genetica",
  INSEMINACION:     "inseminacion",
  EMBRIONES:        "embriones",
  TERNEROS:         "terneros",
  SILVOPASTOREO:    "silvopastoreo",
  TECNOLOGIA:       "tecnologia",
  INTELIGENCIA_IA:  "inteligencia_ia",
};

export const ACADEMIA_CATEGORIA_CONFIG = {
  sanidad:         { id: "sanidad",         label: "Sanidad",               icono: "🏥", color: "#DC2626", bg: "#FEF2F2", especialista: "veterinario" },
  nutricion:       { id: "nutricion",       label: "Nutrición",             icono: "🌿", color: "#16A34A", bg: "#F0FDF4", especialista: "nutricionista" },
  reproduccion:    { id: "reproduccion",    label: "Reproducción",          icono: "🐄", color: "#7C3AED", bg: "#F5F3FF", especialista: "reproduccion" },
  pasturas:        { id: "pasturas",        label: "Pasturas",              icono: "🌾", color: "#065F46", bg: "#ECFDF5", especialista: "pasturas" },
  infraestructura: { id: "infraestructura", label: "Infraestructura",       icono: "🏗️", color: "#92400E", bg: "#FFFBEB", especialista: "infraestructura" },
  administracion:  { id: "administracion",  label: "Administración",        icono: "📊", color: "#1E40AF", bg: "#EFF6FF", especialista: "finanzas" },
  finanzas:        { id: "finanzas",        label: "Finanzas",              icono: "💰", color: "#0F766E", bg: "#F0FDFA", especialista: "finanzas" },
  bienestar:       { id: "bienestar",       label: "Bienestar Animal",      icono: "❤️", color: "#BE185D", bg: "#FDF2F8", especialista: "bienestar" },
  corrales:        { id: "corrales",        label: "Manejo de Corrales",    icono: "🏠", color: "#B45309", bg: "#FFFBEB", especialista: "corrales" },
  leche:           { id: "leche",           label: "Producción de Leche",   icono: "🥛", color: "#0369A1", bg: "#F0F9FF", especialista: "produccion" },
  carne:           { id: "carne",           label: "Producción de Carne",   icono: "🥩", color: "#B91C1C", bg: "#FEF2F2", especialista: "produccion" },
  genetica:        { id: "genetica",        label: "Genética",              icono: "🧬", color: "#4F46E5", bg: "#EEF2FF", especialista: "produccion" },
  inseminacion:    { id: "inseminacion",    label: "Inseminación Artificial",icono: "🔬", color: "#6D28D9", bg: "#F5F3FF", especialista: "reproduccion" },
  embriones:       { id: "embriones",       label: "Transferencia Embriones",icono: "🧫", color: "#0E7490", bg: "#ECFEFF", especialista: "reproduccion" },
  terneros:        { id: "terneros",        label: "Manejo de Terneros",    icono: "🐮", color: "#D97706", bg: "#FFFBEB", especialista: "veterinario" },
  silvopastoreo:   { id: "silvopastoreo",   label: "Silvopastoreo",         icono: "🌳", color: "#15803D", bg: "#F0FDF4", especialista: "pasturas" },
  tecnologia:      { id: "tecnologia",      label: "Tecnología",            icono: "📱", color: "#374151", bg: "#F9FAFB", especialista: null },
  inteligencia_ia: { id: "inteligencia_ia", label: "Inteligencia Artificial",icono: "🤖", color: "#6366F1", bg: "#EEF2FF", especialista: null },
};

export function getCategoriaConfig(id) {
  return ACADEMIA_CATEGORIA_CONFIG[id] ?? ACADEMIA_CATEGORIA_CONFIG.sanidad;
}

export const CATEGORIAS_LISTA = Object.values(ACADEMIA_CATEGORIA_CONFIG);
