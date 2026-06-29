"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

export default function FincaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [finca, setFinca] = useState(null);
  const [tab, setTab] = useState("animales");
  const [data, setData] = useState({});
  const [error, setError] = useState("");

  async function load() {
    try {
      // Cargar datos de la finca directamente desde superadmin
      const res = await fetch(`${API_URL}/superadmin/fincas/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setFinca(d.finca);
      setData(d);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, [id]);

  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <p className="text-red-400 text-lg">{error}</p>
        <button onClick={() => router.push("/superadmin")} className="mt-4 text-green-400 underline">Volver</button>
      </div>
    </div>
  );

  if (!finca) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-gray-400 text-lg animate-pulse">Cargando finca...</p>
    </div>
  );

  const TABS = [
    { key: "animales", label: "🐄 Animales", count: data.animales?.length },
    { key: "ventas", label: "💰 Ventas", count: data.ventas?.length },
    { key: "incidentes", label: "🚨 Incidentes", count: data.incidentes?.length },
    { key: "gastos", label: "💸 Gastos", count: data.gastos?.length },
    { key: "equipo", label: "👥 Equipo", count: data.equipo?.length },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <button onClick={() => router.push("/superadmin")} className="text-gray-400 text-xl">←</button>
        <div className="text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Finca</p>
          <p className="text-white font-black text-lg">{finca.nombre}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${finca.activa ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
          {finca.activa ? "✅ Activa" : "🔒 Suspendida"}
        </span>
      </header>

      {/* Info de la finca */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Animales", value: data.animales?.length || 0, icon: "🐄", color: "#2d9e3f" },
            { label: "Ventas", value: data.ventas?.length || 0, icon: "💰", color: "#d69e2e" },
            { label: "Incidentes", value: data.incidentes?.length || 0, icon: "🚨", color: "#c53030" },
            { label: "Usuarios", value: data.equipo?.length || 0, icon: "👥", color: "#805ad5" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center border border-gray-800" style={{ background: "#1a1d27" }}>
              <span className="text-2xl">{s.icon}</span>
              <p className="text-white font-black text-2xl mt-1">{s.value}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-800 px-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="shrink-0 px-4 py-3 text-sm font-bold transition-colors flex items-center gap-1"
            style={{ color: tab === t.key ? "#2d9e3f" : "#6b7280", borderBottom: tab === t.key ? "2px solid #2d9e3f" : "2px solid transparent" }}>
            {t.label}
            {t.count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-300">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto p-4">

        {/* Animales */}
        {tab === "animales" && (
          <div className="space-y-3">
            {data.animales?.length === 0 && <p className="text-gray-500 text-center py-10">Sin animales registrados</p>}
            {data.animales?.map((a) => {
              const foto = a.media?.find((m) => m.tipo === "FOTO");
              return (
                <div key={a.id} className="rounded-2xl border border-gray-800 overflow-hidden flex" style={{ background: "#1a1d27" }}>
                  {foto ? (
                    <img src={foto.url} className="w-24 h-24 object-cover shrink-0" />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-4xl shrink-0" style={{ background: "#1a3a1a" }}>
                      {a.sexo === "HEMBRA" ? "🐄" : "🐂"}
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-white font-black">{a.nombre || a.identificador}</p>
                    <p className="text-gray-400 text-sm">{a.raza || "Sin raza"} · {a.sexo}</p>
                    {a.fierro && <p className="text-gray-400 text-sm">🔥 Fierro: {a.fierro}</p>}
                    {a.pesoActual && <p className="text-green-400 text-sm font-bold">⚖️ {a.pesoActual} kg</p>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${a.estado === "ACTIVO" ? "bg-green-900 text-green-400" : "bg-orange-900 text-orange-400"}`}>
                      {a.estado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ventas */}
        {tab === "ventas" && (
          <div className="space-y-3">
            {data.ventas?.length === 0 && <p className="text-gray-500 text-center py-10">Sin ventas registradas</p>}
            {data.ventas?.map((v) => (
              <div key={v.id} className="rounded-2xl border border-gray-800 p-4" style={{ background: "#1a1d27" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-black">{v.animal?.nombre || v.animal?.identificador}</p>
                    <p className="text-gray-400 text-sm">{v.tipoVenta === "EN_PIE" ? "🐄 En Pie" : "⚖️ Por Peso"} · {v.metodoPago}</p>
                    {v.comprador && <p className="text-gray-400 text-sm">👤 {v.comprador}</p>}
                    <p className="text-gray-500 text-xs mt-1">{new Date(v.fecha).toLocaleDateString("es", { dateStyle: "medium" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-black text-xl">C$ {v.precioNIO.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                    <p className="text-gray-500 text-xs">≈ $ {v.precioUSD.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Incidentes */}
        {tab === "incidentes" && (
          <div className="space-y-3">
            {data.incidentes?.length === 0 && <p className="text-gray-500 text-center py-10">Sin incidentes registrados</p>}
            {data.incidentes?.map((inc) => (
              <div key={inc.id} className="rounded-2xl border border-gray-800 p-4" style={{ background: "#1a1d27" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">{inc.tipo}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${inc.estado === "RESUELTO" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                    {inc.estado}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{inc.descripcion}</p>
                {inc.animal && <p className="text-gray-400 text-xs mt-1">🐄 {inc.animal.nombre || inc.animal.identificador}</p>}
                <p className="text-gray-500 text-xs mt-1">{new Date(inc.fecha).toLocaleDateString("es", { dateStyle: "medium" })}</p>
              </div>
            ))}
          </div>
        )}

        {/* Gastos */}
        {tab === "gastos" && (
          <div className="space-y-3">
            {data.gastos?.length === 0 && <p className="text-gray-500 text-center py-10">Sin gastos registrados</p>}
            <div className="rounded-2xl border border-gray-800 p-4 mb-4" style={{ background: "#1a1d27" }}>
              <p className="text-gray-400 text-sm">Total gastos</p>
              <p className="text-white font-black text-2xl">C$ {data.gastos?.reduce((s, g) => s + g.monto, 0).toLocaleString("es", { maximumFractionDigits: 0 })}</p>
            </div>
            {data.gastos?.map((g) => (
              <div key={g.id} className="rounded-2xl border border-gray-800 p-4 flex justify-between" style={{ background: "#1a1d27" }}>
                <div>
                  <p className="text-white font-bold">{g.descripcion}</p>
                  <p className="text-gray-400 text-sm">{g.categoria} · {g.periodicidad}</p>
                  <p className="text-gray-500 text-xs">{new Date(g.fecha).toLocaleDateString("es", { dateStyle: "medium" })}</p>
                </div>
                <p className="text-purple-400 font-black text-lg">C$ {g.monto.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
              </div>
            ))}
          </div>
        )}

        {/* Equipo */}
        {tab === "equipo" && (
          <div className="space-y-3">
            {data.equipo?.length === 0 && <p className="text-gray-500 text-center py-10">Sin usuarios</p>}
            {data.equipo?.map((u) => (
              <div key={u.id} className="rounded-2xl border border-gray-800 p-4 flex items-center gap-4" style={{ background: "#1a1d27" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white font-black"
                  style={{ background: u.role === "ADMIN" ? "#553c9a" : "#1a3a1a" }}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">{u.nombre}</p>
                  <p className="text-gray-400 text-sm">{u.email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${u.role === "ADMIN" ? "bg-purple-900 text-purple-400" : "bg-green-900 text-green-400"}`}>
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
