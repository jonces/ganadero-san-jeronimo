"use client";
import React from "react";
import ListingCard from "./ListingCard.js";

export default function IARecommendations({ recommendations, onView, onFavorite, isFavorite, onLoad }) {
  if (!recommendations.length) {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12 }}>
        <p style={{ fontSize: 28, margin: "0 0 8px" }}>🤖</p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1e40af" }}>Recomendaciones del Centro IA</p>
        <p style={{ margin: "6px 0 12px", fontSize: 13, color: "#3b82f6" }}>
          El motor predictivo analizará tu finca y sugerirá productos y servicios relevantes.
        </p>
        <button onClick={onLoad} style={{
          border: "none", background: "#3b82f6", color: "#fff",
          borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13,
        }}>
          🔮 Generar recomendaciones
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 14, padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#1e40af" }}>
          🤖 <b>El Centro IA detectó oportunidades</b> — estos productos y servicios pueden ayudar a tu finca basados en el análisis predictivo.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {recommendations.map(l => (
          <div key={l.id}>
            <div style={{ marginBottom: 4, padding: "4px 8px", background: "#eff6ff", borderRadius: 6 }}>
              <p style={{ margin: 0, fontSize: 10, color: "#2563eb" }}>🤖 {l.razon}</p>
            </div>
            <ListingCard listing={l} onView={onView} onFavorite={onFavorite} isFavorite={isFavorite(l.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
