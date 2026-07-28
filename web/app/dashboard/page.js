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
@keyframes donutGrow {
  from { transform: scale(0.7); opacity:0; }
  to   { transform: scale(1);   opacity:1; }
}
`;

// ── Donut del Hato ──
const HATO_COLORES = ["#16a34a","#2563EB","#EA580C","#7C3AED","#0891B2","#DB2777","#D97706"];

function DonutHato({ data, total, onNavigate }) {
  const [hov, setHov] = useState(null);

  const items = data.filter(d => d.valor > 0);

  if (!items.length) return (
    <div style={{ textAlign:"center", padding:"32px 0", color:COLOR.muted }}>
      <div style={{ fontSize:36, marginBottom:8 }}>🐄</div>
      <p style={{ margin:0, fontSize:13, fontWeight:600 }}>Sin animales registrados</p>
    </div>
  );

  const cx=90, cy=90, R=72, ri=48;
  let angle = -Math.PI / 2;

  const segs = items.map((d, idx) => {
    const frac = d.valor / total;
    const sweep = frac * 2 * Math.PI;
    const a1 = angle, a2 = angle + sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const cos1=Math.cos(a1), sin1=Math.sin(a1);
    const cos2=Math.cos(a2), sin2=Math.sin(a2);
    const path = [
      `M ${cx+R*cos1} ${cy+R*sin1}`,
      `A ${R} ${R} 0 ${large} 1 ${cx+R*cos2} ${cy+R*sin2}`,
      `L ${cx+ri*cos2} ${cy+ri*sin2}`,
      `A ${ri} ${ri} 0 ${large} 0 ${cx+ri*cos1} ${cy+ri*sin1}`,
      "Z",
    ].join(" ");
    angle = a2;
    return { path, color: d.color, label: d.label, valor: d.valor, frac };
  });

  const hovSeg = hov !== null ? segs[hov] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", padding:"16px 16px 0" }}>

      {/* Donut + leyenda lado a lado */}
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>

        {/* SVG donut */}
        <div style={{ flexShrink:0, animation:"donutGrow 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          <svg viewBox="0 0 180 180" width={168} height={168}>
            {segs.map((s, i) => (
              <path key={i} d={s.path}
                fill={s.color}
                stroke="#fff" strokeWidth="2.5"
                opacity={hov === null || hov === i ? 1 : 0.35}
                transform={hov === i ? `translate(${(Math.cos((segs[i-1]?.path ? angle : -Math.PI/2) + s.frac*Math.PI)*3).toFixed(1)} ${(Math.sin(-Math.PI/2 + s.frac*Math.PI)*3).toFixed(1)})` : ""}
                style={{ cursor:"pointer", transition:"opacity 0.18s, transform 0.18s" }}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
              />
            ))}
            {/* Centro */}
            {hovSeg ? (
              <>
                <text x="90" y="82" textAnchor="middle" fontSize="22" fontWeight="900" fill={hovSeg.color}>{hovSeg.valor}</text>
                <text x="90" y="97" textAnchor="middle" fontSize="9.5" fill={COLOR.muted} fontWeight="600">{hovSeg.label.toUpperCase()}</text>
                <text x="90" y="110" textAnchor="middle" fontSize="9" fill={COLOR.muted}>{(hovSeg.frac*100).toFixed(1)}%</text>
              </>
            ) : (
              <>
                <text x="90" y="84" textAnchor="middle" fontSize="28" fontWeight="900" fill={COLOR.text}>{total}</text>
                <text x="90" y="100" textAnchor="middle" fontSize="9.5" fill={COLOR.muted} fontWeight="700" letterSpacing="0.5">TOTAL</text>
              </>
            )}
          </svg>
        </div>

        {/* Leyenda compacta */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
          {segs.map((s, i) => (
            <button key={i}
              onClick={onNavigate}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{
                display:"flex", alignItems:"center", gap:8,
                background: hov === i ? "#F8FAFC" : "transparent",
                border:"none", cursor:"pointer", padding:"5px 6px", borderRadius:7,
                transition:"background 0.12s", textAlign:"left", width:"100%",
              }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0, boxShadow:`0 0 0 2px ${s.color}33` }} />
              <span style={{ flex:1, fontSize:12, fontWeight:600, color:COLOR.muted }}>{s.label}</span>
              <span style={{ fontSize:14, fontWeight:900, color: hov===i ? s.color : COLOR.text }}>{s.valor}</span>
              <span style={{ fontSize:10, color:COLOR.muted, minWidth:32, textAlign:"right" }}>{(s.frac*100).toFixed(0)}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Barras de distribución */}
      <div style={{ marginTop:14, marginBottom:4 }}>
        <p style={{ margin:"0 0 7px", fontSize:10, fontWeight:700, color:COLOR.muted, letterSpacing:0.5, textTransform:"uppercase" }}>Distribución</p>
        <div style={{ display:"flex", height:8, borderRadius:6, overflow:"hidden", gap:1.5 }}>
          {segs.map((s, i) => (
            <div key={i}
              style={{ flex: s.valor, background: s.color, opacity: hov===null||hov===i ? 1 : 0.3, transition:"opacity 0.18s", cursor:"pointer" }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            />
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          <span style={{ fontSize:10, color:COLOR.muted }}>{segs[0]?.label}</span>
          <span style={{ fontSize:10, color:COLOR.muted }}>{segs[segs.length-1]?.label}</span>
        </div>
      </div>

    </div>
  );
}

// ── Skeleton loader ──
function Sk({ w = "100%", h = 20, r = 6 }) {
  return <div style={{ width: w, height: h, background: "#E2E8F0", borderRadius: r, animation: "pulse 1.5s ease-in-out infinite" }} />;
}

// ── Formateador con conversión real ──
function fmt(valor, tipo = "moneda", mon = "NIO", tc = 36.5) {
  if (valor === null || valor === undefined || isNaN(valor)) return "—";
  if (tipo === "numero") return Number(valor).toLocaleString("es-NI");
  const num = mon === "USD" ? Number(valor) / tc : Number(valor);
  const sym = mon === "USD" ? "$ " : "C$ ";
  return sym + num.toLocaleString("es-NI", { minimumFractionDigits: mon === "USD" ? 2 : 0, maximumFractionDigits: mon === "USD" ? 2 : 0 });
}

// Equivalencia en la otra moneda (debajo del valor principal)
function fmtSub(valor, monedaPrincipal, tc = 36.5) {
  if (!valor || isNaN(valor) || valor === 0) return null;
  if (monedaPrincipal === "NIO") {
    const usd = Number(valor) / tc;
    return `≈ $ ${usd.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    const nio = Number(valor) * tc;
    return `≈ C$ ${nio.toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}

// ── Badge de categoría ──
const CAT_LABEL = {
  ALIMENTACION: "Alimentación", MEDICAMENTO: "Medicamento",
  MANTENIMIENTO: "Mantenimiento", SALARIO: "Salario",
  COMBUSTIBLE: "Combustible", OTRO: "Otro",
};

// ── Helpers gráfica ──
function bezier(pts) {
  if (!pts.length) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i-1][0] + pts[i][0]) / 2;
    d += ` C ${mx} ${pts[i-1][1]} ${mx} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`;
  }
  return d;
}
function fmtK(v) {
  if (Math.abs(v) >= 1000000) return `${(v/1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `${Math.round(v/1000)}K`;
  return String(Math.round(v));
}

// ── Gráfica Financiera Principal ──
function GraficaFinanciera({ datos = [] }) {
  const [vista, setVista]   = useState("6M");
  const [serie, setSerie]   = useState("ambas"); // "ambas" | "neto"
  const [hover, setHover]   = useState(null);
  const [clip, setClip]     = useState(0);
  const clipId = "gf-clip";

  const filtrados = vista === "3M" ? datos.slice(-3) : datos;

  useEffect(() => {
    setClip(0);
    const t = setTimeout(() => setClip(100), 60);
    return () => clearTimeout(t);
  }, [vista, serie, datos.length]);

  if (!filtrados.length) return (
    <div style={{ height: 300, display:"flex", alignItems:"center", justifyContent:"center", color: COLOR.muted, fontSize: 13 }}>
      Sin datos financieros
    </div>
  );

  // Dimensiones
  const W = 900, H = 280, PL = 58, PR = 20, PT = 20, PB = 36;
  const IW = W - PL - PR, IH = H - PT - PB;
  const n = filtrados.length;

  const allVals = filtrados.flatMap(d => serie === "neto"
    ? [d.flujoNeto]
    : [d.ingresos, d.gastos, 0]
  );
  const rawMax = Math.max(...allVals.map(Math.abs), 1);
  const maxVal = rawMax * 1.15;
  const minVal = serie === "neto" ? Math.min(...allVals, 0) * 1.15 : 0;
  const range  = maxVal - minVal;

  const px = i => PL + (n === 1 ? IW / 2 : (i / (n - 1)) * IW);
  const py = v => PT + IH - ((v - minVal) / range) * IH;
  const py0 = py(0);

  // Puntos
  const ptsI = filtrados.map((d, i) => [px(i), py(d.ingresos)]);
  const ptsG = filtrados.map((d, i) => [px(i), py(d.gastos)]);
  const ptsN = filtrados.map((d, i) => [px(i), py(d.flujoNeto || 0)]);

  // Paths bezier
  const pathI = bezier(ptsI);
  const pathG = bezier(ptsG);
  const pathN = bezier(ptsN);

  // Area bajo la curva
  const areaClose = `L ${ptsI[ptsI.length-1][0]} ${py0} L ${ptsI[0][0]} ${py0} Z`;
  const areaI = pathI + areaClose;
  const areaG = pathG + `L ${ptsG[ptsG.length-1][0]} ${py0} L ${ptsG[0][0]} ${py0} Z`;
  const areaN = pathN + `L ${ptsN[ptsN.length-1][0]} ${py0} L ${ptsN[0][0]} ${py0} Z`;

  // Ticks Y
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => minVal + range * f);

  // Totales para el resumen
  const totI = filtrados.reduce((s, d) => s + (d.ingresos || 0), 0);
  const totG = filtrados.reduce((s, d) => s + (d.gastos   || 0), 0);
  const totN = filtrados.reduce((s, d) => s + (d.flujoNeto || 0), 0);

  return (
    <div>
      {/* ── Header: resumen + filtros ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 14px", borderBottom:`1px solid ${COLOR.border}`, flexWrap:"wrap", gap:12 }}>

        {/* Totales del período */}
        <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
          {[
            { label:"Ingresos",  val: totI, color: COLOR.green, dot:"#16a34a" },
            { label:"Gastos",    val: totG, color: COLOR.red,   dot:"#DC2626" },
            { label:"Flujo neto",val: totN, color: totN >= 0 ? COLOR.green : COLOR.red, dot: totN >= 0 ? "#16a34a" : "#DC2626" },
          ].map(s => (
            <div key={s.label} style={{ display:"flex", flexDirection:"column", gap:2 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:s.dot, display:"inline-block" }} />
                <span style={{ fontSize:11, color:COLOR.muted, fontWeight:600 }}>{s.label}</span>
              </div>
              <span style={{ fontSize:17, fontWeight:900, color:s.color, letterSpacing:"-0.3px" }}>
                C$ {Number(s.val).toLocaleString("es-NI", { maximumFractionDigits:0 })}
              </span>
            </div>
          ))}
        </div>

        {/* Controles */}
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {/* Filtro período */}
          <div style={{ display:"flex", background:"#F1F5F9", borderRadius:8, padding:3, gap:2 }}>
            {["3M","6M"].map(v => (
              <button key={v} onClick={() => setVista(v)} style={{
                padding:"4px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
                background: vista === v ? COLOR.white : "transparent",
                color: vista === v ? COLOR.text : COLOR.muted,
                boxShadow: vista === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition:"all 0.15s",
              }}>{v}</button>
            ))}
          </div>
          {/* Filtro serie */}
          <div style={{ display:"flex", background:"#F1F5F9", borderRadius:8, padding:3, gap:2 }}>
            {[["ambas","Ingresos vs Gastos"],["neto","Flujo neto"]].map(([v,l]) => (
              <button key={v} onClick={() => setSerie(v)} style={{
                padding:"4px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
                background: serie === v ? COLOR.white : "transparent",
                color: serie === v ? COLOR.text : COLOR.muted,
                boxShadow: serie === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition:"all 0.15s",
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SVG principal ── */}
      <div style={{ padding:"8px 8px 4px", overflowX:"auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width:"100%", minWidth:480, height:H, display:"block" }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            {/* Clip animado: se expande de izquierda a derecha */}
            <clipPath id={clipId}>
              <rect
                x={PL} y={0}
                width={(IW * clip) / 100}
                height={H}
                style={{ transition:"width 1s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </clipPath>
            <linearGradient id="grd-i" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#16a34a" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="grd-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#DC2626" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="grd-n-pos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#16a34a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="grd-n-neg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#DC2626" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          {/* Línea base 0 (cuando hay negativos) */}
          {minVal < 0 && (
            <line x1={PL} y1={py0} x2={W-PR} y2={py0} stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="4 3" />
          )}

          {/* Grid horizontal */}
          {ticks.map((v, fi) => {
            const y = py(v);
            return (
              <g key={fi}>
                <line x1={PL} y1={y} x2={W-PR} y2={y} stroke={fi === 0 ? COLOR.border : "#F1F5F9"} strokeWidth={fi === 0 ? 1 : 1} />
                <text x={PL-8} y={y+4} textAnchor="end" fill="#94A3B8" fontSize="10" fontWeight="500">
                  {fmtK(v)}
                </text>
              </g>
            );
          })}

          {/* Columnas verticales de fondo al hover */}
          {filtrados.map((_, i) => (
            <rect key={`bg${i}`}
              x={px(i) - IW / n / 2} y={PT}
              width={IW / n} height={IH}
              fill={hover?.i === i ? "rgba(0,0,0,0.025)" : "transparent"}
              style={{ cursor:"pointer" }}
              onMouseEnter={() => setHover({ i, d: filtrados[i] })}
            />
          ))}

          {/* ─ Serie AMBAS ─ */}
          {serie === "ambas" && (
            <g clipPath={`url(#${clipId})`}>
              {/* Área ingresos */}
              <path d={areaI} fill="url(#grd-i)" />
              {/* Área gastos */}
              <path d={areaG} fill="url(#grd-g)" />
              {/* Línea gastos */}
              <path d={pathG} fill="none" stroke={COLOR.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Línea ingresos */}
              <path d={pathI} fill="none" stroke={COLOR.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}

          {/* ─ Serie NETO ─ */}
          {serie === "neto" && (
            <g clipPath={`url(#${clipId})`}>
              <path d={areaN} fill={totN >= 0 ? "url(#grd-n-pos)" : "url(#grd-n-neg)"} />
              <path d={pathN} fill="none" stroke={totN >= 0 ? COLOR.green : COLOR.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}

          {/* Puntos interactivos + etiquetas mes */}
          {filtrados.map((d, i) => {
            const isHov = hover?.i === i;
            const dotsI = serie !== "neto";
            const dotsG = serie === "ambas";
            const dotsN = serie === "neto";
            return (
              <g key={`pt${i}`}
                onMouseEnter={() => setHover({ i, d })}
                style={{ cursor:"pointer" }}>
                {dotsI && <circle cx={px(i)} cy={py(d.ingresos)} r={isHov ? 6 : 4} fill={COLOR.green} stroke="#fff" strokeWidth="2" style={{ transition:"r 0.15s" }} />}
                {dotsG && <circle cx={px(i)} cy={py(d.gastos)}   r={isHov ? 5 : 3} fill={COLOR.red}   stroke="#fff" strokeWidth="2" style={{ transition:"r 0.15s" }} />}
                {dotsN && <circle cx={px(i)} cy={py(d.flujoNeto||0)} r={isHov ? 6 : 4} fill={d.flujoNeto>=0 ? COLOR.green : COLOR.red} stroke="#fff" strokeWidth="2" style={{ transition:"r 0.15s" }} />}
                {/* Línea vertical en hover */}
                {isHov && <line x1={px(i)} y1={PT} x2={px(i)} y2={PT+IH} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2" />}
                {/* Etiqueta mes */}
                <text x={px(i)} y={H-8} textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="600" textTransform="capitalize">
                  {d.mes}
                </text>
              </g>
            );
          })}

          {/* ── Tooltip flotante ── */}
          {hover && (() => {
            const d  = hover.d;
            const cx = px(hover.i);
            const TW = 148, TH = serie === "ambas" ? 76 : 52;
            const tx = cx + TW + 20 > W ? cx - TW - 8 : cx + 8;
            const ty = PT + 4;
            const neto = d.flujoNeto || 0;
            return (
              <g style={{ pointerEvents:"none" }}>
                <rect x={tx} y={ty} width={TW} height={TH} rx="8" fill="#0F172A" opacity="0.94" />
                <text x={tx+10} y={ty+16} fill="white" fontSize="11" fontWeight="800">{d.mes?.toUpperCase()}</text>
                {serie !== "neto" && <>
                  <circle cx={tx+10} cy={ty+28} r="3.5" fill="#4ade80" />
                  <text x={tx+18} y={ty+32} fill="#E2E8F0" fontSize="10">Ingresos</text>
                  <text x={tx+TW-8} y={ty+32} fill="#4ade80" fontSize="10" fontWeight="700" textAnchor="end">C${fmtK(d.ingresos||0)}</text>
                  <circle cx={tx+10} cy={ty+45} r="3.5" fill="#f87171" />
                  <text x={tx+18} y={ty+49} fill="#E2E8F0" fontSize="10">Gastos</text>
                  <text x={tx+TW-8} y={ty+49} fill="#f87171" fontSize="10" fontWeight="700" textAnchor="end">C${fmtK(d.gastos||0)}</text>
                  <line x1={tx+8} y1={ty+57} x2={tx+TW-8} y2={ty+57} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <text x={tx+10} y={ty+68} fill={neto>=0?"#4ade80":"#f87171"} fontSize="10" fontWeight="700">
                    {neto>=0?"↑":"↓"} Neto C${fmtK(Math.abs(neto))}
                  </text>
                </>}
                {serie === "neto" && <>
                  <circle cx={tx+10} cy={ty+28} r="3.5" fill={neto>=0?"#4ade80":"#f87171"} />
                  <text x={tx+18} y={ty+32} fill="#E2E8F0" fontSize="10">Flujo neto</text>
                  <text x={tx+TW-8} y={ty+32} fill={neto>=0?"#4ade80":"#f87171"} fontSize="10" fontWeight="700" textAnchor="end">C${fmtK(neto)}</text>
                </>}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ── Leyenda ── */}
      <div style={{ display:"flex", gap:20, padding:"6px 20px 14px", justifyContent:"center" }}>
        {serie !== "neto" && <>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:COLOR.muted }}>
            <span style={{ width:20, height:2.5, background:COLOR.green, borderRadius:2, display:"inline-block" }} />Ingresos
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:COLOR.muted }}>
            <span style={{ width:20, height:2.5, background:COLOR.red, borderRadius:2, display:"inline-block" }} />Gastos
          </span>
        </>}
        {serie === "neto" && (
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:COLOR.muted }}>
            <span style={{ width:20, height:2.5, background:totN>=0?COLOR.green:COLOR.red, borderRadius:2, display:"inline-block" }} />Flujo neto
          </span>
        )}
      </div>
    </div>
  );
}

// ── Iconos SVG para KPIs ──
const KpiIcon = {
  animal:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 6 4 10c0 2 1 4 2 5l-1 5h14l-1-5c1-1 2-3 2-5 0-4-4-8-8-8z"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>,
  hato:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  capital:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  ventas:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  gastos:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
  ganancia: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  cuentas:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
  caja:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
};

// ── KPI Card rediseñada ──
function KpiCard({ iconKey, label, valor, sub, equiv, accentColor, iconBg, iconColor, trend, loading, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: COLOR.white,
        border: `1px solid ${COLOR.border}`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 12,
        padding: "16px 18px",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.15s, transform 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        minWidth: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Fila superior: ícono + label + tendencia */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {KpiIcon[iconKey]}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLOR.muted, lineHeight: 1.3 }}>{label}</span>
        </div>
        {trend && !loading && (
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 20,
            background: trend.dir === "up" ? "#F0FDF4" : "#FEF2F2",
            color: trend.dir === "up" ? COLOR.green : COLOR.red,
            display: "flex", alignItems: "center", gap: 2, flexShrink: 0,
          }}>
            {trend.dir === "up"
              ? <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H3M8 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              : <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 8H3M8 8V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            }
            {trend.pct}%
          </span>
        )}
      </div>

      {/* Valor principal */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Sk h={26} w="75%" />
          <Sk h={11} w="55%" />
          <Sk h={11} w="45%" />
        </div>
      ) : (
        <>
          <div style={{ fontSize: 20, fontWeight: 900, color: COLOR.text, lineHeight: 1.15, letterSpacing: "-0.3px", marginBottom: 3 }}>
            {valor}
          </div>
          {equiv && (
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>{equiv}</div>
          )}
          <div style={{ fontSize: 11, color: COLOR.muted }}>{sub}</div>
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
  const [tipoCambio, setTipoCambio] = useState(36.5);
  const [usuario, setUsuario] = useState(null);
  const [saludo, setSaludo] = useState("Buenos días");
  const [busqueda, setBusqueda] = useState("");
  const [showRegistrar, setShowRegistrar] = useState(false);
  const [showVistaRapida, setShowVistaRapida] = useState(false);
  const [showCalendario, setShowCalendario] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [clima, setClima] = useState(null);

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
    api("/usuarios/perfil").then(d => setFotoPerfil(d.fotoPerfil)).catch(() => {});
    // Clima via Open-Meteo (Managua, NI — sin API key)
    fetch("https://api.open-meteo.com/v1/forecast?latitude=12.13&longitude=-86.28&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=America/Managua")
      .then(r => r.json())
      .then(d => {
        if (d?.current) {
          const code = d.current.weather_code;
          const temp = Math.round(d.current.temperature_2m);
          let icono = "☀️", desc = "Despejado";
          if (code >= 1 && code <= 3)   { icono = "⛅"; desc = "Parcialmente nublado"; }
          if (code >= 45 && code <= 48) { icono = "🌫️"; desc = "Neblina"; }
          if (code >= 51 && code <= 67) { icono = "🌧️"; desc = "Lluvia ligera"; }
          if (code >= 80 && code <= 82) { icono = "🌦️"; desc = "Chubascos"; }
          if (code >= 95 && code <= 99) { icono = "⛈️"; desc = "Tormenta"; }
          setClima({ icono, desc, temp });
        }
      })
      .catch(() => {});
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(r => r.json())
      .then(d => { if (d?.rates?.NIO) setTipoCambio(d.rates.NIO); })
      .catch(() => setTipoCambio(36.5));
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

  const tc = tipoCambio;
  // ── Tendencias mes vs mes anterior (desde graficaMeses) ──
  function tendencia(key) {
    if (!graficaMeses || graficaMeses.length < 2) return null;
    const actual   = graficaMeses[graficaMeses.length - 1]?.[key] || 0;
    const anterior = graficaMeses[graficaMeses.length - 2]?.[key] || 0;
    if (anterior === 0) return null;
    const pct = ((actual - anterior) / anterior) * 100;
    return { pct: Math.abs(pct).toFixed(1), dir: pct >= 0 ? "up" : "down" };
  }
  const tendVentas   = tendencia("ingresos");
  const tendGastos   = tendencia("gastos");
  const tendGanancia = tendencia("flujoNeto");

  const kpiCards = [
    { iconKey: "animal",   label: "Animales activos",   valor: fmt(stats?.animalesActivos || 0, "numero"),                                sub: `${hato.enVenta || 0} en venta · ${hato.prenadas || 0} preñadas`, accentColor: COLOR.green,  iconBg: "#F0FDF4", iconColor: COLOR.green,  trend: null,         href: "/inventario"   },
    { iconKey: "hato",     label: "Valor del hato",     valor: fmt(stats?.valorEstimadoHato || 0, "moneda", moneda, tc), equiv: fmtSub(stats?.valorEstimadoHato, moneda, tc),  sub: "Precio de venta estimado",                              accentColor: COLOR.blue,   iconBg: "#EFF6FF", iconColor: COLOR.blue,   trend: null,         href: "/inventario"   },
    { iconKey: "capital",  label: "Capital invertido",  valor: fmt(stats?.capitalInvertido || 0, "moneda", moneda, tc),  equiv: fmtSub(stats?.capitalInvertido, moneda, tc),   sub: "Compras + gastos históricos",                           accentColor: COLOR.purple, iconBg: "#F5F3FF", iconColor: COLOR.purple, trend: null,         href: "/finanzas"     },
    { iconKey: "ventas",   label: "Ventas del mes",     valor: fmt(stats?.ventasMes?.total || 0, "moneda", moneda, tc),  equiv: fmtSub(stats?.ventasMes?.total, moneda, tc),   sub: `${stats?.ventasMes?.cantidad || 0} transacciones`,      accentColor: COLOR.green,  iconBg: "#F0FDF4", iconColor: COLOR.green,  trend: tendVentas,   href: "/ventas"       },
    { iconKey: "gastos",   label: "Gastos del mes",     valor: fmt(stats?.gastosMes?.total || 0, "moneda", moneda, tc),  equiv: fmtSub(stats?.gastosMes?.total, moneda, tc),   sub: "Total de egresos registrados",                          accentColor: COLOR.red,    iconBg: "#FEF2F2", iconColor: COLOR.red,    trend: tendGastos,   href: "/gastos"       },
    { iconKey: "ganancia", label: "Ganancia neta",      valor: fmt(stats?.gananciaNeta || 0, "moneda", moneda, tc),      equiv: fmtSub(stats?.gananciaNeta, moneda, tc),        sub: `Margen: ${(stats?.margenGanancia || 0).toFixed(1)}%`,   accentColor: COLOR.purple, iconBg: "#F5F3FF", iconColor: COLOR.purple, trend: tendGanancia, href: "/finanzas"     },
    { iconKey: "cuentas",  label: "Cuentas por pagar",  valor: fmt(stats?.cuentasPagar || 0, "moneda", moneda, tc),      equiv: fmtSub(stats?.cuentasPagar, moneda, tc),        sub: "Pagos pendientes",                                      accentColor: COLOR.orange, iconBg: "#FFF7ED", iconColor: COLOR.orange, trend: null,         href: "/cuentas-pagar"},
    { iconKey: "caja",     label: "Caja disponible",    valor: fmt(stats?.cajaDisponible || 0, "moneda", moneda, tc),    equiv: fmtSub(stats?.cajaDisponible, moneda, tc),      sub: "Cobrado menos gastos",                                  accentColor: COLOR.green,  iconBg: "#F0FDF4", iconColor: COLOR.green,  trend: null,         href: "/finanzas"     },
  ];

  const filasHato = [
    { label: "Vacas",    valor: hato.vacas    || 0, color: HATO_COLORES[0] },
    { label: "Toros",    valor: hato.toros    || 0, color: HATO_COLORES[1] },
    { label: "Novillos", valor: hato.novillos || 0, color: HATO_COLORES[2] },
    { label: "Novillas", valor: hato.novillas || 0, color: HATO_COLORES[3] },
    { label: "Terneros", valor: hato.terneros || 0, color: HATO_COLORES[4] },
    { label: "Preñadas", valor: hato.prenadas || 0, color: HATO_COLORES[5] },
    { label: "En venta", valor: hato.enVenta  || 0, color: HATO_COLORES[6] },
  ];
  const totalHato = filasHato.reduce((s, f) => s + f.valor, 0);

  const indicadores = [
    { label: "Peso promedio", valor: stats?.pesoPromedio ? `${Math.round(stats.pesoPromedio)} lb` : "— kg", icono: "⚖️" },
    { label: "Tasa de preñez", valor: stats?.tasaPrenez != null ? `${stats.tasaPrenez.toFixed(1)}%` : "—%", icono: "🤰" },
    { label: "Natalidad", valor: stats?.natalidad != null ? `${stats.natalidad.toFixed(1)}%` : "—%", icono: "🐮" },
    { label: "Mortalidad", valor: stats?.mortalidad != null ? `${stats.mortalidad.toFixed(2)}%` : "—%", icono: "📊" },
  ];

  const categorias = stats?.gastosMes?.categorias || [];
  const totalCat = categorias.reduce((s, c) => s + c.total, 0);

  // ── Helpers topbar ──
  const fechaHoy = new Date();
  const fechaLabel = fechaHoy.toLocaleDateString("es-NI", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const diasSemana = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const mesesCortos = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  function buildCalGrid() {
    const y = fechaHoy.getFullYear(), m = fechaHoy.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    return { cells, mes: mesesCortos[m], anio: y, hoy: fechaHoy.getDate() };
  }
  const { cells: calCells, mes: calMes, anio: calAnio, hoy: calHoy } = buildCalGrid();

  const TB = {
    icon: { display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:9, border:`1px solid ${COLOR.border}`, background:COLOR.white, cursor:"pointer", fontSize:16, transition:"all 0.15s", flexShrink:0 },
    sel: { border:`1px solid ${COLOR.border}`, borderRadius:9, padding:"0 10px", height:36, fontSize:13, color:COLOR.text, background:COLOR.white, outline:"none", cursor:"pointer", fontWeight:600 },
  };

  return (
    <AppLayout title="Dashboard" subtitle="HENRIQUEZ CATTLE MANAGEMENT"
      searchBar={
        <div style={{ position:"relative", width:"100%", maxWidth:340, minWidth:180 }}>
          <svg style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="15" height="15" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6.5" stroke="#94A3B8" strokeWidth="1.8"/>
            <path d="M14 14l3.5 3.5" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Buscar animales, ventas, reportes…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={handleBusqueda}
            style={{ width:"100%", padding:"0 36px 0 34px", height:36, border:`1px solid ${COLOR.border}`, borderRadius:9, fontSize:13, color:COLOR.text, background:"#F8FAFC", outline:"none", boxSizing:"border-box", transition:"border 0.15s" }}
            onFocus={e => e.target.style.border=`1.5px solid ${COLOR.green}`}
            onBlur={e => e.target.style.border=`1px solid ${COLOR.border}`}
          />
          <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#CBD5E1", fontWeight:600, letterSpacing:0.5, pointerEvents:"none" }}>⏎ Enter</span>
        </div>
      }
      rightExtra={
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>

          {/* ── Selector de finca ── */}
          <div style={{ display:"flex", alignItems:"center", gap:7, height:36, padding:"0 12px", borderRadius:9, border:`1px solid ${COLOR.border}`, background:COLOR.white, cursor:"default", flexShrink:0, maxWidth:180, overflow:"hidden" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span style={{ fontSize:12, fontWeight:700, color:COLOR.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {stats?.nombreFinca || "Mi Finca"}
            </span>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", flexShrink:0 }} title="Activa" />
          </div>

          {/* ── Selector de moneda ── */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <select
              style={{ ...TB.sel, paddingRight:26, appearance:"none", WebkitAppearance:"none" }}
              value={moneda}
              onChange={e => setMoneda(e.target.value)}
            >
              <option value="NIO">C$ Córdoba</option>
              <option value="USD">$ Dólar</option>
            </select>
            <svg style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="10" height="10" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke={COLOR.muted} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* ── Selector de período ── */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <select
              style={{ ...TB.sel, paddingRight:26, appearance:"none", WebkitAppearance:"none" }}
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
            >
              <option value="mes">Este mes</option>
              <option value="hoy">Hoy</option>
              <option value="7d">Últ. 7 días</option>
              <option value="30d">Últ. 30 días</option>
              <option value="mes_anterior">Mes anterior</option>
              <option value="año">Este año</option>
            </select>
            <svg style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="10" height="10" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke={COLOR.muted} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* ── Calendario ── */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <button
              onClick={() => setShowCalendario(v => !v)}
              style={{ ...TB.icon, gap:5, width:"auto", padding:"0 10px", fontSize:12, fontWeight:600, color:showCalendario ? COLOR.green : COLOR.muted }}
              onMouseEnter={e => { e.currentTarget.style.background="#F0FDF4"; e.currentTarget.style.borderColor=COLOR.green; }}
              onMouseLeave={e => { e.currentTarget.style.background=COLOR.white; e.currentTarget.style.borderColor=COLOR.border; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ color:COLOR.text }}>{fechaLabel}</span>
            </button>

            {showCalendario && (
              <>
                <div style={{ position:"fixed", inset:0, zIndex:49 }} onClick={() => setShowCalendario(false)} />
                <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:50, background:COLOR.white, border:`1px solid ${COLOR.border}`, borderRadius:14, padding:16, boxShadow:"0 12px 40px rgba(0,0,0,0.12)", minWidth:240, animation:"fadeIn 0.15s ease" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <span style={{ fontWeight:800, fontSize:14, color:COLOR.text }}>{calMes} {calAnio}</span>
                    <span style={{ fontSize:11, color:COLOR.muted }}>Hoy: {calHoy} {calMes}</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
                    {diasSemana.map(d => <div key={d} style={{ textAlign:"center", fontSize:9, fontWeight:700, color:COLOR.muted, padding:"2px 0" }}>{d}</div>)}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                    {calCells.map((d, i) => (
                      <div key={i} style={{
                        textAlign:"center", padding:"5px 2px", borderRadius:6, fontSize:12, fontWeight: d === calHoy ? 800 : 400,
                        background: d === calHoy ? COLOR.green : "transparent",
                        color: d === calHoy ? "#fff" : d ? COLOR.text : "transparent",
                        cursor: d ? "default" : "default",
                      }}>{d || ""}</div>
                    ))}
                  </div>
                  <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${COLOR.border}`, display:"flex", gap:6 }}>
                    <button onClick={() => { setShowCalendario(false); router.push("/eventos"); }} style={{ flex:1, padding:"7px 0", borderRadius:8, border:`1px solid ${COLOR.border}`, background:"none", fontSize:12, fontWeight:700, color:COLOR.green, cursor:"pointer" }}>
                      Ver eventos →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Perfil (visible en desktop, ya está en sidebar pero no en topbar) ── */}
          <button
            onClick={() => router.push("/perfil")}
            style={{ display:"flex", alignItems:"center", gap:8, height:36, padding:"0 10px 0 6px", borderRadius:9, border:`1px solid ${COLOR.border}`, background:COLOR.white, cursor:"pointer", flexShrink:0, transition:"all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="#F8FAFC"; e.currentTarget.style.borderColor="#CBD5E1"; }}
            onMouseLeave={e => { e.currentTarget.style.background=COLOR.white; e.currentTarget.style.borderColor=COLOR.border; }}
          >
            <div style={{ width:24, height:24, borderRadius:"50%", background:COLOR.green, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {fotoPerfil
                ? <img src={fotoPerfil} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:11, fontWeight:900, color:"#fff" }}>{usuario?.nombre?.charAt(0).toUpperCase() || "U"}</span>
              }
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:COLOR.text, maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{usuario?.nombre || "Perfil"}</span>
          </button>

          {/* ── Botón Registrar ── */}
          <button
            onClick={() => setShowRegistrar(true)}
            style={{ display:"flex", alignItems:"center", gap:6, height:36, padding:"0 14px", background:COLOR.green, color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, boxShadow:"0 2px 8px rgba(22,163,74,0.3)", transition:"all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="#15803d"; e.currentTarget.style.boxShadow="0 4px 14px rgba(22,163,74,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background=COLOR.green; e.currentTarget.style.boxShadow="0 2px 8px rgba(22,163,74,0.3)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Registrar
          </button>

        </div>
      }
    >
      <style>{CSS}</style>

      {/* ── HERO COMPACTO ── */}
      <div style={{
        background: COLOR.white,
        border: `1px solid ${COLOR.border}`,
        borderLeft: `4px solid ${COLOR.green}`,
        borderRadius: 14,
        marginBottom: 20,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>
        {/* Fila superior: saludo + finca | clima | chips de estado */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>

          {/* Saludo y nombre de finca */}
          <div style={{ padding: "14px 20px", borderRight: `1px solid ${COLOR.border}`, minWidth: 220 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: COLOR.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>
              {saludo}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 900, color: COLOR.text, lineHeight: 1.2 }}>
              {usuario?.nombre || "Usuario"}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: COLOR.muted, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={COLOR.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              {loading ? "—" : (stats?.nombreFinca || "Mi Finca")}
            </p>
          </div>

          {/* Clima */}
          <div style={{ padding: "14px 20px", borderRight: `1px solid ${COLOR.border}`, minWidth: 160 }}>
            {clima ? (
              <>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: COLOR.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>Clima ahora</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{clima.icono}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: COLOR.text, lineHeight: 1 }}>{clima.temp}°C</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: COLOR.muted }}>{clima.desc}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: COLOR.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>Clima ahora</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <Sk w={28} h={28} r="50%" />
                  <div><Sk w={60} h={14} /><Sk w={80} h={10} /></div>
                </div>
              </>
            )}
          </div>

          {/* Estado del hato */}
          <div style={{ padding: "14px 20px", borderRight: `1px solid ${COLOR.border}`, minWidth: 160 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: COLOR.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>Estado del hato</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {loading ? <Sk w={100} h={22} r={20} /> : (
                <>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700, color: COLOR.green }}>
                    🐄 {stats?.animalesActivos ?? "—"} activos
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700, color: COLOR.purple }}>
                    🤰 {stats?.resumenHato?.prenadas ?? "—"} preñadas
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Alertas del día */}
          <div style={{ padding: "14px 20px", borderRight: `1px solid ${COLOR.border}`, minWidth: 150 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: COLOR.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>Alertas del día</p>
            <div style={{ marginTop: 6 }}>
              {loading ? <Sk w={90} h={22} r={20} /> : (() => {
                const n = stats?.alertas?.length ?? 0;
                return (
                  <button onClick={() => router.push("/incidentes")}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: n > 0 ? "#FEF2F2" : "#F0FDF4", color: n > 0 ? COLOR.red : COLOR.green }}>
                    {n > 0 ? "⚠️" : "✅"} {n > 0 ? `${n} alerta${n > 1 ? "s" : ""}` : "Sin alertas"}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Tratamientos pendientes */}
          <div style={{ padding: "14px 20px", flex: 1, minWidth: 150 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: COLOR.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>Tratamientos</p>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => router.push("/incidentes")}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#EFF6FF", color: COLOR.blue }}>
                💊 Ver tratamientos →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── KPI GRID UNIFICADO 4×2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {kpiCards.map(c => (
          <KpiCard key={c.label} loading={loading} {...c} onClick={() => router.push(c.href)} />
        ))}
      </div>

      {/* ── GRÁFICA FINANCIERA — ancho completo ── */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: COLOR.text }}>Gráfica financiera</p>
            <p style={{ margin: 0, fontSize: 11, color: COLOR.muted, marginTop: 2 }}>Ingresos, gastos y flujo neto del período seleccionado</p>
          </div>
        </div>
        {loading ? <div style={{ padding: "20px" }}><Sk h={300} r={10} /></div> : <GraficaFinanciera datos={graficaMeses} />}
      </div>

      {/* ── 2 COLUMNAS: Resumen hato | Alertas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* ── Resumen del hato — Donut ── */}
        <div style={cardStyle}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLOR.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: COLOR.text }}>Resumen del hato</p>
              <p style={{ margin: 0, fontSize: 11, color: COLOR.muted }}>Distribución por categoría</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:COLOR.green, background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:20, padding:"2px 10px" }}>
                {stats?.animalesActivos || 0} activos
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding:20, display:"flex", gap:16, alignItems:"center" }}>
              <Sk w={168} h={168} r="50%" />
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                {[1,2,3,4,5,6,7].map(i => <Sk key={i} h={22} r={7} />)}
              </div>
            </div>
          ) : (
            <DonutHato
              data={filasHato}
              total={totalHato || stats?.animalesActivos || 0}
              onNavigate={() => router.push("/inventario")}
            />
          )}

          <div style={{ padding: "12px 16px 14px", borderTop: `1px solid ${COLOR.border}`, marginTop:4 }}>
            <button onClick={() => router.push("/inventario")}
              style={{ width:"100%", padding:"8px", borderRadius:8, border:`1px solid ${COLOR.border}`, background:"none", color:COLOR.green, fontWeight:700, fontSize:12, cursor:"pointer" }}>
              Ver inventario completo →
            </button>
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
