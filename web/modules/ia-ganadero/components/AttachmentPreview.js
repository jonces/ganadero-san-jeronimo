"use client";
import { useIA }          from "../context/useIA.js";
import { formatFileSize } from "../utils/file-handler.js";
import { ATTACHMENT_TYPE } from "../constants/index.js";

export function AttachmentPreview() {
  const { state, removeAttachment } = useIA();
  const attachments = state.pendingAttachments;
  if (attachments.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "0 0 8px" }}>
      {attachments.map(a => (
        <div key={a.id} style={{
          position: "relative", display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 10,
          border: "1px solid #BBF7D0", background: "#F0FDF4",
          maxWidth: 200,
        }}>
          {a.type === ATTACHMENT_TYPE.IMAGE && a.url
            ? <img src={a.url} alt={a.name} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} />
            : <span style={{ fontSize: 20 }}>{a.type === ATTACHMENT_TYPE.DOCUMENT ? "📄" : "🎤"}</span>
          }
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#166534", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{a.name}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#15803d" }}>{formatFileSize(a.size)}</p>
          </div>
          <button
            onClick={() => removeAttachment(a.id)}
            style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#DC2626", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
