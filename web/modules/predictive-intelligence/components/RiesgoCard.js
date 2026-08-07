"use client";
import React, { useState } from "react";
import { RISK_LEVEL_CONFIG }     from "../constants/risk-levels.js";
import { PREDICTION_AREA_CONFIG } from "../constants/prediction-areas.js";

export default function RiesgoCard({ riesgo }) {
  const [open, setOpen] = useState(false);
  if (!riesgo) return null;
  const lvl  = RISK_LEVEL_CONFIG[riesgo.nivel]   ?? RISK_LEVEL_CONFIG.medio;
  const area = PREDICTION_AREA_CONFIG[riesgo.area] ?? {};

  return (
    <div style={{
      border:       `2px solid ${lvl.border}`,
      borderLeft:   `4px solid ${lvl.color}`,
      borderRadius: 10,
      background:   lvl.bg,
      padding:      "14px 16px",
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{area.icono ?? "⚠️"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: lvl.color,
              background: "#fff", border: `1px solid ${lvl.border}`,
              borderRadius: 4, padding: "1px 5px", textTransform: "uppercase",
            }}>{riesgo.nivel}</span>
            <span style={{ fontSize: 10, color: "#888" }}>{area.nombre ?? riesgo.area}</span>
            <span style={{ fontSize: 10, color: "#888", marginLeft: "auto" }}>{riesgo.probabilidad}% prob.</span>
          </div>
          <p style={{ margin: "5px 0 0", fontWeight: 700, fontSize: 14, color: "#111827" }}>{riesgo.titulo}</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#374151" }}>{riesgo.impacto}</p>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{
          background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280",
        }}>{open ? "▲" : "▼"}</button>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${lvl.border}`, paddingTop: 10 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "#374151" }}>{riesgo.descripcion}</p>
          {riesgo.acciones?.length > 0 && (
            <>
              <p style={{ margin: "0 0 5px", fontSize: 12, fontWeight: 700, color: "#374151" }}>Acciones:</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {riesgo.acciones.map((a, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>{a}</li>
                ))}
              </ul>
            </>
          )}
          {riesgo.iotReady && (
            <div style={{ marginTop: 8, padding: "6px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "#1d4ed8" }}>🔌 {riesgo.iotLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
