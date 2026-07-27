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

function fmt(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const TIPOS = ["ANIMAL", "INSUMO", "EQUIPO", "SERVICIO", "OTRO"];
const TIPO_COLORS = {
  ANIMAL: { bg: T.greenBg, color: T.green },
  INSUMO: { bg: T.blueBg, color: T.blue },
  EQUIPO: { bg: T.orangeBg, color: T.orange },
  SERVICIO: { bg: T.purpleBg, color: T.purple },
  OTRO: { bg: "#F1F5F9", color: "#64748B" },
};

const FORM_VACIO = {
  tipo: "INSUMO", descripcion: "", proveedor: "", cantidad: "1", precioUnit: "",
  fecha: new Date().toISOString().slice(0, 10), factura: "", notas: "", animalId: "",
};

export default function ComprasPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [animales, setAnimales] = useState([]);
  const [busqAnimal, setBusqAnimal] = useState("");

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (fechaDesde) params.set("fechaDesde", fechaDesde);
      if (fechaHasta) params.set("fechaHasta", fechaHasta);
      const [data, st] = await Promise.all([
        api(`/compras?${params}`),
        api("/compras/estadisticas"),
      ]);
      setItems(data.items || []);
      setStats(st);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [filtroTipo, fechaDesde, fechaHasta]);

  useEffect(() => {
    if (form.tipo === "ANIMAL") {
      api("/animales").then(d => setAnimales(Array.isArray(d) ? d : (d.items || []))).catch(() => {});
    }
  }, [form.tipo]);

  const animalesFiltrados = animales.filter(a =>
    !busqAnimal || `${a.nombre || ""} ${a.arete || ""}`.toLowerCase().includes(busqAnimal.toLowerCase())
  );

  const total = Number(form.cantidad || 1) * Number(form.precioUnit || 0);

  async function guardar() {
    if (!form.descripcion || !form.precioUnit) return alert("Completa descripción y precio");
    if (form.tipo === "ANIMAL" && !form.animalId) return alert("Selecciona el animal comprado");
    setGuardando(true);
    try {
      await api("/compras", { method: "POST", body: { ...form, cantidad: Number(form.cantidad), precioUnit: Number(form.precioUnit) } });
      setShowModal(false);
      setForm(FORM_VACIO);
      await cargar();
    } catch (e) { alert(e.message); }
    finally { setGuardando(false); }
  }

  return (
    <AppLayout title="Compras" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div />
        <button onClick={() => { setForm(FORM_VACIO); setShowModal(true); }}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: T.green, color: T.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nueva compra
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total compras este mes", value: fmt(stats.totalMes), color: T.blue },
            { label: "Cantidad este mes", value: stats.cantidadMes, color: T.green },
            { label: "Mayor categoría", value: stats.porTipo?.[0]?.tipo || "—", color: T.orange },
          ].map(c => (
            <div key={c.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text }}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13 }} placeholder="Desde" />
        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13 }} placeholder="Hasta" />
        {(filtroTipo || fechaDesde || fechaHasta) && (
          <button onClick={() => { setFiltroTipo(""); setFechaDesde(""); setFechaHasta(""); }}
            style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, fontSize: 13, cursor: "pointer" }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
            No hay compras registradas. ¡Registra tu primera compra!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["Fecha", "Tipo", "Descripción", "Proveedor", "Cant.", "Precio unit.", "Total"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.textSec, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(c => {
                  const tc = TIPO_COLORS[c.tipo] || TIPO_COLORS.OTRO;
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec, whiteSpace: "nowrap" }}>
                        {new Date(c.fecha).toLocaleDateString("es-NI")}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: tc.bg, color: tc.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{c.tipo}</span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.text, maxWidth: 200 }}>{c.descripcion}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{c.proveedor || "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{Number(c.cantidad).toLocaleString("es-NI")}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{fmt(c.precioUnit)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: T.red }}>{fmt(c.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.white, borderRadius: 14, padding: 28, width: 460, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: T.text }}>Nueva compra</div>
            {/* Tipo */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 5 }}>Tipo *</div>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value, animalId: "" }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }}>
                {TIPOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Selector de animal (solo cuando tipo=ANIMAL) */}
            {form.tipo === "ANIMAL" && (
              <div style={{ marginBottom: 14, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>
                  Animal comprado * <span style={{ fontWeight: 400, color: T.textLight }}>(actualiza su costo base)</span>
                </div>
                <input placeholder="Buscar por arete o raza..." value={busqAnimal} onChange={e => setBusqAnimal(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, marginBottom: 8, boxSizing: "border-box" }} />
                <div style={{ maxHeight: 260, overflowY: "auto", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white }}>
                  {animalesFiltrados.length === 0 ? (
                    <div style={{ padding: 16, color: T.textLight, fontSize: 13, textAlign: "center" }}>No se encontraron animales</div>
                  ) : animalesFiltrados.map(a => {
                    const selec = form.animalId === a.id;
                    const foto = a.media?.find(m => m.tipo === "imagen" || m.tipo === "image" || m.url?.match(/\.(jpg|jpeg|png|webp)/i))?.url || null;
                    return (
                      <div key={a.id} onClick={() => setForm(f => ({ ...f, animalId: a.id, descripcion: f.descripcion || `Compra de animal #${a.arete || a.id.slice(0,6)}` }))}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${T.border}`, background: selec ? "#DCFCE7" : T.white, transition: "background .15s" }}>
                        {/* Foto */}
                        <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: `2px solid ${selec ? T.green : T.border}`, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {foto
                            ? <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                            : null}
                          <span style={{ fontSize: 22, display: foto ? "none" : "flex" }}>🐄</span>
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: selec ? T.green : T.text }}>
                            #{a.arete || "Sin arete"}
                          </div>
                          <div style={{ fontSize: 12, color: T.textSec }}>{a.raza || "Sin raza"} · {a.sexo === "MACHO" ? "Macho" : "Hembra"}</div>
                          {a.nombre && <div style={{ fontSize: 11, color: T.textLight }}>{a.nombre}</div>}
                        </div>
                        {/* Check */}
                        {selec && <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>✓</span>
                        </div>}
                      </div>
                    );
                  })}
                </div>
                {form.animalId && (
                  <div style={{ marginTop: 8, fontSize: 12, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    ✓ Animal seleccionado — el precio que ingreses se guardará como su costo base
                  </div>
                )}
              </div>
            )}

            {/* Resto de campos */}
            {[
              { label: "Descripción *", field: "descripcion", type: "text" },
              { label: "Proveedor / Vendedor", field: "proveedor", type: "text" },
              { label: form.tipo === "ANIMAL" ? "Cantidad de animales" : "Cantidad", field: "cantidad", type: "number" },
              { label: "Precio unitario (C$) *", field: "precioUnit", type: "number" },
              { label: "Fecha", field: "fecha", type: "date" },
              { label: "Número de factura", field: "factura", type: "text" },
              { label: "Notas", field: "notas", type: "textarea" },
            ].map(({ label, field, type }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 5 }}>{label}</div>
                {type === "textarea" ? (
                  <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
                ) : (
                  <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ background: T.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: T.textSec }}>Total calculado:</span>
              <span style={{ fontWeight: 800, color: T.red, fontSize: 16 }}>{fmt(total)}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowModal(false)} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: "pointer", fontWeight: 700 }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.white, cursor: "pointer", fontWeight: 700 }}>
                {guardando ? "Guardando..." : "Guardar compra"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
