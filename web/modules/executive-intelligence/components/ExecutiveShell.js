"use client";
import React, { useState } from "react";
import { useExecutive }      from "../hooks/useExecutive.js";
import KPIGrid               from "./KPIGrid.js";
import ScoreDashboard        from "./ScoreDashboard.js";
import ComparativePanel      from "./ComparativePanel.js";
import BenchmarkPanel        from "./BenchmarkPanel.js";
import ExecutiveMap          from "./ExecutiveMap.js";
import IAExecutiveSummary    from "./IAExecutiveSummary.js";
import ReportCenter          from "./ReportCenter.js";
import AuditCenter           from "./AuditCenter.js";

const TABS = [
  { id: "resumen",   label: "Resumen IA",   emoji: "🤖" },
  { id: "kpis",      label: "KPIs",         emoji: "📊" },
  { id: "scores",    label: "Scores",       emoji: "🏆" },
  { id: "comparar",  label: "Comparar",     emoji: "📈" },
  { id: "benchmark", label: "Benchmark",    emoji: "🎯" },
  { id: "mapa",      label: "Mapa",         emoji: "🗺️"  },
  { id: "reportes",  label: "Reportes",     emoji: "📋" },
  { id: "auditoria", label: "Auditoría",    emoji: "🔒" },
];

function FmtM(v) {
  if (v == null) return "—";
  return v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(0)}M` : `$${(v/1e3).toFixed(0)}K`;
}

function HeaderStat({ label, value, color = "#93c5fd" }) {
  return (
    <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "7px 13px", textAlign: "center", minWidth: 78 }}>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color }}>{value ?? "—"}</p>
      <p style={{ margin: 0, fontSize: 10, opacity: .75 }}>{label}</p>
    </div>
  );
}

export default function ExecutiveShell() {
  const [tab, setTab] = useState("resumen");
  const ex = useExecutive();

  const genScore = ex.scores?.general?.score;

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 1120, margin: "0 auto", padding: "0 4px" }}>

      {/* ── Premium header ────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
        borderRadius: "0 0 20px 20px", padding: "22px 26px 20px",
        marginBottom: 20, color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-.3px" }}>
              📊 Executive Intelligence Center
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, opacity: .65 }}>
              Business Intelligence · Centro Ejecutivo · GanaderoSG
              {ex.lastRun && ` · ${new Date(ex.lastRun).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {ex.kpis && <>
              <HeaderStat label="Ingresos"   value={FmtM(ex.kpis.ingresos)}     color="#93c5fd" />
              <HeaderStat label="Utilidad"   value={FmtM(ex.kpis.utilidad)}      color="#6ee7b7" />
              <HeaderStat label="Animales"   value={Math.round(ex.kpis.total_animales ?? 0)} color="#fde68a" />
              <HeaderStat label="Score"      value={genScore ? `${Math.round(genScore)}/100` : "—"} color="#c4b5fd" />
            </>}
            <button onClick={ex.refresh} disabled={ex.loading} style={{
              border: "1.5px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.1)",
              color: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}>
              {ex.loading ? "⏳" : "🔄"} Actualizar
            </button>
          </div>
        </div>

        {/* Empresas toggle */}
        {ex.empresas.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, opacity: .6, alignSelf: "center" }}>Vista:</span>
            {ex.empresas.map(emp => (
              <button key={emp.id} onClick={() => ex.toggleEmpresa(emp.id)} style={{
                border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 20,
                background: emp.activa ? "rgba(99,102,241,.55)" : "rgba(255,255,255,.08)",
                color: "#fff", padding: "4px 13px", cursor: "pointer", fontSize: 11, fontWeight: 600,
              }}>
                {emp.activa ? "✅" : "○"} {emp.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error banner */}
      {ex.error && (
        <div style={{ padding: "10px 16px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "#991b1b" }}>
          ⚠️ {ex.error} — se muestran datos estimados basados en parámetros típicos.
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", overflowX: "auto", gap: 2, borderBottom: "2px solid #f3f4f6", marginBottom: 22 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === "auditoria") ex.reloadAudit();
            }}
            style={{
              padding: "10px 14px", border: "none",
              borderBottom: tab === t.id ? "2.5px solid #4338ca" : "2.5px solid transparent",
              background: "none", cursor: "pointer",
              fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? "#4338ca" : "#6b7280",
              fontSize: 12, whiteSpace: "nowrap",
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ paddingBottom: 60 }}>
        {tab === "resumen"   && <IAExecutiveSummary summary={ex.summary} scores={ex.scores} />}
        {tab === "kpis"      && <KPIGrid kpis={ex.kpis} />}
        {tab === "scores"    && <ScoreDashboard scores={ex.scores} />}
        {tab === "comparar"  && <ComparativePanel comparative={ex.comparative} compareDim={ex.compareDim} onChangeDim={ex.changeCompareDim} />}
        {tab === "benchmark" && <BenchmarkPanel benchmark={ex.benchmark} />}
        {tab === "mapa"      && <ExecutiveMap kpis={ex.kpis} />}
        {tab === "reportes"  && (
          <ReportCenter
            onExportCSV={ex.doExportCSV}
            onExportHTML={ex.doExportHTML}
            onPrint={ex.doPrint}
            onExportOther={ex.doExportOther}
            schedules={ex.schedules}
            onAddSchedule={ex.addSchedule}
            onRemoveSchedule={ex.removeSchedule}
          />
        )}
        {tab === "auditoria" && (
          <AuditCenter
            auditLog={ex.auditLog}
            onExport={ex.exportAuditCSV}
            onRefresh={ex.reloadAudit}
          />
        )}
      </div>
    </div>
  );
}
