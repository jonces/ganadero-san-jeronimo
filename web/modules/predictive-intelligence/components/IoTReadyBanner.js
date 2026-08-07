"use client";
import React, { useState } from "react";
import { IOT_LABELS } from "../constants/iot-adapters.js";

export default function IoTReadyBanner({ iotStatus = {} }) {
  const [open, setOpen] = useState(false);

  const available  = Object.entries(iotStatus).filter(([, v]) => v?.disponible);
  const unavailable = Object.entries(iotStatus).filter(([, v]) => !v?.disponible);

  return (
    <div style={{
      border:       "1.5px solid #bfdbfe",
      borderRadius: 10,
      background:   "#eff6ff",
      padding:      "12px 16px",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>🔌</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#1e40af" }}>
            Estado de Integraciones IoT y APIs
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#3b82f6" }}>
            {available.length} conectadas · {unavailable.length} disponibles para conectar
          </p>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{
          background: "#dbeafe", border: "none", borderRadius: 6, padding: "4px 10px",
          cursor: "pointer", fontSize: 12, color: "#1d4ed8", fontWeight: 600,
        }}>{open ? "Cerrar" : "Ver estado"}</button>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid #bfdbfe", paddingTop: 10 }}>
          {unavailable.length > 0 && (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#374151" }}>
                Por conectar:
              </p>
              {unavailable.map(([tipo]) => (
                <div key={tipo} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", background: "#fff", borderRadius: 6, marginBottom: 4,
                  border: "1px solid #e5e7eb",
                }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>⚪</span>
                  <span style={{ fontSize: 12, color: "#374151" }}>{IOT_LABELS[tipo] ?? tipo}</span>
                  <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: "auto" }}>Próximamente</span>
                </div>
              ))}
            </>
          )}
          {available.length > 0 && (
            <>
              <p style={{ margin: "8px 0 6px", fontSize: 11, fontWeight: 700, color: "#374151" }}>
                Conectadas:
              </p>
              {available.map(([tipo, estado]) => (
                <div key={tipo} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", background: "#f0fdf4", borderRadius: 6, marginBottom: 4,
                  border: "1px solid #bbf7d0",
                }}>
                  <span style={{ fontSize: 11, color: "#16a34a" }}>🟢</span>
                  <span style={{ fontSize: 12, color: "#374151" }}>{IOT_LABELS[tipo] ?? tipo}</span>
                  <span style={{ fontSize: 10, color: "#16a34a", marginLeft: "auto" }}>Activa</span>
                </div>
              ))}
            </>
          )}
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>
            Las predicciones mejoran automáticamente cuando se conectan sensores y APIs externas.
          </p>
        </div>
      )}
    </div>
  );
}
