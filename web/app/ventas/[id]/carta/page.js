"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CartaVentaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firmado, setFirmado] = useState(false);
  const [firmaSrc, setFirmaSrc] = useState(null);
  const [dibujando, setDibujando] = useState(false);
  const [hayFirma, setHayFirma] = useState(false);
  const canvasRef = useRef(null);
  const lastPos = useRef(null);

  useEffect(() => {
    api(`/ventas/${id}`)
      .then(d => setVenta(d))
      .catch(() => router.push("/ventas"))
      .finally(() => setLoading(false));
  }, [id]);

  // Canvas firma
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onStart(e) {
    e.preventDefault();
    setDibujando(true);
    setHayFirma(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
  }

  function onMove(e) {
    e.preventDefault();
    if (!dibujando) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
  }

  function onEnd(e) { e.preventDefault(); setDibujando(false); }

  function limpiarFirma() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHayFirma(false);
    setFirmado(false);
    setFirmaSrc(null);
  }

  function confirmarFirma() {
    const canvas = canvasRef.current;
    setFirmaSrc(canvas.toDataURL("image/png"));
    setFirmado(true);
  }

  function imprimir() { window.print(); }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 font-medium">Generando carta de venta...</p>
      </div>
    </div>
  );

  if (!venta) return null;

  const a = venta.animal || {};
  const fotoAnimal = a.media?.find(m => m.tipo === "FOTO")?.url;
  const fechaVenta = new Date(venta.fecha).toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" });
  const numCarta = `CV-${venta.id.slice(-8).toUpperCase()}`;
  const tipoLabel = venta.tipoVenta === "EN_PIE" ? "En Pie" : "Por Destace";

  const fmt = (n) => Number(n || 0).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* Botones de acción — NO se imprimen */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
          ← Volver
        </button>
        <div className="flex-1"/>
        {!firmado ? (
          <p className="text-amber-600 text-sm font-bold">✍️ Firma el documento antes de imprimir</p>
        ) : (
          <p className="text-green-600 text-sm font-bold">✅ Documento firmado</p>
        )}
        <button onClick={imprimir}
          className="px-5 py-2 rounded-lg text-sm font-black text-white flex items-center gap-2 transition-all"
          style={{ background: firmado ? "#145A32" : "#9ca3af" }}>
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>

      {/* Documento */}
      <div className="min-h-screen bg-gray-100 pt-16 print:pt-0 print:bg-white pb-8 print:pb-0">
        <div id="carta" className="max-w-[800px] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-full"
          style={{ fontFamily: "'Georgia', serif" }}>

          {/* Encabezado verde */}
          <div className="px-10 py-6 print:py-5" style={{ background: "linear-gradient(135deg,#145A32,#1E8449)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-200 text-xs font-sans tracking-widest uppercase mb-1">Gestión Ganadera</p>
                <h1 className="text-white font-black text-3xl" style={{ fontFamily: "sans-serif" }}>
                  {venta.finca?.nombre || "Finca Ganadera"}
                </h1>
                {venta.finca?.ubicacion && <p className="text-green-300 text-sm mt-1 font-sans">{venta.finca.ubicacion}</p>}
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
            <h2 className="text-2xl font-black tracking-wide" style={{ color: "#145A32", fontFamily: "sans-serif" }}>
              CARTA DE VENTA DE GANADO
            </h2>
            <p className="text-gray-500 text-sm mt-1 font-sans">Documento Legal de Transferencia de Propiedad</p>
          </div>

          <div className="px-10 py-6 space-y-6">

            {/* Párrafo introductorio */}
            <div className="text-gray-700 text-sm leading-relaxed">
              <p>
                Por medio del presente documento, yo <strong>{venta.usuario?.nombre || "___________________"}</strong>,
                en mi calidad de vendedor y propietario legítimo del animal descrito a continuación,
                declaro haber recibido del señor(a) <strong>{venta.comprador || "___________________"}</strong>,
                en concepto de compraventa la cantidad de <strong>C$ {fmt(venta.precioNIO)} córdobas netos
                (USD ${fmt(venta.precioUSD)})</strong>, de los cuales me doy por bien pagado y satisfecho,
                otorgando a favor del comprador la presente carta de venta, libre de todo gravamen.
              </p>
            </div>

            {/* Animal + Foto */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                I. Descripción del Animal
              </h3>
              <div className="flex gap-5">
                {fotoAnimal && (
                  <div className="shrink-0">
                    <img src={fotoAnimal} alt="Animal" className="rounded-lg object-cover border-2 border-gray-200"
                      style={{ width: 120, height: 100 }} />
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

            {/* Condiciones de la venta */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                II. Condiciones de la Venta
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  ["Tipo de venta", tipoLabel],
                  ["Precio en Córdobas", `C$ ${fmt(venta.precioNIO)}`],
                  ["Precio en Dólares", `USD $${fmt(venta.precioUSD)}`],
                  ["Tipo de cambio", `C$ ${venta.tipoCambio} por USD`],
                  ["Método de pago", { EFECTIVO:"Efectivo", TRANSFERENCIA:"Transferencia Bancaria", CHEQUE:"Cheque", CREDITO:"Crédito" }[venta.metodoPago] || venta.metodoPago],
                  ["Estado del pago", { PAGADO:"✅ Pagado en su totalidad", PENDIENTE:"⏳ Pendiente de pago", PARCIAL:"🔶 Pago parcial" }[venta.estadoPago] || venta.estadoPago],
                  ...(venta.pesoKg ? [["Precio por unidad de peso", `C$ ${fmt(venta.precioKg)} / ${venta.unidadPeso || "KG"}`]] : []),
                  ...(venta.numeroFactura ? [["No. Factura", venta.numeroFactura]] : []),
                  ...(venta.descuento ? [["Descuento aplicado", `C$ ${fmt(venta.descuento)}`]] : []),
                  ...(venta.comision ? [["Comisión", `C$ ${fmt(venta.comision)}`]] : []),
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

            {/* Partes */}
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

            {/* Cláusulas según estado de pago */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                IV. Cláusulas y Condiciones
              </h3>
              <ol className="space-y-2 text-sm text-gray-600 font-sans list-decimal pl-5">
                <li>El vendedor declara ser el legítimo propietario del animal descrito y que éste se encuentra libre de todo gravamen, hipoteca, embargo o cualquier otra carga legal al momento de la firma del presente documento.</li>
                <li>El animal se transfiere en el estado físico y sanitario en que se encuentra al momento de la firma. El comprador declara haber inspeccionado el animal y aceptarlo en dicho estado.</li>
                <li>Una vez suscrita esta carta de venta, el comprador asume plena responsabilidad sobre el animal, incluyendo enfermedades, accidentes, pérdidas o cualquier eventualidad posterior a la entrega.</li>
                <li>El vendedor garantiza que el animal no ha sido reportado como robado, no se encuentra en litigio, ni tiene ningún impedimento legal que afecte su venta, traslado o registro a nombre del comprador.</li>
                {venta.estadoPago === "PAGADO" && <>
                  <li>El comprador ha cancelado la totalidad del monto pactado de <strong>C$ {fmt(venta.precioNIO)} (USD ${fmt(venta.precioUSD)})</strong> mediante {({ EFECTIVO:"pago en efectivo", TRANSFERENCIA:"transferencia bancaria", CHEQUE:"cheque", CREDITO:"crédito" }[venta.metodoPago] || venta.metodoPago)}, del cual el vendedor se da por recibido y satisfecho en su totalidad al momento de la firma. Esta transacción se considera finiquitada y el vendedor renuncia a cualquier reclamo futuro sobre el monto convenido.</li>
                  <li>Con la cancelación total del precio, la propiedad del animal se transfiere de manera inmediata, irrevocable y sin condición alguna al comprador desde la fecha de firma del presente documento.</li>
                </>}
                {venta.estadoPago === "PARCIAL" && <>
                  <li>El comprador ha realizado un pago parcial de la transacción. El monto total convenido es de <strong>C$ {fmt(venta.precioNIO)} (USD ${fmt(venta.precioUSD)})</strong>. El saldo pendiente deberá ser cancelado en los términos y plazos acordados verbalmente entre las partes o mediante documento complementario. El incumplimiento del pago del saldo dará derecho al vendedor a reclamar el monto adeudado o a revertir la transacción.</li>
                  <li>El vendedor hace entrega del animal al comprador con la condición expresa de que el saldo restante sea cancelado en su totalidad. En caso de incumplimiento, el vendedor se reserva el derecho de recuperar el animal o exigir el pago mediante las vías legales correspondientes.</li>
                </>}
                {venta.estadoPago === "PENDIENTE" && <>
                  <li>La presente carta de venta se suscribe como constancia del acuerdo comercial entre las partes. El pago total de <strong>C$ {fmt(venta.precioNIO)} (USD ${fmt(venta.precioUSD)})</strong> se encuentra pendiente de cancelación. El comprador se compromete formalmente a realizar el pago completo en los términos convenidos. Este documento tiene validez como promesa de compraventa hasta que se efectúe el pago total.</li>
                  <li>La transferencia definitiva de propiedad del animal quedará sujeta al pago íntegro del monto pactado. Mientras no se realice dicho pago, el vendedor conserva el derecho legal de propiedad sobre el animal. El incumplimiento faculta al vendedor a recuperar el animal sin responsabilidad legal adicional.</li>
                </>}
                <li>Cualquier disputa derivada de la presente transacción será resuelta de buena fe entre las partes. De no llegarse a un acuerdo, se someterá a la jurisdicción y leyes vigentes de la República de Nicaragua, reconociendo ambas partes la competencia de los tribunales del domicilio del vendedor.</li>
                <li>El presente documento se firma en presencia de la Autoridad Municipal correspondiente, quien actúa como testigo oficial y da fe de la legalidad y voluntariedad del acto, otorgando plena validez legal a esta transacción dentro del territorio.</li>
              </ol>
            </div>

            {/* Firmas */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 font-sans" style={{ color: "#145A32", borderBottom: "2px solid #145A32", paddingBottom: 4 }}>
                V. Firmas y Certificación
              </h3>

              {/* Canvas firma digital — solo en pantalla */}
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
                    <button onClick={limpiarFirma} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 font-sans">
                      🗑️ Limpiar
                    </button>
                    {hayFirma && (
                      <button onClick={confirmarFirma} className="px-4 py-1.5 rounded-lg text-xs font-black text-white font-sans" style={{ background: "#145A32" }}>
                        ✅ Confirmar firma
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Fila 1: Vendedor y Comprador */}
              <div className="grid grid-cols-2 gap-10 mt-4">
                <div className="text-center">
                  <div className="h-20 border-b-2 border-gray-400 flex items-end justify-center pb-1 mb-2 relative">
                    {firmaSrc && <img src={firmaSrc} alt="Firma vendedor" className="h-16 object-contain absolute bottom-1"/>}
                  </div>
                  <p className="font-bold text-sm font-sans text-gray-800">{venta.usuario?.nombre || "___________________"}</p>
                  <p className="text-xs text-gray-500 font-sans font-bold">VENDEDOR</p>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">{venta.finca?.nombre}</p>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">Fecha: {fechaVenta}</p>
                </div>
                <div className="text-center">
                  <div className="h-20 border-b-2 border-gray-400 mb-2"/>
                  <p className="font-bold text-sm font-sans text-gray-800">{venta.comprador || "___________________"}</p>
                  <p className="text-xs text-gray-500 font-sans font-bold">COMPRADOR</p>
                  {venta.telefonoComprador && <p className="text-xs text-gray-400 font-sans mt-0.5">Tel: {venta.telefonoComprador}</p>}
                  <p className="text-xs text-gray-400 font-sans mt-0.5">Fecha: ___________________</p>
                </div>
              </div>

              {/* Fila 2: Autoridad Municipal — centrada */}
              <div className="mt-8 flex justify-center">
                <div className="text-center w-72">
                  <div className="h-20 border-b-2 border-gray-400 mb-2"/>
                  <p className="font-bold text-sm font-sans text-gray-800">___________________</p>
                  <p className="text-xs font-black font-sans mt-0.5" style={{ color: "#145A32" }}>AUTORIDAD MUNICIPAL / TESTIGO OFICIAL</p>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">Cargo: ___________________</p>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">Sello:</p>
                  <div className="mt-1 mx-auto rounded-full border-2 border-dashed border-gray-300" style={{ width: 56, height: 56 }}/>
                  <p className="text-xs text-gray-400 font-sans mt-1">Fecha: ___________________</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 font-sans text-center mt-5 italic">
                En fe de lo cual, las partes firman el presente documento en el lugar y fecha indicados, en presencia de la Autoridad Municipal quien certifica la legalidad del acto.
              </p>
            </div>

            {/* Pie del documento */}
            <div className="text-center pt-4 mt-2 border-t border-gray-200">
              <p className="text-xs text-gray-400 font-sans">
                Documento generado el {new Date().toLocaleDateString("es-NI", { day:"numeric", month:"long", year:"numeric" })} · {numCarta} · GanaderoSG
              </p>
              <p className="text-xs text-gray-300 font-sans mt-0.5">ganaderosg.app · Sistema de Gestión Ganadera</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
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
