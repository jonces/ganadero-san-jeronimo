"use client";
import { T } from "../constants/theme.js";

/** Indicador "escribiendo…" con tres puntos animados. */
export function TypingRow({ icon }) {
  return (
    <div
      aria-live="polite"
      aria-label="La IA está escribiendo"
      style={{ display: "flex", gap: 14, marginBottom: 28, alignItems: "flex-start" }}
    >
      <div
        aria-hidden="true"
        style={{ width: 34, height: 34, borderRadius: 10, background: T.hover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}
      >
        {icon ?? "🤖"}
      </div>
      <div>
        <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: T.muted }}>IA Ganadero</p>
        <div style={{
          padding: "12px 18px", borderRadius: "4px 18px 18px 18px",
          background: T.aiBub, border: `1px solid ${T.aiBorder}`,
          display: "flex", gap: 5, alignItems: "center",
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              aria-hidden="true"
              style={{ width: 7, height: 7, borderRadius: "50%", background: T.muted, animation: `ia-dot-bounce 1.3s ease-in-out ${i * 0.18}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
