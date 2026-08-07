"use client";
import { ConversationList } from "./ConversationList.js";
import { ChatWindow }       from "./ChatWindow.js";
import { MessageInput }     from "./MessageInput.js";
import { ProviderBadge }    from "./ProviderBadge.js";
import { useProvider }      from "../hooks/useProvider.js";
import { useIA }            from "../context/useIA.js";

const C = { green: "#16a34a", border: "#E2E8F0", muted: "#94A3B8", text: "#1E293B" };

export function IALayout() {
  const { allProviders, providerId, setProvider } = useProvider();
  const { state }                                 = useIA();

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "inherit" }}>

      {/* ── Sidebar izquierdo: conversaciones ── */}
      <ConversationList />

      {/* ── Panel principal: chat + input ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Barra superior del panel */}
        <div style={{
          padding: "10px 20px", borderBottom: "1px solid " + C.border,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#FAFAFA", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: C.text }}>Centro IA Ganadero</p>
          </div>

          {/* Selector de provider */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ProviderBadge />
            <select
              value={providerId}
              onChange={e => setProvider(e.target.value)}
              style={{
                padding: "4px 8px", borderRadius: 8, border: "1px solid " + C.border,
                background: "#fff", fontSize: 12, color: C.text, cursor: "pointer", outline: "none",
              }}>
              {allProviders.map(p => (
                <option key={p.id} value={p.id} disabled={!p.available}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat */}
        <ChatWindow />

        {/* Error banner */}
        {state.error && (
          <div style={{ padding: "8px 20px", background: "#FEF2F2", borderTop: "1px solid #FECACA", fontSize: 12, color: "#DC2626", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠️ {state.error}</span>
          </div>
        )}

        {/* Input */}
        <MessageInput />
      </div>
    </div>
  );
}
