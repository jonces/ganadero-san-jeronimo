"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { FILE_CATEGORY, FILE_CATEGORY_CONFIG } from "../constants/files.js";
import { formatFileSize } from "../utils/file-handler.js";

// ── Paleta ────────────────────────────────────────────────────────────────────
const M = {
  overlay:  "rgba(0, 0, 0, 0.88)",
  panel:    "#1A1A1A",
  border:   "rgba(255,255,255,0.08)",
  text:     "#F5F5F5",
  muted:    "rgba(255,255,255,0.45)",
  accent:   "#10A37F",
  icon:     "rgba(255,255,255,0.7)",
  hover:    "rgba(255,255,255,0.08)",
  navBtn:   "rgba(255,255,255,0.12)",
  navHover: "rgba(255,255,255,0.22)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function canPreview(item) {
  return [FILE_CATEGORY.IMAGE, FILE_CATEGORY.VIDEO, FILE_CATEGORY.PDF].includes(item?.category);
}

function getBlobUrl(item) {
  // Para PDF necesitamos la URL del objeto File, no la previewUrl (que es null para PDF)
  if (!item) return null;
  if (item.previewUrl) return item.previewUrl;
  if (item.category === FILE_CATEGORY.PDF && item.file) {
    return URL.createObjectURL(item.file);
  }
  return null;
}

// ── Panel de imagen con zoom ──────────────────────────────────────────────────
function ImageViewer({ item }) {
  const [zoom,    setZoom]    = useState(1);
  const [pan,     setPan]     = useState({ x: 0, y: 0 });
  const [dragging, setDrag]   = useState(false);
  const dragStart = useRef(null);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.min(5, Math.max(0.5, z - e.deltaY * 0.001)));
  }, []);

  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    setDrag(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const onMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const onMouseUp = () => { setDrag(false); dragStart.current = null; };

  const onDoubleClick = () => {
    if (zoom > 1) resetView();
    else setZoom(2.5);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
      {/* Área de imagen */}
      <div
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
        style={{
          flex: 1, width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
          userSelect: "none",
        }}
      >
        <img
          src={item.previewUrl}
          alt={item.name}
          draggable={false}
          style={{
            maxWidth:  zoom === 1 ? "100%" : "none",
            maxHeight: zoom === 1 ? "100%" : "none",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center",
            transition: dragging ? "none" : "transform 0.15s ease",
            borderRadius: zoom === 1 ? 8 : 0,
            boxShadow: zoom === 1 ? "0 8px 40px rgba(0,0,0,0.6)" : "none",
          }}
        />
      </div>

      {/* Controles de zoom */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0 0", flexShrink: 0 }}>
        <ZoomBtn onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} icon="−" title="Alejar" />
        <button onClick={resetView} style={{
          background: "none", border: `1px solid ${M.border}`, borderRadius: 6,
          color: M.text, fontSize: 11, fontWeight: 700, padding: "4px 12px",
          cursor: "pointer", fontFamily: "inherit", minWidth: 52, textAlign: "center",
        }}>
          {Math.round(zoom * 100)}%
        </button>
        <ZoomBtn onClick={() => setZoom(z => Math.min(5, +(z + 0.25).toFixed(2)))} icon="+" title="Acercar" />
        <span style={{ fontSize: 10, color: M.muted, marginLeft: 4 }}>Doble clic · Rueda para zoom</span>
      </div>
    </div>
  );
}

function ZoomBtn({ onClick, icon, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 30, height: 30, borderRadius: 7,
        border: `1px solid ${M.border}`,
        background: hov ? M.navHover : M.navBtn,
        color: M.text, fontSize: 16, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "monospace", transition: "background 0.15s",
      }}>
      {icon}
    </button>
  );
}

// ── Panel de video ─────────────────────────────────────────────────────────────
function VideoViewer({ item }) {
  const vidRef = useRef(null);
  const blobUrl = item.previewUrl ?? (item.file ? URL.createObjectURL(item.file) : null);

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 0 12px" }}>
      <video
        ref={vidRef}
        src={blobUrl}
        controls
        autoPlay={false}
        style={{
          maxWidth:  "100%",
          maxHeight: "100%",
          borderRadius: 10,
          boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
          background: "#000",
          outline: "none",
        }}
      />
    </div>
  );
}

// ── Panel de PDF ───────────────────────────────────────────────────────────────
function PDFViewer({ item }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item.file) return;
    const url = URL.createObjectURL(item.file);
    setBlobUrl(url);
    setLoading(false);
    return () => URL.revokeObjectURL(url);
  }, [item.file]);

  if (loading || !blobUrl) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: M.muted }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p style={{ margin: 0, fontSize: 13 }}>Cargando PDF…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, minHeight: 0 }}>
      <iframe
        src={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
        title={item.name}
        style={{
          flex:        1,
          border:      "none",
          borderRadius: 8,
          background:  "#fff",
          minHeight:   0,
        }}
      />
    </div>
  );
}

// ── Botón de navegación prev/next ─────────────────────────────────────────────
function NavBtn({ onClick, direction, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 40, height: 40, borderRadius: "50%",
        border: `1px solid ${M.border}`,
        background: hov && !disabled ? M.navHover : M.navBtn,
        color: disabled ? M.muted : M.text,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, transition: "background 0.15s",
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
      }}
    >
      {direction === "prev" ? "‹" : "›"}
    </button>
  );
}

// ── Modal principal ────────────────────────────────────────────────────────────
/**
 * Modal de vista previa para imágenes, PDFs y videos.
 *
 * @param {{
 *   item:        import('../utils/file-handler').FileItem | null,
 *   items:       import('../utils/file-handler').FileItem[],  // para nav prev/next
 *   onClose:     () => void,
 *   onNavigate:  (item: FileItem) => void,
 * }} props
 */
export function FilePreviewModal({ item, items, onClose, onNavigate }) {
  const cfg = item ? (FILE_CATEGORY_CONFIG[item.category] ?? FILE_CATEGORY_CONFIG["unknown"]) : null;

  // Lista solo con items que se pueden previsualizar
  const previewable = (items ?? []).filter(canPreview);
  const idx         = previewable.findIndex(i => i.id === item?.id);
  const hasPrev     = idx > 0;
  const hasNext     = idx < previewable.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(previewable[idx - 1]);
  }, [hasPrev, idx, previewable, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(previewable[idx + 1]);
  }, [hasNext, idx, previewable, onNavigate]);

  // Teclado: Esc cierra, ← → navega
  useEffect(() => {
    if (!item) return;
    function onKey(e) {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   goPrev();
      if (e.key === "ArrowRight")  goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose, goPrev, goNext]);

  // Evita scroll del body mientras está abierto
  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [!!item]);

  if (!item) return null;

  return (
    <>
      {/* Fondo oscuro */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: M.overlay,
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          animation: "fadeIn 0.18s ease",
        }}
      />

      {/* Contenedor del modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa: ${item.name}`}
        style={{
          position:  "fixed",
          inset:     0,
          zIndex:    1001,
          display:   "flex",
          flexDirection: "column",
          padding:   "20px",
          pointerEvents: "none",  // el fondo maneja el click de cierre
        }}
      >
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          height:         "100%",
          maxWidth:       item.category === FILE_CATEGORY.PDF ? 900 : 1100,
          margin:         "0 auto",
          width:          "100%",
          pointerEvents:  "auto",
        }}>

          {/* ── Topbar del modal ── */}
          <div style={{
            display:        "flex",
            alignItems:     "center",
            gap:            12,
            padding:        "0 0 14px",
            flexShrink:     0,
          }}>
            {/* Icono + nombre */}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: cfg.color + "25",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>
              {cfg.icono}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: "0 0 2px",
                fontSize: 14, fontWeight: 700, color: M.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{item.name}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: cfg.color,
                  background: cfg.color + "20",
                  padding: "1px 7px", borderRadius: 20,
                }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: 11, color: M.muted }}>{formatFileSize(item.size)}</span>
                {previewable.length > 1 && (
                  <span style={{ fontSize: 11, color: M.muted }}>
                    {idx + 1} / {previewable.length}
                  </span>
                )}
              </div>
            </div>

            {/* Navegación prev/next */}
            {previewable.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <NavBtn onClick={goPrev} direction="prev" disabled={!hasPrev} />
                <NavBtn onClick={goNext} direction="next" disabled={!hasNext} />
              </div>
            )}

            {/* Botón cerrar */}
            <CloseBtn onClick={onClose} />
          </div>

          {/* ── Cuerpo del viewer ── */}
          <div style={{
            flex:           1,
            minHeight:      0,
            background:     M.panel,
            borderRadius:   14,
            border:         `1px solid ${M.border}`,
            display:        "flex",
            flexDirection:  "column",
            overflow:       "hidden",
            padding:        item.category === FILE_CATEGORY.PDF ? "0" : "16px 16px 8px",
          }}>
            {item.category === FILE_CATEGORY.IMAGE && <ImageViewer item={item} />}
            {item.category === FILE_CATEGORY.VIDEO && <VideoViewer item={item} />}
            {item.category === FILE_CATEGORY.PDF   && <PDFViewer   item={item} />}
          </div>
        </div>
      </div>

      {/* Animación */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </>
  );
}

function CloseBtn({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title="Cerrar (Esc)"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 36, height: 36, borderRadius: 10,
        border: `1px solid ${M.border}`,
        background: hov ? "rgba(239,68,68,0.2)" : M.navBtn,
        color: hov ? "#EF4444" : M.icon,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, transition: "all 0.15s", flexShrink: 0,
        fontFamily: "inherit",
      }}
    >
      ✕
    </button>
  );
}
