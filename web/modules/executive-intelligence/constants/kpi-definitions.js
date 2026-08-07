export const KPI_CATS = {
  global:       "global",
  ganadero:     "ganadero",
  sanitario:    "sanitario",
  reproductivo: "reproductivo",
  financiero:   "financiero",
};

export const KPI_DEFS = [
  // ── Global ──────────────────────────────────────────────────────
  { id: "ingresos",         label: "Ingresos",               cat: "global",       unidad: "COP",      icono: "💰", fmt: "currency" },
  { id: "gastos",           label: "Gastos",                 cat: "global",       unidad: "COP",      icono: "📤", fmt: "currency" },
  { id: "utilidad",         label: "Utilidad",               cat: "global",       unidad: "COP",      icono: "📈", fmt: "currency" },
  { id: "flujo_caja",       label: "Flujo de Caja",          cat: "global",       unidad: "COP",      icono: "🔄", fmt: "currency" },
  { id: "capital",          label: "Capital",                cat: "global",       unidad: "COP",      icono: "🏦", fmt: "currency" },
  { id: "valor_hato",       label: "Valor del Hato",         cat: "global",       unidad: "COP",      icono: "🐄", fmt: "currency" },
  { id: "valor_inventario", label: "Valor de Inventario",    cat: "global",       unidad: "COP",      icono: "📦", fmt: "currency" },
  { id: "valor_activos",    label: "Valor de Activos",       cat: "global",       unidad: "COP",      icono: "🏗️",  fmt: "currency" },
  { id: "rentabilidad",     label: "Rentabilidad",           cat: "global",       unidad: "%",        icono: "📊", fmt: "percent" },
  { id: "liquidez",         label: "Liquidez",               cat: "global",       unidad: "ratio",    icono: "💧", fmt: "decimal" },
  { id: "endeudamiento",    label: "Endeudamiento",          cat: "global",       unidad: "%",        icono: "⚠️",  fmt: "percent" },
  { id: "productividad",    label: "Productividad",          cat: "global",       unidad: "%",        icono: "⚡", fmt: "percent" },
  // ── Ganadero ────────────────────────────────────────────────────
  { id: "total_animales",   label: "Total Animales",         cat: "ganadero",     unidad: "cabezas",  icono: "🐄", fmt: "integer" },
  { id: "nacimientos",      label: "Nacimientos",            cat: "ganadero",     unidad: "cabezas",  icono: "🐣", fmt: "integer" },
  { id: "destetes",         label: "Destetes",               cat: "ganadero",     unidad: "cabezas",  icono: "🍼", fmt: "integer" },
  { id: "prenez",           label: "Preñez",                 cat: "ganadero",     unidad: "cabezas",  icono: "🤰", fmt: "integer" },
  { id: "mortalidad",       label: "Mortalidad",             cat: "ganadero",     unidad: "cabezas",  icono: "💀", fmt: "integer" },
  { id: "gdp",              label: "Ganancia Diaria Peso",   cat: "ganadero",     unidad: "g/día",    icono: "⚖️",  fmt: "decimal" },
  { id: "prod_leche",       label: "Producción Leche",       cat: "ganadero",     unidad: "L/día",    icono: "🥛", fmt: "decimal" },
  { id: "prod_carne",       label: "Producción Carne",       cat: "ganadero",     unidad: "kg/mes",   icono: "🥩", fmt: "decimal" },
  { id: "edad_promedio",    label: "Edad Promedio",          cat: "ganadero",     unidad: "meses",    icono: "📅", fmt: "decimal" },
  { id: "condicion_corporal",label: "Condición Corporal",    cat: "ganadero",     unidad: "/5",       icono: "💪", fmt: "decimal" },
  { id: "rotacion_potreros",label: "Rotación Potreros",      cat: "ganadero",     unidad: "días",     icono: "🌿", fmt: "decimal" },
  // ── Sanitario ───────────────────────────────────────────────────
  { id: "vacunas_aplicadas",   label: "Vacunas Aplicadas",   cat: "sanitario",    unidad: "dosis",    icono: "💉", fmt: "integer" },
  { id: "vacunas_pendientes",  label: "Vacunas Pendientes",  cat: "sanitario",    unidad: "dosis",    icono: "⏰", fmt: "integer" },
  { id: "tratamientos",        label: "Tratamientos",        cat: "sanitario",    unidad: "casos",    icono: "🩺", fmt: "integer" },
  { id: "animales_enfermos",   label: "Animales Enfermos",   cat: "sanitario",    unidad: "cabezas",  icono: "🤒", fmt: "integer" },
  { id: "animales_recuperados",label: "Animales Recuperados",cat: "sanitario",    unidad: "cabezas",  icono: "🏥", fmt: "integer" },
  { id: "alertas_sanitarias",  label: "Alertas Sanitarias",  cat: "sanitario",    unidad: "alertas",  icono: "🚨", fmt: "integer" },
  { id: "uso_medicamentos",    label: "Uso Medicamentos",    cat: "sanitario",    unidad: "COP",      icono: "💊", fmt: "currency" },
  // ── Reproductivo ────────────────────────────────────────────────
  { id: "tasa_prenez",          label: "Tasa de Preñez",     cat: "reproductivo", unidad: "%",        icono: "📊", fmt: "percent" },
  { id: "intervalo_partos",     label: "Intervalo Partos",   cat: "reproductivo", unidad: "días",     icono: "📅", fmt: "decimal" },
  { id: "servicios_concepcion", label: "Svc por Concepción", cat: "reproductivo", unidad: "svc",      icono: "🔬", fmt: "decimal" },
  { id: "tasa_natalidad",       label: "Tasa Natalidad",     cat: "reproductivo", unidad: "%",        icono: "🐣", fmt: "percent" },
  { id: "tasa_destete",         label: "Tasa Destete",       cat: "reproductivo", unidad: "%",        icono: "🍼", fmt: "percent" },
  { id: "tasa_reemplazo",       label: "Tasa Reemplazo",     cat: "reproductivo", unidad: "%",        icono: "🔄", fmt: "percent" },
  // ── Financiero ──────────────────────────────────────────────────
  { id: "margen_bruto",   label: "Margen Bruto",             cat: "financiero",   unidad: "%",        icono: "📈", fmt: "percent" },
  { id: "margen_neto",    label: "Margen Neto",              cat: "financiero",   unidad: "%",        icono: "💹", fmt: "percent" },
  { id: "roi",            label: "ROI",                      cat: "financiero",   unidad: "%",        icono: "🎯", fmt: "percent" },
  { id: "costo_animal",   label: "Costo por Animal",         cat: "financiero",   unidad: "COP",      icono: "🐄", fmt: "currency" },
  { id: "costo_kg",       label: "Costo por Kg",             cat: "financiero",   unidad: "COP",      icono: "⚖️",  fmt: "currency" },
  { id: "costo_litro",    label: "Costo por Litro",          cat: "financiero",   unidad: "COP",      icono: "🥛", fmt: "currency" },
  { id: "ing_finca",      label: "Ingresos por Finca",       cat: "financiero",   unidad: "COP",      icono: "🏡", fmt: "currency" },
  { id: "ing_empresa",    label: "Ingresos por Empresa",     cat: "financiero",   unidad: "COP",      icono: "🏢", fmt: "currency" },
];

export const KPI_BY_CAT = KPI_DEFS.reduce((acc, k) => {
  if (!acc[k.cat]) acc[k.cat] = [];
  acc[k.cat].push(k);
  return acc;
}, {});

export const CAT_LABELS = {
  global:       "KPIs Globales",
  ganadero:     "KPIs Ganaderos",
  sanitario:    "KPIs Sanitarios",
  reproductivo: "KPIs Reproductivos",
  financiero:   "KPIs Financieros",
};

export const CAT_EMOJIS = {
  global: "🌐", ganadero: "🐄", sanitario: "🏥", reproductivo: "🔬", financiero: "💰",
};
