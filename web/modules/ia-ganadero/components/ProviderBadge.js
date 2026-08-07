"use client";
import { useProvider } from "../hooks/useProvider.js";

export function ProviderBadge({ compact = false }) {
  const { activeConfig, isBusy } = useProvider();
  if (!activeConfig) return null;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: compact ? "2px 8px" : "4px 10px",
      borderRadius: 20, fontSize: compact ? 10 : 11, fontWeight: 700,
      background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803d",
    }}>
      <span>{activeConfig.icon}</span>
      <span>{activeConfig.name}</span>
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isBusy ? "#F59E0B" : "#22c55e",
        animation: isBusy ? "pulse 1s infinite" : "none",
      }} />
    </div>
  );
}
