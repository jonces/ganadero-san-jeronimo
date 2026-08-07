"use client";
import React, { useState } from "react";
import { SCORES, getScoreLevel } from "../constants/score-config.js";

export default function ScoreCard({ id, data }) {
  const [open, setOpen] = useState(false);
  const cfg   = SCORES[id];
  const score = Math.round(data?.score ?? 0);
  const level = getScoreLevel(score);

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        border: `1.5px solid ${cfg.color}30`, borderRadius: 12,
        padding: "16px 18px", background: "#fff", cursor: "pointer",
        transition: "box-shadow .15s",
        boxShadow: open ? `0 0 0 2px ${cfg.color}40` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{cfg.icono}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{cfg.label}</p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: level.color }}>{level.label}</p>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{score}</div>
      </div>

      {/* Track */}
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{
          width: `${score}%`, height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${cfg.color}66, ${cfg.color})`,
          transition: "width .5s ease",
        }} />
      </div>

      {open && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "#f9fafb", borderRadius: 8 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6b7280" }}>{cfg.descripcion}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#374151" }}>
            <strong>Cómo mejorar:</strong> {data?.mejora}
          </p>
        </div>
      )}
    </div>
  );
}
