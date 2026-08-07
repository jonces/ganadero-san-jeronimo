"use client";
import React, { useState } from "react";
import { REPORT_FORMATS, REPORT_FRECUENCIAS, REPORT_CANALES } from "../constants/report-config.js";

export default function ReportCenter({
  onExportCSV, onExportHTML, onPrint, onExportOther,
  schedules, onAddSchedule, onRemoveSchedule,
}) {
  const [lastResult, setLastResult] = useState(null);
  const [form, setForm] = useState({ frecuencia: "semanal", canal: "correo", email: "" });

  const handle = (fmt) => {
    let r;
    if (fmt === "csv")   r = onExportCSV?.();
    else if (fmt === "html")  r = onExportHTML?.();
    else if (fmt === "print") r = onPrint?.();
    else                 r = onExportOther?.(fmt);
    if (r) setLastResult(r);
  };

  return (
    <div>
      {/* Generate */}
      <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: "#111827" }}>Generar Reporte</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 10, marginBottom: 16 }}>
        {REPORT_FORMATS.map(f => (
          <button key={f.id} onClick={() => handle(f.id)} style={{
            border: `1.5px solid ${f.color}30`, borderRadius: 12,
            padding: "16px 12px", background: "#fff", cursor: "pointer",
            textAlign: "center", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 6, opacity: f.disponible ? 1 : 0.55,
          }}>
            <span style={{ fontSize: 26 }}>{f.icono}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{f.label}</span>
            {!f.disponible && <span style={{ fontSize: 10, color: "#9ca3af" }}>Pro</span>}
          </button>
        ))}
      </div>

      {lastResult && (
        <div style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 8,
          background: lastResult.ok ? "#f0fdf4" : "#fffbeb",
          border: `1.5px solid ${lastResult.ok ? "#86efac" : "#fcd34d"}`,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: lastResult.ok ? "#166534" : "#92400e" }}>
            {lastResult.ok ? "✅" : "ℹ️"} {lastResult.nota}
          </p>
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1.5px solid #f3f4f6", margin: "24px 0" }} />

      {/* Schedule */}
      <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: "#111827" }}>Reportes Automáticos</h3>
      <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", background: "#fff", marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Frecuencia</label>
            <select value={form.frecuencia} onChange={e => setForm(p => ({ ...p, frecuencia: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
              {REPORT_FRECUENCIAS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Canal</label>
            <select value={form.canal} onChange={e => setForm(p => ({ ...p, canal: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
              {REPORT_CANALES.map(c => <option key={c.id} value={c.id}>{c.icono} {c.label}{!c.disponible ? " (Pro)" : ""}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Email destino</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="correo@empresa.com"
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
        </div>
        <button onClick={() => onAddSchedule?.(form)} style={{
          border: "none", background: "#4338ca", color: "#fff",
          borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13,
        }}>➕ Programar Reporte</button>
      </div>

      {schedules.length === 0
        ? <p style={{ color: "#9ca3af", fontSize: 13 }}>No hay reportes programados.</p>
        : schedules.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{REPORT_CANALES.find(c => c.id === s.canal)?.icono ?? "📋"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>
                {REPORT_FRECUENCIAS.find(f => f.id === s.frecuencia)?.label ?? s.frecuencia} — {s.canal}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>{s.email || "Sin email configurado"}</p>
            </div>
            <button onClick={() => onRemoveSchedule?.(s.id)} style={{
              border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626",
              borderRadius: 6, padding: "5px 11px", cursor: "pointer", fontSize: 12,
            }}>Eliminar</button>
          </div>
        ))}
    </div>
  );
}
