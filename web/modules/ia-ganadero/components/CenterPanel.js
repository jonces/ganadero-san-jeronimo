"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { T } from "../constants/theme.js";
import { uid } from "../utils/id.js";
import { getEspecialista } from "../constants/specialists.js";
import { useIA } from "../context/useIA.js";
import { useConversation } from "../hooks/useConversation.js";
import { useProvider } from "../hooks/useProvider.js";
import { useFileUpload } from "../hooks/useFileUpload.js";
import { FilePreviewGrid } from "./FilePreviewGrid.js";
import { IconButton } from "./ui/IconButton.js";
import { MessageRow } from "./MessageRow.js";
import { TypingRow } from "./TypingRow.js";
import { WelcomeScreen } from "./WelcomeScreen.js";

// ── Íconos SVG (memo para evitar re-render innecesario) ───────────────────────
const ICONS = {
  adjuntar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  imagen:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  camara:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  video:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  doc:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  mic:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  send:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
};

// ── Chip de adjunto ───────────────────────────────────────────────────────────
function AttachChip({ att, onRemove }) {
  const isImg = att.type === "image";
  return (
    <div
      role="listitem"
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 6px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#F0FDF4", maxWidth: 160, position: "relative" }}
    >
      {isImg && att.preview
        ? <img src={att.preview} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />
        : <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>{att.icon}</span>
      }
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</p>
        <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{att.size}</p>
      </div>
      <button
        onClick={() => onRemove(att.id)}
        aria-label={`Quitar adjunto ${att.name}`}
        style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", border: "none", background: "#64748B", color: "#fff", fontSize: 9, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
      >✕</button>
    </div>
  );
}

// ── Botón de herramienta expandido ───────────────────────────────────────────
function ToolBtn({ icon, label, active: isActive, onClick, accentColor }) {
  const [hov, setHov] = useState(false);
  const col = accentColor || T.accent;
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 10px", borderRadius: 10, border: `1px solid ${isActive || hov ? col : T.border}`, background: isActive ? col + "18" : hov ? col + "0D" : "transparent", color: isActive || hov ? col : T.muted, cursor: "pointer", transition: "all 0.15s", minWidth: 54, fontFamily: "inherit" }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

// ── Indicador de grabación ────────────────────────────────────────────────────
function RecordingPill({ onStop }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <div role="status" aria-live="assertive" aria-label={`Grabando: ${mm}:${ss}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 8 }}>
      <div aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", animation: "ia-rec-pulse 1s infinite" }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</span>
      <span style={{ fontSize: 12, color: "#991B1B", flex: 1 }}>Grabando audio…</span>
      <button onClick={onStop} style={{ padding: "4px 12px", borderRadius: 7, border: "none", background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        Detener
      </button>
    </div>
  );
}

// ── Panel central ─────────────────────────────────────────────────────────────
/**
 * @param {{ sidebarCollapsed: boolean, onToggleSidebar: () => void, specialist: string }} props
 */
export function CenterPanel({ sidebarCollapsed, onToggleSidebar, specialist }) {
  const { state, setInput, sendMessage, newConversation, isConnected } = useIA();
  const { active }              = useConversation();
  const { isBusy, activeConfig } = useProvider();

  const bottomRef  = useRef(null);
  const textRef    = useRef(null);
  const fileImgRef = useRef(null);
  const fileCamRef = useRef(null);
  const fileVidRef = useRef(null);
  const fileDocRef = useRef(null);

  const { files, addFiles, removeFile, clearAll: clearFiles, readyFiles, hasFiles } = useFileUpload();

  const [showFiles,   setShowFiles]   = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [recording,   setRecording]   = useState(false);
  const [toolsOpen,   setToolsOpen]   = useState(false);

  const messages  = useMemo(() => active?.messages ?? [], [active?.messages]);
  const hasText   = state.inputText.trim().length > 0;
  const canSend   = (hasText || attachments.length > 0 || readyFiles.length > 0) && !isBusy && !recording;
  const isWelcome = !active || messages.length === 0;
  const charCount = state.inputText.length;
  const esp       = useMemo(() => getEspecialista(specialist), [specialist]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const autoResize = useCallback((el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, []);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (canSend) doSend(); }
  }, [canSend]);

  const doSend = useCallback(async () => {
    if (!active) newConversation();
    setAttachments([]);
    setToolsOpen(false);
    await sendMessage();
    if (textRef.current) { textRef.current.style.height = "auto"; textRef.current.focus(); }
  }, [active, newConversation, sendMessage]);

  const pickQuery = useCallback((q) => {
    setInput(q.texto);
    setTimeout(() => { autoResize(textRef.current); textRef.current?.focus(); }, 0);
  }, [setInput, autoResize]);

  // Adjuntos legacy (chips en la barra de input — sin FilePreviewGrid)
  const addLegacyAttachments = useCallback((rawFiles, defaultIcon, type) => {
    const newAtts = Array.from(rawFiles).map(f => ({
      id:      uid(),
      name:    f.name.length > 22 ? f.name.slice(0, 19) + "…" : f.name,
      size:    f.size > 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : Math.round(f.size / 1024) + " KB",
      type:    type || (f.type.startsWith("image/") ? "image" : "file"),
      icon:    defaultIcon,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setAttachments(prev => [...prev, ...newAtts]);
    setToolsOpen(false);
  }, []);

  const removeAtt = useCallback((id) => setAttachments(prev => prev.filter(a => a.id !== id)), []);

  const handleMic = useCallback(() => {
    if (recording) {
      setRecording(false);
      setAttachments(prev => [...prev, { id: uid(), name: "audio_grabado.m4a", size: "~0 KB", type: "audio", icon: "🎤", preview: null }]);
    } else {
      setRecording(true);
    }
  }, [recording]);

  // Drag & drop
  const onDragEnter  = useCallback((e) => { e.preventDefault(); setDragOver(true); setShowFiles(true); }, []);
  const onDragOver   = useCallback((e) => e.preventDefault(), []);
  const onDragLeave  = useCallback((e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }, []);
  const onDrop       = useCallback((e) => { e.preventDefault(); setDragOver(false); }, []);

  const quickBtn = { width: 30, height: 30, borderRadius: 7, border: "none", background: "transparent", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s", flexShrink: 0 };

  return (
    <main
      aria-label="Panel de conversación"
      style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: T.panel, position: "relative" }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Topbar */}
      <div style={{ height: 54, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 10, flexShrink: 0 }}>
        {sidebarCollapsed && (
          <IconButton onClick={onToggleSidebar} title="Mostrar historial">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </IconButton>
        )}
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {active ? active.title : "Centro IA Ganadero"}
          </p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: esp.bg, border: `1px solid ${esp.border}`, fontSize: 11, fontWeight: 700, color: esp.badge, whiteSpace: "nowrap", flexShrink: 0 }}>
            <span aria-hidden="true">{esp.icono}</span> {esp.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Botón archivos */}
          <button
            onClick={() => setShowFiles(v => !v)}
            title={showFiles ? "Ocultar archivos" : "Archivos adjuntos"}
            aria-label={showFiles ? "Ocultar panel de archivos" : "Abrir panel de archivos"}
            aria-expanded={showFiles}
            style={{ ...{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }, background: showFiles ? "#F0FDF4" : "transparent", color: showFiles ? T.accent : T.muted, position: "relative" }}
          >
            {ICONS.adjuntar}
            {hasFiles && (
              <span aria-label={`${files.length} archivos`} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.accent, color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {files.length > 9 ? "9+" : files.length}
              </span>
            )}
          </button>
          <div aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: isBusy ? "#F59E0B" : "#22C55E" }} />
          <span style={{ fontSize: 11, color: T.muted }}>
            <span aria-hidden="true">{activeConfig?.icon}</span> {activeConfig?.name} · {isBusy ? "Procesando…" : "Listo"}
          </span>
        </div>
      </div>

      {/* Panel de archivos */}
      {showFiles && (
        <div style={{ borderBottom: `1px solid ${T.border}`, background: T.panel, padding: "16px 24px", maxHeight: 420, overflowY: "auto", flexShrink: 0, outline: dragOver ? `2px dashed ${T.accent}` : "none", outlineOffset: "-4px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.text }}>📎 Archivos adjuntos</p>
            <button onClick={() => setShowFiles(false)} aria-label="Cerrar panel de archivos" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.muted, padding: 0, fontFamily: "inherit" }}>✕ Cerrar</button>
          </div>
          <FilePreviewGrid items={files} onAdd={addFiles} onRemove={removeFile} onClearAll={clearFiles} showZone />
        </div>
      )}

      {/* Área de mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: isWelcome ? 0 : "28px 0 8px" }}>
        {isWelcome ? (
          <WelcomeScreen onPickQuery={pickQuery} />
        ) : (
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 28px" }}>
            {messages.map(m => <MessageRow key={m.id} message={m} />)}
            {isBusy && <TypingRow icon={activeConfig?.icon} />}
            <div ref={bottomRef} style={{ height: 24 }} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Zona de input */}
      <div style={{ flexShrink: 0, padding: "8px 24px 18px", background: T.panel }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {recording && <RecordingPill onStop={handleMic} />}

          {attachments.length > 0 && (
            <div role="list" aria-label="Adjuntos pendientes" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {attachments.map(a => <AttachChip key={a.id} att={a} onRemove={removeAtt} />)}
            </div>
          )}

          {toolsOpen && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "10px 12px", marginBottom: 8, borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, animation: "ia-slide-up 0.15s ease" }}>
              <ToolBtn icon={ICONS.imagen} label="Imagen"     accentColor="#8B5CF6" onClick={() => { fileImgRef.current.accept="image/*"; fileImgRef.current.click(); }} />
              <ToolBtn icon={ICONS.camara} label="Cámara"     accentColor="#0EA5E9" onClick={() => fileCamRef.current.click()} />
              <ToolBtn icon={ICONS.video}  label="Video"      accentColor="#EF4444" onClick={() => fileVidRef.current.click()} />
              <ToolBtn icon={ICONS.doc}    label="Documento"  accentColor="#F59E0B" onClick={() => fileDocRef.current.click()} />
              <div aria-hidden="true" style={{ width: 1, background: T.border, margin: "0 2px" }} />
              <ToolBtn icon={ICONS.mic}    label="Grabar voz" accentColor="#DC2626" active={recording} onClick={handleMic} />
              <button onClick={() => setToolsOpen(false)} aria-label="Cerrar herramientas" style={{ marginLeft: "auto", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, alignSelf: "center" }}>✕</button>
            </div>
          )}

          {/* Inputs ocultos */}
          <input ref={fileImgRef} type="file" accept="image/*"                        multiple style={{ display: "none" }} onChange={e => addLegacyAttachments(e.target.files, "🖼️", "image")} aria-hidden="true" tabIndex={-1} />
          <input ref={fileCamRef} type="file" accept="image/*" capture="environment"  style={{ display: "none" }} onChange={e => addLegacyAttachments(e.target.files, "📷", "image")} aria-hidden="true" tabIndex={-1} />
          <input ref={fileVidRef} type="file" accept="video/*"                        multiple style={{ display: "none" }} onChange={e => addLegacyAttachments(e.target.files, "🎬", "video")} aria-hidden="true" tabIndex={-1} />
          <input ref={fileDocRef} type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.csv" multiple style={{ display: "none" }} onChange={e => addLegacyAttachments(e.target.files, "📄", "file")} aria-hidden="true" tabIndex={-1} />

          {/* Caja de texto */}
          <div
            style={{ border: `1.5px solid ${T.border}`, borderRadius: 16, background: T.bg, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", transition: "border-color 0.2s, box-shadow 0.2s" }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,163,127,0.1)"; }}
            onBlurCapture={e  => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}
          >
            <textarea
              ref={textRef}
              value={state.inputText}
              onChange={e => { setInput(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey}
              placeholder={recording ? "Grabando audio…" : `Consulta al ${esp.label}…`}
              disabled={isBusy}
              rows={1}
              aria-label={`Consulta al ${esp.label}`}
              aria-multiline="true"
              style={{ width: "100%", resize: "none", border: "none", outline: "none", padding: "14px 16px 8px", fontSize: 14, fontFamily: "inherit", color: T.text, background: "transparent", lineHeight: 1.6, boxSizing: "border-box", minHeight: 50, maxHeight: 180, overflowY: "auto" }}
            />
            <div style={{ display: "flex", alignItems: "center", padding: "6px 10px 10px", gap: 6 }}>
              {/* Adjuntar */}
              <button
                onClick={() => setShowFiles(v => !v)}
                title="Adjuntar archivo"
                aria-label="Adjuntar archivo"
                style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${(showFiles || hasFiles) ? T.accent : T.border}`, background: (showFiles || hasFiles) ? T.accent + "15" : "transparent", color: (showFiles || hasFiles) ? T.accent : T.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", flexShrink: 0, position: "relative" }}
              >
                {ICONS.adjuntar}
                {hasFiles && (
                  <span aria-hidden="true" style={{ position: "absolute", top: -5, right: -5, width: 15, height: 15, borderRadius: "50%", background: T.accent, color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {files.length > 9 ? "9+" : files.length}
                  </span>
                )}
              </button>

              {/* Micrófono */}
              <button
                onClick={handleMic}
                title={recording ? "Detener grabación" : "Grabar audio"}
                aria-label={recording ? "Detener grabación" : "Grabar audio"}
                aria-pressed={recording}
                style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${recording ? "#DC2626" : T.border}`, background: recording ? "#FEF2F2" : "transparent", color: recording ? "#DC2626" : T.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
              >
                {ICONS.mic}
              </button>

              <div aria-hidden="true" style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />

              {/* Imagen rápida */}
              <button onClick={() => { fileImgRef.current.accept="image/*"; fileImgRef.current.click(); }} title="Adjuntar imagen" aria-label="Adjuntar imagen" style={quickBtn} onMouseEnter={e => e.currentTarget.style.color="#8B5CF6"} onMouseLeave={e => e.currentTarget.style.color=T.muted}>{ICONS.imagen}</button>
              <button onClick={() => fileCamRef.current.click()} title="Tomar foto" aria-label="Tomar foto" style={quickBtn} onMouseEnter={e => e.currentTarget.style.color="#0EA5E9"} onMouseLeave={e => e.currentTarget.style.color=T.muted}>{ICONS.camara}</button>
              <button onClick={() => fileVidRef.current.click()} title="Adjuntar video" aria-label="Adjuntar video" style={quickBtn} onMouseEnter={e => e.currentTarget.style.color="#EF4444"} onMouseLeave={e => e.currentTarget.style.color=T.muted}>{ICONS.video}</button>
              <button onClick={() => fileDocRef.current.click()} title="Adjuntar documento" aria-label="Adjuntar documento" style={quickBtn} onMouseEnter={e => e.currentTarget.style.color="#F59E0B"} onMouseLeave={e => e.currentTarget.style.color=T.muted}>{ICONS.doc}</button>

              {/* Contador */}
              <span aria-live="polite" style={{ marginLeft: "auto", fontSize: 11, color: charCount > 3800 ? T.danger : T.muted, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {charCount > 0 ? `${charCount}/4000` : ""}
              </span>

              {/* Enviar */}
              <button
                onClick={doSend}
                disabled={!canSend}
                title="Enviar (Enter)"
                aria-label="Enviar mensaje"
                style={{ width: 36, height: 36, borderRadius: 10, border: "none", flexShrink: 0, background: canSend ? T.accent : T.border, color: canSend ? "#fff" : T.muted, cursor: canSend ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", transform: canSend ? "scale(1)" : "scale(0.95)" }}
                onMouseEnter={e => { if (canSend) e.currentTarget.style.background = T.accentDim; }}
                onMouseLeave={e => { if (canSend) e.currentTarget.style.background = T.accent; }}
              >
                {ICONS.send}
              </button>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: 10, color: T.muted, margin: "6px 0 0", lineHeight: 1.5 }}>
            Enter para enviar · Shift+Enter nueva línea · {isConnected ? "IA conectada — GPT-4o" : "IA no conectada — solo interfaz"}
          </p>
        </div>
      </div>
    </main>
  );
}
