"use client";
import { useState }       from "react";
import { AlertasPanel }   from "./AlertasPanel.js";
import { ObjetivosPanel } from "./ObjetivosPanel.js";
import { SimuladorPanel } from "./SimuladorPanel.js";
import { useCopiloto }    from "../hooks/useCopiloto.js";

const TABS = [
  { id: "alertas",    label: "Alertas",    icono: "🔔" },
  { id: "planes",     label: "Planes",     icono: "📅" },
  { id: "objetivos",  label: "Objetivos",  icono: "🎯" },
  { id: "simulador",  label: "Simulador",  icono: "🔮" },
];

const SEMAFORO_CFG = {
  verde:    { bg: "#F0FDF4", color: "#059669", label: "Finca saludable",  icono: "🟢" },
  amarillo: { bg: "#FFFBEB", color: "#D97706", label: "Atención requerida", icono: "🟡" },
  rojo:     { bg: "#FEF2F2", color: "#DC2626", label: "Situación crítica",  icono: "🔴" },
};

/**
 * Shell principal del Copiloto Ganadero.
 * Carga datos vía useCopiloto y expone las 4 pestañas.
 */
export function CopilotoShell() {
  const [tabActiva, setTabActiva] = useState("alertas");

  const {
    dashData, alerts, planes, summary,
    loading, error,
    alertasCriticas, alertasAltas, totalAlertas,
    accionAlerta, refresh,
  } = useCopiloto();

  // ── Header summary ─────────────────────────────────────────────────────────
  const semCfg = summary ? (SEMAFORO_CFG[summary.semaforo] ?? SEMAFORO_CFG.amarillo) : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#F9FAFB" }}>

      {/* Top bar */}
      <div style={{
        padding: "16px 20px 0",
        background: "#FFF",
        borderBottom: "1px solid #E5E7EB",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111" }}>
              🧠 Copiloto Ganadero
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>
              Centro de Decisiones Inteligente
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {semCfg && (
              <div style={{
                padding: "5px 12px", borderRadius: 20,
                background: semCfg.bg, color: semCfg.color,
                fontSize: 12, fontWeight: 700,
              }}>
                {semCfg.icono} {semCfg.label}
                {summary?.puntaje != null && ` · ${summary.puntaje}/100`}
              </div>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1px solid #E5E7EB",
                background: "#FFF", color: "#374151", fontSize: 12,
                cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Cargando…" : "↻ Actualizar"}
            </button>
          </div>
        </div>

        {/* Contadores de alerta */}
        {!loading && !error && (
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            <Contador label="Total" value={totalAlertas} color="#6B7280" />
            <Contador label="Críticas" value={alertasCriticas.length} color="#DC2626" />
            <Contador label="Altas" value={alertasAltas.length} color="#EA580C" />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTabActiva(t.id)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderBottom: tabActiva === t.id ? "3px solid #6366F1" : "3px solid transparent",
                background: "none",
                color: tabActiva === t.id ? "#4F46E5" : "#6B7280",
                fontSize: 13,
                fontWeight: tabActiva === t.id ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {t.icono} {t.label}
              {t.id === "alertas" && totalAlertas > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 10, fontWeight: 800,
                  background: alertasCriticas.length > 0 ? "#DC2626" : "#EA580C",
                  color: "#FFF", borderRadius: 10, padding: "1px 6px",
                }}>
                  {totalAlertas}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ margin: 0, fontSize: 14 }}>Analizando tu finca…</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: 20 }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#DC2626" }}>⚠️ Error al cargar datos</p>
            <p style={{ margin: "4px 0 12px", fontSize: 13, color: "#374151" }}>{error}</p>
            <button onClick={refresh} style={{
              padding: "8px 20px", borderRadius: 20, border: "none",
              background: "#DC2626", color: "#FFF", fontSize: 13,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {tabActiva === "alertas" && (
              <AlertasPanel alerts={alerts} onAccion={accionAlerta} />
            )}

            {tabActiva === "planes" && (
              <PlanesView planes={planes} />
            )}

            {tabActiva === "objetivos" && (
              <ObjetivosPanel dashData={dashData} />
            )}

            {tabActiva === "simulador" && (
              <SimuladorPanel dashData={dashData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function Contador({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function PlanesView({ planes }) {
  const [tipo, setTipo] = useState("semana");
  if (!planes) return null;

  const plan = planes[tipo];
  const TIPOS = [
    { k: "dia",    l: "Hoy" },
    { k: "semana", l: "Esta semana" },
    { k: "mes",    l: "Este mes" },
    { k: "anio",   l: "Este año" },
  ];

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#111" }}>📅 Plan de Acción</h3>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {TIPOS.map(t => (
          <button
            key={t.k}
            onClick={() => setTipo(t.k)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: tipo === t.k ? "2px solid #6366F1" : "1px solid #E5E7EB",
              background: tipo === t.k ? "#EEF2FF" : "#F9FAFB",
              color: tipo === t.k ? "#4F46E5" : "#6B7280",
              fontSize: 12, fontWeight: tipo === t.k ? 700 : 500,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {plan?.tareas?.length > 0 ? (
        plan.tareas.map((t, i) => (
          <div key={i} style={{
            background: "#FFF", border: "1px solid #E5E7EB",
            borderRadius: 10, padding: "12px 14px", marginBottom: 8,
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icono}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111" }}>{t.titulo}</p>
              {t.descripcion && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>{t.descripcion}</p>}
              {t.responsable && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9CA3AF" }}>👤 {t.responsable}</p>
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 8px",
              borderRadius: 10, background: "#EEF2FF", color: "#4F46E5",
              whiteSpace: "nowrap",
            }}>
              {t.prioridad?.toUpperCase()}
            </span>
          </div>
        ))
      ) : (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 13 }}>
          No hay tareas planificadas para este período.
        </div>
      )}
    </div>
  );
}
