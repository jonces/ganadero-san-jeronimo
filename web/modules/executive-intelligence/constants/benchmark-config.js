// Benchmarks basados en promedios ganadería colombiana FEDEGAN/ICA 2025
export const BENCHMARKS_COL = {
  tasa_prenez:      { p25: 55, p50: 68, p75: 80,      unidad: "%",         lowerBetter: false },
  tasa_natalidad:   { p25: 50, p50: 65, p75: 78,      unidad: "%",         lowerBetter: false },
  tasa_destete:     { p25: 48, p50: 62, p75: 75,      unidad: "%",         lowerBetter: false },
  mortalidad:       { p25: 5,  p50: 3,  p75: 1.5,     unidad: "%",         lowerBetter: true  },
  gdp:              { p25: 400,p50: 550,p75: 700,      unidad: "g/día",     lowerBetter: false },
  prod_leche:       { p25: 8,  p50: 14, p75: 22,      unidad: "L/vaca/día",lowerBetter: false },
  intervalo_partos: { p25: 420,p50: 390,p75: 365,     unidad: "días",      lowerBetter: true  },
  rentabilidad:     { p25: 8,  p50: 15, p75: 25,      unidad: "%",         lowerBetter: false },
  costo_animal:     { p25: 2500000, p50: 1800000, p75: 1200000, unidad: "COP", lowerBetter: true },
};

export const COMPARE_DIMS = [
  { id: "finca",     label: "Finca vs Finca"    },
  { id: "empresa",   label: "Empresa vs Empresa" },
  { id: "anio",      label: "Año vs Año"         },
  { id: "mes",       label: "Mes vs Mes"         },
  { id: "semana",    label: "Semana vs Semana"   },
  { id: "categoria", label: "Por Categoría"      },
  { id: "raza",      label: "Por Raza"           },
  { id: "potrero",   label: "Por Potrero"        },
];

export const BENCHMARK_KPI_LABELS = {
  tasa_prenez:      "Tasa de Preñez",
  tasa_natalidad:   "Tasa Natalidad",
  tasa_destete:     "Tasa Destete",
  mortalidad:       "Mortalidad",
  gdp:              "GDP (g/día)",
  prod_leche:       "Prod. Leche (L/vaca/día)",
  intervalo_partos: "Intervalo Partos (días)",
  rentabilidad:     "Rentabilidad (%)",
  costo_animal:     "Costo por Animal",
};
