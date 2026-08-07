"use client";
import { useState, useEffect, useCallback } from "react";
import { CURSO_CATALOG } from "../constants/catalog.js";
import { getProgresoGlobal, getCursosRecientes, getEstadisticasGlobales } from "../services/academia-storage.js";
import { getRecomendaciones, buscarCursos } from "../services/recommendations-engine.js";

/**
 * Hook principal de la Academia Ganadera.
 * Gestiona catálogo, progreso, recomendaciones y búsqueda.
 */
export function useAcademia({ alerts = [], dashData = null } = {}) {
  const [progreso,       setProgreso]       = useState({});
  const [estadisticas,   setEstadisticas]   = useState(null);
  const [recomendados,   setRecomendados]   = useState([]);
  const [recientes,      setRecientes]      = useState([]);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [filtroCategoria,setFiltroCategoria]= useState("");
  const [filtroNivel,    setFiltroNivel]    = useState("");
  const [resultados,     setResultados]     = useState([]);

  const reload = useCallback(() => {
    const prog = getProgresoGlobal();
    const stats = getEstadisticasGlobales();
    const recs  = getRecomendaciones({ alerts, dashData, limit: 6 });
    const recIds = getCursosRecientes(5);
    const recCursos = recIds
      .map(id => CURSO_CATALOG.find(c => c.id === id))
      .filter(Boolean)
      .map(c => ({ curso: c, progreso: prog[c.id] ?? null }));

    setProgreso(prog);
    setEstadisticas(stats);
    setRecomendados(recs);
    setRecientes(recCursos);
  }, [alerts, dashData]);

  useEffect(() => { reload(); }, [reload]);

  // Búsqueda y filtrado reactivos
  useEffect(() => {
    const found = buscarCursos(searchQuery, {
      categoria: filtroCategoria || undefined,
      nivel:     filtroNivel     || undefined,
    });
    setResultados(found.map(c => ({ curso: c, progreso: progreso[c.id] ?? null })));
  }, [searchQuery, filtroCategoria, filtroNivel, progreso]);

  const cursosEnProgreso = CURSO_CATALOG
    .filter(c => progreso[c.id]?.pct > 0 && !progreso[c.id]?.completado)
    .map(c => ({ curso: c, progreso: progreso[c.id] }));

  const cursosCompletados = CURSO_CATALOG
    .filter(c => progreso[c.id]?.completado)
    .map(c => ({ curso: c, progreso: progreso[c.id] }));

  return {
    // Catálogo
    catalogo: CURSO_CATALOG,
    resultados,
    // Secciones
    recomendados,
    recientes,
    enProgreso:  cursosEnProgreso,
    completados: cursosCompletados,
    // Progreso global
    progreso,
    estadisticas,
    // Filtros
    searchQuery,     setSearchQuery,
    filtroCategoria, setFiltroCategoria,
    filtroNivel,     setFiltroNivel,
    // Acciones
    reload,
  };
}
