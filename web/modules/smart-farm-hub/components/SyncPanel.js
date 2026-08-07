"use client";
import React from "react";
import { SYNC_STATUS_CONFIG } from "../constants/sync-config.js";

export default function SyncPanel({ syncStats, online, onSync, loading, lastSync }) {
  if (!syncStats) return null;

  return (
    <div>
      {/* Estado de conexión */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderRadius: 10, marginBottom: 16,
        background: online ? "#f0fdf4" : "#fef2f2",
        border: `1.5px solid ${online ? "#bbf7d0" : "#fecaca"}`,
      }}>
        <span style={{ fontSize: 20 }}>{online ? "🟢" : "🔴"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: online ? "#166534" : "#991b1b" }}>
            {online ? "Conectado a internet" : "Sin conexión — modo offline"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
            {online
              ? "La sincronización diferencial está activa."
              : "Las operaciones se guardan en cola y se sincronizarán al reconectar."}
          </p>
        </div>
        <button onClick={onSync} disabled={!online || loading} style={{
          border: "none", background: online && !loading ? "#16a34a" : "#e5e7eb",
          color: online && !loading ? "#fff" : "#9ca3af",
          borderRadius: 8, padding: "8px 14px", cursor: online && !loading ? "pointer" : "default",
          fontWeight: 700, fontSize: 13,
        }}>
          {loading ? "⏳ Sincronizando…" : "🔄 Sincronizar"}
        </button>
      </div>

      {lastSync && (
        <p style={{ margin: "0 0 14px", fontSize: 11, color: "#9ca3af" }}>
          Última sincronización: {new Date(lastSync).toLocaleString("es-CO")}
        </p>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Total en cola",  n: syncStats.total,   color: "#6b7280" },
          { label: "Pendientes",     n: syncStats.pending, color: "#d97706" },
          { label: "Sincronizados",  n: syncStats.synced,  color: "#16a34a" },
          { label: "Fallidos",       n: syncStats.failed,  color: "#dc2626" },
          { label: "Conflictos",     n: syncStats.conflict,color: "#9333ea" },
        ].map(s => (
          <div key={s.label} style={{ border: `1.5px solid ${s.color}25`, borderRadius: 8, background: "#fff", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.n}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cola reciente */}
      {syncStats.items?.length > 0 && (
        <>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#374151" }}>Cola reciente:</p>
          {syncStats.items.slice(0, 10).map(op => {
            const cfg = SYNC_STATUS_CONFIG[op.status] ?? SYNC_STATUS_CONFIG.pending;
            return (
              <div key={op.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, marginBottom: 4,
              }}>
                <span style={{ fontSize: 14 }}>{cfg.icono}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    {op.operacion?.toUpperCase()} {op.entidad}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>
                    {new Date(op.creadoTs).toLocaleString("es-CO")} · {op.intentos ?? 0} intentos
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
              </div>
            );
          })}
        </>
      )}

      {/* Info de protocolo */}
      <div style={{ marginTop: 20, padding: "14px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10 }}>
        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: "#1e40af" }}>
          🔗 Protocolo de sincronización
        </p>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#1d4ed8" }}>
          <li>Modo offline: operaciones en cola localStorage</li>
          <li>Reconexión automática detectada vía evento "online"</li>
          <li>Reintentos: máximo {3} intentos con back-off exponencial</li>
          <li>Estrategia de conflictos: servidor gana por defecto</li>
          <li>Lote máximo de sincronización: {50} operaciones</li>
        </ul>
      </div>
    </div>
  );
}
