"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUsuario } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const HERO_BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";

function fmt(n, d = 0) { return (n || 0).toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d }); }

/* ── Mini sparkline ── */
function Spark({ data = [], color = "#4ade80" }) {
  if (data.filter(Boolean).length < 2) return <div style={{ height: 40 }} />;
  const clean = data.map(v => v || 0);
  const max = Math.max(...clean, 1);
  const W = 100, H = 40;
  const pts = clean.map((v, i) => `${(i / (clean.length - 1)) * W},${H - (v / max) * H * 0.9 + 2}`).join(" ");
  const area = `${pts} ${W},${H} 0,${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp${color.replace(/[^a-z0-9]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sp${color.replace(/[^a-z0-9]/gi,"")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Gráfica de líneas doble eje ── */
function LineChart({ datos = [], tipoCambio = 36.5 }) {
  if (!datos?.length) return <div className="h-40 flex items-center justify-center text-white/20 text-sm">Sin datos</div>;
  const W = 520, H = 160, PL = 50, PR = 50, PT = 16, PB = 28;
  const IW = W - PL - PR, IH = H - PT - PB;
  const maxNIO = Math.max(...datos.map(d => d.ventas), 1);
  const px = i => PL + (i / (datos.length - 1)) * IW;
  const py = (v, max) => PT + IH - (v / max) * IH;

  const ptsV = datos.map((d, i) => `${px(i)},${py(d.ventas, maxNIO)}`).join(" ");
  const ptsG = datos.map((d, i) => `${px(i)},${py(d.gastos, maxNIO)}`).join(" ");

  const nioTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxNIO * f / 1000));
  const usdTicks = nioTicks.map(v => Math.round((v * 1000) / tipoCambio / 1000));

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <span className="flex items-center gap-1.5 text-xs text-white/50"><span className="w-4 h-0.5 rounded-full inline-block" style={{ background: "#4ade80" }} />Córdobas (C$)</span>
        <span className="flex items-center gap-1.5 text-xs text-white/50"><span className="w-4 h-0.5 rounded-full inline-block" style={{ background: "#60a5fa" }} />Dólares (USD)</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {/* Grid horizontales */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, fi) => {
          const y = PT + IH * (1 - f);
          return (
            <g key={fi}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9">{fmt(nioTicks[fi])}K</text>
              <text x={W - PR + 6} y={y + 4} textAnchor="start" fill="rgba(96,165,250,0.5)" fontSize="9">{usdTicks[fi]}K</text>
            </g>
          );
        })}
        {/* Área gastos */}
        <polygon points={`${ptsG} ${W - PR},${PT + IH} ${PL},${PT + IH}`} fill="rgba(96,165,250,0.08)" />
        {/* Línea gastos */}
        <polyline points={ptsG} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Puntos gastos */}
        {datos.map((d, i) => <circle key={`g${i}`} cx={px(i)} cy={py(d.gastos, maxNIO)} r="3" fill="#60a5fa" />)}
        {/* Área ventas */}
        <polygon points={`${ptsV} ${W - PR},${PT + IH} ${PL},${PT + IH}`} fill="rgba(74,222,128,0.08)" />
        {/* Línea ventas */}
        <polyline points={ptsV} fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Puntos ventas */}
        {datos.map((d, i) => (
          <circle key={`v${i}`} cx={px(i)} cy={py(d.ventas, maxNIO)} r="4.5" fill="#4ade80" stroke="#020F05" strokeWidth="1.5" />
        ))}
        {/* Labels meses */}
        {datos.map((d, i) => (
          <text key={`l${i}`} x={px(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="sans-serif" textTransform="capitalize">
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [animales, setAnimales] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [saludo, setSaludo] = useState("Buenos días");
  const [ahora, setAhora] = useState("");

  useEffect(() => {
    setUsuario(getUsuario());
    const h = new Date().getHours();
    setSaludo(h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches");
    setAhora(new Date().toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }));
    api("/ventas/stats").then(setStats).catch(() => {});
    api("/animales").then(d => setAnimales(Array.isArray(d) ? d.filter(a => a.estado === "ACTIVO").slice(0, 4) : [])).catch(() => {});
  }, []);

  function handleBusqueda(e) {
    if (e.key === "Enter" && busqueda.trim()) router.push(`/inventario?q=${encodeURIComponent(busqueda.trim())}`);
  }

  const a = stats?.animales || {};
  const v = stats?.ventas || {};
  const gastosMes = stats?.gastosMes || 0;
  const balance = (v.totalMesNIO || 0) - gastosMes;
  const tc = stats?.tipoCambio || 36.5;
  const grafica = stats?.grafica || [];
  const ventasSpark = grafica.map(d => d.ventas);
  const gastosSpark = grafica.map(d => d.gastos);

  /* ── Stat cards idénticas al mockup ── */
  const CARDS = stats ? [
    {
      icon: "🐄", bg: "#16a34a", label: "Total Animales",
      value: fmt(a.total), delta: `+${a.nacimientosMes || 0} este mes`,
      deltaPos: true, spark: ventasSpark, sparkColor: "#4ade80", href: "/inventario",
    },
    {
      icon: "💰", bg: "#2563eb", label: "Ventas del mes",
      value: `C$ ${fmt(v.totalMesNIO)}`,
      delta: `+${fmt(v.cantidadMes || 0)} animales`,
      deltaPos: true, spark: ventasSpark, sparkColor: "#60a5fa", href: "/ventas",
    },
    {
      icon: "📈", bg: "#7c3aed", label: "Ganancias",
      value: `C$ ${fmt(Math.abs(balance))}`,
      delta: balance >= 0 ? `+${fmt((balance / Math.max(v.totalMesNIO, 1) * 100), 0)}% margen` : "Revisar gastos",
      deltaPos: balance >= 0, spark: gastosSpark, sparkColor: "#a78bfa", href: "/gastos",
    },
    {
      icon: "⚖️", bg: "#d97706", label: "Peso Promedio",
      value: stats.pesoPromedio > 0 ? `${stats.pesoPromedio.toFixed(0)} kg` : "— kg",
      delta: `Hato activo (${fmt(a.activos)})`,
      deltaPos: true, spark: [], sparkColor: "#fbbf24", href: "/inventario",
    },
    {
      icon: "💉", bg: "#0891b2", label: "Vacunas Pendientes",
      value: fmt(stats.vacunasMes),
      delta: "Ver calendario",
      deltaPos: true, spark: [], sparkColor: "#22d3ee", href: "/incidentes", deltaLink: true,
    },
  ] : [];

  /* ── Resumen General ── */
  const RESUMEN = stats ? [
    { icon: "🍼", label: "Nacimientos", value: a.nacimientosMes || 0, delta: `+${a.nacimientosMes || 0}`, pos: true, href: "/inventario" },
    { icon: "💀", label: "Muertes", value: a.muertesMes || 0, delta: a.muertesMes > 0 ? `-${a.muertesMes}` : "0", pos: false, href: "/inventario" },
    { icon: "💰", label: "Ventas", value: v.cantidadMes || 0, delta: `+${v.cantidadMes || 0}`, pos: true, href: "/ventas" },
    { icon: "💸", label: "Gastos", value: `C$ ${fmt(gastosMes)}`, delta: gastosMes > 0 ? `C$ ${fmt(gastosMes)}` : "—", pos: false, href: "/gastos" },
    { icon: "🐄", label: "Activos", value: a.activos || 0, delta: `${fmt(a.activos)}`, pos: true, href: "/inventario" },
    { icon: "🤰", label: "Preñadas", value: a.prenadas || 0, delta: `${a.prenadas || 0}`, pos: (a.prenadas || 0) > 0, href: "/inventario" },
  ] : [];

  /* ── Próximos eventos ── */
  const hoy = new Date();
  const EVENTOS = [
    { icon: "💉", label: "Vacunación", sub: "Múltiple", color: "#16a34a",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 3) },
    { icon: "🩺", label: "Chequeo Veterinario", sub: "Lote 23", color: "#2563eb",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 5) },
    { icon: "🤰", label: "Inseminación", sub: "Vacas Seleccionadas", color: "#7c3aed",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 8) },
    { icon: "🐣", label: "Destete", sub: "Terneros Lote 12", color: "#d97706",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 12) },
  ];

  function edadMeses(fecha) {
    if (!fecha) return null;
    const d = new Date(fecha);
    const m = (new Date() - d) / (1000 * 60 * 60 * 24 * 30.4);
    return Math.round(m);
  }

  const RAZAS_COLORS = { Brangus: "#e53e3e", Brahman: "#d69e2e", Nelore: "#3182ce", Gyr: "#2d9e3f", default: "#718096" };

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Henriquez Cattle Management"
      searchBar={
        <div className="relative flex-1 max-w-md hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
          <input
            className="w-full rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            placeholder="Buscar animales, ventas, potreros..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={handleBusqueda}
          />
        </div>
      }
      rightExtra={
        <div className="hidden md:flex items-center gap-2 text-xs text-white/60">
          <span className="font-semibold">{ahora}</span>
          <span className="text-lg">☀️</span>
        </div>
      }
    >

      {/* ── HERO ── */}
      <div className="rounded-2xl overflow-hidden mb-5 relative shadow-2xl" style={{ height: 220 }}>
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.45) saturate(1.3)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(2,10,5,0.88) 0%,rgba(5,25,12,0.55) 55%,rgba(2,10,5,0.1) 100%)" }} />
        <div className="relative h-full flex items-center px-8">
          <div>
            <p className="text-green-300 font-semibold text-sm mb-1.5">{saludo} 👋</p>
            <p className="text-white/70 text-base font-medium">Bienvenido a</p>
            <h2 className="text-white font-black leading-none" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>Henriquez</h2>
            <h2 className="font-black leading-none mb-2" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", background: "linear-gradient(90deg,#4ade80,#86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Cattle Management
            </h2>
            <p className="text-white/50 text-sm mb-4">El mejor aliado para administrar tu empresa ganadera</p>
            <button onClick={() => router.push("/inventario")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:scale-105 transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg,#15803d,#22c55e)", border: "1px solid rgba(74,222,128,0.4)" }}>
              🐄 Vista rápida
            </button>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
          {CARDS.map((c) => (
            <button key={c.label} onClick={() => router.push(c.href)}
              className="rounded-2xl p-4 text-left shadow-xl hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden"
              style={{ background: "rgba(5,20,10,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between mb-3">
                {/* Icono cuadrado con color */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
                  style={{ background: c.bg }}>
                  {c.icon}
                </div>
              </div>
              <p className="text-white font-black text-xl leading-none mb-1">{c.value}</p>
              <p className="text-white/50 text-xs font-semibold mb-3">{c.label}</p>
              {/* Sparkline */}
              <div className="mb-2" style={{ height: 40 }}>
                {c.spark.length >= 2 ? <Spark data={c.spark} color={c.sparkColor} /> : <div style={{ height: 40 }} />}
              </div>
              {/* Delta */}
              <p className={`text-xs font-bold ${c.deltaLink ? "text-green-400" : c.deltaPos ? "text-green-400" : "text-red-400"}`}>
                {c.deltaLink ? <span className="underline">{c.delta}</span> : c.delta}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ── 3 COLUMNAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

        {/* Resumen General */}
        <div className="rounded-2xl shadow-xl overflow-hidden"
          style={{ background: "rgba(5,20,10,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white font-black text-sm">Resumen General</p>
            <span className="text-xs text-white/40 font-bold px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Este mes ▾
            </span>
          </div>
          <div className="px-3 py-2">
            {RESUMEN.map((r, i) => (
              <button key={i} onClick={() => router.push(r.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
                style={{ borderBottom: i < RESUMEN.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span className="text-base w-5 text-center">{r.icon}</span>
                <span className="flex-1 text-left text-white/70 text-xs font-semibold">{r.label}</span>
                <span className="text-white font-black text-sm">{r.value}</span>
                <span className={`text-xs font-black px-1.5 py-0.5 rounded-full min-w-[32px] text-center ${r.pos ? "text-green-400" : "text-red-400"}`}
                  style={{ background: r.pos ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)" }}>
                  {r.delta}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Gráfica de Ventas */}
        <div className="rounded-2xl shadow-xl overflow-hidden"
          style={{ background: "rgba(5,20,10,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white font-black text-sm">Gráfica de Ventas</p>
            <span className="text-xs text-white/40 font-bold px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Mensual ▾
            </span>
          </div>
          <div className="px-4 py-3">
            <LineChart datos={grafica} tipoCambio={tc} />
            {grafica.length > 0 && (() => {
              const ult = grafica[grafica.length - 1];
              return (
                <p className="text-xs text-white/35 mt-2 text-center">
                  {ult.label.charAt(0).toUpperCase() + ult.label.slice(1)} · <span className="text-green-400 font-bold">C$ {fmt(ult.ventas)}</span>
                  {" · "}<span className="text-blue-400 font-bold">USD ${fmt(ult.ventas / tc, 0)}</span>
                </p>
              );
            })()}
          </div>
        </div>

        {/* Próximos Eventos */}
        <div className="rounded-2xl shadow-xl overflow-hidden"
          style={{ background: "rgba(5,20,10,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white font-black text-sm">Próximos Eventos</p>
            <button onClick={() => router.push("/incidentes")} className="text-green-400 font-bold text-xs hover:underline">Ver calendario</button>
          </div>
          <div className="px-3 py-2 space-y-1">
            {EVENTOS.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${e.color}25`, border: `1px solid ${e.color}40` }}>
                  {e.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-xs truncate">{e.label}</p>
                  <p className="text-white/40 text-xs truncate">{e.sub}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-xs" style={{ color: e.color }}>
                    {e.fecha.toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3">
            <button onClick={() => router.push("/incidentes")}
              className="w-full py-2.5 rounded-xl text-white/50 font-bold text-xs hover:bg-white/5 transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              Ver todos los eventos →
            </button>
          </div>
        </div>
      </div>

      {/* ── ANIMALES RECIENTES ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-black text-sm">Animales Recientes</p>
          <button onClick={() => router.push("/inventario")} className="text-green-400 font-bold text-xs hover:underline">Ver todos</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {animales.slice(0, 4).map((animal) => {
            const fotos = (animal.media || []).filter(m => m.tipo === "FOTO");
            const foto = fotos[0]?.url;
            const edad = edadMeses(animal.fechaNacimiento);
            const razaColor = RAZAS_COLORS[animal.raza] || RAZAS_COLORS.default;
            const isHembra = animal.sexo === "HEMBRA";
            return (
              <button key={animal.id} onClick={() => router.push(`/inventario/${animal.id}`)}
                className="rounded-2xl overflow-hidden shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-left"
                style={{ background: "rgba(5,20,10,0.82)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* Foto */}
                <div className="relative" style={{ height: 110 }}>
                  {foto
                    ? <img src={foto} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl"
                        style={{ background: isHembra ? "rgba(184,50,128,0.12)" : "rgba(49,130,206,0.12)" }}>
                        {isHembra ? "🐄" : "🐂"}
                      </div>
                  }
                  {/* Badge identificador */}
                  <div className="absolute top-2 left-2">
                    <span className="text-white font-black text-xs px-2 py-0.5 rounded-full"
                      style={{ background: razaColor + "cc", backdropFilter: "blur(4px)" }}>
                      {animal.sexo === "HEMBRA" ? "♀" : "♂"}{animal.identificador?.slice(-3)}
                    </span>
                  </div>
                  {/* Menu */}
                  <button className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 transition-all"
                    style={{ background: "rgba(0,0,0,0.45)" }}>
                    ···
                  </button>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-white font-black text-sm truncate">{animal.raza || "Sin raza"}</p>
                  <p className="text-white/45 text-xs truncate">{animal.nombre || animal.identificador}</p>
                  <div className="mt-1.5 space-y-0.5">
                    {animal.pesoActual && <p className="text-white/50 text-xs">Peso: {animal.pesoActual} kg</p>}
                    {edad !== null && <p className="text-white/50 text-xs">Edad: {edad} meses</p>}
                  </div>
                </div>
              </button>
            );
          })}
          {animales.length === 0 && (
            <div className="col-span-4 text-center py-8 text-white/30 text-sm">
              No hay animales activos registrados
            </div>
          )}
        </div>
      </div>

    </AppLayout>
  );
}
