"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const gc = "#1a4d2e"; const lc = "#e8f5e9";
const fmt = (n) => Number(n || 0).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function iniciales(nombre) {
  return (nombre || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function proximoPago(fecha, periodicidad) {
  if (!fecha || !periodicidad) return null;
  const d = new Date(fecha);
  switch (periodicidad) {
    case "DIARIO":     d.setDate(d.getDate() + 1); break;
    case "SEMANAL":    d.setDate(d.getDate() + 7); break;
    case "QUINCENAL":  d.setDate(d.getDate() + 15); break;
    case "MENSUAL":    d.setMonth(d.getMonth() + 1); break;
    default: return null;
  }
  return d;
}

function etiquetaProximo(fecha) {
  if (!fecha) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const d = new Date(fecha); d.setHours(0,0,0,0);
  const diff = Math.round((d - hoy) / (1000 * 60 * 60 * 24));
  const dia = d.getDate();
  const mes = MESES[d.getMonth()];
  const diaSemana = DIAS_SEMANA[d.getDay()];
  if (diff < 0) return { texto: `Venció hace ${Math.abs(diff)} día${Math.abs(diff)>1?"s":""}`, color: "#dc2626", urgente: true };
  if (diff === 0) return { texto: "Hoy", color: "#d97706", urgente: true };
  if (diff === 1) return { texto: "Mañana", color: "#d97706", urgente: true };
  if (diff <= 7) return { texto: `${diaSemana} ${dia} ${mes} (${diff}d)`, color: "#059669", urgente: false };
  return { texto: `${dia} ${mes}`, color: "#6b7280", urgente: false };
}

export default function HistorialNominaPage() {
  const router = useRouter();
  const [pagos, setPagos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroReceptor, setFiltroReceptor] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [vistaActiva, setVistaActiva] = useState("lista"); // lista | trabajadores | calendario
  const [expandido, setExpandido] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ categoria: "SALARIO" });
      if (filtroDesde) params.set("desde", filtroDesde);
      if (filtroHasta) params.set("hasta", filtroHasta);
      if (filtroReceptor) params.set("receptor", filtroReceptor);
      const data = await api(`/gastos?${params}`);
      setPagos(data.gastos || []);
    } finally { setCargando(false); }
  }, [filtroDesde, filtroHasta, filtroReceptor]);

  useEffect(() => {
    api("/gastos/usuarios-finca").then(u => setUsuarios(Array.isArray(u) ? u : [])).catch(() => {});
    cargar();
  }, [cargar]);

  // Agrupar por trabajador
  const porTrabajador = pagos.reduce((acc, p) => {
    const key = p.receptor || "Sin asignar";
    if (!acc[key]) acc[key] = { nombre: key, pagos: [], total: 0, count: 0 };
    acc[key].pagos.push(p);
    acc[key].total += p.monto;
    acc[key].count++;
    return acc;
  }, {});
  const trabajadores = Object.values(porTrabajador).sort((a, b) => b.total - a.total);

  // Agrupar por mes para calendario
  const porMes = pagos.reduce((acc, p) => {
    const d = new Date(p.fecha);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!acc[key]) acc[key] = { año: d.getFullYear(), mes: d.getMonth(), pagos: [], total: 0 };
    acc[key].pagos.push(p);
    acc[key].total += p.monto;
    return acc;
  }, {});
  const meses = Object.values(porMes).sort((a, b) => b.año - a.año || b.mes - a.mes);

  const totalGeneral = pagos.reduce((s, p) => s + p.monto, 0);
  const promedioMensual = meses.length > 0 ? totalGeneral / meses.length : 0;

  function limpiarFiltros() {
    setFiltroReceptor(""); setFiltroDesde(""); setFiltroHasta("");
  }

  const hayFiltros = filtroReceptor || filtroDesde || filtroHasta;

  // Extraer descripción: "Pago de nómina Quincenal — Juan Pérez (2026-07-01 al 2026-07-15)"
  function parsearDescripcion(g) {
    const m = (g.descripcion || "").match(/\((.+) al (.+)\)/);
    return { desde: m?.[1] || "", hasta: m?.[2] || "", tipo: g.periodicidad };
  }

  async function reGenerarPDF(g) {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const V = "#1a4d2e"; const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const num = g.id?.slice(-8).toUpperCase() || "N/A";
    const fecha = new Date(g.fecha).toLocaleDateString("es-NI", { day:"2-digit", month:"long", year:"numeric" });
    const { desde, hasta } = parsearDescripcion(g);

    doc.setFillColor(V); doc.rect(0, 0, pageW, 38, "F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text("COMPROBANTE DE PAGO DE NÓMINA", pageW/2, 16, { align: "center" });
    doc.setFontSize(9); doc.setFont("helvetica","normal");
    doc.text(`N° ${num}  ·  Fecha: ${fecha}`, pageW/2, 24, { align: "center" });
    doc.text(`Período: ${desde} al ${hasta}`, pageW/2, 30, { align: "center" });

    let y = 46;
    doc.setFillColor("#e8f5e9");
    doc.roundedRect(10, y, pageW - 20, 20, 3, 3, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(V);
    doc.text("RESPONSABLE:", 14, y + 7);
    doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
    doc.text(g.responsable || "—", 50, y + 7);
    doc.setFont("helvetica","bold"); doc.setTextColor(V);
    doc.text("TRABAJADOR:", 14, y + 15);
    doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
    doc.text(g.receptor || "—", 50, y + 15);
    y += 28;

    autoTable(doc, {
      startY: y,
      head: [["Concepto", "Monto"]],
      body: [
        ["Pago de nómina", `${g.moneda || "NIO"} ${fmt(g.monto)}`],
      ],
      foot: [[{ content: "TOTAL NETO PAGADO", styles: { fontStyle:"bold", textColor:[255,255,255], fillColor:V } },
               { content: `${g.moneda || "NIO"} ${fmt(g.monto)}`, styles: { fontStyle:"bold", textColor:[255,255,255], fillColor:V, halign:"right" } }]],
      headStyles: { fillColor: V, textColor:[255,255,255], fontStyle:"bold", fontSize:8 },
      bodyStyles: { fontSize:8 },
      columnStyles: { 1: { halign:"right" } },
      margin: { left:10, right:10 },
    });
    y = doc.lastAutoTable.finalY + 8;

    doc.setFillColor("#e8f5e9");
    doc.roundedRect(10, y, pageW - 20, 10, 2, 2, "F");
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(V);
    doc.text(`Método: ${g.notas?.match(/Método: ([^|]+)/)?.[1]?.trim() || "—"}  ·  Registrado por: ${g.usuario?.nombre || "—"}`, pageW/2, y + 6.5, { align:"center" });
    y += 20;

    doc.setDrawColor(V); doc.line(14, y + 14, 14 + (pageW-30)/2, y + 14);
    doc.line(pageW - 14 - (pageW-30)/2, y + 14, pageW - 14, y + 14);
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(V);
    doc.text("Firma del Responsable", 14 + (pageW-30)/4, y + 18, { align:"center" });
    doc.text("Firma / Huella del Trabajador", pageW - 14 - (pageW-30)/4, y + 18, { align:"center" });

    doc.setFillColor(V); doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(255,255,255);
    doc.text("Henriquez Cattle Management · ganaderosg.app", pageW/2, pageH - 4, { align:"center" });

    doc.save(`nomina-${num}-${(g.receptor||"trabajador").split(" ")[0]}.pdf`);
  }

  return (
    <AppLayout title="Historial de nómina" subtitle="Registro de todos los pagos de salario">
      <div className="max-w-5xl mx-auto px-3 pb-20">

        {/* Navegación */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.push("/gastos/nomina")}
            className="flex items-center gap-2 text-sm font-bold" style={{ color: gc }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Nuevo pago
          </button>
          <div className="flex gap-3">
            <button onClick={() => router.push("/gastos/nomina/reportes")}
              className="text-sm font-bold" style={{ color: gc }}>
              📊 Reportes
            </button>
            <button onClick={() => router.push("/gastos")}
              className="text-sm text-gray-400 hover:text-gray-600">
              ← Gastos
            </button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total pagado", value: `C$ ${fmt(totalGeneral)}`, sub: `${pagos.length} pago${pagos.length !== 1 ? "s" : ""}`, color: gc },
            { label: "Trabajadores", value: trabajadores.length, sub: "con al menos 1 pago", color: "#059669" },
            { label: "Promedio mensual", value: `C$ ${fmt(promedioMensual)}`, sub: `en ${meses.length} mes${meses.length !== 1 ? "es" : ""}`, color: "#0284c7" },
            { label: "Próximo pago", value: (() => { const p = pagos[0]; const f = p ? proximoPago(p.fecha, p.periodicidad) : null; const e = etiquetaProximo(f); return e ? e.texto : "—"; })(), sub: (() => { const p = pagos[0]; const f = p ? proximoPago(p.fecha, p.periodicidad) : null; const e = etiquetaProximo(f); return e ? (p?.receptor?.split(" ")[0] || "—") : "sin datos"; })(), color: (() => { const p = pagos[0]; const f = p ? proximoPago(p.fecha, p.periodicidad) : null; const e = etiquetaProximo(f); return e?.color || "#7c3aed"; })() },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-semibold">{c.label}</p>
              <p className="font-black text-lg mt-1" style={{ color: c.color }}>{c.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Trabajador</label>
              <select value={filtroReceptor} onChange={e => setFiltroReceptor(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm">
                <option value="">Todos</option>
                {trabajadores.map(t => (
                  <option key={t.nombre} value={t.nombre}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Desde</label>
              <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
              <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
            </div>
          </div>
          {hayFiltros && (
            <button onClick={limpiarFiltros}
              className="mt-3 text-xs font-bold px-4 py-1.5 rounded-full border" style={{ color: gc, borderColor: gc }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabs de vista */}
        <div className="flex gap-2 mb-4">
          {[["lista","Lista"], ["trabajadores","Por trabajador"], ["calendario","Por mes"]].map(([v, lbl]) => (
            <button key={v} onClick={() => setVistaActiva(v)}
              className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all"
              style={{ background: vistaActiva === v ? gc : "#fff", color: vistaActiva === v ? "#fff" : gc, borderColor: gc }}>
              {lbl}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Cargando historial...</p>
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 font-bold">Sin pagos registrados</p>
            <p className="text-gray-400 text-sm mt-1">{hayFiltros ? "Prueba cambiando los filtros" : "Aún no hay pagos de nómina"}</p>
            <button onClick={() => router.push("/gastos/nomina")}
              className="mt-4 px-6 py-2 rounded-xl font-bold text-white text-sm" style={{ background: gc }}>
              Registrar primer pago
            </button>
          </div>
        ) : (

          <>
            {/* VISTA: LISTA */}
            {vistaActiva === "lista" && (
              <div className="space-y-3">
                {pagos.map(g => {
                  const { desde, hasta } = parsearDescripcion(g);
                  const isOpen = expandido === g.id;
                  const proxFecha = proximoPago(g.fecha, g.periodicidad);
                  const proxEtiqueta = etiquetaProximo(proxFecha);
                  return (
                    <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <button onClick={() => setExpandido(isOpen ? null : g.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 text-white" style={{ background: gc }}>
                          {iniciales(g.receptor)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-800 truncate">{g.receptor || "—"}</p>
                          <p className="text-xs text-gray-400">
                            {desde && hasta ? `${desde} → ${hasta}` : new Date(g.fecha).toLocaleDateString("es-NI", { dateStyle: "medium" })}
                          </p>
                          {proxEtiqueta && (
                            <p className="text-xs font-bold mt-0.5" style={{ color: proxEtiqueta.color }}>
                              🗓 Próximo: {proxEtiqueta.texto}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-base" style={{ color: gc }}>C$ {fmt(g.monto)}</p>
                          <p className="text-xs text-gray-400">{g.periodicidad}</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                          style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", shrink: 0 }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {[
                              ["Responsable", g.responsable || "—"],
                              ["Fecha de pago", new Date(g.fecha).toLocaleDateString("es-NI", { dateStyle: "medium" })],
                              ["Registrado por", g.usuario?.nombre || "—"],
                              ["Moneda", g.moneda || "NIO"],
                            ].map(([k, v]) => (
                              <div key={k} className="p-2 rounded-lg" style={{ background: lc }}>
                                <p className="text-gray-400 text-xs">{k}</p>
                                <p className="font-semibold text-gray-700">{v}</p>
                              </div>
                            ))}
                          </div>
                          {g.notas && (
                            <p className="text-xs text-gray-500 p-2 rounded-lg bg-gray-50">📝 {g.notas}</p>
                          )}
                          <button onClick={() => reGenerarPDF(g)}
                            className="w-full py-2 rounded-xl text-xs font-bold text-white" style={{ background: gc }}>
                            🧾 Descargar comprobante
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA: POR TRABAJADOR */}
            {vistaActiva === "trabajadores" && (
              <div className="space-y-3">
                {trabajadores.map(t => {
                  const isOpen = expandido === t.nombre;
                  const ultimo = t.pagos[0];
                  return (
                    <div key={t.nombre} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <button onClick={() => setExpandido(isOpen ? null : t.nombre)}
                        className="w-full px-4 py-4 flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-white shrink-0" style={{ background: gc }}>
                          {iniciales(t.nombre)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-gray-800">{t.nombre}</p>
                          <p className="text-xs text-gray-400">{t.count} pago{t.count !== 1 ? "s" : ""} registrado{t.count !== 1 ? "s" : ""}</p>
                          {ultimo && (
                            <p className="text-xs text-gray-400">Último: {new Date(ultimo.fecha).toLocaleDateString("es-NI", { dateStyle: "medium" })}</p>
                          )}
                          {(() => {
                            const proxF = ultimo ? proximoPago(ultimo.fecha, ultimo.periodicidad) : null;
                            const proxE = etiquetaProximo(proxF);
                            return proxE ? (
                              <p className="text-xs font-bold mt-0.5" style={{ color: proxE.color }}>
                                🗓 Próximo: {proxE.texto}
                              </p>
                            ) : null;
                          })()}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-lg" style={{ color: gc }}>C$ {fmt(t.total)}</p>
                          <p className="text-xs text-gray-400">total acumulado</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                          style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-50">
                          {/* Barra de progreso respecto al total general */}
                          <div className="px-4 pt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Porcentaje del total de nómina</span>
                              <span>{totalGeneral > 0 ? ((t.total / totalGeneral) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${totalGeneral > 0 ? (t.total / totalGeneral) * 100 : 0}%`, background: gc }} />
                            </div>
                          </div>
                          <div className="p-4 space-y-2">
                            {t.pagos.map(g => {
                              const { desde, hasta } = parsearDescripcion(g);
                              return (
                                <div key={g.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: lc }}>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700">
                                      {desde && hasta ? `${desde} → ${hasta}` : new Date(g.fecha).toLocaleDateString("es-NI", { dateStyle: "medium" })}
                                    </p>
                                    <p className="text-xs text-gray-400">{g.periodicidad} · {g.responsable || "—"}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="font-black text-sm" style={{ color: gc }}>C$ {fmt(g.monto)}</p>
                                    <button onClick={() => reGenerarPDF(g)}
                                      className="p-1.5 rounded-lg text-white text-xs" style={{ background: gc }}>
                                      🧾
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA: POR MES */}
            {vistaActiva === "calendario" && (
              <div className="space-y-3">
                {meses.map(m => {
                  const key = `${m.año}-${m.mes}`;
                  const isOpen = expandido === key;
                  const trabajadoresDelMes = [...new Set(m.pagos.map(p => p.receptor).filter(Boolean))];
                  return (
                    <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <button onClick={() => setExpandido(isOpen ? null : key)}
                        className="w-full px-4 py-4 flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: gc }}>
                          <span className="text-white text-xs font-bold">{MESES[m.mes]}</span>
                          <span className="text-white text-sm font-black">{m.año}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-gray-800">{MESES[m.mes]} {m.año}</p>
                          <p className="text-xs text-gray-400">{m.pagos.length} pago{m.pagos.length !== 1 ? "s" : ""} · {trabajadoresDelMes.length} trabajador{trabajadoresDelMes.length !== 1 ? "es" : ""}</p>
                          <p className="text-xs text-gray-400 truncate">{trabajadoresDelMes.slice(0, 3).join(", ")}{trabajadoresDelMes.length > 3 ? "..." : ""}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-lg" style={{ color: gc }}>C$ {fmt(m.total)}</p>
                          <p className="text-xs text-gray-400">total del mes</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                          style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-50 p-4 space-y-2">
                          {m.pagos.map(g => {
                            const { desde, hasta } = parsearDescripcion(g);
                            return (
                              <div key={g.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: lc }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "#059669" }}>
                                    {iniciales(g.receptor)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-800">{g.receptor || "—"}</p>
                                    <p className="text-xs text-gray-400">
                                      {desde && hasta ? `${desde} → ${hasta}` : new Date(g.fecha).toLocaleDateString("es-NI", { dateStyle: "short" })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <p className="font-black text-sm" style={{ color: gc }}>C$ {fmt(g.monto)}</p>
                                  <button onClick={() => reGenerarPDF(g)}
                                    className="p-1.5 rounded-lg text-white text-xs" style={{ background: gc }}>
                                    🧾
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
