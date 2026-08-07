"use client";
import { useMessages }      from "../hooks/useMessages.js";
import { useConversation }  from "../hooks/useConversation.js";
import { MessageBubble }    from "./MessageBubble.js";
import { TypingIndicator }  from "./TypingIndicator.js";
import { QuickQueries }     from "./QuickQueries.js";

const C = { green: "#16a34a", muted: "#94A3B8", border: "#E2E8F0" };

export function ChatWindow() {
  const { messages, bottomRef, isEmpty } = useMessages({ autoScroll: true });
  const { active }                       = useConversation();

  if (!active) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#fff" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#1E293B" }}>Centro IA Ganadero</h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            Tu asistente inteligente para gestión ganadera.<br />
            Selecciona o crea una conversación para comenzar.
          </p>
          <QuickQueries />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", overflow: "hidden" }}>
      {/* Cabecera del chat */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#1E293B" }}>{active.title}</p>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{messages.length} mensajes</p>
        </div>
      </div>

      {/* Área de mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {isEmpty ? (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>👋</p>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
              ¿En qué puedo ayudarte con tu finca hoy?
            </p>
            <QuickQueries />
          </div>
        ) : (
          <>
            {messages.map(m => <MessageBubble key={m.id} message={m} />)}
            <TypingIndicator />
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
