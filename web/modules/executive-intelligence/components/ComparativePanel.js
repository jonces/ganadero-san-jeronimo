"use client";
import React from "react";
import { COMPARE_DIMS } from "../constants/benchmark-config.js";

const FMT_M = v => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1e3).toFixed(0)}K`;

function HBarChart({ data, keyProp, color, label, fmt = FMT_M }) {
  const max = Math.max(...data.map(d => d[keyProp] ?? 0), 1);
  return (
    <div>
      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#374151" }}>{label}</p>
      {data.map((d, i) => {
        const pct = ((d[keyProp] ?? 0) / max) * 100;
        return (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
              <span style={{ fontWeight: 600 }}>{d.label}</span>
              <span style={{ fontWeight: 700, color: "#111827" }}>{fmt(d[keyProp] ?? 0)}</span>
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: 4, height: 8 }}>
              <div style={{
                width: `${pct}%`, height: "100%", background: color,
                borderRadius: 4, transition: "width .4s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ComparativePanel({ comparative, compareDim, onChangeDim }) {
  return (
    <div>
      {/* Dimension buttons */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
        {COMPARE_DIMS.map(d => (
          <button key={d.id} onClick={() => onChangeDim(d.id)} style={{
            padding: "6px 14px",
            border: `1.5px solid ${compareDim === d.id ? "#4338ca" : "#e5e7eb"}`,
            borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: compareDim === d.id ? "#eef2ff" : "#fff",
            color:      compareDim === d.id ? "#4338ca" : "#374151",
          }}>{d.label}</button>
        ))}
      </div>

      {!comparative?.length ? (
        <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>Sin datos comparativos.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {[
            { key: "ingresos",     color: "#6366f1", label: "Ingresos" },
            { key: "gastos",       color: "#f87171", label: "Gastos" },
            { key: "animales",     color: "#34d399", label: "Animales (cabezas)", fmt: v => Math.round(v).toLocaleString("es-CO") },
            { key: "rentabilidad", color: "#f59e0b", label: "Rentabilidad (%)",   fmt: v => `${v.toFixed(1)}%` },
          ].map(c => (
            <div key={c.key} style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#fff" }}>
              <HBarChart data={comparative} keyProp={c.key} color={c.color} label={c.label} fmt={c.fmt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
