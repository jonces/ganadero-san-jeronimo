"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const gi = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", outline: "none", borderRadius: 12, padding: "10px 14px", width: "100%", fontSize: 14 };
const glass = { background: "rgba(5,25,12,0.80)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24 };

export default function CartaVentaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firmado, setFirmado] = useState(false);
  const [firmaSrc, setFirmaSrc] = useState(null);
  const [dibujando, setDibujando] = useState(false);
  const [hayFirma, setHayFirma] = useState(false);
  const [mostrarCarta, setMostrarCarta] = useState(false);
  const canvasRef = useRef(null);

  // Cuestionario para PARCIAL / PENDIENTE
  const [q, setQ] = useState({
    precioTotal: "",
    montoInicial: "",
    fechaLimite: "",
    formaPagoSaldo: "EFECTIVO",
    cuotas: "1",
    montoCuota: "",
    consecuencia: "RECUPERAR",
    lugar: "",
    testigo1: "",
    testigo2: "",
    observacionExtra: "",
  });

  useEffect(() => {
    api(`/ventas/${id}`)
      .then(d => {
        setVenta(d);
        // Si es PAGADO, mostrar carta directamente
        if (d.estadoPago === "PAGADO") setMostrarCarta(true);
      })
      .catch(() => router.push("/ventas"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Canvas firma ──
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function onStart(e) {
    e.preventDefault(); setDibujando(true); setHayFirma(true);
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  }
  function onMove(e) {
    e.preventDefault(); if (!dibujando) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  }
  function onEnd(e) { e.preventDefault(); setDibujando(false); }
  function limpiarFirma() {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHayFirma(false); setFirmado(false); setFirmaSrc(null);
  }
  function confirmarFirma() { setFirmaSrc(canvasRef.current.toDataURL("image/png")); setFirmado(true); }

  // ── Helpers ──
  const fmt = (n) => Number(n || 0).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const FORMAS = { EFECTIVO: "efectivo", TRANSFERENCIA: "transferencia bancaria", CHEQUE: "cheque", DEPOSITO: "depósito bancario" };
  const CONSECUENCIAS = {
    RECUPERAR: "el vendedor podrá recuperar el animal de manera inmediata y sin compensación adicional al comprador",
    INTERES: "el monto adeudado generará un interés del 5% mensual hasta su cancelación total",
    LEGAL: "el vendedor iniciará las acciones legales correspondientes para exigir el pago o recuperar el bien",
    ACUERDO: "las partes resolverán la situación mediante acuerdo mutuo ante la Autoridad Municipal",
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#020F05" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-white/50">Cargando datos de la venta...</p>
      </div>
    </div>
  );

  if (!venta) return null;

  // ── CUESTIONARIO (solo PARCIAL / PENDIENTE) ──
  if (!mostrarCarta) {
    const esParcial = venta.estadoPago === "PARCIAL";
    return (
      <div className="min-h-screen pb-10" style={{ background: "linear-gradient(135deg,#020F05,#051A0A)" }}>
        <div className="max-w-xl mx-auto px-4 pt-6">
          {/* Header */}
          <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1 hover:text-white/70">← Volver</button>
          <div style={glass}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(214,158,46,0.2)", border: "1px solid rgba(214,158,46,0.4)" }}>
                {esParcial ? "🔶" : "⏳"}
              </div>
              <div>
                <h2 className="text-white font-black text-lg">Información del Acuerdo</h2>
                <p className="text-white/40 text-xs">Venta {esParcial ? "con pago parcial" : "pendiente de pago"} · {venta.animal?.nombre || venta.animal?.identificador}</p>
              </div>
            </div>
            <p className="text-white/50 text-sm mb-5 leading-relaxed">
              Para redactar las cláusulas correctamente según tu situación, responde estas preguntas. La carta quedará redactada de forma profesional y legal.
            </p>

            {/* Resumen de la venta registrada */}
            <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(45,158,63,0.12)", border: "1px solid rgba(45,158,63,0.25)" }}>
              <p className="text-green-400 text-xs font-black mb-1 font-sans">📋 Datos de la venta registrada</p>
              <div className="grid grid-cols-2 gap-1 text-xs font-sans">
                <span className="text-white/40">Animal:</span><span className="text-white font-bold">{venta.animal?.nombre || venta.animal?.identificador}</span>
                <span className="text-white/40">Precio registrado:</span><span className="text-white font-bold">C$ {fmt(venta.precioNIO)}</span>
                <span className="text-white/40">Método de pago:</span><span className="text-white font-bold">{{ EFECTIVO:"Efectivo", TRANSFERENCIA:"Transferencia", CHEQUE:"Cheque", CREDITO:"Crédito" }[venta.metodoPago]}</span>
              </div>
            </div>

            <div className="space-y-4 mt-4">

              <div>
                <label className="text-white/60 text-xs block mb-1 font-sans">1. ¿Cuál es el precio total acordado por el animal? (C$) *</label>
                <input type="number" style={gi} placeholder={`Ej: ${fmt(venta.precioNIO).replace(/,/g,'')}`}
                  value={q.precioTotal} onChange={e => setQ({ ...q, precioTotal: e.target.value })} />
                <p className="text-white/30 text-xs mt-1 font-sans">Si ya está correcto en el sistema, escribe el mismo valor: C$ {fmt(venta.precioNIO)}</p>
              </div>

              {esParcial && (
                <div>
                  <label className="text-white/60 text-xs block mb-1 font-sans">2. ¿Cuánto dinero ya recibiste de abono/inicial? (C$) *</label>
                  <input type="number" style={gi} placeholder="Ej: 5000" value={q.montoInicial}
                    onChange={e => setQ({ ...q, montoInicial: e.target.value })} />
                  {q.precioTotal && q.montoInicial && (
                    <div className="mt-2 rounded-lg p-2 font-sans" style={{ background: "rgba(214,158,46,0.15)", border: "1px solid rgba(214,158,46,0.3)" }}>
                      <p className="text-yellow-300 text-xs font-bold">
                        Saldo pendiente: C$ {fmt(Number(q.precioTotal) - Number(q.montoInicial))}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-white/60 text-xs block mb-1 font-sans">{esParcial ? "3" : "2"}. ¿Cuál es la fecha límite para cancelar {esParcial ? "el saldo" : "el pago total"}? *</label>
                <input type="date" style={gi} value={q.fechaLimite}
                  onChange={e => setQ({ ...q, fechaLimite: e.target.value })} />
              </div>

              <div>
                <label className="text-white/60 text-xs block mb-1 font-sans">{esParcial ? "4" : "3"}. ¿Cómo pagará {esParcial ? "el saldo restante" : "el monto total"}?</label>
                <select style={gi} value={q.formaPagoSaldo} onChange={e => setQ({ ...q, formaPagoSaldo: e.target.value })}>
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia bancaria</option>
                  <option value="CHEQUE">📋 Cheque</option>
                  <option value="DEPOSITO">🏧 Depósito bancario</option>
                </select>
              </div>

              <div>
                <label className="text-white/60 text-xs block mb-1 font-sans">{esParcial ? "5" : "4"}. ¿En cuántos pagos cancelará?</label>
                <select style={gi} value={q.cuotas} onChange={e => setQ({ ...q, cuotas: e.target.value })}>
                  <option value="1">Un solo pago</option>
                  <option value="2">2 pagos</option>
                  <option value="3">3 pagos</option>
                  <option value="4">4 pagos</option>
                  <option value="6">6 pagos mensuales</option>
                  <option value="12">12 pagos mensuales</option>
                </select>
              </div>

              {q.cuotas !== "1" && (
                <div>
                  <label className="text-white/60 text-xs block mb-1 font-sans">¿Cuánto es cada pago? (C$)</label>
                  <input type="number" style={gi} placeholder="Ej: 2500" value={q.montoCuota}
                    onChange={e => setQ({ ...q, montoCuota: e.target.value })} />
                </div>
              )}

              <div>
                <label className="text-white/60 text-xs block mb-1 font-sans">{esParcial ? "6" : "5"}. Si el comprador no paga en la fecha acordada, ¿qué sucede?</label>
                <select style={gi} value={q.consecuencia} onChange={e => setQ({ ...q, consecuencia: e.target.value })}>
                  <option value="RECUPERAR">🐄 El vendedor recupera el animal sin devolver el abono</option>
                  <option value="INTERES">💸 Se cobran intereses del 5% mensual sobre el saldo</option>
                  <option value="LEGAL">⚖️ El vendedor toma acciones legales para exigir el pago</option>
                  <option value="ACUERDO">🤝 Se resuelve ante la Autoridad Municipal</option>
                </select>
              </div>

              <div>
                <label className="text-white/60 text-xs block mb-1 font-sans">{esParcial ? "7" : "6"}. ¿En qué municipio/lugar se firma este documento? *</label>
                <input style={gi} placeholder="Ej: Municipio de Juigalpa, Chontales" value={q.lugar}
                  onChange={e => setQ({ ...q, lugar: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs block mb-1 font-sans">Testigo 1 (opcional)</label>
                  <input style={gi} placeholder="Nombre completo" value={q.testigo1}
                    onChange={e => setQ({ ...q, testigo1: e.target.value })} />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1 font-sans">Testigo 2 (opcional)</label>
                  <input style={gi} placeholder="Nombre completo" value={q.testigo2}
                    onChange={e => setQ({ ...q, testigo2: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-xs block mb-1 font-sans">¿Alguna condición especial adicional? (opcional)</label>
                <textarea style={{ ...gi, height: 70, resize: "none" }}
                  placeholder="Ej: El comprador no podrá trasladar el animal fuera del municipio hasta cancelar el saldo total..."
                  value={q.observacionExtra} onChange={e => setQ({ ...q, observacionExtra: e.target.value })} />
              </div>
            </div>

            {/* Validación antes de generar */}
            {(!q.precioTotal || !q.fechaLimite || (esParcial && !q.montoInicial)) && (
              <p className="mt-4 text-yellow-400 text-xs font-sans text-center">
                ⚠️ Completa los campos obligatorios (*) para generar la carta
              </p>
            )}

            <button
              disabled={!q.precioTotal || !q.fechaLimite || (esParcial && !q.montoInicial)}
              onClick={() => setMostrarCarta(true)}
              className="mt-4 w-full py-3 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
              📄 Generar Carta de Venta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CARTA ──
  const a = venta.animal || {};
  const fotoAnimal = a.media?.find(m => m.tipo === "FOTO")?.url;
  const fechaVenta = new Date(venta.fecha).toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" });
  const numCarta = `CV-${venta.id.slice(-8).toUpperCase()}`;
  const tipoLabel = venta.tipoVenta === "EN_PIE" ? "En Pie" : "Por Destace";
  const esPagado = venta.estadoPago === "PAGADO";
  const esParcial = venta.estadoPago === "PARCIAL";
  const fechaLimiteStr = q.fechaLimite ? new Date(q.fechaLimite + "T12:00:00").toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" }) : "___________________";
  // Usar precioTotal del cuestionario si fue ingresado, si no el registrado en el sistema
  const precioTotalNum = Number(q.precioTotal || venta.precioNIO);
  const montoInicialNum = Number(q.montoInicial || 0);
  const saldoNum = precioTotalNum - montoInicialNum;
  const precioTotalFmt = fmt(precioTotalNum);
  const montoInicialFmt = fmt(montoInicialNum);
  const saldoFmt = fmt(saldoNum);
  // USD aproximado usando tipo de cambio registrado
  const tc = venta.tipoCambio || 36.5;
  const precioTotalUSD = fmt(precioTotalNum / tc);

  return (
    <>
      {/* Barra de acciones */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => esPagado ? router.back() : setMostrarCarta(false)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
          ← {esPagado ? "Volver" : "Editar respuestas"}
        </button>
        <div className="flex-1"/>
        {!firmado
          ? <p className="text-amber-600 text-sm font-bold">✍️ Firma el documento antes de imprimir</p>
          : <p className="text-green-600 text-sm font-bold">✅ Documento firmado y listo</p>}
        <button onClick={() => window.print()}
          className="px-5 py-2 rounded-lg text-sm font-black text-white flex items-center gap-2"
          style={{ background: firmado ? "#145A32" : "#9ca3af" }}>
          🖨️ Imprimir / PDF
        </button>
      </div>

      {/* Documento */}
      <div className="min-h-screen bg-gray-100 pt-16 print:pt-0 print:bg-white pb-8 print:pb-0">
        <div className="max-w-[800px] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-full" style={{ fontFamily: "'Georgia', serif" }}>

          {/* Encabezado */}
          <div className="px-10 py-6" style={{ background: "linear-gradient(135deg,#145A32,#1E8449)" }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div style={{ position: "relative", width: 80, height: 64, overflow: "hidden" }}>
                  <img src="/logo-base.jpg" alt="Logo" style={{ width: 80, height: "auto", objectFit: "cover", objectPosition: "top", display: "block" }} />
                </div>
                <div>
                  <p className="text-green-200 text-xs font-sans tracking-widest uppercase mb-1">Gestión Ganadera</p>
                  <h1 className="text-white font-black text-3xl font-sans">{venta.finca?.nombre || "Finca Ganadera"}</h1>
                  {venta.finca?.ubicacion && <p className="text-green-300 text-sm mt-1 font-sans">{venta.finca.ubicacion}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-200 text-xs font-sans">No. de Carta</p>
                <p className="text-white font-black text-xl font-sans">{numCarta}</p>
                <p className="text-green-200 text-xs font-sans mt-1">{fechaVenta}</p>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center py-5 border-b-2" style={{ borderColor: "#145A32" }}>
            <h2 className="text-2xl font-black tracking-wide font-sans" style={{ color: "#145A32" }}>
              CARTA DE VENTA DE GANADO
            </h2>
            <p className="text-gray-500 text-sm mt-1 font-sans">
              {esPagado ? "Documento Legal de Transferencia de Propiedad"
                : esParcial ? "Documento de Compraventa con Pago Parcial"
                : "Promesa de Compraventa — Pago Pendiente"}
            </p>
            {q.lugar && <p className="text-gray-400 text-xs mt-0.5 font-sans">{q.lugar}</p>}
          </div>

          <div className="px-10 py-6 space-y-6">

            {/* Párrafo introductorio dinámico */}
            <div className="text-gray-700 text-sm leading-relaxed">
              {esPagado && (
                <p>
                  Por medio del presente documento, yo <strong>{venta.usuario?.nombre || "___________________"}</strong>,
                  en mi calidad de vendedor y propietario legítimo del animal descrito a continuación,
                  declaro haber recibido del señor(a) <strong>{venta.comprador || "___________________"}</strong>,
                  en concepto de compraventa la cantidad de <strong>C$ {fmt(venta.precioNIO)} córdobas netos
                  (USD ${fmt(venta.precioUSD)})</strong>, de los cuales me doy por bien pagado y satisfecho,
                  otorgando a favor del comprador la presente carta de venta, libre de todo gravamen.
                </p>
              )}
              {esParcial && (
                <p>
                  Por medio del presente documento, yo <strong>{venta.usuario?.nombre || "___________________"}</strong>,
                  en mi calidad de vendedor y propietario legítimo del animal descrito a continuación,
                  y el señor(a) <strong>{venta.comprador || "___________________"}</strong>, en calidad de comprador,
                  hacemos constar que hemos acordado la venta del referido animal por la suma total de{" "}
                  <strong>C$ {precioTotalFmt} (equivalente a USD ${precioTotalUSD} al tipo de cambio de C$ {tc} por dólar)</strong>.
                  El comprador ha entregado al vendedor un abono inicial de <strong>C$ {montoInicialFmt}</strong> en concepto de
                  anticipo, del cual el vendedor se da por recibido, quedando un saldo pendiente de{" "}
                  <strong>C$ {saldoFmt}</strong> que deberá ser cancelado a más tardar el día <strong>{fechaLimiteStr}</strong>,
                  mediante {FORMAS[q.formaPagoSaldo] || "la forma de pago acordada"}{q.cuotas !== "1" ? `, en ${q.cuotas} pagos${q.montoCuota ? ` de C$ ${fmt(Number(q.montoCuota))} cada uno` : ""}` : ""}.
                </p>
              )}
              {!esPagado && !esParcial && (
                <p>
                  Por medio del presente documento, yo <strong>{venta.usuario?.nombre || "___________________"}</strong>,
                  en mi calidad de vendedor y propietario legítimo del animal descrito a continuación,
                  y el señor(a) <strong>{venta.comprador || "___________________"}</strong>, en calidad de comprador,
                  suscribimos la presente promesa de compraventa por la suma total acordada de{" "}
                  <strong>C$ {precioTotalFmt} (equivalente a USD ${precioTotalUSD} al tipo de cambio de C$ {tc} por dólar)</strong>,
                  monto que el comprador se compromete a cancelar en su totalidad a más tardar el día{" "}
                  <strong>{fechaLimiteStr}</strong>, mediante {FORMAS[q.formaPagoSaldo] || "la forma acordada"}
                  {q.cuotas !== "1" ? `, en ${q.cuotas} pagos${q.montoCuota ? ` de C$ ${fmt(Number(q.montoCuota))} cada uno` : ""}` : ""}.
                  Hasta tanto no se efectúe el pago total, la propiedad legal del animal permanece a nombre del vendedor.
                </p>
              )}
            </div>

            {/* I. Animal */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                I. Descripción del Animal
              </h3>
              <div className="flex gap-5">
                {fotoAnimal && (
                  <div className="shrink-0">
                    <img src={fotoAnimal} alt="Animal" className="rounded-lg object-cover border-2 border-gray-200" style={{ width: 120, height: 100 }} />
                    <p className="text-gray-400 text-xs text-center mt-1 font-sans">Foto del animal</p>
                  </div>
                )}
                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ["Nombre / Alias", a.nombre || "—"],
                    ["Arete / Identificador", a.identificador || "—"],
                    ["Raza", a.raza || "Sin raza definida"],
                    ["Fierro / Marca", a.fierro || "Sin fierro"],
                    ["Sexo", a.sexo === "HEMBRA" ? "Hembra" : "Macho"],
                    ["Peso", venta.pesoKg ? `${venta.pesoKg} ${venta.unidadPeso || "KG"}` : "No especificado"],
                    ["Color / Descripción", a.observacion || "No especificado"],
                    ["Estado reproductivo", a.estadoReproductivo || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-1">
                      <span className="text-gray-500 font-sans shrink-0">{k}:</span>
                      <span className="font-bold font-sans text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* II. Condiciones */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                II. Condiciones de la Venta
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  ["Tipo de venta", tipoLabel],
                  ["Precio total en Córdobas", `C$ ${fmt(venta.precioNIO)}`],
                  ["Precio total en Dólares", `USD $${fmt(venta.precioUSD)}`],
                  ["Tipo de cambio", `C$ ${venta.tipoCambio} por USD`],
                  ["Método de pago", { EFECTIVO:"Efectivo", TRANSFERENCIA:"Transferencia Bancaria", CHEQUE:"Cheque", CREDITO:"Crédito" }[venta.metodoPago] || venta.metodoPago],
                  ["Estado del pago", { PAGADO:"Pagado en su totalidad", PENDIENTE:"Pendiente de pago", PARCIAL:"Pago parcial" }[venta.estadoPago]],
                  ["Precio total acordado", `C$ ${precioTotalFmt} (USD $${precioTotalUSD})`],
                  ...(esParcial ? [["Abono inicial recibido", `C$ ${montoInicialFmt}`]] : []),
                  ...(esParcial ? [["Saldo pendiente", `C$ ${saldoFmt}`]] : []),
                  ...(q.fechaLimite ? [["Fecha límite de pago", fechaLimiteStr]] : []),
                  ...(q.cuotas !== "1" ? [["Forma de pago del saldo", `${q.cuotas} cuotas de C$ ${fmt(q.montoCuota)} c/u`]] : []),
                  ...(venta.pesoKg ? [["Precio por unidad de peso", `C$ ${fmt(venta.precioKg)} / ${venta.unidadPeso || "KG"}`]] : []),
                  ...(venta.numeroFactura ? [["No. Factura", venta.numeroFactura]] : []),
                  ...(venta.descuento ? [["Descuento aplicado", `C$ ${fmt(venta.descuento)}`]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-1">
                    <span className="text-gray-500 font-sans shrink-0">{k}:</span>
                    <span className="font-bold font-sans text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              {venta.notas && (
                <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 font-sans font-bold uppercase mb-1">Notas adicionales:</p>
                  <p className="text-sm text-gray-700 font-sans">{venta.notas}</p>
                </div>
              )}
            </div>

            {/* III. Partes */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                III. Datos de las Partes
              </h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="rounded-lg p-4 border border-gray-200">
                  <p className="font-black text-xs uppercase tracking-widest font-sans mb-2" style={{ color: "#145A32" }}>Vendedor</p>
                  <p className="font-bold font-sans text-gray-800">{venta.usuario?.nombre || "—"}</p>
                  <p className="text-gray-500 font-sans text-xs mt-0.5">{venta.finca?.nombre}</p>
                  {venta.usuario?.email && <p className="text-gray-400 font-sans text-xs mt-0.5">{venta.usuario.email}</p>}
                </div>
                <div className="rounded-lg p-4 border border-gray-200">
                  <p className="font-black text-xs uppercase tracking-widest font-sans mb-2" style={{ color: "#145A32" }}>Comprador</p>
                  <p className="font-bold font-sans text-gray-800">{venta.comprador || "—"}</p>
                  {venta.telefonoComprador && <p className="text-gray-500 font-sans text-xs mt-0.5">Tel: {venta.telefonoComprador}</p>}
                  {venta.direccionComprador && <p className="text-gray-400 font-sans text-xs mt-0.5">{venta.direccionComprador}</p>}
                </div>
              </div>
            </div>

            {/* IV. Cláusulas */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                IV. Cláusulas y Condiciones
              </h3>
              <ol className="space-y-2 text-sm text-gray-600 font-sans list-decimal pl-5">

                <li>El vendedor declara ser el legítimo propietario del animal descrito y que éste se encuentra libre de todo gravamen, hipoteca, embargo o cualquier carga legal al momento de la firma del presente documento.</li>

                <li>El animal se transfiere en el estado físico y sanitario en que se encuentra al momento de la firma. El comprador declara haberlo inspeccionado y aceptarlo en dicho estado.</li>

                <li>El vendedor garantiza que el animal no ha sido reportado como robado, no se encuentra en litigio, ni tiene ningún impedimento legal que afecte su venta, traslado o registro a nombre del comprador.</li>

                {esPagado && <>
                  <li>El comprador ha cancelado la totalidad del monto pactado de <strong>C$ {fmt(venta.precioNIO)} (USD ${fmt(venta.precioUSD)})</strong> mediante {({ EFECTIVO:"pago en efectivo", TRANSFERENCIA:"transferencia bancaria", CHEQUE:"cheque", CREDITO:"crédito" }[venta.metodoPago] || venta.metodoPago)}, del cual el vendedor se da por recibido y satisfecho en su totalidad. Esta transacción se considera finiquitada y el vendedor renuncia a cualquier reclamo futuro sobre el monto convenido.</li>
                  <li>Con la cancelación total del precio acordado, la propiedad del animal se transfiere de manera inmediata, irrevocable y sin condición alguna al comprador desde la fecha de firma del presente documento.</li>
                  <li>Una vez suscrita esta carta de venta, el comprador asume plena responsabilidad sobre el animal, incluyendo enfermedades, accidentes, pérdidas o cualquier eventualidad posterior a su recepción.</li>
                </>}

                {esParcial && <>
                  <li>
                    El precio total acordado por el animal es de <strong>C$ {precioTotalFmt} (USD ${precioTotalUSD})</strong>.
                    El comprador ha entregado al vendedor la suma de <strong>C$ {montoInicialFmt}</strong> en concepto de abono inicial,
                    del cual el vendedor se da por recibido. El saldo pendiente es de <strong>C$ {saldoFmt}</strong>,
                    el cual deberá ser cancelado a más tardar el día <strong>{fechaLimiteStr}</strong>,
                    mediante {FORMAS[q.formaPagoSaldo] || "la forma acordada"}
                    {q.cuotas !== "1" ? `, dividido en ${q.cuotas} pagos${q.montoCuota ? ` de C$ ${fmt(Number(q.montoCuota))} cada uno` : ""}` : " en un solo pago"}.
                  </li>
                  <li>
                    Mientras el saldo de <strong>C$ {saldoFmt}</strong> no sea cancelado en su totalidad,
                    la propiedad legal del animal permanece a nombre del vendedor. El comprador podrá hacer uso del animal
                    pero no podrá venderlo, donarlo, pignorar ni trasladarlo fuera del municipio de{" "}
                    {q.lugar || "___________________"} sin autorización expresa y escrita del vendedor.
                  </li>
                  <li>
                    En caso de que el comprador incumpla con el pago del saldo restante en la fecha establecida,
                    {" "}{CONSECUENCIAS[q.consecuencia]}. El vendedor no estará obligado a devolver el abono inicial
                    de <strong>C$ {montoInicialFmt}</strong> ya recibido, salvo acuerdo expreso y por escrito entre ambas partes.
                  </li>
                  <li>
                    Una vez que el comprador cancele la totalidad del saldo de <strong>C$ {saldoFmt}</strong>,
                    el vendedor se compromete a extender una carta de venta definitiva y transferir la propiedad
                    plena del animal, sin costo adicional, dentro de los tres días hábiles siguientes al pago.
                  </li>
                </>}

                {!esPagado && !esParcial && <>
                  <li>
                    La presente carta constituye una promesa formal de compraventa. El precio total acordado por el animal
                    es de <strong>C$ {precioTotalFmt} (USD ${precioTotalUSD})</strong>. El comprador se compromete
                    a cancelar dicho monto en su totalidad a más tardar el día <strong>{fechaLimiteStr}</strong>,
                    mediante {FORMAS[q.formaPagoSaldo] || "la forma acordada"}
                    {q.cuotas !== "1" ? `, en ${q.cuotas} pagos${q.montoCuota ? ` de C$ ${fmt(Number(q.montoCuota))} cada uno` : ""}` : " en un solo pago"}.
                  </li>
                  <li>
                    Hasta que se efectúe el pago íntegro de <strong>C$ {precioTotalFmt}</strong>, la propiedad
                    legal del animal permanece exclusivamente a nombre del vendedor. El comprador no podrá venderlo,
                    donarlo, trasladarlo fuera del municipio ni pignorar el animal bajo ningún concepto, sin la
                    autorización previa y por escrito del vendedor.
                  </li>
                  <li>
                    En caso de que el comprador no realice el pago total en la fecha pactada del{" "}
                    <strong>{fechaLimiteStr}</strong>, {CONSECUENCIAS[q.consecuencia]}.
                    Esta cláusula será exigible sin necesidad de trámite judicial previo si ambas partes así
                    lo acuerdan ante la Autoridad Municipal.
                  </li>
                  <li>
                    Una vez recibido el pago completo de <strong>C$ {precioTotalFmt}</strong>, el vendedor
                    extenderá de inmediato la carta de venta definitiva y transferirá la propiedad plena e
                    irrevocable del animal al comprador.
                  </li>
                </>}

                {q.observacionExtra && (
                  <li><strong>Condición especial acordada por las partes:</strong> {q.observacionExtra}</li>
                )}

                <li>El presente documento se firma en {q.lugar || "el lugar indicado"}, en presencia de la Autoridad Municipal correspondiente{(q.testigo1 || q.testigo2) ? ` y de los testigos ${[q.testigo1, q.testigo2].filter(Boolean).join(" y ")}` : ""}, quienes dan fe de la legalidad y voluntariedad del acto, otorgándole plena validez legal dentro del territorio.</li>

                <li>Cualquier disputa derivada del presente acuerdo que no pueda resolverse entre las partes será sometida a la jurisdicción de los tribunales competentes de la República de Nicaragua, conforme a las leyes vigentes.</li>
              </ol>
            </div>

            {/* V. Firmas */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                V. Firmas y Certificación
              </h3>

              {!firmado && (
                <div className="print:hidden mb-5 p-4 rounded-xl border-2 border-dashed border-green-300 bg-green-50">
                  <p className="text-sm font-bold text-green-800 mb-2 font-sans">✍️ Firma del Vendedor — dibuja tu firma aquí:</p>
                  <canvas ref={canvasRef} width={500} height={100}
                    className="bg-white rounded-lg border border-gray-300 w-full touch-none cursor-crosshair"
                    style={{ maxHeight: 100 }}
                    onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
                    onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={limpiarFirma} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-white border border-gray-300 font-sans">🗑️ Limpiar</button>
                    {hayFirma && <button onClick={confirmarFirma} className="px-4 py-1.5 rounded-lg text-xs font-black text-white font-sans" style={{ background: "#145A32" }}>✅ Confirmar firma</button>}
                  </div>
                </div>
              )}

              {/* Vendedor y Comprador */}
              <div className="grid grid-cols-2 gap-10 mt-4">
                <div className="text-center">
                  <div className="h-20 border-b-2 border-gray-400 flex items-end justify-center pb-1 mb-2 relative">
                    {firmaSrc && <img src={firmaSrc} alt="Firma" className="h-16 object-contain absolute bottom-1"/>}
                  </div>
                  <p className="font-bold text-sm font-sans text-gray-800">{venta.usuario?.nombre || "___________________"}</p>
                  <p className="text-xs font-black font-sans text-gray-500">VENDEDOR</p>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">{venta.finca?.nombre}</p>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">Fecha: {fechaVenta}</p>
                </div>
                <div className="text-center">
                  <div className="h-20 border-b-2 border-gray-400 mb-2"/>
                  <p className="font-bold text-sm font-sans text-gray-800">{venta.comprador || "___________________"}</p>
                  <p className="text-xs font-black font-sans text-gray-500">COMPRADOR</p>
                  {venta.telefonoComprador && <p className="text-xs text-gray-400 font-sans mt-0.5">Tel: {venta.telefonoComprador}</p>}
                  <p className="text-xs text-gray-400 font-sans mt-0.5">Fecha: ___________________</p>
                </div>
              </div>

              {/* Testigos si los hay */}
              {(q.testigo1 || q.testigo2) && (
                <div className="grid grid-cols-2 gap-10 mt-8">
                  {[q.testigo1, q.testigo2].map((t, i) => t ? (
                    <div key={i} className="text-center">
                      <div className="h-16 border-b-2 border-gray-300 mb-2"/>
                      <p className="font-bold text-sm font-sans text-gray-800">{t}</p>
                      <p className="text-xs font-black font-sans text-gray-400">TESTIGO {i + 1}</p>
                      <p className="text-xs text-gray-400 font-sans mt-0.5">Fecha: ___________________</p>
                    </div>
                  ) : <div key={i}/>)}
                </div>
              )}

              {/* Autoridad Municipal */}
              <div className="mt-8 flex justify-center">
                <div className="text-center w-72">
                  <div className="h-20 border-b-2 border-gray-400 mb-2"/>
                  <p className="font-bold text-sm font-sans text-gray-800">___________________</p>
                  <p className="text-xs font-black font-sans mt-0.5" style={{ color: "#145A32" }}>AUTORIDAD MUNICIPAL / TESTIGO OFICIAL</p>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">Cargo: ___________________</p>
                  <p className="text-xs text-gray-400 font-sans mt-1">Sello:</p>
                  <div className="mt-1 mx-auto rounded-full border-2 border-dashed border-gray-300" style={{ width: 56, height: 56 }}/>
                  <p className="text-xs text-gray-400 font-sans mt-1">Fecha: ___________________</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 font-sans text-center mt-5 italic">
                En fe de lo cual, las partes firman el presente documento en {q.lugar || "el lugar indicado"} el día {fechaVenta}, en presencia de la Autoridad Municipal quien certifica la legalidad del acto.
              </p>
            </div>

            {/* Pie */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 font-sans">Documento generado el {new Date().toLocaleDateString("es-NI", { day:"numeric", month:"long", year:"numeric" })} · {numCarta} · GanaderoSG</p>
              <p className="text-xs text-gray-300 font-sans mt-0.5">ganaderosg.app · Sistema de Gestión Ganadera</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
