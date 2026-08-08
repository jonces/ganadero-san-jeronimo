"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api.js";

export function useFincaData() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const safeApi = useCallback(async (path) => {
    try { return await api(path); } catch { return null; }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, insumos, incidentes] = await Promise.all([
        safeApi("/dashboard"),
        safeApi("/insumos"),
        safeApi("/incidentes"),
      ]);
      if (!dashboard) {
        setError("No se pudo conectar con el servidor");
      } else {
        setData({ dashboard, insumos: Array.isArray(insumos) ? insumos : [], incidentes: Array.isArray(incidentes) ? incidentes : [] });
      }
    } catch (e) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [safeApi]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
