"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const FINCA_IMGS = [
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&q=80",
  "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&q=80",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80",
  "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&q=80",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80",
  "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80",
];

export default function SuperAdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [fincas, setFincas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        api("/superadmin/stats"),
        api("/superadmin/fincas"),
      ]);
      setStats(s);
      setFincas(f);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("denegado") || err.message.includes("401")) router.push("/");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleFinca(id, e) {
    e.stopPropagation();
    try {
      await api(`/superadmin/fincas/${id}/toggle`, { method: "PATCH" });
      load();
    } catch (err) { setError(err.message); }
  }

  async function eliminarFinca(id, nombre, e) {
    e.stopPropagation();
    const confirmar = window.confirm(
      `⚠️ ELIMINAR FINCA\n\n¿Está seguro que desea eliminar "${nombre}"?\n\nEsto eliminará TODOS los datos: animales, ventas, gastos, usuarios y eventos.\n\nEsta acción NO se puede deshacer.`
    );
    if (!confirmar) return;
    try {
      await api(`/superadmin/fincas/${id}`, { method: "DELETE" });
      load();
    } catch (err) { setError(err.message); }
  }

  const fincasFiltradas = fincas.filter((f) =>
    f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.usuarios?.[0]?.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return (
    <AppLayout title="Panel de Control" subtitle="Super Administrador">
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <p className="text-5xl mb-4 animate-bounce">🐄</p>
          <p className="text-white/60 text-lg animate-pulse">Cargando fincas...</p>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Panel de Control" subtitle="Super Administrador">
      {/* Acceso rápido a informes */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/superadmin/informes")}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-bold shadow-xl hover:scale-[1.02] transition-all"
          style={{ background: "linear-gradient(135deg,#1a3a6c,#2980b9)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <span className="text-2xl">📋</span>
          <div className="text-left">
            <p className="text-sm font-black">Informes por Finca</p>
            <p className="text-white/60 text-xs">Descarga PDF completo de cada finca</p>
          </div>
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "rgba(220,38,38,0.25)", border: "1px solid rgba(220,38,38,0.5)", backdropFilter: "blur(10px)" }}>
          <span className="text-2xl">⚠️</span>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Fincas registradas", value: stats.totalFincas, icon: "🏡", grad: "linear-gradient(135deg,#1a5c2a,#2d9e3f)" },
            { label: "Fincas activas", value: stats.fincasActivas, icon: "✅", grad: "linear-gradient(135deg,#145a32,#27ae60)" },
            { label: "Animales totales", value: stats.totalAnimales, icon: "🐄", grad: "linear-gradient(135deg,#1a3a6c,#2980b9)" },
            { label: "Usuarios totales", value: stats.totalUsuarios, icon: "👥", grad: "linear-gradient(135deg,#4a235a,#8e44ad)" },
            { label: "Ventas totales", value: `C$ ${(stats.totalVentasNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 })}`, icon: "💰", grad: "linear-gradient(135deg,#7d6608,#f39c12)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5 shadow-2xl hover:scale-105 transition-transform cursor-default"
              style={{ background: s.grad, border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(12px)" }}>
              <span className="text-3xl">{s.icon}</span>
              <p className="text-white font-black text-3xl mt-3">{s.value}</p>
              <p className="text-white/70 text-xs mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Encabezado lista */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-white font-black text-2xl">🏡 Fincas registradas</h2>
          <p className="text-white/50 text-sm mt-0.5">{fincasFiltradas.length} fincas encontradas</p>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
          <input
            className="pl-9 pr-4 py-2.5 rounded-xl text-sm text-white w-64 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
            placeholder="Buscar finca o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de fincas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fincasFiltradas.map((finca, idx) => (
          <div key={finca.id}
            className="rounded-2xl overflow-hidden shadow-2xl cursor-pointer hover:scale-[1.02] transition-all"
            style={{
              border: finca.activa ? "1px solid rgba(45,158,63,0.5)" : "1px solid rgba(220,38,38,0.4)",
              background: "rgba(5,20,10,0.55)",
              backdropFilter: "blur(16px)",
            }}
            onClick={() => router.push(`/superadmin/finca/${finca.id}`)}>

            {/* Imagen */}
            <div className="relative h-36 overflow-hidden">
              <img src={FINCA_IMGS[idx % FINCA_IMGS.length]} alt={finca.nombre}
                className="w-full h-full object-cover"
                style={{ filter: finca.activa ? "brightness(0.65)" : "brightness(0.3) grayscale(0.5)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(5,20,10,0.9) 100%)" }} />
              <div className="absolute top-3 left-3">
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-lg ${finca.activa ? "bg-green-500 text-white" : "bg-red-600 text-white"}`}>
                  {finca.activa ? "✅ Activa" : "🔒 Suspendida"}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex gap-2 text-white text-xs">
                {[
                  { icon: "🐄", v: finca._count.animales, label: "animales" },
                  { icon: "👥", v: finca._count.usuarios, label: "usuarios" },
                  { icon: "💰", v: finca._count.ventas, label: "ventas" },
                ].map((c) => (
                  <div key={c.label} className="flex flex-col items-center px-2 py-1 rounded-lg"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                    <span>{c.icon} {c.v}</span>
                    <span className="text-white/50" style={{ fontSize: 9 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="px-5 pb-5">
              <h3 className="text-white font-black text-xl mt-2">{finca.nombre}</h3>
              {finca.ubicacion && <p className="text-green-400 text-sm mt-0.5 font-medium">📍 {finca.ubicacion}</p>}
              {finca.usuarios[0] && (
                <p className="text-white/50 text-sm mt-1">
                  👤 <span className="text-white/80 font-semibold">{finca.usuarios[0].nombre}</span>
                  <span className="text-white/40"> · {finca.usuarios[0].email}</span>
                </p>
              )}
              <div className="flex items-center justify-between mt-4">
                <p className="text-white/30 text-xs">
                  Registrada: {new Date(finca.createdAt).toLocaleDateString("es", { dateStyle: "medium" })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => toggleFinca(finca.id, e)}
                    className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: finca.activa ? "rgba(220,38,38,0.2)" : "rgba(34,197,94,0.2)",
                      color: finca.activa ? "#f87171" : "#4ade80",
                      border: finca.activa ? "1px solid rgba(220,38,38,0.4)" : "1px solid rgba(34,197,94,0.4)",
                    }}>
                    {finca.activa ? "🔒 Suspender" : "✅ Activar"}
                  </button>
                  <button
                    onClick={(e) => eliminarFinca(finca.id, finca.nombre, e)}
                    className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "rgba(220,38,38,0.15)",
                      color: "#f87171",
                      border: "1px solid rgba(220,38,38,0.35)",
                    }}>
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {fincasFiltradas.length === 0 && (
        <div className="text-center py-20 rounded-2xl"
          style={{ background: "rgba(5,20,10,0.55)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
          <p className="text-6xl mb-4">🏕️</p>
          <p className="text-white/60 text-lg font-semibold">No se encontraron fincas</p>
        </div>
      )}
    </AppLayout>
  );
}
