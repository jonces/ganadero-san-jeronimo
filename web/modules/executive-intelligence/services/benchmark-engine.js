import { BENCHMARKS_COL } from "../constants/benchmark-config.js";

export function getBenchmarkComparison(kpis) {
  return Object.entries(BENCHMARKS_COL).map(([kpiId, bench]) => {
    const valor = kpis[kpiId] ?? 0;
    let posicion;
    if (bench.lowerBetter) {
      posicion = valor <= bench.p75 ? "top25" : valor <= bench.p50 ? "mediana" : valor <= bench.p25 ? "p25" : "bajo";
    } else {
      posicion = valor >= bench.p75 ? "top25" : valor >= bench.p50 ? "mediana" : valor >= bench.p25 ? "p25" : "bajo";
    }
    return { kpiId, valor, bench, posicion };
  });
}

export function generateComparativeData(kpis, dimension) {
  const base = kpis?.ingresos ?? 100e6;
  const dims = {
    finca:     ["Finca San Jerónimo", "Finca El Roble", "Finca La Esperanza"],
    empresa:   ["Empresa Ganadera SG", "Asociados Norte"],
    anio:      ["2023", "2024", "2025", "2026"],
    mes:       ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    semana:    ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    categoria: ["Carne", "Leche", "Pie de Cría", "Doble Propósito"],
    raza:      ["Brahman", "Girolando", "Angus", "Simmental"],
    potrero:   ["P-1 Norte", "P-2 Sur", "P-3 Oriente", "P-4 Centro", "P-5 Río"],
  };
  const labels = dims[dimension] ?? ["A", "B", "C"];
  return labels.map(label => ({
    label,
    ingresos:     base * (0.5 + Math.random() * 0.9),
    gastos:       base * (0.3 + Math.random() * 0.5),
    animales:     Math.round((kpis?.total_animales ?? 200) * (0.4 + Math.random() * 1.2)),
    rentabilidad: 8 + Math.random() * 28,
  }));
}
