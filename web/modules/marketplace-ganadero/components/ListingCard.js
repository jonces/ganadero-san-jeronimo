"use client";
import React from "react";
import { MKT_CATEGORY_CONFIG }    from "../constants/categories.js";
import { LISTING_STATUS_CONFIG }  from "../constants/listing-types.js";

const fmtCOP = v => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(v ?? 0);
const Stars  = ({ n }) => "⭐".repeat(Math.round(n ?? 0)) || "—";

export default function ListingCard({ listing, onView, onFavorite, isFavorite, compact = false }) {
  if (!listing) return null;
  const catCfg    = MKT_CATEGORY_CONFIG[listing.categoria] ?? {};
  const statusCfg = LISTING_STATUS_CONFIG[listing.status]  ?? LISTING_STATUS_CONFIG.activa;

  return (
    <div onClick={() => onView?.(listing.id)} style={{
      border:       "1.5px solid #e5e7eb",
      borderRadius: 12,
      background:   "#fff",
      overflow:     "hidden",
      cursor:       "pointer",
      transition:   "box-shadow .15s",
      position:     "relative",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px #0001"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Imagen placeholder */}
      <div style={{
        height:     compact ? 90 : 140,
        background: `linear-gradient(135deg, ${catCfg.bg ?? "#f9fafb"}, ${catCfg.color ?? "#e5e7eb"}20)`,
        display:    "flex", alignItems: "center", justifyContent: "center",
        fontSize:   compact ? 36 : 52,
        position:   "relative",
      }}>
        {catCfg.icono ?? "📦"}
        {listing.destacada && (
          <span style={{
            position: "absolute", top: 8, left: 8,
            background: "#f59e0b", color: "#fff",
            fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 6px",
          }}>⭐ Destacado</span>
        )}
        {onFavorite && (
          <button onClick={e => { e.stopPropagation(); onFavorite(listing.id); }} style={{
            position: "absolute", top: 8, right: 8,
            background: isFavorite ? "#fef2f2" : "#fff",
            border:     isFavorite ? "1px solid #fecaca" : "1px solid #e5e7eb",
            borderRadius: "50%", width: 30, height: 30, cursor: "pointer",
            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}>{isFavorite ? "❤️" : "🤍"}</button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: compact ? "10px 12px" : "14px 14px 12px" }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: catCfg.color ?? "#374151",
            background: catCfg.bg ?? "#f3f4f6", borderRadius: 4, padding: "2px 6px",
          }}>{catCfg.icono} {catCfg.label}</span>
          {listing.raza && (
            <span style={{ fontSize: 10, color: "#6b7280", background: "#f3f4f6", borderRadius: 4, padding: "2px 6px" }}>
              {listing.raza}
            </span>
          )}
        </div>

        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: compact ? 13 : 14, color: "#111827",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{listing.titulo}</p>

        {!compact && (
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280", lineHeight: 1.4,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>{listing.descripcion}</p>
        )}

        <p style={{ margin: "0 0 8px", fontSize: compact ? 16 : 18, fontWeight: 800, color: catCfg.color ?? "#111827" }}>
          {fmtCOP(listing.precio)}
          {listing.precio_unidad && <span style={{ fontSize: 11, fontWeight: 400, color: "#6b7280" }}> / {listing.unidad_ref}</span>}
        </p>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
              🏢 {listing.empresa}
            </p>
            <p style={{ margin: "1px 0 0", fontSize: 11, color: "#9ca3af" }}>📍 {listing.ubicacion}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            {listing.calificacion > 0 && (
              <p style={{ margin: 0, fontSize: 11, color: "#d97706" }}>
                ⭐ {listing.calificacion?.toFixed(1)} ({listing.num_resenas})
              </p>
            )}
            <p style={{ margin: "1px 0 0", fontSize: 10, color: "#9ca3af" }}>👁 {listing.vistas ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
