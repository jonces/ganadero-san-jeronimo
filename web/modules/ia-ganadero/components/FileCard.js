"use client";
import { useState } from "react";
import { FILE_CATEGORY_CONFIG, UPLOAD_STATUS, FILE_CATEGORY } from "../constants/files.js";
import { formatFileSize } from "../utils/file-handler.js";
import { T } from "../constants/theme.js";

const PREVIEWABLE = [FILE_CATEGORY.IMAGE, FILE_CATEGORY.VIDEO, FILE_CATEGORY.PDF];

/**
 * Tarjeta individual de archivo.
 *
 * @param {{
 *   item:     import('../utils/file-handler').FileItem,
 *   onRemove: (id: string) => void,
 *   onOpen?:  (item: FileItem) => void,   — abre el modal de vista previa
 * }} props
 */
export function FileCard({ item, onRemove, onOpen }) {
  const [hovered,    setHovered]    = useState(false);
  const [imgError,   setImgError]   = useState(false);
  const [vidPlaying, setVidPlaying] = useState(false);

  const cfg         = FILE_CATEGORY_CONFIG[item.category] ?? FILE_CATEGORY_CONFIG["unknown"];
  const isError     = item.status === UPLOAD_STATUS.ERROR;
  const hasPreview  = item.previewUrl && !isError;
  const canOpen     = !isError && PREVIEWABLE.includes(item.category) && onOpen;

  const cardBorder = isError
    ? `1px solid ${T.danger}30`
    : hovered
      ? `1px solid ${cfg.color}60`
      : `1px solid ${T.border}`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:      "relative",
        borderRadius:  12,
        border:        cardBorder,
        background:    isError ? "#FEF2F2" : T.panel,
        overflow:      "hidden",
        transition:    "border-color 0.15s, box-shadow 0.15s",
        boxShadow:     hovered ? "0 2px 10px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
        display:       "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Zona de preview — clickeable si tiene modal ── */}
      <div
        onClick={() => canOpen && onOpen(item)}
        style={{
          height:   120,
          background: cfg.bg,
          display:  "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          cursor: canOpen ? "pointer" : "default",
        }}
      >

        {/* Preview de imagen */}
        {item.category === "image" && hasPreview && !imgError && (
          <img
            src={item.previewUrl}
            alt={item.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {/* Preview de video */}
        {item.category === "video" && hasPreview && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <video
              src={item.previewUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
              loop
              playsInline
              ref={el => {
                if (!el) return;
                if (vidPlaying) el.play().catch(() => {});
                else el.pause();
              }}
            />
            {/* Botón play */}
            <button
              onClick={() => setVidPlaying(p => !p)}
              style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: vidPlaying ? "transparent" : "rgba(0,0,0,0.35)",
                border: "none", cursor: "pointer", transition: "background 0.2s",
              }}
            >
              {!vidPlaying && (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={cfg.color}>
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Preview de audio */}
        {item.category === "audio" && (
          <div style={{ padding: "0 12px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ fontSize: 28, textAlign: "center", marginBottom: 6 }}>{cfg.icono}</div>
            <audio
              src={item.file ? URL.createObjectURL(item.file) : undefined}
              controls
              style={{ width: "100%", height: 28, opacity: 0.85 }}
            />
          </div>
        )}

        {/* Icono genérico para PDF, Excel, Word, Unknown */}
        {!["image","video","audio"].includes(item.category) && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 6 }}>{cfg.icono}</div>
            <span style={{
              fontSize: 10, fontWeight: 800, color: cfg.color,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em",
            }}>
              {(item.name.split(".").pop() ?? cfg.label).toUpperCase()}
            </span>
          </div>
        )}

        {/* Badge de error */}
        {isError && (
          <div style={{
            position: "absolute", bottom: 6, left: 6, right: 6,
            background: "#FEF2F2", border: `1px solid ${T.danger}40`,
            borderRadius: 6, padding: "3px 7px", textAlign: "center",
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.danger }}>⚠ Error de validación</span>
          </div>
        )}

        {/* Overlay "Ver" — hover sobre archivos con preview disponible */}
        {hovered && canOpen && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.38)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 20, padding: "5px 14px",
              fontSize: 12, fontWeight: 700, color: "#0D0D0D",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Ver
            </div>
          </div>
        )}

        {/* Botón eliminar — aparece al hover */}
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            title="Quitar archivo"
            style={{
              position: "absolute", top: 6, right: 6,
              width: 22, height: 22, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", border: "none",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, lineHeight: 1, zIndex: 3,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Metadata ── */}
      <div style={{ padding: "8px 10px 9px", flex: 1 }}>
        <p style={{
          margin: "0 0 2px", fontSize: 11, fontWeight: 600,
          color: isError ? T.danger : T.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }} title={item.name}>
          {item.name}
        </p>
        {isError ? (
          <p style={{ margin: 0, fontSize: 10, color: T.danger, lineHeight: 1.4 }}>
            {item.error}
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: cfg.color,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              padding: "1px 6px", borderRadius: 20,
            }}>
              {cfg.label}
            </span>
            <span style={{ fontSize: 10, color: T.muted }}>
              {formatFileSize(item.size)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
