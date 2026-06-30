"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const MODULO_COLORS = {
  "Tablón": "#2d9e3f",
  "Animales": "#f59e0b",
  "Ventas": "#10b981",
  "Gastos": "#8b5cf6",
  "Incidentes": "#ef4444",
  "Equipo": "#3b82f6",
  "Documentos": "#06b6d4",
};

const MODULO_ICONS = {
  "Tablón": "📢",
  "Animales": "🐄",
  "Ventas": "💰",
  "Gastos": "💸",
  "Incidentes": "🚨",
  "Equipo": "👥",
  "Documentos": "📄",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} día${days > 1 ? "s" : ""}`;
}

export default function ActividadPage() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("Todos");

  useEffect(() => {
    api("/actividad").then(data => {
      setLogs(Array.isArray(data) ? data : []);
      setCargando(false);
    }).catch(() => setCargando(false));
  }, []);

  const modulos = ["Todos", ...new Set(logs.map(l => l.modulo))];
  const filtered = filtro === "Todos" ? logs : logs.filter(l => l.modulo === filtro);

  const glass = { background: "rgba(5,25,12,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };

  return (
    <AppLayout title="Registro de Actividad" subtitle="Historial del sistema">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {modulos.map(m => (
            <button key={m} onClick={() => setFiltro(m)}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
              style={{
                background: filtro === m ? "rgba(45,158,63,0.5)" : "rgba(255,255,255,0.08)",
                border: filtro === m ? "1px solid rgba(45,158,63,0.7)" : "1px solid rgba(255,255,255,0.15)",
                color: filtro === m ? "#86efac" : "rgba(255,255,255,0.6)",
              }}>
              {MODULO_ICONS[m] || "🔧"} {m}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="text-white/50 text-center py-16 text-lg">Cargando actividad...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl p-12 text-center" style={glass}>
            <div className="text-5xl mb-4">📋</div>
            <p className="text-white/50">No hay actividad registrada todavía.</p>
            <p className="text-white/30 text-sm mt-1">Cada acción en el sistema aparecerá aquí.</p>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={glass}>
            {filtered.map((log, i) => {
              const color = MODULO_COLORS[log.modulo] || "#6b7280";
              return (
                <div key={log.id}
                  className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/5"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                    style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
                    {MODULO_ICONS[log.modulo] || "🔧"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{log.usuario?.nombre || "Usuario"}</span>
                      <span className="text-white/40 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${color}22`, color }}>
                        {log.modulo}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">{log.accion}</p>
                    {log.detalle && <p className="text-white/40 text-xs mt-0.5 truncate">{log.detalle}</p>}
                  </div>
                  <span className="text-white/30 text-xs flex-shrink-0 mt-1">{timeAgo(log.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
