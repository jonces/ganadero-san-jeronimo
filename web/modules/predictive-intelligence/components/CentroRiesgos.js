"use client";
import React, { useState } from "react";
import RiesgoCard            from "./RiesgoCard.js";
import { groupRisksByArea }  from "../services/risk-aggregator.js";
import { PREDICTION_AREA_CONFIG } from "../constants/prediction-areas.js";

export default function CentroRiesgos({ riskCenter = [], riskScore = 0 }) {
  const [areaFilter, setAreaFilter] = useState(null);

  const areas = [...new Set(riskCenter.map(r => r.area))];
  const grouped = groupRisksByArea(riskCenter);

  const visible = areaFilter
    ? { [areaFilter]: grouped[areaFilter] ?? [] }
    : grouped;

  const scoreBg    = riskScore >= 70 ? "#fef2f2" : riskScore >= 40 ? "#fffbeb" : "#f0fdf4";
  const scoreColor = riskScore >= 70 ? "#dc2626"  : riskScore >= 40 ? "#d97706" : "#16a34a";

  return (
    <div>
      {/* Score header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        background: scoreBg, border: `1.5px solid ${scoreColor}30`,
        borderRadius: 12, padding: "14px 18px", marginBottom: 16,
      }}>
        <div style={{ textAlign: "center", minWidth: 60 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor }}>{riskScore}</div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>Score</div>
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>Índice de Riesgo Global</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#374151" }}>
            {riskScore >= 70 ? "Nivel crítico — requiere atención inmediata"
             : riskScore >= 40 ? "Nivel moderado — monitorear y actuar"
             : "Nivel bajo — situación bajo control"}
          </p>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
          {riskCenter.length} riesgos activos
        </div>
      </div>

      {/* Filtro por área */}
      {areas.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <Chip label="Todas" active={!areaFilter} onClick={() => setAreaFilter(null)} />
          {areas.map(a => {
            const cfg = PREDICTION_AREA_CONFIG[a] ?? {};
            return (
              <Chip key={a} label={`${cfg.icono ?? ""} ${cfg.nombre ?? a}`}
                active={areaFilter === a} onClick={() => setAreaFilter(a)} />
            );
          })}
        </div>
      )}

      {/* Grupos por área */}
      {Object.keys(visible).length === 0 && (
        <p style={{ color: "#6b7280", textAlign: "center", padding: 24 }}>
          No hay riesgos registrados en este momento.
        </p>
      )}

      {Object.entries(visible).map(([area, items]) => {
        const cfg = PREDICTION_AREA_CONFIG[area] ?? {};
        return (
          <div key={area} style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: "#374151" }}>
              {cfg.icono ?? "📊"} {cfg.nombre ?? area}
            </p>
            {items.map(r => <RiesgoCard key={r.id} riesgo={r} />)}
          </div>
        );
      })}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border:       active ? "1.5px solid #3b82f6" : "1.5px solid #e5e7eb",
      borderRadius: 20, padding: "5px 12px", cursor: "pointer",
      background:   active ? "#eff6ff" : "#fff",
      color:        active ? "#1d4ed8" : "#374151",
      fontSize:     12, fontWeight: active ? 700 : 400,
      transition:   "all .15s",
    }}>{label}</button>
  );
}
