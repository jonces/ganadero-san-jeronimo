"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "💵 Efectivo", color: "#2d9e3f" },
  { value: "TRANSFERENCIA", label: "🏦 Transferencia", color: "#3182ce" },
  { value: "CHEQUE", label: "📋 Cheque", color: "#718096" },
  { value: "CREDITO", label: "💳 Crédito", color: "#805ad5" },
];

const ESTADOS_PAGO = [
  { value: "PAGADO", label: "✅ Pagado", color: "#2d9e3f" },
  { value: "PENDIENTE", label: "⏳ Pendiente", color: "#e53e3e" },
  { value: "PARCIAL", label: "🔶 Parcial", color: "#d69e2e" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

export default function VentasPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [stats, setStats] = useState(null);
  const [tipoCambio, setTipoCambio] = useState(36.5);
  const [editTC, setEditTC] = useState(false);
  const [nuevoTC, setNuevoTC] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({
    animalId: "", tipoVenta: "EN_PIE", moneda: "NIO",
    precioOriginal: "", pesoKg: "", unidadPeso: "LB", precioKg: "",
    metodoPago: "EFECTIVO", estadoPago: "PAGADO",
    numeroFactura: "", comision: "", descuento: "", impuestos: "",
    comprador: "", telefonoComprador: "", direccionComprador: "",
    notas: "", fecha: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    try {
      const [v, a, s] = await Promise.all([api("/ventas"), api("/animales"), api("/ventas/stats")]);
      setVentas(v);
      setAnimales(a.filter((x) => x.estado === "ACTIVO"));
      setStats(s);
      setTipoCambio(s.tipoCambio);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, []);

  const precioNum = Number(form.precioOriginal) || 0;
  const precioNIO = form.moneda === "USD" ? precioNum * tipoCambio : precioNum;
  const precioUSD = form.moneda === "USD" ? precioNum : precioNum / tipoCambio;

  async function handleTC() {
    try {
      await api("/ventas/tipo-cambio", { method: "PATCH", body: { tipoCambio: Number(nuevoTC) } });
      setTipoCambio(Number(nuevoTC));
      setEditTC(false);
    } catch (err) { setError(err.message); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      Array.from(archivos).forEach((f) => fd.append("archivos", f));
      const res = await fetch(`${API_URL}/ventas`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setShowForm(false);
      setArchivos([]);
      setForm({ animalId: "", tipoVenta: "EN_PIE", moneda: "NIO", precioOriginal: "", pesoKg: "", precioKg: "", metodoPago: "EFECTIVO", estadoPago: "PAGADO", numeroFactura: "", comision: "", descuento: "", impuestos: "", comprador: "", telefonoComprador: "", direccionComprador: "", notas: "", fecha: new Date().toISOString().slice(0, 10) });
      load();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  const colorEstado = { PAGADO: "#2d9e3f", PENDIENTE: "#e53e3e", PARCIAL: "#d69e2e" };
  const labelEstado = { PAGADO: "✅ Pagado", PENDIENTE: "⏳ Pendiente", PARCIAL: "🔶 Parcial" };

  return (
    <AppLayout title="💰 Ventas" subtitle="Control de ventas de ganado">
      {/* Stats strip */}
      {stats && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {[
            { label: "Ventas del mes", val: stats.ventas.cantidadMes, unit: "animales", grad: "linear-gradient(135deg,#7b4f12,#d69e2e)" },
            { label: "Total NIO", val: `C$ ${(stats.ventas.totalMesNIO).toLocaleString("es", { maximumFractionDigits: 0 })}`, grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" },
            { label: "Total USD", val: `$ ${(stats.ventas.totalMesUSD).toLocaleString("es", { maximumFractionDigits: 0 })}`, grad: "linear-gradient(135deg,#1a4a8a,#3182ce)" },
            { label: "Histórico", val: `C$ ${(stats.ventas.totalHistoricoNIO).toLocaleString("es", { maximumFractionDigits: 0 })}`, grad: "linear-gradient(135deg,#44337a,#805ad5)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl px-4 py-3 text-white shrink-0 shadow-xl"
              style={{ background: s.grad, border: "1px solid rgba(255,255,255,0.2)", minWidth: 130 }}>
              <p className="font-black text-lg leading-none">{s.val}</p>
              <p className="text-xs opacity-75 mt-1">{s.label}</p>
              {s.unit && <p className="text-xs opacity-60">{s.unit}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto pb-10">
        {error && <p className="text-red-600 mb-4 bg-red-50 rounded-xl p-3 text-sm">{error}</p>}

        {/* Tipo de cambio */}
        <div className="bg-white rounded-2xl shadow-md px-5 py-4 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💱</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">Tipo de cambio</p>
              <p className="text-gray-400 text-xs">C$ por USD</p>
            </div>
          </div>
          {editTC ? (
            <div className="flex items-center gap-2">
              <input type="number" value={nuevoTC} onChange={(e) => setNuevoTC(e.target.value)}
                className="border-2 border-yellow-400 rounded-xl px-3 py-2 w-28 font-bold text-center focus:outline-none" />
              <button onClick={handleTC} className="text-white px-3 py-2 rounded-xl font-bold text-sm" style={{ background: "#2d9e3f" }}>Guardar</button>
              <button onClick={() => setEditTC(false)} className="text-gray-500 text-sm">✕</button>
            </div>
          ) : (
            <button onClick={() => { setNuevoTC(tipoCambio); setEditTC(true); }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-lg hover:opacity-80 transition-opacity"
              style={{ background: "#fef3c7", color: "#92400e" }}>
              C$ {tipoCambio} <span className="text-sm font-normal">✏️</span>
            </button>
          )}
        </div>

        {/* Botón nueva venta */}
        <button onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-2xl py-4 font-black text-lg mb-5 flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90"
          style={{ background: showForm ? "#718096" : "linear-gradient(135deg,#7b4f12,#d69e2e)" }}>
          {showForm ? "✕ Cancelar" : "＋ Registrar Nueva Venta"}
        </button>

        {/* FORMULARIO */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
            {/* Header form */}
            <div className="px-6 py-4" style={{ background: "linear-gradient(135deg,#7b4f12,#d69e2e)" }}>
              <h2 className="text-white font-black text-lg">Nueva Transacción de Venta</h2>
              <p className="text-yellow-200 text-xs mt-1">Completa los datos de la venta</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sección: Animal y tipo */}
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-black" style={{ background: "#d69e2e" }}>1</span>
                  Animal y Tipo de Venta
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Animal *</label>
                    <select className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                      value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })} required>
                      <option value="">— Selecciona el animal —</option>
                      {animales.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre ? `${a.nombre} (${a.identificador})` : a.identificador}{a.raza ? ` · ${a.raza}` : ""}{a.pesoActual ? ` · ${a.pesoActual}kg` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "EN_PIE", label: "🐄 En Pie", sub: "Sin destrazar", color: "#2d9e3f" },
                      { value: "POR_PESO", label: "⚖️ Por Peso", sub: "Destazado", color: "#e53e3e" },
                    ].map((t) => (
                      <button type="button" key={t.value} onClick={() => setForm({ ...form, tipoVenta: t.value })}
                        className="rounded-xl py-3 px-3 text-sm font-bold text-white transition-all border-2"
                        style={{
                          background: form.tipoVenta === t.value ? t.color : "#fff",
                          color: form.tipoVenta === t.value ? "#fff" : t.color,
                          borderColor: t.color,
                        }}>
                        <div>{t.label}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>{t.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Sección: Precio y moneda */}
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-black" style={{ background: "#d69e2e" }}>2</span>
                  Precio y Moneda
                </h3>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { value: "NIO", label: "🇳🇮 Córdoba (NIO)" },
                    { value: "USD", label: "🇺🇸 Dólar (USD)" },
                  ].map((m) => (
                    <button type="button" key={m.value} onClick={() => setForm({ ...form, moneda: m.value })}
                      className="rounded-xl py-2 text-sm font-bold transition-all border-2"
                      style={{
                        background: form.moneda === m.value ? "#d69e2e" : "#fff",
                        color: form.moneda === m.value ? "#fff" : "#92400e",
                        borderColor: "#d69e2e",
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Precio Total ({form.moneda}) *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400">
                      {form.moneda === "NIO" ? "C$" : "$"}
                    </span>
                    <input type="number" step="0.01"
                      className="w-full border-2 border-gray-100 rounded-xl p-3 pl-10 mt-0 focus:border-yellow-400 focus:outline-none bg-gray-50 text-xl font-black"
                      placeholder="0.00" value={form.precioOriginal}
                      onChange={(e) => setForm({ ...form, precioOriginal: e.target.value })} required />
                  </div>
                  {precioNum > 0 && (
                    <div className="mt-2 rounded-xl p-3 flex items-center justify-between"
                      style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>
                      <div>
                        <p className="text-xs text-yellow-700 font-semibold">Equivalente automático</p>
                        <p className="font-black text-yellow-900 text-lg">C$ {precioNIO.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-yellow-700 font-semibold">≈ USD</p>
                        <p className="font-black text-yellow-900 text-lg">$ {precioUSD.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  )}
                </div>

                {form.tipoVenta === "POR_PESO" && (
                  <div className="space-y-3 mt-3">
                    {/* Selector de unidad */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Unidad de peso</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { value: "LB", label: "🇳🇮 Libras (lb)", sub: "Más usado en Nicaragua" },
                          { value: "KG", label: "🌎 Kilogramos (kg)", sub: "Internacional" },
                        ].map((u) => (
                          <button type="button" key={u.value}
                            onClick={() => setForm({ ...form, unidadPeso: u.value })}
                            className="rounded-xl py-2 px-3 text-sm font-bold transition-all border-2 text-left"
                            style={{
                              background: form.unidadPeso === u.value ? "#d69e2e" : "#fff",
                              color: form.unidadPeso === u.value ? "#fff" : "#92400e",
                              borderColor: "#d69e2e",
                            }}>
                            <div>{u.label}</div>
                            <div style={{ fontSize: 10, opacity: 0.75 }}>{u.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Peso ({form.unidadPeso === "LB" ? "libras" : "kg"})</label>
                        <input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                          placeholder={form.unidadPeso === "LB" ? "Ej: 900 lb" : "Ej: 420 kg"}
                          value={form.pesoKg} onChange={(e) => setForm({ ...form, pesoKg: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Precio/{form.unidadPeso === "LB" ? "lb" : "kg"} ({form.moneda})</label>
                        <input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                          placeholder={form.unidadPeso === "LB" ? "Ej: C$ 18/lb" : "Ej: C$ 40/kg"}
                          value={form.precioKg} onChange={(e) => setForm({ ...form, precioKg: e.target.value })} />
                      </div>
                    </div>
                    {form.pesoKg && form.unidadPeso === "LB" && (
                      <p className="text-xs text-gray-400">
                        ≈ {(Number(form.pesoKg) / 2.205).toFixed(1)} kg · {(Number(form.pesoKg) * 0.4536).toFixed(1)} kg exactos
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { key: "comision", label: "Comisión (C$)", placeholder: "0" },
                    { key: "descuento", label: "Descuento (C$)", placeholder: "0" },
                    { key: "impuestos", label: "Impuestos (C$)", placeholder: "0" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs font-bold text-gray-500 uppercase">{f.label}</label>
                      <input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                        placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Sección: Pago */}
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-black" style={{ background: "#d69e2e" }}>3</span>
                  Método y Estado de Pago
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {METODOS_PAGO.map((m) => (
                      <button type="button" key={m.value} onClick={() => setForm({ ...form, metodoPago: m.value })}
                        className="rounded-xl py-2 px-3 text-sm font-bold transition-all border-2"
                        style={{
                          background: form.metodoPago === m.value ? m.color : "#fff",
                          color: form.metodoPago === m.value ? "#fff" : m.color,
                          borderColor: m.color,
                        }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {ESTADOS_PAGO.map((s) => (
                      <button type="button" key={s.value} onClick={() => setForm({ ...form, estadoPago: s.value })}
                        className="rounded-xl py-2 px-2 text-xs font-bold transition-all border-2"
                        style={{
                          background: form.estadoPago === s.value ? s.color : "#fff",
                          color: form.estadoPago === s.value ? "#fff" : s.color,
                          borderColor: s.color,
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Nº de Factura</label>
                      <input className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                        placeholder="FAC-001" value={form.numeroFactura} onChange={(e) => setForm({ ...form, numeroFactura: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Fecha de Venta</label>
                      <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                        value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Sección: Comprador */}
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-black" style={{ background: "#d69e2e" }}>4</span>
                  Datos del Comprador
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nombre del comprador</label>
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                      placeholder="Nombre completo" value={form.comprador} onChange={(e) => setForm({ ...form, comprador: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                      <input className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                        placeholder="+505 8888-0000" value={form.telefonoComprador} onChange={(e) => setForm({ ...form, telefonoComprador: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Dirección</label>
                      <input className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50"
                        placeholder="Ciudad, País" value={form.direccionComprador} onChange={(e) => setForm({ ...form, direccionComprador: e.target.value })} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Sección: Documentos y obs */}
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-black" style={{ background: "#d69e2e" }}>5</span>
                  Observaciones y Evidencia
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Observaciones</label>
                    <textarea className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 focus:border-yellow-400 focus:outline-none bg-gray-50 resize-none"
                      placeholder="Notas, condiciones, acuerdos especiales..." rows={3}
                      value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                    <p className="text-2xl mb-1">📎</p>
                    <p className="text-gray-500 text-sm font-medium">Documentos y fotos de la venta</p>
                    <p className="text-gray-400 text-xs mb-2">Carta de venta, comprobante, fotos</p>
                    <input type="file" multiple accept="image/*,.pdf"
                      onChange={(e) => setArchivos(e.target.files)}
                      className="text-sm text-gray-500" />
                    {archivos.length > 0 && (
                      <p className="text-green-600 text-xs mt-2 font-medium">✓ {archivos.length} archivo(s) seleccionado(s)</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Botón submit */}
              <button disabled={enviando} type="submit"
                className="w-full text-white rounded-2xl py-4 font-black text-lg shadow-lg disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#7b4f12,#d69e2e)" }}>
                {enviando ? "Registrando venta..." : "✓ Confirmar Venta"}
              </button>
            </div>
          </form>
        )}

        {/* Lista de ventas */}
        <div className="space-y-4">
          {ventas.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Header tarjeta */}
              <div className="px-5 py-3 flex items-center justify-between"
                style={{ background: v.tipoVenta === "EN_PIE" ? "linear-gradient(135deg,#1a6b2a,#2d9e3f)" : "linear-gradient(135deg,#9b2626,#e53e3e)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm">{v.tipoVenta === "EN_PIE" ? "🐄 En Pie" : "⚖️ Por Peso"}</span>
                  <span className="text-white opacity-60 text-xs">·</span>
                  <span className="text-white opacity-80 text-xs">{new Date(v.fecha).toLocaleDateString("es", { dateStyle: "medium" })}</span>
                </div>
                <span className="text-white text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: colorEstado[v.estadoPago] || "#718096" }}>
                  {labelEstado[v.estadoPago]}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-gray-800 text-xl">{v.animal?.nombre || v.animal?.identificador}</p>
                    <p className="text-sm text-gray-500">{v.animal?.raza || "Sin raza"} · Arete: {v.animal?.identificador}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-2xl" style={{ color: "#d69e2e" }}>C$ {v.precioNIO.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-gray-400">≈ USD $ {v.precioUSD.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {v.comprador && <p className="text-gray-600">👤 <span className="font-medium">{v.comprador}</span></p>}
                  {v.telefonoComprador && <p className="text-gray-600">📞 {v.telefonoComprador}</p>}
                  {v.pesoKg && <p className="text-gray-600">⚖️ {v.pesoKg} {v.unidadPeso || "lb"}{v.precioKg ? ` · C$${v.precioKg}/${v.unidadPeso === "KG" ? "kg" : "lb"}` : ""}</p>}
                  {v.numeroFactura && <p className="text-gray-600">🧾 {v.numeroFactura}</p>}
                  <p className="text-gray-600">💳 {v.metodoPago}</p>
                  <p className="text-gray-600">💱 TC: C$ {v.tipoCambio}</p>
                </div>

                {v.notas && <p className="text-xs text-gray-400 mt-2 border-t pt-2">📝 {v.notas}</p>}

                {v.media?.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {v.media.map((m) => (
                      <a key={m.id} href={m.url} target="_blank" rel="noreferrer">
                        <img src={m.url} className="w-full h-16 object-cover rounded-xl" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {ventas.length === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">💰</div>
            <p className="text-gray-500 text-lg font-bold">Aún no hay ventas registradas</p>
            <p className="text-gray-400 text-sm mt-1">Registra tu primera venta de ganado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
