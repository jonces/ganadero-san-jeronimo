"use client";
import { useProvider } from "../hooks/useProvider.js";

export function TypingIndicator() {
  const { isBusy, activeConfig } = useProvider();
  if (!isBusy) return null;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "4px 0" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
        {activeConfig?.icon ?? "🤖"}
      </div>
      <div style={{
        background: "#F0FDF4", border: "1px solid #BBF7D0",
        borderRadius: "4px 14px 14px 14px",
        padding: "10px 14px", display: "flex", alignItems: "center", gap: 4,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#16a34a", opacity: 0.7,
            animation: `iaTyping 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes iaTyping {
          0%, 60%, 100% { transform: translateY(0);   opacity: 0.4; }
          30%            { transform: translateY(-6px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
