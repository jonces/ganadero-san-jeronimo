"use client";
import React, { useState } from "react";
import { DEVICE_TYPE_CONFIG, DEVICE_STATUS_CONFIG, PROTOCOL_CONFIG } from "../constants/device-types.js";

export default function DeviceCard({ device, onDelete, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!device) return null;

  const tipoCfg   = DEVICE_TYPE_CONFIG[device.tipo]    ?? {};
  const statusCfg = DEVICE_STATUS_CONFIG[device.estado] ?? DEVICE_STATUS_CONFIG.offline;
  const protoCfg  = PROTOCOL_CONFIG[device.protocolo]   ?? {};
  const reading   = device.lecturaActual ?? {};

  return (
    <div style={{
      border:       `1.5px solid ${statusCfg.color}30`,
      borderLeft:   `4px solid ${statusCfg.color}`,
      borderRadius: 10,
      background:   statusCfg.bg,
      padding:      compact ? "10px 12px" : "14px 16px",
      marginBottom: 8,
      cursor:       "pointer",
    }} onClick={() => !compact && setExpanded(e => !e)}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: compact ? 18 : 22, minWidth: 26 }}>{tipoCfg.icono ?? "📟"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: compact ? 13 : 14, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {device.nombre}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#6b7280" }}>{tipoCfg.nombre ?? device.tipo}</span>
            {device.ubicacion && <span style={{ fontSize: 10, color: "#9ca3af" }}>· {device.ubicacion}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: statusCfg.color }}>
            {statusCfg.icono} {statusCfg.label}
          </div>
          {device.bateria_pct != null && (
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
              🔋 {device.bateria_pct}%
            </div>
          )}
        </div>
      </div>

      {/* Lectura actual */}
      {!compact && Object.keys(reading).length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(reading).slice(0, 4).map(([k, v]) => (
            <span key={k} style={{
              fontSize: 11, background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 6, padding: "3px 7px", color: "#374151",
            }}>
              <b>{k}:</b> {typeof v === "number" ? v.toFixed(1) : String(v)}
            </span>
          ))}
        </div>
      )}

      {/* Expanded */}
      {expanded && !compact && (
        <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            <Info label="Protocolo"   value={`${protoCfg.icono ?? ""} ${protoCfg.label ?? device.protocolo}`} />
            <Info label="Categoría"   value={tipoCfg.categoria ?? "—"} />
            <Info label="Empresa"     value={device.empresa ?? "—"} />
            <Info label="Finca"       value={device.finca ?? "—"} />
            <Info label="Última sync" value={device.ultimaSync ? new Date(device.ultimaSync).toLocaleTimeString("es-CO") : "Nunca"} />
            <Info label="Señal"       value={device.senal_pct != null ? `${device.senal_pct}%` : "—"} />
          </div>
          {tipoCfg.descripcion && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>{tipoCfg.descripcion}</p>
          )}
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(device.id); }} style={{
              border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626",
              borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12,
            }}>
              Eliminar dispositivo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>{label}</p>
      <p style={{ margin: "1px 0 0", fontSize: 12, color: "#374151", fontWeight: 600 }}>{value}</p>
    </div>
  );
}
