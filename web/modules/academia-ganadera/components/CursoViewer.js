"use client";
import { useState } from "react";
import { useCurso } from "../hooks/useCurso.js";
import { getCategoriaConfig } from "../constants/categories.js";
import { getNivelConfig } from "../constants/levels.js";
import { ExamenPanel } from "./ExamenPanel.js";
import { CertificadoCard } from "./CertificadoCard.js";

/**
 * Visor completo de un curso: navegación de lecciones, examen y certificado.
 */
export function CursoViewer({ curso, usuario }) {
  const {
    content, leccionData, leccionActual, totalLecciones,
    progreso, generando, error,
    examen, generandoExamen,
    isFirst, isLast,
    irLeccion, completarLeccion, generarExamen, regenerarContenido,
  } = useCurso(curso);

  const [vista,         setVista]         = useState("leccion"); // leccion | examen | certificado
  const [completandoMsg,setCompletandoMsg]= useState(null);

  const catCfg = getCategoriaConfig(curso.categoria);
  const nivCfg = getNivelConfig(curso.nivel);
  const pct    = progreso?.pct ?? 0;

  const handleCompletar = () => {
    const resultado = completarLeccion(leccionActual);
    if (resultado === "completado") {
      setCompletandoMsg("🎉 ¡Curso completado! Ahora puedes tomar el examen.");
      setTimeout(() => setCompletandoMsg(null), 5000);
    } else if (!isLast) {
      irLeccion(leccionActual + 1);
    }
  };

  const handleAprobado = () => setVista("certificado");

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (generando) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", gap: 16 }}>
        <div style={{ fontSize: 48, animation: "spin 2s linear infinite" }}>🧠</div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111" }}>Generando el curso con IA…</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#6B7280", textAlign: "center" }}>
          Estamos creando contenido personalizado para <strong>{curso.titulo}</strong>.<br/>Esto puede tardar unos segundos.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: 24 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#DC2626", fontSize: 15 }}>⚠️ {error}</p>
          <button onClick={regenerarContenido} style={btnPrimary("#6366F1")}>🔄 Reintentar</button>
        </div>
      </div>
    );
  }

  if (!content) return null;

  // ── Layout principal ──────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 120px)", overflow: "hidden" }}>

      {/* Sidebar — índice de lecciones */}
      <aside style={{
        width: 260, flexShrink: 0,
        background: "#FAFAFA", borderRight: "1px solid #E5E7EB",
        overflowY: "auto", padding: "16px 0",
      }}>
        {/* Metadata del curso */}
        <div style={{ padding: "0 16px 14px", borderBottom: "1px solid #E5E7EB", marginBottom: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{curso.icono}</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#111", lineHeight: 1.3 }}>{curso.titulo}</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge color={catCfg.color} bg={catCfg.bg}>{catCfg.label}</Badge>
            <Badge color={nivCfg.color} bg={nivCfg.bg}>{nivCfg.icono} {nivCfg.label}</Badge>
          </div>
          {/* Barra de progreso */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280", marginBottom: 4 }}>
              <span>Progreso</span><span>{pct}%</span>
            </div>
            <div style={{ height: 4, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: catCfg.color, transition: "width 0.4s" }} />
            </div>
          </div>
        </div>

        {/* Lista de lecciones */}
        {content.lecciones?.map((lec, idx) => {
          const isCompleted = idx < (progreso?.leccionActual ?? 0);
          const isCurrent   = idx === leccionActual && vista === "leccion";
          return (
            <button
              key={lec.id}
              onClick={() => { setVista("leccion"); irLeccion(idx); }}
              style={{
                width: "100%", textAlign: "left",
                padding: "10px 16px", border: "none",
                background: isCurrent ? catCfg.bg : "none",
                borderLeft: isCurrent ? `3px solid ${catCfg.color}` : "3px solid transparent",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>
                {isCompleted ? "✅" : isCurrent ? "▶️" : "⬜"}
              </span>
              <span style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? catCfg.color : "#374151", lineHeight: 1.4 }}>
                {lec.numero}. {lec.titulo}
              </span>
            </button>
          );
        })}

        {/* Acciones finales */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E5E7EB", marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => { setVista("examen"); if (!examen) generarExamen(); }}
            style={btnSidebar("#6366F1")}
          >
            📝 Tomar examen
          </button>
          {progreso?.completado && (
            <button onClick={() => setVista("certificado")} style={btnSidebar("#059669")}>
              🏆 Ver certificado
            </button>
          )}
        </div>
      </aside>

      {/* Contenido principal */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        {completandoMsg && (
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 14, color: "#059669", fontWeight: 600 }}>
            {completandoMsg}
          </div>
        )}

        {/* Vista: Lección */}
        {vista === "leccion" && leccionData && (
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Badge color={catCfg.color} bg={catCfg.bg}>{catCfg.label}</Badge>
              <Badge color="#6B7280" bg="#F3F4F6">Lección {leccionData.numero}/{totalLecciones}</Badge>
              <Badge color="#374151" bg="#F3F4F6">⏱️ {leccionData.duracionMins} min</Badge>
            </div>

            <h1 style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 900, color: "#111", lineHeight: 1.3 }}>
              {leccionData.titulo}
            </h1>

            {/* Puntos clave */}
            {leccionData.puntosClave?.length > 0 && (
              <div style={{ background: catCfg.bg, border: `1px solid ${catCfg.color}33`, borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: catCfg.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Puntos clave de esta lección
                </p>
                {leccionData.puntosClave.map((p, i) => (
                  <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "#374151" }}>✓ {p}</p>
                ))}
              </div>
            )}

            {/* Contenido markdown */}
            <LeccionContenido texto={leccionData.contenido} />

            {/* Navegación */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 20, borderTop: "1px solid #E5E7EB" }}>
              <button
                onClick={() => irLeccion(leccionActual - 1)}
                disabled={isFirst}
                style={btnNav(isFirst)}
              >
                ← Anterior
              </button>
              <button onClick={handleCompletar} style={btnPrimary(catCfg.color)}>
                {isLast ? "✅ Completar curso" : "✅ Completar y seguir →"}
              </button>
              <button
                onClick={() => irLeccion(leccionActual + 1)}
                disabled={isLast}
                style={btnNav(isLast)}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Vista: Examen */}
        {vista === "examen" && (
          <div>
            {generandoExamen ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                <p style={{ fontSize: 14, color: "#6B7280" }}>Generando examen con IA…</p>
              </div>
            ) : examen ? (
              <ExamenPanel
                examen={examen}
                cursoId={curso.id}
                onAprobado={handleAprobado}
                onVolver={() => setVista("leccion")}
              />
            ) : (
              <div style={{ textAlign: "center", padding: 60 }}>
                <button onClick={generarExamen} style={btnPrimary("#6366F1")}>
                  📝 Generar examen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Vista: Certificado */}
        {vista === "certificado" && (
          <CertificadoCard curso={curso} usuario={usuario} />
        )}
      </main>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function LeccionContenido({ texto }) {
  if (!texto) return null;
  const lines = texto.split("\n");
  return (
    <div style={{ fontSize: 15, lineHeight: 1.8, color: "#374151" }}>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} style={{ margin: "20px 0 8px", fontSize: 16, fontWeight: 700, color: "#111" }}>{line.slice(4)}</h3>;
        if (line.startsWith("## "))  return <h2 key={i} style={{ margin: "28px 0 10px", fontSize: 19, fontWeight: 800, color: "#111" }}>{line.slice(3)}</h2>;
        if (line.startsWith("# "))   return <h1 key={i} style={{ margin: "32px 0 12px", fontSize: 22, fontWeight: 900, color: "#111" }}>{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} style={{ margin: "5px 0 5px 16px" }}>• {line.slice(2)}</p>;
        if (/^\d+\.\s/.test(line)) return <p key={i} style={{ margin: "5px 0 5px 16px" }}>{line}</p>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ margin: "12px 0", fontWeight: 700 }}>{line.slice(2, -2)}</p>;
        if (line === "") return <div key={i} style={{ height: 10 }} />;
        return <p key={i} style={{ margin: "6px 0" }}>{line}</p>;
      })}
    </div>
  );
}

function Badge({ children, color, bg }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color, background: bg, padding: "2px 8px", borderRadius: 20 }}>
      {children}
    </span>
  );
}

const btnPrimary = (bg) => ({
  padding: "10px 24px", borderRadius: 30, border: "none",
  background: bg, color: "#FFF", fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
});

const btnNav = (disabled) => ({
  padding: "10px 20px", borderRadius: 30, border: "1px solid #E5E7EB",
  background: disabled ? "#F9FAFB" : "#FFF", color: disabled ? "#D1D5DB" : "#374151",
  fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit",
});

const btnSidebar = (color) => ({
  padding: "8px 14px", borderRadius: 20, border: `1px solid ${color}44`,
  background: color + "12", color, fontSize: 12, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit", width: "100%",
});
