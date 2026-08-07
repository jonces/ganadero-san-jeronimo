"use client";
import React, { useState } from "react";
import { usePredictive }        from "../hooks/usePredictive.js";
import CentroRiesgos            from "./CentroRiesgos.js";
import TimelinePredicciones     from "./TimelinePredicciones.js";
import PrediccionCard           from "./PrediccionCard.js";
import ScenarioSimulator        from "./ScenarioSimulator.js";
import IoTReadyBanner           from "./IoTReadyBanner.js";
import { PREDICTION_AREA_CONFIG } from "../constants/prediction-areas.js";
import { RISK_LEVEL_CONFIG }      from "../constants/risk-levels.js";

const TABS = [
  { id: "resumen",     label: "Resumen",     emoji: "🎯" },
  { id: "riesgos",     label: "Centro Riesgos", emoji: "⚠️" },
  { id: "timeline",    label: "Línea de Tiempo", emoji: "📅" },
  { id: "predicciones",label: "Predicciones", emoji: "🔮" },
  { id: "escenarios",  label: "Escenarios",  emoji: "🧮" },
];

export default function PredictiveShell() {
  const [tab, setTab] = useState("resumen");
  const {
    predictions, allPredictions, summary, riskCenter, timeline, riskScore,
    loading, error, lastRun, iotStatus, areaFilter, setAreaFilter,
    scenarioResult, scenarioLoading, refresh, simular,
  } = usePredictive();

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 860, margin: "0 auto", padding: "0 4px" }}>
      {/* Header */}
      <div style={{ padding: "20px 4px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>
              🔮 Inteligencia Predictiva
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Análisis predictivo en tiempo real de tu finca ganadera
            </p>
          </div>
          <button onClick={refresh} disabled={loading} style={{
            border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 14px",
            background: loading ? "#f3f4f6" : "#fff", cursor: loading ? "default" : "pointer",
            fontSize: 13, color: "#374151", fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
          }}>
            {loading ? "⏳ Analizando…" : "🔄 Actualizar"}
          </button>
        </div>

        {/* Semáforo */}
        {summary && !loading && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: summary.semaforo === "rojo" ? "#fef2f2" : summary.semaforo === "amarillo" ? "#fffbeb" : "#f0fdf4",
            border: `1.5px solid ${summary.semaforo === "rojo" ? "#fecaca" : summary.semaforo === "amarillo" ? "#fde68a" : "#bbf7d0"}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>
              {summary.semaforo === "rojo" ? "🔴" : summary.semaforo === "amarillo" ? "🟡" : "🟢"}
            </span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{summary.texto}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                {summary.total} predicciones · {summary.criticos} críticas · {summary.altos} altas · {summary.medios} medias
              </p>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: riskScore >= 70 ? "#dc2626" : riskScore >= 40 ? "#d97706" : "#16a34a" }}>
                {riskScore}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Riesgo</div>
            </div>
          </div>
        )}

        {lastRun && (
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "right" }}>
            Última actualización: {new Date(lastRun).toLocaleString("es-CO")}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", overflowX: "auto", gap: 4, borderBottom: "2px solid #f3f4f6", paddingBottom: 0, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 14px", border: "none", borderBottom: tab === t.id ? "2.5px solid #6366f1" : "2.5px solid transparent",
            background: "none", cursor: "pointer", fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? "#4338ca" : "#6b7280", fontSize: 13, whiteSpace: "nowrap",
          }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>⚠️ {error}. Mostrando predicciones estimadas con datos disponibles.</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔮</div>
          <p style={{ color: "#6b7280", fontWeight: 600 }}>Analizando datos de la finca…</p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Los motores predictivos están trabajando</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div style={{ paddingBottom: 40 }}>
          {tab === "resumen" && <ResumenTab predictions={allPredictions} summary={summary} iotStatus={iotStatus} />}
          {tab === "riesgos" && <CentroRiesgos riskCenter={riskCenter} riskScore={riskScore} />}
          {tab === "timeline" && <TimelinePredicciones timeline={timeline} />}
          {tab === "predicciones" && (
            <PrediccionesTab predictions={allPredictions} areaFilter={areaFilter} setAreaFilter={setAreaFilter} />
          )}
          {tab === "escenarios" && (
            <ScenarioSimulator simular={simular} scenarioResult={scenarioResult} scenarioLoading={scenarioLoading} />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-views ──────────────────────────────────────────────────────────── */

function ResumenTab({ predictions, summary, iotStatus }) {
  const top = predictions.slice(0, 5);
  const areas = [...new Set(predictions.map(p => p.area))];

  return (
    <div>
      <IoTReadyBanner iotStatus={iotStatus} />

      {/* Stats by area */}
      {areas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: "#374151" }}>Por área:</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {areas.map(a => {
              const cfg   = PREDICTION_AREA_CONFIG[a] ?? {};
              const items = predictions.filter(p => p.area === a);
              const maxLvl= items[0]?.nivel ?? "bajo";
              const lvlCfg = RISK_LEVEL_CONFIG[maxLvl] ?? RISK_LEVEL_CONFIG.bajo;
              return (
                <div key={a} style={{
                  border: `1.5px solid ${lvlCfg.border}`, borderRadius: 8,
                  background: lvlCfg.bg, padding: "10px 12px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 20 }}>{cfg.icono ?? "📊"}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 4 }}>{cfg.nombre ?? a}</div>
                  <div style={{ fontSize: 10, color: lvlCfg.color, fontWeight: 700 }}>{items.length} predicc.</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top predictions */}
      {top.length > 0 && (
        <div>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: "#374151" }}>Top predicciones prioritarias:</p>
          {top.map(p => <PrediccionCard key={p.id} prediccion={p} compact />)}
        </div>
      )}
    </div>
  );
}

function PrediccionesTab({ predictions, areaFilter, setAreaFilter }) {
  const areas = [...new Set(predictions.map(p => p.area))];
  const visible = areaFilter ? predictions.filter(p => p.area === areaFilter) : predictions;

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <Chip label="Todas" active={!areaFilter} onClick={() => setAreaFilter(null)} />
        {areas.map(a => {
          const cfg = PREDICTION_AREA_CONFIG[a] ?? {};
          return (
            <Chip key={a} label={`${cfg.icono ?? ""} ${cfg.nombre ?? a}`}
              active={areaFilter === a} onClick={() => setAreaFilter(areaFilter === a ? null : a)} />
          );
        })}
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280" }}>{visible.length} predicciones</p>
      {visible.map(p => <PrediccionCard key={p.id} prediccion={p} />)}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border:       active ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
      borderRadius: 20, padding: "5px 12px", cursor: "pointer",
      background:   active ? "#eef2ff" : "#fff",
      color:        active ? "#4338ca" : "#374151",
      fontSize:     12, fontWeight: active ? 700 : 400,
    }}>{label}</button>
  );
}
