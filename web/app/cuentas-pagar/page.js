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

const ESTADOS = ["PENDIENTE", "VENCIDA", "PAGADA", "CANCELADA"];
const ESTADO_STYLE = {
  PENDIENTE: { bg: T.orangeBg, color: T.orange, label: "Pendiente" },
  VENCIDA:   { bg: T.redBg, color: T.red, label: "Vencida" },
  PAGADA:    { bg: T.greenBg, color: T.green, label: "Pagada" },
  CANCELADA: { bg: "#F1F5F9", color: "#64748B", label: "Cancelada" },
};

const FORM_VACIO = { descripcion: "", proveedor: "", monto: "", fechaVence: "", notas: "" };

export default function CuentasPagarPage() {
  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.set("estado", filtroEstado);
      const [data, res] = await Promise.all([
        api(`/cuentas-pagar?${params}`),
        api("/cuentas-pagar/resumen"),
      ]);
      setItems(data.items || []);
      setResumen(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [filtroEstado]);

  async function guardar() {
    if (!form.descripcion || !form.monto || !form.fechaVence) return alert("Completa descripción, monto y fecha de vencimiento");
    setGuardando(true);
    try {
      await api("/cuentas-pagar", { method: "POST", body: { ...form, monto: Number(form.monto) } });
      setShowModal(false);
      setForm(FORM_VACIO);
      await cargar();
    } catch (e) { alert(e.message); }
    finally { setGuardando(false); }
  }

  async function marcarPagada(id) {
    try {
      await api(`/cuentas-pagar/${id}`, { method: "PATCH", body: { estado: "PAGADA" } });
      await cargar();
    } catch (e) { alert(e.message); }
  }

  async function cancelar(id) {
    if (!confirm("¿Cancelar esta cuenta?")) return;
    try {
      await api(`/cuentas-pagar/${id}`, { method: "PATCH", body: { estado: "CANCELADA" } });
      await cargar();
    } catch (e) { alert(e.message); }
  }

  return (
    <AppLayout title="Cuentas por pagar" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div />
        <button onClick={() => { setForm(FORM_VACIO); setShowModal(true); }}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: T.green, color: T.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nueva cuenta por pagar
        </button>
      </div>

      {/* Stats */}
      {resumen && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Pendiente total", value: fmt(resumen.totalPendiente), color: T.orange },
            { label: "Total vencido", value: fmt(resumen.totalVencido), color: T.red },
            { label: "Vence próx. 7 días", value: resumen.venceProximamente, color: T.blue },
            { label: "Pagadas este mes", value: resumen.pagadasEsteMes, color: T.green },
          ].map(c => (
            <div key={c.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setFiltroEstado("")}
          style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${!filtroEstado ? T.blue : T.border}`, background: !filtroEstado ? T.blueBg : T.white, color: !filtroEstado ? T.blue : T.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Todas
        </button>
        {ESTADOS.map(e => {
          const s = ESTADO_STYLE[e];
          const active = filtroEstado === e;
          return (
            <button key={e} onClick={() => setFiltroEstado(e)}
              style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${active ? s.color : T.border}`, background: active ? s.bg : T.white, color: active ? s.color : T.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📑</div>
            No hay cuentas por pagar con los filtros actuales.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["Descripción", "Proveedor", "Monto", "Fecha vence", "Estado", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.textSec, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(c => {
                  const s = ESTADO_STYLE[c.estado] || ESTADO_STYLE.PENDIENTE;
                  const vencida = c.estado === "VENCIDA";
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}`, background: vencida ? "#FFF5F5" : "" }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.text, fontWeight: 600 }}>{c.descripcion}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{c.proveedor || "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: vencida ? T.red : T.text }}>{fmt(c.monto)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: vencida ? T.red : T.textSec, whiteSpace: "nowrap", fontWeight: vencida ? 700 : 400 }}>
                        {new Date(c.fechaVence).toLocaleDateString("es-NI")}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {(c.estado === "PENDIENTE" || c.estado === "VENCIDA") && (
                            <button onClick={() => marcarPagada(c.id)}
                              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.green}`, background: T.greenBg, fontSize: 12, cursor: "pointer", color: T.green, fontWeight: 600, whiteSpace: "nowrap" }}>
                              Marcar pagada
                            </button>
                          )}
                          {(c.estado === "PENDIENTE") && (
                            <button onClick={() => cancelar(c.id)}
                              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, cursor: "pointer", color: T.textSec, fontWeight: 600 }}>
                              Cancelar
                            </button>
                          )}
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.white, borderRadius: 14, padding: 28, width: 420, maxWidth: "95vw" }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: T.text }}>Nueva cuenta por pagar</div>
            {[
              { label: "Descripción *", field: "descripcion", type: "text" },
              { label: "Proveedor", field: "proveedor", type: "text" },
              { label: "Monto (C$) *", field: "monto", type: "number" },
              { label: "Fecha de vencimiento *", field: "fechaVence", type: "date" },
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
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowModal(false)} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: "pointer", fontWeight: 700 }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.white, cursor: "pointer", fontWeight: 700 }}>
                {guardando ? "Guardando..." : "Crear cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
