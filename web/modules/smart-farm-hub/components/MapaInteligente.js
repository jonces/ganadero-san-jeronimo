"use client";
import React, { useState } from "react";
import { DEVICE_TYPE_CONFIG, DEVICE_STATUS_CONFIG } from "../constants/device-types.js";

// Elementos predeterminados del mapa (posiciones en % sobre un SVG 800x500)
const DEFAULT_MAP_ITEMS = [
  { id: "potrero-1", tipo: "potrero",   label: "Potrero 1",   x: 12,  y: 15,  w: 22, h: 30, fill: "#bbf7d080", stroke: "#16a34a" },
  { id: "potrero-2", tipo: "potrero",   label: "Potrero 2",   x: 36,  y: 15,  w: 22, h: 30, fill: "#bbf7d080", stroke: "#16a34a" },
  { id: "potrero-3", tipo: "potrero",   label: "Potrero 3",   x: 60,  y: 15,  w: 22, h: 30, fill: "#bbf7d080", stroke: "#16a34a" },
  { id: "corral-1",  tipo: "corral",    label: "Corral",      x: 12,  y: 60,  w: 15, h: 18, fill: "#fef9c380", stroke: "#ca8a04" },
  { id: "bebedero-1",tipo: "bebedero",  label: "Bebedero 1",  x: 30,  y: 62,  w: 6,  h: 6,  fill: "#bae6fd80", stroke: "#0284c7" },
  { id: "bebedero-2",tipo: "bebedero",  label: "Bebedero 2",  x: 55,  y: 62,  w: 6,  h: 6,  fill: "#bae6fd80", stroke: "#0284c7" },
  { id: "casa",      tipo: "casa",      label: "Casa",        x: 78,  y: 60,  w: 12, h: 14, fill: "#e9d5ff80", stroke: "#7c3aed" },
  { id: "tanque-1",  tipo: "tanque",    label: "Tanque",      x: 75,  y: 20,  w: 8,  h: 8,  fill: "#bae6fd80", stroke: "#0369a1" },
];

const ZONA_ICONS = {
  potrero:  { icono: "🌿", label: "Potrero" },
  corral:   { icono: "🏠", label: "Corral" },
  bebedero: { icono: "💧", label: "Bebedero" },
  casa:     { icono: "🏡", label: "Casa/Oficina" },
  tanque:   { icono: "🪣", label: "Tanque" },
};

export default function MapaInteligente({ devices = [] }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDevices, setShowDevices]   = useState(true);
  const [showZones,   setShowZones]     = useState(true);

  // Distribuir dispositivos en el mapa (posiciones ficticias para demo)
  const devicePositions = devices.slice(0, 16).map((d, i) => ({
    ...d,
    mapX: 8  + (i % 8) * 11.5,
    mapY: 82 + Math.floor(i / 8) * 8,
  }));

  return (
    <div>
      {/* Controles */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <Toggle label="🌿 Zonas"       active={showZones}   onClick={() => setShowZones(v => !v)} />
        <Toggle label="📟 Dispositivos" active={showDevices} onClick={() => setShowDevices(v => !v)} />
        <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>
          Mapa esquemático — conectar GPS para posicionamiento real
        </span>
      </div>

      {/* SVG Map */}
      <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#f0fdf4", position: "relative" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}>

          {/* Fondo */}
          <rect x="0" y="0" width="100" height="100" fill="#f0fdf4" />

          {/* Carretera interna */}
          <path d="M 0 78 H 100" stroke="#d1d5db" strokeWidth="2" fill="none" strokeDasharray="2 1" />
          <path d="M 84 0 V 78"  stroke="#d1d5db" strokeWidth="1.5" fill="none" strokeDasharray="2 1" />

          {/* Zonas */}
          {showZones && DEFAULT_MAP_ITEMS.map(item => (
            <g key={item.id} onClick={() => setSelectedItem(item)} style={{ cursor: "pointer" }}>
              <rect x={item.x} y={item.y} width={item.w} height={item.h}
                fill={selectedItem?.id === item.id ? item.stroke + "50" : item.fill}
                stroke={item.stroke} strokeWidth="0.4" rx="1" />
              <text x={item.x + item.w / 2} y={item.y + item.h / 2 - 1}
                textAnchor="middle" fontSize="2.5" fill={item.stroke} fontWeight="bold">
                {ZONA_ICONS[item.tipo]?.icono}
              </text>
              <text x={item.x + item.w / 2} y={item.y + item.h / 2 + 3}
                textAnchor="middle" fontSize="1.8" fill="#374151">
                {item.label}
              </text>
            </g>
          ))}

          {/* Dispositivos */}
          {showDevices && devicePositions.map(d => {
            const tipoCfg   = DEVICE_TYPE_CONFIG[d.tipo]    ?? {};
            const statusCfg = DEVICE_STATUS_CONFIG[d.estado] ?? DEVICE_STATUS_CONFIG.offline;
            return (
              <g key={d.id} onClick={() => setSelectedItem(d)} style={{ cursor: "pointer" }}>
                <circle cx={d.mapX} cy={d.mapY} r="3.5"
                  fill={statusCfg.bg} stroke={statusCfg.color} strokeWidth="0.5" />
                <text x={d.mapX} y={d.mapY + 1.2} textAnchor="middle" fontSize="3">
                  {tipoCfg.icono ?? "📟"}
                </text>
                {selectedItem?.id === d.id && (
                  <circle cx={d.mapX} cy={d.mapY} r="5"
                    fill="none" stroke={statusCfg.color} strokeWidth="0.5" strokeDasharray="1 0.5" />
                )}
              </g>
            );
          })}

          {/* Leyenda mini */}
          <g>
            <rect x="1" y="1" width="18" height="12" fill="white" opacity="0.85" rx="0.5" />
            <text x="2" y="4" fontSize="1.8" fill="#6b7280" fontWeight="bold">Leyenda</text>
            <circle cx="3" cy="7"  r="1" fill="#f0fdf4" stroke="#16a34a" strokeWidth="0.4" />
            <text x="5" y="7.7" fontSize="1.5" fill="#374151">Potrero</text>
            <circle cx="3" cy="11" r="1" fill="#fef9c3" stroke="#ca8a04" strokeWidth="0.4" />
            <text x="5" y="11.7" fontSize="1.5" fill="#374151">Corral</text>
          </g>
        </svg>

        {/* Tooltip flotante */}
        {selectedItem && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8,
            padding: "10px 12px", minWidth: 160, boxShadow: "0 2px 8px #0001",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827" }}>
                  {selectedItem.nombre ?? selectedItem.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                  {selectedItem.tipo ? DEVICE_TYPE_CONFIG[selectedItem.tipo]?.nombre ?? selectedItem.tipo
                    : ZONA_ICONS[selectedItem.tipo]?.label ?? selectedItem.tipo}
                </p>
                {selectedItem.ubicacion && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>{selectedItem.ubicacion}</p>
                )}
                {selectedItem.estado && (
                  <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 700, color: DEVICE_STATUS_CONFIG[selectedItem.estado]?.color }}>
                    {DEVICE_STATUS_CONFIG[selectedItem.estado]?.icono} {DEVICE_STATUS_CONFIG[selectedItem.estado]?.label}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedItem(null)} style={{
                border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "#9ca3af", padding: "0 2px",
              }}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {[
          { label: "Potreros",    n: DEFAULT_MAP_ITEMS.filter(i => i.tipo === "potrero").length,  color: "#16a34a" },
          { label: "Corrales",    n: DEFAULT_MAP_ITEMS.filter(i => i.tipo === "corral").length,   color: "#ca8a04" },
          { label: "Bebederos",   n: DEFAULT_MAP_ITEMS.filter(i => i.tipo === "bebedero").length, color: "#0284c7" },
          { label: "Dispositivos",n: devices.length,                                               color: "#6366f1" },
        ].map(s => (
          <div key={s.label} style={{
            border: `1.5px solid ${s.color}30`, borderRadius: 8,
            background: "#fff", padding: "8px 12px", textAlign: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.n}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border:     active ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
      borderRadius: 8, padding: "5px 12px", cursor: "pointer",
      background: active ? "#eef2ff" : "#f9fafb",
      color:      active ? "#4338ca" : "#6b7280",
      fontSize: 12, fontWeight: active ? 700 : 400,
    }}>{label}</button>
  );
}
