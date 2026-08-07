"use client";
import { useState, useCallback } from "react";
import { T } from "../constants/theme.js";
import { DEMO_FINCA, DEMO_RECOMENDACIONES, DEMO_ACCIONES, DEMO_DOCS } from "../constants/demo-data.js";
import { SectionLabel } from "./ui/SectionLabel.js";
import { SearchInput } from "./ui/SearchInput.js";
import { IconButton } from "./ui/IconButton.js";

function MiniBar({ pct, color }) {
  return (
    <div style={{ height: 4, borderRadius: 4, background: T.border, overflow: "hidden", marginTop: 4 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

/**
 * @param {{ collapsed: boolean, onToggle: () => void }} props
 */
export function RightPanel({ collapsed, onToggle }) {
  const [tab,          setTab]          = useState("finca");
  const [recDismissed, setRecDismissed] = useState(new Set());
  const [docQuery,     setDocQuery]     = useState("");

  const dismiss = useCallback((id) => setRecDismissed(prev => new Set([...prev, id])), []);

  const recsVisibles = DEMO_RECOMENDACIONES.filter(r => !recDismissed.has(r.id));
  const altasCount   = recsVisibles.filter(r => r.prioridad === "alta").length;

  const hatoColor = DEMO_FINCA.hatoStatus === "bueno" ? T.accent : DEMO_FINCA.hatoStatus === "alerta" ? "#D97706" : "#DC2626";
  const hatoLabel = { bueno: "✅ Buen estado", alerta: "⚠️ Revisar", critico: "🚨 Crítico" }[DEMO_FINCA.hatoStatus];

  return (
    <aside
      data-ia-right-panel
      aria-label="Panel de finca"
      style={{
        width: collapsed ? 0 : 290, minWidth: collapsed ? 0 : 290,
        height: "100%",
        borderLeft: `1px solid ${T.border}`,
        background: T.bg,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease",
      }}
    >
      {/* Cabecera */}
      <div style={{ height: 54, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0, background: T.panel }}>
        <IconButton onClick={onToggle} title="Ocultar panel de finca">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </IconButton>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: T.text, flex: 1 }}>Mi Finca</p>
        {altasCount > 0 && (
          <span role="status" aria-label={`${altasCount} alertas`} style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#DC2626", padding: "2px 7px", borderRadius: 20 }}>
            {altasCount} alerta{altasCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones del panel" style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.panel }}>
        {[{ id: "finca", label: "Estado" }, { id: "docs", label: "Documentos" }].map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`rp-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "9px 0", border: "none", background: "transparent", fontSize: 12, fontWeight: 700, cursor: "pointer", color: tab === t.id ? T.accent : T.muted, borderBottom: tab === t.id ? `2px solid ${T.accent}` : "2px solid transparent", transition: "all 0.15s", fontFamily: "inherit" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 20px" }}>

        {/* ── TAB: ESTADO ── */}
        {tab === "finca" && (
          <div id="rp-tab-finca" role="tabpanel" aria-label="Estado de la finca">

            {/* Estado del hato */}
            <SectionLabel label="Estado del hato" />
            <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.panel, padding: "14px 14px 12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: T.text }}>{DEMO_FINCA.nombre}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: hatoColor }}>{hatoLabel}</span>
                </div>
                <div aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, background: hatoColor + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🐄</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Total animales", valor: DEMO_FINCA.animalesTotal, icono: "🐄", color: "#0EA5E9" },
                  { label: "En buen estado", valor: DEMO_FINCA.animalesSanos, icono: "✅", color: T.accent },
                  { label: "En venta",       valor: DEMO_FINCA.enVenta,       icono: "🏷️", color: "#F59E0B" },
                  { label: "Preñadas",       valor: DEMO_FINCA.prenadas,      icono: "🤰", color: "#EC4899" },
                ].map((m, i) => (
                  <div key={i} style={{ padding: "9px 10px", borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
                    <p style={{ margin: "0 0 3px", fontSize: 10, color: T.muted }}><span aria-hidden="true">{m.icono}</span> {m.label}</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.valor}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: T.muted }}>Salud general</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: hatoColor }}>
                    {Math.round((DEMO_FINCA.animalesSanos / DEMO_FINCA.animalesTotal) * 100)}%
                  </span>
                </div>
                <MiniBar pct={(DEMO_FINCA.animalesSanos / DEMO_FINCA.animalesTotal) * 100} color={hatoColor} />
              </div>
            </div>

            {/* Resumen financiero */}
            <SectionLabel label="Resumen financiero" action="Ver finanzas" />
            <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.panel, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Caja disponible", valor: DEMO_FINCA.cajaDisponible, icono: "💵", color: T.accent,  sub: "Saldo actual" },
                { label: "Ventas del mes",  valor: DEMO_FINCA.ventasMes,      icono: "📈", color: "#0EA5E9", sub: "Agosto 2026" },
                { label: "Gastos del mes",  valor: DEMO_FINCA.gastosMes,      icono: "📉", color: "#EF4444", sub: "Agosto 2026" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 9, background: f.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icono}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{f.label}</p>
                    <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{f.sub}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: f.color, whiteSpace: "nowrap" }}>{f.valor}</p>
                </div>
              ))}
            </div>

            {/* Recomendaciones */}
            <SectionLabel label={`Recomendaciones (${recsVisibles.length})`} />
            {recsVisibles.length === 0 ? (
              <div role="status" style={{ padding: "20px 0", textAlign: "center", color: T.muted }}>
                <p aria-hidden="true" style={{ fontSize: 24, margin: "0 0 6px" }}>🎉</p>
                <p style={{ fontSize: 12, margin: 0 }}>Todo al día — sin pendientes</p>
              </div>
            ) : (
              <div role="list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recsVisibles.map(r => (
                  <div key={r.id} role="listitem" style={{ borderRadius: 12, border: `1px solid ${r.border}`, background: r.bg, padding: "10px 12px", position: "relative" }}>
                    <button onClick={() => dismiss(r.id)} aria-label={`Descartar: ${r.titulo}`} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 13, lineHeight: 1, padding: 0 }}>✕</button>
                    <div style={{ display: "flex", gap: 9, paddingRight: 16 }}>
                      <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{r.icono}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: r.color }}>{r.titulo}</p>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: r.color, padding: "1px 5px", borderRadius: 20, flexShrink: 0, textTransform: "uppercase" }}>{r.prioridad}</span>
                        </div>
                        <p style={{ margin: "0 0 8px", fontSize: 11, color: T.text, lineHeight: 1.5 }}>{r.detalle}</p>
                        <button
                          style={{ fontSize: 11, fontWeight: 700, color: r.color, background: "none", border: `1px solid ${r.color}50`, padding: "3px 8px", borderRadius: 6, cursor: "pointer", transition: "background 0.15s", fontFamily: "inherit" }}
                          onMouseEnter={e => e.currentTarget.style.background = r.color + "15"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          {r.accion} →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Acciones rápidas */}
            <SectionLabel label="Acciones rápidas" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {DEMO_ACCIONES.map(a => (
                <button key={a.id} style={{ padding: "10px 8px", borderRadius: 11, border: `1px solid ${T.border}`, background: T.panel, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all 0.15s", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color + "60"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.panel; e.currentTarget.style.borderColor = T.border; }}
                >
                  <span aria-hidden="true" style={{ fontSize: 20 }}>{a.icono}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: DOCUMENTOS ── */}
        {tab === "docs" && (
          <div id="rp-tab-docs" role="tabpanel" aria-label="Documentos">
            <SectionLabel label="Documentos recientes" action="Ver todos" />
            <div style={{ marginBottom: 12 }}>
              <SearchInput value={docQuery} onChange={setDocQuery} placeholder="Buscar documentos…" />
            </div>

            <div role="group" aria-label="Filtrar por tipo" style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
              {["Todos", "PDF", "XLSX", "DOC"].map(f => (
                <button key={f} aria-pressed={f === "Todos"} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${T.border}`, background: f === "Todos" ? T.accent : T.panel, color: f === "Todos" ? "#fff" : T.muted, cursor: "pointer", fontFamily: "inherit" }}>
                  {f}
                </button>
              ))}
            </div>

            <div role="list" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DEMO_DOCS.map(d => (
                <div key={d.id} role="listitem" style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.panel, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = T.muted; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.panel; e.currentTarget.style.borderColor = T.border; }}
                >
                  <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 9, background: d.color + "15", border: `1px solid ${d.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{d.icono}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombre}</p>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: d.color, background: d.color + "15", padding: "1px 6px", borderRadius: 5 }}>{d.tipo}</span>
                      <span style={{ fontSize: 10, color: T.muted }}>{d.fecha}</span>
                    </div>
                  </div>
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: "14px", borderRadius: 12, border: `2px dashed ${T.border}`, textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "#F0FDF4"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "transparent"; }}
            >
              <p aria-hidden="true" style={{ fontSize: 22, margin: "0 0 6px" }}>📤</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text }}>Subir documento</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: T.muted }}>PDF, XLSX, DOC · Máx 10 MB</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
