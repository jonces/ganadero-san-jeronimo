"use client";
import { useState } from "react";
import { getPriorityConfig } from "../constants/priorities.js";
import { ALERT_TYPE_CONFIG }  from "../constants/alert-types.js";
import { useRouter }          from "next/navigation";

/**
 * Tarjeta de alerta individual del Copiloto.
 */
export function AlertaCard({ alerta, onAccion, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const pCfg = getPriorityConfig(alerta.priority);
  const tCfg = ALERT_TYPE_CONFIG[alerta.type] ?? { icono: "📌", label: "Alerta", categoria: "general" };
  const router = useRouter();

  const handleAccion = (accion, href) => {
    onAccion?.(alerta.id, alerta.type, accion);
    if (href) router.push(href);
  };

  const cardStyle = {
    borderRadius:    12,
    border:          `1px solid ${pCfg.border}`,
    background:      pCfg.bg,
    padding:         compact ? "10px 14px" : "14px 16px",
    marginBottom:    10,
    cursor:          compact ? "pointer" : "default",
    transition:      "box-shadow 0.15s",
    boxShadow:       "0 1px 4px rgba(0,0,0,0.04)",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.09)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
    >
      {/* Header */}
      <div
        style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: compact ? "default" : "pointer" }}
        onClick={() => !compact && setExpanded(e => !e)}
      >
        {/* Prioridad badge */}
        <div style={{
          flexShrink:     0,
          width:          32,
          height:         32,
          borderRadius:   8,
          background:     pCfg.color + "22",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       17,
        }}>
          {tCfg.icono}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              color: pCfg.color, textTransform: "uppercase",
            }}>
              {pCfg.icono} {pCfg.label}
            </span>
            <span style={{
              fontSize: 10, color: "#6B7280",
              background: "#F3F4F6", borderRadius: 20,
              padding: "1px 7px",
            }}>
              {tCfg.label}
            </span>
          </div>
          <h4 style={{
            margin: 0, fontSize: compact ? 13 : 14, fontWeight: 700,
            color: "#111827", lineHeight: 1.3,
          }}>
            {alerta.titulo}
          </h4>
          {(!compact || expanded) && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
              {alerta.descripcion}
            </p>
          )}
        </div>

        {!compact && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            style={{
              flexShrink: 0, background: "none", border: "none",
              fontSize: 14, color: "#9CA3AF", cursor: "pointer",
              padding: "2px 4px", borderRadius: 4,
            }}
            aria-label={expanded ? "Colapsar" : "Expandir"}
          >
            {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>

      {/* Acciones — siempre visibles si compact, expandibles si no */}
      {(compact || expanded) && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>

          {alerta.href && (
            <ActionBtn
              label="Ver detalles"
              icono="🔍"
              onClick={() => handleAccion("ver", alerta.href)}
            />
          )}

          {alerta.especialista && (
            <ActionBtn
              label={`Consultar ${ESPECIALISTA_LABEL[alerta.especialista] ?? "especialista"}`}
              icono="🤖"
              onClick={() => handleAccion("consultar_especialista", "/ia")}
              primary
            />
          )}

          <ActionBtn
            label="Crear tarea"
            icono="✅"
            onClick={() => handleAccion("crear_tarea", null)}
          />

          <ActionBtn
            label="Generar imagen"
            icono="🎨"
            onClick={() => handleAccion("generar_imagen", "/ia")}
          />

          <ActionBtn
            label="Descartar"
            icono="✕"
            onClick={() => handleAccion("descartar", null)}
            ghost
          />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, icono, onClick, primary, ghost }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          4,
        padding:      "5px 11px",
        borderRadius: 20,
        border:       ghost ? "1px solid #E5E7EB" : primary ? "none" : "1px solid #E5E7EB",
        background:   primary ? "#6366F1" : "rgba(255,255,255,0.7)",
        color:        primary ? "#FFF" : ghost ? "#9CA3AF" : "#374151",
        fontSize:     11,
        fontWeight:   600,
        cursor:       "pointer",
        whiteSpace:   "nowrap",
        fontFamily:   "inherit",
        backdropFilter: "blur(4px)",
      }}
    >
      <span aria-hidden="true">{icono}</span>
      {label}
    </button>
  );
}

const ESPECIALISTA_LABEL = {
  veterinario:  "Veterinario",
  nutricionista: "Nutricionista",
  reproduccion:  "Especialista en Reproducción",
  finanzas:      "Financiero",
  pasturas:      "Especialista en Pasturas",
  infraestructura: "Especialista en Infraestructura",
};
