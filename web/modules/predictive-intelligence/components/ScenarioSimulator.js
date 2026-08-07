"use client";
import React, { useState } from "react";
import { ESCENARIOS_PREDICTIVOS } from "../services/scenario-simulator.js";

export default function ScenarioSimulator({ simular, scenarioResult, scenarioLoading }) {
  const [selected, setSelected] = useState(null);

  const handleRun = (id) => {
    setSelected(id);
    simular(id);
  };

  return (
    <div>
      <p style={{ margin: "0 0 4px", fontSize: 14, color: "#374151" }}>
        Selecciona un escenario para simular el impacto económico y productivo en tu finca.
      </p>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9ca3af" }}>
        Las proyecciones son estimaciones basadas en los datos actuales registrados.
      </p>

      {/* Escenario grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginBottom: 20 }}>
        {ESCENARIOS_PREDICTIVOS.map(e => (
          <button key={e.id} onClick={() => handleRun(e.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            border:       selected === e.id ? "2px solid #6366f1" : "1.5px solid #e5e7eb",
            borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left",
            background:   selected === e.id ? "#eef2ff" : "#fff",
            transition:   "all .15s",
          }}>
            <span style={{ fontSize: 24 }}>{e.icono}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{e.titulo}</span>
          </button>
        ))}
      </div>

      {/* Resultado */}
      {scenarioLoading && (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          <p style={{ color: "#6b7280" }}>Calculando proyecciones…</p>
        </div>
      )}

      {!scenarioLoading && scenarioResult && (
        scenarioResult.error
          ? <p style={{ color: "#dc2626", padding: 16 }}>Error: {scenarioResult.error}</p>
          : <ScenarioResultView result={scenarioResult} />
      )}
    </div>
  );
}

function ScenarioResultView({ result }) {
  if (!result) return null;
  return (
    <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#111827" }}>{result.titulo}</h3>

      {/* Proyecciones */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 18 }}>
        {result.proyecciones?.map((p, i) => (
          <ProyeccionCard key={i} p={p} />
        ))}
      </div>

      {/* Línea de tiempo SVG */}
      {result.timeline?.length > 0 && <TimelineSVG data={result.timeline} />}

      {/* Análisis */}
      {result.analisis?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: "#374151" }}>Análisis:</p>
          {result.analisis.map((a, i) => (
            <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "#374151" }}>• {a}</p>
          ))}
        </div>
      )}

      {/* Recomendaciones */}
      {result.recomendaciones?.length > 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 14px" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: "#166534" }}>Recomendaciones:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {result.recomendaciones.map((r, i) => (
              <li key={i} style={{ fontSize: 13, color: "#166534", marginBottom: 3 }}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProyeccionCard({ p }) {
  const diff   = p.proyectado - (p.actual ?? 0);
  const isPos  = p.positivo === true;
  const isNeg  = p.positivo === false;
  const color  = isPos ? "#16a34a" : isNeg ? "#dc2626" : "#374151";
  const bg     = isPos ? "#f0fdf4" : isNeg ? "#fef2f2" : "#f9fafb";
  const border = isPos ? "#bbf7d0" : isNeg ? "#fecaca" : "#e5e7eb";

  const fmt = (v) => {
    if (p.formato === "moneda") return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
    if (p.formato === "porcentaje") return `${v.toFixed(1)}%`;
    return `${Math.round(v)}${p.unidad ? " " + p.unidad : ""}`;
  };

  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 8, padding: "10px 12px" }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6b7280" }}>{p.label}</p>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color }}>{fmt(p.proyectado)}</p>
      {p.actual !== 0 && (
        <p style={{ margin: "3px 0 0", fontSize: 11, color }}>
          {diff >= 0 ? "▲" : "▼"} {fmt(Math.abs(diff))} vs actual
        </p>
      )}
    </div>
  );
}

function TimelineSVG({ data }) {
  const W = 440, H = 120, PADL = 50, PADR = 20, PADT = 16, PADB = 28;
  const vals = data.map(d => d.valor);
  const min  = Math.min(...vals, 0);
  const max  = Math.max(...vals, 0);
  const range = max - min || 1;
  const gW = W - PADL - PADR;
  const gH = H - PADT - PADB;

  const xs = data.map((_, i) => PADL + (i / Math.max(1, data.length - 1)) * gW);
  const ys = data.map(d => PADT + (1 - (d.valor - min) / range) * gH);
  const zero = PADT + (1 - (0 - min) / range) * gH;

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");

  const fmtCOP = v => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(v);

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#374151" }}>Proyección de flujo:</p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto" }}>
        {/* zero line */}
        <line x1={PADL} y1={zero} x2={W - PADR} y2={zero} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 2" />
        {/* path */}
        <path d={path} stroke="#6366f1" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* dots + labels */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xs[i]} cy={ys[i]} r={4} fill={d.valor >= 0 ? "#16a34a" : "#dc2626"} />
            <text x={xs[i]} y={H - 6} textAnchor="middle" fontSize={9} fill="#6b7280">{d.label}</text>
            <text x={xs[i]} y={ys[i] - 8} textAnchor="middle" fontSize={9} fill={d.valor >= 0 ? "#16a34a" : "#dc2626"}>
              {fmtCOP(d.valor)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
