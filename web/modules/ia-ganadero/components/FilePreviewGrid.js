"use client";
import { useState, useEffect, useCallback } from "react";
import { FILE_CATEGORY, FILE_CATEGORY_CONFIG, UPLOAD_STATUS } from "../constants/files.js";
import { revokeFileUrls, formatFileSize } from "../utils/file-handler.js";
import { FileCard }           from "./FileCard.js";
import { FileUploadZone }     from "./FileUploadZone.js";
import { FilePreviewModal }   from "./FilePreviewModal.js";
import { T } from "../constants/theme.js";

const ALL_CATEGORIES = Object.values(FILE_CATEGORY).filter(c => c !== FILE_CATEGORY.UNKNOWN);

/**
 * Grilla de archivos cargados con filtros por categoría, barra de resumen
 * y zona de carga integrada.
 *
 * @param {{
 *   items:       import('../utils/file-handler').FileItem[],
 *   onAdd:       (newItems: FileItem[]) => void,
 *   onRemove:    (id: string) => void,
 *   onClearAll?: () => void,
 *   showZone?:   boolean,
 * }} props
 */
export function FilePreviewGrid({ items, onAdd, onRemove, onClearAll, showZone = true }) {
  const [filter,       setFilter]       = useState("all");
  const [errors,       setErrors]       = useState([]);
  const [previewItem,  setPreviewItem]  = useState(null);   // item abierto en el modal

  // Limpia errores de toast después de 4 s
  useEffect(() => {
    if (errors.length === 0) return;
    const t = setTimeout(() => setErrors([]), 4000);
    return () => clearTimeout(t);
  }, [errors]);

  const handleErrors = useCallback((errs) => setErrors(errs), []);

  const readyItems = items.filter(i => i.status === UPLOAD_STATUS.READY);
  const errorItems = items.filter(i => i.status === UPLOAD_STATUS.ERROR);

  // Filtra por categoría
  const visible = filter === "all"
    ? items
    : filter === "error"
      ? errorItems
      : items.filter(i => i.category === filter);

  // Conteo por categoría para los tabs
  const counts = ALL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat).length;
    return acc;
  }, { all: items.length, error: errorItems.length });

  const totalSize = readyItems.reduce((s, i) => s + i.size, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Zona de carga (compact si ya hay archivos) ── */}
      {showZone && (
        <div style={{ padding: "0 0 16px" }}>
          <FileUploadZone
            onFilesAdded={onAdd}
            onErrors={handleErrors}
            compact={items.length > 0}
          />
        </div>
      )}

      {/* ── Toast de errores ── */}
      {errors.length > 0 && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 12,
          background: "#FEF2F2", border: `1px solid #FECACA`,
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            {errors.map((e, i) => (
              <p key={i} style={{ margin: "0 0 2px", fontSize: 11, color: T.danger }}>{e}</p>
            ))}
          </div>
          <button onClick={() => setErrors([])} style={{
            background: "none", border: "none", cursor: "pointer",
            color: T.danger, fontSize: 14, padding: 0, flexShrink: 0,
          }}>✕</button>
        </div>
      )}

      {items.length === 0 && (
        <div style={{ padding: "32px 0", textAlign: "center", color: T.muted }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>📂</p>
          <p style={{ fontSize: 13, margin: 0 }}>No hay archivos cargados todavía</p>
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* ── Barra de resumen ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 0 12px", borderBottom: `1px solid ${T.border}`, marginBottom: 12,
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                {readyItems.length} archivo{readyItems.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 11, color: T.muted }}>
                {formatFileSize(totalSize)} en total
              </span>
              {errorItems.length > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: T.danger,
                  background: "#FEF2F2", padding: "2px 7px", borderRadius: 20,
                }}>
                  {errorItems.length} con error
                </span>
              )}
            </div>
            {onClearAll && (
              <button onClick={onClearAll} style={{
                background: "none", border: `1px solid ${T.border}`,
                borderRadius: 7, padding: "3px 10px",
                fontSize: 11, color: T.muted, cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.danger; e.currentTarget.style.color = T.danger; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
                Limpiar todo
              </button>
            )}
          </div>

          {/* ── Tabs de filtro ── */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
            {/* Tab "Todos" */}
            <FilterTab
              label="Todos"
              count={counts.all}
              active={filter === "all"}
              color={T.accent}
              bg="#F0FDF4"
              border="#A7F3D0"
              onClick={() => setFilter("all")}
            />
            {/* Tab por categoría (solo si hay archivos de esa cat) */}
            {ALL_CATEGORIES.filter(cat => counts[cat] > 0).map(cat => {
              const cfg = FILE_CATEGORY_CONFIG[cat];
              return (
                <FilterTab
                  key={cat}
                  label={cfg.label}
                  icono={cfg.icono}
                  count={counts[cat]}
                  active={filter === cat}
                  color={cfg.color}
                  bg={cfg.bg}
                  border={cfg.border}
                  onClick={() => setFilter(cat)}
                />
              );
            })}
            {/* Tab errores */}
            {errorItems.length > 0 && (
              <FilterTab
                label="Con error"
                count={errorItems.length}
                active={filter === "error"}
                color={T.danger}
                bg="#FEF2F2"
                border="#FECACA"
                onClick={() => setFilter("error")}
              />
            )}
          </div>

          {/* ── Grilla de tarjetas ── */}
          {visible.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 12, color: T.muted, padding: "20px 0" }}>
              Sin archivos en esta categoría
            </p>
          ) : (
            <div style={{
              display:               "grid",
              gridTemplateColumns:   "repeat(auto-fill, minmax(150px, 1fr))",
              gap:                   10,
            }}>
              {visible.map(item => (
                <FileCard
                  key={item.id}
                  item={item}
                  onRemove={onRemove}
                  onOpen={setPreviewItem}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modal de vista previa ── */}
      <FilePreviewModal
        item={previewItem}
        items={items}
        onClose={() => setPreviewItem(null)}
        onNavigate={setPreviewItem}
      />
    </div>
  );
}

// ── Subcomponente: tab de filtro ──────────────────────────────────────────────
function FilterTab({ label, icono, count, active, color, bg, border, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          4,
        padding:      "4px 10px",
        borderRadius: 20,
        border:       active ? `2px solid ${color}` : `1px solid ${T.border}`,
        background:   active ? bg : T.panel,
        cursor:       "pointer",
        transition:   "all 0.15s",
        fontFamily:   "inherit",
      }}
    >
      {icono && <span style={{ fontSize: 13 }}>{icono}</span>}
      <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? color : T.muted }}>
        {label}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: active ? "#fff" : T.muted,
        background: active ? color : T.border,
        padding: "0px 5px", borderRadius: 20, minWidth: 16, textAlign: "center",
      }}>
        {count}
      </span>
    </button>
  );
}
