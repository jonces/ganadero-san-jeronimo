"use client";
import { useState, useCallback } from "react";
import { T } from "../constants/theme.js";
import { CATEGORIAS_IA, EMERGENCIAS_IA } from "../constants/quick-queries.js";
import { SearchInput } from "./ui/SearchInput.js";

/**
 * Pantalla de bienvenida + categorías de consulta rápida.
 * @param {{ onPickQuery: (q: { texto: string }) => void }} props
 */
export function WelcomeScreen({ onPickQuery }) {
  const [expanded, setExpanded] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const categoriasFiltradas = CATEGORIAS_IA.filter(c => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      c.titulo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      c.sugerencias.some(s => s.toLowerCase().includes(q))
    );
  });

  const handlePick = useCallback((texto) => {
    onPickQuery({ texto });
  }, [onPickQuery]);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 24px 48px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* ── Encabezado ── */}
        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            aria-hidden="true"
            style={{
              width: 64, height: 64, borderRadius: 18, margin: "0 auto 18px",
              background: `linear-gradient(135deg, ${T.accent}, var(--ia-accent-dim))`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, boxShadow: `0 8px 28px rgba(16,163,127,0.25)`,
            }}
          >🤖</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 900, color: T.text, letterSpacing: "-0.5px" }}>
            ¿En qué te ayudo hoy?
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
            Selecciona una categoría o escribe tu consulta directamente abajo
          </p>
        </header>

        {/* ── Buscador ── */}
        <div style={{ marginBottom: 24 }}>
          <SearchInput
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar entre las consultas frecuentes…"
            size="lg"
          />
        </div>

        {/* ── Sin resultados ── */}
        {categoriasFiltradas.length === 0 && (
          <div role="status" style={{ textAlign: "center", padding: "40px 0", color: T.muted }}>
            <p aria-hidden="true" style={{ fontSize: 32, margin: "0 0 10px" }}>🔍</p>
            <p style={{ fontSize: 14, margin: 0 }}>Sin resultados para <strong>"{busqueda}"</strong></p>
            <p style={{ fontSize: 12, margin: "6px 0 0" }}>Prueba con otras palabras o escribe directamente en el chat</p>
          </div>
        )}

        {/* ── Grid de categorías ── */}
        <div
          data-ia-welcome-grid
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}
        >
          {categoriasFiltradas.map(cat => {
            const isOpen = expanded === cat.id;
            return (
              <div
                key={cat.id}
                style={{
                  borderRadius: 14,
                  border: `1.5px solid ${isOpen ? cat.color : cat.border}`,
                  background: isOpen ? cat.bg : T.panel,
                  overflow: "hidden", transition: "all 0.2s",
                  boxShadow: isOpen ? `0 4px 20px ${cat.color}20` : "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <button
                  aria-expanded={isOpen}
                  aria-controls={`cat-items-${cat.id}`}
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                  style={{ width: "100%", padding: "14px 14px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div
                      aria-hidden="true"
                      style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: cat.bg, border: `1px solid ${cat.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}
                    >
                      {cat.icono}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{cat.titulo}</p>
                      <p style={{ margin: 0, fontSize: 11, color: T.muted, lineHeight: 1.4 }}>{cat.descripcion}</p>
                    </div>
                    <svg
                      aria-hidden="true"
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round"
                      style={{ flexShrink: 0, marginTop: 2, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, color: cat.color, background: cat.bg, border: `1px solid ${cat.border}` }}>
                      {cat.sugerencias.length} consultas →
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`cat-items-${cat.id}`}
                    style={{ borderTop: `1px solid ${cat.border}`, padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {cat.sugerencias.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handlePick(s)}
                        style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid transparent", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 12, color: T.text, display: "flex", alignItems: "center", gap: 8, transition: "all 0.13s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = cat.hoverBg; e.currentTarget.style.borderColor = cat.border; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                      >
                        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        {s}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePick(cat.titulo)}
                      style={{ marginTop: 4, padding: "8px 12px", borderRadius: 9, border: `1.5px dashed ${cat.border}`, background: "transparent", cursor: "pointer", textAlign: "center", fontSize: 11, color: cat.color, fontWeight: 700, transition: "background 0.13s" }}
                      onMouseEnter={e => e.currentTarget.style.background = cat.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      + Hacer otra pregunta sobre {cat.titulo.toLowerCase()}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Emergencias rápidas ── */}
        <section aria-label="Emergencias frecuentes" style={{ marginTop: 28, padding: "16px 20px", borderRadius: 14, background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>🚨</span>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#DC2626" }}>Emergencias frecuentes</p>
            <span style={{ fontSize: 11, color: "#991B1B" }}>— Haz clic para consultar de inmediato</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EMERGENCIAS_IA.map((q, i) => (
              <button
                key={i}
                onClick={() => handlePick(q)}
                style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #FECACA", background: "#fff", cursor: "pointer", fontSize: 12, color: "#DC2626", fontWeight: 600, transition: "all 0.13s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#DC2626"; }}
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* ── Badge estado ── */}
        <div role="status" aria-live="polite" style={{ marginTop: 28, textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: T.bg, border: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
            IA no conectada · Solo interfaz visual · Las respuestas serán simuladas
          </span>
        </div>
      </div>
    </div>
  );
}
