"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const FARM_BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

const glass = { background: "rgba(5,25,12,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };
const glassCard = { background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" };

const STAT_COLORS = ["#2d9e3f", "#d69e2e", "#c53030", "#805ad5"];

export default function FincaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [finca, setFinca] = useState(null);
  const [tab, setTab] = useState("animales");
  const [data, setData] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/superadmin/fincas/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        setFinca(d.finca);
        setData(d);
      } catch (err) { setError(err.message); }
    }
    load();
  }, [id]);

  const bgStyle = {
    backgroundImage: `url('${FARM_BG}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
      <div className="absolute inset-0" style={{ background: "rgba(5,25,12,0.7)" }} />
      <div className="relative z-10 text-center rounded-3xl p-10" style={glass}>
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button onClick={() => router.push("/superadmin")} className="text-green-400 underline">← Volver</button>
      </div>
    </div>
  );

  if (!finca) return (
    <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
      <div className="absolute inset-0" style={{ background: "rgba(5,25,12,0.7)" }} />
      <p className="relative z-10 text-white/60 text-lg animate-pulse">Cargando finca...</p>
    </div>
  );

  const TABS = [
    { key: "animales", label: "🐄 Animales", count: data.animales?.length },
    { key: "ventas", label: "💰 Ventas", count: data.ventas?.length },
    { key: "incidentes", label: "🚨 Incidentes", count: data.incidentes?.length },
    { key: "gastos", label: "💸 Gastos", count: data.gastos?.length },
    { key: "equipo", label: "👥 Equipo", count: data.equipo?.length },
  ];

  const STATS = [
    { label: "Animales", value: data.animales?.length || 0, icon: "🐄", color: STAT_COLORS[0] },
    { label: "Ventas", value: data.ventas?.length || 0, icon: "💰", color: STAT_COLORS[1] },
    { label: "Incidentes", value: data.incidentes?.length || 0, icon: "🚨", color: STAT_COLORS[2] },
    { label: "Usuarios", value: data.equipo?.length || 0, icon: "👥", color: STAT_COLORS[3] },
  ];

  return (
    <div className="min-h-screen" style={bgStyle}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "rgba(5,25,12,0.6)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="rounded-3xl px-6 py-4 flex items-center justify-between" style={glass}>
          <button onClick={() => router.push("/superadmin")}
            className="text-white/60 hover:text-white text-2xl transition-colors">←</button>
          <div className="text-center">
            <p className="text-green-300 text-xs font-bold uppercase tracking-widest">Finca</p>
            <h1 className="text-white font-black text-2xl">{finca.nombre}</h1>
            {finca.ubicacion && <p className="text-white/50 text-sm">📍 {finca.ubicacion}</p>}
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full font-black"
            style={{ background: finca.activa ? "rgba(45,158,63,0.3)" : "rgba(197,48,48,0.3)", color: finca.activa ? "#86efac" : "#fca5a5", border: `1px solid ${finca.activa ? "rgba(45,158,63,0.5)" : "rgba(197,48,48,0.5)"}` }}>
            {finca.activa ? "✅ Activa" : "🔒 Suspendida"}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: `${s.color}22`, border: `1px solid ${s.color}44`, backdropFilter: "blur(12px)" }}>
              <div className="text-3xl mb-1">{s.icon}</div>
              <p className="text-white font-black text-3xl">{s.value}</p>
              <p className="text-white/60 text-xs font-bold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="rounded-2xl p-1 flex gap-1 overflow-x-auto" style={glass}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1"
              style={{
                background: tab === t.key ? "rgba(45,158,63,0.5)" : "transparent",
                color: tab === t.key ? "#86efac" : "rgba(255,255,255,0.5)",
                border: tab === t.key ? "1px solid rgba(45,158,63,0.6)" : "1px solid transparent",
              }}>
              {t.label}
              {t.count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="space-y-3">

          {/* Animales */}
          {tab === "animales" && (data.animales?.length === 0
            ? <Empty icon="🐄" msg="Sin animales registrados" />
            : data.animales?.map((a) => {
              const foto = a.media?.find((m) => m.tipo === "FOTO");
              return (
                <div key={a.id} className="rounded-2xl overflow-hidden flex" style={glassCard}>
                  {foto ? (
                    <img src={foto.url} className="w-24 h-24 object-cover shrink-0" />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-4xl shrink-0" style={{ background: "rgba(45,158,63,0.2)" }}>
                      {a.sexo === "HEMBRA" ? "🐄" : "🐂"}
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-white font-black">{a.nombre || a.identificador}</p>
                    <p className="text-white/50 text-sm">{a.raza || "Sin raza"} · {a.sexo}</p>
                    {a.fierro && <p className="text-white/50 text-sm">🔥 Fierro: {a.fierro}</p>}
                    {a.pesoActual && <p className="text-green-400 text-sm font-bold">⚖️ {a.pesoActual} kg</p>}
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold mt-1 inline-block"
                      style={{ background: a.estado === "ACTIVO" ? "rgba(45,158,63,0.3)" : "rgba(251,146,60,0.3)", color: a.estado === "ACTIVO" ? "#86efac" : "#fdba74" }}>
                      {a.estado}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Ventas */}
          {tab === "ventas" && (data.ventas?.length === 0
            ? <Empty icon="💰" msg="Sin ventas registradas" />
            : data.ventas?.map((v) => (
              <div key={v.id} className="rounded-2xl p-4 flex items-start justify-between" style={glassCard}>
                <div>
                  <p className="text-white font-black">{v.animal?.nombre || v.animal?.identificador}</p>
                  <p className="text-white/50 text-sm">{v.tipoVenta === "EN_PIE" ? "🐄 En Pie" : "⚖️ Por Peso"} · {v.metodoPago}</p>
                  {v.comprador && <p className="text-white/50 text-sm">👤 {v.comprador}</p>}
                  <p className="text-white/30 text-xs mt-1">{new Date(v.fecha).toLocaleDateString("es", { dateStyle: "medium" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-black text-xl">C$ {v.precioNIO.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                  <p className="text-white/30 text-xs">≈ $ {v.precioUSD.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            ))
          )}

          {/* Incidentes */}
          {tab === "incidentes" && (data.incidentes?.length === 0
            ? <Empty icon="🚨" msg="Sin incidentes registrados" />
            : data.incidentes?.map((inc) => (
              <div key={inc.id} className="rounded-2xl p-4" style={glassCard}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">{inc.tipo}</span>
                  <span className="text-xs px-2 py-1 rounded-full font-bold"
                    style={{ background: inc.estado === "RESUELTO" ? "rgba(45,158,63,0.3)" : "rgba(197,48,48,0.3)", color: inc.estado === "RESUELTO" ? "#86efac" : "#fca5a5" }}>
                    {inc.estado}
                  </span>
                </div>
                <p className="text-white/70 text-sm">{inc.descripcion}</p>
                {inc.animal && <p className="text-white/40 text-xs mt-1">🐄 {inc.animal.nombre || inc.animal.identificador}</p>}
                <p className="text-white/30 text-xs mt-1">{new Date(inc.fecha).toLocaleDateString("es", { dateStyle: "medium" })}</p>
              </div>
            ))
          )}

          {/* Gastos */}
          {tab === "gastos" && (
            <>
              {data.gastos?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(128,90,213,0.2)", border: "1px solid rgba(128,90,213,0.4)", backdropFilter: "blur(12px)" }}>
                  <p className="text-white/60 text-sm">Total gastos</p>
                  <p className="text-white font-black text-3xl">C$ {data.gastos?.reduce((s, g) => s + g.monto, 0).toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                </div>
              )}
              {data.gastos?.length === 0
                ? <Empty icon="💸" msg="Sin gastos registrados" />
                : data.gastos?.map((g) => (
                  <div key={g.id} className="rounded-2xl p-4 flex justify-between items-center" style={glassCard}>
                    <div>
                      <p className="text-white font-bold">{g.descripcion}</p>
                      <p className="text-white/50 text-sm">{g.categoria} · {g.periodicidad}</p>
                      <p className="text-white/30 text-xs">{new Date(g.fecha).toLocaleDateString("es", { dateStyle: "medium" })}</p>
                    </div>
                    <p className="text-purple-400 font-black text-lg">C$ {g.monto.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                  </div>
                ))
              }
            </>
          )}

          {/* Equipo */}
          {tab === "equipo" && (data.equipo?.length === 0
            ? <Empty icon="👥" msg="Sin usuarios registrados" />
            : data.equipo?.map((u) => (
              <div key={u.id} className="rounded-2xl p-4 flex items-center gap-4" style={glassCard}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white font-black"
                  style={{ background: u.role === "ADMIN" ? "rgba(128,90,213,0.4)" : "rgba(45,158,63,0.4)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold">{u.nombre}</p>
                  <p className="text-white/50 text-sm">{u.email}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-black"
                  style={{ background: u.role === "ADMIN" ? "rgba(128,90,213,0.3)" : "rgba(45,158,63,0.3)", color: u.role === "ADMIN" ? "#c4b5fd" : "#86efac" }}>
                  {u.role}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ icon, msg }) {
  return (
    <div className="rounded-3xl p-12 text-center" style={{ background: "rgba(5,25,12,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-white/40">{msg}</p>
    </div>
  );
}
