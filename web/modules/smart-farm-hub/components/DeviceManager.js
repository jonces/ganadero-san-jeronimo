"use client";
import React, { useState } from "react";
import DeviceCard from "./DeviceCard.js";
import { TIPOS_LISTA, DEVICE_CATEGORIAS, PROTOCOL_CONFIG } from "../constants/device-types.js";

export default function DeviceManager({ devices, onAdd, onDelete, simulation, onStartSim, onStopSim }) {
  const [showForm,    setShowForm]    = useState(false);
  const [catFilter,   setCatFilter]   = useState(null);
  const [form, setForm] = useState({ nombre: "", tipo: "sensor_temp", protocolo: "wifi", ubicacion: "", empresa: "", finca: "" });

  const categorias = [...new Set(TIPOS_LISTA.map(t => t.categoria))];
  const visible    = catFilter ? devices.filter(d => {
    const cfg = TIPOS_LISTA.find(t => t.id === d.tipo);
    return cfg?.categoria === catFilter;
  }) : devices;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onAdd({ ...form });
    setForm({ nombre: "", tipo: "sensor_temp", protocolo: "wifi", ubicacion: "", empresa: "", finca: "" });
    setShowForm(false);
  };

  // Agrupar por categoría para el selector de tipo
  const tiposByCat = {};
  TIPOS_LISTA.forEach(t => {
    if (!tiposByCat[t.categoria]) tiposByCat[t.categoria] = [];
    tiposByCat[t.categoria].push(t);
  });

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setShowForm(s => !s)} style={{
          border: "none", background: "#6366f1", color: "#fff",
          borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13,
        }}>
          {showForm ? "✕ Cancelar" : "+ Agregar dispositivo"}
        </button>

        <button onClick={simulation ? onStopSim : onStartSim} style={{
          border: `1.5px solid ${simulation ? "#dc2626" : "#16a34a"}`,
          background: simulation ? "#fef2f2" : "#f0fdf4",
          color: simulation ? "#dc2626" : "#16a34a",
          borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13,
        }}>
          {simulation ? "⏹ Detener simulación" : "▶ Simular lecturas en tiempo real"}
        </button>

        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {devices.length} dispositivo{devices.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Formulario de nuevo dispositivo */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px",
          background: "#f9fafb", marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#111827" }}>Nuevo dispositivo</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <label style={labelStyle}>
              Nombre *
              <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Sensor corrales norte" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Tipo *
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inputStyle}>
                {Object.entries(tiposByCat).map(([cat, items]) => (
                  <optgroup key={cat} label={`${DEVICE_CATEGORIAS[cat]?.icono ?? ""} ${DEVICE_CATEGORIAS[cat]?.label ?? cat}`}>
                    {items.map(t => <option key={t.id} value={t.id}>{t.icono} {t.nombre}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              Protocolo
              <select value={form.protocolo} onChange={e => setForm(f => ({ ...f, protocolo: e.target.value }))} style={inputStyle}>
                {Object.entries(PROTOCOL_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icono} {v.label} — {v.rango}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              Ubicación
              <input value={form.ubicacion} onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                placeholder="Ej: Potrero 3, Corral norte" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Empresa
              <input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                placeholder="Nombre de la empresa" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Finca
              <input value={form.finca} onChange={e => setForm(f => ({ ...f, finca: e.target.value }))}
                placeholder="Nombre de la finca" style={inputStyle} />
            </label>
          </div>
          <button type="submit" style={{
            border: "none", background: "#6366f1", color: "#fff",
            borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>
            Registrar dispositivo
          </button>
        </form>
      )}

      {/* Filtros por categoría */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <Chip label="Todos" active={!catFilter} onClick={() => setCatFilter(null)} />
        {categorias.map(c => (
          <Chip key={c} label={`${DEVICE_CATEGORIAS[c]?.icono ?? ""} ${DEVICE_CATEGORIAS[c]?.label ?? c}`}
            active={catFilter === c} onClick={() => setCatFilter(catFilter === c ? null : c)} />
        ))}
      </div>

      {/* Lista */}
      {visible.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af" }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>📟</p>
          <p style={{ margin: 0, fontWeight: 600 }}>Sin dispositivos registrados</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>Agrega tu primer dispositivo IoT.</p>
        </div>
      )}
      {visible.map(d => <DeviceCard key={d.id} device={d} onDelete={onDelete} />)}
    </div>
  );
}

const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#374151", fontWeight: 600 };
const inputStyle = { padding: "7px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111827", background: "#fff" };

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border:       active ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
      borderRadius: 20, padding: "5px 11px", cursor: "pointer",
      background:   active ? "#eef2ff" : "#fff",
      color:        active ? "#4338ca" : "#374151",
      fontSize:     12, fontWeight: active ? 700 : 400,
    }}>{label}</button>
  );
}
