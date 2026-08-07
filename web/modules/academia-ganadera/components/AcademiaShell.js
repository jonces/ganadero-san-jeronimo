"use client";
import { useState } from "react";
import { useAcademia }            from "../hooks/useAcademia.js";
import { CursoCard }              from "./CursoCard.js";
import { BibliotecaPanel }        from "./BibliotecaPanel.js";
import { ProgresoDashboard }      from "./ProgresoDashboard.js";
import { ModoAprenderPanel }      from "./ModoAprenderPanel.js";
import { SimuladorEducativoPanel} from "./SimuladorEducativoPanel.js";
import { CATEGORIAS_LISTA }       from "../constants/categories.js";

const TABS = [
  { id: "inicio",      label: "Inicio",        icono: "🏠" },
  { id: "cursos",      label: "Cursos",         icono: "🎓" },
  { id: "aprender",    label: "Modo Aprender",  icono: "✨" },
  { id: "simuladores", label: "Simuladores",    icono: "🎮" },
  { id: "biblioteca",  label: "Biblioteca",     icono: "📚" },
  { id: "progreso",    label: "Mi Progreso",    icono: "📊" },
];

/**
 * Shell principal de la Academia Ganadera Inteligente.
 */
export function AcademiaShell() {
  const [tab,         setTab]         = useState("inicio");
  const [catActiva,   setCatActiva]   = useState("");

  const {
    recomendados, recientes, enProgreso, completados,
    estadisticas, progreso,
    resultados,
    searchQuery, setSearchQuery,
    filtroCategoria, setFiltroCategoria,
    filtroNivel, setFiltroNivel,
  } = useAcademia();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#F9FAFB" }}>

      {/* Top bar */}
      <div style={{
        background: "#FFF",
        borderBottom: "1px solid #E5E7EB",
        flexShrink: 0,
      }}>
        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, #15803D 0%, #065F46 100%)",
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#FFF" }}>
              🐄 Academia Ganadera
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#D1FAE5" }}>
              Aprende, practica y certifícate — impulsado por Inteligencia Artificial
            </p>
          </div>
          {/* Búsqueda global */}
          <div style={{ position: "relative", width: 300 }}>
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); if (e.target.value) setTab("cursos"); }}
              placeholder="🔍 Buscar cursos, temas…"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "10px 16px", borderRadius: 30,
                border: "none", fontSize: 13, fontFamily: "inherit",
                background: "rgba(255,255,255,0.15)", color: "#FFF",
                outline: "none",
              }}
            />
          </div>
          {/* Estadísticas */}
          <div style={{ display: "flex", gap: 20, color: "#FFF" }}>
            <StatChip label="Completados" value={estadisticas?.cursosCompletados ?? 0} icono="✅" />
            <StatChip label="Certificados" value={estadisticas?.certificados ?? 0} icono="🏆" />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, overflowX: "auto", padding: "0 8px" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 18px",
                border: "none",
                borderBottom: tab === t.id ? "3px solid #15803D" : "3px solid transparent",
                background: "none",
                color: tab === t.id ? "#15803D" : "#6B7280",
                fontSize: 13,
                fontWeight: tab === t.id ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {t.icono} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

        {/* ── INICIO ── */}
        {tab === "inicio" && (
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* Continuar aprendiendo */}
            {enProgreso.length > 0 && (
              <Section titulo="📚 Continuar aprendiendo" onVerTodo={() => setTab("progreso")}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {enProgreso.slice(0, 3).map(({ curso, progreso: prog }) => (
                    <CursoCard key={curso.id} curso={curso} progreso={prog} />
                  ))}
                </div>
              </Section>
            )}

            {/* Recomendados */}
            {recomendados.length > 0 && (
              <Section titulo="💡 Recomendados para ti" onVerTodo={() => setTab("cursos")}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {recomendados.slice(0, 6).map(({ curso, razon }) => (
                    <CursoCard key={curso.id} curso={curso} progreso={progreso[curso.id]} razon={razon} />
                  ))}
                </div>
              </Section>
            )}

            {/* Categorías */}
            <Section titulo="📂 Explorar por categoría">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIAS_LISTA.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setFiltroCategoria(cat.id); setTab("cursos"); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 30,
                      border: `1px solid ${cat.color}33`,
                      background: cat.bg, color: cat.color,
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {cat.icono} {cat.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* Modo Aprender — promo */}
            <div style={{
              background: "linear-gradient(135deg, #EEF2FF, #F0FDF4)",
              border: "1px solid #C7D2FE", borderRadius: 16,
              padding: "24px 28px", marginBottom: 28,
              display: "flex", alignItems: "center", gap: 24,
            }}>
              <div style={{ fontSize: 48 }}>✨</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#111" }}>Modo Aprender con IA</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
                  Escribe cualquier pregunta y elige cómo quieres aprenderla: paso a paso, con imágenes, como principiante, o que la IA te haga un curso completo.
                </p>
              </div>
              <button
                onClick={() => setTab("aprender")}
                style={{
                  padding: "12px 28px", borderRadius: 30, border: "none",
                  background: "#6366F1", color: "#FFF", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                Probar ahora →
              </button>
            </div>
          </div>
        )}

        {/* ── CURSOS ── */}
        {tab === "cursos" && (
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Filtros */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={selectStyle}>
                <option value="">Todas las categorías</option>
                {CATEGORIAS_LISTA.map(c => <option key={c.id} value={c.id}>{c.icono} {c.label}</option>)}
              </select>
              <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)} style={selectStyle}>
                <option value="">Todos los niveles</option>
                <option value="principiante">🌱 Principiante</option>
                <option value="intermedio">🌿 Intermedio</option>
                <option value="avanzado">🌳 Avanzado</option>
                <option value="experto">🏆 Experto</option>
              </select>
              {(filtroCategoria || filtroNivel || searchQuery) && (
                <button
                  onClick={() => { setFiltroCategoria(""); setFiltroNivel(""); setSearchQuery(""); }}
                  style={{ padding: "8px 16px", borderRadius: 30, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ✕ Limpiar filtros
                </button>
              )}
              <span style={{ alignSelf: "center", fontSize: 12, color: "#6B7280", marginLeft: "auto" }}>
                {resultados.length} cursos
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {resultados.map(({ curso }) => (
                <CursoCard key={curso.id} curso={curso} progreso={progreso[curso.id]} />
              ))}
            </div>
          </div>
        )}

        {/* ── MODO APRENDER ── */}
        {tab === "aprender" && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111" }}>✨ Modo Aprender con IA</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
                Escribe un tema o pregunta y elige cómo quieres que la IA te lo explique.
              </p>
            </div>
            <ModoAprenderPanel />
          </div>
        )}

        {/* ── SIMULADORES ── */}
        {tab === "simuladores" && (
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <SimuladorEducativoPanel />
          </div>
        )}

        {/* ── BIBLIOTECA ── */}
        {tab === "biblioteca" && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111" }}>📚 Mi Biblioteca</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
                Todo el contenido que hayas generado con la IA queda guardado aquí.
              </p>
            </div>
            <BibliotecaPanel />
          </div>
        )}

        {/* ── PROGRESO ── */}
        {tab === "progreso" && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111" }}>📊 Mi Progreso</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>Tu historial de aprendizaje, certificados y estadísticas.</p>
            </div>
            <ProgresoDashboard estadisticas={estadisticas} enProgreso={enProgreso} completados={completados} />
          </div>
        )}

      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Section({ titulo, children, onVerTodo }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>{titulo}</h2>
        {onVerTodo && (
          <button onClick={onVerTodo} style={{ background: "none", border: "none", color: "#6366F1", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Ver todo →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function StatChip({ label, value, icono }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 10, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{icono} {label}</div>
    </div>
  );
}

const selectStyle = {
  padding: "9px 14px", borderRadius: 30, border: "1px solid #E5E7EB",
  background: "#FFF", color: "#374151", fontSize: 13, fontFamily: "inherit",
  cursor: "pointer",
};
