"use client";
import React, { useState } from "react";

export default function AuditCenter({ auditLog, onExport, onRefresh }) {
  const [q, setQ] = useState("");

  const filtered = (auditLog ?? []).filter(e =>
    !q ||
    e.accion?.toLowerCase().includes(q.toLowerCase()) ||
    e.usuario?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar por acción o usuario…"
          style={{ flex: 1, minWidth: 180, padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}
        />
        <button onClick={onRefresh} style={{ border: "1.5px solid #e5e7eb", background: "#f9fafb", color: "#374151", borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontSize: 13 }}>🔄 Actualizar</button>
        <button onClick={onExport}  style={{ border: "none", background: "#4338ca", color: "#fff", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>⬇️ Exportar CSV</button>
      </div>

      <div style={{ marginBottom: 12, fontSize: 12, color: "#6b7280" }}>
        {filtered.length} registro{filtered.length !== 1 ? "s" : ""}{q ? " filtrados" : ""}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🔒</p>
          <p style={{ fontWeight: 600, color: "#374151" }}>Sin registros de auditoría</p>
          <p style={{ fontSize: 13 }}>Las acciones del sistema se registrarán automáticamente aquí.</p>
        </div>
      ) : (
        <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Fecha", "Usuario", "Acción", "Detalles"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", borderBottom: "1.5px solid #e5e7eb", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 150).map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "9px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {new Date(e.ts).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td style={{ padding: "9px 14px", color: "#374151", fontWeight: 600 }}>{e.usuario}</td>
                    <td style={{ padding: "9px 14px", color: "#111827" }}>{e.accion}</td>
                    <td style={{ padding: "9px 14px", color: "#6b7280" }}>
                      {e.detalles
                        ? Object.entries(e.detalles).map(([k, v]) => `${k}: ${v}`).join(" · ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
