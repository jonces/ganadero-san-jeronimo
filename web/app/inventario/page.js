"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcularEdad(fechaNac) {
  if (!fechaNac) return "—";
  const hoy = new Date(), nac = new Date(fechaNac);
  let años = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (meses < 0) { años--; meses += 12; }
  if (años > 0) return `${años} año${años > 1 ? "s" : ""} ${meses > 0 ? `${meses} mes${meses > 1 ? "es" : ""}` : ""}`;
  return `${meses} mes${meses > 1 ? "es" : ""}`;
}

function categoriaAnimal(a) {
  if (!a.fechaNacimiento) {
    return a.sexo === "HEMBRA" ? "Vaca" : "Toro";
  }
  const meses = Math.floor((Date.now() - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 30));
  if (a.sexo === "HEMBRA") {
    if (meses < 6) return "Ternera";
    if (meses < 24) return "Novilla";
    return "Vaca";
  } else {
    if (meses < 6) return "Ternero";
    if (meses < 24) return "Novillo";
    return "Toro";
  }
}

const ESTADO_CONFIG = {
  ACTIVO:   { label: "Activo",   color: "#16a34a", bg: "rgba(22,163,74,0.15)" },
  VENDIDO:  { label: "Vendido",  color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
  MUERTO:   { label: "Muerto",   color: "#dc2626", bg: "rgba(220,38,38,0.15)" },
  ELIMINADO:{ label: "Eliminado",color: "#dc2626", bg: "rgba(220,38,38,0.15)" },
};

const COMERCIAL_CONFIG = {
  NO_DISPONIBLE:    { label: "Sin publicar",      color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
  EN_VENTA:         { label: "En venta",           color: "#2563eb", bg: "rgba(37,99,235,0.15)" },
  RESERVADO:        { label: "Reservado",          color: "#ea580c", bg: "rgba(234,88,12,0.15)" },
  VENTA_EN_PROCESO: { label: "Venta en proceso",   color: "#d97706", bg: "rgba(217,119,6,0.15)" },
  VENTA_COMPLETADA: { label: "Venta completada",   color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
};

const glass = { background: "rgba(5,25,12,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.18)" };
const gi = { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" };

function Badge({ text, color, bg }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}40`, borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function IconAnimal() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
}
function IconX() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconSearch() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function IconChevron() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;
}

const TABS = [
  { key: "TODOS", label: "Todos" },
  { key: "ACTIVO", label: "Activos" },
  { key: "EN_VENTA", label: "En venta" },
  { key: "RESERVADO", label: "Reservados" },
  { key: "VENDIDO", label: "Vendidos" },
  { key: "BAJA", label: "Bajas" },
];

const OPCIONES_PAGINA = [25, 50, 100];

// ─── Modal Poner en venta ─────────────────────────────────────────────────────
function ModalPonerEnVenta({ animal, onClose, onSuccess }) {
  const [form, setForm] = useState({ precio: "", moneda: "NIO", modalidad: "TOTAL", descripcion: "", negociable: false, publicada: true, whatsapp: "", ubicacion: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/animales/${animal.id}/poner-en-venta`, { method: "POST", body: form });
      onSuccess();
      onClose();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl p-6 space-y-3 shadow-2xl" style={glass}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-xl">Poner en venta</h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white"><IconX /></button>
        </div>
        <p className="text-white/60 text-sm">{animal.nombre || animal.identificador}</p>
        {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-xl p-2">{error}</p>}
        <div>
          <label className="text-white/50 text-xs">Precio *</label>
          <input type="number" required className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi}
            value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-white/50 text-xs">Moneda</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
              <option value="NIO">NIO (C$)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className="text-white/50 text-xs">Modalidad</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}>
              <option value="TOTAL">Precio total</option>
              <option value="POR_KG">Por kg</option>
              <option value="POR_LIBRA">Por libra</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-white/50 text-xs">Descripcion</label>
          <textarea className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} rows={2}
            value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div>
          <label className="text-white/50 text-xs">WhatsApp de contacto</label>
          <input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi}
            value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="negociable" checked={form.negociable} onChange={e => setForm({ ...form, negociable: e.target.checked })} />
          <label htmlFor="negociable" className="text-white/70 text-sm">Precio negociable</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="publicada" checked={form.publicada} onChange={e => setForm({ ...form, publicada: e.target.checked })} />
          <label htmlFor="publicada" className="text-white/70 text-sm">Publicar en web de ventas</label>
        </div>
        <button type="submit" disabled={loading} className="w-full text-white font-black py-3 rounded-2xl disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)" }}>
          {loading ? "Guardando..." : "Poner en venta"}
        </button>
      </form>
    </div>
  );
}

// ─── Modal Reservar ───────────────────────────────────────────────────────────
function ModalReservar({ animal, onClose, onSuccess }) {
  const [form, setForm] = useState({ cliente: "", telefono: "", precioAcordado: animal.publicacion?.precio || "", adelanto: "", metodoPago: "EFECTIVO", fechaVencimiento: "", notas: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/reservas", { method: "POST", body: { ...form, animalId: animal.id } });
      onSuccess();
      onClose();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl p-6 space-y-3 shadow-2xl" style={glass}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-xl">Registrar reserva</h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white"><IconX /></button>
        </div>
        <p className="text-white/60 text-sm">{animal.nombre || animal.identificador}</p>
        {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-xl p-2">{error}</p>}
        <div>
          <label className="text-white/50 text-xs">Cliente *</label>
          <input required className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
        </div>
        <div>
          <label className="text-white/50 text-xs">Telefono</label>
          <input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-white/50 text-xs">Precio acordado *</label>
            <input type="number" required className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.precioAcordado} onChange={e => setForm({ ...form, precioAcordado: e.target.value })} />
          </div>
          <div>
            <label className="text-white/50 text-xs">Adelanto</label>
            <input type="number" className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.adelanto} onChange={e => setForm({ ...form, adelanto: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-white/50 text-xs">Metodo de pago adelanto</label>
          <select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
        <div>
          <label className="text-white/50 text-xs">Fecha de vencimiento</label>
          <input type="date" className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.fechaVencimiento} onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })} />
        </div>
        <div>
          <label className="text-white/50 text-xs">Notas</label>
          <textarea className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="w-full text-white font-black py-3 rounded-2xl disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)" }}>
          {loading ? "Guardando..." : "Registrar reserva"}
        </button>
      </form>
    </div>
  );
}

// ─── Modal Completar Venta ────────────────────────────────────────────────────
function ModalCompletarVenta({ animal, onClose, onSuccess }) {
  const [form, setForm] = useState({
    tipoVenta: "EN_PIE", moneda: "NIO", tipoCambio: "36.5",
    precioNIO: animal.publicacion?.precio || "", precioUSD: "",
    pesoKg: "", unidadPeso: "LB", precioKg: "",
    metodoPago: "EFECTIVO", estadoPago: "PAGADO",
    comprador: "", telefonoComprador: "", notas: "",
    fechaSalida: "", pesoFinal: "", adelantoAplicado: "0", saldoPendiente: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function calcUSD() {
    if (form.precioNIO && form.tipoCambio) {
      const usd = (Number(form.precioNIO) / Number(form.tipoCambio)).toFixed(2);
      setForm(f => ({ ...f, precioUSD: usd }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/animales/${animal.id}/completar-venta`, { method: "POST", body: form });
      onSuccess();
      onClose();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-3 shadow-2xl overflow-y-auto" style={{ ...glass, maxHeight: "90vh" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-xl">Completar venta</h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white"><IconX /></button>
        </div>
        <p className="text-white/60 text-sm">{animal.nombre || animal.identificador}</p>
        {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-xl p-2">{error}</p>}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-white/50 text-xs">Tipo de venta</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.tipoVenta} onChange={e => setForm({ ...form, tipoVenta: e.target.value })}>
              <option value="EN_PIE">En pie</option>
              <option value="POR_PESO">Por peso</option>
            </select>
          </div>
          <div>
            <label className="text-white/50 text-xs">Moneda</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
              <option value="NIO">NIO (C$)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-white/50 text-xs">Precio NIO (C$) *</label>
            <input type="number" required className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi}
              value={form.precioNIO} onChange={e => setForm({ ...form, precioNIO: e.target.value })} onBlur={calcUSD} />
          </div>
          <div>
            <label className="text-white/50 text-xs">Precio USD ($) *</label>
            <input type="number" required className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi}
              value={form.precioUSD} onChange={e => setForm({ ...form, precioUSD: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-white/50 text-xs">Comprador</label>
          <input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.comprador} onChange={e => setForm({ ...form, comprador: e.target.value })} />
        </div>
        <div>
          <label className="text-white/50 text-xs">Telefono del comprador</label>
          <input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.telefonoComprador} onChange={e => setForm({ ...form, telefonoComprador: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-white/50 text-xs">Metodo de pago</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CREDITO">Credito</option>
            </select>
          </div>
          <div>
            <label className="text-white/50 text-xs">Estado de pago</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.estadoPago} onChange={e => setForm({ ...form, estadoPago: e.target.value })}>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PARCIAL">Parcial</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-white/50 text-xs">Fecha de salida</label>
          <input type="date" className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.fechaSalida} onChange={e => setForm({ ...form, fechaSalida: e.target.value })} />
        </div>
        <div>
          <label className="text-white/50 text-xs">Notas</label>
          <textarea className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
        </div>

        <div className="rounded-2xl p-3 text-sm" style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)" }}>
          <p className="text-green-300 font-semibold">Al completar la venta, el animal cambiara a estado VENDIDO y se retirara del hato activo.</p>
        </div>

        <button type="submit" disabled={loading} className="w-full text-white font-black py-3 rounded-2xl disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)" }}>
          {loading ? "Procesando..." : "Confirmar venta"}
        </button>
      </form>
    </div>
  );
}

// ─── Panel lateral ────────────────────────────────────────────────────────────
function PanelAnimal({ animal, onClose, onRefresh }) {
  const [modal, setModal] = useState(null); // "venta" | "reserva" | "completar"
  const [quitandoVenta, setQuitandoVenta] = useState(false);

  if (!animal) return null;

  const foto = animal.media?.find(m => m.tipo === "FOTO")?.url;
  const cat = categoriaAnimal(animal);
  const ec = ESTADO_CONFIG[animal.estado] || ESTADO_CONFIG.ACTIVO;
  const cc = COMERCIAL_CONFIG[animal.estadoComercial] || COMERCIAL_CONFIG.NO_DISPONIBLE;
  const enVenta = ["EN_VENTA", "RESERVADO", "VENTA_EN_PROCESO"].includes(animal.estadoComercial);

  async function quitarDeVenta() {
    if (!confirm("¿Quitar este animal de la lista de venta?")) return;
    setQuitandoVenta(true);
    try {
      await api(`/animales/${animal.id}/quitar-de-venta`, { method: "POST" });
      onRefresh();
      onClose();
    } catch (err) { alert(err.message); } finally { setQuitandoVenta(false); }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-y-auto shadow-2xl"
        style={{ width: "min(100vw, 380px)", background: "#0a1f0f", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 z-10" style={{ background: "#0a1f0f" }}>
          <span className="text-white font-black text-lg">Detalle del animal</span>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1"><IconX /></button>
        </div>

        {/* Foto */}
        <div className="relative overflow-hidden" style={{ height: 200, background: "rgba(255,255,255,0.05)" }}>
          {foto ? (
            <img src={foto} alt="animal" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-6xl">
              <IconAnimal />
            </div>
          )}
        </div>

        <div className="p-4 flex-1 space-y-4">
          {/* Nombre y badges */}
          <div>
            <h2 className="text-white font-black text-2xl">{animal.nombre || animal.identificador}</h2>
            {animal.nombre && <p className="text-white/50 text-sm mb-2">{animal.identificador}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge text={ec.label} color={ec.color} bg={ec.bg} />
              <Badge text={cc.label} color={cc.color} bg={cc.bg} />
              <Badge text={cat} color="#a3e635" bg="rgba(163,230,53,0.1)" />
            </div>
          </div>

          {/* Datos */}
          <div className="rounded-2xl p-4 space-y-2" style={glass}>
            <Row label="Arete" value={animal.identificador} />
            <Row label="Categoria" value={cat} />
            <Row label="Raza" value={animal.raza || "—"} />
            <Row label="Nacimiento" value={animal.fechaNacimiento ? new Date(animal.fechaNacimiento).toLocaleDateString("es-NI") : "—"} />
            <Row label="Edad" value={calcularEdad(animal.fechaNacimiento)} />
            <Row label="Peso" value={animal.pesoActual ? `${animal.pesoActual} kg` : "—"} />
            <Row label="Potrero" value={animal.potrero || "—"} />
            <Row label="Madre" value={animal.madre ? (animal.madre.nombre || animal.madre.identificador) : "—"} />
            <Row label="Fierro" value={animal.fierro || "—"} />
            {animal.costoBase && <Row label="Costo base" value={`C$ ${animal.costoBase.toLocaleString()}`} />}
          </div>

          {/* Seccion comercial */}
          {enVenta && animal.publicacion && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)" }}>
              <p className="text-blue-300 font-bold text-sm">Informacion de venta</p>
              <Row label="Precio" value={`${animal.publicacion.moneda === "USD" ? "$" : "C$"} ${Number(animal.publicacion.precio).toLocaleString()}`} />
              <Row label="Modalidad" value={{ TOTAL: "Precio total", POR_KG: "Por kg", POR_LIBRA: "Por libra" }[animal.publicacion.modalidad] || animal.publicacion.modalidad} />
              <Row label="Negociable" value={animal.publicacion.negociable ? "Si" : "No"} />
              <Row label="Publicado en web" value={animal.publicacion.publicada ? "Si" : "No"} />
              {animal.publicacion.descripcion && <Row label="Descripcion" value={animal.publicacion.descripcion} />}
              {animal.publicacion.whatsapp && <Row label="WhatsApp" value={animal.publicacion.whatsapp} />}

              <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)" }}>
                <p className="text-green-300 font-semibold">Este animal continua contando como activo hasta completar la venta.</p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {animal.estadoComercial === "EN_VENTA" && (
                  <button onClick={() => setModal("reserva")} className="w-full text-white font-bold py-2 rounded-xl text-sm"
                    style={{ background: "rgba(234,88,12,0.3)", border: "1px solid rgba(234,88,12,0.5)" }}>
                    Registrar reserva
                  </button>
                )}
                <button onClick={() => setModal("completar")} className="w-full text-white font-bold py-2 rounded-xl text-sm"
                  style={{ background: "rgba(22,163,74,0.3)", border: "1px solid rgba(22,163,74,0.5)" }}>
                  Completar venta
                </button>
                <button onClick={quitarDeVenta} disabled={quitandoVenta} className="w-full text-white/70 font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                  style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)" }}>
                  {quitandoVenta ? "..." : "Quitar de venta"}
                </button>
              </div>
            </div>
          )}

          {/* Boton poner en venta */}
          {!enVenta && animal.estado === "ACTIVO" && animal.estadoComercial !== "VENTA_COMPLETADA" && (
            <button onClick={() => setModal("venta")} className="w-full text-white font-black py-3 rounded-2xl text-sm transition-all"
              style={{ background: "linear-gradient(135deg,#1a5c2a,#2563eb)", border: "1px solid rgba(37,99,235,0.4)" }}>
              Poner en venta
            </button>
          )}
        </div>
      </div>

      {/* Modales */}
      {modal === "venta" && <ModalPonerEnVenta animal={animal} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); onClose(); }} />}
      {modal === "reserva" && <ModalReservar animal={animal} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); onClose(); }} />}
      {modal === "completar" && <ModalCompletarVenta animal={animal} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); onClose(); }} />}
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span style={{ color: "#9ca3af", fontSize: 12, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#ffffff", fontSize: 13, textAlign: "right", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function InventarioPage() {
  const router = useRouter();
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [filtroPotrero, setFiltroPotrero] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [pagina, setPagina] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ identificador: "", nombre: "", raza: "", fierro: "", sexo: "HEMBRA", pesoActual: "", observacion: "", estadoReproductivo: "", madreId: "", fechaNacimiento: "", potrero: "", costoBase: "", origen: "FINCA" });
  const [archivos, setArchivos] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await api("/animales");
      setAnimales(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      if (err.message.includes("autenticado") || err.message.includes("inválido")) router.push("/");
      else if (err.message !== "Failed to fetch") setError(err.message);
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, [load]);

  // Cuando cambia el animal seleccionado, actualizarlo con los datos frescos
  useEffect(() => {
    if (animalSeleccionado) {
      const fresco = animales.find(a => a.id === animalSeleccionado.id);
      if (fresco) setAnimalSeleccionado(fresco);
    }
  }, [animales]);

  // Conteos
  const activos = animales.filter(a => a.estado === "ACTIVO");
  const enVenta = animales.filter(a => ["EN_VENTA", "RESERVADO", "VENTA_EN_PROCESO"].includes(a.estadoComercial) && a.estado === "ACTIVO");
  const reservados = animales.filter(a => a.estadoComercial === "RESERVADO" && a.estado === "ACTIVO");
  const vendidos = animales.filter(a => a.estado === "VENDIDO");

  // Potreros únicos
  const potreros = [...new Set(animales.map(a => a.potrero).filter(Boolean))];
  const hembrasActivas = animales.filter(a => a.sexo === "HEMBRA" && a.estado === "ACTIVO");

  // Filtrado
  const filtrados = animales
    .filter(a => a.estado !== "ELIMINADO")
    .filter(a => {
      if (tab === "TODOS") return true;
      if (tab === "ACTIVO") return a.estado === "ACTIVO";
      if (tab === "EN_VENTA") return ["EN_VENTA", "RESERVADO", "VENTA_EN_PROCESO"].includes(a.estadoComercial) && a.estado === "ACTIVO";
      if (tab === "RESERVADO") return a.estadoComercial === "RESERVADO" && a.estado === "ACTIVO";
      if (tab === "VENDIDO") return a.estado === "VENDIDO";
      if (tab === "BAJA") return a.estado === "MUERTO";
      return true;
    })
    .filter(a => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (a.nombre || "").toLowerCase().includes(q) ||
        (a.identificador || "").toLowerCase().includes(q) ||
        (a.raza || "").toLowerCase().includes(q) ||
        (a.fierro || "").toLowerCase().includes(q);
    })
    .filter(a => !filtroPotrero || a.potrero === filtroPotrero)
    .filter(a => !filtroCategoria || categoriaAnimal(a) === filtroCategoria);

  const totalPags = Math.max(1, Math.ceil(filtrados.length / perPage));
  const paginaActual = Math.min(pagina, totalPags);
  const paginados = perPage === 0 ? filtrados : filtrados.slice((paginaActual - 1) * perPage, paginaActual * perPage);

  function conteoTab(k) {
    if (k === "TODOS") return animales.filter(a => a.estado !== "ELIMINADO").length;
    if (k === "ACTIVO") return activos.length;
    if (k === "EN_VENTA") return enVenta.length;
    if (k === "RESERVADO") return reservados.length;
    if (k === "VENDIDO") return vendidos.length;
    if (k === "BAJA") return animales.filter(a => a.estado === "MUERTO").length;
    return 0;
  }

  async function handleCreate(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const body = { ...form, estadoReproductivo: form.sexo === "HEMBRA" ? form.estadoReproductivo : undefined, fechaNacimiento: form.fechaNacimiento || undefined };
      const res = await api("/animales", { method: "POST", body });
      if (archivos.length > 0) {
        const fd = new FormData();
        Array.from(archivos).forEach(f => fd.append("archivos", f));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/animales/${res.id}/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: fd,
        });
      }
      setForm({ identificador: "", nombre: "", raza: "", fierro: "", sexo: "HEMBRA", pesoActual: "", observacion: "", estadoReproductivo: "", madreId: "", fechaNacimiento: "", potrero: "", costoBase: "", origen: "FINCA" });
      setArchivos([]);
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); } finally { setEnviando(false); }
  }

  return (
    <AppLayout title="Inventario" subtitle="Gestion de animales">
      <div className="flex gap-4 relative">
        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-white font-black text-2xl">Inventario de animales</h1>
              <p className="text-white/50 text-sm mt-0.5">Gestion completa del hato ganadero</p>
            </div>
            <button onClick={() => setShowForm(s => !s)}
              className="text-white font-bold px-4 py-2 rounded-xl text-sm transition-all hidden sm:flex items-center gap-2"
              style={{ background: showForm ? "rgba(100,100,100,0.3)" : "linear-gradient(135deg,#1a5c2a,#2d9e3f)", border: "1px solid rgba(255,255,255,0.2)" }}>
              {showForm ? "Cancelar" : "+ Registrar animal"}
            </button>
          </div>

          {error && (
            <div className="mb-4 text-red-300 text-sm p-3 rounded-xl flex items-center justify-between"
              style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>
              {error}<button onClick={() => setError("")} className="text-red-400 ml-4"><IconX /></button>
            </div>
          )}

          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Animales activos", valor: activos.length, color: "#16a34a", sub: null },
              { label: "En venta", valor: enVenta.length, color: "#2563eb", sub: "Siguen activos en el hato" },
              { label: "Reservados", valor: reservados.length, color: "#ea580c", sub: null },
              { label: "Vendidos", valor: vendidos.length, color: "#6b7280", sub: null },
            ].map(m => (
              <div key={m.label} className="rounded-2xl p-4" style={{ background: `${m.color}18`, border: `1px solid ${m.color}40` }}>
                <p className="font-black text-3xl" style={{ color: m.color }}>{m.valor}</p>
                <p className="text-white/80 text-sm font-semibold mt-1">{m.label}</p>
                {m.sub && <p className="text-white/40 text-xs mt-0.5">{m.sub}</p>}
              </div>
            ))}
          </div>

          {/* Formulario registrar */}
          {showForm && (
            <form onSubmit={handleCreate} className="rounded-3xl p-5 mb-5 space-y-3" style={glass}>
              <h3 className="text-white font-black text-lg">Nuevo Animal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-white/50 text-xs">Arete/ID *</label><input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} required value={form.identificador} onChange={e => setForm({ ...form, identificador: e.target.value })} /></div>
                <div><label className="text-white/50 text-xs">Nombre</label><input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
                <div><label className="text-white/50 text-xs">Sexo *</label><select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })}><option value="HEMBRA">Hembra</option><option value="MACHO">Macho</option></select></div>
                <div><label className="text-white/50 text-xs">Raza</label><input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.raza} onChange={e => setForm({ ...form, raza: e.target.value })} /></div>
                <div><label className="text-white/50 text-xs">Fierro</label><input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.fierro} onChange={e => setForm({ ...form, fierro: e.target.value })} /></div>
                <div><label className="text-white/50 text-xs">Potrero</label><input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} placeholder="Ej: Potrero Norte" value={form.potrero} onChange={e => setForm({ ...form, potrero: e.target.value })} /></div>
                <div><label className="text-white/50 text-xs">Peso actual (kg)</label><input type="number" className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.pesoActual} onChange={e => setForm({ ...form, pesoActual: e.target.value })} /></div>
                <div><label className="text-white/50 text-xs">Costo base (C$)</label><input type="number" className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.costoBase} onChange={e => setForm({ ...form, costoBase: e.target.value })} /></div>
                <div><label className="text-white/50 text-xs">Fecha nacimiento</label><input type="date" className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.fechaNacimiento} onChange={e => setForm({ ...form, fechaNacimiento: e.target.value })} /></div>
                <div><label className="text-white/50 text-xs">Origen</label><select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })}><option value="FINCA">Nacido en finca</option><option value="COMPRADO">Comprado</option></select></div>
                <div className="sm:col-span-2"><label className="text-white/50 text-xs">Madre (si es cria)</label><select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={form.madreId} onChange={e => setForm({ ...form, madreId: e.target.value })}><option value="">Sin madre</option>{hembrasActivas.map(h => <option key={h.id} value={h.id}>{h.nombre || h.identificador}</option>)}</select></div>
                <div className="sm:col-span-2"><textarea className="w-full rounded-xl px-3 py-2 text-sm" style={gi} placeholder="Observacion..." rows={2} value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} /></div>
              </div>
              <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.2)" }}>
                <p className="text-white/50 text-xs mb-2">Fotos y videos</p>
                <input type="file" accept="image/*,video/*" multiple className="w-full text-white/60 text-sm" onChange={e => setArchivos(e.target.files)} />
              </div>
              <button type="submit" disabled={enviando} className="w-full text-white font-black py-3 rounded-2xl disabled:opacity-50" style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)" }}>
                {enviando ? "Guardando..." : "Registrar Animal"}
              </button>
            </form>
          )}

          {/* Pestañas */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setPagina(1); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1"
                style={{
                  background: tab === t.key ? "rgba(45,158,63,0.3)" : "rgba(255,255,255,0.06)",
                  border: tab === t.key ? "2px solid #2d9e3f" : "1px solid rgba(255,255,255,0.12)",
                  color: tab === t.key ? "#a3e635" : "rgba(255,255,255,0.6)",
                }}>
                {t.label}
                <span className="text-xs font-normal opacity-70">({conteoTab(t.key)})</span>
              </button>
            ))}
          </div>

          {/* Buscador y filtros */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4" style={{ alignItems: "flex-start" }}>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"><IconSearch /></span>
              <input className="w-full rounded-xl pl-9 pr-4 py-2 text-sm" style={gi}
                placeholder="Buscar por nombre, arete, raza o fierro..."
                value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }} />
            </div>
            <select className="rounded-xl px-3 py-2 text-sm" style={gi} value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPagina(1); }}>
              <option value="">Categoria</option>
              {["Vaca", "Toro", "Novillo", "Novilla", "Ternero", "Ternera"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {potreros.length > 0 && (
              <select className="rounded-xl px-3 py-2 text-sm" style={gi} value={filtroPotrero} onChange={e => { setFiltroPotrero(e.target.value); setPagina(1); }}>
                <option value="">Potrero</option>
                {potreros.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            <select className="rounded-xl px-3 py-2 text-sm" style={gi} value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPagina(1); }}>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
              <option value={0}>Ver todos</option>
            </select>
          </div>

          {/* Tabla — escritorio */}
          {loading ? (
            <div className="text-white/40 text-center py-12">Cargando inventario...</div>
          ) : (
            <>
              <div className="hidden sm:block rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="overflow-x-auto">
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                        <th style={{ width: 44, padding: "10px 12px" }}></th>
                        <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Animal</th>
                        <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Arete</th>
                        <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoría</th>
                        <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Peso</th>
                        {!animalSeleccionado && <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Potrero</th>}
                        <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</th>
                        {!animalSeleccionado && <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Comercial</th>}
                        {!animalSeleccionado && <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio</th>}
                        <th style={{ textAlign: "left", color: "#d1d5db", fontWeight: 700, padding: "10px 12px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginados.length === 0 ? (
                        <tr><td colSpan={9} style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "48px 0" }}>Sin resultados</td></tr>
                      ) : paginados.map(a => {
                        const foto = a.media?.find(m => m.tipo === "FOTO" || m.tipo === "imagen")?.url;
                        const ec = ESTADO_CONFIG[a.estado] || ESTADO_CONFIG.ACTIVO;
                        const cc = COMERCIAL_CONFIG[a.estadoComercial] || COMERCIAL_CONFIG.NO_DISPONIBLE;
                        const isSelected = animalSeleccionado?.id === a.id;
                        return (
                          <tr key={a.id}
                            onClick={() => setAnimalSeleccionado(isSelected ? null : a)}
                            style={{ background: isSelected ? "rgba(45,158,63,0.2)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.12)", flexShrink: 0 }}>
                                {foto ? <img src={foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}><IconAnimal /></div>}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", maxWidth: 160 }}>
                              <p style={{ color: "#ffffff", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nombre || <span style={{ color: "rgba(255,255,255,0.5)" }}>Sin nombre</span>}</p>
                              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 1 }}>{a.raza || "Sin raza"}</p>
                            </td>
                            <td style={{ padding: "10px 12px", color: "#ffffff", fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{a.identificador}</td>
                            <td style={{ padding: "10px 12px", color: "#e5e7eb", whiteSpace: "nowrap" }}>{categoriaAnimal(a)}</td>
                            <td style={{ padding: "10px 12px", color: "#e5e7eb", whiteSpace: "nowrap" }}>{a.pesoActual ? `${a.pesoActual} kg` : "—"}</td>
                            {!animalSeleccionado && <td style={{ padding: "10px 12px", color: "#e5e7eb", whiteSpace: "nowrap" }}>{a.potrero || "—"}</td>}
                            <td style={{ padding: "10px 12px" }}><Badge text={ec.label} color={ec.color} bg={ec.bg} /></td>
                            {!animalSeleccionado && <td style={{ padding: "10px 12px" }}><Badge text={cc.label} color={cc.color} bg={cc.bg} /></td>}
                            {!animalSeleccionado && <td style={{ padding: "10px 12px", color: "#e5e7eb", fontSize: 12, whiteSpace: "nowrap", fontWeight: 600 }}>
                              {a.publicacion?.precio ? `${a.publicacion.moneda === "USD" ? "$" : "C$"} ${Number(a.publicacion.precio).toLocaleString()}` : "—"}
                            </td>}
                            <td style={{ padding: "10px 12px" }}>
                              <button onClick={e => { e.stopPropagation(); setAnimalSeleccionado(isSelected ? null : a); }}
                                style={{ color: "rgba(255,255,255,0.4)", padding: 4, background: "none", border: "none", cursor: "pointer" }}>
                                <IconChevron />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tarjetas — movil */}
              <div className="sm:hidden space-y-3">
                {paginados.length === 0 ? (
                  <div className="text-center text-white/30 py-12">Sin resultados</div>
                ) : paginados.map(a => {
                  const foto = a.media?.find(m => m.tipo === "FOTO")?.url;
                  const ec = ESTADO_CONFIG[a.estado] || ESTADO_CONFIG.ACTIVO;
                  const cc = COMERCIAL_CONFIG[a.estadoComercial] || COMERCIAL_CONFIG.NO_DISPONIBLE;
                  return (
                    <div key={a.id} onClick={() => setAnimalSeleccionado(a)}
                      className="rounded-2xl p-4 flex gap-3 cursor-pointer transition-all active:scale-[0.98]"
                      style={{ ...glass }}>
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                        {foto ? <img src={foto} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><IconAnimal /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white font-bold truncate">{a.nombre || a.identificador}</p>
                          <IconChevron />
                        </div>
                        <p className="text-white/40 text-xs">{a.identificador} · {categoriaAnimal(a)}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge text={ec.label} color={ec.color} bg={ec.bg} />
                          <Badge text={cc.label} color={cc.color} bg={cc.bg} />
                        </div>
                        {a.publicacion?.precio && (
                          <p className="text-blue-400 text-xs font-bold mt-1">
                            {a.publicacion.moneda === "USD" ? "$" : "C$"} {Number(a.publicacion.precio).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conteo y paginación */}
              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                  {filtrados.length === 0 ? "Sin resultados" : perPage === 0
                    ? `${filtrados.length} animales`
                    : `${Math.min((paginaActual - 1) * perPage + 1, filtrados.length)}–${Math.min(paginaActual * perPage, filtrados.length)} de ${filtrados.length}`}
                </span>
                {perPage > 0 && totalPags > 1 && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaActual === 1}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer", opacity: paginaActual === 1 ? 0.3 : 1 }}>
                      Anterior
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{paginaActual} / {totalPags}</span>
                    <button onClick={() => setPagina(p => Math.min(totalPags, p + 1))} disabled={paginaActual === totalPags}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer", opacity: paginaActual === totalPags ? 0.3 : 1 }}>
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Panel lateral — escritorio */}
        <div className="hidden lg:block" style={{ width: animalSeleccionado ? 380 : 0, transition: "width 0.2s ease", overflow: "hidden" }} />
      </div>

      {/* Panel lateral */}
      {animalSeleccionado && (
        <PanelAnimal
          animal={animalSeleccionado}
          onClose={() => setAnimalSeleccionado(null)}
          onRefresh={load}
        />
      )}

      {/* FAB movil */}
      <button onClick={() => setShowForm(s => !s)}
        className="sm:hidden fixed bottom-6 right-6 z-30 text-white font-black w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: showForm ? "rgba(100,100,100,0.8)" : "linear-gradient(135deg,#1a5c2a,#2d9e3f)" }}>
        {showForm ? <IconX /> : "+"}
      </button>
    </AppLayout>
  );
}
