"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAICore }  from "../../modules/ai-core/hooks/useAICore.js";
import { AGENTS }     from "../../modules/ai-core/constants/agents.js";
import { MODELS }     from "../../modules/ai-core/constants/models.js";

const AGENT_LIST = Object.values(AGENTS).filter(a => a.id !== "orquestador");
const STARTERS   = [
  "¿Cuántos animales tengo en el hato?",
  "Genera un reporte sanitario del mes",
  "¿Cuál es la rentabilidad actual de la finca?",
  "Diseña un protocolo de vacunación",
  "¿Qué alertas sanitarias hay activas?",
  "Crea un plan nutricional para el hato",
  "Genera una imagen de una finca ganadera colombiana",
  "¿Cuáles son los próximos eventos programados?",
];

// Simple markdown renderer
function Markdown({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div style={{ lineHeight: 1.7, fontSize: 14 }}>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} style={{ margin: "10px 0 4px", fontSize: 15, fontWeight: 700 }}>{line.slice(4)}</h3>;
        if (line.startsWith("## "))  return <h2 key={i} style={{ margin: "12px 0 6px", fontSize: 16, fontWeight: 800 }}>{line.slice(3)}</h2>;
        if (line.startsWith("# "))   return <h1 key={i} style={{ margin: "14px 0 8px", fontSize: 18, fontWeight: 900 }}>{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          const content = line.slice(2);
          return <div key={i} style={{ display: "flex", gap: 8, paddingLeft: 8 }}>
            <span style={{ color: "#7c3aed", flexShrink: 0 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: inlineMd(content) }} />
          </div>;
        }
        if (/^\d+\. /.test(line)) {
          const [num, ...rest] = line.split(". ");
          return <div key={i} style={{ display: "flex", gap: 8, paddingLeft: 8 }}>
            <span style={{ color: "#7c3aed", flexShrink: 0, fontWeight: 700 }}>{num}.</span>
            <span dangerouslySetInnerHTML={{ __html: inlineMd(rest.join(". ")) }} />
          </div>;
        }
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />;
      })}
    </div>
  );
}

function inlineMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/`(.+?)`/g,       "<code style='background:#1e293b;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:12px'>$1</code>");
}

function ToolBadge({ tool }) {
  const status = tool.status === "done" ? "✅" : "⚙️";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
      background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "3px 8px", margin: "2px" }}>
      <span>{status}</span>
      <span style={{ color: "#94a3b8" }}>{tool.name}</span>
    </div>
  );
}

function Message({ msg, tools }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <div style={{
          background: "linear-gradient(135deg, #4338ca, #6366f1)", color: "#fff",
          borderRadius: "18px 18px 4px 18px", padding: "10px 16px",
          maxWidth: "72%", fontSize: 14, lineHeight: 1.5,
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  const bkg = msg.isError ? "#1a0a0a" : "#1e293b";
  const bdr = msg.isError ? "#7f1d1d" : "#334155";

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: msg.isSystem ? "#0f172a" : "linear-gradient(135deg, #7c3aed, #4338ca)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
      }}>🤖</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {tools?.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            {tools.map((t, i) => <ToolBadge key={i} tool={t} />)}
          </div>
        )}
        <div style={{
          background: bkg, border: `1px solid ${bdr}`,
          borderRadius: "4px 18px 18px 18px", padding: "12px 16px",
          maxWidth: "90%", color: msg.isError ? "#fca5a5" : "#e2e8f0",
        }}>
          {msg.loading
            ? <span style={{ animation: "pulse 1s infinite" }}>▌</span>
            : msg.isImage
              ? <img src={msg.imageUrl} alt="Imagen IA" style={{ maxWidth: "100%", borderRadius: 8 }} />
              : <Markdown text={msg.content} />}
        </div>
        <p style={{ margin: "4px 0 0 4px", fontSize: 10, color: "#475569" }}>
          {new Date(msg.ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function CopilotoAIShell() {
  const [selectedAgent, setSelectedAgent] = useState("orquestador");
  const [input,         setInput]         = useState("");
  const [hasAI,         setHasAI]         = useState(null);
  const [showPanel,     setShowPanel]     = useState(false);
  const [metrics,       setMetrics]       = useState(null);
  const endRef    = useRef(null);
  const inputRef  = useRef(null);

  const ai = useAICore({
    agentId:  selectedAgent,
    userCtx:  { usuario: "Propietario", empresa: "Mi Empresa", finca: "Finca San Jerónimo" },
  });

  // Check AI availability
  useEffect(() => {
    fetch("/api/ai/context")
      .then(r => r.json())
      .then(d => {
        setHasAI(d.hasAI);
        if (!d.hasAI) {
          ai.addSystemMessage("⚠️ **AI Core sin proveedor configurado**\n\nPara activar la IA real, agrega `OPENAI_API_KEY` en las variables de entorno de Railway.\n\nMientras tanto, puedes explorar la interfaz y la arquitectura completa del AI Core.");
        } else {
          ai.addSystemMessage(`✅ **AI Core activo** · Proveedores disponibles: ${d.providers.map(p => p.label).join(", ")}\n\nSoy tu asistente ganadero inteligente. Puedo consultar los datos reales de tu finca, ejecutar herramientas y conectarme con especialistas. ¿En qué te ayudo hoy?`);
        }
      })
      .catch(() => setHasAI(false));
  }, []);

  // Load metrics periodically
  useEffect(() => {
    const load = () => fetch("/api/ai/tools").then(r => r.json()).then(setMetrics).catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ai.messages]);

  const submit = () => {
    if (!input.trim() || ai.streaming) return;
    ai.send(input, { agentId: selectedAgent });
    setInput("");
  };

  const agent = AGENTS[selectedAgent] ?? AGENTS.orquestador;

  return (
    <div style={{ display: "flex", height: "100dvh", fontFamily: "system-ui,sans-serif", color: "#e2e8f0", background: "#0f172a" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div style={{ width: 220, background: "#0d1526", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid #1e293b" }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#c4b5fd" }}>🤖 AI Core</p>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#475569" }}>GanaderoSG · Executive AI</p>
        </div>

        {/* Agents */}
        <div style={{ padding: "12px 8px", flex: 1, overflowY: "auto" }}>
          <p style={{ margin: "0 0 8px 6px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" }}>Especialistas</p>
          {[AGENTS.orquestador, ...AGENT_LIST].map(ag => (
            <button key={ag.id} onClick={() => setSelectedAgent(ag.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", border: "none", borderRadius: 8, cursor: "pointer",
              background: selectedAgent === ag.id ? "#1e1b4b" : "transparent",
              color: selectedAgent === ag.id ? "#c4b5fd" : "#64748b",
              marginBottom: 2, fontSize: 12, fontWeight: selectedAgent === ag.id ? 700 : 400,
              textAlign: "left",
            }}>
              <span style={{ fontSize: 16 }}>{ag.emoji}</span>
              <span>{ag.label}</span>
            </button>
          ))}
        </div>

        {/* Metrics panel toggle */}
        {metrics && (
          <div style={{ padding: "10px 12px", borderTop: "1px solid #1e293b" }}>
            <button onClick={() => setShowPanel(p => !p)} style={{
              width: "100%", background: "#1e293b", border: "1px solid #334155",
              color: "#94a3b8", borderRadius: 6, padding: "6px 8px", cursor: "pointer", fontSize: 11,
            }}>
              📊 {metrics.totals?.requests ?? 0} consultas · ${(metrics.totals?.cost_usd ?? 0).toFixed(4)}
            </button>
          </div>
        )}

        <div style={{ padding: "10px 12px", borderTop: "1px solid #1e293b" }}>
          <button onClick={ai.clearHistory} style={{
            width: "100%", background: "transparent", border: "1px solid #334155",
            color: "#64748b", borderRadius: 6, padding: "6px 8px", cursor: "pointer", fontSize: 11,
          }}>🗑 Limpiar chat</button>
        </div>
      </div>

      {/* ── Main chat ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>{agent.emoji}</span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{agent.label}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>{agent.descripcion}</p>
          </div>
          {hasAI === false && (
            <span style={{ marginLeft: "auto", fontSize: 11, background: "#7c1d1d", color: "#fca5a5", borderRadius: 5, padding: "3px 8px", fontWeight: 700 }}>
              Sin API Key
            </span>
          )}
          {ai.streaming && (
            <span style={{ marginLeft: "auto", fontSize: 11, background: "#172554", color: "#93c5fd", borderRadius: 5, padding: "3px 8px", fontWeight: 700, animation: "pulse 1s infinite" }}>
              ⚡ Generando…
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 8px" }}>
          {ai.messages.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <p style={{ fontSize: 40, margin: "0 0 12px" }}>🤖</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#c4b5fd", margin: "0 0 6px" }}>AI Core GanaderoSG</p>
              <p style={{ fontSize: 13, color: "#475569", margin: "0 0 28px" }}>Arquitectura profesional de IA ganadera</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500, margin: "0 auto" }}>
                {STARTERS.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{
                    background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
                    borderRadius: 20, padding: "7px 14px", cursor: "pointer", fontSize: 12,
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {ai.messages.map((msg, i) => {
            const isLastAssistant = msg.role === "assistant" && i === ai.messages.length - 1;
            const tools = isLastAssistant ? ai.toolActivity : [];
            return <Message key={i} msg={msg} tools={tools} />;
          })}
          <div ref={endRef} />
        </div>

        {/* Tool activity strip */}
        {ai.toolActivity.length > 0 && (
          <div style={{ padding: "6px 24px", borderTop: "1px solid #1e293b", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ai.toolActivity.map((t, i) => <ToolBadge key={i} tool={t} />)}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #1e293b", display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "flex-end", gap: 8 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={`Consultar a ${agent.label}… (Enter para enviar)`}
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#e2e8f0", fontSize: 14, resize: "none", fontFamily: "inherit",
                maxHeight: 120, lineHeight: 1.5,
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            onClick={ai.streaming ? ai.abort : submit}
            disabled={!ai.streaming && !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
              background: ai.streaming ? "#7f1d1d" : input.trim() ? "linear-gradient(135deg, #7c3aed, #4338ca)" : "#1e293b",
              color: "#fff", fontSize: 18, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {ai.streaming ? "■" : "↑"}
          </button>
        </div>

        {/* Model info bar */}
        <div style={{ padding: "4px 20px 8px", display: "flex", gap: 12, fontSize: 10, color: "#334155" }}>
          <span>🔒 API Key segura · servidor</span>
          <span>·</span>
          <span>Especialista: {agent.label}</span>
          <span>·</span>
          <span>Modelo: {agent.model ?? "auto"}</span>
        </div>
      </div>

      {/* ── Metrics side panel ───────────────────────────────────── */}
      {showPanel && metrics && (
        <div style={{ width: 260, background: "#0d1526", borderLeft: "1px solid #1e293b", padding: "16px", overflowY: "auto" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>📊 Observabilidad</p>
          {[
            ["Consultas", metrics.totals?.requests ?? 0],
            ["Errores",   metrics.totals?.errors   ?? 0],
            ["Tokens",    (metrics.totals?.tokens   ?? 0).toLocaleString()],
            ["Costo USD", `$${(metrics.totals?.cost_usd ?? 0).toFixed(4)}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b", fontSize: 12 }}>
              <span style={{ color: "#475569" }}>{k}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{v}</span>
            </div>
          ))}

          <p style={{ margin: "14px 0 8px", fontSize: 11, fontWeight: 700, color: "#475569" }}>ÚLTIMAS CONSULTAS</p>
          {(metrics.recentRequests ?? []).slice(0, 8).map((r, i) => (
            <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #0f172a", fontSize: 11 }}>
              <p style={{ margin: 0, color: "#94a3b8" }}>{r.model} · {r.agent}</p>
              <p style={{ margin: 0, color: "#475569" }}>{r.durationMs}ms · ${r.cost_usd?.toFixed(5)}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px }
      `}</style>
    </div>
  );
}
