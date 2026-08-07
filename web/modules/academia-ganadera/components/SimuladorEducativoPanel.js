"use client";
import { useState, useRef } from "react";
import { SIMULADORES, getSimuladorById } from "../constants/simuladores.js";
import { generateLearningContent } from "../services/content-generator.js";
import { getCategoriaConfig } from "../constants/categories.js";

/**
 * Panel de simuladores educativos interactivos.
 * La IA conduce la simulación de forma conversacional y evalúa las decisiones.
 */
export function SimuladorEducativoPanel() {
  const [seleccionado, setSeleccionado] = useState(null);
  const [paso,         setPaso]         = useState(0);
  const [mensajes,     setMensajes]     = useState([]);
  const [inputUsuario, setInputUsuario] = useState("");
  const [enviando,     setEnviando]     = useState(false);
  const [simulando,    setSimulando]    = useState(false);
  const historialRef   = useRef([]);
  const bottomRef      = useRef(null);

  const iniciarSimulacion = async (sim) => {
    setSeleccionado(sim);
    setPaso(0);
    historialRef.current = [];
    setMensajes([]);
    setSimulando(true);

    const intro = [{
      rol: "sistema",
      texto: `🎬 **Simulación: ${sim.titulo}**\n\n${sim.descripcion}\n\n**Pasos de la simulación:**\n${sim.pasos.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nLa IA te guiará por cada etapa. Responde las preguntas y toma decisiones como si estuvieras en la finca real.`,
    }];
    setMensajes(intro);

    // El primer mensaje del simulador
    await enviarMensajeIA(`${sim.promptBase}\n\nComienzo la simulación. Presenta la etapa inicial con detalles clínicos/técnicos reales y hazme una pregunta de decisión.`, sim, []);
    setSimulando(false);
  };

  const enviarRespuesta = async () => {
    if (!inputUsuario.trim() || enviando || !seleccionado) return;
    const texto = inputUsuario.trim();
    setInputUsuario("");

    const nuevoHistorial = [...historialRef.current, { rol: "usuario", texto }];
    historialRef.current = nuevoHistorial;
    setMensajes(prev => [...prev, { rol: "usuario", texto }]);
    setEnviando(true);

    const contexto = nuevoHistorial.map(m => `${m.rol === "usuario" ? "Estudiante" : "Simulador"}: ${m.texto}`).join("\n");
    await enviarMensajeIA(
      `Continúa la simulación de "${seleccionado.titulo}". El estudiante respondió: "${texto}"\n\nHistorial:\n${contexto}\n\nEvalúa su respuesta (correcta/incorrecta/parcial), da retroalimentación y presenta la siguiente etapa o cierra si terminaron todos los pasos.`,
      seleccionado,
      nuevoHistorial
    );
    setPaso(p => p + 1);
    setEnviando(false);
  };

  const enviarMensajeIA = async (prompt, sim, historial) => {
    let respuesta = "";
    const msgId = Date.now();
    setMensajes(prev => [...prev, { rol: "ia", texto: "", id: msgId }]);

    await generateLearningContent({
      tema: prompt,
      modo: "paso_a_paso",
      especialista: sim.categoria === "finanzas" ? "finanzas" : "veterinario",
      onChunk: (chunk) => {
        respuesta += chunk;
        setMensajes(prev => prev.map(m => m.id === msgId ? { ...m, texto: respuesta } : m));
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      },
      onDone: (full) => {
        historialRef.current = [...historialRef.current, { rol: "ia", texto: full }];
        setMensajes(prev => prev.map(m => m.id === msgId ? { ...m, texto: full } : m));
      },
      onError: (err) => {
        setMensajes(prev => prev.map(m => m.id === msgId ? { ...m, texto: `⚠️ Error: ${err}` } : m));
      },
    });
  };

  const reiniciar = () => {
    setSeleccionado(null);
    setPaso(0);
    setMensajes([]);
    historialRef.current = [];
  };

  // ── Pantalla de selección ─────────────────────────────────────────────────
  if (!seleccionado) {
    return (
      <div>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#111" }}>🎮 Simuladores Educativos</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6B7280" }}>
          Practica situaciones reales de ganadería en un entorno seguro guiado por IA.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {SIMULADORES.map(sim => {
            const cat = getCategoriaConfig(sim.categoria);
            return (
              <div
                key={sim.id}
                onClick={() => iniciarSimulacion(sim)}
                style={{
                  background: "#FFF", border: "1px solid #E5E7EB",
                  borderRadius: 14, padding: "18px 20px",
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.transform = ""; }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{sim.icono}</div>
                <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#111" }}>{sim.titulo}</h4>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{sim.descripcion}</p>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#9CA3AF" }}>
                  <span>⏱️ {sim.duracionMins} min</span>
                  <span>👣 {sim.pasos.length} etapas</span>
                  <span style={{ marginLeft: "auto", color: cat.color, fontWeight: 700, background: cat.bg, padding: "2px 8px", borderRadius: 10 }}>
                    {cat.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Pantalla de simulación activa ─────────────────────────────────────────
  const cat = getCategoriaConfig(seleccionado.categoria);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: 500 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
        background: cat.bg, border: `1px solid ${cat.color}22`, borderRadius: 12, marginBottom: 16, flexShrink: 0,
      }}>
        <span style={{ fontSize: 28 }}>{seleccionado.icono}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111" }}>{seleccionado.titulo}</h3>
          <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>Etapa {paso} de {seleccionado.pasos.length}</p>
        </div>
        <button onClick={reiniciar} style={{
          padding: "6px 14px", borderRadius: 20, border: "1px solid #E5E7EB",
          background: "#FFF", color: "#374151", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>
          ← Cambiar simulador
        </button>
      </div>

      {/* Chat de simulación */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 4px", marginBottom: 12 }}>
        {mensajes.map((m, i) => (
          <MensajeSimulacion key={i} mensaje={m} />
        ))}
        {(enviando || simulando) && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", color: "#6B7280", fontSize: 13 }}>
            <span style={{ animation: "pulse 1s infinite" }}>⏳</span> La IA está respondiendo…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de respuesta */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <input
          value={inputUsuario}
          onChange={e => setInputUsuario(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviarRespuesta()}
          placeholder="Tu respuesta o decisión… (Enter para enviar)"
          disabled={enviando || simulando}
          style={{
            flex: 1, padding: "11px 16px", borderRadius: 30,
            border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "inherit",
            background: enviando ? "#F9FAFB" : "#FFF", color: "#111",
          }}
        />
        <button
          onClick={enviarRespuesta}
          disabled={!inputUsuario.trim() || enviando || simulando}
          style={{
            padding: "11px 20px", borderRadius: 30, border: "none",
            background: (enviando || simulando) ? "#E5E7EB" : cat.color,
            color: "#FFF", fontSize: 14, fontWeight: 700,
            cursor: (enviando || simulando) ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          Responder →
        </button>
      </div>
    </div>
  );
}

function MensajeSimulacion({ mensaje }) {
  const esUsuario = mensaje.rol === "usuario";
  const esSistema = mensaje.rol === "sistema";

  if (esSistema) {
    return (
      <div style={{
        background: "#EEF2FF", border: "1px solid #C7D2FE",
        borderRadius: 12, padding: "14px 18px", marginBottom: 12,
        fontSize: 13, color: "#374151", lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {mensaje.texto}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: esUsuario ? "flex-end" : "flex-start",
      marginBottom: 10,
    }}>
      <div style={{
        maxWidth: "80%",
        background: esUsuario ? "#6366F1" : "#F9FAFB",
        color: esUsuario ? "#FFF" : "#374151",
        border: esUsuario ? "none" : "1px solid #E5E7EB",
        borderRadius: esUsuario ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 16px",
        fontSize: 13, lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {mensaje.texto || <span style={{ color: esUsuario ? "#C7D2FE" : "#9CA3AF" }}>…</span>}
      </div>
    </div>
  );
}
