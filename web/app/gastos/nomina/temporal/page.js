"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const gc = "#1a4d2e"; const lc = "#e8f5e9";
const fmt  = (n) => Number(n||0).toLocaleString("es-NI", { minimumFractionDigits:2, maximumFractionDigits:2 });
const fmtU = (n) => Number(n||0).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });

const FORMAS = [
  { value:"jornal",   label:"Por día / jornal",  unidad:"días" },
  { value:"hora",     label:"Por hora",           unidad:"horas" },
  { value:"semana",   label:"Por semana",         unidad:"semanas" },
  { value:"mes",      label:"Por mes",            unidad:"meses" },
  { value:"proyecto", label:"Por proyecto",       unidad:"proyecto" },
];
const METODOS  = ["Efectivo","Transferencia bancaria","Cheque","Pago móvil","Otro"];
const MONEDAS  = [{ v:"NIO", l:"C$ — Córdoba" },{ v:"USD", l:"$ — Dólar" }];

const VACIO = {
  responsableId:"", responsableNombre:"",
  trabajadorNombre:"", trabajadorCedula:"",
  formaContratacion:"jornal",
  trabajoRealizado:"", lugar:"",
  periodoDe: new Date().toISOString().slice(0,10),
  periodoA:  new Date().toISOString().slice(0,10),
  cantidad:"1", tarifaUnitaria:"",
  bonificacion:"", deducciones:"",
  metodoPago:"Efectivo", moneda:"NIO",
  fechaPago: new Date().toISOString().slice(0,10),
  notas:"",
};

function iniciales(n){ return (n||"?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase(); }

function numToWords(n) {
  n = Math.round(n||0);
  if(!n) return "CERO CÓRDOBAS NETOS";
  const ones=["","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE","DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE"];
  const tens=["","DIEZ","VEINTE","TREINTA","CUARENTA","CINCUENTA","SESENTA","SETENTA","OCHENTA","NOVENTA"];
  const hundreds=["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS","SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
  function t2(n){if(n<20)return ones[n];const d=Math.floor(n/10),u=n%10;return tens[d]+(u?" Y "+ones[u]:"");}
  function t3(n){if(n===100)return"CIEN";const c=Math.floor(n/100),r=n%100;return(c?hundreds[c]+(r?" ":""):""+(r?t2(r):""));}
  let r="";
  if(n>=1000){const m=Math.floor(n/1000);r+=(m===1?"MIL":t3(m)+" MIL");n=n%1000;if(n)r+=" ";}
  if(n>0)r+=t3(n);
  return r+" CÓRDOBAS NETOS";
}

// Formatea período: "21–23 de julio de 2026"
function fmtPeriodo(desde, hasta) {
  if (!desde) return "—";
  const d = new Date(desde + "T12:00:00");
  const h = hasta ? new Date(hasta + "T12:00:00") : null;
  const mes = d.toLocaleDateString("es-NI",{month:"long"});
  const año = d.getFullYear();
  if (!h || desde === hasta) return `${d.getDate()} de ${mes} de ${año}`;
  if (d.getMonth()===h.getMonth() && d.getFullYear()===h.getFullYear())
    return `${d.getDate()}–${h.getDate()} de ${mes} de ${año}`;
  return `${d.toLocaleDateString("es-NI",{day:"2-digit",month:"short"})} – ${h.toLocaleDateString("es-NI",{day:"2-digit",month:"short",year:"numeric"})}`;
}

export default function PagoTemporalPage() {
  const router = useRouter();
  const [form, setForm]         = useState(VACIO);
  const [usuarios, setUsuarios] = useState([]);
  const [finca, setFinca]       = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError]       = useState("");
  const [exito, setExito]       = useState(null);
  const [busqResp, setBusqResp] = useState("");
  const [showResp, setShowResp] = useState(false);
  const [tasaCambio, setTasaCambio] = useState(36.50);

  useEffect(() => {
    Promise.all([
      api("/gastos/usuarios-finca").catch(()=>[]),
      api("/fincas/mi-finca").catch(()=>null),
      api("/usuarios/perfil").catch(()=>null),
    ]).then(([u,f,me]) => {
      setUsuarios(Array.isArray(u)?u:[]);
      setFinca(f); setUsuarioActual(me);
    });
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(r=>r.json()).then(d=>{ if(d?.rates?.NIO) setTasaCambio(Number(d.rates.NIO.toFixed(2))); })
      .catch(()=>{});
  }, []);

  const set = useCallback((k,v) => setForm(f=>({...f,[k]:v})), []);

  const forma     = FORMAS.find(f=>f.value===form.formaContratacion) || FORMAS[0];
  const subtotal  = (Number(form.cantidad)||0) * (Number(form.tarifaUnitaria)||0);
  const bonif     = Number(form.bonificacion)||0;
  const deduc     = Number(form.deducciones)||0;
  const totalNeto = subtotal + bonif - deduc;

  const respFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqResp.toLowerCase())
  );

  // ─── PDF ────────────────────────────────────────────────────────────────
  async function generarPDF(gatoId, datos) {
    const { default: jsPDF }     = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc   = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" });
    const V     = "#1a4d2e"; const LV = "#e8f5e9";
    const W     = doc.internal.pageSize.getWidth();
    const H     = doc.internal.pageSize.getHeight();
    const num   = `CPT-${new Date().getFullYear()}-${(gatoId||"").slice(-6).toUpperCase().padStart(6,"0")}`;
    const fechaLarga = new Date(datos.fechaPago+"T12:00:00")
      .toLocaleDateString("es-NI",{day:"2-digit",month:"long",year:"numeric"});

    // ── ENCABEZADO ──────────────────────────────────────────────────────
    // Franja verde superior
    doc.setFillColor(V); doc.rect(0,0,W,42,"F");

    // Área izquierda: logo + nombre finca
    doc.setFillColor(LV); doc.roundedRect(10,8,50,28,3,3,"F");
    // Vaca SVG simplificada como texto
    doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(V);
    doc.text("🐄",35,24,{align:"center"});
    doc.setFontSize(8); doc.setTextColor(V);
    doc.text("HENRIQUEZ CATTLE", 35, 30, {align:"center"});
    doc.text("MANAGEMENT", 35, 34, {align:"center"});

    doc.setTextColor(255,255,255);
    doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.text(finca?.nombre || "—", 66, 12);
    doc.text(finca?.ciudad ? `${finca.ciudad}, Nicaragua` : "Nicaragua", 66, 17);

    // Área derecha: caja comprobante
    doc.setFillColor(255,255,255); doc.roundedRect(W-65,6,58,30,3,3,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(V);
    doc.text("COMPROBANTE DE PAGO TEMPORAL", W-36,13,{align:"center"});
    doc.setFontSize(8);
    doc.text(`N.° ${num}`, W-36,19,{align:"center"});
    // Badge PAGADO
    doc.setFillColor(V); doc.roundedRect(W-56,21,40,8,2,2,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(255,255,255);
    doc.text("PAGADO", W-36,26.5,{align:"center"});
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(V);
    doc.text(fechaLarga, W-36,34,{align:"center"});

    let y = 50;

    // ── DATOS DEL PAGO ─────────────────────────────────────────────────
    doc.setFillColor(V); doc.roundedRect(8,y,W-16,8,2,2,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(255,255,255);
    doc.text("DATOS DEL PAGO", 14, y+5.5);
    y += 12;

    const col1 = 8, col2 = W/2+2, colW = (W-20)/2;
    const filasDatos = [
      ["Responsable de nómina:", datos.responsableNombre||"—"],
      ["Trabajador:",             datos.trabajadorNombre||"—"],
      ["Tipo de trabajador:",     "Temporal"],
    ];
    const filasDer = [
      ["Forma de contratación:", forma.label],
      ["Método de pago:",        datos.metodoPago||"Efectivo"],
      ["Moneda:",                datos.moneda==="NIO"?"NIO — Córdoba":"USD — Dólar"],
    ];

    doc.setFillColor(LV); doc.roundedRect(col1,y-2,colW,filasDatos.length*9+4,2,2,"F");
    doc.roundedRect(col2,y-2,colW,filasDatos.length*9+4,2,2,"F");

    filasDatos.forEach(([lbl,val],i) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(V);
      doc.text(lbl, col1+4, y+i*9+3);
      doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
      doc.text(String(val), col1+4+38, y+i*9+3);
    });
    filasDer.forEach(([lbl,val],i) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(V);
      doc.text(lbl, col2+4, y+i*9+3);
      doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
      doc.text(String(val), col2+4+38, y+i*9+3);
    });
    y += filasDatos.length*9+8;

    // ── DETALLE DEL TRABAJO ─────────────────────────────────────────────
    doc.setFillColor(V); doc.roundedRect(8,y,W-16,8,2,2,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(255,255,255);
    doc.text("DETALLE DEL TRABAJO", 14, y+5.5);
    y += 12;

    const infoTrabajo = [
      ["##", "Trabajo realizado:", datos.trabajoRealizado||"—"],
      ["📍","Lugar:",              datos.lugar||"—"],
      ["📅","Período trabajado:",  fmtPeriodo(datos.periodoDe, datos.periodoA)],
    ];
    infoTrabajo.forEach(([ico,lbl,val],i) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(V);
      doc.text(lbl, 18, y+i*8);
      doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
      doc.text(String(val), 60, y+i*8);
    });
    y += infoTrabajo.length*8+6;

    // Tabla desglose
    const unidad = forma.value==="proyecto" ? "proyecto" : forma.unidad;
    const tableBody = [
      [
        forma.value==="proyecto" ? "Trabajo por proyecto" : `${forma.label.replace("Por ","")} trabajado${Number(form.cantidad)!==1?"s":""}`,
        forma.value==="proyecto" ? "—" : `${datos.cantidad} ${unidad}`,
        forma.value==="proyecto" ? "—" : `${datos.moneda==="USD"?"$":"C$"} ${fmt(datos.tarifaUnitaria)}`,
        `${datos.moneda==="USD"?"$":"C$"} ${fmt(subtotal)}`,
      ],
      ["Bonificación","—","—", bonif>0?`${datos.moneda==="USD"?"$":"C$"} ${fmt(bonif)}`:"—"],
      ["Deducciones","—","—", deduc>0?`${datos.moneda==="USD"?"$":"C$"} ${fmt(deduc)}`:"C$ 0.00"],
    ];

    autoTable(doc, {
      startY: y,
      head:[["Descripción","Cantidad","Tarifa","Importe"]],
      body: tableBody,
      headStyles:{ fillColor:V, textColor:[255,255,255], fontStyle:"bold", fontSize:8, halign:"center" },
      bodyStyles:{ fontSize:8, halign:"center" },
      columnStyles:{ 0:{halign:"left"}, 3:{halign:"right", fontStyle:"bold"} },
      alternateRowStyles:{ fillColor:[240,248,240] },
      margin:{ left:8, right:8 },
    });
    y = doc.lastAutoTable.finalY + 4;

    // ── TOTAL NETO ──────────────────────────────────────────────────────
    doc.setFillColor(V); doc.roundedRect(8,y,W-16,14,2,2,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(255,255,255);
    doc.text("TOTAL NETO PAGADO", 16, y+9);
    const monSimbolo = datos.moneda==="USD"?"$ ":"C$ ";
    doc.setFontSize(14);
    doc.text(`${monSimbolo}${fmt(totalNeto)}`, W-12, y+9, {align:"right"});
    y += 20;

    // En letras
    doc.setFont("helvetica","italic"); doc.setFontSize(7.5); doc.setTextColor(80,80,80);
    doc.text(`Son: ${numToWords(totalNeto)}`, W/2, y, {align:"center"});
    y += 8;

    // ── DECLARACIÓN ────────────────────────────────────────────────────
    doc.setFillColor(LV); doc.roundedRect(8,y,W-16,14,2,2,"F");
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(60,60,60);
    const decl = "Declaro haber recibido de la finca el monto indicado por el trabajo temporal descrito en este comprobante.";
    doc.text(doc.splitTextToSize(decl, W-28), W/2, y+5, {align:"center"});
    y += 20;

    // ── FIRMAS ──────────────────────────────────────────────────────────
    const fw = (W-24)/3;
    // Firma trabajador
    doc.setDrawColor(V); doc.setLineWidth(0.4);
    doc.line(10, y+18, 10+fw, y+18);
    doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(100,100,100);
    doc.text("Firma del trabajador", 10+fw/2, y+22, {align:"center"});
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(V);
    doc.text(datos.trabajadorNombre||"—", 10+fw/2, y+27, {align:"center"});

    // Huella digital (centro)
    const hx = 10+fw+2, hw = fw-4;
    doc.setFillColor(245,245,245); doc.setDrawColor(200,200,200); doc.setLineWidth(0.3);
    doc.roundedRect(hx, y, hw, 30, 3, 3, "FD");
    doc.setFont("helvetica","normal"); doc.setFontSize(22); doc.setTextColor(180,180,180);
    doc.text("☞", hx+hw/2, y+18, {align:"center"});
    doc.setFontSize(6); doc.setTextColor(130,130,130);
    doc.text("Huella digital", hx+hw/2, y+27, {align:"center"});

    // Firma responsable
    const rx = 10+fw*2+4;
    doc.setDrawColor(V); doc.setLineWidth(0.4);
    doc.line(rx, y+18, rx+fw, y+18);
    doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(100,100,100);
    doc.text("Firma del responsable de nómina", rx+fw/2, y+22, {align:"center"});
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(V);
    doc.text(datos.responsableNombre||"—", rx+fw/2, y+27, {align:"center"});
    y += 36;

    // ── PIE DE PÁGINA ──────────────────────────────────────────────────
    const codVerif = (gatoId||"").slice(-8).toUpperCase().replace(/(.{4})/,"$1-");
    doc.setFillColor(248,248,248); doc.setDrawColor(220,220,220); doc.setLineWidth(0.2);
    doc.roundedRect(8, y, W-16, 14, 2, 2, "FD");
    doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(100,100,100);
    const pie = `Registrado por: ${usuarioActual?.nombre||"—"}  •  ${new Date().toLocaleString("es-NI")}  •  ${finca?.nombre||"—"}`;
    doc.text(pie, 14, y+5);
    doc.setFont("helvetica","bold"); doc.setTextColor(V);
    doc.text(`Código de verificación: ${codVerif}`, 14, y+10);
    y += 20;

    // QR simulado (cuadrado con patrón)
    doc.setFillColor(0,0,0); doc.rect(W-28,y-18,16,16,"F");
    doc.setFillColor(255,255,255); doc.rect(W-27,y-17,14,14,"F");
    doc.setFillColor(0,0,0);
    [[0,0,4,4],[5,0,4,4],[0,5,4,4],[2,2,2,2],[6,6,4,4]].forEach(([x,yy,w,h])=>{
      doc.rect(W-27+x,y-17+yy,w,h,"F");
    });
    doc.setFont("helvetica","normal"); doc.setFontSize(5.5); doc.setTextColor(100,100,100);
    doc.text("QR Verificación", W-20, y, {align:"center"});

    // Franja verde final
    doc.setFillColor(LV); doc.rect(0, H-12, W, 12, "F");
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(V);
    doc.text("✓  Este comprobante forma parte del registro financiero y de actividad de la finca.", W/2, H-6, {align:"center"});

    doc.save(`pago-temporal-${(datos.trabajadorNombre||"trabajador").split(" ")[0]}-${num}.pdf`);
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError("");
    if (!form.responsableNombre) return setError("Selecciona un responsable de nómina.");
    if (!form.trabajadorNombre.trim()) return setError("Ingresa el nombre del trabajador.");
    if (!form.trabajoRealizado.trim()) return setError("Describe el trabajo realizado.");
    if (!form.tarifaUnitaria && form.formaContratacion!=="proyecto") return setError("Ingresa la tarifa.");
    if (totalNeto <= 0) return setError("El total neto debe ser mayor a cero.");

    setEnviando(true);
    try {
      const periodoStr = `${form.periodoDe} al ${form.periodoA}`;
      const descripcion = `Pago temporal: ${form.trabajoRealizado} — ${form.trabajadorNombre} (${periodoStr})`;
      const notasExtra = JSON.stringify({
        trabajadorNombre: form.trabajadorNombre,
        trabajadorCedula: form.trabajadorCedula,
        formaContratacion: forma.label,
        trabajoRealizado: form.trabajoRealizado,
        lugar: form.lugar,
        periodoDe: form.periodoDe,
        periodoA: form.periodoA,
        cantidad: form.cantidad,
        tarifaUnitaria: form.tarifaUnitaria,
        bonificacion: form.bonificacion,
        deducciones: form.deducciones,
        metodoPago: form.metodoPago,
        subtotal,
        tipo: "TEMPORAL",
      });

      const gasto = await api("/gastos", {
        method: "POST",
        body: {
          descripcion,
          categoria: "SALARIO",
          monto: totalNeto,
          moneda: form.moneda,
          periodicidad: "UNICO",
          fecha: form.fechaPago,
          responsable: form.responsableNombre,
          receptor: form.trabajadorNombre,
          notas: notasExtra,
        },
      });

      await generarPDF(gasto?.id, { ...form, responsableNombre: form.responsableNombre });
      setExito({ id: gasto?.id, trabajador: form.trabajadorNombre, total: totalNeto });
      setForm(VACIO);
    } catch (e) {
      setError(e?.message || "Error al registrar el pago.");
    } finally { setEnviando(false); }
  }

  // ─── PANTALLA ÉXITO ──────────────────────────────────────────────────────
  if (exito) return (
    <AppLayout title="Pago temporal registrado">
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg" style={{ background: lc }}>✅</div>
        <h2 className="font-black text-2xl mb-2" style={{ color: gc }}>¡Pago registrado!</h2>
        <p className="text-gray-500 mb-1">Trabajador: <span className="font-bold text-gray-700">{exito.trabajador}</span></p>
        <p className="font-black text-3xl my-4" style={{ color: gc }}>C$ {fmt(exito.total)}</p>
        <p className="text-xs text-gray-400 mb-8">El comprobante PDF se descargó automáticamente</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => setExito(null)}
            className="w-full py-3 rounded-2xl font-black text-white" style={{ background: gc }}>
            + Registrar otro pago temporal
          </button>
          <button onClick={() => router.push("/gastos/nomina/historial")}
            className="w-full py-3 rounded-2xl font-bold border-2" style={{ borderColor: gc, color: gc }}>
            Ver historial
          </button>
          <button onClick={() => router.push("/gastos/nomina")}
            className="w-full py-3 rounded-2xl font-bold text-gray-500 border border-gray-200">
            Ir a nómina de trabajadores
          </button>
        </div>
      </div>
    </AppLayout>
  );

  // ─── FORMULARIO ──────────────────────────────────────────────────────────
  return (
    <AppLayout title="Pago de trabajo temporal" subtitle="Trabajadores por día, hora, semana o proyecto">
      <div className="max-w-4xl mx-auto px-3 pb-20 flex flex-col lg:flex-row gap-4">

        {/* ── FORMULARIO PRINCIPAL ── */}
        <div className="flex-1 space-y-4">

          {/* Navegación */}
          <div className="flex items-center justify-between">
            <button onClick={() => router.push("/gastos/nomina")}
              className="flex items-center gap-2 text-sm font-bold" style={{ color: gc }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Nómina fija
            </button>
            <button onClick={() => router.push("/gastos/nomina/historial")}
              className="text-sm font-bold" style={{ color: gc }}>📋 Historial</button>
          </div>

          {/* ── SECCIÓN 1: RESPONSABLE ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 font-black text-sm text-white" style={{ background: gc }}>
              1 · Responsable de nómina
            </div>
            <div className="p-5">
              {form.responsableNombre ? (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: lc }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white" style={{ background: gc }}>
                    {iniciales(form.responsableNombre)}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm" style={{ color: gc }}>{form.responsableNombre}</p>
                  </div>
                  <button onClick={() => set("responsableNombre","")} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                </div>
              ) : (
                <div>
                  <input placeholder="Buscar responsable..." value={busqResp}
                    onChange={e=>{ setBusqResp(e.target.value); setShowResp(true); }}
                    onFocus={()=>setShowResp(true)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                  {showResp && (
                    <div className="mt-1 rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto z-10 relative">
                      {respFiltrados.map(u=>(
                        <button key={u.id} onClick={()=>{ set("responsableNombre",u.nombre); set("responsableId",u.id); setShowResp(false); setBusqResp(""); }}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 text-left border-b border-gray-50 last:border-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: gc }}>{iniciales(u.nombre)}</div>
                          <div><p className="font-semibold text-sm text-gray-800">{u.nombre}</p><p className="text-xs text-gray-400">{u.role}</p></div>
                        </button>
                      ))}
                      {respFiltrados.length===0 && <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── SECCIÓN 2: DATOS DEL TRABAJADOR ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 font-black text-sm text-white" style={{ background: gc }}>
              2 · Datos del trabajador temporal
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-black text-gray-500 uppercase">Nombre completo *</label>
                <input value={form.trabajadorNombre} onChange={e=>set("trabajadorNombre",e.target.value)}
                  placeholder="Ej. Juan Carlos Pérez García"
                  className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-semibold" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Cédula (opcional)</label>
                <input value={form.trabajadorCedula} onChange={e=>set("trabajadorCedula",e.target.value)}
                  placeholder="001-000000-0000X"
                  className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Forma de contratación *</label>
                <select value={form.formaContratacion} onChange={e=>set("formaContratacion",e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm">
                  {FORMAS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: DETALLE DEL TRABAJO ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 font-black text-sm text-white" style={{ background: gc }}>
              3 · Detalle del trabajo
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Trabajo realizado *</label>
                <input value={form.trabajoRealizado} onChange={e=>set("trabajoRealizado",e.target.value)}
                  placeholder="Ej. Reparación de cercas, chapeo, ordeño..."
                  className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Lugar</label>
                <input value={form.lugar} onChange={e=>set("lugar",e.target.value)}
                  placeholder="Ej. Potrero El Río, Corral norte..."
                  className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Período desde</label>
                  <input type="date" value={form.periodoDe} onChange={e=>set("periodoDe",e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Hasta</label>
                  <input type="date" value={form.periodoA} onChange={e=>set("periodoA",e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 4: CÁLCULO DEL PAGO ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 font-black text-sm text-white" style={{ background: gc }}>
              4 · Cálculo del pago
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Moneda</label>
                  <select value={form.moneda} onChange={e=>set("moneda",e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm">
                    {MONEDAS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Método de pago</label>
                  <select value={form.metodoPago} onChange={e=>set("metodoPago",e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm">
                    {METODOS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Tarifa y cantidad */}
              {form.formaContratacion !== "proyecto" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase">
                      Cantidad ({forma.unidad})
                    </label>
                    <input type="number" min="0" step="0.5" value={form.cantidad}
                      onChange={e=>set("cantidad",e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-bold text-center" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase">
                      Tarifa por {forma.unidad.replace("s","")} ({form.moneda==="USD"?"$":"C$"})
                    </label>
                    <input type="number" min="0" value={form.tarifaUnitaria}
                      onChange={e=>set("tarifaUnitaria",e.target.value)}
                      placeholder="0.00"
                      className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-bold" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">
                    Monto total del proyecto ({form.moneda==="USD"?"$":"C$"})
                  </label>
                  <input type="number" min="0" value={form.tarifaUnitaria}
                    onChange={e=>{ set("tarifaUnitaria",e.target.value); set("cantidad","1"); }}
                    placeholder="0.00"
                    className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-bold" />
                </div>
              )}

              {/* Subtotal calculado */}
              {subtotal > 0 && (
                <div className="flex justify-between items-center px-4 py-2 rounded-xl" style={{ background: lc }}>
                  <span className="text-xs font-bold text-gray-600">
                    {form.formaContratacion==="proyecto" ? "Monto del proyecto" : `${form.cantidad} ${forma.unidad} × ${form.moneda==="USD"?"$":"C$"} ${fmt(form.tarifaUnitaria)}`}
                  </span>
                  <span className="font-black text-sm" style={{ color: gc }}>
                    {form.moneda==="USD"?"$":"C$"} {fmt(subtotal)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Bonificación</label>
                  <input type="number" min="0" value={form.bonificacion}
                    onChange={e=>set("bonificacion",e.target.value)} placeholder="0.00"
                    className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase">Deducciones</label>
                  <input type="number" min="0" value={form.deducciones}
                    onChange={e=>set("deducciones",e.target.value)} placeholder="0.00"
                    className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Fecha de pago</label>
                <input type="date" value={form.fechaPago} onChange={e=>set("fechaPago",e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase">Notas adicionales</label>
                <textarea rows={2} value={form.notas} onChange={e=>set("notas",e.target.value)}
                  placeholder="Observaciones, acuerdos especiales..."
                  className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm resize-none" />
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm font-semibold">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => router.push("/gastos/nomina")}
              className="flex-1 py-3 rounded-2xl font-bold border-2 text-gray-500 border-gray-200">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={enviando || totalNeto <= 0}
              className="flex-1 py-3 rounded-2xl font-black text-white disabled:opacity-40"
              style={{ background: gc }}>
              {enviando ? "Registrando..." : "✅ Registrar y generar comprobante"}
            </button>
          </div>
        </div>

        {/* ── SIDEBAR RESUMEN ── */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 font-black text-sm text-white" style={{ background: gc }}>
              Resumen del pago
            </div>
            <div className="p-5 space-y-3">

              {form.trabajadorNombre && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: lc }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0" style={{ background: gc }}>
                    {iniciales(form.trabajadorNombre)}
                  </div>
                  <div>
                    <p className="font-black text-xs" style={{ color: gc }}>{form.trabajadorNombre}</p>
                    <p className="text-xs text-gray-400">{forma.label}</p>
                  </div>
                </div>
              )}

              {form.trabajoRealizado && (
                <p className="text-xs text-gray-500 px-1">🔨 {form.trabajoRealizado}</p>
              )}

              {form.periodoDe && (
                <p className="text-xs text-gray-500 px-1">📅 {fmtPeriodo(form.periodoDe, form.periodoA)}</p>
              )}

              <div className="border-t border-gray-100 pt-3 space-y-2">
                {form.formaContratacion !== "proyecto" && subtotal > 0 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{form.cantidad} {forma.unidad} × {form.moneda==="USD"?"$":"C$"}{fmt(form.tarifaUnitaria)}</span>
                    <span className="font-bold">{form.moneda==="USD"?"$":"C$"} {fmt(subtotal)}</span>
                  </div>
                )}
                {bonif > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>+ Bonificación</span>
                    <span className="font-bold">{form.moneda==="USD"?"$":"C$"} {fmt(bonif)}</span>
                  </div>
                )}
                {deduc > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>− Deducciones</span>
                    <span className="font-bold">{form.moneda==="USD"?"$":"C$"} {fmt(deduc)}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl p-4 text-center" style={{ background: gc }}>
                <p className="text-white text-xs font-semibold mb-1">TOTAL NETO A PAGAR</p>
                <p className="font-black text-3xl text-white">{form.moneda==="USD"?"$":"C$"} {fmt(totalNeto)}</p>
                {form.moneda==="NIO" && totalNeto > 0 && (
                  <p className="text-green-300 text-xs mt-1 font-bold">≈ $ {fmtU(totalNeto/tasaCambio)} USD</p>
                )}
                {form.moneda==="USD" && totalNeto > 0 && (
                  <p className="text-green-300 text-xs mt-1 font-bold">≈ C$ {fmt(totalNeto*tasaCambio)} NIO</p>
                )}
              </div>

              <p className="text-center text-xs text-gray-400">
                Tasa: C$ {tasaCambio} / USD
              </p>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p>📄 Se generará un comprobante PDF con número CPT único, tabla de jornales, espacio para huella y firmas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
