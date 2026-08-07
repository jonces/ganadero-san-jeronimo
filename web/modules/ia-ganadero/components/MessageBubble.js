"use client";
import { SENDER, MESSAGE_STATUS, ATTACHMENT_TYPE } from "../constants/index.js";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }) {
  const isUser  = message.sender === SENDER.USER;
  const isError = message.status === MESSAGE_STATUS.ERROR;

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10, gap: 8, alignItems: "flex-end" }}>
      {/* Avatar IA */}
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
          🤖
        </div>
      )}

      <div style={{ maxWidth: "75%", minWidth: 60 }}>
        {/* Adjuntos de imagen */}
        {message.attachments?.filter(a => a.type === ATTACHMENT_TYPE.IMAGE).map(a => (
          <img key={a.id} src={a.url} alt={a.name}
            style={{ display: "block", maxWidth: 200, borderRadius: 10, marginBottom: 4, border: "1px solid #E2E8F0" }} />
        ))}
        {/* Adjuntos de documento */}
        {message.attachments?.filter(a => a.type !== ATTACHMENT_TYPE.IMAGE).map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.05)", marginBottom: 4, fontSize: 12, color: isUser ? "#fff" : "#334155" }}>
            📄 {a.name}
          </div>
        ))}

        {/* Burbuja de texto */}
        <div style={{
          padding: "10px 14px", lineHeight: 1.55, fontSize: 13,
          borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          background:   isError ? "#FEF2F2" : isUser ? "#16a34a" : "#F0FDF4",
          border:       isError ? "1px solid #FECACA" : isUser ? "none" : "1px solid #BBF7D0",
          color:        isError ? "#DC2626" : isUser ? "#fff" : "#166534",
          wordBreak:    "break-word",
          whiteSpace:   "pre-wrap",
        }}>
          {isError ? (message.text || "Error al procesar la respuesta.") : (message.text || " ")}
        </div>

        {/* Timestamp */}
        <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94A3B8", textAlign: isUser ? "right" : "left" }}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
