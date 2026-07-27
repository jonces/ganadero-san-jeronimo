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

// ─── Tema claro ───────────────────────────────────────────────────────────────
const T = {
  bg:        "#F8FAFC",
  white:     "#ffffff",
  text:      "#172033",
  textSec:   "#475569",
  textLight: "#94A3B8",
  border:    "#E2E8F0",
  rowHover:  "#F1F5F9",
  rowSel:    "#ECFDF3",
  thead:     "#F8FAFC",
};

const inputStyle = {
  background: T.white,
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  outline: "none",
};

// ─── Badge configs ────────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  ACTIVO:   { label: "Activo",  color: "#15803D", bg: "#DCFCE7", border: "#86EFAC" },
  VENDIDO:  { label: "Vendido", color: "#4B5563", bg: "#F3F4F6", border: "#D1D5DB" },
  MUERTO:   { label: "Baja",    color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" },
};

const COMERCIAL_CONFIG = {
  NO_DISPONIBLE:    { label: "Sin publicar",    color: "#6B7280", bg: "#F9FAFB",   border: "#E5E7EB" },
  EN_VENTA:         { label: "En venta",         color: "#1D4ED8", bg: "#EFF6FF",   border: "#93C5FD" },
  RESERVADO:        { label: "Reservado",        color: "#C2410C", bg: "#FFF7ED",   border: "#FDBA74" },
  VENTA_EN_PROCESO: { label: "En proceso",       color: "#B45309", bg: "#FFFBEB",   border: "#FCD34D" },
  VENTA_COMPLETADA: { label: "Venta completada", color: "#4B5563", bg: "#F3F4F6",   border: "#D1D5DB" },
};

// ─── Modales (tema claro) ─────────────────────────────────────────────────────
const modalBg = { background: "rgba(0,0,0,0.5)" };
const modalPanel = { background: T.white, borderRadius: 20, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" };
const li = { background: T.white, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, padding: "8px 12px", fontSize: 13, width: "100%", outline: "none" };

function Badge({ text, color, bg, border }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${border || color + "40"}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
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
function IconAnimal() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
}

const TABS = [
  { key: "TODOS",    label: "Todos" },
  { key: "ACTIVO",   label: "Activos" },
  { key: "EN_VENTA", label: "En venta" },
  { key: "RESERVADO",label: "Reservados" },
  { key: "VENDIDO",  label: "Vendidos" },
  { key: "BAJA",     label: "Bajas" },
];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={modalBg}>
      <form onSubmit={handleSubmit} style={modalPanel} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xl" style={{ color: T.text }}>Poner en venta</h3>
          <button type="button" onClick={onClose} style={{ color: T.textLight }}><IconX /></button>
        </div>
        <p style={{ color: T.textSec, fontSize: 13 }}>{animal.nombre || animal.identificador}</p>
        {error && <p style={{ color: "#DC2626", fontSize: 13, background: "#FEE2E2", borderRadius: 8, padding: "8px 12px" }}>{error}</p>}
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Precio *</label>
          <input type="number" required style={{ ...li, marginTop: 4, display: "block" }}
            value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Moneda</label>
            <select style={{ ...li, marginTop: 4, display: "block" }} value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
              <option value="NIO">NIO (C$)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Modalidad</label>
            <select style={{ ...li, marginTop: 4, display: "block" }} value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}>
              <option value="TOTAL">Precio total</option>
              <option value="POR_KG">Por kg</option>
              <option value="POR_LIBRA">Por libra</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Descripción</label>
          <textarea style={{ ...li, marginTop: 4, display: "block", resize: "vertical" }} rows={2}
            value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>WhatsApp de contacto</label>
          <input style={{ ...li, marginTop: 4, display: "block" }}
            value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="negociable" checked={form.negociable} onChange={e => setForm({ ...form, negociable: e.target.checked })} />
          <label htmlFor="negociable" style={{ color: T.textSec, fontSize: 13 }}>Precio negociable</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="publicada" checked={form.publicada} onChange={e => setForm({ ...form, publicada: e.target.checked })} />
          <label htmlFor="publicada" style={{ color: T.textSec, fontSize: 13 }}>Publicar en web de ventas</label>
        </div>
        <button type="submit" disabled={loading} className="w-full font-black py-3 rounded-2xl disabled:opacity-50 transition-all"
          style={{ background: "#16a34a", color: "#fff" }}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={modalBg}>
      <form onSubmit={handleSubmit} style={modalPanel} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xl" style={{ color: T.text }}>Registrar reserva</h3>
          <button type="button" onClick={onClose} style={{ color: T.textLight }}><IconX /></button>
        </div>
        <p style={{ color: T.textSec, fontSize: 13 }}>{animal.nombre || animal.identificador}</p>
        {error && <p style={{ color: "#DC2626", fontSize: 13, background: "#FEE2E2", borderRadius: 8, padding: "8px 12px" }}>{error}</p>}
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Cliente *</label>
          <input required style={{ ...li, marginTop: 4, display: "block" }} value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
        </div>
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Teléfono</label>
          <input style={{ ...li, marginTop: 4, display: "block" }} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Precio acordado *</label>
            <input type="number" required style={{ ...li, marginTop: 4, display: "block" }} value={form.precioAcordado} onChange={e => setForm({ ...form, precioAcordado: e.target.value })} />
          </div>
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Adelanto</label>
            <input type="number" style={{ ...li, marginTop: 4, display: "block" }} value={form.adelanto} onChange={e => setForm({ ...form, adelanto: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Método de pago adelanto</label>
          <select style={{ ...li, marginTop: 4, display: "block" }} value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Fecha de vencimiento</label>
          <input type="date" style={{ ...li, marginTop: 4, display: "block" }} value={form.fechaVencimiento} onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })} />
        </div>
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Notas</label>
          <textarea style={{ ...li, marginTop: 4, display: "block", resize: "vertical" }} rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="w-full font-black py-3 rounded-2xl disabled:opacity-50 transition-all"
          style={{ background: "#EA580C", color: "#fff" }}>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={modalBg}>
      <form onSubmit={handleSubmit} style={{ ...modalPanel, maxHeight: "90vh", overflowY: "auto", borderRadius: "20px 20px 0 0" }}
        className="sm:rounded-[20px] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xl" style={{ color: T.text }}>Completar venta</h3>
          <button type="button" onClick={onClose} style={{ color: T.textLight }}><IconX /></button>
        </div>
        <p style={{ color: T.textSec, fontSize: 13 }}>{animal.nombre || animal.identificador}</p>
        {error && <p style={{ color: "#DC2626", fontSize: 13, background: "#FEE2E2", borderRadius: 8, padding: "8px 12px" }}>{error}</p>}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Tipo de venta</label>
            <select style={{ ...li, marginTop: 4, display: "block" }} value={form.tipoVenta} onChange={e => setForm({ ...form, tipoVenta: e.target.value })}>
              <option value="EN_PIE">En pie</option>
              <option value="POR_PESO">Por peso</option>
            </select>
          </div>
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Moneda</label>
            <select style={{ ...li, marginTop: 4, display: "block" }} value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
              <option value="NIO">NIO (C$)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Precio NIO (C$) *</label>
            <input type="number" required style={{ ...li, marginTop: 4, display: "block" }}
              value={form.precioNIO} onChange={e => setForm({ ...form, precioNIO: e.target.value })} onBlur={calcUSD} />
          </div>
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Precio USD ($) *</label>
            <input type="number" required style={{ ...li, marginTop: 4, display: "block" }}
              value={form.precioUSD} onChange={e => setForm({ ...form, precioUSD: e.target.value })} />
          </div>
        </div>

        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Comprador</label>
          <input style={{ ...li, marginTop: 4, display: "block" }} value={form.comprador} onChange={e => setForm({ ...form, comprador: e.target.value })} />
        </div>
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Teléfono del comprador</label>
          <input style={{ ...li, marginTop: 4, display: "block" }} value={form.telefonoComprador} onChange={e => setForm({ ...form, telefonoComprador: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Método de pago</label>
            <select style={{ ...li, marginTop: 4, display: "block" }} value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>
          <div>
            <label style={{ color: T.textSec, fontSize: 12 }}>Estado de pago</label>
            <select style={{ ...li, marginTop: 4, display: "block" }} value={form.estadoPago} onChange={e => setForm({ ...form, estadoPago: e.target.value })}>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PARCIAL">Parcial</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Fecha de salida</label>
          <input type="date" style={{ ...li, marginTop: 4, display: "block" }} value={form.fechaSalida} onChange={e => setForm({ ...form, fechaSalida: e.target.value })} />
        </div>
        <div>
          <label style={{ color: T.textSec, fontSize: 12 }}>Notas</label>
          <textarea style={{ ...li, marginTop: 4, display: "block", resize: "vertical" }} rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
        </div>

        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ color: "#15803D", fontSize: 13, fontWeight: 600 }}>Al completar la venta, el animal cambiará a estado VENDIDO y se retirará del hato activo.</p>
        </div>

        <button type="submit" disabled={loading} className="w-full font-black py-3 rounded-2xl disabled:opacity-50"
          style={{ background: "#16a34a", color: "#fff" }}>
          {loading ? "Procesando..." : "Confirmar venta"}
        </button>
      </form>
    </div>
  );
}

// ─── Modal Editar Animal ──────────────────────────────────────────────────────
function ModalEditarAnimal({ animal, hembrasActivas, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombre:            animal.nombre            || "",
    raza:              animal.raza              || "",
    fierro:            animal.fierro            || "",
    pesoActual:        animal.pesoActual        || "",
    potrero:           animal.potrero           || "",
    costoCompra:       animal.costoCompra       || "",
    precioVenta:       animal.precioVenta       || "",
    observacion:       animal.observacion       || "",
    estadoReproductivo:animal.estadoReproductivo|| "",
    fechaNacimiento:   animal.fechaNacimiento ? animal.fechaNacimiento.slice(0, 10) : "",
    origen:            animal.origen            || "FINCA",
    madreId:           animal.madreId           || "",
  });
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/animales/${animal.id}`, {
        method: "PATCH",
        body: {
          ...form,
          pesoActual:  form.pesoActual  ? Number(form.pesoActual)  : undefined,
          costoCompra: form.costoCompra ? Number(form.costoCompra) : undefined,
          precioVenta: form.precioVenta  ? Number(form.precioVenta)  : undefined,
          fechaNacimiento: form.fechaNacimiento || undefined,
          estadoReproductivo: animal.sexo === "HEMBRA" ? form.estadoReproductivo : undefined,
        },
      });
      if (archivos.length > 0) {
        const fd = new FormData();
        Array.from(archivos).forEach(f => fd.append("archivos", f));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://ganaderosg-backend.up.railway.app/api"}/animales/${animal.id}/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: fd,
        });
      }
      onSuccess();
      onClose();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  const F = (label, key, type = "text", opts = {}) => (
    <div>
      <label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} style={{ ...li, width: "100%", boxSizing: "border-box" }}
        value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} {...opts} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.white, borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: T.white, zIndex: 1 }}>
          <div>
            <p style={{ color: T.textLight, fontSize: 11, margin: 0 }}>Editando</p>
            <h3 style={{ color: T.text, fontWeight: 800, fontSize: 17, margin: 0 }}>{animal.nombre || animal.identificador}</h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: T.textSec }}><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {error && <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Arete / ID</label>
              <input style={{ ...li, width: "100%", boxSizing: "border-box", background: T.bg, color: T.textLight }} value={animal.identificador} disabled />
            </div>
            {F("Nombre", "nombre")}
            {F("Raza", "raza")}
            {F("Fierro / marca", "fierro")}
            {F("Peso actual (kg)", "pesoActual", "number")}
            {F("Potrero", "potrero")}
            {!animal.madreId && F("Costo de compra (C$)", "costoCompra", "number")}
            {F("Precio de venta (C$)", "precioVenta", "number")}
            {F("Fecha de nacimiento", "fechaNacimiento", "date")}
            <div>
              <label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Origen</label>
              <select style={{ ...li, width: "100%", boxSizing: "border-box" }} value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })}>
                <option value="FINCA">Nacido en finca</option>
                <option value="COMPRADO">Comprado</option>
              </select>
            </div>
            {animal.sexo === "HEMBRA" && (
              <div>
                <label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Estado reproductivo</label>
                <select style={{ ...li, width: "100%", boxSizing: "border-box" }} value={form.estadoReproductivo} onChange={e => setForm({ ...form, estadoReproductivo: e.target.value })}>
                  <option value="">Sin registrar</option>
                  <option value="PREÑADA">Preñada</option>
                  <option value="PARIDA">Parida</option>
                  <option value="LACTANCIA">Lactancia</option>
                  <option value="SECA">Seca</option>
                  <option value="VACIA">Vacía</option>
                </select>
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Madre (si es cría)</label>
              <select style={{ ...li, width: "100%", boxSizing: "border-box" }} value={form.madreId} onChange={e => setForm({ ...form, madreId: e.target.value })}>
                <option value="">Sin madre registrada</option>
                {hembrasActivas.filter(h => h.id !== animal.id).map(h => <option key={h.id} value={h.id}>{h.nombre || h.identificador}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Observación</label>
              <textarea style={{ ...li, width: "100%", boxSizing: "border-box", resize: "vertical" }} rows={3} value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} />
            </div>
          </div>

          <div style={{ background: T.bg, border: `1px dashed ${T.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 6, marginTop: 0 }}>📷 Agregar fotos / videos</p>
            <input type="file" accept="image/*,video/*" multiple style={{ fontSize: 13, color: T.textSec }} onChange={e => setArchivos(e.target.files)} />
            {archivos.length > 0 && <p style={{ color: "#16a34a", fontSize: 12, marginTop: 6, marginBottom: 0 }}>{archivos.length} archivo{archivos.length > 1 ? "s" : ""} seleccionado{archivos.length > 1 ? "s" : ""}</p>}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: T.white, border: `1px solid ${T.border}`, color: T.textSec, borderRadius: 10, padding: "10px 0", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Galería ────────────────────────────────────────────────────────────
function ModalGaleria({ animal, onClose }) {
  const [idx, setIdx] = useState(0);
  const media = animal.media || [];

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, media.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, media.length]);

  if (media.length === 0) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#fff", fontSize: 15 }}>Este animal no tiene fotos ni videos aún.</p>
        <button onClick={onClose} style={{ background: "#fff", color: "#172033", borderRadius: 10, padding: "10px 24px", fontWeight: 700, border: "none", cursor: "pointer" }}>Cerrar</button>
      </div>
    );
  }

  const actual  = media[idx];
  const esVideo = actual.tipo === "video" || actual.tipo === "VIDEO";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }}>

      {/* Botón regresar + contador */}
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 2, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "7px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          ← Regresar
        </button>
        {media.length > 1 && (
          <span style={{ background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
            {idx + 1} / {media.length}
          </span>
        )}
      </div>

      {/* Foto / video centrado */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {/* Flecha izquierda */}
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            style={{ position: "absolute", left: 20, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 26, zIndex: 2 }}>
            ‹
          </button>
        )}

        {esVideo
          ? <video src={actual.url} controls style={{ maxWidth: "80%", maxHeight: "85vh", borderRadius: 12 }} />
          : <img src={actual.url} alt="" style={{ maxWidth: "80%", maxHeight: "85vh", objectFit: "contain", borderRadius: 12 }} />}

        {/* Flecha derecha */}
        {idx < media.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            style={{ position: "absolute", right: 20, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 26, zIndex: 2 }}>
            ›
          </button>
        )}
      </div>

      {/* Miniaturas en la parte inferior */}
      {media.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 20px 20px", flexShrink: 0, justifyContent: "center" }}>
          {media.map((m, i) => {
            const esVid = m.tipo === "video" || m.tipo === "VIDEO";
            return (
              <div key={m.id || i} onClick={() => setIdx(i)}
                style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0, cursor: "pointer", border: i === idx ? "3px solid #16a34a" : "3px solid transparent", opacity: i === idx ? 1 : 0.5, transition: "all 0.15s", background: "rgba(255,255,255,0.1)" }}>
                {esVid
                  ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22 }}>▶</div>
                  : <img src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Fila de datos del panel ──────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, paddingBottom: 6 }}>
      <span style={{ color: T.textLight, fontSize: 12, flexShrink: 0 }}>{label}</span>
      <span style={{ color: T.text, fontSize: 13, textAlign: "right", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ─── Panel de detalle (columna derecha) ───────────────────────────────────────
function PanelAnimal({ animal, onClose, onRefresh, isMobile, hembrasActivas }) {
  const [modal, setModal] = useState(null);
  const [quitandoVenta, setQuitandoVenta] = useState(false);
  const [fotoIdx, setFotoIdx] = useState(0);

  // Resetear índice cuando cambia el animal
  useEffect(() => { setFotoIdx(0); }, [animal?.id]);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !modal) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, modal]);

  if (!animal) return null;

  const todasMedia = animal.media || [];
  const mediaActual = todasMedia[fotoIdx];
  const esVideoActual = mediaActual && (mediaActual.tipo === "video" || mediaActual.tipo === "VIDEO");
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

  const panelContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Foto con flechas de navegación */}
      <div style={{ position: "relative", height: 210, background: T.border, overflow: "hidden", flexShrink: 0 }}>

        {/* Imagen o video actual */}
        {todasMedia.length === 0
          ? <div onClick={() => setModal("galeria")} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.textLight, gap: 8, cursor: "pointer" }}>
              <IconAnimal /><span style={{ fontSize: 12 }}>Sin fotografía</span>
            </div>
          : esVideoActual
            ? <video src={mediaActual.url} onClick={() => setModal("galeria")} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} />
            : <img src={mediaActual.url} alt="animal" onClick={() => setModal("galeria")}
                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer", transition: "transform 0.2s" }}
                onMouseEnter={e => e.target.style.transform = "scale(1.03)"}
                onMouseLeave={e => e.target.style.transform = "scale(1)"} />
        }

        {/* Flecha izquierda */}
        {fotoIdx > 0 && (
          <button type="button" onClick={e => { e.stopPropagation(); setFotoIdx(i => i - 1); }}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 20, zIndex: 2 }}>
            ‹
          </button>
        )}

        {/* Flecha derecha */}
        {fotoIdx < todasMedia.length - 1 && (
          <button type="button" onClick={e => { e.stopPropagation(); setFotoIdx(i => i + 1); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 20, zIndex: 2 }}>
            ›
          </button>
        )}

        {/* Contador de fotos */}
        {todasMedia.length > 1 && (
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.55)", borderRadius: 20, padding: "3px 10px", color: "#fff", fontSize: 11, fontWeight: 600 }}>
            📷 {fotoIdx + 1} / {todasMedia.length}
          </div>
        )}
        {todasMedia.length === 1 && (
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.55)", borderRadius: 20, padding: "3px 10px", color: "#fff", fontSize: 11, fontWeight: 600 }}>
            📷 toca para ver
          </div>
        )}

        {/* Botones top */}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
          <button type="button" onClick={e => { e.stopPropagation(); setModal("editar"); }}
            style={{ background: "rgba(255,255,255,0.92)", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            ✏️ Editar
          </button>
          <button type="button" onClick={e => { e.stopPropagation(); onClose(); }}
            style={{ background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.text }}>
            <IconX />
          </button>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {/* Nombre + badges */}
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ color: T.text, fontWeight: 800, fontSize: 20, margin: "0 0 2px" }}>{animal.nombre || animal.identificador}</h2>
          {animal.nombre && <p style={{ color: T.textLight, fontSize: 13, margin: "0 0 8px" }}>{animal.identificador}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Badge text={ec.label} color={ec.color} bg={ec.bg} border={ec.border} />
            <Badge text={cc.label} color={cc.color} bg={cc.bg} border={cc.border} />
            <Badge text={cat} color="#15803D" bg="#DCFCE7" border="#86EFAC" />
          </div>
        </div>

        {/* Grid de datos */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <Row label="Arete" value={animal.identificador} />
          <Row label="Categoría" value={cat} />
          <Row label="Raza" value={animal.raza || "—"} />
          <Row label="Nacimiento" value={animal.fechaNacimiento ? new Date(animal.fechaNacimiento).toLocaleDateString("es-NI") : "—"} />
          <Row label="Edad" value={calcularEdad(animal.fechaNacimiento)} />
          <Row label="Peso" value={animal.pesoActual ? `${animal.pesoActual} kg` : "—"} />
          <Row label="Potrero" value={animal.potrero || "—"} />
          <Row label="Fierro" value={animal.fierro || "—"} />
          {!animal.madreId && animal.costoCompra && <Row label="Costo de compra" value={`C$ ${Number(animal.costoCompra).toLocaleString("es-NI")}`} />}
          {animal.precioVenta && <Row label="Precio de venta" value={`C$ ${Number(animal.precioVenta).toLocaleString("es-NI")}`} />}
        </div>

        {/* Sección comercial */}
        {enVenta && animal.publicacion && (
          <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <p style={{ color: "#1D4ED8", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Información de venta</p>
            <Row label="Precio" value={`${animal.publicacion.moneda === "USD" ? "$" : "C$"} ${Number(animal.publicacion.precio).toLocaleString()}`} />
            <Row label="Modalidad" value={{ TOTAL: "Precio total", POR_KG: "Por kg", POR_LIBRA: "Por libra" }[animal.publicacion.modalidad] || animal.publicacion.modalidad} />
            <Row label="Negociable" value={animal.publicacion.negociable ? "Sí" : "No"} />
            <Row label="Publicado en web" value={animal.publicacion.publicada ? "Sí" : "No"} />
            {animal.publicacion.descripcion && <Row label="Descripción" value={animal.publicacion.descripcion} />}
            {animal.publicacion.whatsapp && <Row label="WhatsApp" value={animal.publicacion.whatsapp} />}

            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 12px", marginTop: 10, marginBottom: 10 }}>
              <p style={{ color: "#15803D", fontSize: 12, fontWeight: 600 }}>Este animal continúa contando como activo hasta completar la venta.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {animal.estadoComercial === "EN_VENTA" && (
                <button onClick={() => setModal("reserva")}
                  style={{ background: T.white, border: "1px solid #FDBA74", color: "#C2410C", borderRadius: 10, padding: "8px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" }}>
                  Registrar reserva
                </button>
              )}
              <button onClick={() => setModal("completar")}
                style={{ background: "#16a34a", color: "#fff", borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%", border: "none" }}>
                Completar venta
              </button>
              <button onClick={quitarDeVenta} disabled={quitandoVenta}
                style={{ background: T.white, border: "1px solid #FCA5A5", color: "#DC2626", borderRadius: 10, padding: "8px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%", opacity: quitandoVenta ? 0.5 : 1 }}>
                {quitandoVenta ? "..." : "Quitar de venta"}
              </button>
            </div>
          </div>
        )}

        {/* Botón poner en venta */}
        {!enVenta && animal.estado === "ACTIVO" && animal.estadoComercial !== "VENTA_COMPLETADA" && (
          <button onClick={() => setModal("venta")}
            style={{ background: "#16a34a", color: "#fff", borderRadius: 12, padding: "12px 0", fontWeight: 800, fontSize: 14, cursor: "pointer", width: "100%", border: "none" }}>
            Poner en venta
          </button>
        )}
      </div>

      {/* Modales */}
      {modal === "venta"    && <ModalPonerEnVenta    animal={animal} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); onClose(); }} />}
      {modal === "reserva"  && <ModalReservar         animal={animal} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); onClose(); }} />}
      {modal === "completar"&& <ModalCompletarVenta   animal={animal} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); onClose(); }} />}
      {modal === "editar"   && <ModalEditarAnimal      animal={animal} hembrasActivas={hembrasActivas} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); setModal(null); }} />}
      {modal === "galeria"  && <ModalGaleria           animal={animal} onClose={() => setModal(null)} />}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)" }} />
        <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 50, width: "min(100vw, 400px)", background: T.white, borderLeft: `1px solid ${T.border}`, overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)" }}>
          {panelContent}
        </div>
      </>
    );
  }

  // Desktop: panel fijo a la derecha de la ventana visible
  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: 60,           // debajo del header sticky (~60px)
      bottom: 0,
      width: 440,
      zIndex: 9,
      background: T.white,
      borderLeft: `1px solid ${T.border}`,
      boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}>
      {panelContent}
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
  const [perPage, setPerPage] = useState(0); // 0 = todos
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ identificador: "", nombre: "", raza: "", fierro: "", sexo: "HEMBRA", pesoActual: "", observacion: "", estadoReproductivo: "", madreId: "", fechaNacimiento: "", potrero: "", costoCompra: "", precioVenta: "", origen: "FINCA" });
  const [archivos, setArchivos] = useState([]);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  // Actualizar animal seleccionado con datos frescos
  useEffect(() => {
    if (animalSeleccionado) {
      const fresco = animales.find(a => a.id === animalSeleccionado.id);
      if (fresco) setAnimalSeleccionado(fresco);
    }
  }, [animales]);

  // Conteos
  const activos    = animales.filter(a => a.estado === "ACTIVO");
  const enVenta    = animales.filter(a => ["EN_VENTA", "RESERVADO", "VENTA_EN_PROCESO"].includes(a.estadoComercial) && a.estado === "ACTIVO");
  const reservados = animales.filter(a => a.estadoComercial === "RESERVADO" && a.estado === "ACTIVO");
  const vendidos   = animales.filter(a => a.estado === "VENDIDO");

  const potreros = [...new Set(animales.map(a => a.potrero).filter(Boolean))];
  const hembrasActivas = animales.filter(a => a.sexo === "HEMBRA" && a.estado === "ACTIVO");

  // Filtrado
  const filtrados = animales
    .filter(a => a.estado !== "ELIMINADO")
    .filter(a => {
      if (tab === "TODOS")    return true;
      if (tab === "ACTIVO")   return a.estado === "ACTIVO";
      if (tab === "EN_VENTA") return ["EN_VENTA", "RESERVADO", "VENTA_EN_PROCESO"].includes(a.estadoComercial) && a.estado === "ACTIVO";
      if (tab === "RESERVADO")return a.estadoComercial === "RESERVADO" && a.estado === "ACTIVO";
      if (tab === "VENDIDO")  return a.estado === "VENDIDO";
      if (tab === "BAJA")     return a.estado === "MUERTO";
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

  const totalPags   = perPage === 0 ? 1 : Math.max(1, Math.ceil(filtrados.length / perPage));
  const paginaActual= Math.min(pagina, totalPags);
  const paginados   = perPage === 0 ? filtrados : filtrados.slice((paginaActual - 1) * perPage, paginaActual * perPage);

  function conteoTab(k) {
    if (k === "TODOS")    return animales.filter(a => a.estado !== "ELIMINADO").length;
    if (k === "ACTIVO")   return activos.length;
    if (k === "EN_VENTA") return enVenta.length;
    if (k === "RESERVADO")return reservados.length;
    if (k === "VENDIDO")  return vendidos.length;
    if (k === "BAJA")     return animales.filter(a => a.estado === "MUERTO").length;
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
      setForm({ identificador: "", nombre: "", raza: "", fierro: "", sexo: "HEMBRA", pesoActual: "", observacion: "", estadoReproductivo: "", madreId: "", fechaNacimiento: "", potrero: "", costoCompra: "", precioVenta: "", origen: "FINCA" });
      setArchivos([]);
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); } finally { setEnviando(false); }
  }

  const panelAbierto = !!animalSeleccionado && !isMobile;

  return (
    <AppLayout title="Inventario" subtitle="Gestión de animales">
      <div style={{ background: T.bg, minHeight: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>Inventario de animales</h1>
            <p style={{ color: T.textSec, fontSize: 13, marginTop: 2 }}>Gestión completa del hato ganadero</p>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="hidden sm:flex items-center gap-2"
            style={{ background: showForm ? T.border : "#16a34a", color: showForm ? T.text : "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {showForm ? "Cancelar" : "+ Registrar animal"}
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 16, color: "#DC2626", fontSize: 13, background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {error}
            <button onClick={() => setError("")} style={{ color: "#DC2626", background: "none", border: "none", cursor: "pointer" }}><IconX /></button>
          </div>
        )}

        {/* Tarjetas resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Animales activos", valor: activos.length,    color: "#16a34a", bg: "#F0FDF4", border: "#BBF7D0" },
            { label: "En venta",         valor: enVenta.length,    color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", sub: "Siguen activos en el hato" },
            { label: "Reservados",       valor: reservados.length, color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
            { label: "Vendidos",         valor: vendidos.length,   color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
          ].map(m => (
            <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ color: m.color, fontWeight: 800, fontSize: 28, margin: 0, lineHeight: 1 }}>{m.valor}</p>
              <p style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginTop: 4 }}>{m.label}</p>
              {m.sub && <p style={{ color: T.textLight, fontSize: 11, marginTop: 2 }}>{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* Formulario registrar */}
        {showForm && (
          <form onSubmit={handleCreate} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: T.text, fontWeight: 800, fontSize: 16, marginBottom: 16, marginTop: 0 }}>Nuevo Animal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Arete/ID *</label><input required style={{ ...li, width: "100%" }} value={form.identificador} onChange={e => setForm({ ...form, identificador: e.target.value })} /></div>
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Nombre</label><input style={{ ...li, width: "100%" }} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Sexo *</label><select style={{ ...li, width: "100%" }} value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })}><option value="HEMBRA">Hembra</option><option value="MACHO">Macho</option></select></div>
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Raza</label><input style={{ ...li, width: "100%" }} value={form.raza} onChange={e => setForm({ ...form, raza: e.target.value })} /></div>
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Fierro</label><input style={{ ...li, width: "100%" }} value={form.fierro} onChange={e => setForm({ ...form, fierro: e.target.value })} /></div>
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Potrero</label><input style={{ ...li, width: "100%" }} placeholder="Ej: Potrero Norte" value={form.potrero} onChange={e => setForm({ ...form, potrero: e.target.value })} /></div>
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Peso actual (kg)</label><input type="number" style={{ ...li, width: "100%" }} value={form.pesoActual} onChange={e => setForm({ ...form, pesoActual: e.target.value })} /></div>
              {(form.origen === "COMPRADO" && !form.madreId) && <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Costo de compra (C$)</label><input type="number" style={{ ...li, width: "100%" }} value={form.costoCompra} onChange={e => setForm({ ...form, costoCompra: e.target.value })} /></div>}
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Precio de venta (C$)</label><input type="number" style={{ ...li, width: "100%" }} value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: e.target.value })} /></div>
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Fecha nacimiento</label><input type="date" style={{ ...li, width: "100%" }} value={form.fechaNacimiento} onChange={e => setForm({ ...form, fechaNacimiento: e.target.value })} /></div>
              <div><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Origen</label><select style={{ ...li, width: "100%" }} value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })}><option value="FINCA">Nacido en finca</option><option value="COMPRADO">Comprado</option></select></div>
              <div className="sm:col-span-2"><label style={{ color: T.textSec, fontSize: 12, display: "block", marginBottom: 4 }}>Madre (si es cría)</label><select style={{ ...li, width: "100%" }} value={form.madreId} onChange={e => setForm({ ...form, madreId: e.target.value })}><option value="">Sin madre</option>{hembrasActivas.map(h => <option key={h.id} value={h.id}>{h.nombre || h.identificador}</option>)}</select></div>
              <div className="sm:col-span-2"><textarea style={{ ...li, width: "100%", resize: "vertical" }} placeholder="Observación..." rows={2} value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} /></div>
            </div>
            <div style={{ background: T.bg, border: `1px dashed ${T.border}`, borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 6 }}>Fotos y videos</p>
              <input type="file" accept="image/*,video/*" multiple style={{ fontSize: 13, color: T.textSec }} onChange={e => setArchivos(e.target.files)} />
            </div>
            <button type="submit" disabled={enviando}
              style={{ background: "#16a34a", color: "#fff", borderRadius: 12, padding: "11px 0", fontWeight: 800, fontSize: 14, cursor: "pointer", width: "100%", border: "none", marginTop: 14, opacity: enviando ? 0.6 : 1 }}>
              {enviando ? "Guardando..." : "Registrar Animal"}
            </button>
          </form>
        )}

        {/* Pestañas */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {TABS.map(t => {
            const activa = tab === t.key;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setPagina(1); }}
                style={{
                  flexShrink: 0, padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: activa ? "#ECFDF3" : "#F1F5F9",
                  border: activa ? "2px solid #16a34a" : `1px solid ${T.border}`,
                  color: activa ? "#15803D" : "#64748B",
                }}>
                {t.label} <span style={{ fontWeight: 400, opacity: 0.7 }}>({conteoTab(t.key)})</span>
              </button>
            );
          })}
        </div>

        {/* Buscador y filtros */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textLight }}><IconSearch /></span>
            <input style={{ ...inputStyle, paddingLeft: 34, width: "100%" }}
              placeholder="Buscar por nombre, arete, raza o fierro..."
              value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }} />
          </div>
          <select style={inputStyle} value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPagina(1); }}>
            <option value="">Categoría</option>
            {["Vaca", "Toro", "Novillo", "Novilla", "Ternero", "Ternera"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {potreros.length > 0 && (
            <select style={inputStyle} value={filtroPotrero} onChange={e => { setFiltroPotrero(e.target.value); setPagina(1); }}>
              <option value="">Potrero</option>
              {potreros.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          <select style={inputStyle} value={String(perPage)} onChange={e => { setPerPage(Number(e.target.value)); setPagina(1); }}>
            <option value="0">Mostrar todos</option>
            <option value="10">10 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
          </select>
        </div>

        {/* Contenido: se reduce cuando el panel está abierto */}
        <div style={{ marginRight: panelAbierto ? 448 : 0, transition: "margin-right 0.2s ease" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ textAlign: "center", color: T.textLight, padding: "48px 0", fontSize: 14 }}>Cargando inventario...</div>
            ) : (
              <>
                {/* Tabla — escritorio */}
                <div className="hidden sm:block" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: T.thead, borderBottom: `2px solid ${T.border}` }}>
                          <th style={{ width: 44, padding: "10px 12px" }}></th>
                          <th style={{ textAlign: "left", color: T.textSec, fontWeight: 600, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Animal</th>
                          <th style={{ textAlign: "left", color: T.textSec, fontWeight: 600, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Arete</th>
                          <th style={{ textAlign: "left", color: T.textSec, fontWeight: 600, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoría</th>
                          <th style={{ textAlign: "left", color: T.textSec, fontWeight: 600, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Peso</th>
                          {!panelAbierto && <th style={{ textAlign: "left", color: T.textSec, fontWeight: 600, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Potrero</th>}
                          <th style={{ textAlign: "left", color: T.textSec, fontWeight: 600, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</th>
                          {!panelAbierto && <th style={{ textAlign: "left", color: T.textSec, fontWeight: 600, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Comercial</th>}
                          {!panelAbierto && <th style={{ textAlign: "left", color: T.textSec, fontWeight: 600, padding: "10px 12px", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio</th>}
                          <th style={{ width: 36, padding: "10px 12px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginados.length === 0 ? (
                          <tr><td colSpan={10} style={{ textAlign: "center", color: T.textLight, padding: "48px 0" }}>Sin resultados</td></tr>
                        ) : paginados.map(a => {
                          const foto = a.media?.find(m => m.tipo === "FOTO" || m.tipo === "imagen")?.url;
                          const ec = ESTADO_CONFIG[a.estado] || ESTADO_CONFIG.ACTIVO;
                          const cc = COMERCIAL_CONFIG[a.estadoComercial] || COMERCIAL_CONFIG.NO_DISPONIBLE;
                          const isSelected = animalSeleccionado?.id === a.id;
                          return (
                            <tr key={a.id}
                              onClick={() => setAnimalSeleccionado(isSelected ? null : a)}
                              style={{
                                background: isSelected ? T.rowSel : "transparent",
                                borderBottom: `1px solid #F1F5F9`,
                                cursor: "pointer",
                                transition: "background 0.1s",
                              }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.rowHover; }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                              <td style={{ padding: "8px 12px" }}>
                                <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: T.border, flexShrink: 0 }}>
                                  {foto
                                    ? <img src={foto} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="animal" onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                                    : null}
                                  <div style={{ width: "100%", height: "100%", display: foto ? "none" : "flex", alignItems: "center", justifyContent: "center", color: T.textLight, flexDirection: "column", gap: 2 }}>
                                    <IconAnimal />
                                    <span style={{ fontSize: 9, color: T.textLight }}>Sin foto</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "10px 12px", maxWidth: 160 }}>
                                <p style={{ color: T.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{a.nombre || <span style={{ color: T.textLight }}>Sin nombre</span>}</p>
                                <p style={{ color: T.textLight, fontSize: 11, marginTop: 2, margin: 0 }}>{a.raza || "Sin raza"}</p>
                              </td>
                              <td style={{ padding: "10px 12px", color: "#334155", fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{a.identificador}</td>
                              <td style={{ padding: "10px 12px", color: T.textSec, whiteSpace: "nowrap" }}>{categoriaAnimal(a)}</td>
                              <td style={{ padding: "10px 12px", color: T.textSec, whiteSpace: "nowrap" }}>{a.pesoActual ? `${a.pesoActual} kg` : "—"}</td>
                              {!panelAbierto && <td style={{ padding: "10px 12px", color: T.textSec, whiteSpace: "nowrap" }}>{a.potrero || "—"}</td>}
                              <td style={{ padding: "10px 12px" }}><Badge text={ec.label} color={ec.color} bg={ec.bg} border={ec.border} /></td>
                              {!panelAbierto && <td style={{ padding: "10px 12px" }}><Badge text={cc.label} color={cc.color} bg={cc.bg} border={cc.border} /></td>}
                              {!panelAbierto && <td style={{ padding: "10px 12px", color: T.textSec, fontSize: 12, whiteSpace: "nowrap", fontWeight: 600 }}>
                                {a.publicacion?.precio ? `${a.publicacion.moneda === "USD" ? "$" : "C$"} ${Number(a.publicacion.precio).toLocaleString()}` : "—"}
                              </td>}
                              <td style={{ padding: "10px 12px" }}>
                                <button onClick={e => { e.stopPropagation(); setAnimalSeleccionado(isSelected ? null : a); }}
                                  style={{ color: T.textLight, padding: 4, background: "none", border: "none", cursor: "pointer" }}>
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

                {/* Tarjetas — móvil */}
                <div className="sm:hidden" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {paginados.length === 0 ? (
                    <div style={{ textAlign: "center", color: T.textLight, padding: "48px 0" }}>Sin resultados</div>
                  ) : paginados.map(a => {
                    const foto = a.media?.find(m => m.tipo === "FOTO")?.url;
                    const ec = ESTADO_CONFIG[a.estado] || ESTADO_CONFIG.ACTIVO;
                    const cc = COMERCIAL_CONFIG[a.estadoComercial] || COMERCIAL_CONFIG.NO_DISPONIBLE;
                    return (
                      <div key={a.id} onClick={() => setAnimalSeleccionado(a)}
                        style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, display: "flex", gap: 12, cursor: "pointer" }}>
                        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: T.border }}>
                          {foto ? <img src={foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.textLight }}><IconAnimal /></div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                            <p style={{ color: T.text, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nombre || a.identificador}</p>
                            <span style={{ color: T.textLight, flexShrink: 0 }}><IconChevron /></span>
                          </div>
                          <p style={{ color: T.textLight, fontSize: 12, margin: "2px 0 6px" }}>{a.identificador} · {categoriaAnimal(a)}</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            <Badge text={ec.label} color={ec.color} bg={ec.bg} border={ec.border} />
                            <Badge text={cc.label} color={cc.color} bg={cc.bg} border={cc.border} />
                          </div>
                          {a.publicacion?.precio && (
                            <p style={{ color: "#1D4ED8", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                              {a.publicacion.moneda === "USD" ? "$" : "C$"} {Number(a.publicacion.precio).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Conteo y paginación */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ color: T.textSec, fontSize: 13 }}>
                    {filtrados.length === 0 ? "Sin resultados" : `Mostrando ${perPage === 0 ? filtrados.length : Math.min(paginados.length, filtrados.length)} de ${filtrados.length} animales`}
                  </span>
                  {perPage > 0 && totalPags > 1 && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaActual === 1}
                        style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", color: T.textSec, fontSize: 13, cursor: "pointer", opacity: paginaActual === 1 ? 0.4 : 1 }}>
                        Anterior
                      </button>
                      <span style={{ color: T.textSec, fontSize: 13 }}>{paginaActual} / {totalPags}</span>
                      <button onClick={() => setPagina(p => Math.min(totalPags, p + 1))} disabled={paginaActual === totalPags}
                        style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", color: T.textSec, fontSize: 13, cursor: "pointer", opacity: paginaActual === totalPags ? 0.4 : 1 }}>
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Panel detalle — fijo a la derecha (desktop) */}
        {panelAbierto && (
          <PanelAnimal
            animal={animalSeleccionado}
            onClose={() => setAnimalSeleccionado(null)}
            onRefresh={load}
            isMobile={false}
            hembrasActivas={hembrasActivas}
          />
        )}

        {/* Panel — overlay móvil */}
        {animalSeleccionado && isMobile && (
          <PanelAnimal
            animal={animalSeleccionado}
            onClose={() => setAnimalSeleccionado(null)}
            onRefresh={load}
            isMobile={true}
            hembrasActivas={hembrasActivas}
          />
        )}

        {/* FAB móvil */}
        <button onClick={() => setShowForm(s => !s)}
          className="sm:hidden"
          style={{ position: "fixed", bottom: 24, right: 24, zIndex: 30, background: showForm ? "#6B7280" : "#16a34a", color: "#fff", border: "none", borderRadius: "50%", width: 56, height: 56, fontSize: 24, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {showForm ? <IconX /> : "+"}
        </button>

      </div>
    </AppLayout>
  );
}
