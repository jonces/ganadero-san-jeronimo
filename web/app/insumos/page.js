"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const T = {
  bg: "#F8FAFC", white: "#ffffff", text: "#172033", textSec: "#475569",
  textLight: "#94A3B8", border: "#E2E8F0", green: "#16a34a", greenBg: "#F0FDF4",
  red: "#DC2626", redBg: "#FEF2F2", orange: "#EA580C", orangeBg: "#FFF7ED",
  blue: "#2563EB", blueBg: "#EFF6FF",
};

function fmt(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const CATEGORIAS = ["MEDICAMENTO", "ALIMENTO", "EQUIPO", "HERRAMIENTA", "OTRO"];
const STOCK_STYLE = {
  OPTIMO:  { bg: T.greenBg, color: T.green, label: "Óptimo" },
  BAJO:    { bg: T.orangeBg, color: T.orange, label: "Bajo" },
  AGOTADO: { bg: T.redBg, color: T.red, label: "Agotado" },
};

const FORM_VACIO = { nombre: "", categoria: "MEDICAMENTO", unidad: "unidad", stockActual: "0", stockMinimo: "0", precioUnit: "", proveedor: "", notas: "" };

export default function InsumosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [showAjuste, setShowAjuste] = useState(null);
  const [nuevoStock, setNuevoStock] = useState("");

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria) params.set("categoria", filtroCategoria);
      if (filtroEstado) params.set("estado", filtroEstado);
      const data = await api(`/insumos?${params}`);
      setItems(data.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [filtroCategoria, filtroEstado]);

  async function guardar() {
    if (!form.nombre || !form.unidad) return alert("Nombre y unidad son requeridos");
    setGuardando(true);
    try {
      if (editando) {
        await api(`/insumos/${editando.id}`, { method: "PATCH", body: form });
      } else {
        await api("/insumos", { method: "POST", body: form });
      }
      setShowModal(false);
      setEditando(null);
      await cargar();
    } catch (e) { alert(e.message); }
    finally { setGuardando(false); }
  }

  async function ajustarStock() {
    if (nuevoStock === "") return;
    try {
      await api(`/insumos/${showAjuste.id}`, { method: "PATCH", body: { stockActual: Number(nuevoStock) } });
      setShowAjuste(null);
      setNuevoStock("");
      await cargar();
    } catch (e) { alert(e.message); }
  }

  function abrirEditar(i) {
    setEditando(i);
    setForm({ nombre: i.nombre, categoria: i.categoria, unidad: i.unidad, stockActual: String(i.stockActual), stockMinimo: String(i.stockMinimo), precioUnit: i.precioUnit ? String(i.precioUnit) : "", proveedor: i.proveedor || "", notas: i.notas || "" });
    setShowModal(true);
  }

  const agotados = items.filter(i => i.estadoStock === "AGOTADO");
  const bajos = items.filter(i => i.estadoStock === "BAJO");

  const totalProductos = items.length;
  const totalBajos = bajos.length;
  const totalAgotados = agotados.length;

  return (
    <AppLayout title="Insumos" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      {/* Alerta de agotados */}
      {agotados.length > 0 && (
        <div style={{ background: T.redBg, border: `1px solid #FCA5A5`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: T.red, fontWeight: 600, fontSize: 14 }}>
          ⚠️ {agotados.length} insumo{agotados.length > 1 ? "s" : ""} agotado{agotados.length > 1 ? "s" : ""}: {agotados.map(a => a.nombre).join(", ")}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, flex: 1, marginRight: 16 }}>
          {[
            { label: "Total productos", value: totalProductos, color: T.blue },
            { label: "Stock bajo", value: totalBajos, color: T.orange },
            { label: "Agotados", value: totalAgotados, color: T.red },
          ].map(c => (
            <div key={c.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
        <button onClick={() => { setEditando(null); setForm(FORM_VACIO); setShowModal(true); }}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: T.green, color: T.white, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Agregar insumo
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text }}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text }}>
          <option value="">Todos los estados</option>
          <option value="OPTIMO">Óptimo</option>
          <option value="BAJO">Bajo</option>
          <option value="AGOTADO">Agotado</option>
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
            No hay insumos registrados.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["Nombre", "Categoría", "Unidad", "Stock actual", "Stock mínimo", "Estado", "Precio unit.", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.textSec, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(i => {
                  const s = STOCK_STYLE[i.estadoStock] || STOCK_STYLE.AGOTADO;
                  return (
                    <tr key={i.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: T.text }}>{i.nombre}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{i.categoria}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{i.unidad}</td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: i.estadoStock === "AGOTADO" ? T.red : T.text }}>
                        {Number(i.stockActual).toLocaleString("es-NI")}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{Number(i.stockMinimo).toLocaleString("es-NI")}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{i.precioUnit ? fmt(i.precioUnit) : "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setShowAjuste(i); setNuevoStock(String(i.stockActual)); }}
                            style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.blue}`, background: T.blueBg, fontSize: 12, cursor: "pointer", color: T.blue, fontWeight: 600, whiteSpace: "nowrap" }}>
                            Ajustar stock
                          </button>
                          <button onClick={() => abrirEditar(i)}
                            style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, cursor: "pointer", color: T.text, fontWeight: 600 }}>
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ajuste de stock */}
      {showAjuste && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.white, borderRadius: 14, padding: 28, width: 340, maxWidth: "95vw" }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: T.text }}>Ajustar stock</div>
            <div style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>{showAjuste.nombre}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 5 }}>Nuevo stock ({showAjuste.unidad})</div>
            <input type="number" value={nuevoStock} onChange={e => setNuevoStock(e.target.value)} min={0}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 16, boxSizing: "border-box", marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAjuste(null)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: "pointer", fontWeight: 700 }}>
                Cancelar
              </button>
              <button onClick={ajustarStock}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.blue, color: T.white, cursor: "pointer", fontWeight: 700 }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar insumo */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.white, borderRadius: 14, padding: 28, width: 460, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: T.text }}>
              {editando ? "Editar insumo" : "Agregar insumo"}
            </div>
            {[
              { label: "Nombre *", field: "nombre", type: "text" },
              { label: "Categoría *", field: "categoria", type: "select", options: CATEGORIAS },
              { label: "Unidad *", field: "unidad", type: "text", placeholder: "kg, litro, unidad, dosis..." },
              { label: "Stock actual", field: "stockActual", type: "number" },
              { label: "Stock mínimo", field: "stockMinimo", type: "number" },
              { label: "Precio unitario (C$)", field: "precioUnit", type: "number" },
              { label: "Proveedor", field: "proveedor", type: "text" },
              { label: "Notas", field: "notas", type: "textarea" },
            ].map(({ label, field, type, options, placeholder }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 5 }}>{label}</div>
                {type === "select" ? (
                  <select value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : type === "textarea" ? (
                  <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
                ) : (
                  <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowModal(false); setEditando(null); }} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: "pointer", fontWeight: 700 }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.white, cursor: "pointer", fontWeight: 700 }}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar insumo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
