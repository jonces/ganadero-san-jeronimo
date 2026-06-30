"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const MODULOS = [
  { label: "Inventario Animal", sub: "Animales · Raza · Fierro · Peso", emoji: "🐄", gradient: "linear-gradient(135deg,#1a6b2a,#2d9e3f)", href: "/inventario" },
  { label: "Documentos Legales", sub: "Fierro anual · Permisos · Cartas", emoji: "📄", gradient: "linear-gradient(135deg,#1a4a8a,#3182ce)", href: "/documentos" },
  { label: "Ventas", sub: "En pie · Por peso · Facturación", emoji: "💰", gradient: "linear-gradient(135deg,#7b4f12,#d69e2e)", href: "/ventas" },
  { label: "Incidentes", sub: "Accidentes · Enfermedades · Muertes", emoji: "🚨", gradient: "linear-gradient(135deg,#7b1a1a,#c53030)", href: "/incidentes" },
  { label: "Control de Gastos", sub: "Diario · Semanal · Quincenal · Mensual", emoji: "💸", gradient: "linear-gradient(135deg,#44337a,#805ad5)", href: "/gastos" },
  { label: "Mi Equipo", sub: "Administradores · Trabajadores", emoji: "👥", gradient: "linear-gradient(135deg,#1a2a4a,#2c5282)", href: "/equipo" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api("/ventas/stats").then(setStats).catch(() => {});
  }, []);

  const a = stats?.animales;
  const v = stats?.ventas;

  return (
    <AppLayout title="Mi Finca" subtitle="Panel del Administrador">
      {/* Bienvenida hero */}
      <div className="rounded-3xl overflow-hidden mb-6 shadow-2xl relative"
        style={{ background: "rgba(5,30,15,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(45,158,63,0.3)" }}>
        <div className="px-4 py-5 md:px-8 md:py-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-green-300 text-xs md:text-sm font-bold uppercase tracking-widest mb-1">Bienvenido a</p>
            <h2 className="text-white font-black text-xl md:text-3xl">Ganadero San Jerónimo</h2>
            <p className="text-white/50 text-xs md:text-sm mt-1">Sistema de gestión ganadera · Nicaragua</p>
          </div>
          <div className="flex gap-1">
            {["🐄","🐂","🐄","🐃"].map((e, i) => (
              <span key={i} style={{ transform: i % 2 !== 0 ? "scaleX(-1)" : "none", fontSize: i === 2 ? 32 : 24 }}>{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: "🐄", label: "Total Animales", value: a?.total, grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)", href: "/inventario" },
            { icon: "🐂", label: "Machos", value: a?.machos, grad: "linear-gradient(135deg,#1a4a8a,#3182ce)", href: "/inventario" },
            { icon: "🐄", label: "Hembras", value: a?.hembras, grad: "linear-gradient(135deg,#702459,#b83280)", href: "/inventario" },
            { icon: "💰", label: "Ventas mes", value: `C$ ${(v?.totalMesNIO || 0).toLocaleString("es",{maximumFractionDigits:0})}`, grad: "linear-gradient(135deg,#7b4f12,#d69e2e)", href: "/ventas" },
          ].map((s) => (
            <button key={s.label} onClick={() => router.push(s.href)}
              className="rounded-2xl p-4 md:p-5 shadow-2xl active:scale-95 hover:scale-105 transition-transform text-left"
              style={{ background: s.grad, border: "1px solid rgba(255,255,255,0.2)" }}>
              <span className="text-2xl md:text-3xl">{s.icon}</span>
              <p className="text-white font-black text-xl md:text-2xl mt-1">{s.value ?? "—"}</p>
              <p className="text-white/70 text-xs mt-0.5 font-medium">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Tipo de cambio */}
      {stats && (
        <div className="rounded-2xl px-5 py-4 mb-6 flex items-center justify-between flex-wrap gap-3 shadow-xl"
          style={{ background: "rgba(5,30,15,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">💱</span>
            <div>
              <p className="font-bold text-white text-sm">Tipo de cambio oficial</p>
              <p className="text-white/40 text-xs">Se aplica en todas las ventas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ background: "rgba(45,158,63,0.2)", border: "1px solid rgba(45,158,63,0.4)" }}>
            <span className="text-green-300 font-black text-lg">C$ {stats.tipoCambio}</span>
            <span className="text-white/40 text-sm">/ USD</span>
          </div>
        </div>
      )}

      {/* Módulos */}
      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Módulos del sistema</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULOS.map((mod) => (
          <button key={mod.label} onClick={() => router.push(mod.href)}
            className="flex items-center gap-4 rounded-2xl shadow-xl p-5 text-white text-left hover:scale-[1.02] transition-all"
            style={{ background: mod.gradient, border: "1px solid rgba(255,255,255,0.15)" }}>
            <span style={{ fontSize: 44 }}>{mod.emoji}</span>
            <div className="flex-1">
              <p className="font-black text-lg">{mod.label}</p>
              <p className="text-sm opacity-70 mt-0.5">{mod.sub}</p>
            </div>
            <span className="text-white/40 text-2xl">›</span>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
