"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, getUsuario } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const MODULOS = [
  { label: "Inventario Animal", sub: "Registro · Razas · Pesaje · Partos", emoji: "🐄", gradient: "linear-gradient(135deg,#1a6b2a,#2d9e3f)", href: "/inventario" },
  { label: "Control de Ventas", sub: "En pie · Por peso · Facturación · USD", emoji: "💰", gradient: "linear-gradient(135deg,#7b4f12,#d69e2e)", href: "/ventas" },
  { label: "Gastos", sub: "Diario · Semanal · Quincenal · Mensual", emoji: "💸", gradient: "linear-gradient(135deg,#44337a,#805ad5)", href: "/gastos" },
  { label: "Incidentes", sub: "Enfermedades · Accidentes · Muertes", emoji: "🚨", gradient: "linear-gradient(135deg,#7b1a1a,#c53030)", href: "/incidentes" },
  { label: "Documentos Legales", sub: "Fierro · Permisos · Cartas · Guías", emoji: "📄", gradient: "linear-gradient(135deg,#1a4a8a,#3182ce)", href: "/documentos" },
  { label: "Mi Equipo", sub: "Admins · Trabajadores · Permisos", emoji: "👥", gradient: "linear-gradient(135deg,#1a2a4a,#2c5282)", href: "/equipo" },
];

function fmt(n) { return (n || 0).toLocaleString("es", { maximumFractionDigits: 0 }); }
function fmtD(n) { return (n || 0).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function Sparkline({ data = [], color = "#2d9e3f" }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 64, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ opacity: 0.7 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ icon, label, value, sub, color, grad, href, sparkData, trend }) {
  const router = useRouter();
  return (
    <button onClick={() => href && router.push(href)}
      className="rounded-2xl p-4 text-left shadow-xl transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden"
      style={{ background: grad || "rgba(5,25,12,0.8)", border: `1px solid ${color}33` }}>
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 80% 20%, ${color}, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {sparkData && <Sparkline data={sparkData} color={color} />}
        {trend !== undefined && !sparkData && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: trend >= 0 ? "rgba(45,158,63,0.2)" : "rgba(229,62,62,0.2)", color: trend >= 0 ? "#4ade80" : "#f87171" }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-white font-black text-xl leading-none">{value ?? "—"}</p>
      <p className="text-white/60 text-xs mt-1 font-medium">{label}</p>
      {sub && <p className="text-white/35 text-xs mt-0.5">{sub}</p>}
    </button>
  );
}

function GraficaMensual({ datos }) {
  if (!datos?.length) return null;
  const maxVal = Math.max(...datos.map(d => Math.max(d.ventas, d.gastos)), 1);
  const totalV = datos.reduce((s, d) => s + d.ventas, 0);
  const totalG = datos.reduce((s, d) => s + d.gastos, 0);
  const balance = totalV - totalG;

  return (
    <div className="rounded-3xl p-5 mb-6 shadow-2xl"
      style={{ background: "rgba(5,25,12,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-black text-base">Tendencia Financiera</p>
          <p className="text-white/40 text-xs">Últimos 6 meses</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#38a169" }} />
            <span className="text-xs text-white/60">Ventas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#e53e3e" }} />
            <span className="text-xs text-white/60">Gastos</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2" style={{ height: 110 }}>
        {datos.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end" style={{ height: 80 }}>
              <div className="flex-1 rounded-t-md transition-all duration-500"
                style={{ height: `${(d.ventas / maxVal) * 100}%`, minHeight: d.ventas > 0 ? 4 : 0, background: "linear-gradient(180deg,#4ade80,#1a6b2a)" }} />
              <div className="flex-1 rounded-t-md transition-all duration-500"
                style={{ height: `${(d.gastos / maxVal) * 100}%`, minHeight: d.gastos > 0 ? 4 : 0, background: "linear-gradient(180deg,#f87171,#7b1a1a)" }} />
            </div>
            <p className="text-white/40 text-xs capitalize">{d.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 grid grid-cols-3 gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(56,161,105,0.15)" }}>
          <p className="text-green-400 font-black text-sm">C$ {fmt(totalV)}</p>
          <p className="text-white/40 text-xs">Ventas 6m</p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(229,62,62,0.15)" }}>
          <p className="text-red-400 font-black text-sm">C$ {fmt(totalG)}</p>
          <p className="text-white/40 text-xs">Gastos 6m</p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: balance >= 0 ? "rgba(56,161,105,0.15)" : "rgba(229,62,62,0.15)" }}>
          <p className="font-black text-sm" style={{ color: balance >= 0 ? "#4ade80" : "#f87171" }}>
            {balance >= 0 ? "+" : ""}C$ {fmt(Math.abs(balance))}
          </p>
          <p className="text-white/40 text-xs">Balance</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [hora, setHora] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const u = getUsuario();
    setUsuario(u);
    api("/ventas/stats").then(setStats).catch(() => {});
    const update = () => {
      const h = new Date().getHours();
      setHora(h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches");
    };
    update();
    const t = setInterval(() => setTick(x => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const a = stats?.animales;
  const v = stats?.ventas;
  const ventasMeses = stats?.grafica?.map(d => d.ventas) || [];
  const gastosMeses = stats?.grafica?.map(d => d.gastos) || [];
  const gastosMes = stats?.gastosMes || 0;
  const balance = (v?.totalMesNIO || 0) - gastosMes;

  const primerNombre = usuario?.nombre?.split(" ")[0] || "Administrador";

  return (
    <AppLayout title="Dashboard" subtitle="Panel de Control">

      {/* ── HERO BIENVENIDA ── */}
      <div className="rounded-3xl overflow-hidden mb-6 shadow-2xl relative"
        style={{ background: "linear-gradient(135deg,rgba(5,30,12,0.9) 0%,rgba(10,40,20,0.95) 100%)", border: "1px solid rgba(45,158,63,0.35)" }}>
        {/* Fondo decorativo animado */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #2d9e3f, transparent)", filter: "blur(40px)", animation: "pulse 4s ease-in-out infinite" }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #d69e2e, transparent)", filter: "blur(30px)", animation: "pulse 5s ease-in-out infinite 1s" }} />
          <div className="absolute top-0 left-0 w-full h-full opacity-5"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(45,158,63,0.3) 20px,rgba(45,158,63,0.3) 21px)" }} />
        </div>

        <div className="relative px-5 py-6 md:px-8 md:py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Sistema activo · {new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}</span>
              </div>
              <p className="text-white/60 text-sm font-medium mb-0.5">{hora},</p>
              <h2 className="text-white font-black text-2xl md:text-3xl leading-tight mb-1">{primerNombre}</h2>
              <p className="text-white/40 text-sm">Bienvenido a <span className="text-green-300 font-bold">Henriquez Cattle Management</span></p>
            </div>
            <div className="flex gap-1 text-4xl md:text-5xl" style={{ lineHeight: 1 }}>
              {["🐄","🐂","🐄"].map((e, i) => (
                <span key={i} className="transition-transform duration-700"
                  style={{ transform: i === 1 ? "scaleX(-1)" : "none", animationDelay: `${i * 0.5}s` }}>{e}</span>
              ))}
            </div>
          </div>

          {/* Mini stats en el hero */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-center">
                <p className="text-green-400 font-black text-xl">{a?.activos ?? "—"}</p>
                <p className="text-white/40 text-xs">Activos hoy</p>
              </div>
              <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="font-black text-xl" style={{ color: "#f6d860" }}>C$ {fmt(v?.totalMesNIO)}</p>
                <p className="text-white/40 text-xs">Ventas este mes</p>
              </div>
              <div className="text-center">
                <p className="font-black text-xl" style={{ color: balance >= 0 ? "#4ade80" : "#f87171" }}>
                  {balance >= 0 ? "+" : ""}C$ {fmt(Math.abs(balance))}
                </p>
                <p className="text-white/40 text-xs">Balance del mes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TARJETAS DE STATS ── */}
      {stats && (
        <>
          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-3">📊 Resumen del Ganado</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <StatCard icon="🐄" label="Total Animales" value={a?.total} sub="En toda la finca"
              color="#2d9e3f" grad="linear-gradient(135deg,rgba(26,107,42,0.9),rgba(45,158,63,0.6))"
              sparkData={[a?.activos, a?.total]} href="/inventario" />
            <StatCard icon="✅" label="Activos" value={a?.activos}
              color="#38a169" grad="linear-gradient(135deg,rgba(26,107,42,0.7),rgba(56,161,105,0.4))"
              href="/inventario" />
            <StatCard icon="🐂" label="Toros / Machos" value={a?.machos}
              color="#3182ce" grad="linear-gradient(135deg,rgba(26,74,138,0.8),rgba(49,130,206,0.5))"
              href="/inventario" />
            <StatCard icon="🐄" label="Vacas / Hembras" value={a?.hembras}
              color="#b83280" grad="linear-gradient(135deg,rgba(112,36,89,0.8),rgba(184,50,128,0.5))"
              href="/inventario" />
            <StatCard icon="🤰" label="Preñadas" value={a?.prenadas ?? "—"}
              color="#e53e3e" grad="linear-gradient(135deg,rgba(123,26,26,0.8),rgba(229,62,62,0.4))"
              href="/inventario" />
            <StatCard icon="⚖️" label="Peso Promedio" value={stats.pesoPromedio > 0 ? `${stats.pesoPromedio.toFixed(0)} kg` : "—"}
              color="#d69e2e" grad="linear-gradient(135deg,rgba(123,79,18,0.8),rgba(214,158,46,0.4))"
              href="/inventario" />
          </div>

          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-3">💰 Finanzas del Mes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <StatCard icon="💰" label="Ventas (NIO)" value={`C$ ${fmt(v?.totalMesNIO)}`}
              color="#d69e2e" grad="linear-gradient(135deg,rgba(123,79,18,0.9),rgba(214,158,46,0.6))"
              sparkData={ventasMeses} href="/ventas" />
            <StatCard icon="💵" label="Ventas (USD)" value={`$ ${fmtD(v?.totalMesUSD)}`}
              color="#38a169" grad="linear-gradient(135deg,rgba(26,107,42,0.8),rgba(56,161,105,0.5))"
              href="/ventas" />
            <StatCard icon="🐮" label="Animales vendidos" value={v?.cantidadMes}
              color="#805ad5" grad="linear-gradient(135deg,rgba(68,51,122,0.8),rgba(128,90,213,0.5))"
              href="/ventas" />
            <StatCard icon="💸" label="Gastos del mes" value={`C$ ${fmt(gastosMes)}`}
              color="#e53e3e" grad="linear-gradient(135deg,rgba(123,26,26,0.8),rgba(229,62,62,0.5))"
              sparkData={gastosMeses} href="/gastos" />
            <StatCard icon="📈" label="Balance del mes" value={`${balance >= 0 ? "+" : ""}C$ ${fmt(Math.abs(balance))}`}
              color={balance >= 0 ? "#38a169" : "#e53e3e"}
              grad={balance >= 0 ? "linear-gradient(135deg,rgba(26,107,42,0.8),rgba(56,161,105,0.5))" : "linear-gradient(135deg,rgba(123,26,26,0.8),rgba(229,62,62,0.5))"}
              href="/ventas" />
            <StatCard icon="📊" label="Histórico total" value={`C$ ${fmt(v?.totalHistoricoNIO)}`}
              color="#3182ce" grad="linear-gradient(135deg,rgba(26,74,138,0.8),rgba(49,130,206,0.5))"
              href="/ventas" />
          </div>

          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-3">📋 Indicadores</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <StatCard icon="💱" label="Tipo de cambio" value={`C$ ${stats.tipoCambio}`} sub="Por 1 USD"
              color="#d69e2e" grad="linear-gradient(135deg,rgba(5,25,12,0.8),rgba(214,158,46,0.2))" />
            <StatCard icon="💉" label="Vacunas este mes" value={stats.vacunasMes}
              color="#2d9e3f" grad="linear-gradient(135deg,rgba(5,25,12,0.8),rgba(45,158,63,0.2))" href="/incidentes" />
            <StatCard icon="📦" label="Vendidos" value={a?.vendidos} sub="Histórico total"
              color="#718096" grad="linear-gradient(135deg,rgba(5,25,12,0.8),rgba(113,128,150,0.2))" href="/ventas" />
          </div>
        </>
      )}

      {/* ── GRÁFICA ── */}
      {stats?.grafica && <GraficaMensual datos={stats.grafica} />}

      {/* ── MÓDULOS ── */}
      <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-4">🗂️ Módulos del Sistema</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
        {MODULOS.map((mod) => (
          <button key={mod.label} onClick={() => router.push(mod.href)}
            className="flex items-center gap-4 rounded-2xl shadow-xl p-5 text-white text-left hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden"
            style={{ background: mod.gradient, border: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity"
              style={{ background: "radial-gradient(circle at 30% 50%, white, transparent)" }} />
            <span style={{ fontSize: 42 }}>{mod.emoji}</span>
            <div className="flex-1">
              <p className="font-black text-base leading-tight">{mod.label}</p>
              <p className="text-xs opacity-60 mt-0.5 font-medium">{mod.sub}</p>
            </div>
            <span className="text-white/30 text-xl">›</span>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
