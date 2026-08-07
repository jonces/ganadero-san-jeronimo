// ── Idiomas soportados ───────────────────────────────────────────────────────
export const IDIOMA = {
  ES: "es",   // Español
  EN: "en",   // English
  PT: "pt",   // Português
};

export const IDIOMA_LABELS = {
  [IDIOMA.ES]: { label: "Español",    flag: "🇳🇮" },
  [IDIOMA.EN]: { label: "English",    flag: "🇺🇸" },
  [IDIOMA.PT]: { label: "Português",  flag: "🇧🇷" },
};

// ── Monedas soportadas ────────────────────────────────────────────────────────
export const MONEDA = {
  NIO: "NIO",   // Córdoba nicaragüense
  USD: "USD",   // Dólar estadounidense
  CRC: "CRC",   // Colón costarricense
  GTQ: "GTQ",   // Quetzal guatemalteco
  HNL: "HNL",   // Lempira hondureño
};

export const MONEDA_CONFIG = {
  [MONEDA.NIO]: { simbolo: "C$",  nombre: "Córdoba",  decimales: 2, locale: "es-NI" },
  [MONEDA.USD]: { simbolo: "$",   nombre: "Dólar",    decimales: 2, locale: "en-US" },
  [MONEDA.CRC]: { simbolo: "₡",   nombre: "Colón",    decimales: 0, locale: "es-CR" },
  [MONEDA.GTQ]: { simbolo: "Q",   nombre: "Quetzal",  decimales: 2, locale: "es-GT" },
  [MONEDA.HNL]: { simbolo: "L",   nombre: "Lempira",  decimales: 2, locale: "es-HN" },
};

// ── Zonas horarias soportadas ─────────────────────────────────────────────────
export const ZONA_HORARIA = {
  MANAGUA:     "America/Managua",      // Nicaragua (UTC-6)
  MEXICO_CITY: "America/Mexico_City",  // México   (UTC-6/-5)
  BOGOTA:      "America/Bogota",       // Colombia (UTC-5)
  LIMA:        "America/Lima",         // Perú     (UTC-5)
  GUAYAQUIL:   "America/Guayaquil",    // Ecuador  (UTC-5)
  SAO_PAULO:   "America/Sao_Paulo",    // Brasil   (UTC-3/-2)
  BUENOS_AIRES:"America/Argentina/Buenos_Aires", // Argentina (UTC-3)
};

// ── Roles de usuario ──────────────────────────────────────────────────────────
export const ROL = {
  SUPERADMIN:  "superadmin",
  ADMIN:       "admin",
  VETERINARIO: "veterinario",
  CAPATAZ:     "capataz",
  VAQUERO:     "vaquero",
  CONTADOR:    "contador",
  VIEWER:      "viewer",
};

export const ROL_LABELS = {
  [ROL.SUPERADMIN]:  { label: "Super Administrador", nivel: 0 },
  [ROL.ADMIN]:       { label: "Administrador",        nivel: 1 },
  [ROL.VETERINARIO]: { label: "Veterinario",          nivel: 2 },
  [ROL.CAPATAZ]:     { label: "Capataz",              nivel: 2 },
  [ROL.CONTADOR]:    { label: "Contador",             nivel: 2 },
  [ROL.VAQUERO]:     { label: "Vaquero",              nivel: 3 },
  [ROL.VIEWER]:      { label: "Solo lectura",         nivel: 4 },
};

// ── Acciones de contexto (reducer) ────────────────────────────────────────────
export const CONTEXT_ACTION = {
  SET_CONTEXT:          "CONTEXT/SET_CONTEXT",
  SET_FINCA:            "CONTEXT/SET_FINCA",
  SET_LOADING:          "CONTEXT/SET_LOADING",
  SET_ERROR:            "CONTEXT/SET_ERROR",
  REFRESH:              "CONTEXT/REFRESH",
};
