/**
 * Análisis de mercado del Marketplace Ganadero.
 */
import { getListings, getOrders } from "./marketplace-storage.js";
import { MKT_CATEGORY_CONFIG } from "../constants/categories.js";

export function getMarketAnalytics() {
  const listings = getListings().filter(l => l.status !== "eliminada");
  const orders   = getOrders();

  /* ─ Por categoría ─ */
  const byCat = {};
  listings.forEach(l => {
    if (!byCat[l.categoria]) byCat[l.categoria] = { count: 0, totalVistas: 0, totalFav: 0, precios: [] };
    byCat[l.categoria].count++;
    byCat[l.categoria].totalVistas += l.vistas ?? 0;
    byCat[l.categoria].totalFav   += l.favoritos ?? 0;
    if (l.precio) byCat[l.categoria].precios.push(l.precio);
  });

  const categoriaStats = Object.entries(byCat).map(([id, s]) => ({
    id,
    label:       MKT_CATEGORY_CONFIG[id]?.label ?? id,
    icono:       MKT_CATEGORY_CONFIG[id]?.icono ?? "📦",
    count:       s.count,
    totalVistas: s.totalVistas,
    totalFav:    s.totalFav,
    avgPrecio:   s.precios.length ? Math.round(s.precios.reduce((a, b) => a + b, 0) / s.precios.length) : 0,
  })).sort((a, b) => b.totalVistas - a.totalVistas);

  /* ─ Razas más buscadas ─ */
  const byRaza = {};
  listings.filter(l => l.raza).forEach(l => {
    byRaza[l.raza] = (byRaza[l.raza] ?? 0) + (l.vistas ?? 0);
  });
  const razasTrend = Object.entries(byRaza).sort((a, b) => b[1] - a[1]).slice(0, 8);

  /* ─ Precios promedio por categoría ─ */
  const preciosPorCat = Object.entries(byCat)
    .filter(([, s]) => s.precios.length > 0)
    .map(([id, s]) => ({
      id,
      label:     MKT_CATEGORY_CONFIG[id]?.label ?? id,
      avgPrecio: Math.round(s.precios.reduce((a, b) => a + b, 0) / s.precios.length),
      minPrecio: Math.min(...s.precios),
      maxPrecio: Math.max(...s.precios),
    }))
    .sort((a, b) => b.avgPrecio - a.avgPrecio);

  /* ─ Top publicaciones ─ */
  const topVistas  = [...listings].sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0)).slice(0, 5);
  const topFavs    = [...listings].sort((a, b) => (b.favoritos ?? 0) - (a.favoritos ?? 0)).slice(0, 5);

  /* ─ Órdenes ─ */
  const orderStats = {
    total:      orders.length,
    pendientes: orders.filter(o => o.status === "pendiente").length,
    entregadas: orders.filter(o => o.status === "entregada").length,
    canceladas: orders.filter(o => o.status === "cancelada").length,
    volumen:    orders.reduce((s, o) => s + (o.total ?? 0), 0),
  };

  return {
    totalListings: listings.length,
    totalActivas:  listings.filter(l => l.status === "activa").length,
    categoriaStats,
    razasTrend,
    preciosPorCat,
    topVistas,
    topFavs,
    orderStats,
  };
}

/** Formato de precio en COP. */
export function fmtCOP(v) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v ?? 0);
}
