"use client";
import React, { useState } from "react";
import { RISK_LEVEL_CONFIG, CONFIDENCE_CONFIG } from "../constants/risk-levels.js";
import { PREDICTION_AREA_CONFIG }               from "../constants/prediction-areas.js";

export default function PrediccionCard({ prediccion, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!prediccion) return null;

  const lvl  = RISK_LEVEL_CONFIG[prediccion.nivel]   ?? RISK_LEVEL_CONFIG.bajo;
  const conf = CONFIDENCE_CONFIG[prediccion.confianza] ?? CONFIDENCE_CONFIG.baja;
  const area = PREDICTION_AREA_CONFIG[prediccion.area] ?? {};

  return (
    <div style={{
      border:       `1.5px solid ${lvl.border}`,
      borderRadius: 12,
      background:   lvl.bg,
      padding:      compact ? "12px 14px" : "16px",
      marginBottom: 10,
      cursor:       "pointer",
    }} onClick={() => setExpanded(e => !e)}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{area.icono ?? "📊"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: lvl.color,
              background: "#fff", border: `1px solid ${lvl.border}`,
              borderRadius: 4, padding: "2px 6px", textTransform: "uppercase",
            }}>{prediccion.nivel}</span>
            <span style={{
              fontSize: 11, color: conf.color ?? "#666",
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 4, padding: "2px 6px",
            }}>{conf.label ?? prediccion.confianza}</span>
            <span style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>
              {HORIZON_LABEL[prediccion.horizonte] ?? prediccion.horizonte}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontWeight: 600, fontSize: compact ? 13 : 14, color: "#1f2937" }}>
            {prediccion.titulo}
          </p>
        </div>
        <ProbBar prob={prediccion.probabilidad} color={lvl.color} />
      </div>

      {/* Description */}
      {!compact && (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
          {prediccion.descripcion}
        </p>
      )}

      {/* Expanded detail */}
      {expanded && !compact && (
        <div style={{ marginTop: 12, borderTop: "1px solid " + lvl.border, paddingTop: 12 }}>
          {prediccion.acciones?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#374151" }}>Acciones recomendadas:</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {prediccion.acciones.map((a, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {prediccion.datosUtilizados?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Datos utilizados:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {prediccion.datosUtilizados.map((d, i) => (
                  <span key={i} style={{ fontSize: 11, background: "#f3f4f6", borderRadius: 4, padding: "2px 6px", color: "#374151" }}>{d}</span>
                ))}
              </div>
            </div>
          )}
          {prediccion.limitaciones?.length > 0 && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Limitaciones:</p>
              {prediccion.limitaciones.map((l, i) => (
                <p key={i} style={{ margin: "0 0 2px", fontSize: 11, color: "#9ca3af" }}>⚠ {l}</p>
              ))}
            </div>
          )}
          {prediccion.iotReady && (
            <div style={{ marginTop: 8, padding: "6px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "#1d4ed8" }}>🔌 {prediccion.iotLabel ?? "Datos IoT disponibles cuando se conecte"}</span>
            </div>
          )}
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>
            {prediccion.disclaimer}
          </p>
        </div>
      )}

      {!compact && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "right" }}>
          {expanded ? "▲ Menos" : "▼ Más detalles"}
        </p>
      )}
    </div>
  );
}

function ProbBar({ prob, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{prob ?? "--"}%</span>
      <div style={{ width: 36, height: 4, background: "#e5e7eb", borderRadius: 2, marginTop: 3 }}>
        <div style={{ width: `${prob ?? 0}%`, height: "100%", background: color, borderRadius: 2, transition: "width .3s" }} />
      </div>
    </div>
  );
}

const HORIZON_LABEL = {
  "7d":  "7 días",
  "30d": "30 días",
  "90d": "90 días",
  "6m":  "6 meses",
  "1y":  "1 año",
};
