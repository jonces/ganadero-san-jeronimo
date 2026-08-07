"use client";
import React, { useEffect, useState } from "react";
import { useMarketplace }      from "../hooks/useMarketplace.js";
import { useMyStore }          from "../hooks/useMyStore.js";
import { useOrders }           from "../hooks/useOrders.js";
import ListingCatalog          from "./ListingCatalog.js";
import ListingDetail           from "./ListingDetail.js";
import MyStore                 from "./MyStore.js";
import OrderCenter             from "./OrderCenter.js";
import IARecommendations       from "./IARecommendations.js";
import MarketAnalytics         from "./MarketAnalytics.js";

const TABS = [
  { id: "catalogo",       label: "Catálogo",        emoji: "🏪" },
  { id: "ia",             label: "IA Recomienda",   emoji: "🤖" },
  { id: "mi-tienda",      label: "Mi Tienda",       emoji: "🏬" },
  { id: "pedidos",        label: "Pedidos",         emoji: "📦" },
  { id: "analisis",       label: "Análisis",        emoji: "📊" },
];

export default function MarketplaceShell() {
  const [tab, setTab] = useState("catalogo");
  const mkt   = useMarketplace();
  const store = useMyStore();
  const ords  = useOrders();

  // Carga analytics al cambiar a ese tab
  useEffect(() => {
    if (tab === "analisis") mkt.loadAnalytics();
  }, [tab]);

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 1060, margin: "0 auto", padding: "0 4px" }}>
      {/* Header */}
      <div style={{ padding: "20px 4px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827" }}>
              🏪 Marketplace Ganadero
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Compra, vende y conecta — ganado, genética, insumos, equipos y servicios
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Stat n={mkt.listings.length} label="disponibles" color="#6366f1" />
            <Stat n={store.stats.ordenesPend} label="pedidos pend." color="#d97706" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", overflowX: "auto", gap: 2, borderBottom: "2px solid #f3f4f6", marginBottom: 18 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); mkt.setSelectedId(null); }} style={{
            padding: "10px 16px", border: "none",
            borderBottom: tab === t.id ? "2.5px solid #6366f1" : "2.5px solid transparent",
            background: "none", cursor: "pointer",
            fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? "#4338ca" : "#6b7280",
            fontSize: 13, whiteSpace: "nowrap",
          }}>{t.emoji} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 52 }}>
        {tab === "catalogo" && (
          mkt.selectedId
            ? <ListingDetail
                listing={mkt.selectedListing}
                relatedListings={mkt.relatedListings}
                onBack={() => mkt.setSelectedId(null)}
                onView={mkt.handleView}
                isFavorite={mkt.isFavorite(mkt.selectedId)}
                onFavorite={mkt.handleToggleFavorite}
              />
            : <ListingCatalog
                listings={mkt.listings}
                filters={mkt.filters}
                onFilter={mkt.applyFilter}
                onReset={mkt.resetFilters}
                onView={mkt.handleView}
                onFavorite={mkt.handleToggleFavorite}
                isFavorite={mkt.isFavorite}
                counts={mkt.counts}
              />
        )}

        {tab === "ia" && (
          <IARecommendations
            recommendations={mkt.iaRecs}
            onView={id => { mkt.handleView(id); setTab("catalogo"); }}
            onFavorite={mkt.handleToggleFavorite}
            isFavorite={mkt.isFavorite}
            onLoad={() => mkt.loadIARecommendations()}
          />
        )}

        {tab === "mi-tienda" && (
          <MyStore
            myListings={store.myListings}
            stats={store.stats}
            profile={store.profile}
            onAdd={store.addListing}
            onEdit={store.editListing}
            onDelete={store.deleteListing}
            onSaveProfile={store.saveProfile}
            showForm={store.showForm}
            setShowForm={store.setShowForm}
          />
        )}

        {tab === "pedidos" && (
          <OrderCenter
            orders={ords.orders}
            quotes={ords.quotes}
            onRefresh={ords.reload}
          />
        )}

        {tab === "analisis" && (
          <MarketAnalytics analytics={mkt.analytics} />
        )}
      </div>
    </div>
  );
}

function Stat({ n, label, color }) {
  return (
    <div style={{ border: `1.5px solid ${color}20`, borderRadius: 8, background: "#fff", padding: "8px 14px", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{n}</div>
      <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
    </div>
  );
}
