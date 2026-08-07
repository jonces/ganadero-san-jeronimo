"use client";
import React, { useState } from "react";
import { RULE_TEMPLATES, PRIORIDAD_CONFIG, RULE_ACTION_CONFIG } from "../constants/automation-rules.js";
import { DEVICE_TYPE_CONFIG } from "../constants/device-types.js";

export default function AutomationCenter({ rules, onSave, onDelete, onToggle }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    titulo: "", descripcion: "", tipoDispositivo: "",
    campo: "", operador: "menor_que", valor: 0,
    prioridad: "alta", acciones: ["alerta_visual"],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      titulo:      form.titulo,
      descripcion: form.descripcion,
      tipoDispositivo: form.tipoDispositivo || null,
      condicion:   { campo: form.campo, operador: form.operador, valor: parseFloat(form.valor) },
      acciones:    form.acciones,
      prioridad:   form.prioridad,
      activa:      true,
      icono:       "⚙️",
    });
    setShowNew(false);
    setForm({ titulo: "", descripcion: "", tipoDispositivo: "", campo: "", operador: "menor_que", valor: 0, prioridad: "alta", acciones: ["alerta_visual"] });
  };

  const toggleAccion = (ac) => {
    setForm(f => ({
      ...f,
      acciones: f.acciones.includes(ac) ? f.acciones.filter(a => a !== ac) : [...f.acciones, ac],
    }));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          {rules.length} regla{rules.length !== 1 ? "s" : ""} configuradas
        </p>
        <button onClick={() => setShowNew(s => !s)} style={{
          border: "none", background: "#6366f1", color: "#fff",
          borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13,
        }}>
          {showNew ? "✕ Cancelar" : "+ Nueva regla"}
        </button>
      </div>

      {/* Formulario */}
      {showNew && (
        <form onSubmit={handleSubmit} style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#f9fafb", marginBottom: 16 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>Nueva regla de automatización</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <label style={lbl}>
              Nombre *
              <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Tanque bajo 20%" style={inp} />
            </label>
            <label style={lbl}>
              Tipo de dispositivo
              <select value={form.tipoDispositivo} onChange={e => setForm(f => ({ ...f, tipoDispositivo: e.target.value }))} style={inp}>
                <option value="">Cualquier dispositivo</option>
                {Object.entries(DEVICE_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icono} {v.nombre}</option>
                ))}
              </select>
            </label>
            <label style={lbl}>
              Campo a monitorear
              <input value={form.campo} onChange={e => setForm(f => ({ ...f, campo: e.target.value }))}
                placeholder="Ej: nivel_pct, temperatura_c" style={inp} />
            </label>
            <label style={lbl}>
              Operador
              <select value={form.operador} onChange={e => setForm(f => ({ ...f, operador: e.target.value }))} style={inp}>
                <option value="menor_que">Menor que (&lt;)</option>
                <option value="mayor_que">Mayor que (&gt;)</option>
                <option value="igual">Igual a (=)</option>
                <option value="diferente">Diferente de (≠)</option>
              </select>
            </label>
            <label style={lbl}>
              Valor umbral
              <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} style={inp} />
            </label>
            <label style={lbl}>
              Prioridad
              <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))} style={inp}>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
          </div>
          {/* Acciones */}
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#374151" }}>Acciones:</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {Object.entries(RULE_ACTION_CONFIG).map(([k, v]) => (
              <button key={k} type="button" onClick={() => toggleAccion(k)} style={{
                border:     form.acciones.includes(k) ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
                borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                background: form.acciones.includes(k) ? "#eef2ff" : "#fff",
                color:      form.acciones.includes(k) ? "#4338ca" : "#6b7280",
                fontSize: 12, fontWeight: form.acciones.includes(k) ? 700 : 400,
                opacity:    v.disponible ? 1 : 0.5,
              }}>
                {v.icono} {v.label}{!v.disponible ? " *" : ""}
              </button>
            ))}
          </div>
          <button type="submit" style={{ border: "none", background: "#6366f1", color: "#fff", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            Guardar regla
          </button>
        </form>
      )}

      {/* Lista de reglas */}
      {rules.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af" }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>⚙️</p>
          <p style={{ margin: 0, fontWeight: 600 }}>Sin reglas configuradas</p>
        </div>
      )}

      {rules.map(rule => {
        const pCfg = PRIORIDAD_CONFIG[rule.prioridad] ?? PRIORIDAD_CONFIG.media;
        return (
          <div key={rule.id} style={{
            border: `1.5px solid ${pCfg.border}`, borderLeft: `4px solid ${pCfg.color}`,
            borderRadius: 10, background: pCfg.bg, padding: "12px 14px", marginBottom: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{rule.icono ?? "⚙️"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>{rule.titulo}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                  {rule.condicion?.campo} {rule.condicion?.operador?.replace("_que", "")} {rule.condicion?.valor}
                  {rule.tipoDispositivo && ` — ${DEVICE_TYPE_CONFIG[rule.tipoDispositivo]?.nombre ?? rule.tipoDispositivo}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onToggle(rule.id)} style={{
                  border: `1.5px solid ${rule.activa ? "#16a34a" : "#e5e7eb"}`,
                  background: rule.activa ? "#f0fdf4" : "#f9fafb",
                  color: rule.activa ? "#16a34a" : "#6b7280",
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700,
                }}>
                  {rule.activa ? "✓ Activa" : "Inactiva"}
                </button>
                <button onClick={() => onDelete(rule.id)} style={{
                  border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626",
                  borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12,
                }}>✕</button>
              </div>
            </div>
            {rule.acciones?.length > 0 && (
              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {rule.acciones.map(ac => {
                  const cfg = RULE_ACTION_CONFIG[ac];
                  return cfg ? (
                    <span key={ac} style={{ fontSize: 10, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 6px", color: "#374151" }}>
                      {cfg.icono} {cfg.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const lbl = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#374151", fontWeight: 600 };
const inp = { padding: "7px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111827", background: "#fff" };
