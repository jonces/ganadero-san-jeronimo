"use client";
import { T } from "../constants/theme.js";
import { ts } from "../utils/date.js";
import { SENDER, MESSAGE_STATUS } from "../constants/index.js";

/**
 * Fila de un mensaje en el chat (usuario o IA).
 * @param {{ message: import('../types/index').Message }} props
 */
export function MessageRow({ message }) {
  const isUser  = message.sender === SENDER.USER;
  const isError = message.status === MESSAGE_STATUS.ERROR;

  return (
    <article
      aria-label={isUser ? "Tu mensaje" : "Respuesta del IA Ganadero"}
      style={{
        display: "flex", gap: 14, marginBottom: 28,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: isUser ? T.accent : T.hover,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isUser ? 15 : 17,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        {isUser ? "👤" : "🤖"}
      </div>

      {/* Burbuja */}
      <div style={{ maxWidth: "80%", minWidth: 40 }}>
        <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: T.muted, textAlign: isUser ? "right" : "left" }}>
          {isUser ? "Tú" : "IA Ganadero"} · <time dateTime={new Date(message.timestamp).toISOString()}>{ts(message.timestamp)}</time>
        </p>
        <div
          role={isError ? "alert" : undefined}
          style={{
            padding: "12px 16px", lineHeight: 1.65, fontSize: 14,
            borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            background:   isError ? "#FEF2F2"  : isUser ? T.userBub : T.aiBub,
            border:       isError ? "1px solid #FECACA" : isUser ? "none" : `1px solid ${T.aiBorder}`,
            color:        isError ? T.danger   : isUser ? "#fff"   : T.text,
            wordBreak: "break-word", whiteSpace: "pre-wrap",
            boxShadow: isUser ? `0 2px 8px rgba(16,163,127,0.13)` : "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {isError ? "Error al procesar la respuesta." : (message.text || "…")}
        </div>
      </div>
    </article>
  );
}
