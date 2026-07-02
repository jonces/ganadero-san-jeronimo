"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const ICONS = {
  Animales:   "🐄",
  Ventas:     "💰",
  Gastos:     "💸",
  Incidentes: "🚨",
  Eventos:    "📋",
  Documentos: "📄",
  default:    "📌",
};

function tiempoRelativo(fecha) {
  const diff = (Date.now() - new Date(fecha)) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

export default function NotificacionesPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [lastVisto, setLastVisto] = useState(null);

  useEffect(() => {
    const lv = localStorage.getItem("notif_last_visto");
    setLastVisto(lv);

    async function cargar() {
      try {
        const [actividad, incidentes] = await Promise.all([
          api("/actividad").catch(() => []),
          api("/incidentes").catch(() => []),
        ]);

        const deActividad = actividad
          .filter(a => a.usuario?.role === "TRABAJADOR")
          .map(a => ({
            id: "act-" + a.id,
            tipo: "actividad",
            titulo: a.accion,
            detalle: a.detalle,
            modulo: a.modulo,
            usuario: a.usuario?.nombre,
            fecha: a.createdAt,
            urgente: false,
          }));

        const deIncidentes = incidentes.map(i => ({
          id: "inc-" + i.id,
          tipo: "incidente",
          titulo: `Incidente: ${i.tipo}`,
          detalle: i.descripcion,
          modulo: "Incidentes",
          usuario: i.usuario?.nombre,
          fecha: i.fecha || i.createdAt,
          urgente: i.gravedad === "GRAVE" || i.gravedad === "CRITICA",
        }));

        const todas = [...deActividad, ...deIncidentes]
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        setNotifs(todas);
      } catch {}
      finally { setCargando(false); }
    }

    cargar();

    // Marcar como vistas al entrar
    localStorage.setItem("notif_last_visto", new Date().toISOString());
    // Limpiar badge de actividades también
    localStorage.setItem("actividad_last_visto", new Date().toISOString());
  }, []);

  const nuevas = lastVisto
    ? notifs.filter(n => new Date(n.fecha) > new Date(lastVisto))
    : notifs;

  const glass = { background: "rgba(5,25,12,0.70)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };

  return (
    <AppLayout title="Notificaciones" subtitle="Centro de alertas">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-xs">{notifs.length} notificaciones totales</p>
        {nuevas.length > 0 && (
          <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: "rgba(229,62,62,0.3)", color: "#fc8181", border: "1px solid rgba(229,62,62,0.5)" }}>
            {nuevas.length} nuevas
          </span>
        )}
      </div>

      {cargando && (
        <div className="text-center py-20 text-white/40">
          <p className="text-4xl mb-3 animate-pulse">🔔</p>
          <p>Cargando notificaciones...</p>
        </div>
      )}

      {!cargando && notifs.length === 0 && (
        <div className="text-center py-20 text-white/30">
          <p className="text-5xl mb-4">🔕</p>
          <p className="font-bold text-white/40">Sin notificaciones</p>
          <p className="text-sm mt-1">Cuando los trabajadores registren actividades aparecerán aquí</p>
        </div>
      )}

      <div className="space-y-3">
        {notifs.map(n => {
          const esNueva = lastVisto && new Date(n.fecha) > new Date(lastVisto);
          const icono = ICONS[n.modulo] || ICONS.default;
          return (
            <div key={n.id} className="rounded-2xl p-4 flex gap-3 items-start relative"
              style={{
                ...glass,
                border: n.urgente
                  ? "1px solid rgba(229,62,62,0.5)"
                  : esNueva
                  ? "1px solid rgba(45,158,63,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}>
              {/* Dot nueva */}
              {esNueva && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: n.urgente ? "#e53e3e" : "#38a169" }} />
              )}

              {/* Icono */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: n.urgente ? "rgba(229,62,62,0.2)" : "rgba(45,158,63,0.15)" }}>
                {icono}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-black text-sm">{n.titulo}</p>
                  {n.urgente && (
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(229,62,62,0.3)", color: "#fc8181" }}>URGENTE</span>
                  )}
                </div>
                {n.detalle && <p className="text-white/60 text-xs mt-0.5 truncate">{n.detalle}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {n.usuario && <span className="text-white/40 text-xs">👤 {n.usuario}</span>}
                  <span className="text-white/30 text-xs">{tiempoRelativo(n.fecha)}</span>
                  <span className="text-white/20 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>{n.modulo}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
