"use client";
import React from "react";
import { BENCHMARK_KPI_LABELS } from "../constants/benchmark-config.js";

const POS_CFG = {
  top25:   { label: "Top 25%",   color: "#16a34a", bg: "#f0fdf4" },
  mediana: { label: "Mediana",   color: "#2563eb", bg: "#eff6ff" },
  p25:     { label: "P25",       color: "#d97706", bg: "#fffbeb" },
  bajo:    { label: "< P25",     color: "#dc2626", bg: "#fef2f2" },
};

function fmt(v) {
  if (v == null) return "—";
  return v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1000 ? v.toFixed(0) : v.toFixed(1);
}

function BenchmarkBar({ valor, bench }) {
  const min = Math.min(bench.p25, valor) * 0.8;
  const max = Math.max(bench.p75, valor) * 1.1 || 1;
  const pct = v => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  return (
    <div style={{ position: "relative", height: 16, background: "#f3f4f6", borderRadius: 4, margin: "8px 0 4px" }}>
      {[{ v: bench.p25, c: "#fbbf24" }, { v: bench.p50, c: "#60a5fa" }, { v: bench.p75, c: "#4ade80" }].map((m, i) => (
        <div key={i} style={{
          position: "absolute", left: `${pct(m.v)}%`, top: 0, bottom: 0,
          width: 2, background: m.c, transform: "translateX(-50%)",
        }} />
      ))}
      <div style={{
        position: "absolute", left: `${pct(valor)}%`, top: -2, bottom: -2,
        width: 4, background: "#4338ca", borderRadius: 2, transform: "translateX(-50%)",
      }} />
    </div>
  );
}

export default function BenchmarkPanel({ benchmark }) {
  if (!benchmark?.length) return (
    <p style={{ color: "#9ca3af", textAlign: "center", padding: 60 }}>Cargando benchmark…</p>
  );

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>
          📊 <strong>Benchmarks sectoriales</strong> basados en promedios de la ganadería colombiana (FEDEGAN / ICA 2025).
          La barra azul es tu valor; las líneas muestran P25 (amarillo), P50 (azul claro) y P75 (verde).
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {benchmark.map(item => {
          const pos = POS_CFG[item.posicion] ?? POS_CFG.bajo;
          return (
            <div key={item.kpiId} style={{
              border: `1.5px solid ${pos.color}30`, borderRadius: 10,
              padding: "14px 16px", background: "#fff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {BENCHMARK_KPI_LABELS[item.kpiId] ?? item.kpiId}
                </p>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: pos.color,
                  background: pos.bg, borderRadius: 4, padding: "2px 8px",
                }}>{pos.label}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 900, color: "#111827" }}>
                {fmt(item.valor)}
              </p>
              <BenchmarkBar valor={item.valor} bench={item.bench} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
                <span>P25: {fmt(item.bench.p25)}</span>
                <span>P50: {fmt(item.bench.p50)}</span>
                <span>P75: {fmt(item.bench.p75)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
