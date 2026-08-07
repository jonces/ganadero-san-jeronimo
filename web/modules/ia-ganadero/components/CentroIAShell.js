"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIA }          from "../context/useIA.js";
import { useConversation } from "../hooks/useConversation.js";
import { useProvider }    from "../hooks/useProvider.js";
import { QUICK_QUERIES, SENDER, MESSAGE_STATUS, CONVERSATION_STATUS } from "../constants/index.js";

// ── Paleta ──────────────────────────────────────────────────────────────────
const T = {
  bg:        "#F7F7F8",          // fondo general
  panel:     "#FFFFFF",          // paneles blancos
  sidebar:   "#F0F0F0",          // sidebar izquierdo
  border:    "#E5E5E5",
  text:      "#0D0D0D",
  muted:     "#6E6E80",
  accent:    "#10A37F",          // verde ChatGPT
  accentDim: "#1A7F64",
  userBub:   "#10A37F",
  aiBub:     "#F7F7F8",
  aiBorder:  "#E5E5E5",
  hover:     "#EBEBEB",
  danger:    "#EF4444",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function ts(timestamp) {
  return new Date(timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}
function uuid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─────────────────────────────────────────────────────────────────────────────
//  PANEL IZQUIERDO — Historial de conversaciones
// ─────────────────────────────────────────────────────────────────────────────
// ── Fila individual de conversación ─────────────────────────────────────────
function ConvRow({ conv, isActive, onSelect, onRename, onDelete, onToggleFav }) {
  const [hov,     setHov]     = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(conv.title);
  const [confirm, setConfirm] = useState(false);

  function startEdit(e) { e.stopPropagation(); setDraft(conv.title); setEditing(true); }
  function commitEdit()  { if (draft.trim()) onRename(conv.id, draft.trim()); setEditing(false); }
  function handleKey(e)  { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }

  function handleDelete(e) {
    e.stopPropagation();
    if (confirm) { onDelete(conv.id); }
    else { setConfirm(true); setTimeout(() => setConfirm(false), 3000); }
  }

  const lastMsg = conv.messages?.[conv.messages.length - 1];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirm(false); }}
      onClick={() => !editing && onSelect(conv.id)}
      style={{
        padding: "7px 8px", borderRadius: 8, cursor: "pointer",
        background: isActive ? "#E8E8E8" : hov ? "#EBEBEB" : "transparent",
        display: "flex", alignItems: "flex-start", gap: 8,
        marginBottom: 1, transition: "background 0.1s", position: "relative",
        border: isActive ? `1px solid ${T.border}` : "1px solid transparent",
      }}>

      {/* Estrella favorita */}
      <button
        onClick={e => { e.stopPropagation(); onToggleFav(conv.id); }}
        title={conv.favorite ? "Quitar de favoritas" : "Marcar como favorita"}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontSize: 12, lineHeight: 1, flexShrink: 0, marginTop: 2,
          color: conv.favorite ? "#F59E0B" : "transparent",
          transition: "color 0.15s",
        }}>
        {conv.favorite ? "★" : hov ? <span style={{ color: "#CBD5E1" }}>☆</span> : ""}
      </button>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit} onKeyDown={handleKey}
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", border: `1.5px solid ${T.accent}`, borderRadius: 5, padding: "2px 6px", fontSize: 12, fontWeight: 600, outline: "none", background: "#fff", color: T.text }} />
        ) : (
          <p style={{ margin: 0, fontSize: 13, fontWeight: isActive ? 600 : 400, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
            {conv.title}
          </p>
        )}
        {!editing && lastMsg && (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
            {lastMsg.text?.slice(0, 48) || "…"}
          </p>
        )}
      </div>

      {/* Acciones (hover) */}
      {hov && !editing && (
        <div style={{ display: "flex", gap: 3, flexShrink: 0, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          <button onClick={startEdit} style={microBtn} title="Renombrar">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={handleDelete}
            style={{ ...microBtn, background: confirm ? "#FEF2F2" : undefined, borderColor: confirm ? "#FECACA" : undefined }}
            title={confirm ? "Clic para confirmar" : "Eliminar"}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={confirm ? T.danger : T.muted} strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Panel izquierdo — Historial completo ─────────────────────────────────────
function LeftPanel({ collapsed, onToggle }) {
  const { conversations, activeId, selectConversation,
          newConversation, deleteConversation, renameConversation } = useConversation();
  const { toggleFavorite } = useIA();
  const router = useRouter();

  const [query,       setQuery]       = useState("");
  const [filterMode,  setFilterMode]  = useState("all"); // "all" | "fav"
  const searchRef = useRef(null);

  // Filtrado por búsqueda y modo
  const filtered = conversations.filter(c => {
    if (filterMode === "fav" && !c.favorite) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.messages?.some(m => m.text?.toLowerCase().includes(q))
    );
  });

  // Favoritas siempre arriba, luego el resto agrupado por fecha
  const favoritas  = filtered.filter(c => c.favorite);
  const normales   = filtered.filter(c => !c.favorite);
  const groups     = groupByDate(normales);
  const totalCount = conversations.length;
  const favCount   = conversations.filter(c => c.favorite).length;

  return (
    <aside style={{
      width: collapsed ? 0 : 268,
      minWidth: collapsed ? 0 : 268,
      height: "100%",
      background: T.sidebar,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      transition: "width 0.25s ease, min-width 0.25s ease",
    }}>

      {/* ── Cabecera ── */}
      <div style={{ padding: "14px 12px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
            <span style={{ fontWeight: 800, fontSize: 13, color: T.text }}>Centro IA</span>
          </div>
          <button onClick={onToggle} style={iconBtn} title="Colapsar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
        </div>

        {/* Botón nueva conversación */}
        <button onClick={newConversation} style={{
          width: "100%", padding: "9px 12px", borderRadius: 10,
          border: `1.5px dashed ${T.border}`, background: "transparent",
          color: T.text, fontWeight: 600, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          transition: "all 0.15s", marginBottom: 10,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.borderColor = "#C0C0C0"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.border; }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva conversación
        </button>

        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"
            style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar conversaciones…"
            style={{
              width: "100%", padding: "7px 28px 7px 28px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.panel,
              fontSize: 12, color: T.text, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={e  => e.target.style.borderColor = T.accent}
            onBlur={e   => e.target.style.borderColor = T.border}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
          )}
        </div>

        {/* Filtros Todas / Favoritas */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {[
            { id: "all", label: `Todas (${totalCount})` },
            { id: "fav", label: `★ Favoritas (${favCount})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterMode(f.id)} style={{
              flex: 1, padding: "5px 0", borderRadius: 7, border: "none",
              background: filterMode === f.id ? T.accent : T.panel,
              color:      filterMode === f.id ? "#fff"   : T.muted,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* ── Lista ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 12px" }}>

        {/* Sin resultados */}
        {filtered.length === 0 && (
          <div style={{ padding: "28px 12px", textAlign: "center", color: T.muted }}>
            <p style={{ fontSize: 26, margin: "0 0 8px" }}>{query ? "🔍" : "💬"}</p>
            <p style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              {query ? `Sin resultados para "${query}"` : filterMode === "fav" ? "No tienes favoritas aún.\nHaz clic en ☆ para agregar." : "Aún no tienes conversaciones."}
            </p>
          </div>
        )}

        {/* Favoritas (siempre arriba) */}
        {favoritas.length > 0 && filterMode === "all" && (
          <div>
            <SectionLabel label="⭐ Favoritas" />
            {favoritas.map(c => (
              <ConvRow key={c.id} conv={c} isActive={c.id === activeId}
                onSelect={selectConversation} onRename={renameConversation}
                onDelete={deleteConversation}  onToggleFav={toggleFavorite} />
            ))}
          </div>
        )}

        {/* Favoritas cuando filtro activo */}
        {filterMode === "fav" && favoritas.map(c => (
          <ConvRow key={c.id} conv={c} isActive={c.id === activeId}
            onSelect={selectConversation} onRename={renameConversation}
            onDelete={deleteConversation}  onToggleFav={toggleFavorite} />
        ))}

        {/* Grupos por fecha */}
        {filterMode !== "fav" && groups.map(g => (
          <div key={g.label}>
            <SectionLabel label={g.label} />
            {g.items.map(c => (
              <ConvRow key={c.id} conv={c} isActive={c.id === activeId}
                onSelect={selectConversation} onRename={renameConversation}
                onDelete={deleteConversation}  onToggleFav={toggleFavorite} />
            ))}
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 10px", flexShrink: 0 }}>
        <button onClick={() => router.push("/dashboard")} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent",
          color: T.muted, fontSize: 12, cursor: "pointer", transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = T.hover}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al Dashboard
        </button>
      </div>
    </aside>
  );
}

function SectionLabel({ label }) {
  return (
    <p style={{ margin: "10px 8px 4px", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", userSelect: "none" }}>
      {label}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BARRA DE HERRAMIENTAS DE ADJUNTOS
// ─────────────────────────────────────────────────────────────────────────────

// Íconos SVG inline para cada botón
const TOOL_ICONS = {
  adjuntar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  ),
  imagen: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  camara: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  documento: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
  microfono: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  enviar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
};

// ── Chip de adjunto pendiente ─────────────────────────────────────────────────
function AttachChip({ att, onRemove }) {
  const isImg = att.type === "image";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "4px 10px 4px 6px", borderRadius: 8,
      border: `1px solid ${T.border}`, background: "#F0FDF4",
      maxWidth: 160, position: "relative",
    }}>
      {isImg && att.preview
        ? <img src={att.preview} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />
        : <span style={{ fontSize: 18, flexShrink: 0 }}>{att.icon}</span>
      }
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</p>
        <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{att.size}</p>
      </div>
      <button onClick={() => onRemove(att.id)} style={{
        position: "absolute", top: -5, right: -5,
        width: 16, height: 16, borderRadius: "50%", border: "none",
        background: "#64748B", color: "#fff", fontSize: 9, fontWeight: 900,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
      }}>✕</button>
    </div>
  );
}

// ── Botón de herramienta ──────────────────────────────────────────────────────
function ToolBtn({ icon, label, active: isActive, onClick, accentColor }) {
  const [hov, setHov] = useState(false);
  const col = accentColor || T.accent;
  return (
    <button
      onClick={onClick}
      title={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        padding: "6px 10px", borderRadius: 10,
        border: `1px solid ${isActive || hov ? col : T.border}`,
        background: isActive ? col + "18" : hov ? col + "0D" : "transparent",
        color: isActive || hov ? col : T.muted,
        cursor: "pointer", transition: "all 0.15s", minWidth: 54,
      }}>
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
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "7px 14px", borderRadius: 10,
      background: "#FEF2F2", border: "1px solid #FECACA",
      marginBottom: 8,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", animation: "recPulse 1s infinite" }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</span>
      <span style={{ fontSize: 12, color: "#991B1B", flex: 1 }}>Grabando audio…</span>
      <button onClick={onStop} style={{
        padding: "4px 12px", borderRadius: 7, border: "none",
        background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
      }}>Detener</button>
      <style>{`@keyframes recPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PANEL CENTRAL — Conversación
// ─────────────────────────────────────────────────────────────────────────────
function CenterPanel({ sidebarCollapsed, onToggleSidebar }) {
  const { state, setInput, sendMessage, newConversation } = useIA();
  const { active }           = useConversation();
  const { isBusy, activeConfig } = useProvider();

  const bottomRef  = useRef(null);
  const textRef    = useRef(null);
  const fileImgRef = useRef(null);
  const fileCamRef = useRef(null);
  const fileVidRef = useRef(null);
  const fileDocRef = useRef(null);

  // Adjuntos pendientes (solo UI, sin subir nada)
  const [attachments, setAttachments] = useState([]);
  // Grabación simulada
  const [recording, setRecording] = useState(false);
  // Barra de herramientas expandida
  const [toolsOpen, setToolsOpen] = useState(false);

  const messages  = active?.messages ?? [];
  const hasText   = state.inputText.trim().length > 0;
  const canSend   = (hasText || attachments.length > 0) && !isBusy && !recording;
  const isWelcome = !active || messages.length === 0;
  const charCount = state.inputText.length;

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.text]);

  // Ajusta altura del textarea automáticamente
  function autoResize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) doSend();
    }
  }

  async function doSend() {
    if (!active) newConversation();
    setAttachments([]);
    setToolsOpen(false);
    await sendMessage();
    if (textRef.current) { textRef.current.style.height = "auto"; textRef.current.focus(); }
  }

  function pickQuery(q) {
    setInput(q.texto);
    setTimeout(() => { autoResize(textRef.current); textRef.current?.focus(); }, 0);
  }

  // ── Handlers de archivos ─────────────────────────────────────────────────
  function addFiles(files, defaultIcon, type) {
    const newAtts = Array.from(files).map(f => {
      const isImg = f.type.startsWith("image/");
      return {
        id:      Math.random().toString(36).slice(2),
        name:    f.name.length > 22 ? f.name.slice(0, 19) + "…" : f.name,
        size:    f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + " MB" : Math.round(f.size / 1024) + " KB",
        type:    type || (isImg ? "image" : "file"),
        icon:    defaultIcon,
        preview: isImg ? URL.createObjectURL(f) : null,
      };
    });
    setAttachments(prev => [...prev, ...newAtts]);
    setToolsOpen(false);
  }

  function removeAtt(id) {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }

  function handleMic() {
    if (recording) {
      setRecording(false);
      // Simula adjuntar el audio grabado
      setAttachments(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        name: "audio_grabado.m4a", size: "~0 KB",
        type: "audio", icon: "🎤", preview: null,
      }]);
    } else {
      setRecording(true);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: T.panel }}>

      {/* ── Topbar ── */}
      <div style={{ height: 54, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 10, flexShrink: 0 }}>
        {sidebarCollapsed && (
          <button onClick={onToggleSidebar} style={iconBtn} title="Mostrar historial">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {active ? active.title : "Centro IA Ganadero"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: isBusy ? "#F59E0B" : "#22C55E" }} />
          <span style={{ fontSize: 11, color: T.muted }}>
            {activeConfig?.icon} {activeConfig?.name} · {isBusy ? "Procesando…" : "Listo"}
          </span>
        </div>
      </div>

      {/* ── Área de mensajes ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: isWelcome ? 0 : "28px 0 8px" }}>
        {isWelcome ? (
          <WelcomeScreen onPickQuery={pickQuery} />
        ) : (
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 28px" }}>
            {messages.map(m => <MessageRow key={m.id} message={m} />)}
            {isBusy && <TypingRow icon={activeConfig?.icon} />}
            <div ref={bottomRef} style={{ height: 24 }} />
          </div>
        )}
      </div>

      {/* ── Zona de input ── */}
      <div style={{ flexShrink: 0, padding: "8px 24px 18px", background: T.panel }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Indicador de grabación */}
          {recording && <RecordingPill onStop={handleMic} />}

          {/* Chips de adjuntos */}
          {attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {attachments.map(a => <AttachChip key={a.id} att={a} onRemove={removeAtt} />)}
            </div>
          )}

          {/* Barra de herramientas expandible */}
          {toolsOpen && (
            <div style={{
              display: "flex", gap: 6, flexWrap: "wrap",
              padding: "10px 12px", marginBottom: 8,
              borderRadius: 12, border: `1px solid ${T.border}`,
              background: T.bg, animation: "fadeSlideIn 0.15s ease",
            }}>
              <ToolBtn icon={TOOL_ICONS.imagen}    label="Imagen"    accentColor="#8B5CF6"
                onClick={() => { fileImgRef.current.accept="image/*"; fileImgRef.current.click(); }} />
              <ToolBtn icon={TOOL_ICONS.camara}    label="Cámara"    accentColor="#0EA5E9"
                onClick={() => { fileCamRef.current.click(); }} />
              <ToolBtn icon={TOOL_ICONS.video}     label="Video"     accentColor="#EF4444"
                onClick={() => { fileVidRef.current.click(); }} />
              <ToolBtn icon={TOOL_ICONS.documento} label="Documento" accentColor="#F59E0B"
                onClick={() => { fileDocRef.current.click(); }} />
              <div style={{ width: 1, background: T.border, margin: "0 2px" }} />
              <ToolBtn icon={TOOL_ICONS.microfono} label="Grabar voz" accentColor="#DC2626"
                active={recording} onClick={handleMic} />
              <button onClick={() => setToolsOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, alignSelf: "center" }}>✕</button>
            </div>
          )}

          {/* Inputs ocultos */}
          <input ref={fileImgRef} type="file" accept="image/*"        multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files, "🖼️", "image")}    />
          <input ref={fileCamRef} type="file" accept="image/*"        capture="environment" style={{ display: "none" }} onChange={e => addFiles(e.target.files, "📷", "image")} />
          <input ref={fileVidRef} type="file" accept="video/*"        multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files, "🎬", "video")}    />
          <input ref={fileDocRef} type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.csv" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files, "📄", "file")} />

          {/* Caja principal */}
          <div style={{
            border: `1.5px solid ${T.border}`, borderRadius: 16,
            background: "#FAFAFA", overflow: "hidden",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accent}1A`; }}
          onBlurCapture={e  => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}>

            {/* Textarea */}
            <textarea
              ref={textRef}
              value={state.inputText}
              onChange={e => { setInput(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey}
              placeholder={recording ? "Grabando audio… escribe o detén la grabación" : "Escribe tu consulta ganadera…"}
              disabled={isBusy}
              rows={1}
              style={{
                width: "100%", resize: "none", border: "none", outline: "none",
                padding: "14px 16px 8px", fontSize: 14, fontFamily: "inherit",
                color: T.text, background: "transparent", lineHeight: 1.6,
                boxSizing: "border-box", minHeight: 50, maxHeight: 180,
                overflowY: "auto",
              }}
            />

            {/* Barra inferior del input */}
            <div style={{ display: "flex", alignItems: "center", padding: "6px 10px 10px", gap: 6 }}>

              {/* Botón adjuntar (abre barra de herramientas) */}
              <button
                onClick={() => setToolsOpen(v => !v)}
                title="Adjuntar archivo"
                style={{
                  width: 34, height: 34, borderRadius: 9, border: `1px solid ${toolsOpen ? T.accent : T.border}`,
                  background: toolsOpen ? T.accent + "15" : "transparent",
                  color: toolsOpen ? T.accent : T.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                }}>
                {TOOL_ICONS.adjuntar}
              </button>

              {/* Micrófono */}
              <button
                onClick={handleMic}
                title={recording ? "Detener grabación" : "Grabar audio"}
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  border: `1px solid ${recording ? "#DC2626" : T.border}`,
                  background: recording ? "#FEF2F2" : "transparent",
                  color: recording ? "#DC2626" : T.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                }}>
                {TOOL_ICONS.microfono}
              </button>

              {/* Separador */}
              <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />

              {/* Imagen rápida */}
              <button onClick={() => { fileImgRef.current.accept="image/*"; fileImgRef.current.click(); }} title="Adjuntar imagen"
                style={quickToolBtn(T.muted)}
                onMouseEnter={e => e.currentTarget.style.color = "#8B5CF6"}
                onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                {TOOL_ICONS.imagen}
              </button>

              {/* Cámara rápida */}
              <button onClick={() => fileCamRef.current.click()} title="Tomar foto"
                style={quickToolBtn(T.muted)}
                onMouseEnter={e => e.currentTarget.style.color = "#0EA5E9"}
                onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                {TOOL_ICONS.camara}
              </button>

              {/* Video rápido */}
              <button onClick={() => fileVidRef.current.click()} title="Adjuntar video"
                style={quickToolBtn(T.muted)}
                onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                {TOOL_ICONS.video}
              </button>

              {/* Documento rápido */}
              <button onClick={() => fileDocRef.current.click()} title="Adjuntar documento"
                style={quickToolBtn(T.muted)}
                onMouseEnter={e => e.currentTarget.style.color = "#F59E0B"}
                onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                {TOOL_ICONS.documento}
              </button>

              {/* Contador de caracteres */}
              <span style={{ marginLeft: "auto", fontSize: 11, color: charCount > 3800 ? "#EF4444" : T.muted, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {charCount > 0 ? `${charCount}/4000` : ""}
              </span>

              {/* Botón enviar */}
              <button
                onClick={doSend}
                disabled={!canSend}
                title="Enviar (Enter)"
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none", flexShrink: 0,
                  background: canSend ? T.accent : T.border,
                  color: canSend ? "#fff" : T.muted,
                  cursor: canSend ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                  transform: canSend ? "scale(1)" : "scale(0.95)",
                }}
                onMouseEnter={e => { if (canSend) e.currentTarget.style.background = T.accentDim; }}
                onMouseLeave={e => { if (canSend) e.currentTarget.style.background = T.accent; }}>
                {TOOL_ICONS.enviar}
              </button>
            </div>
          </div>

          {/* Pie */}
          <p style={{ textAlign: "center", fontSize: 10, color: T.muted, margin: "6px 0 0", lineHeight: 1.5 }}>
            Enter para enviar · Shift+Enter nueva línea · IA no conectada — solo interfaz
          </p>
        </div>
      </div>

      {/* Animación barra herramientas */}
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </main>
  );
}

function quickToolBtn(color) {
  return {
    width: 30, height: 30, borderRadius: 7, border: "none",
    background: "transparent", color, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "color 0.15s", flexShrink: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  PANEL DERECHO — Herramientas (reservado)
// ─────────────────────────────────────────────────────────────────────────────
function RightPanel({ collapsed, onToggle }) {
  const [activeTab, setActiveTab] = useState("herramientas");

  const TOOLS_COMING = [
    { icon: "📊", title: "Análisis de datos",    desc: "Gráficos y tendencias del hato generados por IA",   eta: "Q3 2026" },
    { icon: "🔔", title: "Alertas inteligentes", desc: "Detección automática de anomalías en tu finca",      eta: "Q3 2026" },
    { icon: "📋", title: "Generador de informes",desc: "Reportes automáticos basados en tus datos reales",   eta: "Q4 2026" },
    { icon: "🌿", title: "Plan de pastoreo",      desc: "Rotación óptima de potreros con IA",                eta: "Q4 2026" },
    { icon: "💊", title: "Protocolo sanitario",   desc: "Calendario de vacunación y tratamientos inteligente",eta: "Q1 2027" },
    { icon: "💰", title: "Proyección financiera", desc: "Predicción de ingresos y gastos con ML",            eta: "Q1 2027" },
  ];

  return (
    <aside style={{
      width: collapsed ? 0 : 280,
      minWidth: collapsed ? 0 : 280,
      height: "100%",
      borderLeft: `1px solid ${T.border}`,
      background: T.panel,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      transition: "width 0.25s ease, min-width 0.25s ease",
    }}>
      {/* Cabecera */}
      <div style={{ height: 56, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 8, flexShrink: 0 }}>
        <button onClick={onToggle} style={iconBtn} title="Ocultar herramientas">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </button>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: T.text, flex: 1, whiteSpace: "nowrap" }}>Herramientas IA</p>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, background: "#E6F8F4", padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap" }}>Próximamente</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {[
          { id: "herramientas", label: "Herramientas" },
          { id: "contexto",     label: "Contexto" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: "10px 0", border: "none", background: "transparent",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            color: activeTab === tab.id ? T.accent : T.muted,
            borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : "2px solid transparent",
            transition: "all 0.15s",
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>

        {activeTab === "herramientas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
              Las siguientes herramientas se activarán automáticamente al conectar un modelo de IA.
            </p>
            {TOOLS_COMING.map((tool, i) => (
              <div key={i} style={{
                padding: "12px 14px", borderRadius: 12,
                border: `1px solid ${T.border}`, background: T.bg,
                opacity: 0.7,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>{tool.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text }}>{tool.title}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.muted, background: T.border, padding: "1px 6px", borderRadius: 10, whiteSpace: "nowrap", marginLeft: 6 }}>{tool.eta}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{tool.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "contexto" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
              Cuando se conecte la IA, tendrá acceso a los datos de tu finca para generar respuestas precisas.
            </p>
            {[
              { icon: "🐄", label: "Animales",     value: "—",  hint: "Hato activo" },
              { icon: "💰", label: "Finanzas",      value: "—",  hint: "Ventas y gastos" },
              { icon: "🌿", label: "Potreros",      value: "—",  hint: "Estado de pastoreo" },
              { icon: "📅", label: "Actividades",   value: "—",  hint: "Agenda del mes" },
              { icon: "💊", label: "Sanidad",       value: "—",  hint: "Vacunas y tratamientos" },
              { icon: "📦", label: "Inventario",    value: "—",  hint: "Stock de insumos" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, opacity: 0.7 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.text }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{item.hint}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.muted }}>{item.value}</span>
              </div>
            ))}
            <div style={{ padding: "10px 12px", borderRadius: 10, border: `1px dashed ${T.border}`, background: "#FAFAFA", textAlign: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.border, display: "inline-block", margin: "0 2px" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.border, display: "inline-block", margin: "0 2px" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.border, display: "inline-block", margin: "0 2px" }} />
              <p style={{ margin: "8px 0 0", fontSize: 11, color: T.muted }}>Contexto disponible cuando se conecte la IA</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PANTALLA DE BIENVENIDA
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeScreen({ onPickQuery }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
      <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
        {/* Logo grande */}
        <div style={{ width: 72, height: 72, borderRadius: 20, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px", boxShadow: `0 8px 32px ${T.accent}33` }}>🤖</div>
        <h1 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: "-0.5px" }}>
          Centro IA Ganadero
        </h1>
        <p style={{ margin: "0 0 40px", fontSize: 15, color: T.muted, lineHeight: 1.7, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          Tu asistente inteligente para gestión ganadera. Próximamente con inteligencia artificial real conectada a todos tus datos de finca.
        </p>

        {/* Grid de consultas rápidas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, textAlign: "left" }}>
          {QUICK_QUERIES.slice(0, 6).map(q => (
            <button key={q.id} onClick={() => onPickQuery(q)} style={{
              padding: "14px 16px", borderRadius: 14,
              border: `1px solid ${T.border}`, background: T.bg,
              cursor: "pointer", textAlign: "left",
              transition: "all 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#E8F8F4"; e.currentTarget.style.borderColor = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = T.border; }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>{q.icono}</span>
                <p style={{ margin: 0, fontSize: 12, color: T.text, lineHeight: 1.5, fontWeight: 500 }}>{q.texto}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Badge estado */}
        <div style={{ marginTop: 32, display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20, background: T.bg, border: `1px solid ${T.border}` }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B" }} />
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>IA no conectada · Modo interfaz</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FILA DE MENSAJE
// ─────────────────────────────────────────────────────────────────────────────
function MessageRow({ message }) {
  const isUser  = message.sender === SENDER.USER;
  const isError = message.status === MESSAGE_STATUS.ERROR;

  return (
    <div style={{
      display: "flex", gap: 14, marginBottom: 28,
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start",
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: isUser ? T.accent : "#F0F0F0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: isUser ? 15 : 17,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}>
        {isUser ? "👤" : "🤖"}
      </div>

      {/* Burbuja */}
      <div style={{ maxWidth: "80%", minWidth: 40 }}>
        <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: T.muted, textAlign: isUser ? "right" : "left" }}>
          {isUser ? "Tú" : "IA Ganadero"} · {ts(message.timestamp)}
        </p>
        <div style={{
          padding: "12px 16px", lineHeight: 1.65, fontSize: 14,
          borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
          background:   isError ? "#FEF2F2" : isUser ? T.accent : T.aiBub,
          border:       isError ? `1px solid #FECACA` : isUser ? "none" : `1px solid ${T.aiBorder}`,
          color:        isError ? T.danger : isUser ? "#fff" : T.text,
          wordBreak:    "break-word", whiteSpace: "pre-wrap",
          boxShadow:    isUser ? `0 2px 8px ${T.accent}22` : "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {isError ? "Error al procesar la respuesta." : (message.text || "…")}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  INDICADOR "ESCRIBIENDO"
// ─────────────────────────────────────────────────────────────────────────────
function TypingRow({ icon }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 28, alignItems: "flex-start" }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
        {icon ?? "🤖"}
      </div>
      <div>
        <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: T.muted }}>IA Ganadero</p>
        <div style={{ padding: "12px 18px", borderRadius: "4px 18px 18px 18px", background: T.aiBub, border: `1px solid ${T.aiBorder}`, display: "flex", gap: 5, alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.muted, animation: `iaDot 1.3s ease-in-out ${i * 0.18}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes iaDot{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SHELL PRINCIPAL — tres paneles
// ─────────────────────────────────────────────────────────────────────────────
export function CentroIAShell() {
  const [leftOpen,  setLeftOpen]  = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100%",
      overflow: "hidden", background: T.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <LeftPanel  collapsed={!leftOpen}  onToggle={() => setLeftOpen(v => !v)} />
      <CenterPanel
        sidebarCollapsed={!leftOpen}
        onToggleSidebar={() => setLeftOpen(v => !v)}
      />
      <RightPanel collapsed={!rightOpen} onToggle={() => setRightOpen(v => !v)} />

      {/* Botón flotante para abrir panel derecho si está cerrado */}
      {!rightOpen && (
        <button onClick={() => setRightOpen(true)} title="Herramientas IA" style={{
          position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)",
          width: 20, height: 60, borderRadius: "8px 0 0 8px",
          border: `1px solid ${T.border}`, borderRight: "none",
          background: T.panel, cursor: "pointer", color: T.muted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, zIndex: 10,
        }}>
          ‹
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────
const iconBtn = {
  width: 30, height: 30, borderRadius: 8, border: "none",
  background: "transparent", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.15s", flexShrink: 0,
};

const microBtn = {
  width: 22, height: 22, borderRadius: 5, border: `1px solid ${T.border}`,
  background: T.panel, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: T.muted, flexShrink: 0,
};

function groupByDate(conversations) {
  const groups = [];
  const today  = new Date(); today.setHours(0,0,0,0);
  const yest   = new Date(today); yest.setDate(yest.getDate() - 1);
  const week   = new Date(today); week.setDate(week.getDate() - 7);

  const hoy = [], ayer = [], estaSem = [], antes = [];
  for (const c of conversations) {
    const d = new Date(c.updatedAt); d.setHours(0,0,0,0);
    if (d >= today)     hoy.push(c);
    else if (d >= yest) ayer.push(c);
    else if (d >= week) estaSem.push(c);
    else                antes.push(c);
  }
  if (hoy.length)     groups.push({ label: "Hoy",             items: hoy });
  if (ayer.length)    groups.push({ label: "Ayer",            items: ayer });
  if (estaSem.length) groups.push({ label: "Esta semana",     items: estaSem });
  if (antes.length)   groups.push({ label: "Anteriores",      items: antes });
  return groups;
}
