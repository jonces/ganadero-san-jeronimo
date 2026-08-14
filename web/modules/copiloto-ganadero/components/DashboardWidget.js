"use client";
import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { analyzeFarm, generateFarmSummary } from "../services/farm-analyzer.js";
import { sortByPriority }                   from "../constants/priorities.js";
import { registrarAccion }                  from "../services/copiloto-storage.js";
import { AlertaCard }                       from "./AlertaCard.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function apiFetch(path) {
  const token   = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const SEMAFORO_CFG = {
  verde:    { bg: "#F0FDF4", border: "#BBF7D0", color: "#059669", icono: "🟢", label: "Finca saludable" },
  amarillo: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", icono: "🟡", label: "Atención requerida" },
  rojo:     { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", icono: "🔴", label: "Situación crítica" },
};

/**
 * Widget compacto del Copiloto para incrustar en el Dashboard.
 * Muestra semáforo + top 3 alertas + botón de acceso al centro completo.
 */
export function DashboardWidget() {
  const router  = useRouter();
  const [alerts,  setAlerts]  = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch("/dashboard?periodo=mes&moneda=COP");
        if (!alive) return;
        const generatedAlerts  = sortByPriority(analyzeFarm(data, {}));
        const generatedSummary = generateFarmSummary(data, generatedAlerts);
        setAlerts(generatedAlerts);
        setSummary(generatedSummary);
      } catch {
        // Falla silenciosamente — el widget no es crítico
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const semCfg     = summary ? (SEMAFORO_CFG[summary.semaforo] ?? SEMAFORO_CFG.amarillo) : null;
  const topAlertas = alerts.slice(0, 3);
  const criticas   = alerts.filter(a => a.priority === "critica").length;

  return (
    <div style={{
      background: "rgba(10,20,30,0.28)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(255,255,255,.18)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 10px 40px rgba(0,0,0,.35)",
    }}>
      {/* Header */}
      <div style={{
        padding: "9px 14px 8px",
        borderBottom: "1px solid rgba(255,255,255,.10)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>
            🧠 Copiloto Ganadero
          </h3>
          {loading ? (
            <p style={{ margin: "1px 0 0", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>Analizando…</p>
          ) : semCfg ? (
            <p style={{ margin: "1px 0 0", fontSize: 10, fontWeight: 600, color: semCfg.color }}>
              {semCfg.icono} {semCfg.label} · Puntaje {summary?.puntaje ?? "—"}/100
            </p>
          ) : null}
        </div>
        {criticas > 0 && (
          <div style={{ background: "#DC2626", color: "#FFF", borderRadius: 20, padding: "3px 8px", fontSize: 10, fontWeight: 800 }}>
            🚨 {criticas} CRÍTICA{criticas > 1 ? "S" : ""}
          </div>
        )}
      </div>

      {/* Alertas top 3 */}
      <div style={{ padding: "8px 12px" }}>
        {loading ? (
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "8px 0" }}>
            Cargando análisis…
          </p>
        ) : topAlertas.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "#4ade80", textAlign: "center", padding: "8px 0", fontWeight: 600 }}>
            ✅ No hay alertas activas
          </p>
        ) : (
          topAlertas.map(a => (
            <AlertaCard
              key={a.id}
              alerta={a}
              compact
              onAccion={(id, type, accion) => {
                registrarAccion(id, type, accion);
                if (accion !== "descartar") router.push("/ia/copiloto");
              }}
            />
          ))
        )}
      </div>

      {/* Pie */}
      {!loading && (
        <div style={{
          padding: "7px 12px",
          borderTop: "1px solid rgba(255,255,255,.10)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.40)" }}>
            {alerts.length} alertas · {summary?.texto ?? ""}
          </span>
          <button
            onClick={() => router.push("/ia/copiloto")}
            style={{
              padding: "4px 12px", borderRadius: 20, border: "none",
              background: "#6366F1", color: "#FFF",
              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Ver centro →
          </button>
        </div>
      )}
    </div>
  );
}
