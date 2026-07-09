"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

const TIPOS = [
  { key: "VACUNACION",      label: "Vacunación",      icon: "💉", color: "#e53e3e" },
  { key: "DESPARASITACION", label: "Desparasitación", icon: "🧪", color: "#d69e2e" },
  { key: "TRATAMIENTO",     label: "Tratamiento",     icon: "🩺", color: "#3182ce" },
  { key: "PESAJE",          label: "Pesaje",          icon: "⚖️", color: "#38a169" },
  { key: "INSEMINACION",    label: "Inseminación",    icon: "🤰", color: "#805ad5" },
  { key: "DESTETE",         label: "Destete",         icon: "🐣", color: "#dd6b20" },
  { key: "OTRO",            label: "Otro",            icon: "📋", color: "#718096" },
];

function tipoInfo(tipo) { return TIPOS.find(t => t.key === tipo) || TIPOS[6]; }

const glass = { background: "rgba(5,25,12,0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };
const gi = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", outline: "none" };

export default function EventosPage() {
  const router = useRouter();
  const [tareas, setTareas] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ tipo: "VACUNACION", descripcion: "", fecha: "" });
  const [selAnimales, setSelAnimales] = useState([]);
  const [busqAnimal, setBusqAnimal] = useState("");

  async function load() {
    try {
      const [t, a] = await Promise.all([api("/tareas"), api("/animales")]);
      setTareas(Array.isArray(t) ? t : []);
      setAnimales(Array.isArray(a) ? a.filter(x => x.estado === "ACTIVO") : []);
    } catch (err) {
      if (err.message.includes("autenticado") || err.message.includes("inválido")) router.push("/");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.fecha) return setError("Debes seleccionar una fecha");
    if (selAnimales.length === 0) return setError("Debes seleccionar al menos un animal");
    setEnviando(true); setError("");
    try {
      const res = await fetch(`${API_URL}/tareas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, animalIds: selAnimales }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error al crear");
      setShowForm(false);
      setForm({ tipo: "VACUNACION", descripcion: "", fecha: "" });
      setSelAnimales([]);
      setBusqAnimal("");
      load();
    } catch (err) { setError(err.message); } finally { setEnviando(false); }
  }

  async function completar(id) {
    try {
      await api(`/tareas/${id}/completar`, { method: "PATCH" });
      load();
    } catch (err) { alert("Error: " + err.message); }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar esta tarea permanentemente?")) return;
    try {
      await api(`/tareas/${id}`, { method: "DELETE" });
      load();
    } catch (err) { alert("Error: " + err.message); }
  }

  function toggleAnimal(id) {
    setSelAnimales(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  const animalesFiltrados = animales.filter(a => {
    const q = busqAnimal.toLowerCase();
    return (a.nombre || "").toLowerCase().includes(q) || (a.identificador || "").toLowerCase().includes(q) || (a.raza || "").toLowerCase().includes(q);
  });

  const tareasFiltradas = tareas
    .filter(t => filtro === "TODOS" ? true : t.estado === filtro)
    .filter(t => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (t.tipo || "").toLowerCase().includes(q) || (t.descripcion || "").toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const pendientes = tareas.filter(t => t.estado === "PENDIENTE").length;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const proximas = tareas.filter(t => {
    const f = new Date(t.fecha); f.setHours(0,0,0,0);
    return t.estado === "PENDIENTE" && f >= hoy && f <= new Date(hoy.getTime() + 7*86400000);
  }).length;

  return (
    <AppLayout title="Eventos y Tareas" subtitle="Gestión de Ganado">

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Pendientes", valor: pendientes, color: "#e53e3e", icon: "⏳" },
          { label: "Próx. 7 días", valor: proximas, color: "#d69e2e", icon: "📅" },
          { label: "Completadas", valor: tareas.filter(t => t.estado === "COMPLETADA").length, color: "#38a169", icon: "✅" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: `${s.color}18`, border: `1px solid ${s.color}40` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.icon} {s.valor}</p>
            <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Botón nuevo */}
      <button onClick={() => setShowForm(s => !s)}
        className="w-full text-white rounded-2xl py-3 font-black text-lg mb-4 flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] transition-transform"
        style={{ background: showForm ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg,#1a6b2a,#2d9e3f)", border: "1px solid rgba(255,255,255,0.2)" }}>
        {showForm ? "✕ Cancelar" : "+ Nueva Tarea / Evento"}
      </button>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-3xl p-5 mb-5 space-y-4" style={glass}>
          <h3 className="text-white font-black text-lg">Nueva Tarea</h3>
          {error && <p className="text-red-400 text-sm bg-red-900/30 rounded-xl px-3 py-2">{error}</p>}

          {/* Tipo */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Tipo de tarea *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIPOS.map(t => (
                <button key={t.key} type="button" onClick={() => setForm({ ...form, tipo: t.key })}
                  className="py-2 px-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  style={{
                    background: form.tipo === t.key ? `${t.color}30` : "rgba(255,255,255,0.06)",
                    border: form.tipo === t.key ? `2px solid ${t.color}` : "1px solid rgba(255,255,255,0.15)",
                    color: form.tipo === t.key ? t.color : "rgba(255,255,255,0.6)",
                  }}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha y descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs">Fecha programada *</label>
              <input type="date" className="w-full rounded-xl px-3 py-2.5 text-sm mt-0.5" style={gi}
                value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
            </div>
            <div>
              <label className="text-white/50 text-xs">Descripción / Notas</label>
              <input className="w-full rounded-xl px-3 py-2.5 text-sm mt-0.5" style={gi}
                placeholder="Ej: Dosis anual contra aftosa..."
                value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>
          </div>

          {/* Selección de animales */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/50 text-xs">Seleccionar animales * ({selAnimales.length} seleccionados)</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelAnimales(animales.map(a => a.id))}
                  className="text-xs text-green-400 font-bold hover:underline">Todos</button>
                <button type="button" onClick={() => setSelAnimales([])}
                  className="text-xs text-white/40 font-bold hover:underline">Ninguno</button>
              </div>
            </div>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
              <input className="w-full rounded-xl pl-8 pr-3 py-2 text-sm" style={gi}
                placeholder="Buscar animal..." value={busqAnimal} onChange={e => setBusqAnimal(e.target.value)} />
            </div>
            <div className="rounded-2xl overflow-auto max-h-52 space-y-1 p-1" style={{ background: "rgba(0,0,0,0.3)" }}>
              {animalesFiltrados.length === 0 && (
                <p className="text-white/30 text-xs text-center py-4">No hay animales activos</p>
              )}
              {animalesFiltrados.map(a => {
                const sel = selAnimales.includes(a.id);
                return (
                  <button key={a.id} type="button" onClick={() => toggleAnimal(a.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
                    style={{ background: sel ? "rgba(45,158,63,0.25)" : "rgba(255,255,255,0.04)", border: sel ? "1px solid rgba(45,158,63,0.5)" : "1px solid transparent" }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-black"
                      style={{ background: sel ? "#2d9e3f" : "rgba(255,255,255,0.1)", color: "white" }}>
                      {sel ? "✓" : ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold truncate">{a.nombre || a.identificador}</p>
                      <p className="text-white/40 text-xs">{a.raza || "Sin raza"} · {a.identificador} · {a.sexo === "HEMBRA" ? "♀" : "♂"}</p>
                    </div>
                    {a.estadoReproductivo && <span className="text-white/40 text-xs shrink-0">{a.estadoReproductivo}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-white/30 text-xs">📧 Se enviará un email automático a todos tus trabajadores con la lista de animales y la fecha.</p>

          <button onClick={handleCreate} disabled={enviando}
            className="w-full text-white font-black py-3 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
            {enviando ? "Guardando y enviando..." : `✅ Crear tarea y notificar trabajadores`}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: "PENDIENTE", label: "⏳ Pendientes" },
          { key: "COMPLETADA", label: "✅ Completadas" },
          { key: "TODOS", label: "📋 Todas" },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
            style={{
              background: filtro === f.key ? "rgba(45,158,63,0.3)" : "rgba(255,255,255,0.06)",
              border: filtro === f.key ? "1px solid #2d9e3f" : "1px solid rgba(255,255,255,0.15)",
              color: filtro === f.key ? "#4ade80" : "rgba(255,255,255,0.5)",
            }}>
            {f.label}
          </button>
        ))}
        <input className="ml-auto rounded-xl px-3 py-1.5 text-xs" style={{ ...gi, minWidth: 140 }}
          placeholder="🔍 Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {/* Lista de tareas */}
      {loading ? (
        <div className="text-center py-20 text-white/30">Cargando...</div>
      ) : tareasFiltradas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-white/40 font-bold">No hay tareas {filtro === "PENDIENTE" ? "pendientes" : ""}</p>
          <p className="text-white/30 text-sm mt-1">Crea una nueva tarea con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tareasFiltradas.map(tarea => {
            const ti = tipoInfo(tarea.tipo);
            const fecha = new Date(tarea.fecha);
            const hoyD = new Date(); hoyD.setHours(0,0,0,0);
            const fechaD = new Date(fecha); fechaD.setHours(0,0,0,0);
            const diasRestantes = Math.round((fechaD - hoyD) / 86400000);
            const vencida = tarea.estado === "PENDIENTE" && diasRestantes < 0;
            const urgente = tarea.estado === "PENDIENTE" && diasRestantes >= 0 && diasRestantes <= 2;

            return (
              <div key={tarea.id} className="rounded-2xl p-4" style={{
                ...glass,
                border: vencida ? "1px solid rgba(229,62,62,0.5)" : urgente ? "1px solid rgba(214,158,46,0.5)" : "1px solid rgba(255,255,255,0.12)",
              }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${ti.color}20`, border: `1px solid ${ti.color}40` }}>
                    {ti.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-black text-sm">{ti.label}</p>
                      {tarea.estado === "COMPLETADA" && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(56,161,105,0.25)", color: "#68d391" }}>✅ Completada</span>}
                      {vencida && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(229,62,62,0.25)", color: "#fc8181" }}>⚠️ Vencida</span>}
                      {urgente && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(214,158,46,0.25)", color: "#f6e05e" }}>🔔 Próxima</span>}
                    </div>
                    <p className="text-white/50 text-xs mt-0.5">
                      📅 {fecha.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {tarea.estado === "PENDIENTE" && (
                        <span style={{ color: vencida ? "#fc8181" : diasRestantes === 0 ? "#f6e05e" : "rgba(255,255,255,0.4)" }}>
                          {" · "}{diasRestantes < 0 ? `Hace ${Math.abs(diasRestantes)} día(s)` : diasRestantes === 0 ? "Hoy" : `En ${diasRestantes} día(s)`}
                        </span>
                      )}
                    </p>
                    {tarea.descripcion && <p className="text-white/40 text-xs mt-1 italic">"{tarea.descripcion}"</p>}

                    {/* Animales */}
                    {tarea.animales?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-white/40 text-xs mb-1">🐄 {tarea.animales.length} animal(es):</p>
                        <div className="flex flex-wrap gap-1">
                          {tarea.animales.slice(0, 6).map(ta => (
                            <span key={ta.id} className="text-xs px-2 py-0.5 rounded-lg font-bold"
                              style={{ background: "rgba(45,158,63,0.2)", color: "#68d391", border: "1px solid rgba(45,158,63,0.3)" }}>
                              {ta.animal.nombre || ta.animal.identificador}
                            </span>
                          ))}
                          {tarea.animales.length > 6 && (
                            <span className="text-xs px-2 py-0.5 rounded-lg" style={{ color: "rgba(255,255,255,0.3)" }}>
                              +{tarea.animales.length - 6} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                {tarea.estado === "PENDIENTE" && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => completar(tarea.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-black"
                      style={{ background: "rgba(56,161,105,0.25)", border: "1px solid rgba(56,161,105,0.4)", color: "#68d391" }}>
                      ✅ Marcar completada
                    </button>
                    <button onClick={() => eliminar(tarea.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(116,42,42,0.4)", border: "1px solid rgba(229,62,62,0.3)", color: "#fc8181" }}>
                      🗑️
                    </button>
                  </div>
                )}
                {tarea.estado === "COMPLETADA" && (
                  <button onClick={() => eliminar(tarea.id)}
                    className="mt-3 w-full py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "rgba(116,42,42,0.2)", border: "1px solid rgba(229,62,62,0.2)", color: "rgba(252,129,129,0.6)" }}>
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
