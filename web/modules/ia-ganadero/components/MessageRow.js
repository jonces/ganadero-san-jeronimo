"use client";
import { T }              from "../constants/theme.js";
import { ts }             from "../utils/date.js";
import { SENDER, MESSAGE_STATUS } from "../constants/index.js";
import { MarkdownMessage } from "./MarkdownMessage.js";
import { ImageResultCard } from "../../ai-image-studio/components/ImageResultCard.js";

/**
 * Fila de un mensaje en el chat (usuario o IA).
 *
 * @param {{
 *   message: import('../types/index').Message,
 *   specialistIcon?: string,   - ícono del especialista activo (avatar IA)
 * }} props
 */
export function MessageRow({ message, specialistIcon, onImageRegenerate }) {
  const isUser      = message.sender === SENDER.USER;
  const isError     = message.status === MESSAGE_STATUS.ERROR;
  const isStreaming  = Boolean(message.isStreaming);
  const aiAvatar    = specialistIcon ?? "🤖";

  // Mensajes de tipo "image" — renderizado especial
  if (message.type === "image") {
    return (
      <article aria-label="Imagen generada por IA" style={{ marginBottom: 28, paddingLeft: 48 }}>
        {message.imageStatus === "generating" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: 12,
            background: T.aiBub, border: `1px solid ${T.aiBorder}`,
            maxWidth: 320, color: T.muted, fontSize: 13,
          }}>
            <div style={{
              width: 18, height: 18, border: `2px solid ${T.border}`,
              borderTopColor: "#6366F1", borderRadius: "50%",
              animation: "ia-spin 0.8s linear infinite", flexShrink: 0,
            }} />
            <span>Generando imagen… puede tardar 15–30 seg.</span>
          </div>
        )}
        {message.imageStatus === "error" && (
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: "#FEF2F2", border: "1px solid #FECACA",
            fontSize: 13, color: "#DC2626", maxWidth: 360,
          }}>
            ⚠️ No se pudo generar la imagen: {message.imageError}
          </div>
        )}
        {message.imageStatus === "ready" && message.imageData && (
          <ImageResultCard
            imageData={message.imageData}
            onRegenerate={onImageRegenerate}
          />
        )}
      </article>
    );
  }

  // Los adjuntos de imagen muestran miniaturas sobre el texto
  const imageAtts = (message.attachments ?? []).filter(
    a => a.type === "image" && a.preview,
  );
  const otherAtts = (message.attachments ?? []).filter(
    a => !(a.type === "image" && a.preview),
  );

  return (
    <article
      aria-label={isUser ? "Tu mensaje" : "Respuesta del IA Ganadero"}
      style={{
        display:       "flex",
        gap:           14,
        marginBottom:  28,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems:    "flex-start",
      }}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background:     isUser ? T.accent : T.hover,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       isUser ? 15 : 18,
          boxShadow:      "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        {isUser ? "👤" : aiAvatar}
      </div>

      {/* Burbuja */}
      <div style={{ maxWidth: "80%", minWidth: 40 }}>
        <p style={{
          margin: "0 0 5px", fontSize: 11, fontWeight: 700,
          color: T.muted, textAlign: isUser ? "right" : "left",
        }}>
          {isUser ? "Tú" : "IA Ganadero"}
          {" · "}
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {ts(message.timestamp)}
          </time>
        </p>

        {/* Miniaturas de imágenes adjuntas (solo en mensajes del usuario) */}
        {isUser && imageAtts.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6, justifyContent: "flex-end" }}>
            {imageAtts.map((att, i) => (
              <img
                key={i}
                src={att.preview}
                alt={att.name}
                style={{
                  width: 80, height: 80, objectFit: "cover",
                  borderRadius: 10, border: `1px solid ${T.border}`,
                }}
              />
            ))}
          </div>
        )}

        {/* Chips de otros adjuntos */}
        {isUser && otherAtts.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6, justifyContent: "flex-end" }}>
            {otherAtts.map((att, i) => (
              <span key={i} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 9px", borderRadius: 8,
                background: T.hover, border: `1px solid ${T.border}`,
                fontSize: 11, color: T.muted,
              }}>
                <span>{att.icon ?? "📎"}</span>
                <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {att.name}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Contenido del mensaje */}
        <div
          role={isError ? "alert" : undefined}
          style={{
            padding:    isUser ? "11px 16px" : "12px 16px",
            lineHeight: 1.65,
            fontSize:   14,
            borderRadius: isUser
              ? "18px 4px 18px 18px"
              : "4px 18px 18px 18px",
            background: isError
              ? "#FEF2F2"
              : isUser
                ? T.userBub
                : T.aiBub,
            border: isError
              ? "1px solid #FECACA"
              : isUser
                ? "none"
                : `1px solid ${T.aiBorder}`,
            color:     isError ? T.danger : isUser ? "#fff" : T.text,
            wordBreak: "break-word",
            boxShadow: isUser
              ? "0 2px 8px rgba(16,163,127,0.13)"
              : "0 1px 4px rgba(0,0,0,0.04)",
            // Durante streaming el fondo tiene un leve pulso
            ...(isStreaming && { opacity: 1 }),
          }}
        >
          {isError ? (
            <span>⚠️ Error al procesar la respuesta.</span>
          ) : isUser ? (
            // Mensajes del usuario: texto simple con saltos de línea
            <span style={{ whiteSpace: "pre-wrap" }}>{message.text || "…"}</span>
          ) : (
            // Mensajes de IA: Markdown completo
            <MarkdownMessage
              text={message.text || (isStreaming ? "" : "…")}
              isStreaming={isStreaming}
            />
          )}
        </div>
      </div>
    </article>
  );
}
