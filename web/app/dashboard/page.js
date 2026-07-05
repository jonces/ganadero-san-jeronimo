"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUsuario } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const HERO_BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";

const C = {
  primary: "#145A32", secondary: "#1E8449", text: "#2C3E50",
  textLight: "#7F8C8D", border: "#E2E8F0", white: "#FFFFFF", bg: "#F8F9FA",
};

function fmt(n, d = 0) { return (n || 0).toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d }); }

/* ── Mini sparkline (light mode) ── */
function Spark({ data = [], color = "#145A32" }) {
  if (data.filter(Boolean).length < 2) return <div style={{ height: 40 }} />;
  const clean = data.map(v => v || 0);
  const max = Math.max(...clean, 1);
  const W = 100, H = 40;
  const pts = clean.map((v, i) => `${(i / (clean.length - 1)) * W},${H - (v / max) * H * 0.85 + 3}`).join(" ");
  const area = `${pts} ${W},${H} 0,${H}`;
  const id = `sp${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Gráfica líneas doble eje (light mode) ── */
function LineChart({ datos = [], tipoCambio = 36.5 }) {
  if (!datos?.length) return <div className="h-40 flex items-center justify-center text-sm" style={{ color: C.textLight }}>Sin datos</div>;
  const W = 520, H = 160, PL = 52, PR = 52, PT = 16, PB = 28;
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
        <span className="flex items-center gap-1.5 text-xs" style={{ color: C.textLight }}>
          <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: C.primary }} />Ventas (C$)
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: C.textLight }}>
          <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: "#E74C3C" }} />Gastos (C$)
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f, fi) => {
          const y = PT + IH * (1 - f);
          return (
            <g key={fi}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="9">{fmt(nioTicks[fi])}K</text>
              <text x={W - PR + 6} y={y + 4} textAnchor="start" fill="#94A3B8" fontSize="9">{usdTicks[fi]}K</text>
            </g>
          );
        })}
        <polygon points={`${ptsG} ${W - PR},${PT + IH} ${PL},${PT + IH}`} fill="rgba(231,76,60,0.08)" />
        <polyline points={ptsG} fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {datos.map((d, i) => <circle key={`g${i}`} cx={px(i)} cy={py(d.gastos, maxNIO)} r="3" fill="#E74C3C" />)}
        <polygon points={`${ptsV} ${W - PR},${PT + IH} ${PL},${PT + IH}`} fill="rgba(20,90,50,0.08)" />
        <polyline points={ptsV} fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {datos.map((d, i) => (
          <circle key={`v${i}`} cx={px(i)} cy={py(d.ventas, maxNIO)} r="4.5" fill={C.primary} stroke={C.white} strokeWidth="1.5" />
        ))}
        {datos.map((d, i) => (
          <text key={`l${i}`} x={px(i)} y={H - 4} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ── Stat card component ── */
function StatCard({ icon, bg, label, value, delta, deltaPos, spark, sparkColor, href, onClick }) {
  return (
    <button onClick={onClick}
      className="rounded-2xl p-5 text-left transition-all hover:shadow-lg active:scale-95 relative overflow-hidden"
      style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md"
          style={{ background: bg }}>
          {icon}
        </div>
      </div>
      <p className="font-black text-xl leading-none mb-1" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>{value}</p>
      <p className="font-semibold text-xs mb-3" style={{ color: C.textLight }}>{label}</p>
      <div className="mb-2" style={{ height: 36 }}>
        {spark?.length >= 2 ? <Spark data={spark} color={sparkColor} /> : <div style={{ height: 36 }} />}
      </div>
      <p className={`text-xs font-bold`} style={{ color: deltaPos ? C.secondary : "#E74C3C" }}>{delta}</p>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [todosAnimales, setTodosAnimales] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [saludo, setSaludo] = useState("Buenos días");
  const [ahora, setAhora] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  async function cargarDatos() {
    try {
      const [s, a] = await Promise.all([
        api("/ventas/stats"),
        api("/animales"),
      ]);
      setStats(s);
      const lista = Array.isArray(a) ? a : [];
      setTodosAnimales(lista);
      setAnimales(lista.filter(x => x.estado === "ACTIVO").slice(0, 4));
      setUltimaActualizacion(new Date());
    } catch {}
  }

  async function refrescar() {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  }

  useEffect(() => {
    setUsuario(getUsuario());
    const h = new Date().getHours();
    setSaludo(h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches");
    setAhora(new Date().toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }));
    cargarDatos();
    const interval = setInterval(cargarDatos, 10000);
    return () => clearInterval(interval);
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

  // Contar directamente desde los animales traídos (fuente confiable, igual que el inventario)
  const hoy2 = new Date();
  const inicioMes = new Date(hoy2.getFullYear(), hoy2.getMonth(), 1);
  const activosReal = todosAnimales.filter(x => x.estado === "ACTIVO").length;
  const prenadasReal = todosAnimales.filter(x =>
    x.sexo === "HEMBRA" && x.estadoReproductivo === "PREÑADA"
  ).length;
  const nacimientosReal = todosAnimales.filter(x =>
    x.fechaNacimiento && new Date(x.fechaNacimiento) >= inicioMes
  ).length;
  const muertesReal = todosAnimales.filter(x => x.estado === "MUERTO").length;

  const CARDS = stats ? [
    {
      icon: "🐄", bg: "linear-gradient(135deg,#145A32,#1E8449)", label: "Total Animales",
      value: fmt(a.total), delta: `+${a.nacimientosMes || 0} este mes`, deltaPos: true,
      spark: ventasSpark, sparkColor: C.primary, href: "/inventario",
    },
    {
      icon: "💰", bg: "linear-gradient(135deg,#1565C0,#1E88E5)", label: "Ventas del mes",
      value: `C$ ${fmt(v.totalMesNIO)}`, delta: `${fmt(v.cantidadMes || 0)} ventas`, deltaPos: true,
      spark: ventasSpark, sparkColor: "#1E88E5", href: "/ventas",
    },
    {
      icon: "📈", bg: "linear-gradient(135deg,#6A1B9A,#8E24AA)", label: "Ganancias",
      value: `C$ ${fmt(Math.abs(balance))}`,
      delta: balance >= 0 ? `+${fmt((balance / Math.max(v.totalMesNIO || 1, 1) * 100), 0)}% margen` : "Revisar gastos",
      deltaPos: balance >= 0, spark: gastosSpark, sparkColor: "#8E24AA", href: "/gastos",
    },
    {
      icon: "⚖️", bg: "linear-gradient(135deg,#E65100,#F57C00)", label: "Peso Promedio",
      value: stats.pesoPromedio > 0 ? `${stats.pesoPromedio.toFixed(0)} kg` : "— kg",
      delta: `Hato activo (${fmt(a.activos)})`, deltaPos: true,
      spark: [], sparkColor: "#F57C00", href: "/inventario",
    },
    {
      icon: "💉", bg: "linear-gradient(135deg,#00695C,#00897B)", label: "Vacunas",
      value: fmt(stats.vacunasMes), delta: "Ver calendario",
      deltaPos: true, spark: [], sparkColor: "#00897B", href: "/incidentes",
    },
  ] : [];

  const RESUMEN = todosAnimales.length > 0 || stats ? [
    { icon: "🍼", label: "Nacimientos", value: nacimientosReal, delta: `+${nacimientosReal}`, pos: true, href: "/inventario" },
    { icon: "💀", label: "Muertes", value: muertesReal, delta: muertesReal > 0 ? `-${muertesReal}` : "0", pos: false, href: "/inventario" },
    { icon: "💰", label: "Ventas", value: v.cantidadMes || 0, delta: `+${v.cantidadMes || 0}`, pos: true, href: "/ventas" },
    { icon: "💸", label: "Gastos", value: `C$ ${fmt(gastosMes)}`, delta: gastosMes > 0 ? `C$ ${fmt(gastosMes)}` : "—", pos: false, href: "/gastos" },
    { icon: "🐄", label: "Activos", value: activosReal, delta: `${activosReal}`, pos: true, href: "/inventario" },
    { icon: "🤰", label: "Preñadas", value: prenadasReal, delta: `${prenadasReal}`, pos: prenadasReal > 0, href: "/inventario?filtro=PREÑADA" },
  ] : [];

  const hoy = new Date();
  const EVENTOS = [
    { icon: "💉", label: "Vacunación", sub: "Múltiple", color: C.primary, fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 3) },
    { icon: "🩺", label: "Chequeo Veterinario", sub: "Lote 23", color: "#1565C0", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 5) },
    { icon: "🤰", label: "Inseminación", sub: "Vacas Seleccionadas", color: "#6A1B9A", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 8) },
    { icon: "🐣", label: "Destete", sub: "Terneros Lote 12", color: "#E65100", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 12) },
  ];

  function edadMeses(fecha) {
    if (!fecha) return null;
    return Math.round((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24 * 30.4));
  }

  const RAZAS_COLORS = { Brangus: "#E74C3C", Brahman: "#F39C12", Nelore: "#3498DB", Gyr: "#27AE60", default: "#95A5A6" };

  const cardStyle = { background: C.white, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Henriquez Cattle Management"
      searchBar={
        <div className="relative flex-1 max-w-md hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.textLight }}>🔍</span>
          <input
            className="w-full rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, "--tw-ring-color": C.secondary }}
            placeholder="Buscar animales, ventas, potreros..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={handleBusqueda}
          />
        </div>
      }
      rightExtra={
        <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: C.textLight }}>
          <span className="font-semibold">{ahora}</span>
          <span className="text-lg">☀️</span>
        </div>
      }
    >

      {/* ── HERO ── */}
      <div className="rounded-2xl overflow-hidden mb-6 relative shadow-xl" style={{ height: 220 }}>
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.4) saturate(1.2)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(10,50,20,0.92) 0%,rgba(20,90,50,0.6) 55%,rgba(10,30,20,0.2) 100%)" }} />
        <div className="relative h-full flex items-center px-8">
          <div>
            <p className="font-semibold text-sm mb-1.5" style={{ color: "#86efac" }}>
              {saludo}, <span className="text-white font-black">{usuario?.nombre || "Usuario"}</span> 👋
            </p>
            <p className="font-medium text-base" style={{ color: "rgba(255,255,255,0.7)" }}>Bienvenido a</p>
            <h2 className="text-white font-black leading-none" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontFamily: "var(--font-poppins)" }}>Henriquez</h2>
            <h2 className="font-black leading-none mb-3" style={{
              fontSize: "clamp(1.8rem,4vw,2.6rem)", fontFamily: "var(--font-poppins)",
              background: "linear-gradient(90deg,#4ade80,#86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Cattle Management</h2>
            <button onClick={() => router.push("/inventario")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:scale-105 transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg,#145A32,#27AE60)", border: "1px solid rgba(74,222,128,0.4)" }}>
              🐄 Vista rápida
            </button>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          {CARDS.map((c) => (
            <StatCard key={c.label} {...c} onClick={() => router.push(c.href)} />
          ))}
        </div>
      )}

      {/* ── 3 COLUMNAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Resumen General */}
        <div className="rounded-2xl shadow overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p className="font-black text-sm" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>Resumen General</p>
              {ultimaActualizacion && (
                <p style={{ fontSize: 10, color: C.textLight }}>
                  Actualizado: {ultimaActualizacion.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              )}
            </div>
            <button
              onClick={refrescar}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
              style={{ background: C.primary, color: "#fff" }}>
              <span style={{ display: "inline-block", transform: refreshing ? "rotate(360deg)" : "none", transition: refreshing ? "transform 0.6s linear" : "none" }}>↻</span>
              {refreshing ? "..." : "Actualizar"}
            </button>
          </div>
          <div className="px-3 py-2">
            {RESUMEN.map((r, i) => (
              <button key={i} onClick={() => router.push(r.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all"
                style={{ borderBottom: i < RESUMEN.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span className="text-base w-5 text-center">{r.icon}</span>
                <span className="flex-1 text-left font-semibold text-xs" style={{ color: C.textLight }}>{r.label}</span>
                <span className="font-black text-sm" style={{ color: C.text }}>{r.value}</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded-full min-w-[32px] text-center"
                  style={{
                    color: r.pos ? C.secondary : "#E74C3C",
                    background: r.pos ? "#EBF5EB" : "#FDEDEC",
                  }}>
                  {r.delta}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Gráfica de Ventas */}
        <div className="rounded-2xl shadow overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <p className="font-black text-sm" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>Gráfica de Ventas</p>
            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: C.bg, color: C.textLight, border: `1px solid ${C.border}` }}>
              6 meses ▾
            </span>
          </div>
          <div className="px-4 py-3">
            <LineChart datos={grafica} tipoCambio={tc} />
            {grafica.length > 0 && (() => {
              const ult = grafica[grafica.length - 1];
              return (
                <p className="text-xs mt-2 text-center" style={{ color: C.textLight }}>
                  {ult.label.charAt(0).toUpperCase() + ult.label.slice(1)} ·{" "}
                  <span style={{ color: C.primary, fontWeight: 700 }}>C$ {fmt(ult.ventas)}</span>
                  {" · "}<span style={{ color: "#1E88E5", fontWeight: 700 }}>USD ${fmt(ult.ventas / tc, 0)}</span>
                </p>
              );
            })()}
          </div>
        </div>

        {/* Próximos Eventos */}
        <div className="rounded-2xl shadow overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <p className="font-black text-sm" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>Próximos Eventos</p>
            <button onClick={() => router.push("/incidentes")} className="text-xs font-bold hover:underline" style={{ color: C.secondary }}>
              Ver calendario
            </button>
          </div>
          <div className="px-3 py-2 space-y-1">
            {EVENTOS.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${e.color}18`, border: `1px solid ${e.color}30` }}>
                  {e.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs truncate" style={{ color: C.text }}>{e.label}</p>
                  <p className="text-xs truncate" style={{ color: C.textLight }}>{e.sub}</p>
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
              className="w-full py-2.5 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
              style={{ color: C.textLight, border: `1px solid ${C.border}` }}>
              Ver todos los eventos →
            </button>
          </div>
        </div>
      </div>

      {/* ── ANIMALES RECIENTES ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-sm" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>Animales Recientes</p>
          <button onClick={() => router.push("/inventario")} className="font-bold text-xs hover:underline" style={{ color: C.secondary }}>Ver todos</button>
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
                className="rounded-2xl overflow-hidden hover:shadow-xl active:scale-95 transition-all text-left"
                style={cardStyle}>
                <div className="relative" style={{ height: 110 }}>
                  {foto
                    ? <img src={foto} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl"
                        style={{ background: isHembra ? "#FCE4EC" : "#E3F2FD" }}>
                        {isHembra ? "🐄" : "🐂"}
                      </div>
                  }
                  <div className="absolute top-2 left-2">
                    <span className="text-white font-black text-xs px-2 py-0.5 rounded-full"
                      style={{ background: razaColor + "ee" }}>
                      {animal.sexo === "HEMBRA" ? "♀" : "♂"}{animal.identificador?.slice(-3)}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-black text-sm truncate" style={{ color: C.text }}>{animal.raza || "Sin raza"}</p>
                  <p className="text-xs truncate" style={{ color: C.textLight }}>{animal.nombre || animal.identificador}</p>
                  <div className="mt-1.5 space-y-0.5">
                    {animal.pesoActual && <p className="text-xs" style={{ color: C.textLight }}>Peso: {animal.pesoActual} kg</p>}
                    {edad !== null && <p className="text-xs" style={{ color: C.textLight }}>Edad: {edad} meses</p>}
                  </div>
                </div>
              </button>
            );
          })}
          {animales.length === 0 && (
            <div className="col-span-4 text-center py-12 rounded-2xl" style={{ ...cardStyle, color: C.textLight }}>
              No hay animales activos registrados
            </div>
          )}
        </div>
      </div>

    </AppLayout>
  );
}
