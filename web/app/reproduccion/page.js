"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const T = {
  bg: "#F8FAFC", white: "#ffffff", text: "#172033", textSec: "#475569",
  textLight: "#94A3B8", border: "#E2E8F0", green: "#16a34a", greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0", red: "#DC2626", redBg: "#FEF2F2", orange: "#EA580C",
  orangeBg: "#FFF7ED", blue: "#2563EB", blueBg: "#EFF6FF",
};

function fmt(v, tipo = "moneda") {
  if (v === null || v === undefined || isNaN(v)) return "—";
  if (tipo === "numero") return Number(v).toLocaleString("es-NI");
  return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function edad(fechaNacimiento) {
  if (!fechaNacimiento) return "—";
  const diff = Date.now() - new Date(fechaNacimiento).getTime();
  const meses = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.5));
  if (meses < 12) return `${meses} m`;
  return `${Math.floor(meses / 12)} a ${meses % 12} m`;
}

const ESTADOS = [
  { value: "TODAS", label: "Todas" },
  { value: "PREÑADA", label: "Preñada" },
  { value: "PARIDA", label: "Parida" },
  { value: "LACTANCIA", label: "Lactancia" },
  { value: "SECA", label: "Seca" },
  { value: "VACIA", label: "Vacía" },
];

function badgeEstado(e) {
  const map = {
    PREÑADA: { bg: T.greenBg, color: T.green, label: "Preñada" },
    PARIDA: { bg: T.blueBg, color: T.blue, label: "Parida" },
    LACTANCIA: { bg: "#F0F9FF", color: "#0369A1", label: "Lactancia" },
    SECA: { bg: "#F1F5F9", color: "#64748B", label: "Seca" },
    VACIA: { bg: "#F1F5F9", color: "#64748B", label: "Vacía" },
  };
  const s = map[e] || { bg: T.orangeBg, color: T.orange, label: e || "Desconocido" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

const FORM_VACIO = { estadoReproductivo: "VACIA", fechaParto: "" };

export default function ReproduccionPage() {
  const [animales, setAnimales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("TODAS");
  const [filtroPotrero, setFiltroPotrero] = useState("");
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado !== "TODAS") params.set("estadoReproductivo", filtroEstado);
      if (filtroPotrero) params.set("potrero", filtroPotrero);
      const [lista, estadisticas] = await Promise.all([
        api(`/reproduccion?${params}`),
        api("/reproduccion/estadisticas"),
      ]);
      setAnimales(Array.isArray(lista) ? lista : []);
      setStats(estadisticas);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [filtroEstado, filtroPotrero]);

  async function guardar() {
    if (!selected) return;
    setGuardando(true);
    try {
      await api(`/reproduccion/${selected.id}/estado-reproductivo`, {
        method: "PATCH",
        body: { estadoReproductivo: form.estadoReproductivo, fechaParto: form.fechaParto || null },
      });
      setShowModal(false);
      setSelected(null);
      await cargar();
    } catch (e) { alert(e.message); }
    finally { setGuardando(false); }
  }

  const potreros = [...new Set(animales.map(a => a.potrero).filter(Boolean))];

  return (
    <AppLayout title="Reproducción" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total hembras", value: stats.totalHembras, color: T.blue },
            { label: "Preñadas", value: stats.totalPreñadas, color: T.green },
            { label: "Partos este mes", value: stats.partosEsteMes, color: T.orange },
            { label: "Tasa preñez", value: `${stats.tasaPreñez}%`, color: "#7C3AED" },
          ].map(c => (
            <div key={c.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {ESTADOS.map(e => (
            <button key={e.value} onClick={() => setFiltroEstado(e.value)}
              style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${filtroEstado === e.value ? T.green : T.border}`, background: filtroEstado === e.value ? T.greenBg : T.white, color: filtroEstado === e.value ? T.green : T.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {e.label}
            </button>
          ))}
        </div>
        {potreros.length > 0 && (
          <select value={filtroPotrero} onChange={e => setFiltroPotrero(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, fontSize: 13, color: T.text }}>
            <option value="">Todos los potreros</option>
            {potreros.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      {/* Tabla */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>Cargando...</div>
        ) : animales.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🐄</div>
            No hay hembras registradas con los filtros actuales.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["", "Nombre / Arete", "Raza", "Potrero", "Estado reproductivo", "Fecha probable parto", "Edad", "Peso", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.textSec, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {animales.map(a => {
                  const foto = a.media?.[0]?.url;
                  return (
                    <tr key={a.id} onClick={() => setSelected(a)}
                      style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: "10px 10px 10px 16px" }}>
                        {foto
                          ? <img src={foto} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                          : <div style={{ width: 40, height: 40, borderRadius: 8, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐄</div>
                        }
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{a.nombre || "Sin nombre"}</div>
                        <div style={{ color: T.textSec, fontSize: 12 }}>#{a.identificador}</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: T.textSec, fontSize: 13 }}>{a.raza || "—"}</td>
                      <td style={{ padding: "10px 14px", color: T.textSec, fontSize: 13 }}>{a.potrero || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>{badgeEstado(a.estadoReproductivo)}</td>
                      <td style={{ padding: "10px 14px", color: T.textSec, fontSize: 13, whiteSpace: "nowrap" }}>
                        {a.fechaParto ? new Date(a.fechaParto).toLocaleDateString("es-NI") : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: T.textSec, fontSize: 13 }}>{edad(a.fechaNacimiento)}</td>
                      <td style={{ padding: "10px 14px", color: T.textSec, fontSize: 13 }}>
                        {a.pesoActual ? `${Number(a.pesoActual).toLocaleString("es-NI")} lb` : "—"}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <button onClick={ev => { ev.stopPropagation(); setSelected(a); setForm({ estadoReproductivo: a.estadoReproductivo || "VACIA", fechaParto: a.fechaParto ? a.fechaParto.slice(0, 10) : "" }); setShowModal(true); }}
                          style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.white, fontSize: 12, cursor: "pointer", color: T.text, fontWeight: 600 }}>
                          Editar estado
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel lateral */}
      {selected && !showModal && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 340, background: T.white, borderLeft: `1px solid ${T.border}`, zIndex: 100, overflowY: "auto", padding: 24, boxShadow: "-4px 0 24px rgba(0,0,0,.08)" }}>
          <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textSec }}>✕</button>
          <div style={{ marginBottom: 16 }}>
            {selected.media?.[0]?.url
              ? <img src={selected.media[0].url} alt="" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10 }} />
              : <div style={{ width: "100%", height: 120, background: T.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🐄</div>
            }
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 4 }}>{selected.nombre || "Sin nombre"}</div>
          <div style={{ color: T.textSec, fontSize: 13, marginBottom: 12 }}>Arete: #{selected.identificador}</div>
          {badgeEstado(selected.estadoReproductivo)}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Raza", selected.raza || "—"],
              ["Potrero", selected.potrero || "—"],
              ["Edad", edad(selected.fechaNacimiento)],
              ["Peso actual", selected.pesoActual ? `${Number(selected.pesoActual).toLocaleString("es-NI")} lb` : "—"],
              ["Fecha probable parto", selected.fechaParto ? new Date(selected.fechaParto).toLocaleDateString("es-NI") : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.textSec }}>{k}</span>
                <span style={{ fontWeight: 600, color: T.text }}>{v}</span>
              </div>
            ))}
          </div>
          {selected.eventos?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>Partos registrados</div>
              {selected.eventos.map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: T.textSec, padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
                  {new Date(e.fecha).toLocaleDateString("es-NI")}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { setForm({ estadoReproductivo: selected.estadoReproductivo || "VACIA", fechaParto: selected.fechaParto ? selected.fechaParto.slice(0, 10) : "" }); setShowModal(true); }}
            style={{ marginTop: 20, width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Editar estado reproductivo
          </button>
        </div>
      )}

      {/* Modal editar estado */}
      {showModal && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.white, borderRadius: 14, padding: 28, width: 380, maxWidth: "95vw" }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, color: T.text }}>Editar estado reproductivo</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>Estado reproductivo</div>
            <select value={form.estadoReproductivo} onChange={e => setForm(f => ({ ...f, estadoReproductivo: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, marginBottom: 16 }}>
              {["PREÑADA", "PARIDA", "LACTANCIA", "SECA", "VACIA"].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>Fecha probable de parto</div>
            <input type="date" value={form.fechaParto} onChange={e => setForm(f => ({ ...f, fechaParto: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, marginBottom: 20, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowModal(false)} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: "pointer", fontWeight: 700, color: T.text }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.white, cursor: "pointer", fontWeight: 700 }}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
