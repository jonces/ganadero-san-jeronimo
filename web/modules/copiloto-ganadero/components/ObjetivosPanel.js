"use client";
import { useState } from "react";
import { generateObjectiveRoadmap, TIPOS_OBJETIVO } from "../services/objective-engine.js";
import { saveObjetivo, loadObjetivos, deleteObjetivo, updateObjetivoEtapa } from "../services/copiloto-storage.js";

/**
 * Panel de objetivos — escribe una meta, recibe un roadmap.
 */
export function ObjetivosPanel({ dashData }) {
  const [objetivos, setObjetivos] = useState(() => loadObjetivos());
  const [texto,     setTexto]     = useState("");
  const [expanded,  setExpanded]  = useState(null);
  const [creating,  setCreating]  = useState(false);

  const crear = () => {
    if (!texto.trim()) return;
    const obj = generateObjectiveRoadmap(texto, dashData);
    saveObjetivo(obj);
    setObjetivos(loadObjetivos());
    setTexto("");
    setCreating(false);
    setExpanded(obj.id);
  };

  const eliminar = (id) => {
    deleteObjetivo(id);
    setObjetivos(loadObjetivos());
    if (expanded === id) setExpanded(null);
  };

  const toggleEtapa = (objetivoId, etapaId, completada) => {
    updateObjetivoEtapa(objetivoId, etapaId, completada);
    setObjetivos(loadObjetivos());
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>🎯 Objetivos de la Finca</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>
            Escribe una meta y la IA generará el roadmap completo.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          style={{
            padding: "8px 18px", borderRadius: 30, border: "none",
            background: "#6366F1", color: "#FFF", fontSize: 13,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          + Nuevo objetivo
        </button>
      </div>

      {/* Formulario de nuevo objetivo */}
      {creating && (
        <div style={{
          background: "#EEF2FF", border: "1px solid #C7D2FE",
          borderRadius: 14, padding: 20, marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#4F46E5" }}>
            ¿Qué quieres lograr en tu finca?
          </p>

          {/* Sugerencias rápidas */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {TIPOS_OBJETIVO.map(t => (
              <button
                key={t.key}
                onClick={() => setTexto(`Quiero ${t.titulo.toLowerCase()}`)}
                style={{
                  padding: "5px 12px", borderRadius: 20,
                  border: "1px solid #C7D2FE", background: "#FFF",
                  color: "#4F46E5", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t.icono} {t.titulo}
              </button>
            ))}
          </div>

          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Ejemplo: Quiero llegar a 300 vacas en 2 años, Quiero aumentar la producción de leche, Quiero mejorar la fertilidad…"
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 14px", borderRadius: 10,
              border: "1px solid #C7D2FE", background: "#FFF",
              color: "#111", fontSize: 13, fontFamily: "inherit",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={crear} style={{
              padding: "9px 24px", borderRadius: 30, border: "none",
              background: "#6366F1", color: "#FFF", fontSize: 13,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              ✨ Generar roadmap
            </button>
            <button onClick={() => setCreating(false)} style={{
              padding: "9px 16px", borderRadius: 30, border: "1px solid #E5E7EB",
              background: "#FFF", color: "#6B7280", fontSize: 13,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de objetivos */}
      {objetivos.length === 0 && !creating ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#6B7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Sin objetivos definidos</p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>Crea tu primer objetivo y la IA generará un plan de acción.</p>
        </div>
      ) : (
        objetivos.map(obj => (
          <ObjetivoCard
            key={obj.id}
            objetivo={obj}
            isExpanded={expanded === obj.id}
            onToggle={() => setExpanded(expanded === obj.id ? null : obj.id)}
            onEliminar={() => eliminar(obj.id)}
            onToggleEtapa={(etapaId, completada) => toggleEtapa(obj.id, etapaId, completada)}
          />
        ))
      )}
    </div>
  );
}

function ObjetivoCard({ objetivo, isExpanded, onToggle, onEliminar, onToggleEtapa }) {
  const estadoColor = objetivo.estado === "completado" ? "#059669" : "#6366F1";

  return (
    <div style={{
      border: "1px solid #E5E7EB", borderRadius: 14,
      background: "#FFF", marginBottom: 12, overflow: "hidden",
    }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 16px", display: "flex", alignItems: "center",
          gap: 12, cursor: "pointer",
          borderBottom: isExpanded ? "1px solid #E5E7EB" : "none",
        }}
        onClick={onToggle}
      >
        <span style={{ fontSize: 24 }}>{objetivo.icono}</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>{objetivo.titulo}</h4>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>
            {objetivo.textoOriginal} · Horizonte: {objetivo.horizonte}
          </p>
        </div>
        {/* Progreso */}
        <div style={{ textAlign: "center", minWidth: 50 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: estadoColor }}>{objetivo.progreso}%</div>
          <div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase" }}>completado</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onEliminar(); }} style={{
          width: 28, height: 28, borderRadius: 6, border: "1px solid #FECACA",
          background: "#FEF2F2", color: "#DC2626", cursor: "pointer",
          fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
      </div>

      {/* Detalle expandido */}
      {isExpanded && (
        <div style={{ padding: "16px" }}>
          {/* Barra de progreso */}
          <div style={{ height: 6, background: "#E5E7EB", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${objetivo.progreso}%`, background: estadoColor, borderRadius: 10, transition: "width 0.4s" }} />
          </div>

          {/* Etapas */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Etapas del plan
            </p>
            {objetivo.etapas?.map((etapa, i) => (
              <div key={etapa.id} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0",
                borderBottom: i < (objetivo.etapas.length - 1) ? "1px solid #F3F4F6" : "none",
              }}>
                <input
                  type="checkbox"
                  checked={etapa.completada}
                  onChange={e => onToggleEtapa(etapa.id, e.target.checked)}
                  style={{ marginTop: 3, accentColor: estadoColor, cursor: "pointer" }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: etapa.completada ? "#9CA3AF" : "#111",
                    textDecoration: etapa.completada ? "line-through" : "none" }}>
                    {etapa.numero}. {etapa.titulo}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "#9CA3AF" }}>
                    {etapa.inicio} → {etapa.fin}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* KPIs */}
          {objetivo.kpis?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Indicadores clave
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {objetivo.kpis.map((kpi, i) => (
                  <div key={i} style={{
                    background: "#F9FAFB", border: "1px solid #E5E7EB",
                    borderRadius: 10, padding: "8px 12px",
                  }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>{kpi.label}</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {kpi.actual != null && (
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{kpi.actual}{kpi.unidad}</span>
                      )}
                      {kpi.meta != null && (
                        <>
                          {kpi.actual != null && <span style={{ color: "#9CA3AF" }}>→</span>}
                          <span style={{ fontSize: 14, fontWeight: 800, color: estadoColor }}>{kpi.meta}{kpi.unidad}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riesgos */}
          {objetivo.riesgos?.length > 0 && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#D97706", textTransform: "uppercase" }}>
                ⚠️ Riesgos a considerar
              </p>
              {objetivo.riesgos.map((r, i) => (
                <p key={i} style={{ margin: "0 0 2px", fontSize: 12, color: "#374151" }}>• {r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
