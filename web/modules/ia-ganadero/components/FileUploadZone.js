"use client";
import { useState, useRef, useCallback } from "react";
import { ACCEPT_ALL, FILE_CATEGORY_CONFIG, FILE_CATEGORY } from "../constants/files.js";
import { processFiles } from "../utils/file-handler.js";

const T = {
  panel:   "#FFFFFF",
  bg:      "#F7F7F8",
  border:  "#E5E5E5",
  text:    "#0D0D0D",
  muted:   "#6E6E80",
  accent:  "#10A37F",
};

const TYPE_GROUPS = [
  { label: "Imágenes", items: FILE_CATEGORY_CONFIG[FILE_CATEGORY.IMAGE] },
  { label: "Videos",   items: FILE_CATEGORY_CONFIG[FILE_CATEGORY.VIDEO] },
  { label: "Audios",   items: FILE_CATEGORY_CONFIG[FILE_CATEGORY.AUDIO] },
  { label: "PDF",      items: FILE_CATEGORY_CONFIG[FILE_CATEGORY.PDF] },
  { label: "Excel",    items: FILE_CATEGORY_CONFIG[FILE_CATEGORY.EXCEL] },
  { label: "Word",     items: FILE_CATEGORY_CONFIG[FILE_CATEGORY.WORD] },
];

/**
 * Zona de carga de archivos con drag & drop y click para abrir.
 *
 * @param {{
 *   onFilesAdded: (items: import('../utils/file-handler').FileItem[]) => void,
 *   onErrors?:    (errors: string[]) => void,
 *   compact?:     boolean,
 * }} props
 */
export function FileUploadZone({ onFilesAdded, onErrors, compact = false }) {
  const [dragging,     setDragging]     = useState(false);
  const [dragCounter,  setDragCounter]  = useState(0);
  const inputRef = useRef(null);

  const handleFiles = useCallback((fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const { items, errors } = processFiles(files);
    if (items.length > 0) onFilesAdded(items);
    if (errors.length > 0) onErrors?.(errors);
  }, [onFilesAdded, onErrors]);

  // Drag handlers
  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    setDragCounter(c => c + 1);
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragCounter(c => {
      const next = c - 1;
      if (next <= 0) setDragging(false);
      return next;
    });
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    setDragCounter(0);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onInputChange = useCallback((e) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";  // permite volver a seleccionar el mismo archivo
  }, [handleFiles]);

  if (compact) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          padding:        "10px 16px",
          borderRadius:   10,
          border:         `2px dashed ${dragging ? T.accent : T.border}`,
          background:     dragging ? "#F0FDF4" : T.bg,
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          cursor:         "pointer",
          transition:     "all 0.2s",
          userSelect:     "none",
        }}
      >
        <span style={{ fontSize: 20 }}>📎</span>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text }}>
            {dragging ? "Suelta los archivos aquí" : "Arrastra archivos o haz clic"}
          </p>
          <p style={{ margin: 0, fontSize: 10, color: T.muted }}>
            Imágenes · Videos · Audios · PDF · Excel · Word
          </p>
        </div>
        <input ref={inputRef} type="file" multiple accept={ACCEPT_ALL}
          style={{ display: "none" }} onChange={onInputChange} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Zona principal drop */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          padding:         "36px 24px",
          borderRadius:    16,
          border:          `2px dashed ${dragging ? T.accent : "#D0D0D0"}`,
          background:      dragging ? "#F0FDF4" : T.panel,
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "center",
          gap:             10,
          cursor:          "pointer",
          transition:      "all 0.2s",
          textAlign:       "center",
          userSelect:      "none",
        }}
      >
        <div style={{
          width:          64, height: 64, borderRadius: 18,
          background:     dragging ? "#D1FAE5" : "#F3F4F6",
          display:        "flex", alignItems: "center", justifyContent: "center",
          fontSize:       30,
          transition:     "all 0.2s",
          transform:      dragging ? "scale(1.1)" : "scale(1)",
        }}>
          {dragging ? "⬇️" : "📂"}
        </div>

        <div>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.text }}>
            {dragging ? "Suelta los archivos aquí" : "Arrastra tus archivos aquí"}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: T.muted }}>
            o <span style={{ color: T.accent, fontWeight: 700, textDecoration: "underline" }}>haz clic para explorar</span>
          </p>
        </div>

        <input ref={inputRef} type="file" multiple accept={ACCEPT_ALL}
          style={{ display: "none" }} onChange={onInputChange} />
      </div>

      {/* Tipos aceptados */}
      <div>
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Tipos aceptados
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TYPE_GROUPS.map(g => (
            <div key={g.label} style={{
              display:      "flex",
              alignItems:   "center",
              gap:          5,
              padding:      "4px 10px",
              borderRadius: 20,
              background:   g.items.bg,
              border:       `1px solid ${g.items.border}`,
            }}>
              <span style={{ fontSize: 13 }}>{g.items.icono}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: g.items.color }}>{g.label}</span>
              <span style={{ fontSize: 10, color: g.items.color + "99" }}>
                {g.items.exts.join(", ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
