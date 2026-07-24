"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const fmt = (n) => Number(n || 0).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUSD = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Tasa de cambio NIO → USD (1 USD = ~36.5 NIO aprox. BCN Nicaragua)
const TASA_CAMBIO = 36.50;
const toUSD = (nio) => nio / TASA_CAMBIO;
const toNIO = (usd) => usd * TASA_CAMBIO;

const TIPOS_PAGO = ["Diario", "Semanal", "Quincenal", "Mensual", "Extraordinario", "Otro"];
const METODOS_PAGO = ["Efectivo", "Transferencia bancaria", "Cheque", "Pago móvil", "Otro"];
const MONEDAS = [{ value: "NIO", label: "C$ — Córdoba" }, { value: "USD", label: "$ — Dólar" }];

const VACIO = {
  responsableId: "", responsableNombre: "", responsableRol: "",
  receptorId: "", receptorNombre: "", receptorCargo: "",
  pagarmeAMiMismo: false,
  periodoDe: new Date().toISOString().slice(0, 8) + "01",
  periodoA: new Date().toISOString().slice(0, 10),
  tipoPago: "Quincenal",
  salarioBase: "", bonificacion: "", horasExtras: "",
  otrasRemuneraciones: "", deducciones: "", adelantos: "",
  moneda: "NIO", metodoPago: "Efectivo",
  fechaPago: new Date().toISOString().slice(0, 10),
  referencia: "", notas: "", estado: "PAGADO",
};

function iniciales(nombre) {
  return (nombre || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function numToWords(n) {
  n = Math.round(n || 0);
  if (!n) return "CERO CÓRDOBAS NETOS";
  const ones = ["","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
    "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE"];
  const tens = ["","DIEZ","VEINTE","TREINTA","CUARENTA","CINCUENTA","SESENTA","SETENTA","OCHENTA","NOVENTA"];
  const hundreds = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
    "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
  function t2(n){if(n<20)return ones[n];const d=Math.floor(n/10),u=n%10;return tens[d]+(u?" Y "+ones[u]:"");}
  function t3(n){if(n===100)return "CIEN";const c=Math.floor(n/100),r=n%100;return(c?hundreds[c]+(r?" ":""):""+(r?t2(r):""));}
  let r="";
  if(n>=1000){const m=Math.floor(n/1000);r+=(m===1?"MIL":t3(m)+" MIL");n=n%1000;if(n)r+=" ";}
  if(n>0)r+=t3(n);
  return r+" CÓRDOBAS NETOS";
}

export default function NominaPage() {
  const router = useRouter();
  const [form, setForm] = useState(VACIO);
  const [usuarios, setUsuarios] = useState([]);
  const [finca, setFinca] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(null);
  const [mostrarSelectorResponsable, setMostrarSelectorResponsable] = useState(false);
  const [mostrarSelectorReceptor, setMostrarSelectorReceptor] = useState(false);
  const [busquedaResp, setBusquedaResp] = useState("");
  const [busquedaRecep, setBusquedaRecep] = useState("");

  useEffect(() => {
    Promise.all([
      api("/gastos/usuarios-finca").catch(() => []),
      api("/fincas/mi-finca").catch(() => null),
      api("/usuarios/perfil").catch(() => null),
    ]).then(([u, f, me]) => {
      setUsuarios(Array.isArray(u) ? u : []);
      setFinca(f);
      setUsuarioActual(me);
    });
  }, []);

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const totalIngresos = (Number(form.salarioBase) || 0) + (Number(form.bonificacion) || 0) +
    (Number(form.horasExtras) || 0) + (Number(form.otrasRemuneraciones) || 0);
  const totalDeducciones = (Number(form.deducciones) || 0) + (Number(form.adelantos) || 0);
  const totalNeto = totalIngresos - totalDeducciones;

  const roleLabel = (r) => r === "ADMIN" ? "Administrador" : r === "SUPER_ADMIN" ? "Super Admin" : "Trabajador";

  const usuariosFiltradosResp = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busquedaResp.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(busquedaResp.toLowerCase())
  );
  const usuariosFiltradosRecep = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busquedaRecep.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(busquedaRecep.toLowerCase())
  );

  function seleccionarResponsable(u) {
    setForm(f => ({
      ...f,
      responsableId: u.id,
      responsableNombre: u.nombre,
      responsableRol: roleLabel(u.role),
      pagarmeAMiMismo: false,
      receptorId: "", receptorNombre: "", receptorCargo: "",
    }));
    setMostrarSelectorResponsable(false);
    setBusquedaResp("");
  }

  function seleccionarReceptor(u) {
    setForm(f => ({
      ...f,
      receptorId: u.id,
      receptorNombre: u.nombre,
      receptorCargo: roleLabel(u.role),
    }));
    setMostrarSelectorReceptor(false);
    setBusquedaRecep("");
  }

  function togglePagarmeAMiMismo(checked) {
    if (checked) {
      if (!form.responsableId) {
        setError("Primero selecciona un responsable de nómina.");
        return;
      }
      const resp = usuarios.find(u => u.id === form.responsableId);
      if (!resp) {
        setError("Esta persona no tiene un perfil activo como trabajador.");
        return;
      }
      setForm(f => ({
        ...f,
        pagarmeAMiMismo: true,
        receptorId: resp.id,
        receptorNombre: resp.nombre,
        receptorCargo: roleLabel(resp.role),
      }));
    } else {
      setForm(f => ({
        ...f,
        pagarmeAMiMismo: false,
        receptorId: "", receptorNombre: "", receptorCargo: "",
      }));
    }
    setError("");
  }

  async function generarPDF(gatoId) {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

    const V = "#1a4d2e"; const LV = "#e8f5e9"; const GR = "#f5f5f5";
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const num = gatoId?.slice(-8).toUpperCase() || "BORRADOR";

    // Header
    doc.setFillColor(V); doc.rect(0, 0, pageW, 38, "F");
    doc.setFillColor(LV); doc.circle(18, 19, 12, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(V);
    doc.text(finca?.nombre?.slice(0,2).toUpperCase() || "H", 18, 22, { align: "center" });
    doc.setTextColor(255,255,255);
    doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text("HENRIQUEZ CATTLE MANAGEMENT", 34, 14);
    doc.setFontSize(9); doc.setFont("helvetica","normal");
    doc.text(`Finca: ${finca?.nombre || "—"}  •  ${finca?.ciudad || "Nicaragua"}`, 34, 21);
    doc.text(`Comprobante de Pago de Nómina`, 34, 27);
    doc.setFontSize(9); doc.text(`N° ${num}`, pageW - 15, 14, { align: "right" });
    doc.text(new Date().toLocaleDateString("es-NI", { day:"2-digit", month:"long", year:"numeric" }), pageW - 15, 20, { align: "right" });

    let y = 46;

    // Partes
    doc.setFillColor(LV);
    doc.roundedRect(10, y, pageW - 20, 28, 3, 3, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(V);
    doc.text("RESPONSABLE DE NÓMINA", 14, y + 6);
    doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
    doc.text(form.responsableNombre || "—", 14, y + 12);
    doc.setTextColor(120,120,120);
    doc.text(form.responsableRol || "—", 14, y + 18);
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(V);
    doc.text("TRABAJADOR QUE RECIBE", pageW/2 + 4, y + 6);
    doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
    doc.text(form.receptorNombre || "—", pageW/2 + 4, y + 12);
    doc.setTextColor(120,120,120);
    doc.text(form.receptorCargo || "—", pageW/2 + 4, y + 18);
    if (form.pagarmeAMiMismo) {
      doc.setTextColor(V); doc.setFont("helvetica","bolditalic"); doc.setFontSize(7);
      doc.text("★ Autopago", pageW/2 + 4, y + 24);
    }
    y += 34;

    // Período y tipo
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(V);
    doc.text("PERÍODO DE PAGO", 14, y + 6);
    doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
    doc.text(`${form.periodoDe || "—"} al ${form.periodoA || "—"}`, 14, y + 12);
    doc.setFont("helvetica","bold"); doc.setTextColor(V);
    doc.text("TIPO", pageW/2 + 4, y + 6);
    doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
    doc.text(form.tipoPago, pageW/2 + 4, y + 12);
    y += 22;

    const simNIO = form.moneda === "NIO";
    const simUSD = form.moneda === "USD";
    const monedaSimbolo = simNIO ? "C$" : "$";

    // Tabla de desglose
    autoTable(doc, {
      startY: y,
      head: [["Concepto", `Monto (${form.moneda})`, simNIO ? "Equiv. USD" : "Equiv. NIO"]],
      body: [
        ["Salario base", `${monedaSimbolo} ${fmt(form.salarioBase)}`, simNIO ? `$ ${fmtUSD(toUSD(Number(form.salarioBase)||0))}` : `C$ ${fmt(toNIO(Number(form.salarioBase)||0))}`],
        ...(Number(form.bonificacion) > 0 ? [["Bonificación", `${monedaSimbolo} ${fmt(form.bonificacion)}`, simNIO ? `$ ${fmtUSD(toUSD(Number(form.bonificacion)))}` : `C$ ${fmt(toNIO(Number(form.bonificacion)))}`]] : []),
        ...(Number(form.horasExtras) > 0 ? [["Horas extras", `${monedaSimbolo} ${fmt(form.horasExtras)}`, simNIO ? `$ ${fmtUSD(toUSD(Number(form.horasExtras)))}` : `C$ ${fmt(toNIO(Number(form.horasExtras)))}`]] : []),
        ...(Number(form.otrasRemuneraciones) > 0 ? [["Otras remuneraciones", `${monedaSimbolo} ${fmt(form.otrasRemuneraciones)}`, simNIO ? `$ ${fmtUSD(toUSD(Number(form.otrasRemuneraciones)))}` : `C$ ${fmt(toNIO(Number(form.otrasRemuneraciones)))}`]] : []),
        ["Total ingresos", `${monedaSimbolo} ${fmt(totalIngresos)}`, simNIO ? `$ ${fmtUSD(toUSD(totalIngresos))}` : `C$ ${fmt(toNIO(totalIngresos))}`],
        ...(Number(form.deducciones) > 0 ? [["Deducciones", `- ${monedaSimbolo} ${fmt(form.deducciones)}`, simNIO ? `- $ ${fmtUSD(toUSD(Number(form.deducciones)))}` : `- C$ ${fmt(toNIO(Number(form.deducciones)))}`]] : []),
        ...(Number(form.adelantos) > 0 ? [["Adelantos descontados", `- ${monedaSimbolo} ${fmt(form.adelantos)}`, simNIO ? `- $ ${fmtUSD(toUSD(Number(form.adelantos)))}` : `- C$ ${fmt(toNIO(Number(form.adelantos)))}`]] : []),
      ],
      foot: [[
        { content: "TOTAL NETO A PAGAR", styles: { fontStyle:"bold", textColor:[255,255,255], fillColor:V } },
        { content: `${monedaSimbolo} ${fmt(totalNeto)}`, styles: { fontStyle:"bold", textColor:[255,255,255], fillColor:V, halign:"right" } },
        { content: simNIO ? `$ ${fmtUSD(toUSD(totalNeto))} USD` : `C$ ${fmt(toNIO(totalNeto))} NIO`, styles: { fontStyle:"bold", textColor:[200,255,200], fillColor:V, halign:"right" } },
      ]],
      headStyles: { fillColor: V, textColor: [255,255,255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [40,40,40] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right", textColor: [5,150,105] } },
      alternateRowStyles: { fillColor: GR },
      margin: { left: 10, right: 10 },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Caja doble moneda destacada
    doc.setFillColor(V); doc.roundedRect(10, y, pageW - 20, 18, 3, 3, "F");
    doc.setFont("helvetica","black"); doc.setFontSize(13); doc.setTextColor(255,255,255);
    doc.text(`${monedaSimbolo} ${fmt(totalNeto)}`, pageW/2 - 4, y + 9, { align: "right" });
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(150,255,180);
    doc.text(simNIO ? `≈ $ ${fmtUSD(toUSD(totalNeto))} USD` : `≈ C$ ${fmt(toNIO(totalNeto))} NIO`, pageW/2 + 2, y + 9, { align: "left" });
    doc.setFontSize(6); doc.setTextColor(180,230,180);
    doc.text(`Tasa: C$ ${TASA_CAMBIO} / USD`, pageW/2, y + 15, { align: "center" });
    y += 24;

    // Total en letras
    doc.setFillColor(LV);
    doc.roundedRect(10, y, pageW - 20, 12, 2, 2, "F");
    doc.setFont("helvetica","bolditalic"); doc.setFontSize(7.5); doc.setTextColor(V);
    doc.text(`Son: ${numToWords(totalNeto)} ${form.moneda === "NIO" ? "Córdobas Netos" : "Dólares Netos"}`, pageW/2, y + 7, { align: "center" });
    y += 18;

    // Método y referencia
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(80,80,80);
    doc.text(`Método de pago: ${form.metodoPago}`, 14, y);
    if (form.referencia) doc.text(`N° Referencia: ${form.referencia}`, pageW/2, y);
    doc.text(`Fecha de pago: ${form.fechaPago}`, pageW - 15, y, { align: "right" });
    y += 10;

    // Texto legal
    const texto = "Declaro haber recibido de la finca el monto indicado en este comprobante, correspondiente al período señalado, a mi entera conformidad.";
    doc.setFont("helvetica","italic"); doc.setFontSize(7.5); doc.setTextColor(100,100,100);
    const lines = doc.splitTextToSize(texto, pageW - 20);
    doc.text(lines, 10, y); y += lines.length * 4 + 8;

    // Firmas
    const fw = (pageW - 30) / 2;
    doc.setDrawColor(V); doc.setLineWidth(0.3);
    doc.line(10, y + 16, 10 + fw, y + 16);
    doc.line(pageW - 10 - fw, y + 16, pageW - 10, y + 16);
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(V);
    doc.text("Firma del Responsable de Nómina", 10 + fw/2, y + 20, { align: "center" });
    doc.text("Firma / Huella del Trabajador", pageW - 10 - fw/2, y + 20, { align: "center" });
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(120,120,120);
    doc.text(form.responsableNombre || "—", 10 + fw/2, y + 25, { align: "center" });
    doc.text(form.receptorNombre || "—", pageW - 10 - fw/2, y + 25, { align: "center" });
    y += 32;

    // Registrado por
    doc.setFontSize(7); doc.setTextColor(150,150,150);
    doc.text(`Registrado por: ${usuarioActual?.nombre || "—"} · ${new Date().toLocaleString("es-NI")}`, pageW/2, y, { align: "center" });

    // Footer
    doc.setFillColor(V); doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(255,255,255);
    doc.text("Documento generado por Henriquez Cattle Management · ganaderosg.app", pageW/2, pageH - 4, { align: "center" });

    doc.save(`nomina-${num}-${form.receptorNombre?.split(" ")[0] || "trabajador"}.pdf`);
  }

  async function handleSubmit(isDraft = false) {
    if (!isDraft) {
      if (!form.responsableNombre) { setError("Selecciona el responsable de nómina."); return; }
      if (!form.receptorNombre) { setError("Selecciona el trabajador que recibe."); return; }
      if (!form.salarioBase || Number(form.salarioBase) <= 0) { setError("El salario base debe ser mayor a cero."); return; }
      if (totalNeto < 0) { setError("El total neto no puede ser negativo."); return; }
    }
    setEnviando(true); setError("");
    try {
      const descripcion = `Pago de nómina ${form.tipoPago} — ${form.receptorNombre} (${form.periodoDe} al ${form.periodoA})`;
      const notas = `Responsable: ${form.responsableNombre} | Receptor: ${form.receptorNombre} | Tipo: ${form.tipoPago} | Método: ${form.metodoPago}${form.referencia ? ` | Ref: ${form.referencia}` : ""}${form.notas ? ` | ${form.notas}` : ""}${form.pagarmeAMiMismo ? " | AUTOPAGO" : ""}`;
      const gasto = await api("/gastos", {
        method: "POST",
        body: {
          descripcion,
          categoria: "SALARIO",
          monto: totalNeto,
          moneda: form.moneda,
          periodicidad: form.tipoPago === "Quincenal" ? "QUINCENAL" : form.tipoPago === "Mensual" ? "MENSUAL" : form.tipoPago === "Semanal" ? "SEMANAL" : form.tipoPago === "Diario" ? "DIARIO" : "UNICO",
          fecha: form.fechaPago,
          notas,
          responsable: form.responsableNombre,
          receptor: form.receptorNombre,
        },
      });
      if (!isDraft) {
        await generarPDF(gasto?.id);
      }
      setExito({ id: gasto?.id, receptor: form.receptorNombre, total: totalNeto });
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  // Pantalla de éxito
  if (exito) return (
    <AppLayout title="Nómina" subtitle="Pago registrado">
      <div className="max-w-md mx-auto mt-16 text-center px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#e8f5e9" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a4d2e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: "#1a4d2e" }}>¡Pago registrado!</h2>
        <p className="text-gray-500 mb-8">El comprobante de <strong>{exito.receptor}</strong> fue generado y descargado.</p>
        <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: "#e8f5e9" }}>
          <p className="text-xs text-gray-500 mb-1">Total neto pagado</p>
          {form.moneda === "NIO" ? (
            <>
              <p className="font-black text-4xl" style={{ color: "#1a4d2e" }}>C$ {fmt(exito.total)}</p>
              <p className="font-bold text-lg mt-1" style={{ color: "#059669" }}>≈ $ {fmtUSD(toUSD(exito.total))} USD</p>
              <p className="text-xs text-gray-400 mt-0.5">Tasa de cambio: C$ {TASA_CAMBIO} por dólar</p>
            </>
          ) : (
            <>
              <p className="font-black text-4xl" style={{ color: "#1a4d2e" }}>$ {fmt(exito.total)} USD</p>
              <p className="font-bold text-lg mt-1" style={{ color: "#059669" }}>≈ C$ {fmt(toNIO(exito.total))} NIO</p>
              <p className="text-xs text-gray-400 mt-0.5">Tasa de cambio: C$ {TASA_CAMBIO} por dólar</p>
            </>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => generarPDF(exito.id)}
            className="flex-1 py-3 rounded-xl font-bold border-2 text-sm" style={{ borderColor: "#1a4d2e", color: "#1a4d2e" }}>
            Descargar PDF de nuevo
          </button>
          <button onClick={() => { setExito(null); setForm(VACIO); }}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm" style={{ background: "#1a4d2e" }}>
            Nuevo pago
          </button>
        </div>
        <button onClick={() => router.push("/gastos")} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
          ← Volver a Gastos
        </button>
      </div>
    </AppLayout>
  );

  const gc = "#1a4d2e"; const lc = "#e8f5e9";

  return (
    <AppLayout title="Registrar pago de nómina" subtitle="Registra el salario pagado a un trabajador de la finca">
      <div className="max-w-6xl mx-auto px-3 pb-16">

        {/* Encabezado con estado */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push("/gastos")} className="flex items-center gap-2 text-sm font-semibold" style={{ color: gc }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Volver a Gastos
          </button>
          <button onClick={() => router.push("/gastos/nomina/historial")}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border-2" style={{ borderColor: gc, color: gc }}>
            📋 Historial
          </button>
          <button onClick={() => router.push("/gastos/nomina/reportes")}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border-2" style={{ borderColor: gc, color: gc }}>
            📊 Reportes
          </button>
          <div className="flex items-center gap-2">
            {["PAGADO","BORRADOR"].map(e => (
              <button key={e} onClick={() => set("estado", e)}
                className="px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={{ background: form.estado === e ? (e === "PAGADO" ? gc : "#f59e0b") : "#fff",
                         color: form.estado === e ? "#fff" : (e === "PAGADO" ? gc : "#f59e0b"),
                         borderColor: e === "PAGADO" ? gc : "#f59e0b" }}>
                {e === "PAGADO" ? "Pagado" : "Borrador"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl text-sm font-semibold" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* FORMULARIO — 2/3 */}
          <div className="lg:col-span-2 space-y-4">

            {/* SECCIÓN 1: Responsable */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-black text-base" style={{ color: gc }}>1. Responsable de nómina</h3>
                <p className="text-xs text-gray-400 mt-0.5">Persona que entrega y registra el pago en nombre de la finca</p>
              </div>
              <div className="p-5">
                {form.responsableNombre ? (
                  <div className="flex items-center gap-4 p-4 rounded-xl border-2" style={{ borderColor: gc, background: lc }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0" style={{ background: gc, color: "#fff" }}>
                      {iniciales(form.responsableNombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: gc }}>{form.responsableNombre}</p>
                      <p className="text-xs text-gray-500">{form.responsableRol} · {finca?.nombre || "Finca"}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: gc }}>Responsable de nómina</span>
                    </div>
                    <button onClick={() => setMostrarSelectorResponsable(true)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border" style={{ borderColor: gc, color: gc }}>
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setMostrarSelectorResponsable(true)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all hover:border-green-400"
                    style={{ borderColor: "#d1d5db" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: lc }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gc} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-600">Seleccionar responsable</p>
                      <p className="text-xs text-gray-400">Administrador o encargado que entrega el pago</p>
                    </div>
                  </button>
                )}

                {/* Selector responsable */}
                {mostrarSelectorResponsable && (
                  <div className="mt-3 border rounded-xl overflow-hidden shadow-lg" style={{ borderColor: gc }}>
                    <div className="p-3 border-b" style={{ background: lc }}>
                      <input autoFocus value={busquedaResp} onChange={e => setBusquedaResp(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-green-400" />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {usuariosFiltradosResp.map(u => (
                        <button key={u.id} onClick={() => seleccionarResponsable(u)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left border-b border-gray-50 last:border-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ background: gc }}>
                            {iniciales(u.nombre)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{u.nombre}</p>
                            <p className="text-xs text-gray-400">{roleLabel(u.role)}</p>
                          </div>
                        </button>
                      ))}
                      {usuariosFiltradosResp.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">Sin resultados</p>}
                    </div>
                    <button onClick={() => setMostrarSelectorResponsable(false)}
                      className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 border-t">Cancelar</button>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Trabajador que recibe */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-black text-base" style={{ color: gc }}>2. Trabajador que recibe</h3>
              </div>
              <div className="p-5">
                {/* Checkbox pagarme a mí mismo */}
                <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-4" style={{ background: form.pagarmeAMiMismo ? lc : "#f9fafb", border: `2px solid ${form.pagarmeAMiMismo ? gc : "#e5e7eb"}` }}>
                  <input type="checkbox" checked={form.pagarmeAMiMismo} onChange={e => togglePagarmeAMiMismo(e.target.checked)}
                    className="w-4 h-4 accent-green-700" />
                  <div>
                    <p className="font-bold text-sm text-gray-700">Pagarme a mí mismo</p>
                    <p className="text-xs text-gray-400">El responsable de nómina también puede recibir su propio salario</p>
                  </div>
                </label>

                {!form.pagarmeAMiMismo && (
                  <>
                    {form.receptorNombre ? (
                      <div className="flex items-center gap-4 p-4 rounded-xl border-2" style={{ borderColor: "#10b981", background: "#f0fdf4" }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 text-white" style={{ background: "#059669" }}>
                          {iniciales(form.receptorNombre)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-800">{form.receptorNombre}</p>
                          <p className="text-xs text-gray-500">{form.receptorCargo} · {finca?.nombre || ""}</p>
                        </div>
                        <button onClick={() => { set("receptorId", ""); set("receptorNombre", ""); set("receptorCargo", ""); setMostrarSelectorReceptor(true); }}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-green-600 text-green-700">
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setMostrarSelectorReceptor(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all hover:border-green-400"
                        style={{ borderColor: "#d1d5db" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-gray-600">Seleccionar trabajador</p>
                          <p className="text-xs text-gray-400">Quien recibirá el pago de salario</p>
                        </div>
                      </button>
                    )}

                    {mostrarSelectorReceptor && (
                      <div className="mt-3 border rounded-xl overflow-hidden shadow-lg border-green-600">
                        <div className="p-3 border-b bg-green-50">
                          <input autoFocus value={busquedaRecep} onChange={e => setBusquedaRecep(e.target.value)}
                            placeholder="Buscar trabajador..."
                            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-green-400" />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {usuariosFiltradosRecep.map(u => (
                            <button key={u.id} onClick={() => seleccionarReceptor(u)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left border-b border-gray-50 last:border-0">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ background: "#059669" }}>
                                {iniciales(u.nombre)}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-gray-800">{u.nombre}</p>
                                <p className="text-xs text-gray-400">{roleLabel(u.role)} · Activo</p>
                              </div>
                            </button>
                          ))}
                          {usuariosFiltradosRecep.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">Sin resultados</p>}
                        </div>
                        <button onClick={() => setMostrarSelectorReceptor(false)}
                          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 border-t">Cancelar</button>
                      </div>
                    )}
                  </>
                )}

                {form.pagarmeAMiMismo && form.receptorNombre && (
                  <div className="p-3 rounded-xl text-xs font-semibold" style={{ background: lc, color: gc, border: `1px solid ${gc}` }}>
                    ★ Autopago — {form.responsableNombre} es también el receptor del pago
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: Detalles del pago */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-black text-base" style={{ color: gc }}>3. Detalles del pago</h3>
              </div>
              <div className="p-5 space-y-4">

                {/* Período */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Período desde</label>
                    <input type="date" value={form.periodoDe} onChange={e => set("periodoDe", e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Período hasta</label>
                    <input type="date" value={form.periodoA} onChange={e => set("periodoA", e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                  </div>
                </div>

                {/* Tipo de pago */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Tipo de pago</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {TIPOS_PAGO.map(t => (
                      <button key={t} type="button" onClick={() => set("tipoPago", t)}
                        className="py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all"
                        style={{ background: form.tipoPago === t ? gc : "#fff", color: form.tipoPago === t ? "#fff" : gc, borderColor: gc }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ingresos */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ingresos</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[["salarioBase","Salario base *"],["bonificacion","Bonificación"],["horasExtras","Horas extras"],["otrasRemuneraciones","Otras remuneraciones"]].map(([k, lbl]) => (
                      <div key={k}>
                        <label className="text-xs text-gray-400">{lbl}</label>
                        <input type="number" min="0" step="0.01" value={form[k]} onChange={e => set(k, e.target.value)}
                          placeholder="0.00"
                          className="w-full mt-0.5 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-semibold" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deducciones */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Deducciones</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[["deducciones","Deducciones"],["adelantos","Adelantos descontados"]].map(([k, lbl]) => (
                      <div key={k}>
                        <label className="text-xs text-gray-400">{lbl}</label>
                        <input type="number" min="0" step="0.01" value={form[k]} onChange={e => set(k, e.target.value)}
                          placeholder="0.00"
                          className="w-full mt-0.5 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:outline-none text-sm font-semibold" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advertencia si deducciones > ingresos */}
                {totalDeducciones > totalIngresos && totalIngresos > 0 && (
                  <div className="p-3 rounded-xl text-xs font-semibold" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
                    ⚠ Las deducciones superan el total de ingresos
                  </div>
                )}

                {/* Moneda y Método */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Moneda</label>
                    <select value={form.moneda} onChange={e => set("moneda", e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm">
                      {MONEDAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Método de pago</label>
                    <select value={form.metodoPago} onChange={e => set("metodoPago", e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm">
                      {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {/* Fecha de pago */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Fecha de pago</label>
                    <input type="date" value={form.fechaPago} onChange={e => set("fechaPago", e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                  </div>
                  {(form.metodoPago === "Transferencia bancaria" || form.metodoPago === "Cheque") && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">N° Referencia</label>
                      <input value={form.referencia} onChange={e => set("referencia", e.target.value)}
                        placeholder="TRF-0001 / CHQ-0001"
                        className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm" />
                    </div>
                  )}
                </div>

                {/* Notas */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Notas <span className="text-gray-300 font-normal">(opcional)</span></label>
                  <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={2}
                    placeholder="Observaciones adicionales..."
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm resize-none" />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => router.push("/gastos")}
                className="order-3 sm:order-1 px-5 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => handleSubmit(true)} disabled={enviando}
                className="order-2 flex-1 py-3 rounded-xl font-bold border-2 text-sm"
                style={{ borderColor: gc, color: gc }}>
                Guardar borrador
              </button>
              <button onClick={() => handleSubmit(false)} disabled={enviando || totalNeto <= 0}
                className="order-1 sm:order-3 flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40"
                style={{ background: gc }}>
                {enviando ? "Registrando..." : "Registrar pago y generar comprobante"}
              </button>
            </div>
          </div>

          {/* SIDEBAR: Resumen */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ background: "#fff" }}>
              <div className="px-5 py-4" style={{ background: gc }}>
                <h3 className="text-white font-black text-sm">Resumen del pago</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  ["Responsable", form.responsableNombre || "—"],
                  ["Recibe", form.receptorNombre || "—"],
                  ["Finca", finca?.nombre || "—"],
                  ["Período", form.periodoDe && form.periodoA ? `${form.periodoDe.slice(8)} al ${form.periodoA.slice(8)} ${form.periodoA.slice(0,7)}` : "—"],
                  ["Tipo", form.tipoPago],
                  ["Método", form.metodoPago],
                  ["Moneda", form.moneda],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-400 shrink-0">{k}</span>
                    <span className="text-xs font-semibold text-gray-700 text-right">{v}</span>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total ingresos</span>
                    <div className="text-right">
                      <span className="font-semibold text-green-700">+ {form.moneda === "NIO" ? "C$" : "$"} {fmt(totalIngresos)}</span>
                      {form.moneda === "NIO" && totalIngresos > 0 && (
                        <p className="text-gray-400" style={{ fontSize: 10 }}>$ {fmtUSD(toUSD(totalIngresos))} USD</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total deducciones</span>
                    <div className="text-right">
                      <span className="font-semibold text-red-500">- {form.moneda === "NIO" ? "C$" : "$"} {fmt(totalDeducciones)}</span>
                      {form.moneda === "NIO" && totalDeducciones > 0 && (
                        <p className="text-gray-400" style={{ fontSize: 10 }}>$ {fmtUSD(toUSD(totalDeducciones))} USD</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-3" style={{ background: lc }}>
                  <p className="text-xs font-bold mb-1" style={{ color: gc }}>Total neto a pagar</p>
                  {form.moneda === "NIO" ? (
                    <>
                      <p className="font-black text-3xl leading-none" style={{ color: gc }}>C$ {fmt(totalNeto)}</p>
                      <p className="text-sm font-bold mt-1.5" style={{ color: "#059669" }}>≈ $ {fmtUSD(toUSD(totalNeto))} <span className="font-normal text-gray-400 text-xs">USD</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">Tasa: C$ {TASA_CAMBIO} / USD</p>
                    </>
                  ) : (
                    <>
                      <p className="font-black text-3xl leading-none" style={{ color: gc }}>$ {fmt(totalNeto)}</p>
                      <p className="text-sm font-bold mt-1.5" style={{ color: "#059669" }}>≈ C$ {fmt(toNIO(totalNeto))} <span className="font-normal text-gray-400 text-xs">NIO</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">Tasa: C$ {TASA_CAMBIO} / USD</p>
                    </>
                  )}
                </div>

                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "#f0fdf4", border: `1px solid ${lc}` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gc} strokeWidth="2" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <p className="text-xs text-gray-500">Este movimiento quedará registrado en Finanzas y Actividad</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
