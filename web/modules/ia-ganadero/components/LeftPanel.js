"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { T } from "../constants/theme.js";
import { groupByDate } from "../utils/date.js";
import { useConversation } from "../hooks/useConversation.js";
import { useIA } from "../context/useIA.js";
import { SearchInput } from "./ui/SearchInput.js";
import { SectionLabel } from "./ui/SectionLabel.js";
import { IconButton, MicroButton } from "./ui/IconButton.js";

// ── Fila individual de conversación ──────────────────────────────────────────
function ConvRow({ conv, isActive, onSelect, onRename, onDelete, onToggleFav }) {
  const [hov,     setHov]     = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(conv.title);
  const [confirm, setConfirm] = useState(false);

  const startEdit   = useCallback((e) => { e.stopPropagation(); setDraft(conv.title); setEditing(true); }, [conv.title]);
  const commitEdit  = useCallback(() => { if (draft.trim()) onRename(conv.id, draft.trim()); setEditing(false); }, [draft, conv.id, onRename]);
  const handleKey   = useCallback((e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }, [commitEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    if (confirm) { onDelete(conv.id); }
    else { setConfirm(true); setTimeout(() => setConfirm(false), 3000); }
  }, [confirm, conv.id, onDelete]);

  const lastMsg = conv.messages?.[conv.messages.length - 1];

  return (
    <div
      role="option"
      aria-selected={isActive}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirm(false); }}
      onClick={() => !editing && onSelect(conv.id)}
      style={{
        padding: "7px 8px", borderRadius: 8, cursor: "pointer",
        background: isActive ? T.hover : hov ? T.hover : "transparent",
        display: "flex", alignItems: "flex-start", gap: 8,
        marginBottom: 1, transition: "background 0.1s", position: "relative",
        border: isActive ? `1px solid ${T.border}` : "1px solid transparent",
      }}
    >
      {/* Estrella favorita */}
      <button
        onClick={e => { e.stopPropagation(); onToggleFav(conv.id); }}
        aria-label={conv.favorite ? "Quitar de favoritas" : "Marcar como favorita"}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, lineHeight: 1, flexShrink: 0, marginTop: 2, color: conv.favorite ? "#F59E0B" : "transparent", transition: "color 0.15s" }}
      >
        {conv.favorite ? "★" : hov ? <span style={{ color: T.border }}>☆</span> : ""}
      </button>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKey}
            onClick={e => e.stopPropagation()}
            aria-label="Renombrar conversación"
            style={{ width: "100%", border: `1.5px solid ${T.accent}`, borderRadius: 5, padding: "2px 6px", fontSize: 12, fontWeight: 600, outline: "none", background: T.panel, color: T.text }}
          />
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
          <MicroButton onClick={startEdit} title="Renombrar">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </MicroButton>
          <MicroButton
            onClick={handleDelete}
            title={confirm ? "Clic para confirmar eliminación" : "Eliminar"}
            danger={confirm}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={confirm ? T.danger : T.muted} strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </MicroButton>
        </div>
      )}
    </div>
  );
}

// ── Panel izquierdo ───────────────────────────────────────────────────────────
/**
 * @param {{ collapsed: boolean, onToggle: () => void }} props
 */
export function LeftPanel({ collapsed, onToggle }) {
  const { conversations, activeId, selectConversation, newConversation, deleteConversation, renameConversation } = useConversation();
  const { toggleFavorite } = useIA();
  const router = useRouter();

  const [query,      setQuery]      = useState("");
  const [filterMode, setFilterMode] = useState("all");

  const filtered = conversations.filter(c => {
    if (filterMode === "fav" && !c.favorite) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.messages?.some(m => m.text?.toLowerCase().includes(q));
  });

  const favoritas  = filtered.filter(c => c.favorite);
  const normales   = filtered.filter(c => !c.favorite);
  const groups     = groupByDate(normales);
  const totalCount = conversations.length;
  const favCount   = conversations.filter(c => c.favorite).length;

  return (
    <aside
      data-ia-left-panel
      aria-label="Historial de conversaciones"
      style={{
        width: collapsed ? 0 : 268, minWidth: collapsed ? 0 : 268,
        height: "100%",
        background: T.sidebar,
        borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease",
      }}
    >
      {/* Cabecera */}
      <div style={{ padding: "14px 12px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 7, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
            <span style={{ fontWeight: 800, fontSize: 13, color: T.text }}>Centro IA</span>
          </div>
          <IconButton onClick={onToggle} title="Colapsar historial">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </IconButton>
        </div>

        {/* Nueva conversación */}
        <button
          onClick={newConversation}
          aria-label="Nueva conversación"
          style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px dashed ${T.border}`, background: "transparent", color: T.text, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s", marginBottom: 10, fontFamily: "inherit" }}
          onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.borderColor = T.muted; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.border; }}
        >
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva conversación
        </button>

        {/* Buscador */}
        <div style={{ marginBottom: 8 }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar conversaciones…" />
        </div>

        {/* Filtros */}
        <div role="group" aria-label="Filtrar conversaciones" style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {[
            { id: "all", label: `Todas (${totalCount})` },
            { id: "fav", label: `★ Favoritas (${favCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              aria-pressed={filterMode === f.id}
              style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: "none", background: filterMode === f.id ? T.accent : T.panel, color: filterMode === f.id ? "#fff" : T.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div
        role="listbox"
        aria-label="Conversaciones"
        style={{ flex: 1, overflowY: "auto", padding: "0 6px 12px" }}
      >
        {filtered.length === 0 && (
          <div role="status" style={{ padding: "28px 12px", textAlign: "center", color: T.muted }}>
            <p aria-hidden="true" style={{ fontSize: 26, margin: "0 0 8px" }}>{query ? "🔍" : "💬"}</p>
            <p style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              {query ? `Sin resultados para "${query}"` : filterMode === "fav" ? "No tienes favoritas aún." : "Aún no tienes conversaciones."}
            </p>
          </div>
        )}

        {favoritas.length > 0 && filterMode === "all" && (
          <div>
            <SectionLabel label="⭐ Favoritas" />
            {favoritas.map(c => (
              <ConvRow key={c.id} conv={c} isActive={c.id === activeId} onSelect={selectConversation} onRename={renameConversation} onDelete={deleteConversation} onToggleFav={toggleFavorite} />
            ))}
          </div>
        )}

        {filterMode === "fav" && favoritas.map(c => (
          <ConvRow key={c.id} conv={c} isActive={c.id === activeId} onSelect={selectConversation} onRename={renameConversation} onDelete={deleteConversation} onToggleFav={toggleFavorite} />
        ))}

        {filterMode !== "fav" && groups.map(g => (
          <div key={g.label}>
            <SectionLabel label={g.label} />
            {g.items.map(c => (
              <ConvRow key={c.id} conv={c} isActive={c.id === activeId} onSelect={selectConversation} onRename={renameConversation} onDelete={deleteConversation} onToggleFav={toggleFavorite} />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 10px", flexShrink: 0 }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", transition: "background 0.15s", fontFamily: "inherit" }}
          onMouseEnter={e => e.currentTarget.style.background = T.hover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver al Dashboard
        </button>
      </div>
    </aside>
  );
}
