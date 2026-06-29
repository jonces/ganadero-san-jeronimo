"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, logout } from "@/lib/api";

export default function SuperAdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [fincas, setFincas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [s, f] = await Promise.all([
        api("/superadmin/stats"),
        api("/superadmin/fincas"),
      ]);
      setStats(s);
      setFincas(f);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("denegado")) router.push("/");
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleFinca(id) {
    try {
      await api(`/superadmin/fincas/${id}/toggle`, { method: "PATCH" });
      load();
    } catch (err) { setError(err.message); }
  }

  const fincasFiltradas = fincas.filter((f) =>
    f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.usuarios[0]?.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐄</span>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Panel de Control</p>
            <p className="text-white font-black text-xl">Ganadero San Jerónimo</p>
          </div>
        </div>
        <button onClick={() => { logout(); router.push("/"); }}
          className="text-gray-400 text-sm border border-gray-700 rounded-xl px-4 py-2 hover:border-gray-500 transition-colors">
          Cerrar sesión
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && <p className="text-red-400 mb-4 bg-red-900/30 rounded-xl p-3 text-sm">{error}</p>}

        {/* Stats globales */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              { label: "Fincas registradas", value: stats.totalFincas, icon: "🏡", color: "#2d9e3f" },
              { label: "Fincas activas", value: stats.fincasActivas, icon: "✅", color: "#38a169" },
              { label: "Animales totales", value: stats.totalAnimales, icon: "🐄", color: "#3182ce" },
              { label: "Usuarios totales", value: stats.totalUsuarios, icon: "👥", color: "#805ad5" },
              { label: "Ventas totales", value: `C$ ${(stats.totalVentasNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 })}`, icon: "💰", color: "#d69e2e" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 border border-gray-800"
                style={{ background: "#1a1d27" }}>
                <span className="text-2xl">{s.icon}</span>
                <p className="text-white font-black text-2xl mt-2">{s.value}</p>
                <p className="text-gray-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Buscador */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-white font-black text-xl flex-1">🏡 Fincas registradas</h2>
          <input
            className="border border-gray-700 rounded-xl px-4 py-2 text-sm text-white bg-gray-800 focus:outline-none focus:border-green-500 w-64"
            placeholder="🔍 Buscar finca o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Lista de fincas */}
        <div className="space-y-3">
          {fincasFiltradas.map((finca) => (
            <div key={finca.id} className="rounded-2xl border border-gray-800 overflow-hidden cursor-pointer hover:border-green-700 transition-colors"
              style={{ background: "#1a1d27" }}
              onClick={() => router.push(`/superadmin/finca/${finca.id}`)}>
              <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: finca.activa ? "#1a3a1a" : "#3a1a1a" }}>
                    {finca.activa ? "🏡" : "🔒"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-black text-lg">{finca.nombre}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${finca.activa ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                        {finca.activa ? "✅ Activa" : "🔒 Suspendida"}
                      </span>
                    </div>
                    {finca.ubicacion && <p className="text-gray-400 text-sm">📍 {finca.ubicacion}</p>}
                    {finca.usuarios[0] && (
                      <p className="text-gray-400 text-sm mt-1">
                        👤 Admin: <span className="text-gray-300">{finca.usuarios[0].nombre}</span>
                        <span className="text-gray-500"> · {finca.usuarios[0].email}</span>
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      Registrada: {new Date(finca.createdAt).toLocaleDateString("es", { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-4 text-center">
                    {[
                      { label: "Animales", value: finca._count.animales },
                      { label: "Usuarios", value: finca._count.usuarios },
                      { label: "Ventas", value: finca._count.ventas },
                    ].map((c) => (
                      <div key={c.label}>
                        <p className="text-white font-black text-xl">{c.value}</p>
                        <p className="text-gray-500 text-xs">{c.label}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => toggleFinca(finca.id)}
                    className="text-sm font-bold px-4 py-2 rounded-xl mt-2"
                    style={{
                      background: finca.activa ? "#7b1a1a" : "#1a3a1a",
                      color: finca.activa ? "#fc8181" : "#68d391",
                    }}>
                    {finca.activa ? "🔒 Suspender" : "✅ Activar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {fincasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No se encontraron fincas</p>
          </div>
        )}
      </div>
    </div>
  );
}
