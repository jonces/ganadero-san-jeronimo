"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getUsuario } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

// ── Colores ──
const COLOR = {
  green:   "#16a34a",
  greenDk: "#14532d",
  bg:      "#F8FAFC",
  white:   "#ffffff",
  text:    "#172033",
  muted:   "#64748B",
  border:  "#E2E8F0",
  blue:    "#2563EB",
  red:     "#DC2626",
  orange:  "#EA580C",
  purple:  "#7C3AED",
};

// ── Keyframes CSS ──
const CSS = `
@keyframes pulse {
  0%,100% { opacity:1; }
  50% { opacity:0.4; }
}
@keyframes fadeIn {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
`;

// ── Skeleton loader ──
function Sk({ w = "100%", h = 20, r = 6 }) {
  return <div style={{ width: w, height: h, background: "#E2E8F0", borderRadius: r, animation: "pulse 1.5s ease-in-out infinite" }} />;
}

// ── Formateador ──
function fmt(valor, tipo = "moneda", mon = "NIO") {
  if (valor === null || valor === undefined || isNaN(valor)) return "—";
  if (tipo === "numero") return Number(valor).toLocaleString("es-NI");
  const sym = mon === "USD" ? "$ " : "C$ ";
  return sym + Number(valor).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Badge de categoría ──
const CAT_LABEL = {
  ALIMENTACION: "Alimentación", MEDICAMENTO: "Medicamento",
  MANTENIMIENTO: "Mantenimiento", SALARIO: "Salario",
  COMBUSTIBLE: "Combustible", OTRO: "Otro",
};

// ── Gráfica financiera SVG ──
function GraficaFinanciera({ datos = [] }) {
  const [hover, setHover] = useState(null);
  if (!datos.length) return <div style={{ height: 160, display:"flex", alignItems:"center", justifyContent:"center", color: COLOR.muted, fontSize: 13 }}>Sin datos</div>;

  const W = 540, H = 180, PL = 50, PR = 16, PT = 16, PB = 28;
  const IW = W - PL - PR, IH = H - PT - PB;

  const allVals = datos.flatMap(d => [d.ingresos, d.gastos]);
  const maxVal = Math.max(...allVals, 1);

  const px = i => PL + (i / (datos.length - 1)) * IW;
  const py = v => PT + IH - (v / maxVal) * IH * 0.9;

  const ptsI = datos.map((d, i) => `${px(i)},${py(d.ingresos)}`).join(" ");
  const ptsG = datos.map((d, i) => `${px(i)},${py(d.gastos)}`).join(" ");

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }} onMouseLeave={() => setHover(null)}>
        {ticks.map((f, fi) => {
          const y = PT + IH * (1 - f);
          const v = Math.round(maxVal * f / 1000);
          return (
            <g key={fi}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="9">{v}K</text>
            </g>
          );
        })}

        {/* Barras flujo neto */}
        {datos.map((d, i) => {
          const bw = Math.max(IW / datos.length * 0.35, 8);
          const neto = d.flujoNeto || 0;
          const bh = Math.abs(neto) / maxVal * IH * 0.9;
          const col = neto >= 0 ? "rgba(22,163,74,0.18)" : "rgba(220,38,38,0.18)";
          const baseY = py(0);
          return <rect key={i} x={px(i) - bw / 2} y={neto >= 0 ? py(neto) : baseY} width={bw} height={bh} fill={col} rx="3" />;
        })}

        {/* Línea gastos */}
        <polygon points={`${ptsG} ${W - PR},${PT + IH} ${PL},${PT + IH}`} fill="rgba(220,38,38,0.06)" />
        <polyline points={ptsG} fill="none" stroke={COLOR.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Línea ingresos */}
        <polygon points={`${ptsI} ${W - PR},${PT + IH} ${PL},${PT + IH}`} fill="rgba(22,163,74,0.08)" />
        <polyline points={ptsI} fill="none" stroke={COLOR.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos y hover */}
        {datos.map((d, i) => (
          <g key={`pt${i}`}>
            <circle cx={px(i)} cy={py(d.ingresos)} r="4" fill={COLOR.green} stroke="#fff" strokeWidth="1.5"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover({ i, x: px(i), d })} />
            <circle cx={px(i)} cy={py(d.gastos)} r="3" fill={COLOR.red} stroke="#fff" strokeWidth="1.5"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover({ i, x: px(i), d })} />
            <text x={px(i)} y={H - 6} textAnchor="middle" fill="#94A3B8" fontSize="9">{d.mes}</text>
          </g>
        ))}

        {/* Tooltip */}
        {hover && (() => {
          const tx = Math.min(hover.x, W - 110);
          return (
            <g>
              <rect x={tx - 4} y={PT} width={115} height={58} rx="6" fill="#172033" opacity="0.92" />
              <text x={tx + 53} y={PT + 14} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">{hover.d.mes?.toUpperCase()}</text>
              <text x={tx + 4} y={PT + 27} fill="#4ade80" fontSize="9">Ingresos: C${Math.round((hover.d.ingresos || 0) / 1000)}K</text>
              <text x={tx + 4} y={PT + 39} fill="#f87171" fontSize="9">Gastos: C${Math.round((hover.d.gastos || 0) / 1000)}K</text>
              <text x={tx + 4} y={PT + 51} fill={hover.d.flujoNeto >= 0 ? "#4ade80" : "#f87171"} fontSize="9">Neto: C${Math.round((hover.d.flujoNeto || 0) / 1000)}K</text>
            </g>
          );
        })()}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: COLOR.muted }}>
          <span style={{ width: 14, height: 3, background: COLOR.green, borderRadius: 2, display: "inline-block" }} />Ingresos
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: COLOR.muted }}>
          <span style={{ width: 14, height: 3, background: COLOR.red, borderRadius: 2, display: "inline-block" }} />Gastos
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: COLOR.muted }}>
          <span style={{ width: 10, height: 10, background: "rgba(22,163,74,0.3)", borderRadius: 3, display: "inline-block" }} />Flujo neto
        </span>
      </div>
    </div>
  );
}

// ── KPI Card ──
function KpiCard({ icono, label, valor, sub, color, bg, border: brd, loading, onClick }) {
  const s = {
    background: bg || COLOR.white, border: `1px solid ${brd || COLOR.border}`,
    borderRadius: 14, padding: "16px", cursor: onClick ? "pointer" : "default",
    transition: "box-shadow 0.15s, transform 0.1s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    animation: "fadeIn 0.3s ease",
  };
  return (
    <div style={s} onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icono}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: "2px 8px", borderRadius: 20, border: `1px solid ${brd}` }}>
          {label}
        </span>
      </div>
      {loading ? <><Sk h={28} w="70%" /><Sk h={12} w="50%" /></> : (
        <>
          <div style={{ fontSize: 22, fontWeight: 900, color: COLOR.text, lineHeight: 1.1, marginBottom: 4 }}>{valor}</div>
          <div style={{ fontSize: 12, color: COLOR.muted }}>{sub}</div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [moneda, setMoneda] = useState("NIO");
  const [usuario, setUsuario] = useState(null);
  const [saludo, setSaludo] = useState("Buenos días");
  const [busqueda, setBusqueda] = useState("");
  const [showRegistrar, setShowRegistrar] = useState(false);
  const [showVistaRapida, setShowVistaRapida] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/dashboard?periodo=${periodo}&moneda=${moneda}`);
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [periodo, moneda]);

  useEffect(() => {
    setUsuario(getUsuario());
    const h = new Date().getHours();
    setSaludo(h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches");
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function handleBusqueda(e) {
    if (e.key === "Enter" && busqueda.trim()) router.push(`/inventario?q=${encodeURIComponent(busqueda.trim())}`);
  }

  const selectStyle = {
    border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "8px 10px",
    fontSize: 13, color: COLOR.text, background: COLOR.white, outline: "none", cursor: "pointer",
  };

  const cardStyle = {
    background: COLOR.white, border: `1px solid ${COLOR.border}`,
    borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  };

  const hato = stats?.resumenHato || {};
  const graficaMeses = stats?.graficaMeses || [];

  const kpiCards = [
    { icono: "🐄", label: "Animales activos", valor: fmt(stats?.animalesActivos || 0, "numero"), sub: `${hato.enVenta || 0} en venta`, color: COLOR.green, bg: "#F0FDF4", border: "#BBF7D0", href: "/inventario" },
    { icono: "💹", label: "Valor del hato", valor: fmt(stats?.valorEstimadoHato || 0, "moneda", moneda), sub: "Estimación por peso", color: COLOR.blue, bg: "#EFF6FF", border: "#BFDBFE", href: "/inventario" },
    { icono: "💼", label: "Capital invertido", valor: fmt(stats?.capitalInvertido || 0, "moneda", moneda), sub: "Acumulado histórico", color: COLOR.purple, bg: "#F5F3FF", border: "#DDD6FE", href: "/finanzas" },
    { icono: "💰", label: "Ventas del mes", valor: fmt(stats?.ventasMes?.total || 0, "moneda", moneda), sub: `${stats?.ventasMes?.cantidad || 0} ventas`, color: COLOR.green, bg: "#F0FDF4", border: "#BBF7D0", href: "/ventas" },
    { icono: "📉", label: "Gastos del mes", valor: fmt(stats?.gastosMes?.total || 0, "moneda", moneda), sub: "Total en gastos", color: COLOR.red, bg: "#FEF2F2", border: "#FECACA", href: "/gastos" },
    { icono: "📈", label: "Ganancia neta", valor: fmt(stats?.gananciaNeta || 0, "moneda", moneda), sub: `${(stats?.margenGanancia || 0).toFixed(1)}% margen`, color: COLOR.purple, bg: "#F5F3FF", border: "#DDD6FE", href: "/finanzas" },
  ];

  const filasHato = [
    { label: "Vacas",        valor: hato.vacas    || 0 },
    { label: "Toros",        valor: hato.toros    || 0 },
    { label: "Novillos",     valor: hato.novillos || 0 },
    { label: "Novillas",     valor: hato.novillas || 0 },
    { label: "Terneros",     valor: hato.terneros || 0 },
    { label: "Terneras",     valor: hato.terneras || 0 },
    { label: "Preñadas",     valor: hato.prenadas || 0 },
    { label: "En venta",     valor: hato.enVenta  || 0 },
    { label: "Nacimientos",  valor: hato.nacimientosMes || 0 },
  ];

  const indicadores = [
    { label: "Peso promedio", valor: stats?.pesoPromedio ? `${Math.round(stats.pesoPromedio)} kg` : "— kg", icono: "⚖️" },
    { label: "Tasa de preñez", valor: stats?.tasaPrenez != null ? `${stats.tasaPrenez.toFixed(1)}%` : "—%", icono: "🤰" },
    { label: "Natalidad", valor: stats?.natalidad != null ? `${stats.natalidad.toFixed(1)}%` : "—%", icono: "🐮" },
    { label: "Mortalidad", valor: stats?.mortalidad != null ? `${stats.mortalidad.toFixed(2)}%` : "—%", icono: "📊" },
  ];

  const categorias = stats?.gastosMes?.categorias || [];
  const totalCat = categorias.reduce((s, c) => s + c.total, 0);

  return (
    <AppLayout title="Dashboard" subtitle="HENRIQUEZ CATTLE MANAGEMENT"
      searchBar={
        <div style={{ position: "relative", width: 260 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: COLOR.muted }}>🔍</span>
          <input
            placeholder="Buscar animales, ventas..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={handleBusqueda}
            style={{ width: "100%", padding: "7px 10px 7px 30px", border: `1px solid ${COLOR.border}`, borderRadius: 8, fontSize: 13, color: COLOR.text, background: COLOR.bg, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      }
      rightExtra={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select style={selectStyle} value={periodo} onChange={e => setPeriodo(e.target.value)}>
            <option value="mes">Este mes</option>
            <option value="hoy">Hoy</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="año">Este año</option>
          </select>
          <select style={selectStyle} value={moneda} onChange={e => setMoneda(e.target.value)}>
            <option value="NIO">C$</option>
            <option value="USD">USD</option>
          </select>
          <button
            onClick={() => setShowRegistrar(true)}
            style={{ background: COLOR.green, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Registrar
          </button>
        </div>
      }
    >
      <style>{CSS}</style>

      {/* ── BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)",
        borderRadius: 16, padding: "28px 36px", marginBottom: 24, position: "relative", overflow: "hidden", minHeight: 150,
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=80')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.22 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: "0 0 2px" }}>{saludo}, <strong style={{ color: "#fff" }}>{usuario?.nombre || "Usuario"}</strong> 👋</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 4px" }}>Bienvenido a</p>
            <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>Henriquez</h2>
            <h2 style={{ color: "#4ade80", fontSize: 30, fontWeight: 900, margin: "0 0 18px", lineHeight: 1.1 }}>Cattle Management</h2>
            <button
              onClick={() => setShowVistaRapida(true)}
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 8, padding: "7px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              🐄 Vista rápida
            </button>
          </div>
          <div style={{ textAlign: "right", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>🐂</div>
            <p style={{ margin: 0 }}>{new Date().toLocaleDateString("es-NI", { weekday: "short", day: "numeric", month: "short" })}</p>
          </div>
        </div>
      </div>

      {/* ── KPI GRID 6 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 16 }}>
        {kpiCards.map(c => (
          <KpiCard key={c.label} loading={loading} {...c} onClick={() => router.push(c.href)} />
        ))}
      </div>

      {/* ── 2 TARJETAS: Cuentas por pagar + Caja ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <KpiCard loading={loading} icono="📑" label="Cuentas por pagar" valor={fmt(stats?.cuentasPagar || 0, "moneda", moneda)} sub="Pagos pendientes" color={COLOR.orange} bg="#FFF7ED" border="#FED7AA" onClick={() => router.push("/cuentas-pagar")} />
        <KpiCard loading={loading} icono="🏦" label="Caja disponible" valor={fmt(stats?.cajaDisponible || 0, "moneda", moneda)} sub="Ingresos cobrados - gastos" color={COLOR.green} bg="#F0FDF4" border="#BBF7D0" onClick={() => router.push("/finanzas")} />
      </div>

      {/* ── 3 COLUMNAS: Resumen hato | Gráfica | Alertas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Resumen del hato */}
        <div style={cardStyle}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLOR.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: COLOR.text }}>Resumen del hato</p>
              <p style={{ margin: 0, fontSize: 11, color: COLOR.muted }}>Animales activos por categoría</p>
            </div>
            <span style={{ fontSize: 20 }}>🐄</span>
          </div>
          <div style={{ padding: "8px 0" }}>
            {loading ? [1,2,3,4,5].map(i => <div key={i} style={{ padding: "8px 16px" }}><Sk h={14} /></div>) :
              filasHato.map((f, i) => (
                <button key={i} onClick={() => router.push("/inventario")}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 16px", borderBottom: i < filasHato.length - 1 ? `1px solid ${COLOR.border}` : "none", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <span style={{ fontSize: 13, color: COLOR.muted }}>{f.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: COLOR.text }}>{f.valor}</span>
                </button>
              ))
            }
          </div>
          <div style={{ padding: "8px 12px 12px" }}>
            <button onClick={() => router.push("/inventario")} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${COLOR.border}`, background: "none", color: COLOR.green, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Ver inventario completo →
            </button>
          </div>
        </div>

        {/* Gráfica financiera */}
        <div style={cardStyle}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLOR.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: COLOR.text }}>Gráfica financiera</p>
              <p style={{ margin: 0, fontSize: 11, color: COLOR.muted }}>Ingresos, gastos y flujo neto — últimos 6 meses</p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F8FAFC", border: `1px solid ${COLOR.border}`, color: COLOR.muted }}>6M</span>
          </div>
          <div style={{ padding: "12px 16px 8px" }}>
            {loading ? <Sk h={160} /> : <GraficaFinanciera datos={graficaMeses} />}
          </div>
        </div>

        {/* Pagos y alertas */}
        <div style={cardStyle}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLOR.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: COLOR.text }}>Alertas</p>
            <span style={{ fontSize: 20 }}>🚨</span>
          </div>
          <div style={{ padding: "8px 12px" }}>
            {loading ? [1,2,3].map(i => <div key={i} style={{ marginBottom: 8 }}><Sk h={50} r={8} /></div>) :
              (stats?.alertas?.length > 0 ? stats.alertas.slice(0, 3).map((a, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 8, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLOR.red }}>{a.titulo}</p>
                  <p style={{ margin: 0, fontSize: 11, color: COLOR.muted }}>{a.descripcion}</p>
                </div>
              )) : (
                <div style={{ textAlign: "center", padding: "24px 0", color: COLOR.muted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Sin alertas pendientes</p>
                </div>
              ))
            }
          </div>
          <div style={{ padding: "0 12px 12px" }}>
            <button onClick={() => router.push("/cuentas-pagar")} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${COLOR.border}`, background: "none", color: COLOR.orange, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Ver cuentas por pagar →
            </button>
          </div>
        </div>
      </div>

      {/* ── 3 COLUMNAS: Capital invertido | Insumos | Indicadores ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>

        {/* Capital invertido por categoría */}
        <div style={cardStyle}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLOR.border}` }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: COLOR.text }}>Capital por categoría</p>
            <p style={{ margin: 0, fontSize: 11, color: COLOR.muted }}>Gastos del mes por tipo</p>
          </div>
          <div style={{ padding: "8px 0" }}>
            {loading ? [1,2,3].map(i => <div key={i} style={{ padding: "8px 16px" }}><Sk h={14} /></div>) :
              categorias.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: COLOR.muted, fontSize: 13 }}>Sin gastos registrados</div>
              ) : categorias.map((c, i) => {
                const pct = totalCat > 0 ? (c.total / totalCat * 100).toFixed(0) : 0;
                return (
                  <div key={i} style={{ padding: "8px 16px", borderBottom: i < categorias.length - 1 ? `1px solid ${COLOR.border}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: COLOR.text, fontWeight: 600 }}>{CAT_LABEL[c.categoria] || c.categoria}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLOR.red }}>{fmt(c.total, "moneda", moneda)}</span>
                    </div>
                    <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: COLOR.red, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: COLOR.muted }}>{pct}%</span>
                  </div>
                );
              })
            }
          </div>
          <div style={{ padding: "8px 12px 12px" }}>
            <button onClick={() => router.push("/gastos")} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${COLOR.border}`, background: "none", color: COLOR.red, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Ver todos los gastos →
            </button>
          </div>
        </div>

        {/* Inventario e insumos */}
        <div style={cardStyle}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLOR.border}` }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: COLOR.text }}>Inventario e insumos</p>
            <p style={{ margin: 0, fontSize: 11, color: COLOR.muted }}>Stock y estado actual</p>
          </div>
          <div style={{ padding: "8px 0" }}>
            {loading ? [1,2,3].map(i => <div key={i} style={{ padding: "8px 16px" }}><Sk h={30} /></div>) : (
              <div style={{ textAlign: "center", padding: "24px 0", color: COLOR.muted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Sin datos de insumos</p>
                <p style={{ margin: "4px 0 0", fontSize: 11 }}>Módulo en desarrollo</p>
              </div>
            )}
          </div>
          <div style={{ padding: "8px 12px 12px" }}>
            <button onClick={() => router.push("/insumos")} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${COLOR.border}`, background: "none", color: COLOR.blue, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Ver insumos →
            </button>
          </div>
        </div>

        {/* Indicadores productivos */}
        <div style={cardStyle}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLOR.border}` }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: COLOR.text }}>Indicadores productivos</p>
            <p style={{ margin: 0, fontSize: 11, color: COLOR.muted }}>Métricas clave del hato</p>
          </div>
          <div style={{ padding: "12px" }}>
            {loading ? [1,2,3,4].map(i => <div key={i} style={{ marginBottom: 10 }}><Sk h={50} r={8} /></div>) :
              indicadores.map((ind, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 10, marginBottom: 8,
                  background: "#F8FAFC", border: `1px solid ${COLOR.border}`,
                }}>
                  <span style={{ fontSize: 22 }}>{ind.icono}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 11, color: COLOR.muted }}>{ind.label}</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: COLOR.text }}>{ind.valor}</p>
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{ padding: "0 12px 12px" }}>
            <button onClick={() => router.push("/reportes")} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${COLOR.border}`, background: "none", color: COLOR.purple, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Ver todos los reportes →
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL: REGISTRAR MOVIMIENTO ── */}
      {showRegistrar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowRegistrar(false)}>
          <div style={{ background: COLOR.white, borderRadius: 20, padding: 28, maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", animation: "fadeIn 0.2s ease" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: COLOR.text }}>Registrar movimiento</h3>
              <button onClick={() => setShowRegistrar(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLOR.muted }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icono: "💰", label: "Registrar venta", href: "/ventas", color: COLOR.green, bg: "#F0FDF4" },
                { icono: "💸", label: "Registrar gasto", href: "/gastos", color: COLOR.red, bg: "#FEF2F2" },
                { icono: "🛒", label: "Registrar compra", href: "/compras", color: COLOR.blue, bg: "#EFF6FF" },
                { icono: "📦", label: "Registrar insumo", href: "/insumos", color: COLOR.orange, bg: "#FFF7ED" },
                { icono: "👥", label: "Pago nómina", href: "/equipo", color: COLOR.purple, bg: "#F5F3FF" },
              ].map(op => (
                <button key={op.href} onClick={() => { setShowRegistrar(false); router.push(op.href); }}
                  style={{ padding: "16px 12px", borderRadius: 12, border: `1px solid ${COLOR.border}`, background: op.bg, cursor: "pointer", textAlign: "left", transition: "transform 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{op.icono}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: op.color }}>{op.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VISTA RÁPIDA ── */}
      {showVistaRapida && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowVistaRapida(false)}>
          <div style={{ background: COLOR.white, borderRadius: 20, padding: 28, maxWidth: 500, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", animation: "fadeIn 0.2s ease" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: COLOR.text }}>Vista rápida del hato</h3>
              <button onClick={() => setShowVistaRapida(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLOR.muted }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { icono: "🐄", label: "Activos", valor: stats?.animalesActivos || 0, color: COLOR.green },
                { icono: "🛍️", label: "En venta", valor: hato.enVenta || 0, color: COLOR.blue },
                { icono: "🤰", label: "Preñadas", valor: hato.prenadas || 0, color: COLOR.purple },
                { icono: "🍼", label: "Nacimientos", valor: hato.nacimientosMes || 0, color: COLOR.orange },
                { icono: "💰", label: "Ventas mes", valor: stats?.ventasMes?.cantidad || 0, color: COLOR.green },
                { icono: "🚨", label: "Alertas", valor: stats?.alertas?.length || 0, color: COLOR.red },
              ].map((s, i) => (
                <div key={i} style={{ padding: "14px", borderRadius: 12, background: "#F8FAFC", border: `1px solid ${COLOR.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icono}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.valor}</div>
                  <div style={{ fontSize: 11, color: COLOR.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowVistaRapida(false); router.push("/inventario"); }}
              style={{ marginTop: 16, width: "100%", padding: "10px", borderRadius: 10, background: COLOR.green, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              Ir al inventario completo
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
