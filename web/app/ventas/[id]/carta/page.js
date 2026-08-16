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
  const esPorPeso = venta.tipoVenta === "POR_PESO";
  const esPagado = venta.estadoPago === "PAGADO";
  const esParcial = venta.estadoPago === "PARCIAL";
  const fotoAnimal = a.media?.find(m => m.tipo === "FOTO")?.url;
  const fechaVenta = new Date(venta.fecha).toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" });
  const tc = venta.tipoCambio || 36.5;
  const precioTotalNum = Number(q.precioTotal || venta.precioNIO);
  const montoInicialNum = Number(q.montoInicial || 0);
  const saldoNum = precioTotalNum - montoInicialNum;
  const precioTotalFmt = fmt(precioTotalNum);
  const montoInicialFmt = fmt(montoInicialNum);
  const saldoFmt = fmt(saldoNum);
  const precioTotalUSD = fmt(precioTotalNum / tc);
  const fechaLimiteStr = q.fechaLimite ? new Date(q.fechaLimite + "T12:00:00").toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" }) : "___________________";

  const numCarta = venta.numeroCarta
    ? `CV-${new Date(venta.fecha).getFullYear()}-${String(venta.numeroCarta).padStart(6, "0")}`
    : `CV-${venta.id.slice(-8).toUpperCase()}`;

  const metodoPagoLabel = { EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia bancaria", CHEQUE: "Cheque", CREDITO: "Crédito" }[venta.metodoPago] || venta.metodoPago;
  const estadoPagoLabel = esPagado ? "Pagado en su totalidad" : esParcial ? "Pago parcial" : "Pendiente de pago";

  const rendimientoStr = venta.pesoVivo && venta.pesoKg
    ? `${((venta.pesoKg / venta.pesoVivo) * 100).toFixed(2)}%`
    : "No disponible";

  function categoriaDisplay(an) {
    if (an.categoria) {
      const map = { CRIA: "Cría", TERNERO: "Ternero", TERNERA: "Ternera", TORO: "Toro", VACA: "Vaca", SEMENTAL: "Semental" };
      return map[an.categoria] || an.categoria;
    }
    if (!an.fechaNacimiento) return an.sexo === "HEMBRA" ? "Vaca" : "Toro";
    const meses = Math.floor((Date.now() - new Date(an.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 30));
    if (meses < 6) return "Cría";
    if (an.sexo === "HEMBRA") return meses < 24 ? "Ternera" : "Vaca";
    return meses < 24 ? "Ternero" : "Toro";
  }
  function edadDisplay(an) {
    if (!an.fechaNacimiento) return "No registrada";
    const meses = Math.floor((Date.now() - new Date(an.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 30));
    if (meses < 12) return `${meses} meses`;
    const años = Math.floor(meses / 12);
    return `${años} año${años !== 1 ? "s" : ""}`;
  }

  // Color palette based on tipoVenta
  const C = esPorPeso ? {
    primary: "#4E1D0E",
    secondary: "#784212",
    accent: "#D4AC0D",
    light: "#FDF3E7",
    sectionBar: "#4E1D0E",
    badgeBg: "#784212",
    badgeText: "#F9E79F",
    border: "#F0D9B5",
  } : {
    primary: "#145A32",
    secondary: "#1E8449",
    accent: "#D4AC0D",
    light: "#E9F7EF",
    sectionBar: "#145A32",
    badgeBg: "#145A32",
    badgeText: "#F9E79F",
    border: "#AED6F1",
  };

  function SectionTitle({ num, title }) {
    return (
      <div style={{ background: C.sectionBar, color: "#fff", padding: "6px 28px", marginBottom: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, fontFamily: "sans-serif", margin: 0 }}>
          {num}. {title.toUpperCase()}
        </p>
      </div>
    );
  }

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
          style={{ background: firmado ? C.primary : "#9ca3af" }}>
          🖨️ Imprimir / PDF
        </button>
      </div>

      {/* Panel firma (print:hidden) */}
      {!firmado && (
        <div className="print:hidden fixed bottom-0 left-0 right-0 z-40 p-4 border-t border-green-200"
          style={{ background: "#f0fdf4" }}>
          <p className="text-sm font-bold mb-2" style={{ color: C.primary }}>✍️ Firma del Vendedor — dibuja tu firma aquí:</p>
          <canvas ref={canvasRef} width={600} height={80}
            className="bg-white rounded-lg border w-full touch-none cursor-crosshair"
            style={{ maxHeight: 80, borderColor: C.secondary }}
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={limpiarFirma} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-white border border-gray-300">🗑️ Limpiar</button>
            {hayFirma && <button onClick={confirmarFirma} className="px-4 py-1.5 rounded-lg text-xs font-black text-white" style={{ background: C.primary }}>✅ Confirmar firma</button>}
          </div>
        </div>
      )}

      {/* Documento */}
      <div className="min-h-screen bg-gray-100 pt-16 print:pt-0 print:bg-white pb-32 print:pb-0">
        <div className="max-w-[816px] mx-auto bg-white shadow-2xl print:shadow-none">

          {/* ENCABEZADO */}
          <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, padding: "16px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img src="/logo-base.jpg" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "2px solid rgba(255,255,255,0.3)" }} alt="Logo" />
                <div>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", margin: 0 }}>GESTIÓN GANADERA</p>
                  <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 900, margin: "2px 0", fontFamily: "sans-serif" }}>{venta.finca?.nombre || "GANADERÍA"}</h1>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: "sans-serif", margin: 0 }}>📍 {venta.finca?.ubicacion || "Nicaragua"}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontFamily: "sans-serif", margin: "0 0 4px" }}>No. de Carta</p>
                <div style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 6, padding: "6px 14px", display: "inline-block" }}>
                  <p style={{ color: "#fff", fontWeight: 900, fontSize: 15, fontFamily: "monospace", margin: 0 }}>{numCarta}</p>
                </div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: "sans-serif", margin: "6px 0 0" }}>Fecha: {fechaVenta}</p>
              </div>
            </div>
          </div>

          {/* TÍTULO Y BADGE */}
          <div style={{ textAlign: "center", padding: "16px 28px 12px", borderBottom: `2px solid ${C.primary}` }}>
            <h2 style={{ color: C.primary, fontSize: 20, fontWeight: 900, letterSpacing: 2, fontFamily: "sans-serif", margin: "0 0 8px" }}>
              CARTA DE VENTA DE GANADO
            </h2>
            <div style={{ display: "inline-block", background: C.sectionBar, color: C.badgeText, padding: "4px 20px", borderRadius: 20, fontSize: 11, fontWeight: 900, fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 8 }}>
              {esPorPeso ? "VENTA POR PESO (DESTAZADO)" : "VENTA EN PIE"}
            </div>
            <p style={{ color: "#666", fontSize: 11, fontFamily: "sans-serif", margin: 0 }}>
              {esPorPeso ? "Documento de Compraventa y Liquidación por Peso" : "Documento de Compraventa y Transferencia de Ganado"}
            </p>
            {q.lugar && <p style={{ color: "#999", fontSize: 10, fontFamily: "sans-serif", margin: "4px 0 0" }}>{q.lugar}</p>}
          </div>

          {/* PÁRRAFO INTRODUCTORIO */}
          <div style={{ padding: "12px 28px", background: C.light, borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 10.5, lineHeight: 1.6, color: "#333", fontFamily: "Georgia, serif", margin: 0 }}>
              {esPagado && <>
                Por medio del presente documento, yo <strong>{venta.usuario?.nombre || "___________________"}</strong>,
                en mi calidad de vendedor y propietario legítimo del animal descrito a continuación,
                declaro haber recibido del señor(a) <strong>{venta.comprador || "___________________"}</strong>,
                en concepto de compraventa la cantidad de <strong>C$ {fmt(venta.precioNIO)} córdobas netos (USD ${fmt(venta.precioUSD)})</strong>,
                de los cuales me doy por bien pagado y satisfecho, otorgando a favor del comprador la presente carta de venta, libre de todo gravamen.
              </>}
              {esParcial && <>
                Por medio del presente documento, yo <strong>{venta.usuario?.nombre || "___________________"}</strong>,
                en mi calidad de vendedor y propietario legítimo del animal descrito a continuación,
                y el señor(a) <strong>{venta.comprador || "___________________"}</strong>, en calidad de comprador,
                hacemos constar que hemos acordado la venta del referido animal por la suma total de{" "}
                <strong>C$ {precioTotalFmt} (equivalente a USD ${precioTotalUSD} al tipo de cambio de C$ {tc} por dólar)</strong>.
                El comprador ha entregado un abono inicial de <strong>C$ {montoInicialFmt}</strong>, quedando un saldo pendiente de{" "}
                <strong>C$ {saldoFmt}</strong> que deberá ser cancelado a más tardar el día <strong>{fechaLimiteStr}</strong>,
                mediante {FORMAS[q.formaPagoSaldo] || "la forma de pago acordada"}{q.cuotas !== "1" ? `, en ${q.cuotas} pagos${q.montoCuota ? ` de C$ ${fmt(Number(q.montoCuota))} cada uno` : ""}` : ""}.
              </>}
              {!esPagado && !esParcial && <>
                Por medio del presente documento, yo <strong>{venta.usuario?.nombre || "___________________"}</strong>,
                en mi calidad de vendedor y propietario legítimo del animal descrito a continuación,
                y el señor(a) <strong>{venta.comprador || "___________________"}</strong>, en calidad de comprador,
                suscribimos la presente promesa de compraventa por la suma total acordada de{" "}
                <strong>C$ {precioTotalFmt} (equivalente a USD ${precioTotalUSD} al tipo de cambio de C$ {tc} por dólar)</strong>,
                monto que el comprador se compromete a cancelar en su totalidad a más tardar el día{" "}
                <strong>{fechaLimiteStr}</strong>, mediante {FORMAS[q.formaPagoSaldo] || "la forma acordada"}
                {q.cuotas !== "1" ? `, en ${q.cuotas} pagos${q.montoCuota ? ` de C$ ${fmt(Number(q.montoCuota))} cada uno` : ""}` : ""}.
                Hasta tanto no se efectúe el pago total, la propiedad legal del animal permanece a nombre del vendedor.
              </>}
            </p>
          </div>

          {/* SECCIÓN I - ANIMAL */}
          <SectionTitle num="I" title="Descripción del Animal" />
          <div style={{ padding: "14px 28px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ width: 120, flexShrink: 0 }}>
                {fotoAnimal
                  ? <img src={fotoAnimal} style={{ width: 120, height: 96, objectFit: "cover", borderRadius: 6, border: `2px solid ${C.border}` }} alt="Animal" />
                  : <div style={{ width: 120, height: 96, background: C.light, borderRadius: 6, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🐄</div>
                }
                <p style={{ fontSize: 9, color: "#999", textAlign: "center", margin: "4px 0 0", fontFamily: "sans-serif" }}>Foto del animal</p>
              </div>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {[
                  ["🐄 Arete / Identificador", a.identificador || "No registrado"],
                  ["⚥ Sexo", a.sexo === "HEMBRA" ? "Hembra" : "Macho"],
                  ["🏷 Nombre / Alias", a.nombre || "—"],
                  ["🔥 Fierro / Marca", a.fierro || "—"],
                  ["🐂 Categoría", categoriaDisplay(a)],
                  esPorPeso
                    ? ["⚖️ Peso vivo estimado", venta.pesoVivo ? `${venta.pesoVivo} lb` : "No registrado"]
                    : ["⚖️ Peso aproximado", venta.pesoKg ? `${venta.pesoKg} lb` : "No registrado"],
                  ["🧬 Raza", a.raza || "No registrada"],
                  ["❤️ Estado reproductivo", a.estadoReproductivo || "—"],
                  ["🎨 Color / Descripción", a.observacion || "No especificado"],
                  ["📅 Edad aproximada", edadDisplay(a)],
                  ["🏡 Finca de procedencia", venta.finca?.nombre || "No registrada"],
                  ["📍 Comunidad / Municipio", venta.finca?.ubicacion || "No registrada"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 9.5, color: "#666", fontFamily: "sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>{label}:</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#222", fontFamily: "sans-serif" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN II - CONDICIONES */}
          <SectionTitle num="II" title={esPorPeso ? "Pesaje y Liquidación" : "Condiciones de la Venta"} />
          {esPorPeso ? (
            <div style={{ padding: "14px 28px", display: "grid", gridTemplateColumns: "1fr auto", gap: 20, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px 0" }}>
                {[
                  ["Modalidad de venta", "Por Peso (Destazado)"],
                  ["Peso canal / Destazado", `${venta.pesoKg || 0} lb`],
                  ["Precio por libra", `C$ ${fmt(venta.precioKg)}`],
                  ["Rendimiento estimado", rendimientoStr],
                  ["Fecha de pesaje", fechaVenta],
                  ["Lugar de pesaje", venta.finca?.nombre || "—"],
                  ["Método de pago", metodoPagoLabel],
                  ["Estado del pago", estadoPagoLabel],
                  ["Tipo de cambio utilizado", `C$ ${tc} por USD`],
                  ...(venta.notas ? [["Observaciones", venta.notas]] : []),
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 6, padding: "3px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <span style={{ fontSize: 9.5, color: "#666", fontFamily: "sans-serif", flexShrink: 0 }}>{k}:</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: k === "Estado del pago" && esPagado ? "#1a8c4e" : "#222", fontFamily: "sans-serif" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ width: 200, background: "#f8f9fa", border: `2px solid ${C.primary}`, borderRadius: 8, padding: "12px", flexShrink: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: C.primary, fontFamily: "sans-serif", margin: "0 0 8px", textAlign: "center", letterSpacing: 1 }}>CÁLCULO DE LA VENTA</p>
                <div style={{ fontSize: 9.5, fontFamily: "sans-serif", color: "#333" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>Peso vendido (lb)</span>
                    <span style={{ fontWeight: 700 }}>{venta.pesoKg || 0}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>× Precio por lb (C$)</span>
                    <span style={{ fontWeight: 700 }}>{fmt(venta.precioKg)}</span>
                  </div>
                  <div style={{ borderTop: "1px solid #ddd", paddingTop: 4, marginTop: 4 }}>
                    {[
                      ["Subtotal", `C$ ${fmt(precioTotalNum)}`],
                      ["Descuento", `C$ ${fmt(venta.descuento || 0)}`],
                      ["Comisión", `C$ ${fmt(venta.comision || 0)}`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span>{k}:</span><span style={{ fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: C.primary, color: "#fff", padding: "8px", borderRadius: 4, marginTop: 8, textAlign: "center" }}>
                    <p style={{ fontSize: 9, margin: "0 0 2px", opacity: 0.8 }}>TOTAL A PAGAR:</p>
                    <p style={{ fontSize: 13, fontWeight: 900, margin: "0 0 2px" }}>C$ {fmt(precioTotalNum)}</p>
                    <p style={{ fontSize: 9, margin: 0, opacity: 0.8 }}>USD ${fmt(precioTotalNum / tc)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "14px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", borderBottom: `1px solid ${C.border}` }}>
              {[
                ["Tipo de venta", "En Pie (Animal Vivo)"],
                ["Método de pago", metodoPagoLabel],
                ["Cantidad de animales", "1"],
                ["Estado del pago", estadoPagoLabel],
                ["Precio total acordado", `C$ ${fmt(precioTotalNum)}`],
                ["Lugar de entrega", venta.finca?.nombre || "No especificado"],
                ["Equivalente en USD", `USD $${fmt(precioTotalNum / tc)}`],
                ["Fecha de entrega", fechaVenta],
                ["Tipo de cambio utilizado", `C$ ${tc} por USD`],
                ...(esParcial ? [["Abono inicial recibido", `C$ ${montoInicialFmt}`]] : []),
                ...(esParcial ? [["Saldo pendiente", `C$ ${saldoFmt}`]] : []),
                ...(q.fechaLimite ? [["Fecha límite de pago", fechaLimiteStr]] : []),
                ["Observaciones", venta.notas || "Ninguna"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 6, padding: "3px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 9.5, color: "#666", fontFamily: "sans-serif", flexShrink: 0 }}>{k}:</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: k === "Estado del pago" && esPagado ? "#1a8c4e" : "#222", fontFamily: "sans-serif" }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* SECCIÓN III - PARTES */}
          <SectionTitle num="III" title="Datos de las Partes" />
          <div style={{ padding: "14px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderBottom: `1px solid ${C.border}` }}>
            {[
              {
                role: "VENDEDOR",
                icon: "🤝",
                nombre: venta.usuario?.nombre || "—",
                id: venta.vendedorIdentificacion || "—",
                tel: venta.vendedorTelefono || venta.usuario?.email || "—",
                dir: venta.vendedorDireccion || venta.finca?.ubicacion || "—",
                showFirma: true,
              },
              {
                role: "COMPRADOR",
                icon: "🤝",
                nombre: venta.comprador || "—",
                id: venta.compradorIdentificacion || "—",
                tel: venta.telefonoComprador || "—",
                dir: venta.direccionComprador || "—",
                showFirma: false,
              },
            ].map(p => (
              <div key={p.role} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontSize: 10, fontWeight: 900, color: C.primary, fontFamily: "sans-serif", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{p.icon}</span> {p.role}
                </p>
                {[
                  ["👤 Nombre", p.nombre],
                  ["🪪 Identificación", p.id],
                  ["📞 Teléfono", p.tel],
                  ["📍 Dirección", p.dir],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: "#666", fontFamily: "sans-serif", flexShrink: 0 }}>{k}:</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#222", fontFamily: "sans-serif" }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, borderTop: "1.5px solid #888", paddingTop: 2 }}>
                  <p style={{ fontSize: 9, color: "#666", fontFamily: "sans-serif", margin: 0 }}>Firma:</p>
                  {p.showFirma && firmaSrc && (
                    <img src={firmaSrc} style={{ height: 40, objectFit: "contain", display: "block", marginTop: 4 }} alt="Firma vendedor" />
                  )}
                  {(!p.showFirma || !firmaSrc) && (
                    <div style={{ height: 36, borderBottom: "1px solid #555", marginTop: 4 }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SECCIÓN IV - CLÁUSULAS */}
          <SectionTitle num="IV" title="Cláusulas y Condiciones" />
          <div style={{ padding: "12px 28px", borderBottom: `1px solid ${C.border}` }}>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 9.5, lineHeight: 1.6, color: "#444", fontFamily: "Georgia, serif" }}>
              <li style={{ marginBottom: 6 }}>El vendedor declara ser el legítimo propietario del animal descrito y que éste se encuentra libre de todo gravamen, hipoteca, embargo o cualquier carga legal al momento de la firma del presente documento.</li>
              <li style={{ marginBottom: 6 }}>El animal se transfiere en el estado físico y sanitario en que se encuentra al momento de la firma. El comprador declara haberlo inspeccionado y aceptarlo en dicho estado.</li>
              <li style={{ marginBottom: 6 }}>
                {esPorPeso
                  ? "El vendedor declara la procedencia del animal identificado en este documento. El comprador acepta la operación bajo la modalidad de venta por peso y reconoce como base de liquidación el peso y precio unitario consignados en esta carta. Una vez cancelado el monto total, todos los derechos sobre el producto vendido se transfieren al comprador."
                  : "El vendedor garantiza la legítima propiedad del animal y declara que el mismo se encuentra libre de todo gravamen, embargo o litigio. El comprador recibe el animal en el estado físico y sanitario en que se encuentra al momento de la entrega, asumiendo a partir de esta fecha toda responsabilidad sobre el mismo."}
              </li>
              {esPagado && <>
                <li style={{ marginBottom: 6 }}>El comprador ha cancelado la totalidad del monto pactado de <strong>C$ {fmt(venta.precioNIO)} (USD ${fmt(venta.precioUSD)})</strong> mediante {metodoPagoLabel.toLowerCase()}, del cual el vendedor se da por recibido y satisfecho. Esta transacción se considera finiquitada.</li>
                <li style={{ marginBottom: 6 }}>Con la cancelación total del precio acordado, la propiedad del animal se transfiere de manera inmediata, irrevocable y sin condición alguna al comprador desde la fecha de firma del presente documento.</li>
              </>}
              {esParcial && <>
                <li style={{ marginBottom: 6 }}>El precio total acordado es de <strong>C$ {precioTotalFmt}</strong>. El comprador ha entregado un abono inicial de <strong>C$ {montoInicialFmt}</strong>, quedando un saldo pendiente de <strong>C$ {saldoFmt}</strong> que deberá ser cancelado a más tardar el día <strong>{fechaLimiteStr}</strong>{q.cuotas !== "1" ? `, en ${q.cuotas} pagos${q.montoCuota ? ` de C$ ${fmt(Number(q.montoCuota))} cada uno` : ""}` : " en un solo pago"}, mediante {FORMAS[q.formaPagoSaldo] || "la forma acordada"}.</li>
                <li style={{ marginBottom: 6 }}>Mientras el saldo no sea cancelado en su totalidad, la propiedad legal del animal permanece a nombre del vendedor. En caso de incumplimiento, {CONSECUENCIAS[q.consecuencia]}.</li>
              </>}
              {!esPagado && !esParcial && <>
                <li style={{ marginBottom: 6 }}>El comprador se compromete a cancelar la suma de <strong>C$ {precioTotalFmt}</strong> a más tardar el día <strong>{fechaLimiteStr}</strong>{q.cuotas !== "1" ? `, en ${q.cuotas} pagos${q.montoCuota ? ` de C$ ${fmt(Number(q.montoCuota))} c/u` : ""}` : ""}, mediante {FORMAS[q.formaPagoSaldo] || "la forma acordada"}. Hasta el pago total, la propiedad permanece a nombre del vendedor.</li>
                <li style={{ marginBottom: 6 }}>En caso de incumplimiento en la fecha pactada, {CONSECUENCIAS[q.consecuencia]}.</li>
              </>}
              {!esPagado && <li style={{ marginBottom: 6 }}>El comprador se compromete a realizar el pago en los términos acordados, entendiendo que la propiedad legal del animal no se transfiere hasta la cancelación total del monto pactado.</li>}
              {q.observacionExtra && <li style={{ marginBottom: 6 }}><strong>Condición especial:</strong> {q.observacionExtra}</li>}
              <li style={{ marginBottom: 6 }}>El presente documento se firma en {q.lugar || "el lugar indicado"}, en presencia de la Autoridad Municipal{(q.testigo1 || q.testigo2) ? ` y de los testigos ${[q.testigo1, q.testigo2].filter(Boolean).join(" y ")}` : ""}, quienes dan fe de la legalidad y voluntariedad del acto.</li>
              <li>Cualquier disputa derivada del presente acuerdo será sometida a la jurisdicción de los tribunales competentes de la República de Nicaragua, conforme a las leyes vigentes.</li>
            </ol>
          </div>

          {/* SECCIÓN V - TESTIGO */}
          <SectionTitle num="V" title="Testigo y Certificación" />
          <div style={{ padding: "12px 28px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
              {["Nombre", "Cargo", "Firma"].map(label => (
                <div key={label}>
                  <p style={{ fontSize: 9, color: "#666", fontFamily: "sans-serif", margin: "0 0 2px" }}>{label}:</p>
                  <div style={{ borderBottom: "1px solid #888", width: 150, height: 20 }} />
                </div>
              ))}
              <div>
                <p style={{ fontSize: 9, color: "#666", fontFamily: "sans-serif", margin: "0 0 2px" }}>Sello:</p>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: "1.5px dashed #999" }} />
              </div>
              <div>
                <p style={{ fontSize: 9, color: "#666", fontFamily: "sans-serif", margin: "0 0 2px" }}>Fecha:</p>
                <p style={{ fontSize: 9.5, fontFamily: "sans-serif", color: "#555" }}>____/____/________</p>
              </div>
            </div>
            {(q.testigo1 || q.testigo2) && (
              <div style={{ display: "flex", gap: 40, marginTop: 16 }}>
                {[q.testigo1, q.testigo2].map((t, i) => t ? (
                  <div key={i}>
                    <div style={{ borderBottom: "1px solid #888", width: 150, height: 30, marginBottom: 4 }} />
                    <p style={{ fontSize: 9, color: "#333", fontFamily: "sans-serif", margin: 0 }}>{t}</p>
                    <p style={{ fontSize: 8, color: "#999", fontFamily: "sans-serif", margin: 0 }}>TESTIGO {i + 1}</p>
                  </div>
                ) : null)}
              </div>
            )}
            <p style={{ fontSize: 9, color: "#666", fontFamily: "Georgia, serif", marginTop: 12, fontStyle: "italic" }}>
              En fe de lo cual, las partes firman el presente documento en {q.lugar || "el lugar indicado"} el día {fechaVenta}.
            </p>
          </div>

          {/* FOOTER */}
          <div style={{ background: C.primary, padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontFamily: "sans-serif", margin: 0 }}>
              Documento generado el {new Date().toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 9, fontFamily: "sans-serif", margin: 0, textAlign: "center" }}>
              GanaderoSG — Sistema de Gestión Ganadera
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontFamily: "sans-serif", margin: 0 }}>
              ganaderosg.app · {numCarta}
            </p>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: letter portrait; margin: 0.5cm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
