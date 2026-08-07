"use client";
import { useState, useMemo } from "react";
import { AlertaCard }        from "./AlertaCard.js";
import { CATEGORIAS_ALERTA } from "../constants/alert-types.js";
import { PRIORITY_CONFIG }   from "../constants/priorities.js";

/**
 * Panel principal de alertas con filtros por categoría y prioridad.
 */
export function AlertasPanel({ alerts, onAccion }) {
  const [catFiltro, setCatFiltro]   = useState("todas");
  const [priFiltro, setPrioritro]   = useState("todas");

  const filtradas = useMemo(() => {
    return alerts.filter(a => {
      const catOk = catFiltro === "todas" || (a.categoria === catFiltro);
      const priOk = priFiltro === "todas" || a.priority === priFiltro;
      return catOk && priOk;
    });
  }, [alerts, catFiltro, priFiltro]);

  if (alerts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B7280" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#374151" }}>Todo en orden</p>
        <p style={{ margin: "4px 0 0", fontSize: 13 }}>No hay alertas activas para tu finca.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        {/* Categorías */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <ChipBtn active={catFiltro === "todas"} onClick={() => setCatFiltro("todas")}>Todas</ChipBtn>
          {Object.values(CATEGORIAS_ALERTA).map(c => (
            <ChipBtn key={c.id} active={catFiltro === c.id} onClick={() => setCatFiltro(c.id)}>
              {c.icono} {c.label}
            </ChipBtn>
          ))}
        </div>

        <div style={{ width: 1, background: "#E5E7EB", height: 24, alignSelf: "center" }} />

        {/* Prioridades */}
        <div style={{ display: "flex", gap: 6 }}>
          <ChipBtn active={priFiltro === "todas"} onClick={() => setPrioritro("todas")}>Todas</ChipBtn>
          {Object.values(PRIORITY_CONFIG).map(p => (
            <ChipBtn
              key={p.id}
              active={priFiltro === p.id}
              onClick={() => setPrioritro(p.id)}
              color={p.color}
            >
              {p.icono} {p.label}
            </ChipBtn>
          ))}
        </div>
      </div>

      {/* Conteo */}
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6B7280" }}>
        {filtradas.length} de {alerts.length} alertas
      </p>

      {/* Listado */}
      {filtradas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", color: "#9CA3AF", fontSize: 13 }}>
          No hay alertas con ese filtro.
        </div>
      ) : (
        filtradas.map(a => (
          <AlertaCard key={a.id} alerta={a} onAccion={onAccion} />
        ))
      )}
    </div>
  );
}

function ChipBtn({ children, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      "4px 12px",
        borderRadius: 20,
        border:       active ? `1.5px solid ${color ?? "#6366F1"}` : "1px solid #E5E7EB",
        background:   active ? (color ? color + "18" : "#EEF2FF") : "#F9FAFB",
        color:        active ? (color ?? "#4F46E5") : "#6B7280",
        fontSize:     11,
        fontWeight:   active ? 700 : 500,
        cursor:       "pointer",
        whiteSpace:   "nowrap",
        fontFamily:   "inherit",
        transition:   "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
