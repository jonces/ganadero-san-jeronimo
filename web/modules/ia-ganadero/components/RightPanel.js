"use client";
import { useState, useCallback } from "react";
import { T } from "../constants/theme.js";
import { SectionLabel } from "./ui/SectionLabel.js";
import { SearchInput } from "./ui/SearchInput.js";
import { IconButton } from "./ui/IconButton.js";
import { useFincaData } from "../hooks/useFincaData.js";

function MiniBar({ pct, color }) {
  return (
    <div style={{ height: 4, borderRadius: 4, background: T.border, overflow: "hidden", marginTop: 4 }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

function fmt(n) {
  if (n == null) return "—";
  return "C$ " + Math.round(n).toLocaleString("es-NI");
}

function buildRecomendaciones(dashboard, insumos, incidentes) {
  const recs = [];
  const h = dashboard?.resumenHato ?? {};

  // Vacunas con stock crítico
  const vacunasBajas = (insumos ?? []).filter(
    i => i.nombre?.toLowerCase().includes("vacuna") && i.stockActual != null && i.stockMinimo != null && i.stockActual <= i.stockMinimo
  );
  if (vacunasBajas.length > 0) {
    recs.push({
      id: "inv-vacunas", prioridad: "alta",
      titulo: "Stock crítico: Vacunas",
      detalle: `${vacunasBajas.map(v => v.nombre).join(", ")} por debajo del mínimo.`,
      icono: "📦", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", accion: "Ver inventario",
    });
  }

  // Insumos con stock bajo en general
  const insumosBajos = (insumos ?? []).filter(
    i => !i.nombre?.toLowerCase().includes("vacuna") && i.stockActual != null && i.stockMinimo != null && i.stockActual <= i.stockMinimo
  ).slice(0, 2);
  for (const ins of insumosBajos) {
    recs.push({
      id: `inv-${ins.id}`, prioridad: "alta",
      titulo: `Stock bajo: ${ins.nombre}`,
      detalle: `Quedan ${ins.stockActual} ${ins.unidad ?? "unidades"}. Mínimo: ${ins.stockMinimo}.`,
      icono: "📦", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", accion: "Ver inventario",
    });
  }

  // Incidentes sin resolver
  const pendientes = (incidentes ?? []).filter(i => i.estado !== "resuelto" && i.estado !== "RESUELTO").slice(0, 2);
  for (const inc of pendientes) {
    recs.push({
      id: `inc-${inc.id}`, prioridad: "alta",
      titulo: inc.titulo ?? inc.tipo ?? "Incidente activo",
      detalle: inc.descripcion ?? "Requiere atención.",
      icono: "⚠️", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", accion: "Ver incidentes",
    });
  }

  // Animales preñadas próximas a parir (si hay muchas)
  if (h.prenadas > 0) {
    recs.push({
      id: "prenadas", prioridad: "media",
      titulo: `${h.prenadas} vaca${h.prenadas > 1 ? "s" : ""} preñada${h.prenadas > 1 ? "s" : ""}`,
      detalle: "Monitorear condición corporal y preparar área de parición.",
      icono: "🤰", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", accion: "Ver reproducción",
    });
  }

  // Tasa de preñez baja
  if (dashboard?.tasaPrenez != null && dashboard.tasaPrenez < 60) {
    recs.push({
      id: "prenez-baja", prioridad: "media",
      titulo: "Tasa de preñez baja",
      detalle: `${dashboard.tasaPrenez.toFixed(1)}% — el óptimo es ≥ 60%. Revisar protocolo reproductivo.`,
      icono: "📉", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", accion: "Ver reproducción",
    });
  }

  // Sin mortalidad / sin alertas → mensaje positivo
  if (recs.length === 0) {
    recs.push({
      id: "ok", prioridad: "baja",
      titulo: "Todo en orden",
      detalle: "Sin alertas activas. La finca opera con normalidad.",
      icono: "✅", color: "#10B981", bg: "#F0FDF4", border: "#A7F3D0", accion: "Ver hato",
    });
  }

  return recs;
}

const ACCIONES_RAPIDAS = [
  { id: "a1", label: "Registrar venta",  icono: "💰", color: "#10A37F", bg: "#F0FDF4" },
  { id: "a2", label: "Nuevo gasto",      icono: "💸", color: "#EF4444", bg: "#FEF2F2" },
  { id: "a3", label: "Nuevo animal",     icono: "🐄", color: "#0EA5E9", bg: "#F0F9FF" },
  { id: "a4", label: "Registrar evento", icono: "📋", color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "a5", label: "Generar reporte",  icono: "📊", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "a6", label: "Plan sanitario",   icono: "💉", color: "#EC4899", bg: "#FDF2F8" },
];

export function RightPanel({ collapsed, onToggle }) {
  const [tab,          setTab]          = useState("finca");
  const [recDismissed, setRecDismissed] = useState(new Set());
  const [docQuery,     setDocQuery]     = useState("");

  const { data, loading, error, reload } = useFincaData();

  const dismiss = useCallback((id) => setRecDismissed(prev => new Set([...prev, id])), []);

  const dashboard  = data?.dashboard ?? null;
  const insumos    = data?.insumos   ?? [];
  const incidentes = data?.incidentes ?? [];
  const h          = dashboard?.resumenHato ?? {};

  const animalesTotal  = dashboard?.animalesActivos ?? 0;
  const animalesSanos  = animalesTotal - (incidentes.filter(i => i.estado !== "resuelto" && i.estado !== "RESUELTO").length);
  const saludPct       = animalesTotal > 0 ? Math.round((animalesSanos / animalesTotal) * 100) : 0;

  const hatoStatus = saludPct >= 80 ? "bueno" : saludPct >= 50 ? "alerta" : "critico";
  const hatoColor  = hatoStatus === "bueno" ? T.accent : hatoStatus === "alerta" ? "#D97706" : "#DC2626";
  const hatoLabel  = { bueno: "✅ Buen estado", alerta: "⚠️ Revisar", critico: "🚨 Crítico" }[hatoStatus];

  const recomendaciones = buildRecomendaciones(dashboard, insumos, incidentes);
  const recsVisibles    = recomendaciones.filter(r => !recDismissed.has(r.id));
  const altasCount      = recsVisibles.filter(r => r.prioridad === "alta").length;

  // Mes actual para el label financiero
  const mesLabel = new Date().toLocaleDateString("es-NI", { month: "long", year: "numeric" });
  const mesCapital = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

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
            key={t.id} role="tab"
            aria-selected={tab === t.id}
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
          <div id="rp-tab-finca" role="tabpanel">

            {/* Cargando */}
            {loading && (
              <div style={{ padding: "32px 0", textAlign: "center", color: T.muted }}>
                <p style={{ fontSize: 11, margin: 0 }}>Cargando datos de la finca…</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{ padding: "16px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", margin: "12px 0" }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#DC2626" }}>No se pudo cargar la finca</p>
                <button onClick={reload} style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "none", border: "1px solid #DC262640", padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Reintentar</button>
              </div>
            )}

            {/* Datos reales */}
            {!loading && !error && dashboard && (
              <>
                {/* Estado del hato */}
                <SectionLabel label="Estado del hato" />
                <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.panel, padding: "14px 14px 12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: T.text }}>{dashboard.nombreFinca ?? "Mi Finca"}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: hatoColor }}>{hatoLabel}</span>
                    </div>
                    <div aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, background: hatoColor + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🐄</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Total animales", valor: animalesTotal,     icono: "🐄", color: "#0EA5E9" },
                      { label: "En buen estado", valor: animalesSanos > 0 ? animalesSanos : animalesTotal, icono: "✅", color: T.accent },
                      { label: "En venta",       valor: h.enVenta ?? 0,   icono: "🏷️", color: "#F59E0B" },
                      { label: "Preñadas",       valor: h.prenadas ?? 0,  icono: "🤰", color: "#EC4899" },
                    ].map((m, i) => (
                      <div key={i} style={{ padding: "9px 10px", borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
                        <p style={{ margin: "0 0 3px", fontSize: 10, color: T.muted }}><span aria-hidden="true">{m.icono}</span> {m.label}</p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.valor}</p>
                      </div>
                    ))}
                  </div>

                  {/* Desglose por categoría */}
                  {(h.vacas != null || h.toros != null) && (
                    <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: T.bg, border: `1px solid ${T.border}` }}>
                      <p style={{ margin: "0 0 5px", fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Composición del hato</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px" }}>
                        {[
                          ["Vacas", h.vacas], ["Toros", h.toros], ["Novillos", h.novillos],
                          ["Novillas", h.novillas], ["Terneros", h.terneros], ["Terneras", h.terneras],
                        ].filter(([, v]) => v > 0).map(([label, valor]) => (
                          <span key={label} style={{ fontSize: 10, color: T.muted }}>
                            <span style={{ fontWeight: 700, color: T.text }}>{valor}</span> {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: T.muted }}>Salud general</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: hatoColor }}>{saludPct}%</span>
                    </div>
                    <MiniBar pct={saludPct} color={hatoColor} />
                  </div>
                </div>

                {/* Resumen financiero */}
                <SectionLabel label="Resumen financiero" action="Ver finanzas" />
                <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.panel, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Caja disponible", valor: fmt(dashboard.cajaDisponible), icono: "💵", color: T.accent,    sub: "Saldo actual" },
                    { label: "Ventas del mes",  valor: fmt(dashboard.ventasMes?.total), icono: "📈", color: "#0EA5E9", sub: mesCapital },
                    { label: "Gastos del mes",  valor: fmt(dashboard.gastosMes?.total), icono: "📉", color: "#EF4444", sub: mesCapital },
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

                  {/* Ganancia neta */}
                  {dashboard.gananciaNeta != null && (
                    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: T.muted }}>Ganancia neta</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: dashboard.gananciaNeta >= 0 ? T.accent : "#EF4444" }}>
                        {fmt(dashboard.gananciaNeta)}
                      </span>
                    </div>
                  )}
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
                            <button style={{ fontSize: 11, fontWeight: 700, color: r.color, background: "none", border: `1px solid ${r.color}50`, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
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
                  {ACCIONES_RAPIDAS.map(a => (
                    <button key={a.id} style={{ padding: "10px 8px", borderRadius: 11, border: `1px solid ${T.border}`, background: T.panel, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all 0.15s", fontFamily: "inherit" }}
                      onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color + "60"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = T.panel; e.currentTarget.style.borderColor = T.border; }}
                    >
                      <span aria-hidden="true" style={{ fontSize: 20 }}>{a.icono}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: DOCUMENTOS ── */}
        {tab === "docs" && (
          <div id="rp-tab-docs" role="tabpanel" aria-label="Documentos">
            <SectionLabel label="Documentos recientes" action="Ver todos" />
            <div style={{ marginBottom: 12 }}>
              <SearchInput value={docQuery} onChange={setDocQuery} placeholder="Buscar documentos…" />
            </div>
            <div style={{ padding: "32px 0", textAlign: "center", color: T.muted }}>
              <p aria-hidden="true" style={{ fontSize: 24, margin: "0 0 6px" }}>📂</p>
              <p style={{ fontSize: 12, margin: 0 }}>Próximamente: documentos de la finca</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
