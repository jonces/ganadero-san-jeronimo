"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUsuario } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const HERO_BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";

function fmt(n, d = 0) { return (n || 0).toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d }); }

/* ── Mini sparkline SVG ── */
function Spark({ data = [], color = "#4ade80", h = 32, w = 72 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h * 0.85}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Gráfica de líneas SVG (doble eje) ── */
function LineChart({ datos = [] }) {
  if (!datos.length) return null;
  const W = 500, H = 160, PAD = { t: 10, b: 30, l: 10, r: 10 };
  const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;
  const maxV = Math.max(...datos.map(d => d.ventas), 1);
  const maxG = Math.max(...datos.map(d => d.gastos), 1);
  const maxAll = Math.max(maxV, maxG);

  const px = i => PAD.l + (i / (datos.length - 1)) * IW;
  const pyV = v => PAD.t + IH - (v / maxAll) * IH;
  const pyG = v => PAD.t + IH - (v / maxAll) * IH;

  const ptsV = datos.map((d, i) => `${px(i)},${pyV(d.ventas)}`).join(" ");
  const ptsG = datos.map((d, i) => `${px(i)},${pyG(d.gastos)}`).join(" ");

  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full" style={{ background: "#4ade80" }} /><span className="text-xs text-white/50">Córdobas (C$)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full" style={{ background: "#60a5fa" }} /><span className="text-xs text-white/50">Dólares (USD)</span></div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PAD.l} y1={PAD.t + IH * (1 - f)} x2={W - PAD.r} y2={PAD.t + IH * (1 - f)}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4" />
        ))}
        {/* Línea gastos (azul) */}
        <polyline points={ptsG} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />
        {/* Puntos gastos */}
        {datos.map((d, i) => <circle key={i} cx={px(i)} cy={pyG(d.gastos)} r="3" fill="#60a5fa" />)}
        {/* Línea ventas (verde) */}
        <polyline points={ptsV} fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Puntos ventas */}
        {datos.map((d, i) => <circle key={i} cx={px(i)} cy={pyV(d.ventas)} r="4" fill="#4ade80" stroke="#020F05" strokeWidth="1.5" />)}
        {/* Labels meses */}
        {datos.map((d, i) => (
          <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="sans-serif">
            {d.label}
          </text>
        ))}
      </svg>
      {/* Resumen mes actual */}
      {datos.length > 0 && (() => {
        const ultimo = datos[datos.length - 1];
        return (
          <p className="text-xs text-white/40 mt-2 text-center">
            {datos[datos.length-1]?.label} 2026 · <span className="text-green-400 font-bold">C$ {fmt(ultimo.ventas)}</span>
            {" · "}
            <span className="text-blue-400 font-bold">C$ {fmt(ultimo.gastos)}</span> gastos
          </p>
        );
      })()}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [animales, setAnimales] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [saludo, setSaludo] = useState("Buenos días");

  useEffect(() => {
    const u = getUsuario();
    setUsuario(u);
    const h = new Date().getHours();
    setSaludo(h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches");
    api("/ventas/stats").then(setStats).catch(() => {});
    api("/animales").then(d => setAnimales(Array.isArray(d) ? d.slice(0, 8) : [])).catch(() => {});
  }, []);

  const a = stats?.animales || {};
  const v = stats?.ventas || {};
  const gastosMes = stats?.gastosMes || 0;
  const balance = (v.totalMesNIO || 0) - gastosMes;
  const ventasMeses = stats?.grafica?.map(d => d.ventas) || [];
  const gastosMeses = stats?.grafica?.map(d => d.gastos) || [];
  const primerNombre = usuario?.nombre?.split(" ")[0] || "Administrador";

  // Próximos eventos simulados a partir de eventos reales (simplificado)
  const eventos = [
    { tipo: "Vacunación", sub: "Múltiple", color: "#2d9e3f", icono: "💉" },
    { tipo: "Pesaje", sub: "Lote activo", color: "#3182ce", icono: "⚖️" },
    { tipo: "Parto esperado", sub: "Hembras preñadas", color: "#d69e2e", icono: "🐣" },
    { tipo: "Revisión vet.", sub: "Control mensual", color: "#805ad5", icono: "🩺" },
  ];

  const STATS_CARDS = stats ? [
    { icon: "🐄", label: "Total Animales", value: fmt(a.total), sub: `${fmt(a.activos)} activos`, color: "#2d9e3f", spark: [a.activos, a.total] },
    { icon: "💰", label: "Ventas del mes", value: `C$ ${fmt(v.totalMesNIO)}`, sub: `$ ${fmt(v.totalMesUSD, 0)} USD`, color: "#d69e2e", spark: ventasMeses },
    { icon: "📈", label: "Balance mes", value: `${balance >= 0 ? "+" : ""}C$ ${fmt(Math.abs(balance))}`, sub: balance >= 0 ? "Ganancia positiva" : "Revisar gastos", color: balance >= 0 ? "#4ade80" : "#f87171", spark: ventasMeses.map((v, i) => v - (gastosMeses[i] || 0)) },
    { icon: "⚖️", label: "Peso Promedio", value: stats.pesoPromedio > 0 ? `${stats.pesoPromedio.toFixed(0)} kg` : "—", sub: "Hato activo", color: "#f6d860", spark: [] },
    { icon: "💉", label: "Vacunas mes", value: fmt(stats.vacunasMes), sub: "Registradas", color: "#38a169", spark: [] },
  ] : [];

  const RESUMEN = stats ? [
    { label: "Ventas", value: v.cantidadMes || 0, delta: null, color: "#d69e2e", href: "/ventas" },
    { label: "Gastos del mes", value: `C$ ${fmt(gastosMes)}`, delta: null, color: "#e53e3e", href: "/gastos" },
    { label: "Animales activos", value: a.activos || 0, delta: null, color: "#2d9e3f", href: "/inventario" },
    { label: "Preñadas", value: a.prenadas || 0, delta: null, color: "#e53e3e", href: "/inventario" },
    { label: "Vacas (hembras)", value: a.hembras || 0, delta: null, color: "#b83280", href: "/inventario" },
    { label: "Toros (machos)", value: a.machos || 0, delta: null, color: "#3182ce", href: "/inventario" },
  ] : [];

  return (
    <AppLayout title="Dashboard" subtitle="Henriquez Cattle Management">

      {/* ── HERO BANNER ── */}
      <div className="rounded-2xl overflow-hidden mb-6 relative shadow-2xl" style={{ height: 200 }}>
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.5) saturate(1.3)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(2,15,5,0.7) 0%,rgba(10,40,20,0.4) 60%,rgba(2,15,5,0.2) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right,rgba(2,15,5,0.8) 0%,transparent 60%)" }} />
        <div className="relative h-full flex items-center px-6 md:px-8">
          <div>
            <p className="text-green-300 font-semibold text-sm mb-1">{saludo}, {primerNombre} 👋</p>
            <h2 className="text-white font-black leading-none mb-1" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)" }}>
              Bienvenido a
            </h2>
            <h2 className="font-black leading-none mb-2" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", background: "linear-gradient(90deg,#4ade80,#86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Henriquez Cattle Management
            </h2>
            <p className="text-white/50 text-sm">El mejor aliado para administrar tu empresa ganadera</p>
            <button onClick={() => router.push("/inventario")}
              className="mt-4 px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)", border: "1px solid rgba(45,158,63,0.5)" }}>
              🐄 Vista rápida
            </button>
          </div>
        </div>
        {/* Emojis decorativos */}
        <div className="absolute right-6 bottom-4 flex gap-2 text-4xl opacity-40 pointer-events-none select-none">
          🐄🐂🐄
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {STATS_CARDS.map((s) => (
            <div key={s.label} className="rounded-2xl p-4 shadow-xl relative overflow-hidden hover:scale-[1.02] transition-transform"
              style={{ background: "rgba(5,25,12,0.75)", backdropFilter: "blur(16px)", border: `1px solid ${s.color}25` }}>
              <div className="absolute top-0 right-0 w-16 h-16 opacity-5 rounded-full" style={{ background: s.color, filter: "blur(20px)", transform: "translate(20%,-20%)" }} />
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
                  {s.icon}
                </div>
                {s.spark.length >= 2 && <Spark data={s.spark} color={s.color} />}
              </div>
              <p className="font-black text-white leading-none" style={{ fontSize: "clamp(1rem,2.5vw,1.3rem)" }}>{s.value}</p>
              <p className="text-white/60 text-xs font-semibold mt-1">{s.label}</p>
              {s.sub && <p className="text-white/35 text-xs mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── 3 COLUMNAS: Resumen · Gráfica · Eventos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Resumen General */}
        <div className="rounded-2xl p-4 shadow-xl"
          style={{ background: "rgba(5,25,12,0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-black text-sm">Resumen General</p>
            <select className="text-xs rounded-lg px-2 py-1 font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <option>Este mes</option>
            </select>
          </div>
          <div className="space-y-2">
            {RESUMEN.map((r) => (
              <button key={r.label} onClick={() => router.push(r.href)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="text-white/70 text-xs font-semibold">{r.label}</span>
                </div>
                <span className="font-black text-white text-sm">{r.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Gráfica de Ventas */}
        <div className="lg:col-span-1 rounded-2xl p-4 shadow-xl"
          style={{ background: "rgba(5,25,12,0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-black text-sm">Gráfica de Ventas</p>
            <span className="text-xs text-white/40 font-bold">Mensual</span>
          </div>
          {stats?.grafica ? <LineChart datos={stats.grafica} /> : (
            <div className="h-40 flex items-center justify-center text-white/20 text-sm">Cargando...</div>
          )}
        </div>

        {/* Próximos Eventos */}
        <div className="rounded-2xl p-4 shadow-xl"
          style={{ background: "rgba(5,25,12,0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-black text-sm">Próximos Eventos</p>
            <button onClick={() => router.push("/incidentes")} className="text-green-400 font-bold text-xs hover:underline">Ver todos</button>
          </div>
          <div className="space-y-2">
            {eventos.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ background: `${e.color}12`, border: `1px solid ${e.color}25` }}>
                <span className="text-lg">{e.icono}</span>
                <div className="flex-1">
                  <p className="text-white font-bold text-xs">{e.tipo}</p>
                  <p className="text-white/40 text-xs">{e.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs"
                  style={{ background: e.color }}>
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/incidentes")}
            className="w-full mt-3 py-2 rounded-xl text-white/60 font-bold text-xs hover:bg-white/5 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Ver todos los eventos →
          </button>
        </div>
      </div>

      {/* ── ANIMALES RECIENTES ── */}
      {animales.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-black text-sm">Animales Recientes</p>
            <button onClick={() => router.push("/inventario")} className="text-green-400 font-bold text-xs hover:underline">Ver todos</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {animales.slice(0, 4).map((animal) => {
              const media = animal.media || [];
              const foto = media.find(m => m.tipo === "FOTO")?.url;
              return (
                <button key={animal.id} onClick={() => router.push(`/inventario/${animal.id}`)}
                  className="rounded-2xl overflow-hidden shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-left"
                  style={{ background: "rgba(5,25,12,0.75)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="relative" style={{ height: 100 }}>
                    {foto
                      ? <img src={foto} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl"
                          style={{ background: animal.sexo === "HEMBRA" ? "rgba(184,50,128,0.15)" : "rgba(49,130,206,0.15)" }}>
                          {animal.sexo === "HEMBRA" ? "🐄" : "🐂"}
                        </div>
                    }
                    {/* Badge raza */}
                    <div className="absolute top-2 left-2">
                      <span className="text-white font-black rounded-full px-2 py-0.5 text-xs"
                        style={{ background: animal.sexo === "HEMBRA" ? "rgba(184,50,128,0.8)" : "rgba(49,130,206,0.8)", backdropFilter: "blur(4px)" }}>
                        {animal.sexo === "HEMBRA" ? "♀" : "♂"}{animal.identificador?.slice(-3)}
                      </span>
                    </div>
                    {/* Menú */}
                    <button className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.4)" }}>
                      <span className="text-white/70 text-xs">···</span>
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-white font-black text-sm truncate">{animal.raza || "Sin raza"}</p>
                    <p className="text-white/40 text-xs">{animal.nombre || animal.identificador}</p>
                    {animal.pesoActual && <p className="text-white/50 text-xs mt-1">⚖️ {animal.pesoActual} kg</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </AppLayout>
  );
}
