"use client";
import { useState, useCallback } from "react";
import { downloadImage, regenerateImage } from "../services/image-studio-service.js";
import { IMAGE_CATEGORIES }               from "../constants/categories.js";

/**
 * Tarjeta de imagen generada para mostrar dentro del chat.
 *
 * @param {{
 *   imageData: import('../services/gallery-storage').GalleryEntry & { url: string },
 *   onRegenerate?: (newData) => void,
 *   onEditPrompt?: () => void,
 *   compact?: boolean,
 * }} props
 */
export function ImageResultCard({ imageData, onRegenerate, compact = false }) {
  const [expanded,      setExpanded]      = useState(false);
  const [downloading,   setDownloading]   = useState(false);
  const [regenerating,  setRegenerating]  = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [editedPrompt,  setEditedPrompt]  = useState(imageData.prompt ?? "");
  const [error,         setError]         = useState(null);

  const catConfig = IMAGE_CATEGORIES[imageData.categoryId?.toUpperCase()] ?? IMAGE_CATEGORIES.ILUSTRACION;

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const name = `ganaderosg-${imageData.categoryId ?? "imagen"}-${Date.now()}.png`;
      await downloadImage(imageData.url, name);
    } finally {
      setDownloading(false);
    }
  }, [imageData]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    setError(null);
    await regenerateImage({
      originalPrompt:  editedPrompt || imageData.prompt,
      userText:        imageData.userText,
      specialistId:    imageData.specialistId,
      conversationId:  imageData.conversationId,
      messageId:       imageData.messageId,
      fincaCtx:        imageData.fincaId ? { finca: { id: imageData.fincaId, nombre: imageData.fincaNombre } } : null,
      onStart:         () => {},
      onSuccess:       (data) => {
        setRegenerating(false);
        setEditingPrompt(false);
        onRegenerate?.(data);
      },
      onError: (msg) => {
        setRegenerating(false);
        setError(msg);
      },
    });
  }, [editedPrompt, imageData, onRegenerate]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: "Imagen GanaderoSG", url: imageData.url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(imageData.url).catch(() => {});
      alert("URL copiada al portapapeles");
    }
  }, [imageData.url]);

  const cardStyle = {
    borderRadius: 12,
    border:       "1px solid var(--ia-border, #E5E7EB)",
    overflow:     "hidden",
    background:   "var(--ia-panel, #F9FAFB)",
    maxWidth:     compact ? 380 : 540,
    boxShadow:    "0 2px 12px rgba(0,0,0,0.08)",
    marginTop:    8,
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{
        padding:        "10px 14px",
        background:     "var(--ia-hover, #F3F4F6)",
        borderBottom:   "1px solid var(--ia-border, #E5E7EB)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>{catConfig.icono}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ia-text, #111)" }}>
            {catConfig.label} generado
          </span>
          {imageData.fincaNombre && (
            <span style={{
              fontSize: 11, color: "var(--ia-muted, #6B7280)",
              background: "var(--ia-border, #E5E7EB)",
              borderRadius: 20, padding: "2px 8px",
            }}>
              {imageData.fincaNombre}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? "Contraer imagen" : "Expandir imagen"}
          style={{
            fontSize: 12, color: "var(--ia-muted, #6B7280)",
            background: "none", border: "none", cursor: "pointer",
            padding: "2px 6px", borderRadius: 6,
          }}
        >
          {expanded ? "⤡ Contraer" : "⤢ Ampliar"}
        </button>
      </div>

      {/* Imagen */}
      <div
        style={{
          position:   "relative",
          cursor:     "pointer",
          maxHeight:  expanded ? "none" : (compact ? 220 : 340),
          overflow:   "hidden",
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {regenerating ? (
          <div style={{
            height: 200, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12, color: "var(--ia-muted, #6B7280)",
          }}>
            <div style={{
              width: 32, height: 32, border: "3px solid #E5E7EB",
              borderTopColor: "#6366F1", borderRadius: "50%",
              animation: "ia-spin 0.8s linear infinite",
            }} />
            <span style={{ fontSize: 13 }}>Generando nueva imagen…</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageData.url}
            alt={imageData.userText ?? "Imagen generada por IA"}
            loading="lazy"
            style={{ width: "100%", display: "block", objectFit: "cover" }}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "8px 14px", background: "#FEF2F2", borderTop: "1px solid #FECACA" }}>
          <span style={{ fontSize: 12, color: "#DC2626" }}>⚠️ {error}</span>
        </div>
      )}

      {/* Prompt editado */}
      {editingPrompt && (
        <div style={{ padding: 12, borderTop: "1px solid var(--ia-border, #E5E7EB)" }}>
          <textarea
            value={editedPrompt}
            onChange={e => setEditedPrompt(e.target.value)}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: 8, borderRadius: 8,
              border: "1px solid var(--ia-border, #E5E7EB)",
              background: "var(--ia-bg, #FFF)",
              color: "var(--ia-text, #111)",
              fontSize: 12, fontFamily: "inherit", resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleRegenerate} disabled={regenerating} style={btnStyle("#6366F1", "#FFF")}>
              ✨ Regenerar
            </button>
            <button onClick={() => setEditingPrompt(false)} style={btnStyle("transparent", "var(--ia-muted, #6B7280)", true)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div style={{
        padding:        "10px 14px",
        borderTop:      "1px solid var(--ia-border, #E5E7EB)",
        display:        "flex",
        gap:            6,
        flexWrap:       "wrap",
        alignItems:     "center",
      }}>
        <ActionBtn onClick={handleDownload}  disabled={downloading}  label={downloading ? "Descargando…" : "⬇ Descargar"} />
        <ActionBtn onClick={handleShare}                             label="↗ Compartir" />
        <ActionBtn onClick={handleRegenerate} disabled={regenerating} label={regenerating ? "Generando…" : "🔄 Regenerar"} />
        <ActionBtn onClick={() => setEditingPrompt(p => !p)}         label="✏️ Editar prompt" />

        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--ia-muted, #6B7280)" }}>
          {new Date(imageData.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize:     11,
        fontWeight:   600,
        padding:      "5px 12px",
        borderRadius: 20,
        border:       "1px solid var(--ia-border, #E5E7EB)",
        background:   "var(--ia-panel, #F9FAFB)",
        color:        disabled ? "var(--ia-muted, #9CA3AF)" : "var(--ia-text, #374151)",
        cursor:       disabled ? "default" : "pointer",
        whiteSpace:   "nowrap",
        fontFamily:   "inherit",
      }}
    >
      {label}
    </button>
  );
}

function btnStyle(bg, color, ghost = false) {
  return {
    fontSize: 12, fontWeight: 600,
    padding: "6px 14px", borderRadius: 20,
    border: ghost ? "1px solid var(--ia-border, #E5E7EB)" : "none",
    background: bg, color,
    cursor: "pointer", fontFamily: "inherit",
  };
}
