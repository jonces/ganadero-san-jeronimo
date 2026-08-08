"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api.js";

export function useFincaData() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, insumos, incidentes] = await Promise.all([
        api("/dashboard"),
        api("/insumos"),
        api("/incidentes"),
      ]);
      setData({ dashboard, insumos: insumos ?? [], incidentes: incidentes ?? [] });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
