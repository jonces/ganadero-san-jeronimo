"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, logout } from "@/lib/api";

const MODULOS = [
  { label: "Inventario Animal", sub: "Animales · Raza · Fierro · Peso", emoji: "🐄", gradient: "linear-gradient(135deg,#1a6b2a,#2d9e3f)", href: "/inventario" },
  { label: "Documentos Legales", sub: "Fierro anual · Permisos · Cartas", emoji: "📄", gradient: "linear-gradient(135deg,#1a4a8a,#3182ce)", href: "/documentos" },
  { label: "Ventas", sub: "En pie · Por peso · Facturación", emoji: "💰", gradient: "linear-gradient(135deg,#7b4f12,#d69e2e)", href: "/ventas" },
  { label: "Incidentes", sub: "Accidentes · Enfermedades · Muertes", emoji: "🚨", gradient: "linear-gradient(135deg,#7b1a1a,#c53030)", href: "/incidentes" },
  { label: "Control de Gastos", sub: "Diario · Semanal · Quincenal · Mensual", emoji: "💸", gradient: "linear-gradient(135deg,#44337a,#805ad5)", href: "/gastos" },
  { label: "Mi Equipo", sub: "Administradores · Trabajadores", emoji: "👥", gradient: "linear-gradient(135deg,#1a2a4a,#2c5282)", href: "/equipo" },
];

function StatCard({ icon, label, value, sub, color, href }) {
  const inner = (
    <div className="rounded-2xl p-4 text-white shadow-lg flex flex-col gap-1 hover:scale-105 transition-transform"
      style={{ background: color }}>
      <span className="text-3xl">{icon}</span>
      <p className="text-2xl font-black mt-1">{value ?? "—"}</p>
      <p className="text-xs font-bold opacity-90">{label}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
      {href && <p className="text-xs opacity-60 mt-1">Ver detalle →</p>}
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api("/ventas/stats").then(setStats).catch(() => {});
  }, []);

  const a = stats?.animales;
  const v = stats?.ventas;

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f0" }}>

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
        {/* Fondo con capas */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(160deg, #0a3d1f 0%, #1a6b2a 40%, #2d9e3f 70%, #5bb84a 100%)"
        }} />
        {/* Overlay con patrón */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Gradiente oscuro inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: "linear-gradient(to top, #f0f4f0, transparent)" }} />

        {/* Header nav */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🐄</span>
            <div>
              <p className="text-green-200 text-xs font-semibold tracking-widest uppercase">Software Ganadero</p>
              <p className="text-white font-black text-lg leading-none">GANADERO SG</p>
            </div>
          </div>
          <button onClick={() => { logout(); router.push("/"); }}
            className="text-white text-sm border border-green-400 rounded-xl px-4 py-2 hover:bg-green-800 transition-colors">
            Salir
          </button>
        </div>

        {/* Texto hero */}
        <div className="relative px-5 pt-8 pb-16 text-center">
          <p className="text-green-300 text-sm font-semibold tracking-widest uppercase mb-2">Bienvenido a</p>
          <h1 className="text-white font-black leading-tight mb-3"
            style={{ fontSize: "clamp(22px, 5vw, 40px)", textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
            Henriquez Cattle Management
          </h1>
          <p className="text-green-200 text-sm max-w-md mx-auto">
            Sistema profesional de gestión ganadera · Nicaragua
          </p>

          {/* Animales decorativos */}
          <div className="flex justify-center gap-2 mt-6 text-4xl flex-wrap">
            {["🐄","🐂","🐄","🐃","🐄","🐂","🐴"].map((e, i) => (
              <span key={i} className="drop-shadow-lg"
                style={{ transform: i % 2 !== 0 ? "scaleX(-1)" : "none", fontSize: i === 3 ? 48 : 36 }}>
                {e}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-10 -mt-4">

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            <StatCard icon="🐄" label="Total Animales" value={a?.total} color="linear-gradient(135deg,#1a6b2a,#2d9e3f)" href="/inventario" />
            <StatCard icon="🐂" label="Toros / Machos" value={a?.machos} color="linear-gradient(135deg,#1a4a8a,#3182ce)" href="/inventario" />
            <StatCard icon="🐄" label="Vacas / Hembras" value={a?.hembras} color="linear-gradient(135deg,#702459,#b83280)" href="/inventario" />
            <StatCard icon="✅" label="Activos" value={a?.activos} color="linear-gradient(135deg,#22543d,#38a169)" href="/inventario" />
            <StatCard icon="💰" label="Ventas del Mes" value={`C$ ${(v?.totalMesNIO || 0).toLocaleString("es",{maximumFractionDigits:0})}`}
              sub={`≈ USD $${(v?.totalMesUSD || 0).toLocaleString("es",{maximumFractionDigits:0})}`}
              color="linear-gradient(135deg,#7b4f12,#d69e2e)" href="/ventas" />
            <StatCard icon="🛒" label="Animales Vendidos" value={a?.vendidos} color="linear-gradient(135deg,#c05621,#ed8936)" href="/ventas" />
            <StatCard icon="⚖️" label="Peso Promedio" value={stats.pesoPromedio ? `${Math.round(stats.pesoPromedio)} kg` : "—"} color="linear-gradient(135deg,#2c5282,#4299e1)" href="/inventario" />
            <StatCard icon="💉" label="Vacunas este mes" value={stats.vacunasMes} color="linear-gradient(135deg,#6b2d2d,#e53e3e)" href="/inventario" />
          </div>
        )}

        {/* Tipo de cambio */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-md px-5 py-4 mb-8 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💱</span>
              <div>
                <p className="font-bold text-gray-800 text-sm">Tipo de cambio oficial</p>
                <p className="text-gray-500 text-xs">Configurable · se aplica en todas las ventas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2">
              <span className="text-green-700 font-black text-lg">C$ {stats.tipoCambio}</span>
              <span className="text-gray-400 text-sm">/ USD</span>
            </div>
          </div>
        )}

        {/* Módulos */}
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 px-1">Módulos del sistema</p>
        <div className="space-y-4">
          {MODULOS.map((mod) => (
            <a key={mod.label} href={mod.href}
              className="flex items-center gap-5 rounded-2xl shadow-lg p-5 text-white hover:scale-102 transition-all hover:shadow-xl"
              style={{ background: mod.gradient }}>
              <span style={{ fontSize: 52 }}>{mod.emoji}</span>
              <div className="flex-1">
                <p className="font-black text-xl">{mod.label}</p>
                <p className="text-sm opacity-75 mt-1">{mod.sub}</p>
              </div>
              <span className="text-white opacity-50 text-2xl">›</span>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-gray-400 text-xs">
          <p>© 2025 Henriquez Cattle Management · Ganadero SG</p>
          <p className="mt-1">Sistema profesional de gestión ganadera</p>
        </div>
      </div>
    </div>
  );
}
