"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ganaderosg-backend.up.railway.app/api";
async function apiFetch(path) {
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
  const r = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization:`Bearer ${token}` } : {} });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

function fmt(v, mon = "NIO") {
  if (v === null || v === undefined || isNaN(Number(v))) return "—";
  const n = Number(v);
  if (mon === "USD") return "US$ " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return "C$ " + n.toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtPct(v) { return v != null ? Number(v).toFixed(1) + "%" : "—"; }
function fmtK(v) {
  if (!v) return "C$ 0";
  const n = Number(v);
  if (n >= 1000000) return "C$ " + (n/1000000).toFixed(1) + "M";
  if (n >= 1000) return "C$ " + (n/1000).toFixed(0) + "K";
  return "C$ " + n.toFixed(0);
}
const hoy = () => new Date().toLocaleDateString("es-NI", { year:"numeric", month:"long", day:"numeric" });

// ─── Colores ──────────────────────────────────────────────────────────────────
const C = {
  bg:       "rgba(8,18,10,0.85)",
  card:     "rgba(255,255,255,0.055)",
  cardHov:  "rgba(255,255,255,0.09)",
  border:   "rgba(255,255,255,0.10)",
  text:     "#f1f5f4",
  textSec:  "rgba(255,255,255,0.60)",
  textDim:  "rgba(255,255,255,0.35)",
  green:    "#22c55e",
  greenDk:  "#16a34a",
  blue:     "#60a5fa",
  blueDk:   "#2563eb",
  orange:   "#fb923c",
  orangeDk: "#ea580c",
  purple:   "#c084fc",
  purpleDk: "#9333ea",
  red:      "#f87171",
  redDk:    "#dc2626",
};
const glass = {
  background: C.card,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: "18px 20px",
};

// ─── Generación PDF (CONSERVADA INTACTA) ─────────────────────────────────────
function seccionPDF(doc, titulo, y) {
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(29,78,216);
  doc.text(titulo, 14, y);
  doc.setTextColor(30,30,30);
  return y + 6;
}

async function generarPDF(inf, balance) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

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
  const fmtP = (v) => v != null && !isNaN(v) ? "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits:2, maximumFractionDigits:2 }) : "—";
  const fmtPctP = (v) => v != null ? Number(v).toFixed(2) + "%" : "—";
  const fechaHoy = hoy();
  const addHeader = () => {
    doc.setFillColor(29,78,216); doc.rect(0,0,W,14,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont("helvetica","bold");
    doc.text("EXPEDIENTE FINANCIERO BANCARIO", 14, 9);
    doc.text(`${inf.codigo} · ${fechaHoy}`, W-14, 9, { align:"right" });
    doc.setTextColor(30,30,30);
  };

  doc.setFillColor(29,78,216); doc.rect(0,0,W,50,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(20); doc.setFont("helvetica","bold");
  doc.text("EXPEDIENTE FINANCIERO", 14, 22);
  doc.text("BANCARIO", 14, 32);
  doc.setFontSize(10); doc.setFont("helvetica","normal");
  doc.text("Henriquez Cattle Management — ganaderosg.app", 14, 42);
  doc.setTextColor(30,30,30);
  let y = 60;
  doc.setFontSize(10); doc.setFont("helvetica","bold");
  doc.text(`Código de expediente:`, 14, y); doc.setFont("helvetica","normal"); doc.text(inf.codigo, 70, y); y+=7;
  doc.setFont("helvetica","bold"); doc.text(`Fecha de emisión:`, 14, y); doc.setFont("helvetica","normal"); doc.text(fechaHoy, 70, y); y+=7;
  doc.setFont("helvetica","bold"); doc.text(`Empresa:`, 14, y); doc.setFont("helvetica","normal"); doc.text(inf.empresa || "Henriquez Cattle Management", 70, y); y+=7;
  if (inf.institucion) { doc.setFont("helvetica","bold"); doc.text(`Institución destino:`, 14, y); doc.setFont("helvetica","normal"); doc.text(inf.institucion, 70, y); y+=7; }
  if (inf.montoSolicitado) { doc.setFont("helvetica","bold"); doc.text(`Monto solicitado:`, 14, y); doc.setFont("helvetica","normal"); doc.text(fmtP(inf.montoSolicitado), 70, y); y+=7; }
  if (inf.plazoMeses) { doc.setFont("helvetica","bold"); doc.text(`Plazo solicitado:`, 14, y); doc.setFont("helvetica","normal"); doc.text(`${inf.plazoMeses} meses`, 70, y); y+=7; }
  if (inf.destinoCredito) { doc.setFont("helvetica","bold"); doc.text(`Destino del crédito:`, 14, y); doc.setFont("helvetica","normal"); doc.text(inf.destinoCredito, 70, y); y+=7; }
  if (inf.periodoDesde || inf.periodoHasta) {
    const desde = inf.periodoDesde ? new Date(inf.periodoDesde).toLocaleDateString("es-NI") : "";
    const hasta = inf.periodoHasta ? new Date(inf.periodoHasta).toLocaleDateString("es-NI") : "";
    doc.setFont("helvetica","bold"); doc.text(`Período analizado:`, 14, y); doc.setFont("helvetica","normal"); doc.text(`${desde} al ${hasta}`, 70, y); y+=7;
  }
  y+=4; doc.setDrawColor(200,200,200); doc.line(14,y,W-14,y); y+=8;
  const docs = inf.documentosIncluidos || [];
  if (docs.length > 0) {
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(29,78,216);
    doc.text("DOCUMENTOS INCLUIDOS EN ESTE EXPEDIENTE", 14, y); y+=7;
    doc.setTextColor(30,30,30); doc.setFontSize(9); doc.setFont("helvetica","normal");
    docs.forEach((d,i) => { doc.text(`${i+1}. ${d}`, 18, y); y+=6; });
  }

  doc.addPage(); addHeader(); y = 22;
  y = seccionPDF(doc, "BALANCE GENERAL — SITUACIÓN FINANCIERA", y);
  if (balance) {
    autoTable(doc, {
      startY:y, margin:{left:14,right:14},
      head:[["Concepto","Valor"]],
      body:[
        ["ACTIVOS",""],
        ["  Caja y bancos disponible", fmtP((balance.caja||0)+(balance.bancos||0))],
        ["  Activos biológicos (ganado)", fmtP(balance.valorGanado)],
        ["  Activos fijos", fmtP(balance.activosFijosTotal)||"C$ 0.00"],
        ["TOTAL ACTIVOS", fmtP(balance.totalActivos)],
        ["PASIVOS",""],
        ["  Préstamos y deudas activas", fmtP(balance.totalDeudas)],
        ["TOTAL PASIVOS", fmtP(balance.totalPasivos)],
        ["PATRIMONIO NETO", fmtP(balance.patrimonioNeto)],
      ],
      headStyles:{fillColor:[29,78,216],textColor:255,fontStyle:"bold",fontSize:9},
      bodyStyles:{fontSize:9},
      alternateRowStyles:{fillColor:[240,245,255]},
      columnStyles:{1:{halign:"right",fontStyle:"bold"}},
      didParseCell:(d)=>{ if(["TOTAL ACTIVOS","TOTAL PASIVOS","PATRIMONIO NETO"].includes(d.row.raw[0])) { d.cell.styles.fontStyle="bold"; d.cell.styles.fillColor=[220,240,255]; } if(["ACTIVOS","PASIVOS"].includes(d.row.raw[0])) { d.cell.styles.fontStyle="bold"; d.cell.styles.fillColor=[235,245,255]; } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (y > 200) { doc.addPage(); addHeader(); y = 22; }
  y = seccionPDF(doc, "ESTADO DE RESULTADOS", y);
  if (resultados) {
    autoTable(doc, {
      startY:y, margin:{left:14,right:14},
      head:[["Concepto","Monto"]],
      body:[
        ["Ingresos por ventas", fmtP(resultados.ingresoVentas)],
        ["Costos directos", fmtP(resultados.costosDirectos)],
        ["MARGEN BRUTO", fmtP(resultados.margenBruto)],
        ["Gastos operativos", fmtP(resultados.gastosOp)],
        ["RESULTADO OPERATIVO", fmtP(resultados.resultadoOperativo)],
      ],
      headStyles:{fillColor:[21,128,61],textColor:255,fontStyle:"bold",fontSize:9},
      bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[240,253,244]},
      columnStyles:{1:{halign:"right",fontStyle:"bold"}},
      didParseCell:(d)=>{ if(["MARGEN BRUTO","RESULTADO OPERATIVO"].includes(d.row.raw[0])) { d.cell.styles.fontStyle="bold"; d.cell.styles.fillColor=[209,250,229]; } },
    });
    y = doc.lastAutoTable.finalY + 6;
  } else { doc.setFontSize(9); doc.text("Sin datos de resultados disponibles.", 14, y); y+=10; }

  doc.addPage(); addHeader(); y = 22;
  y = seccionPDF(doc, "FLUJO DE EFECTIVO — ÚLTIMOS 12 MESES", y);
  if (flujo?.meses?.length > 0) {
    autoTable(doc, {
      startY:y, margin:{left:14,right:14},
      head:[["Mes","Ingresos","Egresos","Flujo Neto","Saldo Acum."]],
      body: flujo.meses.map(m=>[m.mes, fmtP(m.ingresos), fmtP(m.egresos), fmtP(m.flujoNeto), fmtP(m.saldoAcumulado)]),
      headStyles:{fillColor:[29,78,216],textColor:255,fontStyle:"bold",fontSize:8},
      bodyStyles:{fontSize:8}, alternateRowStyles:{fillColor:[240,245,255]},
      columnStyles:{1:{halign:"right"},2:{halign:"right"},3:{halign:"right",fontStyle:"bold"},4:{halign:"right"}},
    });
    y = doc.lastAutoTable.finalY + 10;
  } else { doc.setFontSize(9); doc.text("Sin datos de flujo de efectivo disponibles.", 14, y); y+=10; }

  if (y > 200) { doc.addPage(); addHeader(); y = 22; }
  y = seccionPDF(doc, "INDICADORES FINANCIEROS", y);
  if (indicadores) {
    autoTable(doc, {
      startY:y, margin:{left:14,right:14},
      head:[["Indicador","Valor","Descripción"]],
      body:[
        ["Liquidez corriente", indicadores.liquidez != null ? Number(indicadores.liquidez).toFixed(2) : "Datos insuficientes", "Capacidad de pagar deudas a corto plazo"],
        ["Ratio de endeudamiento", fmtPctP(indicadores.ratioEndeudamiento), "Deuda como % de activos totales"],
        ["Margen neto", fmtPctP(indicadores.margenNeto), "Utilidad como % de ingresos"],
        ["ROA", fmtPctP(indicadores.roa), "Retorno sobre activos totales"],
        ["ROE", fmtPctP(indicadores.roe), "Retorno sobre patrimonio"],
        ["Capital de trabajo", fmtP(indicadores.capitalTrabajo), "Activo corriente - Pasivo corriente"],
      ],
      headStyles:{fillColor:[29,78,216],textColor:255,fontStyle:"bold",fontSize:8},
      bodyStyles:{fontSize:8}, alternateRowStyles:{fillColor:[240,245,255]},
      columnStyles:{1:{halign:"right",fontStyle:"bold"}},
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  doc.addPage(); addHeader(); y = 22;
  y = seccionPDF(doc, "INVENTARIO DE GANADO (ACTIVOS BIOLÓGICOS)", y);
  const precioLibra = 85;
  function edadMesesPdf(a) { if (!a.fechaNacimiento) return 999; return (Date.now()-new Date(a.fechaNacimiento))/(1000*60*60*24*30.4); }
  function valorAnimalPdf(a) { if (a.pesoActual) return a.pesoActual*precioLibra; if (a.costoCompra) return a.costoCompra; if (!a.pesoActual && !a.costoCompra && a.origen==="FINCA" && edadMesesPdf(a)<7) return 17000; return 0; }
  if (animales?.length > 0) {
    const activos = animales.filter(a => a.estado==="ACTIVO");
    const resumenGanado = {};
    activos.forEach(a => {
      const catMap = { CRIA:"Cría", TERNERO:"Ternero", TERNERA:"Ternera", TORO:"Toro", VACA:"Vaca", SEMENTAL:"Semental" };
      const cat = a.categoria ? (catMap[a.categoria]||a.categoria) : a.sexo==="MACHO" ? "Ternero" : "Ternera";
      if (!resumenGanado[cat]) resumenGanado[cat]={cantidad:0,pesoTotal:0,valorEstimado:0};
      resumenGanado[cat].cantidad++;
      resumenGanado[cat].pesoTotal += a.pesoActual||0;
      resumenGanado[cat].valorEstimado += valorAnimalPdf(a);
    });
    autoTable(doc, {
      startY:y, margin:{left:14,right:14},
      head:[["Categoría","Cantidad","Peso total (lb)","Valor estimado"]],
      body:[
        ...Object.entries(resumenGanado).map(([cat,d])=>[cat,d.cantidad,d.pesoTotal.toFixed(0)+" lb",fmtP(d.valorEstimado)]),
        ["TOTAL HATO",activos.length,activos.reduce((s,a)=>s+(a.pesoActual||0),0).toFixed(0)+" lb",fmtP(activos.reduce((s,a)=>s+valorAnimalPdf(a),0))],
      ],
      headStyles:{fillColor:[21,128,61],textColor:255,fontStyle:"bold",fontSize:9},
      bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[240,253,244]},
      columnStyles:{1:{halign:"right"},2:{halign:"right"},3:{halign:"right",fontStyle:"bold"}},
      didParseCell:(d)=>{ if(d.row.raw[0]==="TOTAL HATO") { d.cell.styles.fontStyle="bold"; d.cell.styles.fillColor=[209,250,229]; } },
    });
    y = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(7); doc.setTextColor(120,120,120);
    doc.text(`* Valor estimado a C$ ${precioLibra}/lb. No representa avalúo oficial.`, 14, y); y+=10;
    doc.setTextColor(30,30,30);
  } else { doc.setFontSize(9); doc.text("Sin animales activos registrados.", 14, y); y+=10; }

  if (y > 200) { doc.addPage(); addHeader(); y = 22; }
  y = seccionPDF(doc, "REGISTRO DE ACTIVOS FIJOS", y);
  if (Array.isArray(activosFijosRes) && activosFijosRes.length > 0) {
    autoTable(doc, {
      startY:y, margin:{left:14,right:14},
      head:[["Nombre","Categoría","Adquisición","Valor actual","Estado"]],
      body: activosFijosRes.map(a=>[a.nombre,a.categoria,a.fechaAdquisicion?new Date(a.fechaAdquisicion).toLocaleDateString("es-NI"):"—",fmtP(a.valorActual||a.costoAdquisicion),a.estado]),
      headStyles:{fillColor:[29,78,216],textColor:255,fontStyle:"bold",fontSize:8},
      bodyStyles:{fontSize:8}, alternateRowStyles:{fillColor:[240,245,255]},
      columnStyles:{3:{halign:"right",fontStyle:"bold"}},
    });
    y = doc.lastAutoTable.finalY + 10;
  } else { doc.setFontSize(9); doc.text("Sin activos fijos registrados.", 14, y); y+=10; }

  if (y > 200) { doc.addPage(); addHeader(); y = 22; }
  y = seccionPDF(doc, "ESTADO DE DEUDAS Y PRÉSTAMOS", y);
  if (Array.isArray(prestamos) && prestamos.length > 0) {
    autoTable(doc, {
      startY:y, margin:{left:14,right:14},
      head:[["Acreedor","Monto original","Saldo actual","Vencimiento","Estado"]],
      body: prestamos.map(p=>[p.acreedor,fmtP(p.montoOriginal),fmtP(p.saldoActual),p.vencimiento?new Date(p.vencimiento).toLocaleDateString("es-NI"):"—",p.estado]),
      headStyles:{fillColor:[220,38,38],textColor:255,fontStyle:"bold",fontSize:8},
      bodyStyles:{fontSize:8}, alternateRowStyles:{fillColor:[254,242,242]},
      columnStyles:{1:{halign:"right"},2:{halign:"right",fontStyle:"bold"}},
    });
  } else { doc.setFontSize(9); doc.text("Sin deudas o préstamos registrados.", 14, y); }

  if (y > 230) { doc.addPage(); addHeader(); y = 22; }
  const WDoc = doc.internal.pageSize.getWidth();
  doc.setFillColor(240,253,244); doc.roundedRect(14,y,WDoc-28,26,3,3,"F");
  doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(21,128,61);
  doc.text("VERIFICACIÓN DE AUTENTICIDAD", 18, y+8);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(30,30,30);
  doc.text(`Token único: ${inf.token}`, 18, y+15);
  doc.text(`Verificar en: ganaderosg.app/verify/report/${inf.token}`, 18, y+21);

  const totalPages = doc.internal.getNumberOfPages();
  for (let i=1; i<=totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150,150,150); doc.setFont("helvetica","normal");
    doc.text(`${inf.codigo} — Generado el ${fechaHoy} — Página ${i} de ${totalPages}`, WDoc/2, 272, { align:"center" });
    doc.text("Documento confidencial generado por ganaderosg.app · Henriquez Cattle Management", WDoc/2, 276, { align:"center" });
  }
  doc.save(`${inf.codigo}-expediente-bancario.pdf`);
}

// ─── Constantes del wizard (CONSERVADAS) ─────────────────────────────────────
const TIPOS = ["BALANCE_GENERAL","ESTADO_RESULTADOS","FLUJO_EFECTIVO","EXPEDIENTE_BANCARIO","PAQUETE_COMPLETO"];
const DOCS_SUGERIDOS = ["Balance General","Estado de Resultados","Flujo de Efectivo","Indicadores financieros","Inventario de ganado","Registro de activos fijos","Estado de deudas y préstamos","Cierres mensuales (últimos 12 meses)"];
const INSTITUCIONES = ["Ficohsa","BANPRO","BAC","LAFISE","BDF","Avanz","Otra institución"];
const TIPOS_FINANC = ["Capital de trabajo","Compra de ganado","Engorde de ganado","Mejoramiento de pasturas","Infraestructura","Maquinaria","Vehículo","Sistema de agua/riego","Expansión de la ganadería","Otro"];
const FORM_VACIO = { tipo:"EXPEDIENTE_BANCARIO", empresa:"Henriquez Cattle Management", institucion:"", montoSolicitado:"", plazoMeses:"", destinoCredito:"", periodoDesde:"", periodoHasta:"", moneda:"NIO", notas:"", aportePropio:"" };

// ─── Mini gráfico SVG ─────────────────────────────────────────────────────────
function MiniChart({ meses = [] }) {
  if (!meses.length) return <div style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: 24 }}>Sin datos históricos</div>;
  const maxVal = Math.max(...meses.flatMap(m => [m.ingresos || 0, m.egresos || 0, m.utilidad || 0]), 1);
  const W = 520, H = 80;
  const pad = 8;
  const dW = (W - pad*2) / meses.length;
  const scY = (v) => H - pad - ((v / maxVal) * (H - pad*2));

  function line(data, color) {
    const pts = meses.map((m, i) => `${pad + i*dW + dW/2},${scY(data(m))}`).join(" ");
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />;
  }
  function bar(val, i, color) {
    const bW = dW * 0.28;
    const bH = Math.max(2, ((val||0)/maxVal)*(H-pad*2));
    return <rect key={i} x={pad+i*dW+dW*0.08} y={H-pad-bH} width={bW} height={bH} fill={color} rx="2" opacity="0.55" />;
  }
  function bar2(val, i, color) {
    const bW = dW * 0.28;
    const bH = Math.max(2, ((val||0)/maxVal)*(H-pad*2));
    return <rect key={i} x={pad+i*dW+dW*0.44} y={H-pad-bH} width={bW} height={bH} fill={color} rx="2" opacity="0.55" />;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:80, display:"block" }}>
      {meses.map((m, i) => bar(m.ingresos, i, C.green))}
      {meses.map((m, i) => bar2(m.egresos, i, C.red))}
      {line(m => m.utilidad || (m.ingresos||0)-(m.egresos||0), C.blue)}
      {meses.map((m, i) => (
        <text key={i} x={pad+i*dW+dW/2} y={H} textAnchor="middle" fontSize="8" fill={C.textDim}>{(m.mes||"").slice(5)}</text>
      ))}
    </svg>
  );
}

// ─── Barra de progreso ────────────────────────────────────────────────────────
function ProgressBar({ pct, color = C.green, h = 8 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 99, height: h, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ─── Badge estado ─────────────────────────────────────────────────────────────
const ESTADO_COLORS = {
  BORRADOR:      { bg:"rgba(234,179,8,0.20)",  color:"#fde047",  label:"Borrador" },
  GENERADO:      { bg:"rgba(34,197,94,0.20)",  color:C.green,    label:"Generado" },
  EN_PREPARACION:{ bg:"rgba(251,146,60,0.20)", color:C.orange,   label:"En preparación" },
  PRESENTADO:    { bg:"rgba(96,165,250,0.20)", color:C.blue,     label:"Presentado" },
  EN_REVISION:   { bg:"rgba(96,165,250,0.20)", color:C.blue,     label:"En revisión" },
  APROBADO:      { bg:"rgba(34,197,94,0.20)",  color:C.green,    label:"Aprobado" },
  RECHAZADO:     { bg:"rgba(248,113,113,0.20)",color:C.red,      label:"Rechazado" },
  DESEMBOLSADO:  { bg:"rgba(192,132,252,0.20)",color:C.purple,   label:"Desembolsado" },
  ANULADO:       { bg:"rgba(100,116,139,0.20)",color:"#94a3b8",  label:"Anulado" },
};
function EstadoBadge({ estado }) {
  const s = ESTADO_COLORS[estado] || ESTADO_COLORS.BORRADOR;
  return <span style={{ background:s.bg, color:s.color, padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:700 }}>{s.label}</span>;
}

// ─── Definición de documentos ─────────────────────────────────────────────────
// fuente: "sistema" = se obtiene automáticamente de la base de datos
//         "externo" = debe subirse manualmente (documento físico/externo)
const TIPOS_DOCS = [
  // ── Externos (requieren subida manual)
  { key:"IDENTIFICACION",     label:"Identificación",          icon:"🪪", fuente:"externo", desc:"Cédula o pasaporte del propietario" },
  { key:"RUC",                label:"RUC",                     icon:"📋", fuente:"externo", desc:"Registro Único del Contribuyente (DGI)" },
  { key:"MATRICULA",          label:"Matrícula del negocio",   icon:"🏢", fuente:"externo", desc:"Matrícula municipal / Registro Mercantil" },
  { key:"TITULO_PROPIEDAD",   label:"Título de propiedad",     icon:"🏡", fuente:"externo", desc:"Escritura notarial de finca o terreno" },
  { key:"ESTADOS_BANCARIOS",  label:"Estados bancarios",       icon:"🏦", fuente:"externo", desc:"PDF emitido por el banco (últimos 6 meses)" },
  { key:"DECLARACION_FISCAL", label:"Declaración fiscal",      icon:"📊", fuente:"externo", desc:"Formulario IR o IVA emitido por la DGI" },
  { key:"AVALUO",             label:"Avalúo actualizado",       icon:"💰", fuente:"externo", desc:"Peritaje de bienes inmuebles o activos" },
  { key:"PLAN_INVERSION",     label:"Plan de inversión",        icon:"📝", fuente:"externo", desc:"Documento con el uso detallado del crédito" },
  // ── Del sistema (se generan automáticamente)
  { key:"BALANCE",            label:"Balance general",          icon:"⚖️", fuente:"sistema", apiCheck:"balance" },
  { key:"ESTADO_RESULTADOS",  label:"Estado de resultados",     icon:"📈", fuente:"sistema", apiCheck:"resultados" },
  { key:"FLUJO_EFECTIVO",     label:"Flujo de efectivo",        icon:"💵", fuente:"sistema", apiCheck:"flujo" },
  { key:"INDICADORES",        label:"Indicadores financieros",  icon:"📉", fuente:"sistema", apiCheck:"indicadores" },
  { key:"INVENTARIO",         label:"Inventario ganadero",      icon:"🐄", fuente:"sistema", apiCheck:"animales" },
  { key:"HISTORIAL_VENTAS",   label:"Historial de ventas",      icon:"📦", fuente:"sistema", apiCheck:"resultados" },
  { key:"ACTIVOS_FIJOS",      label:"Registro activos fijos",   icon:"🏗️", fuente:"sistema", apiCheck:"activosFijos" },
  { key:"ESTADO_DEUDAS",      label:"Estado de deudas",         icon:"📑", fuente:"sistema", apiCheck:"deudas" },
  { key:"OTRO",               label:"Otro documento",           icon:"📁", fuente:"externo", desc:"Cualquier otro documento de soporte" },
];
const DOCS_EXTERNOS = TIPOS_DOCS.filter(t => t.fuente==="externo" && t.key!=="OTRO");
const DOCS_SISTEMA  = TIPOS_DOCS.filter(t => t.fuente==="sistema");

// ─── Tab Documentos ───────────────────────────────────────────────────────────
function TabDocumentos({ inputS, labelS, C, glass, ProgressBar, balance, resultados, flujo, indicadores, animalesCount }) {
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [tipoInicial, setTipoInicial] = useState("IDENTIFICACION");
  const [subiendo, setSubiendo]   = useState(false);
  const [errorDoc, setErrorDoc]   = useState("");
  const [tipoSel, setTipoSel]     = useState("IDENTIFICACION");
  const [nombreSel, setNombreSel] = useState("");
  const [archivo, setArchivo]     = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    api("/documentos-expediente").then(d => { setDocs(Array.isArray(d)?d:[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  // Disponibilidad automática de docs del sistema
  const sistemaDisponible = {
    balance:      !!(balance?.totalActivos > 0),
    resultados:   !!(resultados?.ingresoVentas != null),
    flujo:        !!(flujo?.meses?.length > 0),
    indicadores:  !!(indicadores?.liquidez != null || indicadores?.margenNeto != null),
    animales:     !!(animalesCount > 0),
    activosFijos: !!(balance?.activosFijosTotal > 0),
    deudas:       !!(balance?.totalDeudas != null),
  };

  // Docs externos subidos
  const tiposSubidos = new Set(docs.map(d => d.tipo));

  // Conteo para la barra de progreso
  const externosOk  = DOCS_EXTERNOS.filter(t => tiposSubidos.has(t.key)).length;
  const sistemaOk   = DOCS_SISTEMA.filter(t => sistemaDisponible[t.apiCheck]).length;
  const totalOk     = externosOk + sistemaOk;
  const totalDocs   = DOCS_EXTERNOS.length + DOCS_SISTEMA.length;
  const pctDocs     = Math.round(totalOk / totalDocs * 100);

  function abrirModal(tipoKey) {
    const t = TIPOS_DOCS.find(d => d.key === tipoKey) || TIPOS_DOCS[0];
    setTipoSel(tipoKey);
    setNombreSel(t.label);
    setArchivo(null);
    setErrorDoc("");
    setModal(true);
  }

  async function subirDoc(e) {
    e.preventDefault();
    if (!archivo) { setErrorDoc("Selecciona un archivo"); return; }
    if (!nombreSel.trim()) { setErrorDoc("Escribe un nombre"); return; }
    setSubiendo(true); setErrorDoc("");
    try {
      const fd = new FormData();
      fd.append("archivo", archivo);
      fd.append("tipo", tipoSel);
      fd.append("nombre", nombreSel.trim());
      const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
      const BASE = process.env.NEXT_PUBLIC_API_URL || "https://ganaderosg-backend.up.railway.app/api";
      const r = await fetch(`${BASE}/documentos-expediente`, {
        method:"POST", headers: token ? { Authorization:`Bearer ${token}` } : {}, body: fd,
      });
      if (!r.ok) { const d = await r.json().catch(()=>{}); throw new Error(d?.error || "Error al subir"); }
      setModal(false); setArchivo(null); setNombreSel(""); cargar();
    } catch(err) { setErrorDoc(err.message); }
    finally { setSubiendo(false); }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este documento?")) return;
    await api(`/documentos-expediente/${id}`, { method:"DELETE" }).catch(()=>{});
    cargar();
  }

  const { purple, border, text, textSec, textDim, green, blue, red, orange } = C;

  return (
    <div>
      {/* Modal subir */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={()=>setModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#0d1a10", border:`1px solid ${border}`, borderRadius:16, padding:28, width:"100%", maxWidth:440 }}>
            <div style={{ fontWeight:800, fontSize:16, color:text, marginBottom:6 }}>Subir documento externo</div>
            <p style={{ fontSize:12, color:textDim, margin:"0 0 20px" }}>Estos documentos no pueden generarse del sistema — se obtienen de entidades externas.</p>
            <form onSubmit={subirDoc}>
              <div style={{ marginBottom:12 }}>
                <label style={labelS}>Tipo de documento *</label>
                <select style={inputS} value={tipoSel} onChange={e=>{ setTipoSel(e.target.value); const t=TIPOS_DOCS.find(d=>d.key===e.target.value); if(t) setNombreSel(t.label); }}>
                  {[...DOCS_EXTERNOS, { key:"OTRO", label:"Otro documento", icon:"📁" }].map(t=>(
                    <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={labelS}>Nombre del archivo *</label>
                <input style={inputS} value={nombreSel} onChange={e=>setNombreSel(e.target.value)} placeholder="Ej: Cédula de Jon Celestino" />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelS}>Archivo *</label>
                <label style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.06)", border:`2px dashed ${archivo?purple:border}`, borderRadius:10, padding:"14px 16px", cursor:"pointer" }}>
                  <input type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" style={{ display:"none" }} onChange={e=>setArchivo(e.target.files[0])} />
                  <span style={{ fontSize:22 }}>📎</span>
                  <span style={{ fontSize:13, color:archivo?text:textDim }}>{archivo ? archivo.name : "Imagen, PDF, Word o Excel"}</span>
                </label>
              </div>
              {errorDoc && <p style={{ color:red, fontSize:12, marginBottom:10 }}>{errorDoc}</p>}
              <div style={{ display:"flex", gap:8 }}>
                <button type="button" onClick={()=>setModal(false)} style={{ flex:1, padding:"10px 0", background:"rgba(255,255,255,0.08)", border:`1px solid ${border}`, borderRadius:8, color:textSec, fontWeight:600, cursor:"pointer", fontSize:13 }}>Cancelar</button>
                <button type="submit" disabled={subiendo} style={{ flex:2, padding:"10px 0", background:purple, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:subiendo?"wait":"pointer", opacity:subiendo?0.6:1 }}>
                  {subiendo ? "Subiendo..." : "⬆ Subir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Encabezado con progreso */}
      <div style={{ ...glass, marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:purple, textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>DOCUMENTOS DEL EXPEDIENTE</p>
          <span style={{ fontSize:13, color:textSec, fontWeight:700 }}>{totalOk} / {totalDocs} listos</span>
        </div>
        <ProgressBar pct={pctDocs} color={purple} h={7} />
        <div style={{ display:"flex", gap:16, marginTop:8, fontSize:11, color:textDim }}>
          <span>🟢 Del sistema: {sistemaOk}/{DOCS_SISTEMA.length}</span>
          <span>📎 Subidos manualmente: {externosOk}/{DOCS_EXTERNOS.length}</span>
        </div>
      </div>

      {/* ── Sección A: Del sistema (automáticos) ── */}
      <div style={{ ...glass, marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <p style={{ fontSize:12, fontWeight:800, color:green, margin:"0 0 2px" }}>DEL SISTEMA — Generados automáticamente</p>
            <p style={{ fontSize:11, color:textDim, margin:0 }}>Estos documentos se obtienen directamente de los datos registrados en el sistema. No necesitas subir nada.</p>
          </div>
          <span style={{ fontSize:22 }}>⚙️</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {DOCS_SISTEMA.map(tipo => {
            const ok = sistemaDisponible[tipo.apiCheck];
            return (
              <div key={tipo.key} style={{ background: ok ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)", border:`1px solid ${ok ? green+"40" : border}`, borderRadius:10, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{tipo.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:text, marginBottom:3 }}>{tipo.label}</div>
                  {ok ? (
                    <span style={{ fontSize:10, background:"rgba(34,197,94,0.15)", color:green, padding:"2px 8px", borderRadius:99, fontWeight:700 }}>✓ Disponible del sistema</span>
                  ) : (
                    <span style={{ fontSize:10, color:orange }}>Sin datos aún — ingresa información en el sistema</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sección B: Externos (subida manual) ── */}
      <div style={glass}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <p style={{ fontSize:12, fontWeight:800, color:purple, margin:"0 0 2px" }}>DOCUMENTOS EXTERNOS — Requieren subida manual</p>
            <p style={{ fontSize:11, color:textDim, margin:0 }}>Estos documentos son emitidos por entidades externas. Súbelos en formato PDF o imagen.</p>
          </div>
          <button onClick={()=>abrirModal("IDENTIFICACION")}
            style={{ padding:"8px 16px", background:"rgba(192,132,252,0.15)", border:`1px solid ${purple}`, borderRadius:8, color:purple, fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
            + Subir documento
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {DOCS_EXTERNOS.map(tipo => {
            const docsDelTipo = docs.filter(d => d.tipo === tipo.key);
            const ok = docsDelTipo.length > 0;
            return (
              <div key={tipo.key} style={{ background: ok ? "rgba(192,132,252,0.06)" : "rgba(255,255,255,0.03)", border:`1px solid ${ok ? purple+"40" : border}`, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <span style={{ fontSize:20 }}>{tipo.icon}</span>
                  {ok
                    ? <span style={{ fontSize:10, background:"rgba(192,132,252,0.15)", color:purple, padding:"2px 8px", borderRadius:99, fontWeight:700 }}>✓ Subido</span>
                    : <button onClick={()=>abrirModal(tipo.key)} style={{ fontSize:10, background:"rgba(255,255,255,0.08)", border:`1px solid ${border}`, borderRadius:6, padding:"3px 8px", cursor:"pointer", color:textSec, fontWeight:600 }}>+ Subir</button>
                  }
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:text, marginBottom:3 }}>{tipo.label}</div>
                <div style={{ fontSize:10, color:textDim, marginBottom: ok ? 6 : 0 }}>{tipo.desc}</div>
                {ok && docsDelTipo.map(d => (
                  <div key={d.id} style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:purple, textDecoration:"underline", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {d.nombre}
                    </a>
                    <button onClick={()=>eliminar(d.id)} style={{ background:"none", border:"none", cursor:"pointer", color:red, fontSize:12, padding:0, lineHeight:1, flexShrink:0 }} title="Eliminar">✕</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Otros documentos */}
        {docs.filter(d=>d.tipo==="OTRO").length > 0 && (
          <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${border}` }}>
            <p style={{ fontSize:11, color:textSec, fontWeight:700, margin:"0 0 8px" }}>OTROS DOCUMENTOS</p>
            {docs.filter(d=>d.tipo==="OTRO").map(d=>(
              <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"8px 12px", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:13, color:text, fontWeight:600 }}>{d.nombre}</div>
                  <div style={{ fontSize:11, color:textDim }}>{new Date(d.createdAt).toLocaleDateString("es-NI")}</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ padding:"5px 10px", background:"rgba(255,255,255,0.08)", border:`1px solid ${border}`, borderRadius:6, fontSize:11, color:textSec, textDecoration:"none", fontWeight:600 }}>Ver</a>
                  <button onClick={()=>eliminar(d.id)} style={{ padding:"5px 10px", background:"rgba(220,38,38,0.12)", border:`1px solid rgba(220,38,38,0.3)`, borderRadius:6, fontSize:11, color:red, cursor:"pointer", fontWeight:600 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && <p style={{ fontSize:12, color:textDim, margin:"10px 0 0" }}>Cargando documentos...</p>}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ExpedientePage() {
  // ── Tab interna
  const [tab, setTab] = useState("resumen");

  // ── Datos del sistema
  const [balance, setBalance]       = useState(null);
  const [resultados, setResultados] = useState(null);
  const [flujo, setFlujo]           = useState(null);
  const [animales, setAnimales]     = useState([]);
  const [informes, setInformes]     = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [periodoHistorico, setPeriodoHistorico] = useState("12");

  // ── Estado del wizard (CONSERVADO)
  const [paso, setPaso]         = useState(0);
  const [dbListo, setDbListo]   = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError]       = useState("");
  const [informeCreado, setInformeCreado]   = useState(null);
  const [informeGenerado, setInformeGenerado] = useState(null);
  const [form, setForm]         = useState(FORM_VACIO);
  const [docsIncluidos, setDocsIncluidos] = useState(Object.fromEntries(DOCS_SUGERIDOS.map(d=>[d,true])));

  // ── Cargar datos
  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      api("/estados-financieros/resumen").then(setBalance).catch(()=>null),
      api("/estados-financieros/resultados").then(setResultados).catch(()=>null),
      api(`/estados-financieros/flujo-efectivo?meses=${periodoHistorico}`).then(setFlujo).catch(()=>null),
      api("/animales?estado=ACTIVO&limit=500").then(d => setAnimales(Array.isArray(d)?d:(d?.items||[]))).catch(()=>null),
      api("/informes-financieros").then(setInformes).catch(e => {
        setInformes([]);
        if (e?.message?.includes("does not exist")) setDbListo(false);
      }),
      api("/estados-financieros/indicadores").then(setIndicadores).catch(()=>null),
    ]).finally(() => setLoadingData(false));
  }, [periodoHistorico]);

  // ── Calcular porcentajes de completitud
  const pctPerfil = 100; // empresa siempre disponible
  const pctCapacidad = Math.min(100, Math.round(
    (resultados?.ingresoVentas > 0 ? 50 : 0) +
    (balance?.totalActivos > 0 ? 25 : 0) +
    (balance?.caja > 0 || balance?.bancos > 0 ? 25 : 0)
  ));
  const pctPatrimonio = Math.min(100, Math.round(
    (balance?.valorGanado > 0 ? 40 : 0) +
    (balance?.activosFijosTotal > 0 ? 30 : 0) +
    ((balance?.caja||0)+(balance?.bancos||0) > 0 ? 30 : 0)
  ));
  const pctDocumentacion = 65; // estimado — sin storage implementado aún
  const pctTotal = Math.round((pctPerfil + pctCapacidad + pctPatrimonio + pctDocumentacion) / 4);

  // ── Inventario ganadero por categoría
  const catMap = { CRIA:"Cría", TERNERO:"Ternero", TERNERA:"Ternera", TORO:"Toro", VACA:"Vaca", SEMENTAL:"Semental" };
  const categorias = {};
  const precioLibraDefault = 85;
  animales.forEach(a => {
    const cat = a.categoria ? (catMap[a.categoria]||a.categoria) : a.sexo==="MACHO"?"Ternero":"Ternera";
    if (!categorias[cat]) categorias[cat] = { count:0, pesoTotal:0, valor:0 };
    categorias[cat].count++;
    categorias[cat].pesoTotal += a.pesoActual||0;
    const v = a.pesoActual ? a.pesoActual*precioLibraDefault : (a.costoCompra||0);
    categorias[cat].valor += v;
  });
  const valorHato = animales.reduce((s,a) => s + (a.pesoActual ? a.pesoActual*precioLibraDefault : (a.costoCompra||0)), 0);

  // ── Datos históricos del gráfico
  const mesesHistorico = flujo?.meses || [];

  // ── KPIs financieros
  const ingresos12 = resultados?.ingresoVentas || 0;
  const gastos12   = (resultados?.costosDirectos||0) + (resultados?.gastosOp||0);
  const utilidad12 = ingresos12 - gastos12;
  const margenNeto = ingresos12 > 0 ? (utilidad12/ingresos12)*100 : 0;

  // ── Solicitud más reciente
  const solicitudActiva = informes.find(i => i.estado !== "ANULADO" && i.montoSolicitado);

  // ── Capacidad financiera estimada
  const tipoCambio = balance?.tipoCambio || 36.5;
  const patrimonioUSD = (balance?.patrimonioNeto||0) / tipoCambio;
  const ingresoUSD    = ingresos12 / tipoCambio;
  const flujoUSD      = utilidad12 / tipoCambio;
  const deudaUSD      = (balance?.totalDeudas||0) / tipoCambio;
  const ratioDeuda = balance?.totalActivos > 0 ? ((balance?.totalPasivos||0)/(balance?.totalActivos||1))*100 : 0;
  const capacidad = ratioDeuda < 40 && margenNeto > 10 ? "FAVORABLE" : ratioDeuda < 70 ? "REVISAR" : "RIESGO";

  // ── Funciones wizard (CONSERVADAS)
  async function crearBorrador() {
    setEnviando(true); setError("");
    try {
      const docs = Object.entries(docsIncluidos).filter(([,v])=>v).map(([k])=>k);
      const r = await api("/informes-financieros", { method:"POST", body:{
        ...form,
        montoSolicitado: form.montoSolicitado ? parseFloat(form.montoSolicitado) : null,
        plazoMeses: form.plazoMeses ? parseInt(form.plazoMeses) : null,
        documentosIncluidos: docs,
      }});
      setInformeCreado(r);
      setPaso(3);
      api("/informes-financieros").then(setInformes).catch(()=>{});
    } catch (e) { setError(e.message); }
    finally { setEnviando(false); }
  }

  async function generarInforme() {
    if (!informeCreado) return;
    setGenerando(true); setError("");
    try {
      const r = await api(`/informes-financieros/${informeCreado.id}/generar`, { method:"POST", body:{} });
      setInformeGenerado(r);
      api("/informes-financieros").then(setInformes).catch(()=>{});
    } catch (e) { setError(e.message); }
    finally { setGenerando(false); }
  }

  const pasoValido = (p) => {
    if (p===0) return form.empresa && form.tipo && form.periodoDesde && form.periodoHasta;
    if (p===1) return Object.values(docsIncluidos).some(Boolean);
    return true;
  };

  // ── Estilos comunes
  const tabBtn = (key) => ({
    padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
    background: tab===key ? "rgba(34,197,94,0.15)" : "transparent",
    color: tab===key ? C.green : C.textSec,
    borderBottom: tab===key ? `2px solid ${C.green}` : "2px solid transparent",
    transition:"all .15s", whiteSpace:"nowrap",
  });
  const inputS = { background:"rgba(255,255,255,0.08)", border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.text, outline:"none", width:"100%", boxSizing:"border-box" };
  const labelS = { fontSize:11, color:C.textSec, fontWeight:600, display:"block", marginBottom:4 };

  return (
    <div style={{ color:C.text }}>
      {/* ── Error global ─────────────────────────────────────────────── */}
      {error && (
        <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.35)", color:C.red, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, display:"flex", justifyContent:"space-between" }}>
          {error}
          <button onClick={()=>setError("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.red }}>✕</button>
        </div>
      )}

      {/* ── Encabezado ───────────────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <div>
          <p style={{ fontSize:11, color:C.green, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 2px" }}>EXPEDIENTE BANCARIO</p>
          <h1 style={{ fontSize:26, fontWeight:900, color:C.text, margin:"0 0 4px", lineHeight:1.2 }}>Expediente Financiero Ganadero</h1>
          <p style={{ fontSize:13, color:C.textSec, margin:0 }}>Prepara y presenta la situación financiera de tu empresa ante instituciones financieras.</p>
        </div>
        <button onClick={()=>{ setTab("solicitud"); setPaso(0); setInformeCreado(null); setInformeGenerado(null); setForm(FORM_VACIO); }}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:C.greenDk, color:"#fff", border:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
          + Preparar Solicitud de Financiamiento
        </button>
      </div>

      {/* ── Navegación interna ───────────────────────────────────────── */}
      <div style={{ display:"flex", gap:4, marginBottom:20, overflowX:"auto", paddingBottom:2, borderBottom:`1px solid ${C.border}` }}>
        {[
          { key:"resumen",    label:"Resumen" },
          { key:"solicitud",  label:"Nueva Solicitud" },
          { key:"capacidad",  label:"Capacidad Financiera" },
          { key:"documentos", label:"Documentos" },
          { key:"expedientes",label:"Expedientes" },
        ].map(t => <button key={t.key} style={tabBtn(t.key)} onClick={()=>setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB: RESUMEN
      ════════════════════════════════════════════════════════════════ */}
      {tab === "resumen" && (
        <div>
          {/* Barra de preparación */}
          <div style={{ ...glass, marginBottom:16, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div style={{ flexShrink:0, width:56, height:56, borderRadius:"50%", background:"rgba(34,197,94,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>🏦</div>
            <div style={{ flex:1, minWidth:180 }}>
              <p style={{ fontSize:13, color:C.textSec, margin:"0 0 4px", fontWeight:600 }}>Preparación del expediente</p>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:32, fontWeight:900, color:C.green }}>{pctTotal}%</span>
                <div style={{ flex:1 }}><ProgressBar pct={pctTotal} /></div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(251,146,60,0.12)", border:"1px solid rgba(251,146,60,0.25)", borderRadius:8, padding:"8px 14px" }}>
              <span style={{ fontSize:18 }}>⚠️</span>
              <span style={{ fontSize:12, color:C.orange, fontWeight:700 }}>
                {pctDocumentacion < 100 ? "Faltan documentos" : "Expediente completo"}
              </span>
            </div>
          </div>

          {/* 4 tarjetas de completitud */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12, marginBottom:16 }}>
            {[
              { icon:"👤", title:"Perfil Bancario", pct:pctPerfil, color:C.green, items:["Datos del propietario/empresa","Información fiscal","Actividad económica","Antigüedad del negocio"] },
              { icon:"💰", title:"Capacidad Financiera", pct:pctCapacidad, color:C.blue, items:["Ingresos últimos 12 meses","Utilidad y rentabilidad","Flujo de caja","Capacidad de pago"] },
              { icon:"🏗️", title:"Respaldo Patrimonial", pct:pctPatrimonio, color:C.orange, items:["Valor del ganado","Fincas / terrenos","Activos fijos registrados","Caja y bancos"] },
              { icon:"📄", title:"Documentación", pct:pctDocumentacion, color:C.purple, items:["Identificación","RUC / Matrícula","Títulos de propiedad","Estados bancarios"] },
            ].map(card => (
              <div key={card.title} style={{ ...glass, padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:20 }}>{card.icon}</span>
                  <span style={{ fontWeight:700, fontSize:13, color:C.text }}>{card.title}</span>
                </div>
                <div style={{ marginBottom:10 }}>
                  {card.items.map(item => (
                    <div key={item} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                      <span style={{ color:card.color, fontSize:12 }}>✓</span>
                      <span style={{ fontSize:11, color:C.textSec }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:C.textSec }}>Completo</span>
                    <span style={{ fontSize:13, fontWeight:800, color:card.color }}>{card.pct}%</span>
                  </div>
                  <ProgressBar pct={card.pct} color={card.color} h={5} />
                </div>
              </div>
            ))}
          </div>

          {/* Fila: Patrimonio + Hato */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            {/* Patrimonio Productivo */}
            <div style={glass}>
              <p style={{ fontSize:11, fontWeight:700, color:C.orange, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 12px" }}>PATRIMONIO PRODUCTIVO</p>
              {loadingData ? <p style={{ color:C.textDim }}>Cargando...</p> : (
                <>
                  {[
                    { label:"Ganado", value:balance?.valorGanado, icon:"🐄" },
                    { label:"Activos fijos", value:balance?.activosFijosTotal, icon:"🏗️" },
                    { label:"Caja / Bancos", value:(balance?.caja||0)+(balance?.bancos||0), icon:"🏦" },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:12, color:C.textSec }}>{r.icon} {r.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{r.value ? fmtK(r.value) : "C$ 0"}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>ACTIVOS TOTALES</span>
                      <span style={{ fontSize:13, fontWeight:800, color:C.green }}>{fmt(balance?.totalActivos)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, color:C.red, fontWeight:600 }}>PASIVOS TOTALES</span>
                      <span style={{ fontSize:13, fontWeight:800, color:C.red }}>{fmt(balance?.totalPasivos)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", background:"rgba(34,197,94,0.10)", borderRadius:8, padding:"8px 10px", marginTop:6 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.green }}>PATRIMONIO NETO</span>
                      <span style={{ fontSize:16, fontWeight:900, color:C.green }}>{fmt(balance?.patrimonioNeto)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Inventario del Hato */}
            <div style={glass}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>INVENTARIO PRODUCTIVO (HATO)</p>
                <button onClick={()=>setTab("capacidad")} style={{ fontSize:11, color:C.blue, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"3px 8px", cursor:"pointer" }}>Ver detalle</button>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:10 }}>
                <span style={{ fontSize:32 }}>🐄</span>
                <div>
                  <div style={{ fontSize:28, fontWeight:900, color:C.text }}>{animales.length}</div>
                  <div style={{ fontSize:11, color:C.textSec }}>Animales registrados</div>
                </div>
                <div style={{ marginLeft:"auto", textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.textSec }}>Valor estimado del hato</div>
                  <div style={{ fontSize:16, fontWeight:800, color:C.green }}>{fmt(valorHato)}</div>
                </div>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {Object.entries(categorias).slice(0,6).map(([cat, d]) => (
                  <div key={cat} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", textAlign:"center", minWidth:60 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{d.count}</div>
                    <div style={{ fontSize:10, color:C.textSec }}>{cat}s</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:10, color:C.textDim, margin:"8px 0 0" }}>* Valor estimado a C$ {precioLibraDefault}/lb. No representa avalúo oficial.</p>
            </div>
          </div>

          {/* Histórico financiero */}
          <div style={{ ...glass, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
              <p style={{ fontSize:11, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>HISTÓRICO FINANCIERO</p>
              <div style={{ display:"flex", gap:4 }}>
                {["12","24","36"].map(m => (
                  <button key={m} onClick={()=>setPeriodoHistorico(m)}
                    style={{ padding:"4px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                      background: periodoHistorico===m ? C.blueDk : "rgba(255,255,255,0.08)",
                      color: periodoHistorico===m ? "#fff" : C.textSec }}>
                    {m} meses
                  </button>
                ))}
              </div>
            </div>
            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:14 }}>
              {[
                { label:"Ingresos Totales", value:fmt(ingresos12), delta:null, color:C.green },
                { label:"Gastos Totales", value:fmt(gastos12), delta:null, color:C.red },
                { label:"Utilidad Neta", value:fmt(utilidad12), delta:null, color:C.blue },
                { label:"Margen Neto", value:fmtPct(margenNeto), delta:null, color:utilidad12>0?C.green:C.red },
              ].map(k => (
                <div key={k.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:11, color:C.textSec, marginBottom:4 }}>{k.label}</div>
                  <div style={{ fontSize:17, fontWeight:800, color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            {/* Leyenda */}
            <div style={{ display:"flex", gap:14, marginBottom:6, fontSize:11 }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:12, height:12, borderRadius:2, background:C.green, display:"inline-block" }} /> Ingresos</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:12, height:12, borderRadius:2, background:C.red, display:"inline-block" }} /> Gastos</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:12, height:8, borderRadius:2, background:C.blue, display:"inline-block" }} /> Utilidad Neta</span>
            </div>
            <MiniChart meses={mesesHistorico} />
          </div>

          {/* Fila: Solicitud activa + KPIs ganaderos */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            {/* Solicitud activa */}
            <div style={glass}>
              <p style={{ fontSize:11, fontWeight:700, color:C.purple, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 12px" }}>SOLICITUD DE FINANCIAMIENTO</p>
              {solicitudActiva ? (
                <>
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:11, color:C.textSec, margin:"0 0 2px" }}>Destino del financiamiento</p>
                    <p style={{ fontSize:13, color:C.green, fontWeight:700, margin:0 }}>{solicitudActiva.destinoCredito || "No especificado"}</p>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                    <div><p style={{ fontSize:11, color:C.textSec, margin:"0 0 2px" }}>Monto solicitado</p><p style={{ fontSize:14, fontWeight:800, color:C.text, margin:0 }}>{solicitudActiva.montoSolicitado ? fmt(solicitudActiva.montoSolicitado, solicitudActiva.monedaSolicitud||"NIO") : "—"}</p></div>
                    <div><p style={{ fontSize:11, color:C.textSec, margin:"0 0 2px" }}>Plazo deseado</p><p style={{ fontSize:14, fontWeight:800, color:C.text, margin:0 }}>{solicitudActiva.plazoMeses ? `${solicitudActiva.plazoMeses} meses` : "—"}</p></div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setTab("solicitud")} style={{ flex:1, padding:"8px 0", background:"rgba(192,132,252,0.15)", border:`1px solid ${C.purple}`, borderRadius:8, color:C.purple, fontWeight:700, fontSize:12, cursor:"pointer" }}>Editar solicitud</button>
                    {solicitudActiva.estado==="GENERADO" && (
                      <button onClick={()=>generarPDF(solicitudActiva, balance)} style={{ padding:"8px 14px", background:C.blueDk, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer" }}>⬇ PDF</button>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:"center", padding:"16px 0" }}>
                  <p style={{ color:C.textDim, fontSize:13 }}>No hay solicitud activa</p>
                  <button onClick={()=>{ setTab("solicitud"); setPaso(0); }} style={{ marginTop:8, padding:"8px 18px", background:C.greenDk, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Crear solicitud</button>
                </div>
              )}
            </div>

            {/* KPIs ganaderos */}
            <div style={glass}>
              <p style={{ fontSize:11, fontWeight:700, color:C.orange, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 12px" }}>INDICADORES GANADEROS</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { icon:"🐄", label:"Animales en hato activo", value:`${animales.length} animales` },
                  { icon:"⚖️", label:"Peso promedio del hato", value: animales.filter(a=>a.pesoActual).length > 0 ? `${Math.round(animales.reduce((s,a)=>s+(a.pesoActual||0),0)/animales.filter(a=>a.pesoActual).length)} lb` : "—" },
                  { icon:"💵", label:"Ingresos por ventas (período)", value:fmt(resultados?.ingresoVentas) },
                  { icon:"📈", label:"Margen neto del negocio", value:fmtPct(margenNeto) },
                ].map(k => (
                  <div key={k.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.textSec }}>{k.icon} {k.label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{k.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expedientes generados recientes */}
          {informes.length > 0 && (
            <div style={glass}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.textSec, textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>EXPEDIENTES GENERADOS</p>
                <button onClick={()=>setTab("expedientes")} style={{ fontSize:12, color:C.blue, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"3px 10px", cursor:"pointer" }}>Ver todos los expedientes</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {informes.slice(0,3).map(inf => (
                  <div key={inf.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 14px", gap:10, flexWrap:"wrap" }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                        <span style={{ fontWeight:800, fontFamily:"monospace", color:C.text, fontSize:13 }}>{inf.codigo}</span>
                        <EstadoBadge estado={inf.estado} />
                      </div>
                      <div style={{ fontSize:11, color:C.textDim }}>{inf.institucion ? `→ ${inf.institucion}` : inf.tipo?.replace(/_/g," ")} {inf.montoSolicitado ? `· US$ ${Number(inf.montoSolicitado/tipoCambio).toLocaleString("en-US",{maximumFractionDigits:0})}` : ""}</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {inf.estado==="GENERADO" && <button onClick={()=>generarPDF(inf,balance)} style={{ padding:"5px 12px", background:C.blueDk, color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:11, cursor:"pointer" }}>⬇ PDF</button>}
                      {inf.token && <button onClick={()=>window.open(`/verify/report/${inf.token}`,"_blank")} style={{ padding:"5px 12px", background:"rgba(255,255,255,0.08)", border:`1px solid ${C.border}`, borderRadius:6, fontWeight:600, fontSize:11, cursor:"pointer", color:C.textSec }}>Verificar</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: NUEVA SOLICITUD (wizard conservado + mejorado)
      ════════════════════════════════════════════════════════════════ */}
      {tab === "solicitud" && (
        <div>
          {!dbListo && (
            <div style={{ background:"rgba(234,179,8,0.12)", border:"1px solid rgba(234,179,8,0.35)", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#fde047" }}>
              ⏳ <strong>Base de datos actualizando…</strong> El servidor está aplicando las tablas nuevas (1-3 min). Puedes llenar el formulario mientras esperas.
            </div>
          )}
          {/* Balance rápido */}
          {balance && (
            <div style={{ ...glass, marginBottom:16, display:"flex", gap:20, flexWrap:"wrap" }}>
              {[
                { label:"Total activos", value:fmt(balance.totalActivos), color:C.green },
                { label:"Patrimonio neto", value:fmt(balance.patrimonioNeto), color:C.blue },
                { label:"Deudas activas", value:fmt(balance.totalDeudas), color:C.red },
              ].map(k=>(
                <div key={k.label}>
                  <div style={{ fontSize:11, color:C.textSec }}>{k.label}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Stepper */}
          <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
            {["Institución y tipo","Documentos","Parámetros","Generar"].map((p,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", flex:i<3?1:"none" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <button onClick={()=>i<paso&&setPaso(i)}
                    style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, border:"none", cursor:"pointer",
                      background: i<paso ? C.greenDk : paso===i ? C.blueDk : "rgba(255,255,255,0.12)",
                      color: (i<=paso) ? "#fff" : C.textDim }}>
                    {i<paso?"✓":i+1}
                  </button>
                  <span style={{ fontSize:10, color:paso===i?C.blue:C.textDim, fontWeight:paso===i?700:400, whiteSpace:"nowrap" }}>{p}</span>
                </div>
                {i<3 && <div style={{ flex:1, height:2, background:i<paso?C.greenDk:`rgba(255,255,255,0.10)`, margin:"0 4px 18px" }} />}
              </div>
            ))}
          </div>

          {/* Paso 0 */}
          {paso===0 && (
            <div style={glass}>
              <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:16 }}>Institución y tipo de financiamiento</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelS}>Empresa / Razón social *</label>
                  <input style={inputS} value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})} />
                </div>
                <div>
                  <label style={labelS}>Institución destino</label>
                  <select style={inputS} value={form.institucion} onChange={e=>setForm({...form,institucion:e.target.value})}>
                    <option value="">Seleccionar institución...</option>
                    {INSTITUCIONES.map(i=><option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelS}>Tipo de informe</label>
                  <select style={inputS} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                    {TIPOS.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelS}>Destino del crédito</label>
                  <select style={inputS} value={form.destinoCredito} onChange={e=>setForm({...form,destinoCredito:e.target.value})}>
                    <option value="">Seleccionar destino...</option>
                    {TIPOS_FINANC.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelS}>Monto solicitado</label>
                  <input style={inputS} type="number" placeholder="0.00" value={form.montoSolicitado} onChange={e=>setForm({...form,montoSolicitado:e.target.value})} />
                </div>
                <div>
                  <label style={labelS}>Aporte propio</label>
                  <input style={inputS} type="number" placeholder="0.00" value={form.aportePropio} onChange={e=>setForm({...form,aportePropio:e.target.value})} />
                </div>
                {form.montoSolicitado && form.aportePropio && (
                  <div style={{ gridColumn:"1/-1", background:"rgba(34,197,94,0.08)", border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:C.textSec, fontSize:13 }}>Inversión total</span>
                    <span style={{ fontWeight:800, color:C.green, fontSize:14 }}>{fmt(Number(form.montoSolicitado)+Number(form.aportePropio))}</span>
                  </div>
                )}
                <div>
                  <label style={labelS}>Plazo (meses)</label>
                  <input style={inputS} type="number" placeholder="12" value={form.plazoMeses} onChange={e=>setForm({...form,plazoMeses:e.target.value})} />
                </div>
                <div>
                  <label style={labelS}>Moneda</label>
                  <select style={inputS} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}>
                    <option value="NIO">NIO — Córdoba</option>
                    <option value="USD">USD — Dólar</option>
                  </select>
                </div>
                <div>
                  <label style={labelS}>Período desde *</label>
                  <input style={inputS} type="date" value={form.periodoDesde} onChange={e=>setForm({...form,periodoDesde:e.target.value})} />
                </div>
                <div>
                  <label style={labelS}>Período hasta *</label>
                  <input style={inputS} type="date" value={form.periodoHasta} onChange={e=>setForm({...form,periodoHasta:e.target.value})} />
                </div>
              </div>
              <div style={{ marginTop:16, textAlign:"right" }}>
                <button disabled={!pasoValido(0)} onClick={()=>setPaso(1)} style={{ padding:"10px 24px", background:pasoValido(0)?C.blueDk:"rgba(255,255,255,0.10)", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:pasoValido(0)?"pointer":"not-allowed", fontSize:13 }}>Siguiente →</button>
              </div>
            </div>
          )}

          {/* Paso 1: Documentos */}
          {paso===1 && (
            <div style={glass}>
              <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:16 }}>Selecciona los documentos a incluir</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {DOCS_SUGERIDOS.map(doc=>(
                  <label key={doc} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 12px", background:docsIncluidos[doc]?"rgba(34,197,94,0.08)":"rgba(255,255,255,0.04)", borderRadius:8, border:`1px solid ${docsIncluidos[doc]?C.green:C.border}` }}>
                    <input type="checkbox" checked={!!docsIncluidos[doc]} onChange={e=>setDocsIncluidos({...docsIncluidos,[doc]:e.target.checked})} style={{ width:16, height:16, accentColor:C.green }} />
                    <span style={{ fontSize:13, color:docsIncluidos[doc]?C.text:C.textSec, fontWeight:docsIncluidos[doc]?600:400 }}>{doc}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop:16, display:"flex", justifyContent:"space-between" }}>
                <button onClick={()=>setPaso(0)} style={{ padding:"10px 20px", background:"rgba(255,255,255,0.08)", border:`1px solid ${C.border}`, borderRadius:8, fontWeight:600, cursor:"pointer", color:C.text, fontSize:13 }}>← Atrás</button>
                <button disabled={!pasoValido(1)} onClick={()=>setPaso(2)} style={{ padding:"10px 24px", background:C.blueDk, color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 }}>Siguiente →</button>
              </div>
            </div>
          )}

          {/* Paso 2: Parámetros */}
          {paso===2 && (
            <div style={glass}>
              <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:16 }}>Parámetros adicionales</div>
              <div style={{ marginBottom:12 }}>
                <label style={labelS}>Notas o instrucciones especiales</label>
                <textarea style={{ ...inputS, resize:"vertical" }} rows={3} placeholder="Indicaciones para el receptor, contexto adicional..." value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} />
              </div>
              <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:12 }}>
                <div style={{ fontWeight:700, marginBottom:8, color:C.text }}>Resumen del expediente:</div>
                {[
                  ["Empresa", form.empresa],
                  ["Institución", form.institucion],
                  ["Tipo", form.tipo.replace(/_/g," ")],
                  ["Destino", form.destinoCredito],
                  ["Monto", form.montoSolicitado ? fmt(form.montoSolicitado) : "—"],
                  ["Período", `${form.periodoDesde} al ${form.periodoHasta}`],
                  ["Documentos", `${Object.values(docsIncluidos).filter(Boolean).length} seleccionados`],
                ].filter(([,v])=>v).map(([k,v])=>(
                  <div key={k} style={{ color:C.textSec }}>{k}: <strong style={{ color:C.text }}>{v}</strong></div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <button onClick={()=>setPaso(1)} style={{ padding:"10px 20px", background:"rgba(255,255,255,0.08)", border:`1px solid ${C.border}`, borderRadius:8, fontWeight:600, cursor:"pointer", color:C.text, fontSize:13 }}>← Atrás</button>
                <button disabled={enviando} onClick={crearBorrador} style={{ padding:"10px 28px", background:C.greenDk, color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13, opacity:enviando?0.6:1 }}>
                  {enviando?"Creando...":"Crear borrador →"}
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Generar */}
          {paso===3 && informeCreado && (
            <div>
              <div style={{ ...glass, borderColor:"rgba(34,197,94,0.40)", background:"rgba(34,197,94,0.08)", marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.green, marginBottom:8 }}>✅ Borrador creado — {informeCreado.codigo}</div>
                <div style={{ fontSize:12, color:C.textSec, marginBottom:16 }}>El expediente fue registrado. Genera el PDF con código de verificación para presentarlo a la institución.</div>
                {!informeGenerado ? (
                  <button disabled={generando} onClick={generarInforme}
                    style={{ padding:"12px 28px", background:C.blueDk, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer", opacity:generando?0.6:1 }}>
                    {generando?"Generando expediente...":"🏦 Generar expediente bancario"}
                  </button>
                ) : (
                  <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:10, padding:"16px 20px" }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:10 }}>Expediente generado</div>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:12, color:C.textSec, marginBottom:12 }}>
                      <div>Código: <strong style={{ fontFamily:"monospace", color:C.text }}>{informeGenerado.codigo || informeCreado.codigo}</strong></div>
                      <div>Estado: <strong style={{ color:C.green }}>GENERADO</strong></div>
                    </div>
                    {informeGenerado.informe?.token && (
                      <div style={{ background:"rgba(34,197,94,0.08)", border:`1px solid rgba(34,197,94,0.25)`, borderRadius:8, padding:"12px 16px", marginBottom:12 }}>
                        <div style={{ fontWeight:700, fontSize:12, color:C.green, marginBottom:4 }}>Código de verificación</div>
                        <div style={{ fontFamily:"monospace", fontSize:11, color:C.textSec, wordBreak:"break-all", marginBottom:6 }}>{informeGenerado.informe.token}</div>
                        <div style={{ fontSize:11, color:C.textDim }}>Verificar en: ganaderosg.app/verify/report/{informeGenerado.informe.token}</div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <button onClick={()=>generarPDF({...informeCreado,...(informeGenerado.informe||{})}, balance)}
                        style={{ padding:"10px 20px", background:C.blueDk, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                        ⬇ Descargar PDF
                      </button>
                      {informeGenerado.informe?.token && (
                        <button onClick={()=>window.open(`/verify/report/${informeGenerado.informe.token}`,"_blank")}
                          style={{ padding:"10px 16px", background:"rgba(255,255,255,0.08)", border:`1px solid ${C.border}`, borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:C.textSec }}>
                          🔗 Ver verificación
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={()=>{ setTab("capacidad"); }} style={{ padding:"10px 18px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", color:C.textSec }}>
                Ver análisis de capacidad →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: CAPACIDAD FINANCIERA
      ════════════════════════════════════════════════════════════════ */}
      {tab === "capacidad" && (
        <div>
          <div style={{ ...glass, marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 16px" }}>ANÁLISIS DE CAPACIDAD FINANCIERA</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginBottom:16 }}>
              {[
                { label:"Patrimonio registrado", value:fmt(patrimonioUSD,"USD"), sub:"(estimado)" },
                { label:"Ingresos últimos 12 meses", value:fmt(ingresoUSD,"USD"), sub:"(estimado)" },
                { label:"Flujo neto operativo", value:fmt(flujoUSD,"USD"), sub:"(estimado)" },
                { label:"Deudas actuales", value:fmt(deudaUSD,"USD"), sub:"(estimado)" },
              ].map(k=>(
                <div key={k.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:11, color:C.textSec, marginBottom:4 }}>{k.label}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:C.text }}>{k.value}</div>
                  <div style={{ fontSize:10, color:C.textDim }}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[
                { label:"Ratio de endeudamiento", value:fmtPct(ratioDeuda), ok: ratioDeuda<50, desc:"Deuda como % de activos" },
                { label:"Margen neto", value:fmtPct(margenNeto), ok: margenNeto>10, desc:"Utilidad / Ingresos" },
                { label:"Deuda/Patrimonio", value: balance?.patrimonioNeto > 0 ? ((balance?.totalPasivos||0)/(balance?.patrimonioNeto||1)).toFixed(2)+"x" : "—", ok: ((balance?.totalPasivos||0)/(balance?.patrimonioNeto||1)) < 1, desc:"Pasivos / Patrimonio neto" },
                { label:"Flujo disponible", value:fmt(flujoUSD,"USD"), ok:flujoUSD>0, desc:"Utilidad neta estimada en USD" },
              ].map(k=>(
                <div key={k.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ fontSize:11, color:C.textSec }}>{k.label}</div>
                    <span style={{ fontSize:16 }}>{k.ok ? "✅" : "⚠️"}</span>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color:k.ok?C.green:C.orange, margin:"4px 0 2px" }}>{k.value}</div>
                  <div style={{ fontSize:10, color:C.textDim }}>{k.desc}</div>
                </div>
              ))}
            </div>

            {/* Resultado visual */}
            <div style={{ background: capacidad==="FAVORABLE" ? "rgba(34,197,94,0.10)" : capacidad==="REVISAR" ? "rgba(251,146,60,0.10)" : "rgba(248,113,113,0.10)", border:`1px solid ${capacidad==="FAVORABLE"?C.green:capacidad==="REVISAR"?C.orange:C.red}30`, borderRadius:12, padding:"16px 20px" }}>
              <p style={{ fontSize:12, color:C.textSec, margin:"0 0 6px" }}>CAPACIDAD FINANCIERA ESTIMADA</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:28 }}>{capacidad==="FAVORABLE"?"🟢":capacidad==="REVISAR"?"🟡":"🔴"}</span>
                <span style={{ fontSize:24, fontWeight:900, color: capacidad==="FAVORABLE"?C.green:capacidad==="REVISAR"?C.orange:C.red }}>
                  {capacidad==="FAVORABLE"?"FAVORABLE":capacidad==="REVISAR"?"REVISAR":"RIESGO ELEVADO"}
                </span>
              </div>
              <p style={{ fontSize:11, color:C.textDim, margin:"10px 0 0" }}>
                ⚠️ Estimación interna basada en la información registrada en el sistema. La aprobación, condiciones, tasas, garantías y monto final corresponden exclusivamente a la institución financiera.
              </p>
            </div>
          </div>

          {/* Detalle del hato — inventario completo */}
          {(() => {
            // ── Misma lógica de categorización que el resto del sistema
            const catKey = (a) => {
              if (a.categoria) return a.categoria; // CRIA, TERNERO, TERNERA, TORO, VACA, SEMENTAL
              return a.sexo === "MACHO" ? "TERNERO" : "TERNERA";
            };
            const vacas    = animales.filter(a => catKey(a) === "VACA");
            const terneras = animales.filter(a => catKey(a) === "TERNERA");
            const terneros = animales.filter(a => catKey(a) === "TERNERO");
            const toros    = animales.filter(a => ["TORO","SEMENTAL"].includes(catKey(a)));
            const crias    = animales.filter(a => catKey(a) === "CRIA");

            // Estados reproductivos de vacas
            const ER = { PREÑADA:"Preñada", PARIDA:"Parida", LACTANCIA:"Lactancia", SECA:"Seca", VACIA:"Vacía", null:"Sin estado" };
            const erCols = { PREÑADA:"#a78bfa", PARIDA:"#60a5fa", LACTANCIA:"#34d399", SECA:"#fb923c", VACIA:"#94a3b8" };
            const vacasPorEstado = {};
            vacas.forEach(v => {
              const e = v.estadoReproductivo || "SIN_ESTADO";
              if (!vacasPorEstado[e]) vacasPorEstado[e] = [];
              vacasPorEstado[e].push(v);
            });
            const ordenER = ["PREÑADA","PARIDA","LACTANCIA","SECA","VACIA","SIN_ESTADO"];

            const valorAnimal = (a) => a.pesoActual ? a.pesoActual * precioLibraDefault : (a.costoCompra || 0);
            const pesoTotal   = animales.reduce((s,a) => s+(a.pesoActual||0), 0);
            const valorTotal  = animales.reduce((s,a) => s+valorAnimal(a), 0);

            const seccionColor = { vacas:C.purple, terneras:C.orange, terneros:C.blue, toros:"#f43f5e", crias:C.green };
            const rowStyle = { borderBottom:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"1fr 60px 90px 110px", alignItems:"center", padding:"8px 12px", gap:8 };
            const subRowStyle = { ...rowStyle, paddingLeft:28, background:"rgba(255,255,255,0.02)" };

            function GrupoRow({ emoji, label, lista, color, children }) {
              const p = lista.reduce((s,a)=>s+(a.pesoActual||0),0);
              const v = lista.reduce((s,a)=>s+valorAnimal(a),0);
              return (
                <div>
                  <div style={{ ...rowStyle, background:`${color}10` }}>
                    <span style={{ fontWeight:800, color, fontSize:13 }}>{emoji} {label}</span>
                    <span style={{ fontWeight:800, color, textAlign:"center" }}>{lista.length}</span>
                    <span style={{ color:C.textSec, textAlign:"right", fontSize:11 }}>{p>0?`${p.toFixed(0)} lb`:"—"}</span>
                    <span style={{ fontWeight:800, color, textAlign:"right" }}>{v>0?fmt(v):"—"}</span>
                  </div>
                  {children}
                </div>
              );
            }

            return (
              <div style={{ ...glass }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>INVENTARIO DETALLADO DEL HATO</p>
                  <div style={{ display:"flex", gap:16, fontSize:12 }}>
                    <span style={{ color:C.textSec }}>{animales.length} animales</span>
                    <span style={{ color:C.green, fontWeight:700 }}>{fmt(valorTotal)}</span>
                  </div>
                </div>

                {/* Cabecera columnas */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 90px 110px", padding:"6px 12px", gap:8, borderBottom:`1px solid ${C.border}` }}>
                  {["CATEGORÍA / ESTADO","CANT.","PESO TOTAL","VALOR EST."].map(h=>(
                    <span key={h} style={{ fontSize:10, color:C.textDim, fontWeight:700, textAlign: h==="CATEGORÍA / ESTADO"?"left":"right" }}>{h}</span>
                  ))}
                </div>

                {/* ── VACAS con desglose reproductivo */}
                {vacas.length > 0 && (
                  <GrupoRow emoji="🐄" label="Vacas" lista={vacas} color={C.purple}>
                    {ordenER.filter(e => vacasPorEstado[e]?.length > 0).map(e => {
                      const lista = vacasPorEstado[e];
                      const color = erCols[e] || C.textDim;
                      const label = e==="SIN_ESTADO" ? "Sin estado registrado" : ER[e] || e;
                      const p = lista.reduce((s,a)=>s+(a.pesoActual||0),0);
                      const v = lista.reduce((s,a)=>s+valorAnimal(a),0);
                      return (
                        <div key={e} style={subRowStyle}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ width:8, height:8, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0 }} />
                            <span style={{ fontSize:12, color:C.textSec }}>{label}</span>
                          </div>
                          <span style={{ textAlign:"center", color:C.text, fontWeight:700 }}>{lista.length}</span>
                          <span style={{ textAlign:"right", color:C.textDim, fontSize:11 }}>{p>0?`${p.toFixed(0)} lb`:"—"}</span>
                          <span style={{ textAlign:"right", color, fontWeight:600, fontSize:11 }}>{v>0?fmt(v):"—"}</span>
                        </div>
                      );
                    })}
                  </GrupoRow>
                )}

                {/* ── TERNERAS */}
                {terneras.length > 0 && (
                  <GrupoRow emoji="🐮" label="Terneras" lista={terneras} color={C.orange} />
                )}

                {/* ── TERNEROS */}
                {terneros.length > 0 && (
                  <GrupoRow emoji="🐂" label="Terneros" lista={terneros} color={C.blue} />
                )}

                {/* ── TOROS / SEMENTALES */}
                {toros.length > 0 && (
                  <GrupoRow emoji="🐃" label="Toros / Sementales" lista={toros} color="#f43f5e" />
                )}

                {/* ── CRÍAS */}
                {crias.length > 0 && (
                  <GrupoRow emoji="🐣" label="Crías" lista={crias} color={C.green} />
                )}

                {/* ── TOTAL */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 90px 110px", padding:"12px 12px", gap:8, background:"rgba(34,197,94,0.10)", borderTop:`2px solid ${C.green}40`, marginTop:2 }}>
                  <span style={{ fontWeight:900, color:C.green, fontSize:14 }}>TOTAL HATO ACTIVO</span>
                  <span style={{ fontWeight:900, color:C.green, textAlign:"center", fontSize:14 }}>{animales.length}</span>
                  <span style={{ color:C.green, textAlign:"right", fontWeight:700 }}>{pesoTotal>0?`${pesoTotal.toFixed(0)} lb`:"—"}</span>
                  <span style={{ fontWeight:900, color:C.green, textAlign:"right", fontSize:14 }}>{fmt(valorTotal)}</span>
                </div>

                {/* Leyenda estados reproductivos */}
                {vacas.length > 0 && (
                  <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}`, display:"flex", flexWrap:"wrap", gap:10 }}>
                    {Object.entries(erCols).map(([e, color])=>(
                      <span key={e} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textSec }}>
                        <span style={{ width:8, height:8, borderRadius:"50%", background:color, display:"inline-block" }} />
                        {ER[e]}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize:10, color:C.textDim, margin:"8px 0 0" }}>* Valor estimado a C$ {precioLibraDefault}/lb sobre peso registrado. No representa avalúo oficial.</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: DOCUMENTOS
      ════════════════════════════════════════════════════════════════ */}
      {tab === "documentos" && (
        <TabDocumentos inputS={inputS} labelS={labelS} C={C} glass={glass} ProgressBar={ProgressBar}
          balance={balance} resultados={resultados} flujo={flujo} indicadores={indicadores} animalesCount={animales.length} />
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: EXPEDIENTES
      ════════════════════════════════════════════════════════════════ */}
      {tab === "expedientes" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.textSec, textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>TODOS LOS EXPEDIENTES GENERADOS</p>
            <button onClick={()=>{ setTab("solicitud"); setPaso(0); setInformeCreado(null); setInformeGenerado(null); setForm(FORM_VACIO); }}
              style={{ padding:"8px 18px", background:C.greenDk, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
              + Nuevo expediente
            </button>
          </div>
          {loadingData ? (
            <div style={{ ...glass, textAlign:"center", color:C.textDim, padding:40 }}>Cargando expedientes...</div>
          ) : informes.length === 0 ? (
            <div style={{ ...glass, textAlign:"center", padding:48 }}>
              <div style={{ fontSize:48, marginBottom:10 }}>📋</div>
              <div style={{ fontWeight:700, color:C.textSec }}>No hay expedientes generados</div>
              <div style={{ fontSize:13, color:C.textDim, marginTop:4 }}>Crea tu primer expediente bancario para presentarlo ante una institución financiera.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {informes.map(inf=>(
                <div key={inf.id} style={{ ...glass, padding:"14px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:900, fontFamily:"monospace", color:C.text, fontSize:15 }}>{inf.codigo}</span>
                        <EstadoBadge estado={inf.estado} />
                      </div>
                      <div style={{ fontSize:12, color:C.textSec, marginBottom:2 }}>
                        {inf.tipo?.replace(/_/g," ")}
                        {inf.empresa ? ` · ${inf.empresa}` : ""}
                        {inf.institucion ? ` → ${inf.institucion}` : ""}
                      </div>
                      <div style={{ display:"flex", gap:12, fontSize:12, color:C.textDim, flexWrap:"wrap" }}>
                        {inf.montoSolicitado && <span>💰 {fmt(inf.montoSolicitado)}</span>}
                        {inf.plazoMeses && <span>📅 {inf.plazoMeses} meses</span>}
                        {inf.periodoDesde && <span>📆 {new Date(inf.periodoDesde).toLocaleDateString("es-NI")} — {inf.periodoHasta ? new Date(inf.periodoHasta).toLocaleDateString("es-NI") : ""}</span>}
                        {inf.createdAt && <span>Creado: {new Date(inf.createdAt).toLocaleDateString("es-NI")}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {inf.estado==="GENERADO" && (
                        <button onClick={()=>generarPDF(inf,balance)}
                          style={{ padding:"7px 14px", background:C.blueDk, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                          ⬇ Descargar PDF
                        </button>
                      )}
                      {inf.token && (
                        <button onClick={()=>window.open(`/verify/report/${inf.token}`,"_blank")}
                          style={{ padding:"7px 14px", background:"rgba(255,255,255,0.08)", border:`1px solid ${C.border}`, borderRadius:8, fontWeight:600, fontSize:12, cursor:"pointer", color:C.textSec }}>
                          🔗 Verificar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
