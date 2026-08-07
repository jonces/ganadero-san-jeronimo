"use client";
import React, { useState } from "react";
import ListingCard  from "./ListingCard.js";
import ListingForm  from "./ListingForm.js";
import { LISTING_STATUS_CONFIG } from "../constants/listing-types.js";

export default function MyStore({ myListings, stats, profile, onAdd, onEdit, onDelete, onSaveProfile, showForm, setShowForm }) {
  const [editingListing, setEditingListing] = useState(null);
  const [editProfile,    setEditProfile]    = useState(false);
  const [profileForm,    setProfileForm]    = useState(profile ?? {});

  const handleSubmit = (data) => {
    if (editingListing) {
      onEdit(editingListing.id, data);
      setEditingListing(null);
    } else {
      onAdd(data);
    }
    setShowForm(false);
  };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Publicaciones",  n: stats.totalListings, color: "#6366f1" },
          { label: "Activas",        n: stats.activas,       color: "#16a34a" },
          { label: "Vendidas",       n: stats.vendidas,      color: "#2563eb" },
          { label: "Total vistas",   n: stats.totalVistas,   color: "#d97706" },
          { label: "Favoritos",      n: stats.totalFavs,     color: "#ec4899" },
          { label: "Pedidos pend.",  n: stats.ordenesPend,   color: "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ border: `1.5px solid ${s.color}20`, borderRadius: 8, background: "#fff", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.n}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Perfil de empresa */}
      {!editProfile ? (
        <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", background: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, background: "#eef2ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            🏢
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#111827" }}>{profile?.nombre ?? "Mi Tienda"}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{profile?.descripcion ?? "Sin descripción"}</p>
          </div>
          <button onClick={() => { setProfileForm(profile ?? {}); setEditProfile(true); }} style={{
            border: "1.5px solid #e5e7eb", background: "#f9fafb", color: "#374151",
            borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12,
          }}>✏️ Editar perfil</button>
        </div>
      ) : (
        <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, padding: 16, background: "#f9fafb", marginBottom: 16 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>Editar perfil de empresa</p>
          {[
            { key: "nombre",      label: "Nombre de la empresa", placeholder: "Mi Empresa Ganadera" },
            { key: "descripcion", label: "Descripción",          placeholder: "Describe tu empresa…" },
            { key: "contacto",    label: "Contacto / WhatsApp",  placeholder: "+57 300..." },
            { key: "ubicacion",   label: "Ubicación",            placeholder: "Bogotá, Colombia" },
          ].map(f => (
            <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#374151", fontWeight: 600, marginBottom: 10 }}>
              {f.label}
              <input value={profileForm[f.key] ?? ""} onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, background: "#fff" }} />
            </label>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onSaveProfile(profileForm); setEditProfile(false); }} style={{
              border: "none", background: "#6366f1", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13,
            }}>Guardar</button>
            <button onClick={() => setEditProfile(false)} style={{
              border: "1px solid #e5e7eb", background: "#fff", color: "#374151", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13,
            }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={() => { setEditingListing(null); setShowForm(true); }} style={{
          border: "none", background: "#6366f1", color: "#fff",
          borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13,
        }}>
          ➕ Nueva publicación
        </button>
      </div>

      {/* Form */}
      {(showForm || editingListing) && (
        <div style={{ marginBottom: 20 }}>
          <ListingForm
            initial={editingListing ?? {}}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingListing(null); }}
          />
        </div>
      )}

      {/* Listings */}
      {myListings.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🏪</p>
          <p style={{ fontWeight: 600, color: "#374151" }}>Tu tienda está vacía</p>
          <p style={{ fontSize: 13 }}>Crea tu primera publicación para empezar a vender.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {myListings.map(l => {
          const cfg = LISTING_STATUS_CONFIG[l.status] ?? LISTING_STATUS_CONFIG.activa;
          return (
            <div key={l.id} style={{ position: "relative" }}>
              <span style={{
                position: "absolute", top: 8, right: 8, zIndex: 2,
                fontSize: 10, fontWeight: 700, color: cfg.color,
                background: cfg.bg, border: `1px solid ${cfg.color}40`,
                borderRadius: 4, padding: "2px 6px",
              }}>{cfg.icono} {cfg.label}</span>
              <ListingCard listing={l} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button onClick={() => { setEditingListing(l); setShowForm(false); }} style={{
                  flex: 1, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151",
                  borderRadius: 6, padding: "6px", cursor: "pointer", fontSize: 12,
                }}>✏️ Editar</button>
                <button onClick={() => onDelete(l.id)} style={{
                  flex: 1, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626",
                  borderRadius: 6, padding: "6px", cursor: "pointer", fontSize: 12,
                }}>🗑 Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
