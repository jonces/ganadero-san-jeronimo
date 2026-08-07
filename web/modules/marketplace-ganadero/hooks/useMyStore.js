"use client";
import { useState, useEffect, useCallback } from "react";
import { getListings, upsertProfile, getProfiles } from "../services/marketplace-storage.js";
import { createListing, updateListing, removeListing } from "../services/listing-service.js";
import { getOrdersByUser } from "../services/order-service.js";
import { getQuotesByUser } from "../services/order-service.js";

const MY_EMPRESA_ID = "mi-empresa"; // En producción: del token de sesión

export function useMyStore() {
  const [myListings, setMyListings] = useState([]);
  const [myOrders,   setMyOrders]   = useState([]);
  const [myQuotes,   setMyQuotes]   = useState([]);
  const [profile,    setProfile]    = useState(null);
  const [showForm,   setShowForm]   = useState(false);

  const reload = useCallback(() => {
    const all      = getListings();
    const mine     = all.filter(l => l.empresa_id === MY_EMPRESA_ID && l.status !== "eliminada");
    const orders   = getOrdersByUser(MY_EMPRESA_ID);
    const quotes   = getQuotesByUser(MY_EMPRESA_ID);
    const profiles = getProfiles();
    setMyListings(mine);
    setMyOrders(orders);
    setMyQuotes(quotes);
    setProfile(profiles[MY_EMPRESA_ID] ?? { nombre: "Mi Tienda", empresa_id: MY_EMPRESA_ID });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addListing = useCallback((data) => {
    createListing({ ...data, empresa_id: MY_EMPRESA_ID, empresa: profile?.nombre ?? "Mi Tienda" });
    reload();
  }, [profile, reload]);

  const editListing = useCallback((id, patch) => {
    updateListing(id, patch);
    reload();
  }, [reload]);

  const deleteListing = useCallback((id) => {
    removeListing(id);
    reload();
  }, [reload]);

  const saveProfile = useCallback((data) => {
    upsertProfile(MY_EMPRESA_ID, data);
    setProfile({ ...data, empresa_id: MY_EMPRESA_ID });
  }, []);

  const stats = {
    totalListings: myListings.length,
    activas:       myListings.filter(l => l.status === "activa").length,
    vendidas:      myListings.filter(l => l.status === "vendida").length,
    totalVistas:   myListings.reduce((s, l) => s + (l.vistas ?? 0), 0),
    totalFavs:     myListings.reduce((s, l) => s + (l.favoritos ?? 0), 0),
    ordenesPend:   myOrders.filter(o => o.status === "pendiente").length,
  };

  return {
    myListings, myOrders, myQuotes, profile, showForm, stats,
    setShowForm, addListing, editListing, deleteListing, saveProfile, reload,
  };
}
