"use client";
import React, { useState } from "react";
import ListingCard from "./ListingCard.js";
import { CATEGORIAS_LISTA, RAZAS_BOVINAS, GRUPOS_CONFIG } from "../constants/categories.js";

const ORDENES = [
  { value: "relevancia",   label: "Relevancia" },
  { value: "reciente",     label: "Más recientes" },
  { value: "precio_asc",   label: "Precio: menor a mayor" },
  { value: "precio_desc",  label: "Precio: mayor a menor" },
  { value: "calificacion", label: "Mejor calificados" },
  { value: "vistas",       label: "Más vistos" },
];

export default function ListingCatalog({ listings, filters, onFilter, onReset, onView, onFavorite, isFavorite, counts }) {
  const [showFilters, setShowFilters] = useState(false);

  const grupos = {};
  CATEGORIAS_LISTA.forEach(c => {
    const g = c.grupo ?? "otros";
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(c);
  });

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* Sidebar filtros */}
      <div style={{
        width: 220, flexShrink: 0,
        display: "block",
      }}>
        {/* Búsqueda */}
        <div style={{ marginBottom: 14 }}>
          <input
            value={filters.q}
            onChange={e => onFilter("q", e.target.value)}
            placeholder="🔍 Buscar…"
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
          />
        </div>

        {/* Categorías */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 12, color: "#374151" }}>CATEGORÍA</p>
          <button onClick={() => onFilter("categoria", null)} style={chipStyle(!filters.categoria)}>
            Todas ({listings.length})
          </button>
          {Object.entries(grupos).map(([grupo, cats]) => (
            <div key={grupo} style={{ marginBottom: 6 }}>
              <p style={{ margin: "6px 0 4px", fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>
                {GRUPOS_CONFIG[grupo]?.icono} {GRUPOS_CONFIG[grupo]?.label ?? grupo}
              </p>
              {cats.map(c => (
                <button key={c.id} onClick={() => onFilter("categoria", filters.categoria === c.id ? null : c.id)}
                  style={{ ...chipStyle(filters.categoria === c.id), display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 2 }}>
                  <span>{c.icono} {c.label}</span>
                  {counts?.[c.id] > 0 && <span style={{ fontSize: 10, color: "#9ca3af" }}>{counts[c.id]}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Precio */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 12, color: "#374151" }}>PRECIO (COP)</p>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="number" placeholder="Min"
              value={filters.precioMin ?? ""}
              onChange={e => onFilter("precioMin", e.target.value ? Number(e.target.value) : null)}
              style={{ width: "50%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }}
            />
            <input type="number" placeholder="Max"
              value={filters.precioMax ?? ""}
              onChange={e => onFilter("precioMax", e.target.value ? Number(e.target.value) : null)}
              style={{ width: "50%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }}
            />
          </div>
        </div>

        {/* Ubicación */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 12, color: "#374151" }}>UBICACIÓN</p>
          <input value={filters.ubicacion}
            onChange={e => onFilter("ubicacion", e.target.value)}
            placeholder="Dpto, ciudad…"
            style={{ width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, boxSizing: "border-box" }}
          />
        </div>

        {/* Raza */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 12, color: "#374151" }}>RAZA</p>
          <select value={filters.raza} onChange={e => onFilter("raza", e.target.value)}
            style={{ width: "100%", padding: "7px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }}>
            <option value="">Todas</option>
            {RAZAS_BOVINAS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Calificación mínima */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 12, color: "#374151" }}>CALIFICACIÓN MÍNIMA</p>
          {[4, 3, 2].map(n => (
            <button key={n} onClick={() => onFilter("calificacionMin", filters.calificacionMin === n ? null : n)}
              style={chipStyle(filters.calificacionMin === n)}>
              {"⭐".repeat(n)} {n}+
            </button>
          ))}
        </div>

        {/* Destacadas */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
            <input type="checkbox" checked={!!filters.soloDestacadas}
              onChange={e => onFilter("soloDestacadas", e.target.checked)}
              style={{ width: 16, height: 16 }} />
            Solo destacadas ⭐
          </label>
        </div>

        <button onClick={onReset} style={{
          width: "100%", border: "1px solid #e5e7eb", background: "#f9fafb",
          borderRadius: 8, padding: "8px", cursor: "pointer", fontSize: 12, color: "#6b7280",
        }}>
          Limpiar filtros
        </button>
      </div>

      {/* Resultados */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            <b style={{ color: "#111827" }}>{listings.length}</b> publicaciones
            {filters.q && <span> para "<b>{filters.q}</b>"</span>}
          </p>
          <select value={filters.orden} onChange={e => onFilter("orden", e.target.value)}
            style={{ padding: "7px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, background: "#fff" }}>
            {ORDENES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        {listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
            <p style={{ fontSize: 40, margin: "0 0 10px" }}>🔍</p>
            <p style={{ fontWeight: 600, fontSize: 15 }}>Sin resultados</p>
            <p style={{ fontSize: 13 }}>Prueba con otros filtros.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {listings.map(l => (
              <ListingCard key={l.id} listing={l} onView={onView}
                onFavorite={onFavorite} isFavorite={isFavorite(l.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function chipStyle(active) {
  return {
    display:    "block",
    width:      "100%",
    textAlign:  "left",
    border:     active ? "1.5px solid #6366f1" : "1px solid #e5e7eb",
    borderRadius: 6, padding: "5px 8px", cursor: "pointer",
    background: active ? "#eef2ff" : "transparent",
    color:      active ? "#4338ca" : "#374151",
    fontSize:   12, fontWeight: active ? 700 : 400, marginBottom: 3,
  };
}
