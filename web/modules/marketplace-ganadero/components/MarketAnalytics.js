"use client";
import React from "react";
import { fmtCOP } from "../services/analytics-service.js";

export default function MarketAnalytics({ analytics }) {
  if (!analytics) return (
    <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
      <p style={{ fontSize: 28 }}>📊</p><p>Cargando análisis…</p>
    </div>
  );

  const { totalListings, totalActivas, categoriaStats, razasTrend, preciosPorCat, topVistas, topFavs, orderStats } = analytics;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Publicaciones",  n: totalListings,        color: "#6366f1", fmt: v => v },
          { label: "Activas",        n: totalActivas,         color: "#16a34a", fmt: v => v },
          { label: "Órdenes total",  n: orderStats.total,     color: "#0891b2", fmt: v => v },
          { label: "Volumen",        n: orderStats.volumen,   color: "#d97706", fmt: fmtCOP },
          { label: "Entregadas",     n: orderStats.entregadas,color: "#16a34a", fmt: v => v },
          { label: "Canceladas",     n: orderStats.canceladas,color: "#dc2626", fmt: v => v },
        ].map(k => (
          <div key={k.label} style={{ border: `1.5px solid ${k.color}20`, borderRadius: 10, background: "#fff", padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: k.label === "Volumen" ? 14 : 22, fontWeight: 800, color: k.color }}>{k.fmt(k.n)}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Por categoría */}
      <Section title="📊 Categorías más activas">
        {categoriaStats.slice(0, 8).map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18, minWidth: 24 }}>{c.icono}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{c.label}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{c.count} publ.</span>
              </div>
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#6366f1", borderRadius: 3, width: `${Math.min(100, (c.totalVistas / Math.max(1, categoriaStats[0]?.totalVistas)) * 100)}%` }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>👁 {c.totalVistas} vistas</span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>❤️ {c.totalFav} favs</span>
                {c.avgPrecio > 0 && <span style={{ fontSize: 10, color: "#9ca3af" }}>Ø {fmtCOP(c.avgPrecio)}</span>}
              </div>
            </div>
          </div>
        ))}
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        {/* Razas trending */}
        <Section title="🐄 Razas más buscadas">
          {razasTrend.map(([raza, vistas], i) => (
            <div key={raza} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 16 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{raza}</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>👁 {vistas}</span>
            </div>
          ))}
          {razasTrend.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>Sin datos aún.</p>}
        </Section>

        {/* Precios promedio */}
        <Section title="💰 Precios promedio por categoría">
          {preciosPorCat.slice(0, 6).map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#374151" }}>{c.label}</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmtCOP(c.avgPrecio)}</span>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{fmtCOP(c.minPrecio)} – {fmtCOP(c.maxPrecio)}</div>
              </div>
            </div>
          ))}
        </Section>
      </div>

      {/* Top publicaciones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <Section title="👁 Más vistas">
          {topVistas.map((l, i) => (
            <TopItem key={l.id} n={i + 1} titulo={l.titulo} sub={`${l.vistas} vistas · ${fmtCOP(l.precio)}`} empresa={l.empresa} />
          ))}
        </Section>
        <Section title="❤️ Más favoritos">
          {topFavs.map((l, i) => (
            <TopItem key={l.id} n={i + 1} titulo={l.titulo} sub={`${l.favoritos} favs · ${fmtCOP(l.precio)}`} empresa={l.empresa} />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", background: "#fff" }}>
      <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#111827" }}>{title}</p>
      {children}
    </div>
  );
}

function TopItem({ n, titulo, sub, empresa }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 16 }}>#{n}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titulo}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{empresa} · {sub}</p>
      </div>
    </div>
  );
}
