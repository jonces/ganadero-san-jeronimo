"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { searchListings, getRelatedListings }  from "../services/listing-service.js";
import { getMarketAnalytics }                  from "../services/analytics-service.js";
import { getIARecommendations }                from "../services/ia-recommender.js";
import { getFavorites, toggleFavorite, trackView } from "../services/marketplace-storage.js";

const DEFAULT_FILTERS = {
  q: "", categoria: null, tipo: null, ubicacion: "",
  precioMin: null, precioMax: null, raza: "", empresa: "",
  soloDestacadas: false, calificacionMin: null, orden: "relevancia",
};

export function useMarketplace() {
  const [listings,     setListings]     = useState([]);
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS);
  const [favorites,    setFavorites]    = useState([]);
  const [analytics,    setAnalytics]    = useState(null);
  const [iaRecs,       setIaRecs]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [selectedId,   setSelectedId]   = useState(null);

  // Carga y búsqueda
  const search = useCallback((f = filters) => {
    setLoading(true);
    try {
      const result = searchListings(f);
      setListings(result);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { search(DEFAULT_FILTERS); }, []);
  useEffect(() => { setFavorites(getFavorites()); }, []);

  const applyFilter = useCallback((key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    search(next);
  }, [filters, search]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    search(DEFAULT_FILTERS);
  }, [search]);

  const handleToggleFavorite = useCallback((id) => {
    const updated = toggleFavorite(id);
    setFavorites(updated);
  }, []);

  const handleView = useCallback((id) => {
    trackView(id);
    setSelectedId(id);
  }, []);

  // Analytics (calculado una vez)
  const loadAnalytics = useCallback(() => {
    setAnalytics(getMarketAnalytics());
  }, []);

  // Recomendaciones IA (acepta predictions del motor predictivo)
  const loadIARecommendations = useCallback((predictions = [], alerts = []) => {
    const recs = getIARecommendations({ predictions, alerts, limit: 6 });
    setIaRecs(recs);
  }, []);

  const selectedListing = useMemo(
    () => selectedId ? listings.find(l => l.id === selectedId) ?? null : null,
    [selectedId, listings]
  );

  const relatedListings = useMemo(
    () => selectedListing ? getRelatedListings(selectedListing) : [],
    [selectedListing]
  );

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  const counts = useMemo(() => {
    const byCat = {};
    listings.forEach(l => { byCat[l.categoria] = (byCat[l.categoria] ?? 0) + 1; });
    return byCat;
  }, [listings]);

  return {
    listings, filters, favorites, analytics, iaRecs,
    loading, selectedId, selectedListing, relatedListings, counts,
    applyFilter, resetFilters, search,
    handleToggleFavorite, handleView, setSelectedId,
    loadAnalytics, loadIARecommendations,
    isFavorite,
  };
}
