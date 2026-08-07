"use client";
import React, { useState } from "react";
import { getScoreLevel } from "../constants/score-config.js";

const SECTIONS = [
  { id: "hallazgos",     ico: "🔍", label: "Hallazgos",          color: "#d97706" },
  { id: "oportunidades", ico: "🚀", label: "Oportunidades",      color: "#16a34a" },
  { id: "riesgos",       ico: "⚠️",  label: "Riesgos",            color: "#dc2626" },
  { id: "metas",         ico: "🎯", label: "Metas Propuestas",   color: "#6366f1" },
  { id: "acciones",      ico: "✅", label: "Acciones Sugeridas", color: "#0891b2" },
];

export default function IAExecutiveSummary({ summary, scores }) {
  const [open, setOpen] = useState({ hallazgos: true });

  if (!summary) return (
    <p style={{ color: "#9ca3af", textAlign: "center", padding: 60 }}>Generando análisis IA…</p>
  );

  const score = Math.round(summary.scoreGeneral ?? 0);
  const level = getScoreLevel(score);

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1d4ed8 100%)",
        borderRadius: 16, padding: "26px 30px", marginBottom: 20, color: "#fff",
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, opacity: .65 }}>
          🤖 Centro IA — Análisis Ejecutivo Automático
        </p>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>Resumen Ejecutivo</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, opacity: .9 }}>{summary.resumenEjecutivo}</p>
          </div>
          <div style={{ textAlign: "center", minWidth: 110 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, opacity: .65 }}>Score General</p>
            <p style={{ margin: 0, fontSize: 54, fontWeight: 900, color: level.color, lineHeight: 1 }}>{score}</p>
            <span style={{
              fontSize: 12, fontWeight: 700, color: level.color,
              background: level.bg, borderRadius: 6, padding: "2px 10px",
            }}>{level.label}</span>
          </div>
        </div>
      </div>

      {/* Prioridades */}
      {summary.prioridades?.length > 0 && (
        <div style={{ border: "1.5px solid #fcd34d", borderRadius: 10, padding: "14px 18px", background: "#fffbeb", marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 13, color: "#92400e" }}>🔥 Prioridades Inmediatas</p>
          {summary.prioridades.map((p, i) => (
            <p key={i} style={{ margin: "4px 0", fontSize: 13, color: "#78350f" }}>{p}</p>
          ))}
        </div>
      )}

      {/* Expandable sections */}
      {SECTIONS.map(sec => {
        const items = summary[sec.id] ?? [];
        return (
          <div key={sec.id} style={{ border: `1.5px solid ${sec.color}20`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
            <button
              onClick={() => setOpen(o => ({ ...o, [sec.id]: !o[sec.id] }))}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", background: "#fff", border: "none", cursor: "pointer",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{sec.ico} {sec.label}</span>
              <span style={{ color: "#6b7280", fontSize: 12 }}>
                {open[sec.id] ? "▲" : "▼"} ({items.length})
              </span>
            </button>
            {open[sec.id] && (
              <div style={{ padding: "0 16px 14px", background: "#fafafa" }}>
                {items.length === 0
                  ? <p style={{ color: "#9ca3af", fontSize: 13, margin: "8px 0 0" }}>Sin elementos registrados.</p>
                  : items.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <span style={{ color: sec.color, fontSize: 14, flexShrink: 0, paddingTop: 1 }}>•</span>
                      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
