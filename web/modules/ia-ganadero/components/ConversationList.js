"use client";
import { useConversation }   from "../hooks/useConversation.js";
import { ConversationItem }  from "./ConversationItem.js";
import { ProviderBadge }     from "./ProviderBadge.js";

const C = { green: "#16a34a", border: "#E2E8F0", muted: "#94A3B8", text: "#1E293B" };

export function ConversationList() {
  const { conversations, activeId, selectConversation,
          newConversation, deleteConversation, renameConversation } = useConversation();

  return (
    <aside style={{
      width: 240, flexShrink: 0, borderRight: "1px solid " + C.border,
      display: "flex", flexDirection: "column", background: "#FAFAFA", height: "100%",
    }}>
      {/* Cabecera sidebar */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid " + C.border }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 13, color: C.text }}>Conversaciones</p>
          <ProviderBadge compact />
        </div>
        <button onClick={newConversation} style={{
          width: "100%", padding: "8px 0", borderRadius: 10,
          border: "1.5px solid " + C.green, background: "#F0FDF4",
          color: C.green, fontWeight: 800, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.green; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.color = C.green; }}>
          <span>+</span> Nueva conversación
        </button>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 12px", color: C.muted }}>
            <p style={{ fontSize: 28, margin: "0 0 8px" }}>💬</p>
            <p style={{ fontSize: 12, margin: 0 }}>Sin conversaciones aún.</p>
            <p style={{ fontSize: 11, margin: "4px 0 0" }}>Haz clic en "Nueva conversación".</p>
          </div>
        ) : (
          conversations.map(c => (
            <ConversationItem key={c.id} conv={c} isActive={c.id === activeId}
              onSelect={selectConversation} onDelete={deleteConversation} onRename={renameConversation} />
          ))
        )}
      </div>
    </aside>
  );
}
