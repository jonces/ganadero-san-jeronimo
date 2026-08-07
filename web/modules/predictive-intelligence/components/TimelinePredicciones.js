"use client";
import React, { useState } from "react";
import PrediccionCard from "./PrediccionCard.js";
import { RISK_LEVEL_CONFIG } from "../constants/risk-levels.js";

const HORIZONS = [
  { key: "7d",  label: "7 días",    emoji: "⚡" },
  { key: "30d", label: "30 días",   emoji: "📅" },
  { key: "90d", label: "90 días",   emoji: "📆" },
  { key: "6m",  label: "6 meses",   emoji: "📊" },
  { key: "1y",  label: "1 año",     emoji: "🗓️" },
];

export default function TimelinePredicciones({ timeline = [] }) {
  const [active, setActive] = useState("30d");

  const bucket = timeline.find(t => t.horizonte === active);
  const items  = bucket?.items ?? [];

  return (
    <div>
      {/* Tab selector */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16,
        overflowX: "auto", paddingBottom: 4,
      }}>
        {HORIZONS.map(h => {
          const b = timeline.find(t => t.horizonte === h.key);
          return (
            <button key={h.key} onClick={() => setActive(h.key)} style={{
              border:       active === h.key ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
              borderRadius: 8, padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap",
              background:   active === h.key ? "#eef2ff" : "#fff",
              color:        active === h.key ? "#4338ca" : "#374151",
              fontWeight:   active === h.key ? 700 : 400, fontSize: 13,
            }}>
              {h.emoji} {h.label}
              {b && (b.criticos > 0 || b.altos > 0) && (
                <span style={{
                  marginLeft: 6, fontSize: 10, fontWeight: 700,
                  color: b.criticos > 0 ? "#dc2626" : "#d97706",
                  background: b.criticos > 0 ? "#fef2f2" : "#fffbeb",
                  borderRadius: 10, padding: "1px 5px",
                }}>
                  {b.criticos > 0 ? `${b.criticos} crítico${b.criticos > 1 ? "s" : ""}` : `${b.altos} alto${b.altos > 1 ? "s" : ""}`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>✅</p>
          <p style={{ margin: 0, fontWeight: 600 }}>Sin predicciones para este horizonte</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>Todo bajo control en los próximos {HORIZONS.find(h => h.key === active)?.label}.</p>
        </div>
      ) : (
        <>
          <SummaryBadges items={items} />
          {items.map(p => <PrediccionCard key={p.id} prediccion={p} />)}
        </>
      )}
    </div>
  );
}

function SummaryBadges({ items }) {
  const counts = { critico: 0, alto: 0, medio: 0, bajo: 0 };
  items.forEach(p => counts[p.nivel] = (counts[p.nivel] ?? 0) + 1);
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
      {Object.entries(counts).filter(([, n]) => n > 0).map(([nivel, n]) => {
        const cfg = RISK_LEVEL_CONFIG[nivel];
        return (
          <span key={nivel} style={{
            fontSize: 11, fontWeight: 700, color: cfg.color,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 6, padding: "3px 8px",
          }}>{n} {nivel}</span>
        );
      })}
      <span style={{ fontSize: 11, color: "#6b7280", padding: "3px 8px" }}>
        Total: {items.length}
      </span>
    </div>
  );
}
