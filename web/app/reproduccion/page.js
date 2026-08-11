"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const T = {
  bg: "#F8FAFC", white: "#ffffff", text: "#172033", textSec: "#475569",
  textLight: "#94A3B8", border: "#E2E8F0", green: "#16a34a", greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0", red: "#DC2626", redBg: "#FEF2F2", orange: "#EA580C",
  orangeBg: "#FFF7ED", blue: "#2563EB", blueBg: "#EFF6FF", purple: "#7C3AED", purpleBg: "#F5F3FF",
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

function fechaPartoLabel(fechaParto, dias) {
  if (!fechaParto) return "—";
  const d = new Date(fechaParto);
  const label = d.toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" });
  if (dias === null || dias === undefined) return label;
  if (dias < 0) return `${label} (hace ${Math.abs(dias)} días)`;
  if (dias === 0) return `${label} (¡hoy!)`;
  return `${label} (faltan ${dias} días)`;
}

function urgenciaColor(dias) {
  if (dias === null || dias === undefined) return null;
  if (dias <= 7)  return { color: T.red,    bg: T.redBg,    label: "URGENTE" };
  if (dias <= 21) return { color: T.orange,  bg: T.orangeBg, label: "PRONTO" };
  if (dias <= 45) return { color: "#D97706", bg: "#FFFBEB",  label: "PRÓXIMO" };
  return null;
}

const ESTADOS = [
  { value: "TODAS",     label: "Todas" },
  { value: "PREÑADA",   label: "🤰 Preñadas" },
  { value: "PARIDA",    label: "🍼 Paridas" },
  { value: "LACTANCIA", label: "🥛 Lactancia" },
  { value: "SECA",      label: "💤 Seca" },
  { value: "VACIA",     label: "⬜ Vacía" },
];

const BADGE_MAP = {
  PREÑADA:   { bg: T.greenBg,  color: T.green,  label: "Preñada" },
  PARIDA:    { bg: T.blueBg,   color: T.blue,   label: "Parida" },
  LACTANCIA: { bg: "#F0F9FF",  color: "#0369A1",label: "Lactancia" },
  SECA:      { bg: "#F1F5F9",  color: "#64748B",label: "Seca" },
  VACIA:     { bg: "#F1F5F9",  color: "#64748B",label: "Vacía" },
};

function Badge({ estado }) {
  const s = BADGE_MAP[estado] || { bg: T.orangeBg, color: T.orange, label: estado || "—" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function Sk({ w = "100%", h = 14, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "#E2E8F0", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

// ── Modal: Registrar Monta ──────────────────────────────────────────────────
function ModalMonta({ animal, onClose, onSuccess }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ fechaMonta: hoy, notasMonta: "" });
  const [guardando, setGuardando] = useState(false);

  const fechaProbable = form.fechaMonta
    ? new Date(new Date(form.fechaMonta).getTime() + 283 * 24 * 60 * 60 * 1000)
    : null;

  async function guardar() {
    setGuardando(true);
    try {
      await api(`/reproduccion/${animal.id}/monta`, { method: "POST", body: form });
      onSuccess();
      onClose();
    } catch (e) { alert(e.message); } finally { setGuardando(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.white, borderRadius: 16, padding: 28, width: 420, maxWidth: "95vw" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: T.text }}>🐄 Registrar Monta</div>
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 20 }}>{animal.nombre || animal.identificador}</div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>Fecha de monta / inseminación</label>
          <input type="date" value={form.fechaMonta} onChange={e => setForm(f => ({ ...f, fechaMonta: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }} />
        </div>

        {fechaProbable && (
          <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.green, marginBottom: 2 }}>📅 Fecha probable de parto</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>
              {fechaProbable.toLocaleDateString("es-NI", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Gestación bovina: 283 días desde la monta</div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>Notas (toro, tipo de servicio, etc.)</label>
          <input type="text" placeholder="Ej: Monta con toro Simmental..." value={form.notasMonta}
            onChange={e => setForm(f => ({ ...f, notasMonta: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, fontWeight: 700, cursor: "pointer", color: T.text }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {guardando ? "Guardando..." : "Registrar monta"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Registrar Parto ──────────────────────────────────────────────────
function ModalParto({ animal, onClose, onSuccess }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ fechaParto: hoy, notas: "" });
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      await api(`/reproduccion/${animal.id}/parto`, { method: "POST", body: form });
      onSuccess();
      onClose();
    } catch (e) { alert(e.message); } finally { setGuardando(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.white, borderRadius: 16, padding: 28, width: 420, maxWidth: "95vw" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: T.text }}>🍼 Registrar Parto</div>
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 20 }}>{animal.nombre || animal.identificador}</div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>Fecha del parto</label>
          <input type="date" value={form.fechaParto} onChange={e => setForm(f => ({ ...f, fechaParto: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>Notas (sexo de la cría, peso, incidencias…)</label>
          <textarea rows={3} placeholder="Ej: Parto normal, ternero macho de 60 lb..." value={form.notas}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box", resize: "none" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, fontWeight: 700, cursor: "pointer", color: T.text }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: T.blue, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {guardando ? "Guardando..." : "Confirmar parto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Editar estado reproductivo ──────────────────────────────────────
function ModalEstado({ animal, onClose, onSuccess }) {
  const [form, setForm] = useState({
    estadoReproductivo: animal.estadoReproductivo || "VACIA",
    fechaParto: animal.fechaParto ? new Date(animal.fechaParto).toISOString().slice(0, 10) : "",
  });
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      await api(`/reproduccion/${animal.id}/estado-reproductivo`, {
        method: "PATCH",
        body: { estadoReproductivo: form.estadoReproductivo, fechaParto: form.fechaParto || null },
      });
      onSuccess();
      onClose();
    } catch (e) { alert(e.message); } finally { setGuardando(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.white, borderRadius: 16, padding: 28, width: 400, maxWidth: "95vw" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: T.text }}>✏️ Estado reproductivo</div>
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 20 }}>{animal.nombre || animal.identificador}</div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>Estado</label>
          <select value={form.estadoReproductivo} onChange={e => setForm(f => ({ ...f, estadoReproductivo: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14 }}>
            {["PREÑADA", "PARIDA", "LACTANCIA", "SECA", "VACIA"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.textSec, marginBottom: 6 }}>Fecha probable de parto</label>
          <input type="date" value={form.fechaParto} onChange={e => setForm(f => ({ ...f, fechaParto: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, fontWeight: 700, cursor: "pointer", color: T.text }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel lateral de detalle ────────────────────────────────────────────────
function PanelDetalle({ animal, onClose, onRefresh }) {
  const [modal, setModal] = useState(null);
  const foto = animal.media?.[0]?.url;
  const urg = urgenciaColor(animal.diasHastaParto);

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: T.white, borderLeft: `1px solid ${T.border}`, zIndex: 200, overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,.1)" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.08)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>✕</button>

      {/* Foto */}
      <div style={{ height: 200, background: T.border, overflow: "hidden", position: "relative" }}>
        {foto
          ? <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🐄</div>
        }
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: T.text, marginBottom: 2 }}>{animal.nombre || "Sin nombre"}</div>
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 10 }}>Arete #{animal.identificador}</div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <Badge estado={animal.estadoReproductivo} />
          {urg && <span style={{ background: urg.bg, color: urg.color, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 800 }}>{urg.label}</span>}
        </div>

        {/* Countdown si está preñada */}
        {animal.estadoReproductivo === "PREÑADA" && animal.fechaParto && (
          <div style={{
            background: urg ? urg.bg : T.greenBg,
            border: `1px solid ${urg ? urg.color + "44" : T.greenBorder}`,
            borderRadius: 12, padding: "14px 16px", marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Fecha probable de parto</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: urg ? urg.color : T.green }}>
              {new Date(animal.fechaParto).toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
              {animal.diasHastaParto !== null && animal.diasHastaParto !== undefined
                ? animal.diasHastaParto <= 0 ? "¡Fecha de parto pasada!" : `Faltan ${animal.diasHastaParto} días`
                : "—"
              }
            </div>
          </div>
        )}

        {/* Datos */}
        {[
          ["Raza", animal.raza || "—"],
          ["Potrero", animal.potrero || "—"],
          ["Edad", edad(animal.fechaNacimiento)],
          ["Peso actual", animal.pesoActual ? `${Number(animal.pesoActual).toLocaleString("es-NI")} lb` : "—"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.textSec }}>{k}</span>
            <span style={{ fontWeight: 600, color: T.text }}>{v}</span>
          </div>
        ))}

        {/* Historial de partos */}
        {animal.eventos?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>Partos registrados</div>
            {animal.eventos.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: T.bg, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>🍼</span>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{new Date(e.fecha).toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            ))}
          </div>
        )}

        {/* Acciones */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setModal("monta")}
            style={{ padding: "11px 0", borderRadius: 10, border: "none", background: T.green, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            🐄 Registrar monta / inseminación
          </button>
          {animal.estadoReproductivo === "PREÑADA" && (
            <button onClick={() => setModal("parto")}
              style={{ padding: "11px 0", borderRadius: 10, border: "none", background: T.blue, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              🍼 Registrar parto
            </button>
          )}
          <button onClick={() => setModal("estado")}
            style={{ padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, color: T.text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ✏️ Cambiar estado reproductivo
          </button>
        </div>
      </div>

      {modal === "monta"  && <ModalMonta  animal={animal} onClose={() => setModal(null)} onSuccess={onRefresh} />}
      {modal === "parto"  && <ModalParto  animal={animal} onClose={() => setModal(null)} onSuccess={onRefresh} />}
      {modal === "estado" && <ModalEstado animal={animal} onClose={() => setModal(null)} onSuccess={onRefresh} />}
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function ReproduccionPage() {
  const [animales, setAnimales]     = useState([]);
  const [proximas, setProximas]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [filtroEstado, setFiltro]   = useState("TODAS");
  const [filtroPotrero, setPotrero] = useState("");
  const [selected, setSelected]     = useState(null);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado !== "TODAS") params.set("estadoReproductivo", filtroEstado);
      if (filtroPotrero) params.set("potrero", filtroPotrero);
      const [lista, estadisticas, prox] = await Promise.all([
        api(`/reproduccion?${params}`),
        api("/reproduccion/estadisticas"),
        api("/reproduccion/proximas-parir"),
      ]);
      setAnimales(Array.isArray(lista) ? lista : []);
      setStats(estadisticas);
      setProximas(Array.isArray(prox) ? prox : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function onRefresh() {
    setSelected(null);
    cargar();
  }

  useEffect(() => { cargar(); }, [filtroEstado, filtroPotrero]);

  const potreros = [...new Set(animales.map(a => a.potrero).filter(Boolean))];

  return (
    <AppLayout title="Reproducción" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }`}</style>

      {/* ── Banner: próximas a parir ────────────────────────────────── */}
      {!loading && proximas.length > 0 && (
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 14 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#92400E", marginBottom: 6 }}>
              {proximas.length} vaca{proximas.length > 1 ? "s" : ""} próxima{proximas.length > 1 ? "s" : ""} a parir en los próximos 45 días
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {proximas.map(a => {
                const urg = urgenciaColor(a.diasHastaParto);
                return (
                  <button key={a.id} onClick={() => setSelected(a)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, border: `1px solid ${urg ? urg.color + "55" : "#FDE68A"}`, background: urg ? urg.bg : "#FEF9C3", cursor: "pointer" }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: urg ? urg.color : "#92400E" }}>
                      {a.nombre || a.identificador}
                    </span>
                    <span style={{ fontSize: 11, color: "#92400E" }}>
                      {a.diasHastaParto !== null ? `${a.diasHastaParto}d` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
        {loading
          ? [1,2,3,4,5].map(i => <div key={i} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}><Sk h={12} w="60%" /><Sk h={28} w="40%" /></div>)
          : [
            { label: "Total hembras",    value: stats?.totalHembras  || 0, color: T.blue   },
            { label: "Preñadas",         value: stats?.totalPreñadas || 0, color: T.green  },
            { label: "Próximas (30d)",   value: stats?.proximasAParir|| 0, color: "#D97706"},
            { label: "Partos este mes",  value: stats?.partosEsteMes || 0, color: T.orange },
            { label: "Tasa de preñez",   value: `${stats?.tasaPreñez || 0}%`, color: T.purple },
          ].map(c => (
            <div key={c.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: c.color }}>{c.value}</div>
            </div>
          ))
        }
      </div>

      {/* ── Gráfica de partos últimos 6 meses ──────────────────────── */}
      {!loading && stats?.partosUltimos6Meses?.length > 0 && (
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Partos últimos 6 meses</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 60 }}>
            {stats.partosUltimos6Meses.map(m => {
              const max = Math.max(...stats.partosUltimos6Meses.map(x => x.cantidad), 1);
              const h = max > 0 ? Math.round((m.cantidad / max) * 48) + 4 : 4;
              return (
                <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec }}>{m.cantidad || ""}</div>
                  <div style={{ width: "100%", height: h, background: m.cantidad > 0 ? T.blue : T.border, borderRadius: 4 }} />
                  <div style={{ fontSize: 10, color: T.textLight }}>{m.mes.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ESTADOS.map(e => (
            <button key={e.value} onClick={() => setFiltro(e.value)}
              style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${filtroEstado === e.value ? T.green : T.border}`, background: filtroEstado === e.value ? T.greenBg : T.white, color: filtroEstado === e.value ? T.green : T.text, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {e.label}
            </button>
          ))}
        </div>
        {potreros.length > 0 && (
          <select value={filtroPotrero} onChange={e => setPotrero(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, fontSize: 13, color: T.text }}>
            <option value="">Todos los potreros</option>
            {potreros.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginRight: selected ? 376 : 0, transition: "margin-right .2s" }}>
        {loading ? (
          <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3,4].map(i => <Sk key={i} h={50} r={8} />)}
          </div>
        ) : animales.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: T.textSec }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🐄</div>
            <div style={{ fontWeight: 700 }}>No hay hembras con los filtros actuales</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["", "Animal", "Estado", "Próximo parto", "Potrero", "Edad", "Peso lb", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {animales.map(a => {
                  const foto = a.media?.[0]?.url;
                  const urg = urgenciaColor(a.diasHastaParto);
                  const esSelected = selected?.id === a.id;
                  return (
                    <tr key={a.id}
                      onClick={() => setSelected(esSelected ? null : a)}
                      style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: esSelected ? T.greenBg : undefined, transition: "background .12s" }}
                      onMouseEnter={e => { if (!esSelected) e.currentTarget.style.background = T.bg; }}
                      onMouseLeave={e => { if (!esSelected) e.currentTarget.style.background = ""; }}>

                      <td style={{ padding: "8px 8px 8px 14px" }}>
                        {foto
                          ? <img src={foto} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover" }} />
                          : <div style={{ width: 38, height: 38, borderRadius: 8, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐄</div>
                        }
                      </td>

                      <td style={{ padding: "8px 14px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{a.nombre || "Sin nombre"}</div>
                        <div style={{ fontSize: 12, color: T.textLight }}>#{a.identificador}</div>
                      </td>

                      <td style={{ padding: "8px 14px" }}><Badge estado={a.estadoReproductivo} /></td>

                      <td style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>
                        {a.fechaParto ? (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: urg ? urg.color : T.text }}>
                              {new Date(a.fechaParto).toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                            {a.diasHastaParto !== null && a.diasHastaParto !== undefined && (
                              <div style={{ fontSize: 11, fontWeight: 700, color: urg ? urg.color : T.textSec,
                                background: urg ? urg.bg : "transparent", padding: urg ? "1px 7px" : 0, borderRadius: 99, display: "inline-block", marginTop: 2 }}>
                                {a.diasHastaParto <= 0 ? "¡Fecha pasada!" : `Faltan ${a.diasHastaParto}d`}
                              </div>
                            )}
                          </div>
                        ) : "—"}
                      </td>

                      <td style={{ padding: "8px 14px", fontSize: 13, color: T.textSec }}>{a.potrero || "—"}</td>
                      <td style={{ padding: "8px 14px", fontSize: 13, color: T.textSec }}>{edad(a.fechaNacimiento)}</td>
                      <td style={{ padding: "8px 14px", fontSize: 13, color: T.textSec }}>{a.pesoActual ? Number(a.pesoActual).toLocaleString("es-NI") : "—"}</td>

                      <td style={{ padding: "8px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={ev => { ev.stopPropagation(); setSelected(a); }}
                            style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.white, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                            Ver
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

      {/* ── Panel lateral ───────────────────────────────────────────── */}
      {selected && (
        <PanelDetalle animal={selected} onClose={() => setSelected(null)} onRefresh={onRefresh} />
      )}
    </AppLayout>
  );
}
