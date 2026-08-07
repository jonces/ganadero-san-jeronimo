"use client";
import React, { useState } from "react";
import { useSmartFarm }     from "../hooks/useSmartFarm.js";
import DeviceManager        from "./DeviceManager.js";
import AutomationCenter     from "./AutomationCenter.js";
import MapaInteligente      from "./MapaInteligente.js";
import AlertCenter          from "./AlertCenter.js";
import SyncPanel            from "./SyncPanel.js";
import { DEVICE_STATUS_CONFIG } from "../constants/device-types.js";

const TABS = [
  { id: "dispositivos", label: "Dispositivos",  emoji: "📟" },
  { id: "mapa",         label: "Mapa",           emoji: "🗺️" },
  { id: "automatizacion",label: "Automatización",emoji: "⚙️" },
  { id: "alertas",      label: "Alertas",        emoji: "🔔" },
  { id: "sincronizacion",label: "Sincronización",emoji: "🔄" },
];

export default function SmartFarmShell() {
  const [tab, setTab] = useState("dispositivos");
  const hub = useSmartFarm();

  const online   = hub.devices.filter(d => d.estado === "online").length;
  const offline  = hub.devices.filter(d => d.estado === "offline").length;
  const alertas  = hub.devices.filter(d => d.estado === "alerta").length;

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 900, margin: "0 auto", padding: "0 4px" }}>

      {/* Header */}
      <div style={{ padding: "20px 4px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>
              🌐 Smart Farm Hub
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Centro de integración de dispositivos IoT · {hub.devices.length} dispositivos registrados
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <StatusBadge color="#16a34a" label={`${online} en línea`} />
            {alertas > 0  && <StatusBadge color="#d97706" label={`${alertas} alertas`} />}
            {offline > 0  && <StatusBadge color="#6b7280" label={`${offline} offline`} />}
            <span style={{ fontSize: 11, color: hub.online ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
              {hub.online ? "🟢 Internet" : "🔴 Offline"}
            </span>
          </div>
        </div>

        {/* Semáforo global */}
        {hub.devices.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "En línea",       n: online,  color: "#16a34a", bg: "#f0fdf4" },
              { label: "Con alerta",     n: alertas, color: "#d97706", bg: "#fffbeb" },
              { label: "Sin conexión",   n: offline, color: "#6b7280", bg: "#f9fafb" },
              { label: "Sin leer",       n: hub.unreadCount, color: "#dc2626", bg: "#fef2f2" },
            ].map(s => (
              <div key={s.label} style={{ border: `1.5px solid ${s.color}30`, borderRadius: 8, background: s.bg, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.n}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", overflowX: "auto", gap: 2, borderBottom: "2px solid #f3f4f6", marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 14px", border: "none",
            borderBottom: tab === t.id ? "2.5px solid #6366f1" : "2.5px solid transparent",
            background: "none", cursor: "pointer",
            fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? "#4338ca" : "#6b7280",
            fontSize: 13, whiteSpace: "nowrap", position: "relative",
          }}>
            {t.emoji} {t.label}
            {t.id === "alertas" && hub.unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 6,
                background: "#dc2626", color: "#fff",
                borderRadius: 10, fontSize: 9, fontWeight: 700,
                padding: "1px 4px", minWidth: 14, textAlign: "center",
              }}>{hub.unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 48 }}>
        {tab === "dispositivos" && (
          <DeviceManager
            devices={hub.devices}
            onAdd={hub.addDevice}
            onDelete={hub.removeDeviceById}
            simulation={hub.simulation}
            onStartSim={hub.startSimulation}
            onStopSim={hub.stopSimulation}
          />
        )}
        {tab === "mapa" && (
          <MapaInteligente devices={hub.devices} />
        )}
        {tab === "automatizacion" && (
          <AutomationCenter
            rules={hub.rules}
            onSave={hub.saveRule}
            onDelete={hub.removeRule}
            onToggle={hub.toggleRule}
          />
        )}
        {tab === "alertas" && (
          <AlertCenter
            alerts={hub.alerts}
            onRefresh={hub.refreshAlerts}
          />
        )}
        {tab === "sincronizacion" && (
          <SyncPanel
            syncStats={hub.syncStats}
            online={hub.online}
            loading={hub.loading}
            lastSync={hub.lastSync}
            onSync={hub.syncNow}
          />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ color, label }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color,
      background: color + "15", border: `1px solid ${color}30`,
      borderRadius: 8, padding: "3px 8px",
    }}>{label}</span>
  );
}
