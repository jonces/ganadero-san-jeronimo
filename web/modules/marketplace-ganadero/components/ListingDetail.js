"use client";
import React, { useState } from "react";
import { MKT_CATEGORY_CONFIG }   from "../constants/categories.js";
import { LISTING_STATUS_CONFIG } from "../constants/listing-types.js";
import { addReview, getReviews } from "../services/marketplace-storage.js";
import { createOrder }           from "../services/order-service.js";
import { createQuote }           from "../services/order-service.js";
import ListingCard               from "./ListingCard.js";
import ChatPanel                 from "./ChatPanel.js";

const fmtCOP = v => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v ?? 0);

export default function ListingDetail({ listing, relatedListings = [], onBack, onView, isFavorite, onFavorite }) {
  const [tab,      setTab]      = useState("info");
  const [qty,      setQty]      = useState(1);
  const [review,   setReview]   = useState({ estrellas: 5, comentario: "" });
  const [reviews,  setReviews]  = useState(() => getReviews(listing?.id ?? ""));
  const [quoteMsg, setQuoteMsg] = useState("");
  const [quotePrc, setQuotePrc] = useState("");
  const [success,  setSuccess]  = useState("");

  if (!listing) return null;
  const catCfg = MKT_CATEGORY_CONFIG[listing.categoria] ?? {};

  const handleOrder = () => {
    createOrder({
      listingId:     listing.id,
      listingTitulo: listing.titulo,
      vendedor:      { id: listing.empresa_id, nombre: listing.empresa },
      comprador:     { id: "mi-empresa", nombre: "Mi Empresa" },
      cantidad:      qty,
      precio:        listing.precio,
    });
    setSuccess("¡Orden creada! El vendedor recibirá tu solicitud.");
  };

  const handleQuote = () => {
    if (!quotePrc) return;
    createQuote({
      listingId:         listing.id,
      listingTitulo:     listing.titulo,
      vendedor:          { id: listing.empresa_id, nombre: listing.empresa },
      comprador:         { id: "mi-empresa", nombre: "Mi Empresa" },
      precioSolicitado:  Number(quotePrc),
      cantidadSolicitada: qty,
      mensaje:           quoteMsg,
    });
    setSuccess("¡Cotización enviada! El vendedor responderá pronto.");
    setQuoteMsg(""); setQuotePrc("");
  };

  const handleReview = () => {
    if (!review.comentario.trim()) return;
    const updated = addReview(listing.id, { ...review, autor: "Mi Empresa", autor_id: "mi-empresa" });
    setReviews(updated);
    setReview({ estrellas: 5, comentario: "" });
  };

  const TABS = [
    { id: "info",     label: "Información" },
    { id: "comprar",  label: "Comprar / Cotizar" },
    { id: "resenas",  label: `Reseñas (${reviews.length})` },
    { id: "chat",     label: "Chat comercial" },
  ];

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: "#6366f1", fontSize: 13, fontWeight: 700, marginBottom: 12, padding: 0 }}>
        ← Volver al catálogo
      </button>

      {/* Header */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 20 }}>
        {/* Foto placeholder */}
        <div style={{
          width: 200, height: 180, flexShrink: 0,
          background: `linear-gradient(135deg, ${catCfg.bg ?? "#f9fafb"}, ${catCfg.color ?? "#e5e7eb"}30)`,
          borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64,
          border: "1.5px solid #e5e7eb",
        }}>
          {catCfg.icono ?? "📦"}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: catCfg.color, background: catCfg.bg, borderRadius: 4, padding: "2px 7px" }}>
              {catCfg.icono} {catCfg.label}
            </span>
            {listing.destacada && <span style={{ fontSize: 11, background: "#fef9c3", color: "#d97706", borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>⭐ Destacado</span>}
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#111827" }}>{listing.titulo}</h2>
          <p style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: catCfg.color ?? "#111827" }}>
            {fmtCOP(listing.precio)}
            {listing.precio_unidad && <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}> / {listing.unidad_ref}</span>}
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "#374151" }}>🏢 {listing.empresa}</p>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "#374151" }}>📍 {listing.ubicacion}</p>
          {listing.calificacion > 0 && (
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#d97706" }}>
              ⭐ {listing.calificacion?.toFixed(1)} — {listing.num_resenas} reseña{listing.num_resenas !== 1 ? "s" : ""}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setTab("comprar")} style={{
              border: "none", background: catCfg.color ?? "#6366f1", color: "#fff",
              borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 14,
            }}>Comprar ahora</button>
            <button onClick={() => onFavorite?.(listing.id)} style={{
              border:     `1.5px solid ${isFavorite ? "#fecaca" : "#e5e7eb"}`,
              background: isFavorite ? "#fef2f2" : "#fff",
              borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 14,
            }}>{isFavorite ? "❤️" : "🤍"}</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #f3f4f6", marginBottom: 18 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 14px", border: "none",
            borderBottom: tab === t.id ? "2.5px solid #6366f1" : "2.5px solid transparent",
            background: "none", cursor: "pointer",
            fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? "#4338ca" : "#6b7280", fontSize: 13,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "info" && (
        <div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{listing.descripcion}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginTop: 16 }}>
            {listing.raza        && <InfoChip label="Raza"        value={listing.raza} />}
            {listing.edad_meses  && <InfoChip label="Edad"        value={`${listing.edad_meses} meses`} />}
            {listing.peso_kg     && <InfoChip label="Peso"        value={`${listing.peso_kg} kg`} />}
            {listing.subcategoria&& <InfoChip label="Tipo"        value={listing.subcategoria} />}
            {listing.marca       && <InfoChip label="Marca"       value={listing.marca} />}
            {listing.unidad      && <InfoChip label="Unidad"      value={listing.unidad} />}
            {listing.cantidad_disponible && <InfoChip label="Disponible" value={`${listing.cantidad_disponible} unidades`} />}
            {listing.especialidad&& <InfoChip label="Especialidad" value={listing.especialidad} />}
            {listing.zona_cobertura && <InfoChip label="Cobertura" value={listing.zona_cobertura} />}
            {listing.experiencia_anos != null && <InfoChip label="Experiencia" value={`${listing.experiencia_anos} años`} />}
          </div>
        </div>
      )}

      {tab === "comprar" && (
        <div style={{ maxWidth: 480 }}>
          {success && (
            <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: 14 }}>
              <p style={{ margin: 0, color: "#16a34a", fontWeight: 700 }}>{success}</p>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>Cantidad</p>
            <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, width: 100 }} />
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6b7280" }}>
            Total estimado: <b style={{ color: "#111827", fontSize: 16 }}>{fmtCOP(listing.precio * qty)}</b>
          </p>
          <button onClick={handleOrder} style={{
            border: "none", background: catCfg.color ?? "#6366f1", color: "#fff",
            borderRadius: 8, padding: "11px 22px", cursor: "pointer", fontWeight: 700, fontSize: 14, marginBottom: 20,
          }}>
            Hacer pedido
          </button>

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14 }}>Solicitar cotización</p>
            <input type="number" placeholder="Precio que ofreces (COP)" value={quotePrc}
              onChange={e => setQuotePrc(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, marginBottom: 8, boxSizing: "border-box" }} />
            <textarea rows={3} placeholder="Mensaje para el vendedor…" value={quoteMsg}
              onChange={e => setQuoteMsg(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            <button onClick={handleQuote} style={{
              border: "none", background: "#f59e0b", color: "#fff",
              borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, marginTop: 8,
            }}>
              Enviar cotización
            </button>
          </div>

          {/* Métodos de pago */}
          <div style={{ marginTop: 20, padding: "12px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#374151" }}>Métodos de pago disponibles:</p>
            <p style={{ margin: 0, fontSize: 12, color: "#16a34a" }}>✅ Transferencia bancaria</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af" }}>🔜 Stripe · PayPal · Tarjeta (próximamente)</p>
          </div>
        </div>
      )}

      {tab === "resenas" && (
        <div>
          {reviews.map(r => (
            <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 10, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{r.autor}</p>
                <p style={{ margin: 0, fontSize: 13, color: "#d97706" }}>{"⭐".repeat(r.estrellas)}</p>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#374151" }}>{r.comentario}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>{new Date(r.ts).toLocaleDateString("es-CO")}</p>
            </div>
          ))}
          <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Dejar una reseña</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setReview(r => ({ ...r, estrellas: n }))} style={{
                  border: "none", background: "none", cursor: "pointer", fontSize: 22,
                  opacity: n <= review.estrellas ? 1 : 0.3,
                }}>⭐</button>
              ))}
            </div>
            <textarea rows={3} placeholder="Escribe tu experiencia…" value={review.comentario}
              onChange={e => setReview(r => ({ ...r, comentario: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            <button onClick={handleReview} style={{
              border: "none", background: "#6366f1", color: "#fff",
              borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, marginTop: 8,
            }}>
              Publicar reseña
            </button>
          </div>
        </div>
      )}

      {tab === "chat" && (
        <ChatPanel listingId={listing.id} vendedorId={listing.empresa_id} vendedorNombre={listing.empresa} />
      )}

      {/* Relacionados */}
      {relatedListings.length > 0 && (
        <div style={{ marginTop: 28, borderTop: "1px solid #e5e7eb", paddingTop: 18 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 15 }}>También te puede interesar</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {relatedListings.map(l => <ListingCard key={l.id} listing={l} onView={onView} compact />)}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", background: "#f9fafb" }}>
      <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "#111827" }}>{value}</p>
    </div>
  );
}
