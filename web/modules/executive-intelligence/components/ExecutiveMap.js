"use client";
import React, { useState } from "react";

const FINCAS = [
  { id: "f1", nombre: "Finca San Jerónimo",  x: 28, y: 33, animales: 180, alertas: 2, estado: "alerta",  prod: "Carne / Leche",    ha: 320 },
  { id: "f2", nombre: "Finca El Roble",       x: 64, y: 46, animales: 95,  alertas: 0, estado: "activa",  prod: "Carne",            ha: 180 },
  { id: "f3", nombre: "Finca La Esperanza",   x: 44, y: 68, animales: 130, alertas: 1, estado: "alerta",  prod: "Doble Propósito",  ha: 250 },
];

const TOTAL = FINCAS.reduce((s, f) => s + f.animales, 0);

function FincaMarker({ f, isSelected, onClick }) {
  const color = f.alertas > 0 ? "#dc2626" : "#16a34a";
  const size  = 2.5 + (f.animales / TOTAL) * 7;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {f.alertas > 0 && <circle cx={f.x} cy={f.y} r={size + 2.5} fill={`${color}25`} />}
      <circle cx={f.x} cy={f.y} r={size} fill={color} stroke="#fff" strokeWidth={.8} />
      {isSelected && <circle cx={f.x} cy={f.y} r={size + 1.8} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2 1" />}
      <text x={f.x} y={f.y - size - 1.5} textAnchor="middle" fontSize={2.6} fill="#111827" fontWeight="bold">
        {f.nombre.split(" ").slice(-1)[0]}
      </text>
    </g>
  );
}

export default function ExecutiveMap({ kpis }) {
  const [sel, setSel] = useState(null);

  const selectedFinca = FINCAS.find(f => f.id === sel);

  return (
    <div>
      {/* Finca cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10, marginBottom: 16 }}>
        {FINCAS.map(f => {
          const c = f.alertas > 0 ? "#dc2626" : "#16a34a";
          return (
            <div key={f.id} onClick={() => setSel(f.id === sel ? null : f.id)} style={{
              border: `1.5px solid ${c}30`, borderRadius: 10, padding: "12px 14px",
              background: "#fff", cursor: "pointer",
              boxShadow: sel === f.id ? `0 0 0 2px ${c}` : "none",
            }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: "#111827" }}>{f.nombre}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>🐄 {f.animales} · 🌿 {f.ha} ha</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>{f.prod}</p>
              {f.alertas > 0 && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>⚠️ {f.alertas} alertas activas</p>
              )}
            </div>
          );
        })}
      </div>

      {/* SVG Map */}
      <div style={{ border: "1.5px solid #d1fae5", borderRadius: 14, overflow: "hidden", background: "#f0fdf4" }}>
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: 340, display: "block" }}>
          <rect width={100} height={100} fill="#dcfce7" />
          {[20, 40, 60, 80].map(v => (
            <React.Fragment key={v}>
              <line x1={v} y1={0} x2={v} y2={100} stroke="#bbf7d0" strokeWidth={.3} />
              <line x1={0} y1={v} x2={100} y2={v} stroke="#bbf7d0" strokeWidth={.3} />
            </React.Fragment>
          ))}
          {/* Region silhouette */}
          <ellipse cx={47} cy={50} rx={38} ry={34} fill="#bbf7d0" stroke="#86efac" strokeWidth={.5} />
          {/* Rivers */}
          <path d="M 15 70 Q 35 55 55 62 Q 72 68 85 58" fill="none" stroke="#7dd3fc" strokeWidth={1.2} strokeLinecap="round" />

          {FINCAS.map(f => (
            <FincaMarker key={f.id} f={f} isSelected={sel === f.id} onClick={() => setSel(f.id === sel ? null : f.id)} />
          ))}

          {/* Legend */}
          <circle cx={4}  cy={95} r={1.4} fill="#16a34a" />
          <text x={7}  y={96} fontSize={2.4} fill="#374151">Activa</text>
          <circle cx={20} cy={95} r={1.4} fill="#dc2626" />
          <text x={23} y={96} fontSize={2.4} fill="#374151">Alerta</text>
        </svg>
      </div>

      {/* Detail panel */}
      {selectedFinca && (() => {
        const f = selectedFinca;
        const c = f.alertas > 0 ? "#dc2626" : "#16a34a";
        return (
          <div style={{ marginTop: 14, border: `1.5px solid ${c}30`, borderRadius: 12, padding: "16px 18px", background: "#fff" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#111827" }}>📍 {f.nombre}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
              {[
                { ico: "🐄", v: f.animales,   l: "Animales"  },
                { ico: "🌿", v: `${f.ha} ha`,  l: "Superficie" },
                { ico: "🏭", v: f.prod,        l: "Producción" },
                { ico: "⚠️",  v: f.alertas,    l: "Alertas"   },
              ].map(s => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 20 }}>{s.ico}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 900, color }}>{s.v}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
