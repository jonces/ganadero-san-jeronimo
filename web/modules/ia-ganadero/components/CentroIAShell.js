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

// ── Especialistas ─────────────────────────────────────────────────────────────
const ESPECIALISTAS = [
  { id: "veterinario",     label: "Veterinario",     icono: "🩺", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", badge: "#DC2626" },
  { id: "nutricionista",   label: "Nutricionista",   icono: "🌾", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", badge: "#D97706" },
  { id: "reproduccion",    label: "Reproducción",    icono: "🐄", color: "#EC4899", bg: "#FDF2F8", border: "#FBCFE8", badge: "#DB2777" },
  { id: "pasturas",        label: "Pasturas",        icono: "🌿", color: "#10A37F", bg: "#F0FDF4", border: "#A7F3D0", badge: "#059669" },
  { id: "infraestructura", label: "Infraestructura", icono: "🏗️", color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", badge: "#4F46E5" },
  { id: "finanzas",        label: "Finanzas",        icono: "💰", color: "#0EA5E9", bg: "#F0F9FF", border: "#BAE6FD", badge: "#0284C7" },
  { id: "administrador",   label: "Administrador",   icono: "📋", color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE", badge: "#7C3AED" },
];

// ── Barra de especialistas ─────────────────────────────────────────────────────
function SpecialistBar({ active, onChange }) {
  const esp = ESPECIALISTAS.find(e => e.id === active) ?? ESPECIALISTAS[0];

  return (
    <div style={{
      borderBottom: `1px solid ${T.border}`,
      background: T.panel,
      padding: "0 20px",
      display: "flex",
      alignItems: "center",
      gap: 6,
      overflowX: "auto",
      flexShrink: 0,
      height: 52,
      scrollbarWidth: "none",
    }}>
      <style>{`.spec-bar::-webkit-scrollbar{display:none}`}</style>

      {/* Etiqueta izquierda */}
      <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", marginRight: 6 }}>
        Especialista:
      </span>

      {ESPECIALISTAS.map(e => {
        const isActive = e.id === active;
        return (
          <button
            key={e.id}
            onClick={() => onChange(e.id)}
            title={e.label}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px",
              borderRadius: 30,
              border: isActive ? `2px solid ${e.badge}` : `1px solid ${T.border}`,
              background: isActive ? e.bg : T.panel,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={e2 => {
              if (!isActive) {
                e2.currentTarget.style.background = e.bg;
                e2.currentTarget.style.borderColor = e.border;
              }
            }}
            onMouseLeave={e2 => {
              if (!isActive) {
                e2.currentTarget.style.background = T.panel;
                e2.currentTarget.style.borderColor = T.border;
              }
            }}
          >
            <span style={{ fontSize: 15 }}>{e.icono}</span>
            <span style={{
              fontSize: 12, fontWeight: isActive ? 700 : 500,
              color: isActive ? e.badge : T.muted,
            }}>{e.label}</span>
            {isActive && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: e.badge, flexShrink: 0,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

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
function CenterPanel({ sidebarCollapsed, onToggleSidebar, specialist }) {
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
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {active ? active.title : "Centro IA Ganadero"}
          </p>
          {/* Badge del especialista activo */}
          {(() => {
            const esp = ESPECIALISTAS.find(e => e.id === specialist);
            if (!esp) return null;
            return (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 10px", borderRadius: 20,
                background: esp.bg, border: `1px solid ${esp.border}`,
                fontSize: 11, fontWeight: 700, color: esp.badge,
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {esp.icono} {esp.label}
              </span>
            );
          })()}
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
              placeholder={recording ? "Grabando audio… escribe o detén la grabación" : `Consulta al ${ESPECIALISTAS.find(e => e.id === specialist)?.label ?? "Especialista"}…`}
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
//  DATOS SIMULADOS — PANEL DERECHO
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_FINCA = {
  nombre:        "Finca San Jerónimo",
  animalesTotal: 34,
  animalesSanos: 31,
  enVenta:        4,
  prenadas:        7,
  pesoPromedio:  "382 kg",
  cajaDisponible:"C$ 84,500",
  ventasMes:     "C$ 126,000",
  gastosMes:     "C$ 38,200",
  hatoStatus:    "bueno",           // "bueno" | "alerta" | "critico"
};

const DEMO_RECOMENDACIONES = [
  {
    id: "r1", prioridad: "alta",
    titulo: "3 vacas sin vacunar",
    detalle: "Las vacas #012, #027 y #031 no tienen vacunación registrada este ciclo.",
    icono: "💉", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
    accion: "Ver animales",
  },
  {
    id: "r2", prioridad: "alta",
    titulo: "Stock crítico: Vacunas",
    detalle: "Solo quedan 2 frascos. El mínimo recomendado es 10.",
    icono: "📦", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
    accion: "Ver inventario",
  },
  {
    id: "r3", prioridad: "media",
    titulo: "Rotación de Potrero 3",
    detalle: "Lleva 18 días en uso. Se recomienda rotar antes de los 21 días.",
    icono: "🌿", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
    accion: "Ver potreros",
  },
  {
    id: "r4", prioridad: "media",
    titulo: "Pesaje pendiente",
    detalle: "12 animales no tienen registro de peso en los últimos 30 días.",
    icono: "⚖️", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
    accion: "Registrar pesaje",
  },
  {
    id: "r5", prioridad: "baja",
    titulo: "Vaca #008 próxima a parir",
    detalle: "Gestación en día 268. Se estima parto en los próximos 7 días.",
    icono: "🤰", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
    accion: "Ver reproducción",
  },
];

const DEMO_ACCIONES = [
  { id: "a1", label: "Registrar venta",    icono: "💰", color: "#10A37F", bg: "#F0FDF4" },
  { id: "a2", label: "Nuevo gasto",        icono: "💸", color: "#EF4444", bg: "#FEF2F2" },
  { id: "a3", label: "Nuevo animal",       icono: "🐄", color: "#0EA5E9", bg: "#F0F9FF" },
  { id: "a4", label: "Registrar evento",   icono: "📋", color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "a5", label: "Generar reporte",    icono: "📊", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "a6", label: "Plan sanitario",     icono: "💉", color: "#EC4899", bg: "#FDF2F8" },
];

const DEMO_DOCS = [
  { id: "d1", nombre: "Reporte mensual julio 2026",  tipo: "PDF",  fecha: "Hoy",         icono: "📄", color: "#EF4444" },
  { id: "d2", nombre: "Inventario de medicamentos",  tipo: "XLSX", fecha: "Ayer",         icono: "📊", color: "#10A37F" },
  { id: "d3", nombre: "Protocolo de vacunación Q3",  tipo: "PDF",  fecha: "Hace 3 días",  icono: "📄", color: "#EF4444" },
  { id: "d4", nombre: "Plan de rotación agosto",     tipo: "DOC",  fecha: "Hace 5 días",  icono: "📝", color: "#0EA5E9" },
  { id: "d5", nombre: "Registro de partos 2026",     tipo: "XLSX", fecha: "Hace 1 semana",icono: "📊", color: "#10A37F" },
];

// ── Subcomponente: mini barra de progreso ─────────────────────────────────────
function MiniBar({ pct, color }) {
  return (
    <div style={{ height: 4, borderRadius: 4, background: "#E5E5E5", overflow: "hidden", marginTop: 4 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ── Subcomponente: encabezado de sección ─────────────────────────────────────
function RSection({ label, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 8px" }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
      {action && (
        <button onClick={onAction} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: T.accent, fontWeight: 700, padding: 0 }}>
          {action} →
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PANEL DERECHO
// ─────────────────────────────────────────────────────────────────────────────
function RightPanel({ collapsed, onToggle }) {
  const [tab, setTab] = useState("finca");  // "finca" | "docs"
  const [recDismissed, setRecDismissed] = useState(new Set());

  const recsVisibles = DEMO_RECOMENDACIONES.filter(r => !recDismissed.has(r.id));
  const altasCount   = recsVisibles.filter(r => r.prioridad === "alta").length;

  const hatoColor  = DEMO_FINCA.hatoStatus === "bueno" ? T.accent : DEMO_FINCA.hatoStatus === "alerta" ? "#D97706" : "#DC2626";
  const hatoLabel  = { bueno: "✅ Buen estado", alerta: "⚠️ Revisar", critico: "🚨 Crítico" }[DEMO_FINCA.hatoStatus];

  return (
    <aside style={{
      width:    collapsed ? 0   : 290,
      minWidth: collapsed ? 0   : 290,
      height:   "100%",
      borderLeft: `1px solid ${T.border}`,
      background: T.bg,
      display:  "flex", flexDirection: "column",
      overflow: "hidden",
      transition: "width 0.25s ease, min-width 0.25s ease",
    }}>

      {/* ── Cabecera ── */}
      <div style={{ height: 54, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0, background: T.panel }}>
        <button onClick={onToggle} style={iconBtn} title="Ocultar panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </button>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: T.text, flex: 1 }}>Mi Finca</p>
        {altasCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#DC2626", padding: "2px 7px", borderRadius: 20 }}>
            {altasCount} alerta{altasCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.panel }}>
        {[
          { id: "finca", label: "Estado" },
          { id: "docs",  label: "Documentos" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "9px 0", border: "none", background: "transparent",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            color: tab === t.id ? T.accent : T.muted,
            borderBottom: tab === t.id ? `2px solid ${T.accent}` : "2px solid transparent",
            transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Contenido scrolleable ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 20px" }}>

        {/* ══════════════ TAB: ESTADO DE LA FINCA ══════════════ */}
        {tab === "finca" && (
          <>
            {/* — Tarjeta estado del hato — */}
            <RSection label="Estado del hato" />
            <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.panel, padding: "14px 14px 12px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: T.text }}>{DEMO_FINCA.nombre}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: hatoColor }}>{hatoLabel}</span>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: hatoColor + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🐄</div>
              </div>

              {/* Métricas del hato en 2×2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Total animales", valor: DEMO_FINCA.animalesTotal, icono: "🐄", color: "#0EA5E9" },
                  { label: "En buen estado", valor: DEMO_FINCA.animalesSanos, icono: "✅", color: T.accent },
                  { label: "En venta",        valor: DEMO_FINCA.enVenta,        icono: "🏷️", color: "#F59E0B" },
                  { label: "Preñadas",         valor: DEMO_FINCA.prenadas,       icono: "🤰", color: "#EC4899" },
                ].map((m, i) => (
                  <div key={i} style={{ padding: "9px 10px", borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
                    <p style={{ margin: "0 0 3px", fontSize: 10, color: T.muted }}>{m.icono} {m.label}</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.valor}</p>
                  </div>
                ))}
              </div>

              {/* Barra salud del hato */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: T.muted }}>Salud general</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: hatoColor }}>
                    {Math.round((DEMO_FINCA.animalesSanos / DEMO_FINCA.animalesTotal) * 100)}%
                  </span>
                </div>
                <MiniBar pct={(DEMO_FINCA.animalesSanos / DEMO_FINCA.animalesTotal) * 100} color={hatoColor} />
              </div>
            </div>

            {/* — Tarjeta financiera — */}
            <RSection label="Resumen financiero" action="Ver finanzas" />
            <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.panel, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Caja disponible", valor: DEMO_FINCA.cajaDisponible, icono: "💵", color: T.accent,    sub: "Saldo actual" },
                { label: "Ventas del mes",  valor: DEMO_FINCA.ventasMes,      icono: "📈", color: "#0EA5E9",   sub: "Agosto 2026" },
                { label: "Gastos del mes",  valor: DEMO_FINCA.gastosMes,      icono: "📉", color: "#EF4444",   sub: "Agosto 2026" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: f.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icono}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{f.label}</p>
                    <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{f.sub}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: f.color, whiteSpace: "nowrap" }}>{f.valor}</p>
                </div>
              ))}
            </div>

            {/* — Recomendaciones IA — */}
            <RSection label={`Recomendaciones (${recsVisibles.length})`} />
            {recsVisibles.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: T.muted }}>
                <p style={{ fontSize: 24, margin: "0 0 6px" }}>🎉</p>
                <p style={{ fontSize: 12, margin: 0 }}>Todo al día — sin pendientes</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recsVisibles.map(r => (
                  <div key={r.id} style={{ borderRadius: 12, border: `1px solid ${r.border}`, background: r.bg, padding: "10px 12px", position: "relative" }}>
                    {/* Cerrar */}
                    <button onClick={() => setRecDismissed(prev => new Set([...prev, r.id]))} style={{
                      position: "absolute", top: 8, right: 8,
                      background: "none", border: "none", cursor: "pointer",
                      color: T.muted, fontSize: 13, lineHeight: 1, padding: 0,
                    }} title="Descartar">✕</button>

                    <div style={{ display: "flex", gap: 9, paddingRight: 16 }}>
                      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{r.icono}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: r.color }}>{r.titulo}</p>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: r.color, padding: "1px 5px", borderRadius: 20, flexShrink: 0, textTransform: "uppercase" }}>
                            {r.prioridad}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 8px", fontSize: 11, color: T.text, lineHeight: 1.5 }}>{r.detalle}</p>
                        <button style={{
                          fontSize: 11, fontWeight: 700, color: r.color,
                          background: "none", border: `1px solid ${r.color}50`,
                          padding: "3px 8px", borderRadius: 6, cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = r.color + "15"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                          {r.accion} →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* — Acciones rápidas — */}
            <RSection label="Acciones rápidas" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {DEMO_ACCIONES.map(a => (
                <button key={a.id} style={{
                  padding: "10px 8px", borderRadius: 11,
                  border: `1px solid ${T.border}`, background: T.panel,
                  cursor: "pointer", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color + "60"; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.panel; e.currentTarget.style.borderColor = T.border; }}>
                  <span style={{ fontSize: 20 }}>{a.icono}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ══════════════ TAB: DOCUMENTOS ══════════════ */}
        {tab === "docs" && (
          <>
            <RSection label="Documentos recientes" action="Ver todos" />

            {/* Barra de búsqueda */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"
                style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Buscar documentos…" style={{
                width: "100%", padding: "7px 10px 7px 26px", borderRadius: 9,
                border: `1px solid ${T.border}`, background: T.panel,
                fontSize: 12, color: T.text, outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e  => e.target.style.borderColor = T.border} />
            </div>

            {/* Filtros de tipo */}
            <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
              {["Todos", "PDF", "XLSX", "DOC"].map(f => (
                <button key={f} style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${T.border}`, background: f === "Todos" ? T.accent : T.panel,
                  color: f === "Todos" ? "#fff" : T.muted, cursor: "pointer",
                }}>{f}</button>
              ))}
            </div>

            {/* Lista de documentos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DEMO_DOCS.map(d => (
                <div key={d.id} style={{
                  padding: "10px 12px", borderRadius: 12,
                  border: `1px solid ${T.border}`, background: T.panel,
                  display: "flex", alignItems: "center", gap: 10,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = "#C0C0C0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.panel; e.currentTarget.style.borderColor = T.border; }}>
                  {/* Ícono tipo */}
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: d.color + "15", border: `1px solid ${d.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                    {d.icono}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombre}</p>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: d.color, background: d.color + "15", padding: "1px 6px", borderRadius: 5 }}>{d.tipo}</span>
                      <span style={{ fontSize: 10, color: T.muted }}>{d.fecha}</span>
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
              ))}
            </div>

            {/* Subir documento */}
            <div style={{ marginTop: 14, padding: "14px", borderRadius: 12, border: `2px dashed ${T.border}`, textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "#F0FDF4"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "transparent"; }}>
              <p style={{ fontSize: 22, margin: "0 0 6px" }}>📤</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text }}>Subir documento</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: T.muted }}>PDF, XLSX, DOC · Máx 10 MB</p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DATOS DE CONSULTAS RÁPIDAS — 9 categorías con subconsultas
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIAS_IA = [
  {
    id: "alimentacion",
    titulo: "Mi vaca no quiere comer",
    icono: "🐄",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    hoverBg: "#FEF3C7",
    descripcion: "Diagnóstico de inapetencia y problemas digestivos",
    sugerencias: [
      "Mi vaca no ha comido en 24 horas",
      "La vaca rechaza el concentrado",
      "Animal con pérdida de peso repentina",
      "Vaca con timpanismo o distensión",
    ],
  },
  {
    id: "mastitis",
    titulo: "Tengo mastitis",
    icono: "🩺",
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
    hoverBg: "#FEE2E2",
    descripcion: "Manejo, tratamiento y prevención de mastitis",
    sugerencias: [
      "Leche con grumos o sangre",
      "Ubre caliente e inflamada",
      "¿Qué antibiótico usar?",
      "¿Cómo hacer el California Mastitis Test?",
    ],
  },
  {
    id: "desparasitacion",
    titulo: "¿Cómo desparasito?",
    icono: "💊",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    hoverBg: "#EDE9FE",
    descripcion: "Protocolos de desparasitación interna y externa",
    sugerencias: [
      "¿Cada cuánto desparasito el hato?",
      "Dosis de ivermectina por peso",
      "Garrapatas resistentes al baño",
      "Desparasitación en vacas preñadas",
    ],
  },
  {
    id: "potreros",
    titulo: "Diseñar potreros",
    icono: "🌿",
    color: "#10A37F",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    hoverBg: "#DCFCE7",
    descripcion: "Rotación, carga animal y manejo de pasturas",
    sugerencias: [
      "Plan de rotación para 40 animales",
      "¿Cuántos potreros necesito?",
      "Carga animal por hectárea",
      "Período de descanso del pasto",
    ],
  },
  {
    id: "vacunacion",
    titulo: "Plan de vacunación",
    icono: "💉",
    color: "#0EA5E9",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    hoverBg: "#E0F2FE",
    descripcion: "Calendario sanitario y protocolos de inmunización",
    sugerencias: [
      "Vacunas obligatorias en Nicaragua",
      "Esquema para terneros recién nacidos",
      "¿Cuándo vacunar contra fiebre aftosa?",
      "Vacunación en época lluviosa",
    ],
  },
  {
    id: "reproduccion",
    titulo: "Reproducción",
    icono: "🤰",
    color: "#EC4899",
    bg: "#FDF2F8",
    border: "#FBCFE8",
    hoverBg: "#FCE7F3",
    descripcion: "Celo, inseminación, gestación y partos",
    sugerencias: [
      "Cómo detectar el celo",
      "Inseminación artificial — pasos",
      "Gestación: ¿qué revisar cada mes?",
      "Vaca con parto difícil o distócico",
    ],
  },
  {
    id: "nutricion",
    titulo: "Nutrición",
    icono: "🌾",
    color: "#F97316",
    bg: "#FFF7ED",
    border: "#FED7AA",
    hoverBg: "#FFEDD5",
    descripcion: "Dietas, suplementación y requerimientos nutricionales",
    sugerencias: [
      "Ración diaria para vaca lechera",
      "Sales minerales: ¿cuánto y cuál?",
      "Suplementación en época seca",
      "Concentrado vs. pasto: balanceo",
    ],
  },
  {
    id: "pasturas",
    titulo: "Pasturas",
    icono: "🌱",
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#86EFAC",
    hoverBg: "#DCFCE7",
    descripcion: "Establecimiento, manejo y mejoramiento de gramíneas",
    sugerencias: [
      "¿Qué pasto sembrar en verano?",
      "Brachiaria vs. Marandú — cuál elegir",
      "Fertilización de pasturas degradadas",
      "Control de maleza en potreros nuevos",
    ],
  },
  {
    id: "medicamentos",
    titulo: "Medicamentos",
    icono: "🔬",
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    hoverBg: "#E0E7FF",
    descripcion: "Dosificación, vías de administración y tiempos de retiro",
    sugerencias: [
      "Dosis de oxitocina en bovinos",
      "¿Qué antiinflamatorio usar?",
      "Tiempo de retiro de antibióticos en leche",
      "Vitaminas inyectables: dosis y frecuencia",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PANTALLA DE BIENVENIDA + CONSULTAS RÁPIDAS
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeScreen({ onPickQuery }) {
  const [expanded, setExpanded] = useState(null);   // id de la tarjeta expandida
  const [busqueda, setBusqueda] = useState("");
  const [filtro,   setFiltro]   = useState("todas"); // "todas" | id de categoría

  const categoriasFiltradas = CATEGORIAS_IA.filter(c => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      c.titulo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      c.sugerencias.some(s => s.toLowerCase().includes(q))
    );
  });

  function handlePick(texto) {
    onPickQuery({ texto, id: Math.random().toString(36).slice(2) });
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 32px 48px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* ── Encabezado ── */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 18px",
            background: `linear-gradient(135deg, ${T.accent}, #1A7F64)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, boxShadow: `0 8px 28px ${T.accent}30`,
          }}>🤖</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 900, color: T.text, letterSpacing: "-0.5px" }}>
            ¿En qué te ayudo hoy?
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
            Selecciona una categoría o escribe tu consulta directamente abajo
          </p>
        </div>

        {/* ── Buscador de consultas ── */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar entre las consultas frecuentes…"
            style={{
              width: "100%", padding: "11px 16px 11px 40px",
              borderRadius: 12, border: `1.5px solid ${T.border}`,
              background: T.bg, fontSize: 14, color: T.text,
              outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
            }}
            onFocus={e  => e.target.style.borderColor = T.accent}
            onBlur={e   => e.target.style.borderColor = T.border}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 16, lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* ── Sin resultados ── */}
        {categoriasFiltradas.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted }}>
            <p style={{ fontSize: 32, margin: "0 0 10px" }}>🔍</p>
            <p style={{ fontSize: 14, margin: 0 }}>Sin resultados para <strong>"{busqueda}"</strong></p>
            <p style={{ fontSize: 12, margin: "6px 0 0" }}>Prueba con otras palabras o escribe directamente en el chat</p>
          </div>
        )}

        {/* ── Grid de categorías ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {categoriasFiltradas.map(cat => {
            const isOpen = expanded === cat.id;
            return (
              <div key={cat.id} style={{
                borderRadius: 14, border: `1.5px solid ${isOpen ? cat.color : cat.border}`,
                background: isOpen ? cat.bg : "#fff",
                overflow: "hidden", transition: "all 0.2s",
                boxShadow: isOpen ? `0 4px 20px ${cat.color}20` : "0 1px 4px rgba(0,0,0,0.05)",
              }}>

                {/* Cabecera de tarjeta */}
                <button
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                  style={{
                    width: "100%", padding: "14px 14px 12px", border: "none",
                    background: "transparent", cursor: "pointer", textAlign: "left",
                  }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: cat.bg, border: `1px solid ${cat.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    }}>{cat.icono}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{cat.titulo}</p>
                      <p style={{ margin: 0, fontSize: 11, color: T.muted, lineHeight: 1.4 }}>{cat.descripcion}</p>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round"
                      style={{ flexShrink: 0, marginTop: 2, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Chip del color de la categoría */}
                  <div style={{ marginTop: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      color: cat.color, background: cat.bg, border: `1px solid ${cat.border}`,
                    }}>
                      {cat.sugerencias.length} consultas →
                    </span>
                  </div>
                </button>

                {/* Subconsultas expandibles */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${cat.border}`, padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                    {cat.sugerencias.map((s, i) => (
                      <button key={i} onClick={() => handlePick(s)} style={{
                        padding: "8px 12px", borderRadius: 9,
                        border: `1px solid transparent`, background: "transparent",
                        cursor: "pointer", textAlign: "left", fontSize: 12,
                        color: T.text, display: "flex", alignItems: "center", gap: 8,
                        transition: "all 0.13s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = cat.hoverBg; e.currentTarget.style.borderColor = cat.border; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        {s}
                      </button>
                    ))}

                    {/* Botón escribir consulta libre */}
                    <button onClick={() => handlePick(cat.titulo)} style={{
                      marginTop: 4, padding: "8px 12px", borderRadius: 9,
                      border: `1.5px dashed ${cat.border}`, background: "transparent",
                      cursor: "pointer", textAlign: "center", fontSize: 11,
                      color: cat.color, fontWeight: 700, transition: "background 0.13s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = cat.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      + Hacer otra pregunta sobre {cat.titulo.toLowerCase()}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Consultas de emergencia rápida ── */}
        <div style={{ marginTop: 28, padding: "16px 20px", borderRadius: 14, background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🚨</span>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#DC2626" }}>Emergencias frecuentes</p>
            <span style={{ fontSize: 11, color: "#991B1B" }}>— Haz clic para consultar de inmediato</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              "Animal caído sin poder levantarse",
              "Vaca con fiebre alta",
              "Diarrea en ternero recién nacido",
              "Parto con complicaciones",
              "Herida profunda o fractura",
              "Intoxicación por planta o químico",
              "Animal con dificultad para respirar",
              "Aborto espontáneo en la manada",
            ].map((q, i) => (
              <button key={i} onClick={() => handlePick(q)} style={{
                padding: "6px 12px", borderRadius: 20,
                border: "1px solid #FECACA", background: "#fff",
                cursor: "pointer", fontSize: 12, color: "#DC2626",
                fontWeight: 600, transition: "all 0.13s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#DC2626"; }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ── Badge estado ── */}
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: T.bg, border: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} />
            IA no conectada · Solo interfaz visual · Las respuestas serán simuladas
          </span>
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
  const [leftOpen,    setLeftOpen]    = useState(true);
  const [rightOpen,   setRightOpen]   = useState(true);
  const [specialist,  setSpecialist]  = useState("veterinario");

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", width: "100%",
      overflow: "hidden", background: T.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Barra de especialistas — anchura completa */}
      <SpecialistBar active={specialist} onChange={setSpecialist} />

      {/* Los tres paneles debajo */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <LeftPanel  collapsed={!leftOpen}  onToggle={() => setLeftOpen(v => !v)} />
        <CenterPanel
          sidebarCollapsed={!leftOpen}
          onToggleSidebar={() => setLeftOpen(v => !v)}
          specialist={specialist}
        />
        <RightPanel collapsed={!rightOpen} onToggle={() => setRightOpen(v => !v)} />

        {/* Botón flotante para abrir panel derecho si está cerrado */}
        {!rightOpen && (
          <button onClick={() => setRightOpen(true)} title="Panel de finca" style={{
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
