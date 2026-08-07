"use client";
import React, { useState } from "react";
import { KPI_BY_CAT, CAT_LABELS, CAT_EMOJIS } from "../constants/kpi-definitions.js";

const FMT = {
  currency: v => v >= 1e9 ? `$${(v/1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1e3).toFixed(0)}K`,
  percent:  v => `${v.toFixed(1)}%`,
  decimal:  v => v.toFixed(1),
  integer:  v => Math.round(v).toLocaleString("es-CO"),
};

function KPICard({ def, value, trend }) {
  const fmt  = FMT[def.fmt] ?? FMT.decimal;
  const disp = value != null ? fmt(value) : "—";
  const trendColor = trend > 0 ? "#16a34a" : trend < 0 ? "#dc2626" : "#6b7280";
  return (
    <div style={{
      border: "1.5px solid #f3f4f6", borderRadius: 10,
      padding: "12px 14px", background: "#fff", minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 15 }}>{def.icono}</span>
        <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600, lineHeight: 1.3 }}>{def.label}</p>
        {trend !== 0 && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: trendColor, fontWeight: 700 }}>
            {trend > 0 ? "▲" : "▼"}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#111827" }}>{disp}</p>
      {def.unidad && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}>{def.unidad}</p>}
    </div>
  );
}

const CATS = Object.keys(CAT_LABELS);

export default function KPIGrid({ kpis }) {
  const [cat, setCat] = useState("global");

  if (!kpis) return (
    <p style={{ color: "#9ca3af", textAlign: "center", padding: 60 }}>Cargando KPIs…</p>
  );

  return (
    <div>
      {/* Category tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: "7px 14px", border: "none", borderRadius: 8,
            cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            background: cat === c ? "#4338ca" : "#f3f4f6",
            color:      cat === c ? "#fff"    : "#374151",
          }}>
            {CAT_EMOJIS[c]} {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {(KPI_BY_CAT[cat] ?? []).map(def => (
          <KPICard key={def.id} def={def} value={kpis[def.id]} trend={0} />
        ))}
      </div>
    </div>
  );
}
