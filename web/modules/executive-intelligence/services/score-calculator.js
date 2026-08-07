import { SCORES } from "../constants/score-config.js";

function clamp(v, lo = 0, hi = 100) { return Math.min(hi, Math.max(lo, v)); }

function scoreFinanciero(k) {
  const ret = clamp(k.rentabilidad ?? 0, 0, 40) / 40 * 100;
  const mar = clamp(k.margen_neto  ?? 0, 0, 30) / 30 * 100;
  const roi = clamp(k.roi          ?? 0, 0, 50) / 50 * 100;
  const liq = clamp((k.liquidez    ?? 0), 0, 3) / 3   * 100;
  return clamp(ret * 0.3 + mar * 0.3 + roi * 0.25 + liq * 0.15);
}

function scoreSanitario(k) {
  const n         = Math.max(k.total_animales ?? 1, 1);
  const cobertura = clamp(((k.vacunas_aplicadas ?? 0) / n) * 100);
  const enfScore  = clamp(100 - ((k.animales_enfermos ?? 0) / n) * 500);
  const morScore  = clamp(100 - ((k.mortalidad        ?? 0) / n) * 1000);
  return clamp(cobertura * 0.35 + enfScore * 0.35 + morScore * 0.3);
}

function scoreReproductivo(k) {
  const prenez   = clamp(k.tasa_prenez    ?? 0);
  const natal    = clamp(k.tasa_natalidad ?? 0);
  const des      = clamp(k.tasa_destete   ?? 0);
  const intScore = clamp(100 - Math.max(0, (k.intervalo_partos ?? 365) - 365) / 2);
  return clamp(prenez * 0.35 + natal * 0.25 + des * 0.2 + intScore * 0.2);
}

function scoreAdministrativo(k) {
  const prod = clamp(k.productividad ?? 50);
  const liq  = clamp((k.liquidez    ?? 1) * 33);
  return clamp(prod * 0.6 + liq * 0.4);
}

function scoreProductivo(k) {
  const gdpS   = clamp(((k.gdp           ?? 0) / 800) * 100);
  const n      = Math.max(k.total_animales ?? 1, 1);
  const lechS  = clamp(((k.prod_leche    ?? 0) / Math.max(n * 0.55 * 20, 1)) * 100);
  const carneS = clamp(((k.prod_carne    ?? 0) / 2000) * 100);
  const condS  = clamp(((k.condicion_corporal ?? 3) / 5) * 100);
  return clamp(gdpS * 0.3 + lechS * 0.25 + carneS * 0.25 + condS * 0.2);
}

function scoreAmbiental(k) {
  const rot      = k.rotacion_potreros ?? 35;
  const rotScore = clamp(100 - Math.abs(rot - 30) * 2);
  return clamp(rotScore * 0.7 + 65 * 0.3);
}

function mejora(tipo, score, k) {
  const n = Math.max(k.total_animales ?? 1, 1);
  const tips = {
    financiero:     score < 60
      ? `Margen neto ${(k.margen_neto ?? 0).toFixed(1)}%. Reducir costos operativos y diversificar ingresos.`
      : "Excelente desempeño financiero. Explorar nuevas líneas de ingreso ganadero.",
    sanitario:      (k.animales_enfermos ?? 0) > 3
      ? `${k.animales_enfermos} animales enfermos. Aplicar protocolo preventivo con veterinario.`
      : `Cobertura vacunal: ${(((k.vacunas_aplicadas ?? 0) / n) * 100).toFixed(0)}%. Mantener calendario sanitario.`,
    reproductivo:   (k.tasa_prenez ?? 0) < 65
      ? `Tasa de preñez ${(k.tasa_prenez ?? 0).toFixed(1)}% — baja. Revisar protocolo reproductivo y nutrición de vacas.`
      : "Buena tasa reproductiva. Monitorear intervalo entre partos para optimizarlo.",
    administrativo: score < 60
      ? `Productividad al ${(k.productividad ?? 0).toFixed(0)}%. Sistematizar registros y optimizar procesos.`
      : "Buena gestión operativa. Continuar con monitoreo diario de indicadores.",
    productivo:     (k.gdp ?? 0) < 500
      ? `GDP ${(k.gdp ?? 0).toFixed(0)} g/día — bajo. Revisar plan nutricional y manejo de praderas.`
      : "Buena productividad. Optimizar costos de producción para mejorar margen.",
    ambiental:      score < 60
      ? `Rotación ${(k.rotacion_potreros ?? 0).toFixed(0)} días — ajustar a ciclos 28-35 días para sostenibilidad.`
      : "Buen manejo de praderas. Considerar certificación de producción sostenible.",
    general:        score >= 80
      ? "Operación de excelencia. Mantener estándares y explorar expansión."
      : "Mejorar los scores individuales focalizando en las áreas más débiles.",
  };
  return tips[tipo] ?? "Continuar monitoreando los indicadores periódicamente.";
}

export function calculateScores(kpis) {
  const fin = scoreFinanciero(kpis);
  const san = scoreSanitario(kpis);
  const rep = scoreReproductivo(kpis);
  const adm = scoreAdministrativo(kpis);
  const pro = scoreProductivo(kpis);
  const amb = scoreAmbiental(kpis);
  const gen = clamp(fin * 0.25 + san * 0.20 + rep * 0.20 + adm * 0.10 + pro * 0.20 + amb * 0.05);

  const raw = { financiero: fin, sanitario: san, reproductivo: rep, administrativo: adm, productivo: pro, ambiental: amb, general: gen };
  return Object.fromEntries(
    Object.entries(raw).map(([id, score]) => [id, { score: Math.round(score * 10) / 10, mejora: mejora(id, score, kpis) }])
  );
}
