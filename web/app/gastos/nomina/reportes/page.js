"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const gc = "#1a4d2e"; const lc = "#e8f5e9"; const gc2 = "#059669";
const fmt = (n) => Number(n || 0).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCorto = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : fmt(n);
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function iniciales(nombre) {
  return (nombre || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

// Barra SVG horizontal
function BarraH({ valor, max, color, label, sublabel, monto }) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: color }}>
        {iniciales(label)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs font-bold text-gray-700 truncate">{label}</span>
          <span className="text-xs font-black ml-2 shrink-0" style={{ color: gc }}>C$ {fmtCorto(monto)}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

// Gráfica de barras verticales SVG
function GraficaMensual({ datos }) {
  if (!datos.length) return <p className="text-center text-gray-400 text-sm py-8">Sin datos</p>;
  const max = Math.max(...datos.map(d => d.total), 1);
  const W = 100, H = 80, pad = 6;
  const barW = Math.min(12, (W - pad * 2) / datos.length - 2);
  const gap = (W - pad * 2) / datos.length;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ minWidth: Math.max(200, datos.length * 30) }}>
        {/* Líneas de referencia */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={pad} y1={H * (1 - f)} x2={W - pad} y2={H * (1 - f)}
            stroke="#f3f4f6" strokeWidth="0.5" />
        ))}
        {datos.map((d, i) => {
          const x = pad + i * gap + gap / 2 - barW / 2;
          const barH = Math.max(2, (d.total / max) * H * 0.9);
          const y = H - barH;
          const esMesActual = d.esMesActual;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="2"
                fill={esMesActual ? gc : gc2} opacity={esMesActual ? 1 : 0.65} />
              <text x={x + barW / 2} y={H + 8} textAnchor="middle" fontSize="4.5" fill="#9ca3af">
                {d.label}
              </text>
              {barH > 8 && (
                <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize="3.5" fill={gc} fontWeight="bold">
                  {fmtCorto(d.total)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Mini gráfica de tendencia (sparkline)
function Sparkline({ datos, color }) {
  if (datos.length < 2) return null;
  const max = Math.max(...datos, 1);
  const W = 80, H = 24;
  const pts = datos.map((v, i) => `${(i / (datos.length - 1)) * W},${H - (v / max) * H * 0.9}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-6">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function ReportesNominaPage() {
  const router = useRouter();
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [añoFiltro, setAñoFiltro] = useState(new Date().getFullYear());
  const [exportando, setExportando] = useState(false);
  const [finca, setFinca] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        categoria: "SALARIO",
        desde: `${añoFiltro}-01-01`,
        hasta: `${añoFiltro}-12-31`,
      });
      const [data, f] = await Promise.all([
        api(`/gastos?${params}`),
        api("/fincas/mi-finca").catch(() => null),
      ]);
      setPagos(data.gastos || []);
      setFinca(f);
    } finally { setCargando(false); }
  }, [añoFiltro]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Cálculos ──────────────────────────────────────────────────────────────

  const totalAnual = pagos.reduce((s, p) => s + p.monto, 0);

  // Por mes (12 slots)
  const porMesArray = Array.from({ length: 12 }, (_, i) => {
    const mes = pagos.filter(p => new Date(p.fecha).getMonth() === i);
    return {
      label: MESES[i],
      total: mes.reduce((s, p) => s + p.monto, 0),
      count: mes.length,
      esMesActual: i === new Date().getMonth() && añoFiltro === new Date().getFullYear(),
    };
  });
  const mesesConDatos = porMesArray.filter(m => m.total > 0);
  const promedioMensual = mesesConDatos.length > 0 ? totalAnual / mesesConDatos.length : 0;

  // Mes más caro y más barato
  const mesMayor = mesesConDatos.reduce((a, b) => b.total > a.total ? b : a, mesesConDatos[0] || { label: "—", total: 0 });
  const mesMenor = mesesConDatos.reduce((a, b) => b.total < a.total ? b : a, mesesConDatos[0] || { label: "—", total: 0 });

  // Por trabajador
  const porTrabajador = pagos.reduce((acc, p) => {
    const k = p.receptor || "Sin asignar";
    if (!acc[k]) acc[k] = { nombre: k, total: 0, count: 0, pagos: [] };
    acc[k].total += p.monto; acc[k].count++; acc[k].pagos.push(p);
    return acc;
  }, {});
  const rankingTrabajadores = Object.values(porTrabajador).sort((a, b) => b.total - a.total);
  const maxTrabajador = rankingTrabajadores[0]?.total || 1;

  // Comparar mes actual vs mes anterior
  const mesActual = new Date().getMonth();
  const totalMesActual = pagos.filter(p => new Date(p.fecha).getMonth() === mesActual).reduce((s, p) => s + p.monto, 0);
  const totalMesAnterior = pagos.filter(p => new Date(p.fecha).getMonth() === mesActual - 1).reduce((s, p) => s + p.monto, 0);
  const diferenciaMes = totalMesActual - totalMesAnterior;
  const porcentajeCambio = totalMesAnterior > 0 ? ((diferenciaMes / totalMesAnterior) * 100).toFixed(1) : null;

  // Sparline últimos 6 meses
  const sparkData = Array.from({ length: 6 }, (_, i) => {
    const m = (mesActual - 5 + i + 12) % 12;
    return pagos.filter(p => new Date(p.fecha).getMonth() === m).reduce((s, p) => s + p.monto, 0);
  });

  // Distribución por tipo de pago
  const porTipo = pagos.reduce((acc, p) => {
    const k = p.periodicidad || "OTRO";
    if (!acc[k]) acc[k] = { tipo: k, total: 0, count: 0 };
    acc[k].total += p.monto; acc[k].count++;
    return acc;
  }, {});
  const distribucionTipo = Object.values(porTipo).sort((a, b) => b.total - a.total);

  const tipoColores = { QUINCENAL:"#0284c7", MENSUAL:"#7c3aed", SEMANAL:"#059669", DIARIO:"#d97706", UNICO:"#dc2626", OTRO:"#6b7280" };

  // ── Exportar PDF completo ──────────────────────────────────────────────────

  async function exportarPDF() {
    setExportando(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const V = "#1a4d2e"; const LV = "#e8f5e9";
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // ── Portada ──
      doc.setFillColor(V); doc.rect(0, 0, pageW, 60, "F");
      doc.setTextColor(255,255,255);
      doc.setFont("helvetica","bold"); doc.setFontSize(18);
      doc.text("REPORTE ANUAL DE NÓMINA", pageW/2, 22, { align:"center" });
      doc.setFontSize(11); doc.setFont("helvetica","normal");
      doc.text(`Finca: ${finca?.nombre || "—"}`, pageW/2, 32, { align:"center" });
      doc.text(`Año: ${añoFiltro}`, pageW/2, 40, { align:"center" });
      doc.setFontSize(8);
      doc.text(`Generado: ${new Date().toLocaleString("es-NI")}`, pageW/2, 52, { align:"center" });

      let y = 72;

      // ── Resumen ejecutivo ──
      doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(V);
      doc.text("RESUMEN EJECUTIVO", 14, y); y += 6;
      doc.setDrawColor(V); doc.setLineWidth(0.3); doc.line(14, y, pageW-14, y); y += 6;

      const resumen = [
        ["Total anual de nómina", `C$ ${fmt(totalAnual)}`],
        ["Promedio mensual", `C$ ${fmt(promedioMensual)}`],
        ["Total de pagos realizados", `${pagos.length}`],
        ["Trabajadores pagados", `${rankingTrabajadores.length}`],
        ["Mes de mayor gasto", `${mesMayor.label} — C$ ${fmt(mesMayor.total)}`],
        ["Mes de menor gasto", `${mesMenor.label} — C$ ${fmt(mesMenor.total)}`],
      ];
      autoTable(doc, {
        startY: y,
        body: resumen,
        bodyStyles: { fontSize:9 },
        columnStyles: { 0:{ fontStyle:"bold", cellWidth:80 }, 1:{ halign:"right" } },
        alternateRowStyles: { fillColor:[232,245,233] },
        margin: { left:14, right:14 },
      });
      y = doc.lastAutoTable.finalY + 12;

      // ── Gasto mensual ──
      doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(V);
      doc.text("GASTO MENSUAL", 14, y); y += 6;
      doc.setDrawColor(V); doc.line(14, y, pageW-14, y); y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Mes","Total pagado","N° pagos","Promedio por pago"]],
        body: porMesArray.filter(m => m.total > 0).map(m => [
          m.label,
          `C$ ${fmt(m.total)}`,
          m.count,
          `C$ ${fmt(m.count > 0 ? m.total/m.count : 0)}`,
        ]),
        headStyles: { fillColor: V, textColor:[255,255,255], fontSize:8, fontStyle:"bold" },
        bodyStyles: { fontSize:8 },
        columnStyles: { 0:{ cellWidth:30 }, 1:{ halign:"right" }, 2:{ halign:"center" }, 3:{ halign:"right" } },
        alternateRowStyles: { fillColor:[232,245,233] },
        margin: { left:14, right:14 },
      });
      y = doc.lastAutoTable.finalY + 12;

      // ── Nueva página si no hay espacio ──
      if (y > pageH - 60) { doc.addPage(); y = 20; }

      // ── Ranking trabajadores ──
      doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(V);
      doc.text("RANKING DE TRABAJADORES", 14, y); y += 6;
      doc.setDrawColor(V); doc.line(14, y, pageW-14, y); y += 6;

      autoTable(doc, {
        startY: y,
        head: [["#","Trabajador","N° pagos","Total recibido","% del total"]],
        body: rankingTrabajadores.map((t, i) => [
          `#${i+1}`,
          t.nombre,
          t.count,
          `C$ ${fmt(t.total)}`,
          `${totalAnual > 0 ? ((t.total/totalAnual)*100).toFixed(1) : 0}%`,
        ]),
        headStyles: { fillColor: V, textColor:[255,255,255], fontSize:8, fontStyle:"bold" },
        bodyStyles: { fontSize:8 },
        columnStyles: { 0:{cellWidth:12,halign:"center"}, 3:{halign:"right"}, 4:{halign:"center"} },
        alternateRowStyles: { fillColor:[232,245,233] },
        margin: { left:14, right:14 },
      });
      y = doc.lastAutoTable.finalY + 12;

      if (y > pageH - 80) { doc.addPage(); y = 20; }

      // ── Listado completo ──
      doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(V);
      doc.text("DETALLE COMPLETO DE PAGOS", 14, y); y += 6;
      doc.setDrawColor(V); doc.line(14, y, pageW-14, y); y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Fecha","Trabajador","Responsable","Tipo","Monto"]],
        body: pagos.map(g => [
          new Date(g.fecha).toLocaleDateString("es-NI", { dateStyle:"short" }),
          g.receptor || "—",
          g.responsable || "—",
          g.periodicidad || "—",
          `C$ ${fmt(g.monto)}`,
        ]),
        headStyles: { fillColor: V, textColor:[255,255,255], fontSize:7, fontStyle:"bold" },
        bodyStyles: { fontSize:7 },
        columnStyles: { 4:{ halign:"right" } },
        alternateRowStyles: { fillColor:[232,245,233] },
        margin: { left:14, right:14 },
        foot: [[{ content:"TOTAL ANUAL", colSpan:4, styles:{fontStyle:"bold",fillColor:V,textColor:[255,255,255]} },
                { content:`C$ ${fmt(totalAnual)}`, styles:{halign:"right",fontStyle:"bold",fillColor:V,textColor:[255,255,255]} }]],
      });

      // Footer en todas las páginas
      const total = doc.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFillColor(V); doc.rect(0, pageH-10, pageW, 10, "F");
        doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(255,255,255);
        doc.text(`Henriquez Cattle Management · ganaderosg.app`, pageW/2, pageH-4, { align:"center" });
        doc.text(`Pág. ${i}/${total}`, pageW-14, pageH-4, { align:"right" });
      }

      doc.save(`reporte-nomina-${añoFiltro}.pdf`);
    } finally { setExportando(false); }
  }

  const añoActual = new Date().getFullYear();
  const años = [añoActual, añoActual - 1, añoActual - 2];

  return (
    <AppLayout title="Reportes de nómina" subtitle={`Análisis y estadísticas del año ${añoFiltro}`}>
      <div className="max-w-5xl mx-auto px-3 pb-20">

        {/* Navegación */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex gap-2">
            <button onClick={() => router.push("/gastos/nomina")}
              className="flex items-center gap-2 text-sm font-bold" style={{ color: gc }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Nuevo pago
            </button>
            <span className="text-gray-300">·</span>
            <button onClick={() => router.push("/gastos/nomina/historial")}
              className="text-sm font-bold" style={{ color: gc }}>
              Historial
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de año */}
            <div className="flex gap-1">
              {años.map(a => (
                <button key={a} onClick={() => setAñoFiltro(a)}
                  className="px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all"
                  style={{ background: añoFiltro === a ? gc : "#fff", color: añoFiltro === a ? "#fff" : gc, borderColor: gc }}>
                  {a}
                </button>
              ))}
            </div>

            <button onClick={exportarPDF} disabled={exportando || pagos.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white text-sm disabled:opacity-40"
              style={{ background: gc }}>
              {exportando ? "Generando..." : "⬇ Exportar PDF"}
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Calculando estadísticas...</p>
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500 font-bold">Sin datos para {añoFiltro}</p>
            <p className="text-gray-400 text-sm mt-1">Registra pagos de nómina para ver estadísticas</p>
            <button onClick={() => router.push("/gastos/nomina")}
              className="mt-5 px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: gc }}>
              Registrar primer pago
            </button>
          </div>
        ) : (
          <>
            {/* ── KPIs principales ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total anual", value: `C$ ${fmtCorto(totalAnual)}`, sub: `${pagos.length} pagos`, color: gc },
                { label: "Promedio mensual", value: `C$ ${fmtCorto(promedioMensual)}`, sub: `${mesesConDatos.length} meses activos`, color: gc2 },
                { label: "Trabajadores", value: rankingTrabajadores.length, sub: "recibieron pago", color: "#0284c7" },
                { label: "Costo por pago", value: `C$ ${fmtCorto(pagos.length > 0 ? totalAnual/pagos.length : 0)}`, sub: "promedio", color: "#7c3aed" },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 font-semibold">{c.label}</p>
                  <p className="font-black text-xl mt-1 leading-none" style={{ color: c.color }}>{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Comparación mes actual vs anterior ── */}
            {añoFiltro === añoActual && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <h3 className="font-black text-sm mb-4" style={{ color: gc }}>Comparación de meses</h3>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">{MESES[(mesActual - 1 + 12) % 12]}</p>
                    <p className="font-black text-xl text-gray-600">C$ {fmtCorto(totalMesAnterior)}</p>
                    <p className="text-xs text-gray-400">mes anterior</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-black"
                      style={{ background: diferenciaMes >= 0 ? "#fef3c7" : lc, color: diferenciaMes >= 0 ? "#92400e" : gc }}>
                      {diferenciaMes >= 0 ? "▲" : "▼"}
                      {porcentajeCambio ? `${Math.abs(porcentajeCambio)}%` : "—"}
                    </div>
                    <div className="mt-1">
                      <Sparkline datos={sparkData} color={diferenciaMes >= 0 ? "#f59e0b" : gc} />
                    </div>
                    <p className="text-xs text-gray-400">tendencia 6m</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">{MESES[mesActual]}</p>
                    <p className="font-black text-xl" style={{ color: gc }}>C$ {fmtCorto(totalMesActual)}</p>
                    <p className="text-xs text-gray-400">mes actual</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

              {/* ── Gráfica mensual ── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-sm" style={{ color: gc }}>Gasto mensual {añoFiltro}</h3>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: gc }} /> Mes actual
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: gc2, opacity: 0.65 }} /> Otros
                    </span>
                  </div>
                </div>
                <GraficaMensual datos={porMesArray} />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="p-2 rounded-xl text-center" style={{ background: lc }}>
                    <p className="text-xs text-gray-400">Mes mayor</p>
                    <p className="font-black text-xs" style={{ color: gc }}>{mesMayor.label} — C$ {fmtCorto(mesMayor.total)}</p>
                  </div>
                  <div className="p-2 rounded-xl text-center" style={{ background: "#fff7ed" }}>
                    <p className="text-xs text-gray-400">Mes menor</p>
                    <p className="font-black text-xs text-orange-600">{mesMenor.label} — C$ {fmtCorto(mesMenor.total)}</p>
                  </div>
                </div>
              </div>

              {/* ── Distribución por tipo ── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-black text-sm mb-4" style={{ color: gc }}>Por tipo de pago</h3>
                {distribucionTipo.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="space-y-4">
                    {distribucionTipo.map(t => {
                      const pct = totalAnual > 0 ? (t.total / totalAnual) * 100 : 0;
                      const color = tipoColores[t.tipo] || "#6b7280";
                      return (
                        <div key={t.tipo}>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-bold text-gray-700">{t.tipo}</span>
                            <span className="text-xs text-gray-400">{pct.toFixed(1)}% · {t.count} pago{t.count !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                          </div>
                          <p className="text-xs font-black mt-0.5" style={{ color }}>C$ {fmt(t.total)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Ranking de trabajadores ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm" style={{ color: gc }}>Ranking de trabajadores — {añoFiltro}</h3>
                <span className="text-xs text-gray-400">{rankingTrabajadores.length} trabajador{rankingTrabajadores.length !== 1 ? "es" : ""}</span>
              </div>
              <div className="space-y-4">
                {rankingTrabajadores.map((t, i) => {
                  const colores = [gc, gc2, "#0284c7", "#7c3aed", "#d97706", "#dc2626"];
                  const color = colores[i % colores.length];
                  const pct = totalAnual > 0 ? ((t.total / totalAnual) * 100).toFixed(1) : 0;
                  return (
                    <div key={t.nombre}>
                      <BarraH
                        valor={t.total}
                        max={maxTrabajador}
                        color={color}
                        label={`#${i+1} ${t.nombre}`}
                        sublabel={`${t.count} pago${t.count !== 1 ? "s" : ""} · ${pct}% del total`}
                        monto={t.total}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Tabla resumen mensual ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-black text-sm" style={{ color: gc }}>Detalle mensual — {añoFiltro}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: lc }}>
                      <th className="px-4 py-2 text-left text-xs font-black" style={{ color: gc }}>Mes</th>
                      <th className="px-4 py-2 text-right text-xs font-black" style={{ color: gc }}>Total pagado</th>
                      <th className="px-4 py-2 text-center text-xs font-black" style={{ color: gc }}>N° pagos</th>
                      <th className="px-4 py-2 text-right text-xs font-black" style={{ color: gc }}>Promedio/pago</th>
                      <th className="px-4 py-2 text-center text-xs font-black" style={{ color: gc }}>% del año</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porMesArray.map((m, i) => {
                      const pct = totalAnual > 0 ? ((m.total / totalAnual) * 100).toFixed(1) : 0;
                      return (
                        <tr key={i} className={`border-t border-gray-50 ${m.esMesActual ? "bg-green-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                          <td className="px-4 py-2 font-semibold text-gray-700 text-xs">
                            {m.esMesActual ? <span className="font-black" style={{ color: gc }}>★ {m.label}</span> : m.label}
                          </td>
                          <td className="px-4 py-2 text-right font-black text-xs" style={{ color: m.total > 0 ? gc : "#9ca3af" }}>
                            {m.total > 0 ? `C$ ${fmt(m.total)}` : "—"}
                          </td>
                          <td className="px-4 py-2 text-center text-xs text-gray-500">{m.count || "—"}</td>
                          <td className="px-4 py-2 text-right text-xs text-gray-500">
                            {m.count > 0 ? `C$ ${fmt(m.total / m.count)}` : "—"}
                          </td>
                          <td className="px-4 py-2 text-center text-xs text-gray-500">
                            {m.total > 0 ? `${pct}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: gc }}>
                      <td className="px-4 py-2 font-black text-xs text-white">TOTAL {añoFiltro}</td>
                      <td className="px-4 py-2 text-right font-black text-xs text-white">C$ {fmt(totalAnual)}</td>
                      <td className="px-4 py-2 text-center font-black text-xs text-white">{pagos.length}</td>
                      <td className="px-4 py-2 text-right font-black text-xs text-white">C$ {fmt(pagos.length > 0 ? totalAnual/pagos.length : 0)}</td>
                      <td className="px-4 py-2 text-center font-black text-xs text-white">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
