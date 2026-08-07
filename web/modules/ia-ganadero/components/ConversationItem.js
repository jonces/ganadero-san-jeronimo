"use client";
import { useState } from "react";

const C = { green: "#16a34a", border: "#E2E8F0", text: "#1E293B", muted: "#94A3B8", red: "#DC2626" };

export function ConversationItem({ conv, isActive, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(conv.title);
  const [hov,     setHov]     = useState(false);

  function commitRename() {
    const t = draft.trim();
    if (t && t !== conv.title) onRename(conv.id, t);
    setEditing(false);
  }

  function handleKey(e) {
    if (e.key === "Enter")  commitRename();
    if (e.key === "Escape") { setDraft(conv.title); setEditing(false); }
  }

  const lastMsg = conv.messages[conv.messages.length - 1];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => !editing && onSelect(conv.id)}
      style={{
        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
        background: isActive ? "#F0FDF4" : hov ? "#F8FAFC" : "transparent",
        border:     isActive ? "1px solid #BBF7D0" : "1px solid transparent",
        transition: "all 0.15s", position: "relative",
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
              onBlur={commitRename} onKeyDown={handleKey}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", border: "1px solid " + C.green, borderRadius: 6, padding: "2px 6px", fontSize: 12, fontWeight: 700, color: C.text, outline: "none" }} />
          ) : (
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isActive ? "#166534" : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {conv.title}
            </p>
          )}
          {lastMsg && (
            <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {lastMsg.text?.slice(0, 50) || "…"}
            </p>
          )}
          <p style={{ margin: "3px 0 0", fontSize: 10, color: C.muted }}>
            {new Date(conv.updatedAt).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </p>
        </div>
      </div>

      {/* Botones hover */}
      {hov && !editing && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => { setDraft(conv.title); setEditing(true); }}
            title="Renombrar"
            style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid " + C.border, background: "#fff", cursor: "pointer", fontSize: 11 }}>
            ✏️
          </button>
          <button onClick={() => onDelete(conv.id)}
            title="Eliminar"
            style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", fontSize: 11, color: C.red }}>
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
