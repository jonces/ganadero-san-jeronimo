"use client";
import { useState, useEffect, useCallback } from "react";
import { getBiblioteca, deleteBibliotecaItem, toggleFavorito, isFavorito } from "../services/academia-storage.js";
import { CATEGORIAS_LISTA } from "../constants/categories.js";
import { CONTENT_TYPE_CONFIG } from "../constants/content-types.js";

/**
 * Biblioteca personal de contenido generado por la IA.
 */
export function BibliotecaPanel() {
  const [items,   setItems]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [catFil,  setCatFil]  = useState("");
  const [tipoFil, setTipoFil] = useState("");
  const [expanded,setExpanded]= useState(null);

  const reload = useCallback(() => {
    setItems(getBiblioteca({ categoria: catFil || undefined, search: search || undefined }));
  }, [search, catFil]);

  useEffect(() => { reload(); }, [reload]);

  const filteredItems = items.filter(i => !tipoFil || i.tipo === tipoFil);

  const eliminar = (id) => {
    deleteBibliotecaItem(id);
    reload();
  };

  const fav = (id) => {
    toggleFavorito(id);
    reload();
  };

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar en biblioteca…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 14px", borderRadius: 30,
              border: "1px solid #E5E7EB", fontSize: 13, fontFamily: "inherit",
            }}
          />
        </div>

        <select
          value={catFil}
          onChange={e => setCatFil(e.target.value)}
          style={selectStyle}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_LISTA.map(c => <option key={c.id} value={c.id}>{c.icono} {c.label}</option>)}
        </select>

        <select
          value={tipoFil}
          onChange={e => setTipoFil(e.target.value)}
          style={selectStyle}
        >
          <option value="">Todos los tipos</option>
          {Object.values(CONTENT_TYPE_CONFIG).map(t => <option key={t.id} value={t.id}>{t.icono} {t.label}</option>)}
        </select>
      </div>

      {/* Listado */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B7280" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Biblioteca vacía</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>
            El contenido que generes con la IA se guardará aquí automáticamente.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredItems.map(item => (
            <BibliotecaItem
              key={item.id}
              item={item}
              isExpanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onEliminar={() => eliminar(item.id)}
              onFavorito={() => fav(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BibliotecaItem({ item, isExpanded, onToggle, onEliminar, onFavorito }) {
  const tipoCfg  = CONTENT_TYPE_CONFIG[item.tipo] ?? { icono: "📄", label: item.tipo };
  const esFav    = isFavorito(item.id);
  const fecha    = item.ts ? new Date(item.ts).toLocaleDateString("es-CO") : "";

  return (
    <div style={{
      background: "#FFF", border: "1px solid #E5E7EB",
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Header */}
      <div
        style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}
        onClick={onToggle}
      >
        <span style={{ fontSize: 20, flexShrink: 0 }}>{tipoCfg.icono}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.titulo}
          </h4>
          <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>
            {tipoCfg.label} · {fecha}
          </p>
        </div>
        <button onClick={e => { e.stopPropagation(); onFavorito(); }} style={iconBtn(esFav ? "#D97706" : "#9CA3AF")}>
          {esFav ? "★" : "☆"}
        </button>
        <button onClick={e => { e.stopPropagation(); onEliminar(); }} style={iconBtn("#DC2626")}>✕</button>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{isExpanded ? "▲" : "▼"}</span>
      </div>

      {/* Contenido expandido */}
      {isExpanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F3F4F6" }}>
          <div style={{ maxHeight: 400, overflowY: "auto", paddingTop: 12, fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {item.contenido}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => { try { navigator.clipboard.writeText(item.contenido); } catch {} }}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
            >
              📋 Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: "9px 12px", borderRadius: 30, border: "1px solid #E5E7EB",
  background: "#F9FAFB", color: "#374151", fontSize: 12, fontFamily: "inherit",
};

const iconBtn = (color) => ({
  width: 28, height: 28, borderRadius: 6, border: "none",
  background: "none", color, cursor: "pointer", fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "center",
});
