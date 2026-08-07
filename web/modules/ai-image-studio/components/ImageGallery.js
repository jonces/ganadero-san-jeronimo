"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { loadGallery, filterGallery, removeFromGallery } from "../services/gallery-storage.js";
import { downloadImage }    from "../services/image-studio-service.js";
import { IMAGE_CATEGORIES } from "../constants/categories.js";
import { ESPECIALISTAS_IA } from "../../ia-ganadero/specialists/index.js";

/**
 * Galería de imágenes generadas con filtros y búsqueda.
 * Usable como panel lateral o página independiente.
 *
 * @param {{ onClose?: () => void, compact?: boolean }} props
 */
export function ImageGallery({ onClose, compact = false }) {
  const [entries,   setEntries]   = useState([]);
  const [search,    setSearch]    = useState("");
  const [specialist, setSpecialist] = useState("");
  const [category,  setCategory]  = useState("");
  const [selected,  setSelected]  = useState(null); // entry en vista detalle
  const [loading,   setLoading]   = useState(false);

  const refresh = useCallback(() => {
    setEntries(loadGallery());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => filterGallery({
    specialistId: specialist || undefined,
    categoryId:   category   || undefined,
    search:       search     || undefined,
  }), [entries, search, specialist, category]); // eslint-disable-line

  const handleDelete = useCallback((id) => {
    removeFromGallery(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selected?.id === id) setSelected(null);
  }, [selected]);

  const handleDownload = useCallback(async (entry) => {
    setLoading(true);
    try {
      const src  = entry.dataUrl || entry.url;
      const name = `ganaderosg-${entry.categoryId ?? "imagen"}-${Date.now()}.png`;
      await downloadImage(src, name);
    } finally { setLoading(false); }
  }, []);

  const panelStyle = {
    display:        "flex",
    flexDirection:  "column",
    height:         compact ? "100%" : "100vh",
    background:     "var(--ia-bg, #F9FAFB)",
    fontFamily:     "inherit",
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        padding:        "16px 20px 12px",
        borderBottom:   "1px solid var(--ia-border, #E5E7EB)",
        background:     "var(--ia-panel, #FFFFFF)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        flexShrink:     0,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ia-text, #111)" }}>
            🖼️ Galería de Imágenes IA
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ia-muted, #6B7280)" }}>
            {filtered.length} imagen{filtered.length !== 1 ? "es" : ""} generada{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Cerrar galería" style={closeBtn}>✕</button>
        )}
      </div>

      {/* Filtros */}
      <div style={{
        padding:    "12px 16px",
        background: "var(--ia-panel, #FFFFFF)",
        borderBottom: "1px solid var(--ia-border, #E5E7EB)",
        display:    "flex",
        gap:        8,
        flexWrap:   "wrap",
        flexShrink: 0,
      }}>
        <input
          type="search"
          placeholder="Buscar imagen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
          aria-label="Buscar imágenes"
        />

        <select value={specialist} onChange={e => setSpecialist(e.target.value)} style={selectStyle} aria-label="Filtrar por especialista">
          <option value="">Todos los especialistas</option>
          {ESPECIALISTAS_IA.map(e => (
            <option key={e.id} value={e.id}>{e.icono} {e.label}</option>
          ))}
        </select>

        <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {Object.values(IMAGE_CATEGORIES).map(c => (
            <option key={c.id} value={c.id}>{c.icono} {c.label}</option>
          ))}
        </select>

        {(search || specialist || category) && (
          <button
            onClick={() => { setSearch(""); setSpecialist(""); setCategory(""); }}
            style={{ ...clearBtn }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Vista detalle */}
      {selected && (
        <DetailView
          entry={selected}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
          onDownload={() => handleDownload(selected)}
          loading={loading}
        />
      )}

      {/* Grid */}
      {!selected && (
        <div style={{
          flex:       1,
          overflowY:  "auto",
          padding:    16,
        }}>
          {filtered.length === 0 ? (
            <EmptyState hasFilters={!!(search || specialist || category)} />
          ) : (
            <div style={{
              display:               "grid",
              gridTemplateColumns:   "repeat(auto-fill, minmax(200px, 1fr))",
              gap:                   12,
            }}>
              {filtered.map(entry => (
                <GalleryThumbnail
                  key={entry.id}
                  entry={entry}
                  onClick={() => setSelected(entry)}
                  onDelete={() => handleDelete(entry.id)}
                  onDownload={() => handleDownload(entry)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GalleryThumbnail({ entry, onClick, onDelete, onDownload }) {
  const catConfig = IMAGE_CATEGORIES[entry.categoryId?.toUpperCase()] ?? IMAGE_CATEGORIES.ILUSTRACION;
  const specialist = ESPECIALISTAS_IA.find(e => e.id === entry.specialistId);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
      style={{
        borderRadius: 10,
        overflow:     "hidden",
        border:       "1px solid var(--ia-border, #E5E7EB)",
        background:   "var(--ia-panel, #FFF)",
        cursor:       "pointer",
        transition:   "transform 0.15s, box-shadow 0.15s",
        position:     "relative",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform   = "translateY(-2px)";
        e.currentTarget.style.boxShadow   = "0 6px 20px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform   = "";
        e.currentTarget.style.boxShadow   = "";
      }}
    >
      {/* Imagen */}
      <div style={{ height: 140, overflow: "hidden", background: "#F3F4F6" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.dataUrl || entry.url}
          alt={entry.userText ?? "Imagen IA"}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; }}
        />
      </div>

      {/* Meta */}
      <div style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <span aria-hidden="true" style={{ fontSize: 12 }}>{catConfig.icono}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ia-text, #374151)" }}>
            {catConfig.label}
          </span>
          {specialist && (
            <span style={{ marginLeft: "auto", fontSize: 11 }} title={specialist.label}>
              {specialist.icono}
            </span>
          )}
        </div>
        <p style={{
          margin: 0, fontSize: 11, color: "var(--ia-muted, #6B7280)",
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {entry.userText}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--ia-muted, #9CA3AF)" }}>
          {new Date(entry.createdAt).toLocaleDateString("es-CO")}
        </p>
      </div>

      {/* Acciones rápidas — overlay al hover */}
      <div
        style={{
          position: "absolute", top: 6, right: 6,
          display: "flex", gap: 4,
        }}
        onClick={e => e.stopPropagation()}
      >
        <MiniBtn onClick={onDownload} label="⬇" title="Descargar" />
        <MiniBtn onClick={onDelete}   label="🗑" title="Eliminar" danger />
      </div>
    </div>
  );
}

function DetailView({ entry, onClose, onDelete, onDownload, loading }) {
  const catConfig = IMAGE_CATEGORIES[entry.categoryId?.toUpperCase()] ?? IMAGE_CATEGORIES.ILUSTRACION;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onClose} style={clearBtn}>← Volver a la galería</button>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.dataUrl || entry.url}
        alt={entry.userText ?? "Imagen IA"}
        style={{ width: "100%", borderRadius: 12, display: "block", marginBottom: 16 }}
      />

      <div style={{
        background:   "var(--ia-panel, #FFF)",
        borderRadius: 10,
        border:       "1px solid var(--ia-border, #E5E7EB)",
        padding:      16,
      }}>
        <MetaRow label="Solicitud" value={entry.userText} />
        <MetaRow label="Categoría" value={`${catConfig.icono} ${catConfig.label}`} />
        <MetaRow label="Fecha"     value={new Date(entry.createdAt).toLocaleString("es-CO")} />
        {entry.fincaNombre && <MetaRow label="Finca" value={entry.fincaNombre} />}

        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 12, color: "var(--ia-muted, #6B7280)", cursor: "pointer" }}>
            Ver prompt completo
          </summary>
          <p style={{ fontSize: 11, color: "var(--ia-muted, #6B7280)", marginTop: 8, lineHeight: 1.5 }}>
            {entry.prompt}
          </p>
        </details>

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <ActionBtn onClick={onDownload} disabled={loading} label={loading ? "Descargando…" : "⬇ Descargar"} primary />
          <ActionBtn onClick={() => navigator.share?.({ url: entry.url }).catch(() => {})} label="↗ Compartir" />
          <ActionBtn onClick={onDelete} label="🗑 Eliminar" danger />
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ia-muted, #6B7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--ia-text, #111)" }}>{value}</p>
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ia-muted, #6B7280)" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
      <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>
        {hasFilters ? "Sin resultados" : "Galería vacía"}
      </h3>
      <p style={{ margin: 0, fontSize: 13 }}>
        {hasFilters
          ? "Intenta con otros filtros de búsqueda."
          : "Las imágenes que generes en el Centro IA aparecerán aquí."}
      </p>
    </div>
  );
}

function MiniBtn({ onClick, label, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26, height: 26, borderRadius: 6, border: "none",
        background: danger ? "#FEE2E2" : "rgba(255,255,255,0.85)",
        cursor: "pointer", fontSize: 12, display: "flex",
        alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      {label}
    </button>
  );
}

function ActionBtn({ onClick, label, primary, danger, disabled }) {
  let bg = primary ? "#6366F1" : "var(--ia-panel, #F9FAFB)";
  let color = primary ? "#FFF" : danger ? "#DC2626" : "var(--ia-text, #374151)";
  let border = danger ? "1px solid #FECACA" : "1px solid var(--ia-border, #E5E7EB)";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "7px 16px", borderRadius: 20, border, background: bg,
      color, fontWeight: 600, fontSize: 12, cursor: disabled ? "default" : "pointer",
      fontFamily: "inherit",
    }}>
      {label}
    </button>
  );
}

// Estilos compartidos
const inputStyle = {
  flex: 1, minWidth: 160, padding: "7px 12px",
  borderRadius: 20, border: "1px solid var(--ia-border, #E5E7EB)",
  background: "var(--ia-bg, #F9FAFB)", color: "var(--ia-text, #111)",
  fontSize: 12, fontFamily: "inherit",
};
const selectStyle = {
  padding: "7px 12px", borderRadius: 20,
  border: "1px solid var(--ia-border, #E5E7EB)",
  background: "var(--ia-bg, #F9FAFB)", color: "var(--ia-text, #111)",
  fontSize: 12, fontFamily: "inherit", cursor: "pointer",
};
const clearBtn = {
  fontSize: 12, padding: "6px 12px", borderRadius: 20,
  border: "1px solid var(--ia-border, #E5E7EB)",
  background: "transparent", color: "var(--ia-muted, #6B7280)",
  cursor: "pointer", fontFamily: "inherit",
};
const closeBtn = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid var(--ia-border, #E5E7EB)",
  background: "var(--ia-hover, #F3F4F6)", cursor: "pointer",
  fontSize: 14, color: "var(--ia-muted, #6B7280)", flexShrink: 0,
};
