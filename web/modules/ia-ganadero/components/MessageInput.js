"use client";
import { useRef }          from "react";
import { useIA }           from "../context/useIA.js";
import { useProvider }     from "../hooks/useProvider.js";
import { AttachmentPreview } from "./AttachmentPreview.js";
import { fileToAttachment } from "../utils/file-handler.js";
import { LIMITS }          from "../constants/index.js";

const C = { green: "#16a34a", border: "#E2E8F0", muted: "#94A3B8", text: "#1E293B" };

export function MessageInput() {
  const { state, setInput, sendMessage, addAttachment, newConversation } = useIA();
  const { isBusy, supportsVision, supportsDocuments, supportsAudio }     = useProvider();
  const fileRef  = useRef(null);
  const audioRef = useRef(null);

  const canSend  = (state.inputText.trim().length > 0 || state.pendingAttachments.length > 0) && !isBusy;

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  }

  async function handleSend() {
    if (!state.activeId) newConversation();
    await sendMessage();
  }

  async function handleFile(e) {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) {
      try {
        const att = await fileToAttachment(f);
        addAttachment(att);
      } catch (err) {
        alert(err.message);
      }
    }
    e.target.value = "";
  }

  return (
    <div style={{ borderTop: "1px solid " + C.border, padding: "10px 14px 14px", background: "#fff" }}>
      <AttachmentPreview />

      {/* Botones de adjunto */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[
          {
            icono: "📎", label: "Adjuntar",
            onClick: () => { fileRef.current.accept = LIMITS.ACCEPTED_DOC_TYPES.join(","); fileRef.current.click(); },
            disabled: !supportsDocuments,
            title: supportsDocuments ? "Adjuntar archivo" : "Este modelo no soporta documentos aún",
          },
          {
            icono: "📷", label: "Fotografía",
            onClick: () => { fileRef.current.accept = LIMITS.ACCEPTED_IMAGE_TYPES.join(","); fileRef.current.click(); },
            disabled: !supportsVision,
            title: supportsVision ? "Adjuntar imagen" : "Este modelo no soporta imágenes aún",
          },
          {
            icono: "🎤", label: "Hablar",
            onClick: () => audioRef.current?.click(),
            disabled: !supportsAudio,
            title: supportsAudio ? "Grabar audio" : "Este modelo no soporta audio aún",
          },
        ].map(btn => (
          <button key={btn.label}
            onClick={btn.onClick}
            disabled={btn.disabled || isBusy}
            title={btn.title}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "6px 8px", borderRadius: 8,
              border: "1px solid " + C.border, background: "#F8FAFC",
              cursor: btn.disabled || isBusy ? "not-allowed" : "pointer",
              fontSize: 13, color: btn.disabled ? C.muted : C.green,
              fontWeight: 600, opacity: btn.disabled || isBusy ? 0.45 : 1,
              transition: "all 0.15s",
            }}>
            <span>{btn.icono}</span>
            <span style={{ fontSize: 10 }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Inputs ocultos */}
      <input ref={fileRef}  type="file" style={{ display: "none" }} onChange={handleFile} multiple />
      <input ref={audioRef} type="file" style={{ display: "none" }} accept="audio/*" onChange={handleFile} />

      {/* Textarea + botón enviar */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={state.inputText}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu consulta ganadera... (Enter para enviar)"
          disabled={isBusy}
          rows={2}
          maxLength={LIMITS.MAX_INPUT_CHARS}
          style={{
            flex: 1, resize: "none", padding: "10px 12px",
            borderRadius: 12, border: "1.5px solid " + C.border,
            fontSize: 13, fontFamily: "inherit", color: C.text,
            background: "#F8FAFC", outline: "none", lineHeight: 1.5,
            transition: "border-color 0.15s",
          }}
          onFocus={e  => e.target.style.borderColor = C.green}
          onBlur={e   => e.target.style.borderColor = C.border}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          title="Enviar (Enter)"
          style={{
            width: 42, height: 42, borderRadius: 12, border: "none",
            background: canSend ? C.green : "#E2E8F0",
            color:      canSend ? "#fff"  : C.muted,
            cursor:     canSend ? "pointer" : "default",
            display:    "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      <p style={{ margin: "5px 0 0", fontSize: 10, color: C.muted, textAlign: "center" }}>
        Shift+Enter para nueva línea · {state.inputText.length}/{LIMITS.MAX_INPUT_CHARS}
      </p>
    </div>
  );
}
