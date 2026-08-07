"use client";
import React, { useState } from "react";
import { ALERT_SEVERITY_CONFIG } from "../constants/alert-channels.js";
import { markAlertRead, clearAlerts } from "../services/hub-storage.js";

export default function AlertCenter({ alerts = [], onRefresh }) {
  const [sevFilter, setSevFilter] = useState(null);
  const [showRead,  setShowRead]  = useState(false);

  const handleRead = (id) => {
    markAlertRead(id);
    onRefresh?.();
  };

  const handleClear = () => {
    clearAlerts();
    onRefresh?.();
  };

  const unread  = alerts.filter(a => !a.leida);
  const visible = alerts
    .filter(a => (showRead || !a.leida))
    .filter(a => !sevFilter || a.severidad === sevFilter);

  const counts = {};
  alerts.forEach(a => { counts[a.severidad] = (counts[a.severidad] ?? 0) + 1; });

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.entries(ALERT_SEVERITY_CONFIG).filter(([k]) => counts[k]).map(([k, cfg]) => (
          <button key={k} onClick={() => setSevFilter(sevFilter === k ? null : k)} style={{
            border:     `1.5px solid ${sevFilter === k ? cfg.color : cfg.border}`,
            borderRadius: 8, padding: "6px 12px", cursor: "pointer",
            background: sevFilter === k ? cfg.bg : "#fff",
            color:      cfg.color, fontSize: 12, fontWeight: 700,
          }}>
            {cfg.icono} {cfg.label} ({counts[k]})
          </button>
        ))}
        <button onClick={() => setShowRead(v => !v)} style={{
          border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "6px 12px",
          cursor: "pointer", background: showRead ? "#f3f4f6" : "#fff",
          color: "#6b7280", fontSize: 12,
        }}>
          {showRead ? "Ocultar leídas" : "Ver todas"}
        </button>
        {alerts.length > 0 && (
          <button onClick={handleClear} style={{
            border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, marginLeft: "auto",
          }}>
            Limpiar alertas
          </button>
        )}
      </div>

      {unread.length > 0 && (
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
          🔔 {unread.length} alerta{unread.length > 1 ? "s" : ""} sin leer
        </p>
      )}

      {visible.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af" }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>🔔</p>
          <p style={{ margin: 0, fontWeight: 600 }}>Sin alertas activas</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>Todo bajo control.</p>
        </div>
      )}

      {visible.map(alert => {
        const cfg = ALERT_SEVERITY_CONFIG[alert.severidad] ?? ALERT_SEVERITY_CONFIG.info;
        return (
          <div key={alert.id} style={{
            border:       `1.5px solid ${cfg.border}`,
            borderLeft:   `4px solid ${cfg.color}`,
            borderRadius: 10, background: alert.leida ? "#f9fafb" : cfg.bg,
            padding:      "12px 14px", marginBottom: 8, opacity: alert.leida ? 0.65 : 1,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{cfg.icono}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827" }}>
                  {alert.ruleTitulo ?? "Alerta del sistema"}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#374151" }}>{alert.mensaje}</p>
                {alert.deviceNombre && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                    📟 {alert.deviceNombre}
                    {alert.valorActual != null && ` — Valor: ${alert.valorActual}`}
                  </p>
                )}
                <p style={{ margin: "4px 0 0", fontSize: 10, color: "#9ca3af" }}>
                  {new Date(alert.ts).toLocaleString("es-CO")}
                </p>
              </div>
              {!alert.leida && (
                <button onClick={() => handleRead(alert.id)} style={{
                  border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280",
                  borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11,
                  whiteSpace: "nowrap",
                }}>
                  Marcar leída
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
