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
//  PANEL CENTRAL — Conversación
// ─────────────────────────────────────────────────────────────────────────────
function CenterPanel({ sidebarCollapsed, onToggleSidebar }) {
  const { state, setInput, sendMessage, newConversation } = useIA();
  const { active, conversations }    = useConversation();
  const { isBusy, activeConfig }     = useProvider();
  const bottomRef = useRef(null);
  const textRef   = useRef(null);

  const messages    = active?.messages ?? [];
  const canSend     = state.inputText.trim().length > 0 && !isBusy;
  const isWelcome   = !active || messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.text]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) doSend();
    }
  }
  async function doSend() {
    if (!active) newConversation();
    await sendMessage();
    textRef.current?.focus();
  }
  function pickQuery(q) {
    setInput(q.texto);
    textRef.current?.focus();
  }

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: T.panel }}>

      {/* ── Topbar del panel central ── */}
      <div style={{
        height: 56, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0,
      }}>
        {sidebarCollapsed && (
          <button onClick={onToggleSidebar} style={iconBtn} title="Mostrar panel">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
            {active ? active.title : "Centro IA Ganadero"}
          </span>
          <span style={{ fontSize: 11, color: T.muted, padding: "2px 8px", borderRadius: 20, background: T.bg, border: `1px solid ${T.border}` }}>
            {activeConfig?.icon} {activeConfig?.name}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: isBusy ? "#F59E0B" : T.accent }} />
          <span style={{ fontSize: 11, color: T.muted }}>{isBusy ? "Procesando…" : "Listo"}</span>
        </div>
      </div>

      {/* ── Área de mensajes ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: isWelcome ? "0" : "24px 0" }}>
        {isWelcome ? (
          <WelcomeScreen onPickQuery={pickQuery} />
        ) : (
          <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 24px" }}>
            {messages.map(m => <MessageRow key={m.id} message={m} />)}
            {isBusy && <TypingRow icon={activeConfig?.icon} />}
            <div ref={bottomRef} style={{ height: 32 }} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div style={{ flexShrink: 0, padding: "12px 24px 20px", background: T.panel }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{
            border: `1.5px solid ${T.border}`, borderRadius: 16,
            background: "#FAFAFA", overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accent}18`; }}
          onBlurCapture={e  => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}>
            <textarea
              ref={textRef}
              value={state.inputText}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu consulta ganadera…"
              disabled={isBusy}
              rows={3}
              style={{
                width: "100%", resize: "none", border: "none", outline: "none",
                padding: "14px 16px 6px", fontSize: 14, fontFamily: "inherit",
                color: T.text, background: "transparent", lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px 10px" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { icon: "📎", label: "Adjuntar",    title: "Adjuntar archivo (próximamente)" },
                  { icon: "📷", label: "Fotografía",  title: "Enviar imagen (próximamente)" },
                  { icon: "🎤", label: "Voz",         title: "Entrada de voz (próximamente)" },
                ].map(b => (
                  <button key={b.label} title={b.title} disabled style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 8px", borderRadius: 7, border: `1px solid ${T.border}`,
                    background: "transparent", color: T.muted, fontSize: 12, cursor: "not-allowed",
                    opacity: 0.55,
                  }}>
                    <span style={{ fontSize: 13 }}>{b.icon}</span> {b.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: T.muted }}>{state.inputText.length}/4000</span>
                <button onClick={doSend} disabled={!canSend} title="Enviar (Enter)" style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: canSend ? T.accent : T.border,
                  color: canSend ? "#fff" : T.muted,
                  cursor: canSend ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: T.muted, margin: "8px 0 0" }}>
            IA no conectada · Solo interfaz · Enter para enviar · Shift+Enter nueva línea
          </p>
        </div>
      </div>
    </main>
  );
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
