import { appendHistory } from "./bi-storage.js";

function rnd(min, max) { return min + Math.random() * (max - min); }

export function calculateKPIs(data) {
  const dash = data.dashboard ?? {};
  const inc  = data.incidentes ?? [];
  const inv  = data.inventario ?? [];
  const ev   = data.eventos    ?? [];
  const sfhA = data.sfhAlerts  ?? [];

  // ── Hato ──────────────────────────────────────────────────────
  const animales   = Math.round(dash.totalAnimales ?? rnd(120, 380));
  const vacas      = Math.round(animales * 0.55);
  const prenadas   = Math.round(vacas * rnd(0.55, 0.82));

  // ── Financiero base ───────────────────────────────────────────
  const ingresos = dash.ingresos ?? rnd(80e6, 320e6);
  const gastos   = dash.gastos   ?? rnd(50e6, 180e6);
  const utilidad = ingresos - gastos;

  const valorAnimal  = rnd(3.2e6, 6.8e6);
  const valorHato    = animales * valorAnimal;
  const valorInv     = inv.reduce((s, i) => s + (i.cantidad ?? 0) * (i.precioUnitario ?? 0), 0) || rnd(8e6, 45e6);
  const valorActivos = valorHato + valorInv + rnd(20e6, 120e6);

  // ── Sanitario ─────────────────────────────────────────────────
  const enfermos     = inc.filter(i => i.estado !== "resuelto").length || Math.round(animales * rnd(0.01, 0.04));
  const recuperados  = inc.filter(i => i.estado === "resuelto").length || Math.round(animales * rnd(0.04, 0.08));
  const tratamientos = inc.length || Math.round(enfermos * 1.4);
  const alertasSan   = sfhA.filter(a => a.severidad === "alta" || a.tipo?.includes("san")).length;
  const vacunasApl   = ev.filter(e => e.tipo === "vacunacion").length || Math.round(animales * 0.85);
  const vacunasPend  = Math.round(animales * 0.15);
  const useMed       = inc.length * rnd(35000, 120000) || rnd(2e6, 8e6);

  // ── Reproductivo ──────────────────────────────────────────────
  const tasaPrenez   = (prenadas / Math.max(vacas, 1)) * 100;
  const tasaNatal    = rnd(62, 82);
  const tasaDes      = rnd(58, 78);
  const tasaReemp    = rnd(12, 22);
  const intPartos    = rnd(370, 430);
  const svcConc      = rnd(1.6, 2.8);

  // ── Producción ────────────────────────────────────────────────
  const gdp          = rnd(480, 720);
  const prodLeche    = vacas * rnd(10, 18);
  const prodCarne    = rnd(800, 2400);
  const edadProm     = rnd(24, 48);
  const condCorp     = rnd(2.8, 4.2);
  const rotPot       = rnd(28, 45);
  const mortalidad   = Math.round(animales * rnd(0.01, 0.04));

  // ── Márgenes ──────────────────────────────────────────────────
  const margenBruto  = ((ingresos - gastos * 0.6) / ingresos) * 100;
  const margenNeto   = (utilidad / ingresos) * 100;
  const roi          = (utilidad / Math.max(gastos, 1)) * 100;
  const endeud       = rnd(15, 45);
  const product      = rnd(65, 90);

  const kpis = {
    // Global
    ingresos, gastos, utilidad,
    flujo_caja:       utilidad * rnd(0.7, 1.1),
    capital:          valorActivos * (1 - endeud / 100),
    valor_hato:       valorHato,
    valor_inventario: valorInv,
    valor_activos:    valorActivos,
    rentabilidad:     margenNeto,
    liquidez:         ingresos / Math.max(gastos * 0.8, 1),
    endeudamiento:    endeud,
    productividad:    product,
    // Ganadero
    total_animales: animales,
    nacimientos:    Math.round(animales * rnd(0.18, 0.28)),
    destetes:       Math.round(animales * rnd(0.15, 0.24)),
    prenez:         prenadas,
    mortalidad,
    gdp, prod_leche: prodLeche, prod_carne: prodCarne,
    edad_promedio: edadProm, condicion_corporal: condCorp, rotacion_potreros: rotPot,
    // Sanitario
    vacunas_aplicadas: vacunasApl, vacunas_pendientes: vacunasPend,
    tratamientos, animales_enfermos: enfermos, animales_recuperados: recuperados,
    alertas_sanitarias: alertasSan, uso_medicamentos: useMed,
    // Reproductivo
    tasa_prenez: tasaPrenez, intervalo_partos: intPartos,
    servicios_concepcion: svcConc, tasa_natalidad: tasaNatal,
    tasa_destete: tasaDes, tasa_reemplazo: tasaReemp,
    // Financiero
    margen_bruto: margenBruto, margen_neto: margenNeto, roi,
    costo_animal: gastos / Math.max(animales, 1),
    costo_kg:     (gastos * 0.4) / Math.max(prodCarne, 1),
    costo_litro:  (gastos * 0.3) / Math.max(prodLeche * 30, 1),
    ing_finca:    ingresos * 0.6,
    ing_empresa:  ingresos,
  };

  appendHistory(kpis);
  return kpis;
}
