"use client";
import { useState, useEffect, useCallback } from "react";
import { analyzeFarm, generateFarmSummary } from "../services/farm-analyzer.js";
import { generateAllPlans }                 from "../services/plan-generator.js";
import { sortByPriority }                   from "../constants/priorities.js";
import { ALERT_TYPE_CONFIG }               from "../constants/alert-types.js";
import { registrarAccion, addHistorial }    from "../services/copiloto-storage.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function apiFetch(path) {
  const token   = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Hook principal del Copiloto Ganadero.
 * Carga datos, analiza y expone alertas, planes y resumen.
 */
export function useCopiloto({ periodo = "mes", moneda = "COP" } = {}) {
  const [dashData,  setDashData]  = useState(null);
  const [alerts,    setAlerts]    = useState([]);
  const [planes,    setPlanes]    = useState(null);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Carga el dashboard principal
      const data = await apiFetch(`/dashboard?periodo=${periodo}&moneda=${moneda}`);
      setDashData(data);

      // Intentar cargar datos adicionales en paralelo (fallan silenciosamente)
      const [eventos, incidentes, insumos] = await Promise.allSettled([
        apiFetch("/eventos?proximos=true&dias=7"),
        apiFetch("/incidentes?estado=abierto"),
        apiFetch("/insumos?proximos_vencer=true&dias=30"),
      ]);

      const extras = {
        eventos:    eventos.status    === "fulfilled" ? eventos.value    : [],
        incidentes: incidentes.status === "fulfilled" ? incidentes.value : [],
        insumos:    insumos.status    === "fulfilled" ? insumos.value    : [],
      };

      const generatedAlerts = sortByPriority(analyzeFarm(data, extras));
      const generatedPlanes = generateAllPlans(generatedAlerts);
      const generatedSummary = generateFarmSummary(data, generatedAlerts);

      setAlerts(generatedAlerts);
      setPlanes(generatedPlanes);
      setSummary(generatedSummary);
      setLastFetch(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodo, moneda]);

  useEffect(() => { load(); }, [load]);

  // ── Acciones del usuario sobre alertas ────────────────────────────────────

  const accionAlerta = useCallback((alertId, alertType, accion) => {
    registrarAccion(alertId, alertType, accion);
    addHistorial({ alertId, alertType, accion });

    if (accion === "descartar") {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  }, []);

  const refresh = useCallback(() => { load(); }, [load]);

  const alertasPorCategoria = useCallback((categoria) => {
    return alerts.filter(a => ALERT_TYPE_CONFIG[a.type]?.categoria === categoria);
  }, [alerts]);

  const alertasCriticas = alerts.filter(a => a.priority === "critica");
  const alertasAltas    = alerts.filter(a => a.priority === "alta");
  const totalAlertas    = alerts.length;

  return {
    // Datos
    dashData,
    alerts,
    planes,
    summary,
    // Estado
    loading,
    error,
    lastFetch,
    // Agregados
    alertasCriticas,
    alertasAltas,
    totalAlertas,
    // Acciones
    accionAlerta,
    refresh,
    alertasPorCategoria,
  };
}
