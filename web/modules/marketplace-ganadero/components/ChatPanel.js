"use client";
import React, { useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat.js";
import { MSG_TYPE } from "../services/chat-service.js";

export default function ChatPanel({ listingId, vendedorId, vendedorNombre }) {
  const { messages, input, setInput, send, myUser } = useChat(listingId, vendedorId);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (input.trim()) send(MSG_TYPE.TEXTO, input.trim());
  };

  return (
    <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Chat con {vendedorNombre}</p>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>Negociación comercial</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ height: 280, overflowY: "auto", padding: "12px 14px", background: "#f9fafb", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", margin: "auto", color: "#9ca3af" }}>
            <p style={{ fontSize: 28, margin: "0 0 6px" }}>💬</p>
            <p style={{ fontSize: 13 }}>Inicia la conversación con el vendedor.</p>
          </div>
        )}
        {messages.map(m => {
          const isMine = m.remitente?.id === myUser.id;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "75%", padding: "8px 12px", borderRadius: isMine ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: isMine ? "#6366f1" : "#fff",
                color:      isMine ? "#fff" : "#111827",
                border:     isMine ? "none" : "1px solid #e5e7eb",
                fontSize:   13, lineHeight: 1.4,
              }}>
                {m.tipo === MSG_TYPE.COTIZACION ? (
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 12 }}>📋 Cotización</p>
                    <p style={{ margin: 0 }}>{m.contenido}</p>
                  </div>
                ) : m.contenido}
                <p style={{ margin: "4px 0 0", fontSize: 10, opacity: 0.6, textAlign: "right" }}>
                  {new Date(m.ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Escribe un mensaje…"
          style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none" }}
        />
        <button onClick={handleSend} disabled={!input.trim()} style={{
          border: "none", background: "#6366f1", color: "#fff",
          borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13,
          opacity: input.trim() ? 1 : 0.5,
        }}>
          Enviar
        </button>
      </div>

      {/* Tipo de mensaje */}
      <div style={{ padding: "6px 12px 8px", background: "#fff", display: "flex", gap: 6 }}>
        {[
          { tipo: MSG_TYPE.IMAGEN,     label: "📷 Foto",    placeholder: "URL de imagen" },
          { tipo: MSG_TYPE.DOCUMENTO,  label: "📄 Archivo", placeholder: "URL de documento" },
          { tipo: MSG_TYPE.UBICACION,  label: "📍 Ubicación", placeholder: "Coordenadas o dirección" },
        ].map(({ tipo, label, placeholder }) => (
          <button key={tipo} onClick={() => {
            const val = window.prompt(placeholder);
            if (val) send(tipo, val);
          }} style={{
            border: "1px solid #e5e7eb", background: "#f9fafb", color: "#6b7280",
            borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11,
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}
