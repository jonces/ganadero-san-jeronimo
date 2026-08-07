"use client";
import { useState, useRef } from "react";
import { LEARNING_MODE_CONFIG } from "../constants/content-types.js";
import { generateLearningContent, generateDocumento } from "../services/content-generator.js";
import { saveBibliotecaItem } from "../services/academia-storage.js";

/**
 * Panel "Modo Aprender" — el usuario escribe un tema, elige el modo
 * y la IA genera el contenido en streaming.
 * Guarda automáticamente el resultado en la Biblioteca personal.
 */
export function ModoAprenderPanel({ especialista, categoriaDefault }) {
  const [tema,       setTema]       = useState("");
  const [modoActivo, setModoActivo] = useState("explicame");
  const [generando,  setGenerando]  = useState(false);
  const [contenido,  setContenido]  = useState("");
  const [error,      setError]      = useState(null);
  const [guardado,   setGuardado]   = useState(false);
  const contenidoRef = useRef("");

  const lanzar = async () => {
    if (!tema.trim()) return;
    setGenerando(true);
    setContenido("");
    setError(null);
    setGuardado(false);
    contenidoRef.current = "";

    try {
      if (["pdf", "infografia", "examen", "curso"].includes(modoActivo) && modoActivo !== "examen") {
        const texto = await generateDocumento({
          tipo:      modoActivo === "infografia" ? "guia" : modoActivo === "pdf" ? "resumen" : "guia",
          tema,
          categoria: categoriaDefault ?? "sanidad",
          nivel:     "intermedio",
        });
        setContenido(texto);
        contenidoRef.current = texto;
      } else {
        await generateLearningContent({
          tema, modo: modoActivo, especialista,
          onChunk: (chunk) => {
            contenidoRef.current += chunk;
            setContenido(contenidoRef.current);
          },
          onDone: (full) => {
            contenidoRef.current = full;
            setContenido(full);
          },
          onError: (msg) => setError(msg),
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  };

  const guardarEnBiblioteca = () => {
    const modoCfg = LEARNING_MODE_CONFIG.find(m => m.id === modoActivo);
    saveBibliotecaItem({
      tipo:      modoActivo,
      titulo:    `${modoCfg?.icono ?? "📄"} ${tema}`,
      contenido: contenidoRef.current,
      categoria: categoriaDefault ?? "general",
      modo:      modoActivo,
    });
    setGuardado(true);
  };

  const copiar = async () => {
    try { await navigator.clipboard.writeText(contenidoRef.current); } catch {}
  };

  const imprimir = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${tema}</title>
    <style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.8}
    h1,h2,h3{color:#15803D}pre{background:#f4f4f4;padding:10px;border-radius:4px}
    @media print{body{margin:20px}}</style></head><body>
    <h1>${tema}</h1><hr/>${markdownToHtml(contenidoRef.current)}</body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Barra de entrada */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
          ¿Sobre qué quieres aprender?
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={tema}
            onChange={e => setTema(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lanzar()}
            placeholder="Ej: mastitis bovina, pastoreo rotacional, inseminación artificial…"
            style={{
              flex: 1, padding: "11px 16px", borderRadius: 30,
              border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "inherit",
              color: "#111", outline: "none",
            }}
            onFocus={e => e.target.style.border = "1.5px solid #6366F1"}
            onBlur={e => e.target.style.border = "1.5px solid #E5E7EB"}
          />
          <button
            onClick={lanzar}
            disabled={!tema.trim() || generando}
            style={{
              padding: "11px 24px", borderRadius: 30, border: "none",
              background: generando ? "#E5E7EB" : "#6366F1", color: generando ? "#9CA3AF" : "#FFF",
              fontSize: 14, fontWeight: 700, cursor: generando ? "not-allowed" : "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            {generando ? "Generando…" : "✨ Generar"}
          </button>
        </div>
      </div>

      {/* Modos de aprendizaje */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {LEARNING_MODE_CONFIG.map(m => (
          <button
            key={m.id}
            onClick={() => setModoActivo(m.id)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 20,
              border: modoActivo === m.id ? "2px solid #6366F1" : "1px solid #E5E7EB",
              background: modoActivo === m.id ? "#EEF2FF" : "#F9FAFB",
              color: modoActivo === m.id ? "#4F46E5" : "#6B7280",
              fontSize: 12, fontWeight: modoActivo === m.id ? 700 : 500,
              cursor: "pointer", fontFamily: "inherit",
            }}
            title={m.prompt}
          >
            {m.icono} {m.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 16, marginBottom: 16, color: "#DC2626", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Contenido generado */}
      {contenido && (
        <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          {/* Barra de acciones */}
          <div style={{
            padding: "10px 16px", borderBottom: "1px solid #E5E7EB",
            display: "flex", gap: 8, alignItems: "center", background: "#F9FAFB",
          }}>
            <span style={{ flex: 1, fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
              {LEARNING_MODE_CONFIG.find(m => m.id === modoActivo)?.icono} {tema}
            </span>
            <ActionBtn onClick={copiar} label="Copiar" icono="📋" />
            <ActionBtn onClick={imprimir} label="Imprimir" icono="🖨️" />
            <ActionBtn
              onClick={guardarEnBiblioteca}
              label={guardado ? "Guardado ✓" : "Guardar"}
              icono="💾"
              active={guardado}
            />
          </div>

          {/* Texto con markdown simple */}
          <div style={{ padding: "20px 24px", maxHeight: 600, overflowY: "auto" }}>
            <MarkdownView text={contenido} />
          </div>
        </div>
      )}

      {/* Indicador streaming */}
      {generando && !contenido && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#6B7280" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
          <p style={{ margin: 0, fontSize: 14 }}>La IA está generando tu contenido…</p>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ActionBtn({ onClick, label, icono, active }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 20,
      border: active ? "1px solid #15803D" : "1px solid #E5E7EB",
      background: active ? "#F0FDF4" : "#FFF",
      color: active ? "#15803D" : "#374151",
      fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    }}>
      {icono} {label}
    </button>
  );
}

function MarkdownView({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} style={{ margin: "16px 0 6px", fontSize: 15, fontWeight: 700, color: "#111" }}>{line.slice(4)}</h3>;
        if (line.startsWith("## "))  return <h2 key={i} style={{ margin: "20px 0 8px", fontSize: 17, fontWeight: 800, color: "#15803D" }}>{line.slice(3)}</h2>;
        if (line.startsWith("# "))   return <h1 key={i} style={{ margin: "24px 0 10px", fontSize: 20, fontWeight: 900, color: "#111" }}>{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} style={{ margin: "4px 0", paddingLeft: 16 }}>• {line.slice(2)}</p>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ margin: "8px 0", fontWeight: 700 }}>{line.slice(2, -2)}</p>;
        if (line === "") return <div key={i} style={{ height: 8 }} />;
        return <p key={i} style={{ margin: "4px 0" }}>{line}</p>;
      })}
    </div>
  );
}

function markdownToHtml(text) {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
