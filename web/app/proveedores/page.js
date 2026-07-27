"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const T = {
  bg: "#F8FAFC", white: "#ffffff", text: "#172033", textSec: "#475569",
  textLight: "#94A3B8", border: "#E2E8F0", green: "#16a34a", greenBg: "#F0FDF4",
  red: "#DC2626", redBg: "#FEF2F2", orange: "#EA580C", orangeBg: "#FFF7ED",
  blue: "#2563EB", blueBg: "#EFF6FF", purple: "#7C3AED", purpleBg: "#F5F3FF",
};

const TIPOS = [
  { value: "VETERINARIA", label: "Veterinaria", bg: T.blueBg, color: T.blue },
  { value: "ALIMENTACION", label: "Alimentación", bg: T.greenBg, color: T.green },
  { value: "EQUIPO", label: "Equipo", bg: T.orangeBg, color: T.orange },
  { value: "TRANSPORTE", label: "Transporte", bg: T.purpleBg, color: T.purple },
  { value: "FINANCIERO", label: "Financiero", bg: T.redBg, color: T.red },
  { value: "OTRO", label: "Otro", bg: "#F1F5F9", color: "#64748B" },
];

const FORM_VACIO = { nombre: "", tipo: "VETERINARIA", contacto: "", telefono: "", email: "", direccion: "", notas: "" };

function TipoBadge({ tipo }) {
  const t = TIPOS.find(x => x.value === tipo) || TIPOS[TIPOS.length - 1];
  return <span style={{ background: t.bg, color: t.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{t.label}</span>;
}

export default function ProveedoresPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ activo: "true" });
      if (filtroTipo) params.set("tipo", filtroTipo);
      const data = await api(`/proveedores?${params}`);
      setItems(data.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [filtroTipo]);

  function abrirNuevo() {
    setEditando(null);
    setForm(FORM_VACIO);
    setShowModal(true);
  }

  function abrirEditar(p) {
    setEditando(p);
    setForm({ nombre: p.nombre, tipo: p.tipo, contacto: p.contacto || "", telefono: p.telefono || "", email: p.email || "", direccion: p.direccion || "", notas: p.notas || "" });
    setShowModal(true);
  }

  async function guardar() {
    if (!form.nombre) return alert("El nombre es requerido");
    setGuardando(true);
    try {
      if (editando) {
        await api(`/proveedores/${editando.id}`, { method: "PATCH", body: form });
      } else {
        await api("/proveedores", { method: "POST", body: form });
      }
      setShowModal(false);
      await cargar();
    } catch (e) { alert(e.message); }
    finally { setGuardando(false); }
  }

  async function desactivar(id) {
    if (!confirm("¿Desactivar este proveedor?")) return;
    try {
      await api(`/proveedores/${id}`, { method: "DELETE" });
      await cargar();
    } catch (e) { alert(e.message); }
  }

  const filtrados = items.filter(p => !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <AppLayout title="Proveedores" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input type="text" placeholder="Buscar proveedor..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, minWidth: 200 }} />
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text }}>
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button onClick={abrirNuevo}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: T.green, color: T.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nuevo proveedor
        </button>
      </div>

      {/* Grid de cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: T.textSec }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textSec }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏭</div>
          No hay proveedores registrados. ¡Agrega tu primer proveedor!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {filtrados.map(p => (
            <div key={p.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{p.nombre}</div>
                <TipoBadge tipo={p.tipo} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                {p.telefono && (
                  <div style={{ fontSize: 13, color: T.textSec }}>📞 {p.telefono}</div>
                )}
                {p.email && (
                  <div style={{ fontSize: 13, color: T.textSec }}>✉️ {p.email}</div>
                )}
                {p.contacto && (
                  <div style={{ fontSize: 13, color: T.textSec }}>👤 {p.contacto}</div>
                )}
                {p.direccion && (
                  <div style={{ fontSize: 13, color: T.textSec }}>📍 {p.direccion}</div>
                )}
                {!p.telefono && !p.email && !p.contacto && (
                  <div style={{ fontSize: 13, color: T.textLight }}>Sin información de contacto</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => abrirEditar(p)}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: `1px solid ${T.border}`, background: T.white, fontSize: 13, cursor: "pointer", fontWeight: 600, color: T.text }}>
                  Editar
                </button>
                {p.telefono && (
                  <a href={`tel:${p.telefono}`}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: `1px solid ${T.green}`, background: T.greenBg, fontSize: 13, cursor: "pointer", fontWeight: 600, color: T.green, textDecoration: "none", textAlign: "center" }}>
                    Llamar
                  </a>
                )}
                <button onClick={() => desactivar(p.id)}
                  style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.white, fontSize: 13, cursor: "pointer", color: T.red }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.white, borderRadius: 14, padding: 28, width: 460, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: T.text }}>
              {editando ? "Editar proveedor" : "Nuevo proveedor"}
            </div>
            {[
              { label: "Nombre *", field: "nombre", type: "text" },
              { label: "Tipo *", field: "tipo", type: "select" },
              { label: "Contacto", field: "contacto", type: "text" },
              { label: "Teléfono", field: "telefono", type: "tel" },
              { label: "Email", field: "email", type: "email" },
              { label: "Dirección", field: "direccion", type: "text" },
              { label: "Notas", field: "notas", type: "textarea" },
            ].map(({ label, field, type }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 5 }}>{label}</div>
                {type === "select" ? (
                  <select value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }}>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                ) : type === "textarea" ? (
                  <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
                ) : (
                  <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowModal(false)} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: "pointer", fontWeight: 700 }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.white, cursor: "pointer", fontWeight: 700 }}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear proveedor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
