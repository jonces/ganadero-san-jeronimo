"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ganaderosg-backend.up.railway.app/api";
async function apiFetch(path) {
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
  const r = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization:`Bearer ${token}` } : {} });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

function seccion(doc, autoTable, titulo, y) {
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(29,78,216);
  doc.text(titulo, 14, y);
  doc.setTextColor(30,30,30);
  return y + 6;
}

async function generarPDF(inf, balance) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  // Cargar datos reales en paralelo
  const [resultados, flujo, indicadores, animales, activosFijosRes, prestamos] = await Promise.all([
    apiFetch("/estados-financieros/resultados"),
    apiFetch("/estados-financieros/flujo-efectivo"),
    apiFetch("/estados-financieros/indicadores"),
    apiFetch("/animales?estado=ACTIVO"),
    apiFetch("/activos-fijos"),
    apiFetch("/prestamos"),
  ]);

  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" });
  const W = doc.internal.pageSize.getWidth();
  const fmt = (v) => v != null && !isNaN(v) ? "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  const fmtPct = (v) => v != null ? Number(v).toFixed(2) + "%" : "—";
  const hoy = new Date().toLocaleDateString("es-NI", { year:"numeric", month:"long", day:"numeric" });
  const addHeader = (pageNum) => {
    doc.setFillColor(29,78,216); doc.rect(0,0,W,14,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont("helvetica","bold");
    doc.text("EXPEDIENTE FINANCIERO BANCARIO", 14, 9);
    doc.text(`${inf.codigo} · ${hoy}`, W-14, 9, { align:"right" });
    doc.setTextColor(30,30,30);
  };

  // ── PÁGINA 1: Portada ──────────────────────────────────────────────
  doc.setFillColor(29, 78, 216); doc.rect(0, 0, W, 50, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont("helvetica","bold");
  doc.text("EXPEDIENTE FINANCIERO", 14, 22);
  doc.text("BANCARIO", 14, 32);
  doc.setFontSize(10); doc.setFont("helvetica","normal");
  doc.text("Henriquez Cattle Management — ganaderosg.app", 14, 42);

  doc.setTextColor(30,30,30);
  let y = 60;
  doc.setFontSize(10); doc.setFont("helvetica","bold");
  doc.text(`Código de expediente:`, 14, y); doc.setFont("helvetica","normal"); doc.text(inf.codigo, 70, y); y += 7;
  doc.setFont("helvetica","bold"); doc.text(`Fecha de emisión:`, 14, y); doc.setFont("helvetica","normal"); doc.text(hoy, 70, y); y += 7;
  doc.setFont("helvetica","bold"); doc.text(`Empresa:`, 14, y); doc.setFont("helvetica","normal"); doc.text(inf.empresa || "Henriquez Cattle Management", 70, y); y += 7;
  if (inf.institucion) { doc.setFont("helvetica","bold"); doc.text(`Institución destino:`, 14, y); doc.setFont("helvetica","normal"); doc.text(inf.institucion, 70, y); y += 7; }
  if (inf.montoSolicitado) { doc.setFont("helvetica","bold"); doc.text(`Monto solicitado:`, 14, y); doc.setFont("helvetica","normal"); doc.text(fmt(inf.montoSolicitado), 70, y); y += 7; }
  if (inf.plazoMeses) { doc.setFont("helvetica","bold"); doc.text(`Plazo solicitado:`, 14, y); doc.setFont("helvetica","normal"); doc.text(`${inf.plazoMeses} meses`, 70, y); y += 7; }
  if (inf.destinoCredito) { doc.setFont("helvetica","bold"); doc.text(`Destino del crédito:`, 14, y); doc.setFont("helvetica","normal"); doc.text(inf.destinoCredito, 70, y); y += 7; }
  if (inf.periodoDesde || inf.periodoHasta) {
    const desde = inf.periodoDesde ? new Date(inf.periodoDesde).toLocaleDateString("es-NI") : "";
    const hasta = inf.periodoHasta ? new Date(inf.periodoHasta).toLocaleDateString("es-NI") : "";
    doc.setFont("helvetica","bold"); doc.text(`Período analizado:`, 14, y); doc.setFont("helvetica","normal"); doc.text(`${desde} al ${hasta}`, 70, y); y += 7;
  }
  y += 4; doc.setDrawColor(200,200,200); doc.line(14,y,W-14,y); y += 8;

  // Índice de documentos
  const docs = inf.documentosIncluidos || [];
  if (docs.length > 0) {
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(29,78,216);
    doc.text("DOCUMENTOS INCLUIDOS EN ESTE EXPEDIENTE", 14, y); y += 7;
    doc.setTextColor(30,30,30); doc.setFontSize(9); doc.setFont("helvetica","normal");
    docs.forEach((d,i) => { doc.text(`${i+1}. ${d}`, 18, y); y += 6; });
  }

  // ── PÁGINA 2: Balance General ──────────────────────────────────────
  doc.addPage(); addHeader(2); y = 22;
  y = seccion(doc, autoTable, "BALANCE GENERAL — SITUACIÓN FINANCIERA", y);
  if (balance) {
    autoTable(doc, {
      startY: y, margin:{left:14,right:14},
      head:[["Concepto","Valor"]],
      body:[
        ["ACTIVOS",""],
        ["  Caja y bancos disponible", fmt((balance.caja||0)+(balance.bancos||0))],
        ["  Activos biológicos (ganado)", fmt(balance.valorGanado)],
        ["  Activos fijos", fmt(balance.activosFijos) === "—" ? "C$ 0.00" : fmt(balance.activosFijos)],
        ["TOTAL ACTIVOS", fmt(balance.totalActivos)],
        ["PASIVOS",""],
        ["  Préstamos y deudas activas", fmt(balance.totalDeudas)],
        ["TOTAL PASIVOS", fmt(balance.totalPasivos)],
        ["PATRIMONIO NETO", fmt(balance.patrimonioNeto)],
      ],
      headStyles:{fillColor:[29,78,216],textColor:255,fontStyle:"bold",fontSize:9},
      bodyStyles:{fontSize:9},
      alternateRowStyles:{fillColor:[240,245,255]},
      columnStyles:{1:{halign:"right",fontStyle:"bold"}},
      didParseCell:(d)=>{ if(d.row.raw[0]==="TOTAL ACTIVOS"||d.row.raw[0]==="TOTAL PASIVOS"||d.row.raw[0]==="PATRIMONIO NETO") { d.cell.styles.fontStyle="bold"; d.cell.styles.fillColor=[220,240,255]; } if(d.row.raw[0]==="ACTIVOS"||d.row.raw[0]==="PASIVOS") { d.cell.styles.fontStyle="bold"; d.cell.styles.fillColor=[235,245,255]; } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Estado de Resultados ──────────────────────────────────────────
  if (y > 200) { doc.addPage(); addHeader(); y = 22; }
  y = seccion(doc, autoTable, "ESTADO DE RESULTADOS", y);
  if (resultados) {
    autoTable(doc, {
      startY: y, margin:{left:14,right:14},
      head:[["Concepto","Monto"]],
      body:[
        ["Ingresos por ventas", fmt(resultados.ingresoVentas)],
        ["Costos directos", fmt(resultados.costosDirectos)],
        ["MARGEN BRUTO", fmt(resultados.margenBruto)],
        ["Gastos operativos", fmt(resultados.gastosOp)],
        ["RESULTADO OPERATIVO", fmt(resultados.resultadoOperativo)],
      ],
      headStyles:{fillColor:[21,128,61],textColor:255,fontStyle:"bold",fontSize:9},
      bodyStyles:{fontSize:9},
      alternateRowStyles:{fillColor:[240,253,244]},
      columnStyles:{1:{halign:"right",fontStyle:"bold"}},
      didParseCell:(d)=>{ if(d.row.raw[0]==="MARGEN BRUTO"||d.row.raw[0]==="RESULTADO OPERATIVO") { d.cell.styles.fontStyle="bold"; d.cell.styles.fillColor=[209,250,229]; } },
    });
    y = doc.lastAutoTable.finalY + 6;
    if (resultados.porCategoriaGastos && Object.keys(resultados.porCategoriaGastos).length > 0) {
      doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(30,30,30);
      doc.text("Gastos por categoría:", 14, y); y += 4;
      autoTable(doc, {
        startY: y, margin:{left:14,right:14},
        head:[["Categoría","Monto"]],
        body: Object.entries(resultados.porCategoriaGastos).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,fmt(v)]),
        headStyles:{fillColor:[107,114,128],textColor:255,fontSize:8},
        bodyStyles:{fontSize:8},
      });
      y = doc.lastAutoTable.finalY + 8;
    }
  } else { doc.setFontSize(9); doc.text("Sin datos de resultados disponibles.", 14, y); y += 10; }

  // ── PÁGINA 3: Flujo de Efectivo ────────────────────────────────────
  doc.addPage(); addHeader(); y = 22;
  y = seccion(doc, autoTable, "FLUJO DE EFECTIVO — ÚLTIMOS 12 MESES", y);
  if (flujo?.meses?.length > 0) {
    autoTable(doc, {
      startY: y, margin:{left:14,right:14},
      head:[["Mes","Ingresos","Egresos","Flujo Neto","Saldo Acum."]],
      body: flujo.meses.map(m=>[m.mes, fmt(m.ingresos), fmt(m.egresos), fmt(m.flujoNeto), fmt(m.saldoAcumulado)]),
      headStyles:{fillColor:[29,78,216],textColor:255,fontStyle:"bold",fontSize:8},
      bodyStyles:{fontSize:8},
      alternateRowStyles:{fillColor:[240,245,255]},
      columnStyles:{1:{halign:"right"},2:{halign:"right"},3:{halign:"right",fontStyle:"bold"},4:{halign:"right"}},
    });
    y = doc.lastAutoTable.finalY + 10;
  } else { doc.setFontSize(9); doc.text("Sin datos de flujo de efectivo disponibles.", 14, y); y += 10; }

  // ── Indicadores Financieros ────────────────────────────────────────
  if (y > 200) { doc.addPage(); addHeader(); y = 22; }
  y = seccion(doc, autoTable, "INDICADORES FINANCIEROS", y);
  if (indicadores) {
    autoTable(doc, {
      startY: y, margin:{left:14,right:14},
      head:[["Indicador","Valor","Descripción"]],
      body:[
        ["Liquidez corriente", indicadores.liquidez != null ? Number(indicadores.liquidez).toFixed(2) : "Datos insuficientes", "Capacidad de pagar deudas a corto plazo"],
        ["Ratio de endeudamiento", fmtPct(indicadores.ratioEndeudamiento), "Deuda como % de activos totales"],
        ["Margen neto", fmtPct(indicadores.margenNeto), "Utilidad como % de ingresos"],
        ["ROA", fmtPct(indicadores.roa), "Retorno sobre activos totales"],
        ["ROE", fmtPct(indicadores.roe), "Retorno sobre patrimonio"],
        ["Capital de trabajo", fmt(indicadores.capitalTrabajo), "Activo corriente - Pasivo corriente"],
      ],
      headStyles:{fillColor:[29,78,216],textColor:255,fontStyle:"bold",fontSize:8},
      bodyStyles:{fontSize:8},
      alternateRowStyles:{fillColor:[240,245,255]},
      columnStyles:{1:{halign:"right",fontStyle:"bold"}},
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── PÁGINA 4: Inventario de Ganado ─────────────────────────────────
  doc.addPage(); addHeader(); y = 22;
  y = seccion(doc, autoTable, "INVENTARIO DE GANADO (ACTIVOS BIOLÓGICOS)", y);
  const precioLibra = 85;
  if (animales?.length > 0) {
    const activos = animales.filter(a => a.estado === "ACTIVO");
    const resumenGanado = {};
    activos.forEach(a => {
      const cat = a.sexo === "MACHO"
        ? (a.pesoActual > 300 ? "Novillo/Toro" : "Ternero macho")
        : (a.estadoReproductivo ? "Vaca reproductora" : a.pesoActual > 200 ? "Novilla" : "Ternera");
      if (!resumenGanado[cat]) resumenGanado[cat] = { cantidad:0, pesoTotal:0, valorEstimado:0 };
      resumenGanado[cat].cantidad++;
      resumenGanado[cat].pesoTotal += a.pesoActual || 0;
      resumenGanado[cat].valorEstimado += a.pesoActual ? a.pesoActual * precioLibra : (a.costoCompra || 0);
    });
    autoTable(doc, {
      startY: y, margin:{left:14,right:14},
      head:[["Categoría","Cantidad","Peso total (lb)","Valor estimado"]],
      body:[
        ...Object.entries(resumenGanado).map(([cat,d])=>[cat, d.cantidad, d.pesoTotal.toFixed(0)+" lb", fmt(d.valorEstimado)]),
        ["TOTAL HATO", activos.length, activos.reduce((s,a)=>s+(a.pesoActual||0),0).toFixed(0)+" lb", fmt(activos.reduce((s,a)=>s+(a.pesoActual?a.pesoActual*precioLibra:(a.costoCompra||0)),0))],
      ],
      headStyles:{fillColor:[21,128,61],textColor:255,fontStyle:"bold",fontSize:9},
      bodyStyles:{fontSize:9},
      alternateRowStyles:{fillColor:[240,253,244]},
      columnStyles:{1:{halign:"right"},2:{halign:"right"},3:{halign:"right",fontStyle:"bold"}},
      didParseCell:(d)=>{ if(d.row.raw[0]==="TOTAL HATO") { d.cell.styles.fontStyle="bold"; d.cell.styles.fillColor=[209,250,229]; } },
    });
    y = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(7); doc.setTextColor(120,120,120);
    doc.text(`* Valor estimado calculado a C$ ${precioLibra}/lb. No representa avalúo oficial.`, 14, y); y += 10;
    doc.setTextColor(30,30,30);
  } else { doc.setFontSize(9); doc.text("Sin animales activos registrados.", 14, y); y += 10; }

  // ── Activos Fijos ──────────────────────────────────────────────────
  if (y > 200) { doc.addPage(); addHeader(); y = 22; }
  y = seccion(doc, autoTable, "REGISTRO DE ACTIVOS FIJOS", y);
  if (Array.isArray(activosFijosRes) && activosFijosRes.length > 0) {
    autoTable(doc, {
      startY: y, margin:{left:14,right:14},
      head:[["Nombre","Categoría","Adquisición","Valor actual","Estado"]],
      body: activosFijosRes.map(a=>[a.nombre, a.categoria, a.fechaAdquisicion?new Date(a.fechaAdquisicion).toLocaleDateString("es-NI"):"—", fmt(a.valorActual||a.costoAdquisicion), a.estado]),
      headStyles:{fillColor:[29,78,216],textColor:255,fontStyle:"bold",fontSize:8},
      bodyStyles:{fontSize:8},
      alternateRowStyles:{fillColor:[240,245,255]},
      columnStyles:{3:{halign:"right",fontStyle:"bold"}},
    });
    y = doc.lastAutoTable.finalY + 10;
  } else { doc.setFontSize(9); doc.text("Sin activos fijos registrados.", 14, y); y += 10; }

  // ── Préstamos y Deudas ────────────────────────────────────────────
  if (y > 200) { doc.addPage(); addHeader(); y = 22; }
  y = seccion(doc, autoTable, "ESTADO DE DEUDAS Y PRÉSTAMOS", y);
  if (Array.isArray(prestamos) && prestamos.length > 0) {
    autoTable(doc, {
      startY: y, margin:{left:14,right:14},
      head:[["Acreedor","Monto original","Saldo actual","Vencimiento","Estado"]],
      body: prestamos.map(p=>[p.acreedor, fmt(p.montoOriginal), fmt(p.saldoActual), p.vencimiento?new Date(p.vencimiento).toLocaleDateString("es-NI"):"—", p.estado]),
      headStyles:{fillColor:[220,38,38],textColor:255,fontStyle:"bold",fontSize:8},
      bodyStyles:{fontSize:8},
      alternateRowStyles:{fillColor:[254,242,242]},
      columnStyles:{1:{halign:"right"},2:{halign:"right",fontStyle:"bold"}},
    });
    y = doc.lastAutoTable.finalY + 10;
  } else { doc.setFontSize(9); doc.text("Sin deudas o préstamos registrados.", 14, y); y += 10; }

  // ── Verificación de autenticidad ───────────────────────────────────
  if (y > 230) { doc.addPage(); addHeader(); y = 22; }
  doc.setFillColor(240,253,244); doc.roundedRect(14,y,W-28,26,3,3,"F");
  doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(21,128,61);
  doc.text("VERIFICACIÓN DE AUTENTICIDAD", 18, y+8);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(30,30,30);
  doc.text(`Token único: ${inf.token}`, 18, y+15);
  doc.text(`Verificar en: ganaderosg.app/verify/report/${inf.token}`, 18, y+21);

  // Pie de página en todas las páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150,150,150); doc.setFont("helvetica","normal");
    doc.text(`${inf.codigo} — Generado el ${hoy} — Página ${i} de ${totalPages}`, W/2, 272, { align:"center" });
    doc.text("Documento confidencial generado por ganaderosg.app · Henriquez Cattle Management", W/2, 276, { align:"center" });
  }

  doc.save(`${inf.codigo}-expediente-bancario.pdf`);
}

const cardGlass = { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(0,0,0,0.10)", borderRadius:14, padding:"16px 20px", marginBottom:16 };
const inputS = { background:"rgba(255,255,255,0.70)", border:"1px solid rgba(0,0,0,0.15)", borderRadius:8, padding:"8px 12px", fontSize:13, color:"#111", outline:"none", width:"100%", boxSizing:"border-box" };
const labelS = { fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 };
const stepBtn = (active, done) => ({
  width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, border:"none", cursor:"pointer",
  background: done ? "#15803d" : active ? "#1d4ed8" : "rgba(255,255,255,0.50)",
  color: (done || active) ? "#fff" : "#6b7280",
});

const PASOS = ["Datos generales","Documentos","Parámetros","Generar"];

const TIPOS = ["BALANCE_GENERAL","ESTADO_RESULTADOS","FLUJO_EFECTIVO","EXPEDIENTE_BANCARIO","PAQUETE_COMPLETO"];
const DOCUMENTOS_SUGERIDOS = [
  "Balance General",
  "Estado de Resultados",
  "Flujo de Efectivo",
  "Indicadores financieros",
  "Inventario de ganado",
  "Registro de activos fijos",
  "Estado de deudas y préstamos",
  "Cierres mensuales (últimos 12 meses)",
];

export default function ExpedientePage() {
  const [paso, setPaso] = useState(0);
  const [dbListo, setDbListo] = useState(true);
  const [informes, setInformes] = useState([]);
  const [loadingInformes, setLoadingInformes] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [informeCreado, setInformeCreado] = useState(null);
  const [informeGenerado, setInformeGenerado] = useState(null);
  const [balance, setBalance] = useState(null);

  const [form, setForm] = useState({
    tipo: "EXPEDIENTE_BANCARIO",
    empresa: "Henriquez Cattle Management",
    institucion: "",
    montoSolicitado: "",
    plazoMeses: "",
    destinoCredito: "",
    periodoDesde: "",
    periodoHasta: "",
    moneda: "NIO",
    notas: "",
  });

  const [docsIncluidos, setDocsIncluidos] = useState(
    Object.fromEntries(DOCUMENTOS_SUGERIDOS.map(d => [d, true]))
  );

  useEffect(() => {
    Promise.all([
      api("/informes-financieros").then(setInformes).catch(e => {
        setInformes([]);
        if (e?.message?.includes("does not exist")) setDbListo(false);
      }),
      api("/estados-financieros/resumen").then(setBalance).catch(()=>null),
    ]).finally(() => setLoadingInformes(false));
  }, []);

  async function crearBorrador() {
    setEnviando(true); setError("");
    try {
      const docs = Object.entries(docsIncluidos).filter(([,v])=>v).map(([k])=>k);
      const payload = {
        ...form,
        montoSolicitado: form.montoSolicitado ? parseFloat(form.montoSolicitado) : null,
        plazoMeses: form.plazoMeses ? parseInt(form.plazoMeses) : null,
        documentosIncluidos: docs,
      };
      const r = await api("/informes-financieros", { method:"POST", body: payload });
      setInformeCreado(r);
      setPaso(3);
    } catch (e) { setError(e.message); }
    finally { setEnviando(false); }
  }

  async function generarInforme() {
    if (!informeCreado) return;
    setGenerando(true); setError("");
    try {
      const r = await api(`/informes-financieros/${informeCreado.id}/generar`, { method:"POST", body:{} });
      setInformeGenerado(r);
      // refresh list
      api("/informes-financieros").then(setInformes).catch(()=>{});
    } catch (e) { setError(e.message); }
    finally { setGenerando(false); }
  }

  const pasoValido = (p) => {
    if (p === 0) return form.empresa && form.tipo && form.periodoDesde && form.periodoHasta;
    if (p === 1) return Object.values(docsIncluidos).some(Boolean);
    return true;
  };

  return (
    <div>
      {error && <div style={{ background:"#fee2e2", color:"#dc2626", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13 }}>{error}<button onClick={()=>setError("")} style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"#dc2626" }}>✕</button></div>}

      {!dbListo && (
        <div style={{ background:"rgba(254,243,199,0.90)", border:"1px solid #fcd34d", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#92400e" }}>
          ⏳ <strong>Base de datos actualizando…</strong> El servidor está aplicando las tablas nuevas (1-3 min). Puedes llenar el formulario mientras esperas — al hacer clic en "Crear borrador" se guardará cuando esté listo. Recarga la página en unos minutos.
        </div>
      )}

      {/* Balance rápido */}
      {balance && (
        <div style={{ ...cardGlass, marginBottom:20, background:"rgba(255,255,255,0.42)" }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#374151", marginBottom:8 }}>Resumen para incluir en expediente</div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:12 }}>
            <span>Total activos: <strong style={{ color:"#15803d" }}>C$ {Number(balance.totalActivos||0).toLocaleString("es-NI",{maximumFractionDigits:0})}</strong></span>
            <span>Patrimonio neto: <strong style={{ color:"#1d4ed8" }}>C$ {Number(balance.patrimonioNeto||0).toLocaleString("es-NI",{maximumFractionDigits:0})}</strong></span>
            <span>Deudas activas: <strong style={{ color:"#dc2626" }}>C$ {Number(balance.totalDeudas||0).toLocaleString("es-NI",{maximumFractionDigits:0})}</strong></span>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:24 }}>
        {PASOS.map((p,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", flex:i<PASOS.length-1?1:"none" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <button onClick={()=>i<paso && setPaso(i)} style={stepBtn(paso===i, i<paso)}>
                {i<paso ? "✓" : i+1}
              </button>
              <span style={{ fontSize:10, color:paso===i?"#1d4ed8":"#6b7280", fontWeight:paso===i?700:400, whiteSpace:"nowrap" }}>{p}</span>
            </div>
            {i<PASOS.length-1 && <div style={{ flex:1, height:2, background:i<paso?"#15803d":"rgba(0,0,0,0.12)", margin:"0 4px 18px" }} />}
          </div>
        ))}
      </div>

      {/* Paso 0: Datos generales */}
      {paso === 0 && (
        <div style={cardGlass}>
          <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:16 }}>Datos generales del expediente</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1/-1" }}><label style={labelS}>Empresa / Razón social *</label><input style={inputS} value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})} /></div>
            <div><label style={labelS}>Tipo de informe *</label>
              <select style={inputS} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                {TIPOS.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div><label style={labelS}>Institución destino</label><input style={inputS} placeholder="Banco, institución..." value={form.institucion} onChange={e=>setForm({...form,institucion:e.target.value})} /></div>
            <div><label style={labelS}>Monto solicitado (si aplica)</label><input style={inputS} type="number" placeholder="0.00" value={form.montoSolicitado} onChange={e=>setForm({...form,montoSolicitado:e.target.value})} /></div>
            <div><label style={labelS}>Plazo (meses)</label><input style={inputS} type="number" placeholder="12" value={form.plazoMeses} onChange={e=>setForm({...form,plazoMeses:e.target.value})} /></div>
            <div style={{ gridColumn:"1/-1" }}><label style={labelS}>Destino del crédito</label><input style={inputS} placeholder="Compra de ganado, mejora de instalaciones..." value={form.destinoCredito} onChange={e=>setForm({...form,destinoCredito:e.target.value})} /></div>
            <div><label style={labelS}>Período desde *</label><input style={inputS} type="date" value={form.periodoDesde} onChange={e=>setForm({...form,periodoDesde:e.target.value})} /></div>
            <div><label style={labelS}>Período hasta *</label><input style={inputS} type="date" value={form.periodoHasta} onChange={e=>setForm({...form,periodoHasta:e.target.value})} /></div>
            <div><label style={labelS}>Moneda</label>
              <select style={inputS} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}>
                <option value="NIO">NIO — Córdoba</option>
                <option value="USD">USD — Dólar</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop:16, textAlign:"right" }}>
            <button disabled={!pasoValido(0)} onClick={()=>setPaso(1)} style={{ padding:"10px 24px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:pasoValido(0)?1:0.5 }}>Siguiente →</button>
          </div>
        </div>
      )}

      {/* Paso 1: Documentos */}
      {paso === 1 && (
        <div style={cardGlass}>
          <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:16 }}>Selecciona los documentos a incluir</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {DOCUMENTOS_SUGERIDOS.map(doc => (
              <label key={doc} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 12px", background:"rgba(255,255,255,0.40)", borderRadius:8, border:`1px solid ${docsIncluidos[doc]?"#93c5fd":"rgba(0,0,0,0.08)"}` }}>
                <input type="checkbox" checked={!!docsIncluidos[doc]} onChange={e=>setDocsIncluidos({...docsIncluidos,[doc]:e.target.checked})} style={{ width:16, height:16 }} />
                <span style={{ fontSize:13, color:"#111", fontWeight:docsIncluidos[doc]?600:400 }}>{doc}</span>
              </label>
            ))}
          </div>
          <div style={{ marginTop:16, display:"flex", justifyContent:"space-between" }}>
            <button onClick={()=>setPaso(0)} style={{ padding:"10px 20px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontWeight:600, cursor:"pointer", color:"#111" }}>← Atrás</button>
            <button disabled={!pasoValido(1)} onClick={()=>setPaso(2)} style={{ padding:"10px 24px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:pasoValido(1)?1:0.5 }}>Siguiente →</button>
          </div>
        </div>
      )}

      {/* Paso 2: Parámetros / notas */}
      {paso === 2 && (
        <div style={cardGlass}>
          <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:16 }}>Parámetros adicionales</div>
          <div style={{ marginBottom:12 }}>
            <label style={labelS}>Notas o instrucciones especiales</label>
            <textarea style={{ ...inputS, resize:"vertical" }} rows={4} placeholder="Indicaciones para el receptor, contexto adicional..." value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} />
          </div>
          {/* Resumen checklist */}
          <div style={{ background:"rgba(255,255,255,0.40)", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:12 }}>
            <div style={{ fontWeight:700, marginBottom:8, color:"#111" }}>Resumen del expediente:</div>
            <div style={{ color:"#374151" }}>Empresa: <strong>{form.empresa}</strong></div>
            <div style={{ color:"#374151" }}>Tipo: <strong>{form.tipo.replace(/_/g," ")}</strong></div>
            {form.institucion && <div style={{ color:"#374151" }}>Institución: <strong>{form.institucion}</strong></div>}
            {form.montoSolicitado && <div style={{ color:"#374151" }}>Monto: <strong>C$ {Number(form.montoSolicitado).toLocaleString("es-NI")}</strong></div>}
            <div style={{ color:"#374151" }}>Período: <strong>{form.periodoDesde} al {form.periodoHasta}</strong></div>
            <div style={{ color:"#374151" }}>Documentos: <strong>{Object.values(docsIncluidos).filter(Boolean).length} seleccionados</strong></div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <button onClick={()=>setPaso(1)} style={{ padding:"10px 20px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontWeight:600, cursor:"pointer", color:"#111" }}>← Atrás</button>
            <button disabled={enviando} onClick={crearBorrador} style={{ padding:"10px 28px", background:"#15803d", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:enviando?0.6:1 }}>{enviando?"Creando...":"Crear borrador →"}</button>
          </div>
        </div>
      )}

      {/* Paso 3: Generar */}
      {paso === 3 && informeCreado && (
        <div>
          <div style={{ ...cardGlass, borderColor:"#86efac", background:"rgba(220,252,231,0.55)" }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#15803d", marginBottom:8 }}>✅ Borrador creado — {informeCreado.codigo}</div>
            <div style={{ fontSize:12, color:"#374151", marginBottom:16 }}>El expediente fue registrado con código único. Ahora puedes generarlo para obtener el PDF con código QR de verificación.</div>

            {!informeGenerado ? (
              <button disabled={generando} onClick={generarInforme}
                style={{ padding:"12px 28px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer", opacity:generando?0.6:1 }}>
                {generando ? "Generando expediente..." : "🏦 Generar expediente bancario"}
              </button>
            ) : (
              <div style={{ background:"rgba(255,255,255,0.55)", borderRadius:10, padding:"16px 20px", border:"1px solid rgba(0,0,0,0.10)" }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:10 }}>Expediente generado</div>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:12, color:"#374151", marginBottom:12 }}>
                  <div>Código: <strong style={{ fontFamily:"monospace" }}>{informeGenerado.codigo}</strong></div>
                  <div>Estado: <strong style={{ color:"#15803d" }}>{informeGenerado.estado}</strong></div>
                  <div>Versión: <strong>{informeGenerado.versiones?.[0]?.version ?? 1}</strong></div>
                </div>
                {/* Token QR */}
                {informeGenerado.token && (
                  <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:8, padding:"12px 16px", marginBottom:12 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:"#15803d", marginBottom:4 }}>Código de verificación QR</div>
                    <div style={{ fontFamily:"monospace", fontSize:11, color:"#374151", wordBreak:"break-all", marginBottom:8 }}>{informeGenerado.token}</div>
                    <div style={{ fontSize:11, color:"#6b7280" }}>La institución puede verificar la autenticidad del informe en: <strong>/verify/report/{informeGenerado.token}</strong></div>
                  </div>
                )}
                <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  <button onClick={() => generarPDF(informeGenerado, balance)}
                    style={{ padding:"10px 20px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    ⬇ Descargar PDF
                  </button>
                  {informeGenerado.token && (
                    <button onClick={() => window.open(`/verify/report/${informeGenerado.token}`, "_blank")}
                      style={{ padding:"10px 16px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.15)", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:"#374151" }}>
                      🔗 Ver verificación
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Expedientes anteriores */}
          {informes.length > 0 && (
            <div style={cardGlass}>
              <div style={{ fontWeight:700, fontSize:13, color:"#111", marginBottom:12 }}>Expedientes anteriores</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {informes.slice(0,5).map(inf => (
                  <div key={inf.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"rgba(255,255,255,0.40)", borderRadius:8, border:"1px solid rgba(0,0,0,0.08)", fontSize:12, flexWrap:"wrap", gap:8 }}>
                    <div>
                      <span style={{ fontWeight:700, fontFamily:"monospace", color:"#111" }}>{inf.codigo}</span>
                      <span style={{ marginLeft:10, color:"#6b7280" }}>{inf.tipo?.replace(/_/g," ")}</span>
                      {inf.empresa && <span style={{ marginLeft:10, color:"#374151" }}>{inf.empresa}</span>}
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontWeight:700, fontSize:11, background:inf.estado==="GENERADO"?"#dcfce7":inf.estado==="BORRADOR"?"#fef3c7":"#fee2e2", color:inf.estado==="GENERADO"?"#15803d":inf.estado==="BORRADOR"?"#92400e":"#dc2626", padding:"2px 8px", borderRadius:20 }}>{inf.estado}</span>
                      {inf.estado === "GENERADO" && <button onClick={() => generarPDF(inf, balance)} style={{ padding:"4px 10px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:11, cursor:"pointer" }}>⬇ PDF</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de expedientes si no está en wizard */}
      {paso < 3 && !loadingInformes && informes.length > 0 && (
        <div style={{ ...cardGlass, marginTop:24 }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#111", marginBottom:12 }}>Expedientes generados</div>
          {informes.map(inf => (
            <div key={inf.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"rgba(255,255,255,0.50)", borderRadius:10, border:"1px solid rgba(0,0,0,0.10)", marginBottom:8, gap:10, flexWrap:"wrap" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontWeight:800, fontFamily:"monospace", color:"#111", fontSize:13 }}>{inf.codigo}</span>
                  <span style={{ fontWeight:700, fontSize:11, background:inf.estado==="GENERADO"?"#dcfce7":inf.estado==="BORRADOR"?"#fef3c7":"#fee2e2", color:inf.estado==="GENERADO"?"#15803d":inf.estado==="BORRADOR"?"#92400e":"#dc2626", padding:"2px 8px", borderRadius:20 }}>{inf.estado}</span>
                </div>
                <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{inf.tipo?.replace(/_/g," ")}{inf.empresa ? ` · ${inf.empresa}` : ""}{inf.institucion ? ` → ${inf.institucion}` : ""}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {inf.estado === "GENERADO" && (
                  <button onClick={() => generarPDF(inf, balance)}
                    style={{ padding:"7px 14px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                    ⬇ Descargar PDF
                  </button>
                )}
                {inf.token && (
                  <button onClick={() => window.open(`/verify/report/${inf.token}`, "_blank")}
                    style={{ padding:"7px 14px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.15)", borderRadius:8, fontWeight:600, fontSize:12, cursor:"pointer", color:"#374151" }}>
                    🔗 Verificar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
