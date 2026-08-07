"use client";
import { useIA }           from "../context/useIA.js";
import { QUICK_QUERIES }   from "../constants/index.js";
import { useProvider }     from "../hooks/useProvider.js";

export function QuickQueries() {
  const { setInput, sendMessage } = useIA();
  const { isBusy }                = useProvider();

  function handleClick(texto) {
    if (isBusy) return;
    setInput(texto);
    // Enviar automáticamente al hacer clic
    setTimeout(() => sendMessage(), 0);
  }

  return (
    <div>
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Consultas frecuentes
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {QUICK_QUERIES.map(q => (
          <button key={q.id}
            onClick={() => handleClick(q.texto)}
            disabled={isBusy}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10,
              border: "1px solid #E2E8F0", background: "#F8FAFC",
              cursor: isBusy ? "default" : "pointer", textAlign: "left",
              fontSize: 12, color: "#1E293B", fontWeight: 500,
              transition: "all 0.15s", opacity: isBusy ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!isBusy) { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.borderColor = "#16a34a"; }}}
            onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E2E8F0"; }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>{q.icono}</span>
            {q.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
