"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

const REPRO_CONFIG = {
  PREÑADA:   { label: "Preñada",   color: "#e53e3e", bg: "rgba(229,62,62,0.2)",   icon: "🤰" },
  LACTANCIA: { label: "Lactancia", color: "#38a169", bg: "rgba(56,161,105,0.2)",  icon: "🍼" },
  PARIDA:    { label: "Parida",    color: "#d69e2e", bg: "rgba(214,158,46,0.2)",  icon: "🐮" },
  SECA:      { label: "Seca",      color: "#718096", bg: "rgba(113,128,150,0.2)", icon: "🌵" },
  VACIA:     { label: "Vacía",     color: "#805ad5", bg: "rgba(128,90,213,0.2)",  icon: "⬜" },
};
const ESTADOS_REPRO = ["PREÑADA", "LACTANCIA", "PARIDA", "SECA", "VACIA"];

const glass = { background: "rgba(5,25,12,0.70)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };
const gi = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" };

export default function AnimalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [animal, setAnimal] = useState(null);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mediaIdx, setMediaIdx] = useState(0);
  const [nuevosArchivos, setNuevosArchivos] = useState([]);
  const [eliminandoMedia, setEliminandoMedia] = useState(null);
  const [form, setForm] = useState({});

  async function load() {
    try {
      const res = await fetch(`${API_URL}/animales/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No encontrado");
      setAnimal(data);
      setForm({
        nombre: data.nombre || "",
        raza: data.raza || "",
        fierro: data.fierro || "",
        pesoActual: data.pesoActual || "",
        observacion: data.observacion || "",
        estadoReproductivo: data.estadoReproductivo || "",
        estado: data.estado || "ACTIVO",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleEdit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/animales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...form,
          pesoActual: form.pesoActual ? Number(form.pesoActual) : null,
          estadoReproductivo: animal?.sexo === "HEMBRA" ? (form.estadoReproductivo || null) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      // Subir nuevos archivos si hay
      if (nuevosArchivos.length > 0) {
        const fd = new FormData();
        Array.from(nuevosArchivos).forEach(f => fd.append("archivos", f));
        await fetch(`${API_URL}/animales/${id}/media`, {
          method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
        });
        setNuevosArchivos([]);
      }
      await load();
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function eliminarMedia(mediaId) {
    setEliminandoMedia(mediaId);
    try {
      await fetch(`${API_URL}/animales/${id}/media/${mediaId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      await load();
      setMediaIdx(0);
    } catch (err) {
      setError("No se pudo eliminar el archivo");
    } finally {
      setEliminandoMedia(null);
    }
  }

  async function handleDelete() {
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/animales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        // Si no hay DELETE, marcar como VENDIDO/eliminado lógicamente
        await fetch(`${API_URL}/animales/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ estado: "ELIMINADO" }),
        });
      }
      router.push("/inventario");
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  const todosMedia = animal?.media || [];
  const fotos = todosMedia.filter(m => m.tipo === "FOTO");
  const mediaActual = todosMedia[mediaIdx];
  const repro = animal?.estadoReproductivo ? REPRO_CONFIG[animal.estadoReproductivo] : null;

  if (error) return (
    <AppLayout title="Animal" subtitle="Inventario">
      <div className="text-center py-20">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button onClick={() => router.push("/inventario")} className="text-green-400 underline">← Volver al inventario</button>
      </div>
    </AppLayout>
  );

  if (!animal) return (
    <AppLayout title="Cargando..." subtitle="Inventario">
      <div className="text-center py-20 text-white/40 text-lg animate-pulse">Cargando animal...</div>
    </AppLayout>
  );

  return (
    <AppLayout title={animal.nombre || animal.identificador} subtitle="Perfil del Animal">

      {error && (
        <div className="mb-4 text-red-300 text-sm p-3 rounded-xl flex items-center justify-between"
          style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>
          {error}<button onClick={() => setError("")} className="ml-4">✕</button>
        </div>
      )}

      {/* Galería de fotos y videos */}
      {todosMedia.length > 0 && (
        <div className="rounded-3xl overflow-hidden mb-4 shadow-2xl relative" style={{ background: "#000" }}>
          {/* Visor principal */}
          {mediaActual?.tipo === "VIDEO" ? (
            <video
              key={mediaActual.url}
              src={mediaActual.url}
              controls
              playsInline
              className="w-full"
              style={{ maxHeight: 320, background: "#000", display: "block" }}
            />
          ) : (
            <img src={mediaActual?.url} className="w-full object-cover" style={{ maxHeight: 280 }}
              onError={e => { e.target.style.display="none"; }} />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3">
            <span className="text-white font-black px-3 py-1 rounded-full text-sm"
              style={{ background: animal.sexo === "HEMBRA" ? "rgba(246,135,179,0.85)" : "rgba(99,179,237,0.85)" }}>
              {animal.sexo === "HEMBRA" ? "♀ Hembra" : "♂ Macho"}
            </span>
          </div>
          {animal.estado === "VENDIDO" && (
            <div className="absolute top-3 right-3 text-white font-black px-3 py-1 rounded-full text-sm"
              style={{ background: "#d69e2e" }}>💰 Vendido</div>
          )}
          {mediaActual?.tipo === "VIDEO" && (
            <div className="absolute top-3" style={{ left: "50%", transform: "translateX(-50%)" }}>
              <span className="text-white font-black px-3 py-1 rounded-full text-xs"
                style={{ background: "rgba(0,0,0,0.6)" }}>🎬 Video</span>
            </div>
          )}

          {/* Miniaturas si hay más de 1 */}
          {todosMedia.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto" style={{ background: "rgba(0,0,0,0.6)" }}>
              {todosMedia.map((m, i) => (
                <button key={i} onClick={() => setMediaIdx(i)}
                  className="relative shrink-0 rounded-xl overflow-hidden transition-all hover:scale-105"
                  style={{ width: 60, height: 60, border: i === mediaIdx ? "2px solid #4ade80" : "2px solid transparent" }}>
                  {m.tipo === "VIDEO" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                      style={{ background: "linear-gradient(135deg,#1a3a6c,#2d9e3f)" }}>
                      <span style={{ fontSize: 22 }}>▶️</span>
                      <span className="text-white font-black" style={{ fontSize: 9 }}>VIDEO</span>
                    </div>
                  ) : (
                    <img src={m.url} className="w-full h-full object-cover"
                      onError={e => { e.target.style.display="none"; e.target.parentElement.innerHTML='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(45,158,63,0.2);font-size:20px">🐄</div>'; }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info principal */}
      <div className="rounded-3xl p-5 mb-4 shadow-xl" style={glass}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {fotos.length === 0 && (
              <div className="text-5xl mb-2">{animal.sexo === "HEMBRA" ? "🐄" : "🐂"}</div>
            )}
            <h2 className="text-white font-black text-2xl">{animal.nombre || "Sin nombre"}</h2>
            <p className="text-white/50 text-sm">Arete/ID: <span className="text-white font-bold">{animal.identificador}</span></p>
          </div>
          {repro && (
            <div className="px-3 py-2 rounded-2xl text-center shrink-0" style={{ background: repro.bg, border: `1px solid ${repro.color}` }}>
              <p className="text-2xl">{repro.icon}</p>
              <p className="font-black text-xs mt-0.5" style={{ color: repro.color }}>{repro.label}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Raza", value: animal.raza },
            { label: "Fierro", value: animal.fierro },
            { label: "Peso", value: animal.pesoActual ? `${animal.pesoActual} kg` : null },
            { label: "Estado", value: animal.estado },
          ].filter(f => f.value).map(f => (
            <div key={f.label} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/40 text-xs">{f.label}</p>
              <p className="text-white font-bold text-sm mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>

        {animal.observacion && (
          <div className="mt-3 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-white/40 text-xs mb-1">Observación</p>
            <p className="text-white/80 text-sm">{animal.observacion}</p>
          </div>
        )}

        {/* Parentesco */}
        {animal.madre && (
          <div className="mt-3 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-80"
            style={{ background: "rgba(56,161,105,0.15)", border: "1px solid rgba(56,161,105,0.3)" }}
            onClick={() => router.push(`/inventario/${animal.madre.id}`)}>
            <span className="text-2xl">🐄</span>
            <div>
              <p className="text-white/50 text-xs">Madre</p>
              <p className="text-white font-bold">{animal.madre.nombre || animal.madre.identificador}</p>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </div>
        )}
        {animal.crias?.length > 0 && (
          <div className="mt-3">
            <p className="text-white/40 text-xs mb-2">Crías ({animal.crias.length})</p>
            <div className="flex flex-col gap-2">
              {animal.crias.map(c => (
                <div key={c.id} className="rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-80"
                  style={{ background: "rgba(56,161,105,0.1)", border: "1px solid rgba(56,161,105,0.2)" }}
                  onClick={() => router.push(`/inventario/${c.id}`)}>
                  <span className="text-xl">🐃</span>
                  <p className="text-white font-bold text-sm">{c.nombre || c.identificador}</p>
                  <span className="ml-auto text-white/30">→</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Últimos eventos */}
      {animal.eventos?.length > 0 && (
        <div className="rounded-3xl p-5 mb-4 shadow-xl" style={glass}>
          <h3 className="text-white font-black mb-3">📋 Últimos Eventos</h3>
          <div className="space-y-2">
            {animal.eventos.slice(0, 5).map(ev => (
              <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: "#2d9e3f" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{ev.tipo}</p>
                  {ev.descripcion && <p className="text-white/50 text-xs">{ev.descripcion}</p>}
                  {ev.peso && <p className="text-green-400 text-xs">⚖️ {ev.peso} kg</p>}
                </div>
                <p className="text-white/30 text-xs shrink-0">{new Date(ev.fecha).toLocaleDateString("es", { dateStyle: "short" })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {!editando && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => setEditando(true)}
            className="text-white font-black py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-all"
            style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)", border: "1px solid rgba(255,255,255,0.2)" }}>
            ✏️ Editar
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="text-white font-black py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-all"
            style={{ background: "linear-gradient(135deg,#9b2626,#e53e3e)", border: "1px solid rgba(255,255,255,0.2)" }}>
            🗑️ Eliminar
          </button>
        </div>
      )}

      {/* Formulario de edición */}
      {editando && (
        <form onSubmit={handleEdit} className="rounded-3xl p-5 mb-4 space-y-4 shadow-xl" style={glass}>
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-lg">✏️ Editar Animal</h3>
            <button type="button" onClick={() => setEditando(false)} className="text-white/40 text-2xl leading-none">✕</button>
          </div>

          {/* Fotos y videos actuales */}
          {todosMedia.length > 0 && (
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Fotos y Videos actuales</p>
              <div className="flex gap-2 flex-wrap">
                {todosMedia.map((m) => (
                  <div key={m.id} className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 72, height: 72 }}>
                    {m.tipo === "VIDEO"
                      ? <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                          style={{ background: "linear-gradient(135deg,#1a3a6c,#2d9e3f)" }}>
                          <span style={{ fontSize: 20 }}>▶️</span>
                          <span className="text-white font-black" style={{ fontSize: 8 }}>VIDEO</span>
                        </div>
                      : <img src={m.url} className="w-full h-full object-cover" onError={e => e.target.style.opacity=0.3} />
                    }
                    <button type="button" onClick={() => eliminarMedia(m.id)}
                      disabled={eliminandoMedia === m.id}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-black"
                      style={{ background: "rgba(220,38,38,0.9)", fontSize: 10 }}>
                      {eliminandoMedia === m.id ? "…" : "✕"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agregar nuevos archivos */}
          <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.2)" }}>
            <p className="text-white/50 text-xs mb-2">➕ Agregar fotos o videos nuevos</p>
            <input type="file" accept="image/*,video/*" multiple className="w-full text-white/60 text-sm"
              onChange={e => setNuevosArchivos(e.target.files)} />
            {nuevosArchivos.length > 0 && (
              <p className="text-green-400 text-xs mt-2 font-bold">✅ {nuevosArchivos.length} archivo{nuevosArchivos.length > 1 ? "s" : ""} listo{nuevosArchivos.length > 1 ? "s" : ""} para subir</p>
            )}
          </div>

          {/* Campos de info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs">Nombre</label>
              <input className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                placeholder="Nombre del animal" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-white/50 text-xs">Raza</label>
              <input className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                placeholder="Ej: Brahman" value={form.raza} onChange={e => setForm({ ...form, raza: e.target.value })} />
            </div>
            <div>
              <label className="text-white/50 text-xs">Fierro</label>
              <input className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                placeholder="Ej: M20" value={form.fierro} onChange={e => setForm({ ...form, fierro: e.target.value })} />
            </div>
            <div>
              <label className="text-white/50 text-xs">Peso (kg)</label>
              <input type="number" className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                placeholder="Ej: 350" value={form.pesoActual} onChange={e => setForm({ ...form, pesoActual: e.target.value })} />
            </div>
            {animal.sexo === "HEMBRA" && (
              <div className="sm:col-span-2">
                <label className="text-white/50 text-xs">Estado Reproductivo</label>
                <select className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                  value={form.estadoReproductivo} onChange={e => setForm({ ...form, estadoReproductivo: e.target.value })}>
                  <option value="">Sin definir</option>
                  {ESTADOS_REPRO.map(e => (
                    <option key={e} value={e}>{REPRO_CONFIG[e].icon} {REPRO_CONFIG[e].label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="text-white/50 text-xs">Estado</label>
              <select className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="ACTIVO">Activo</option>
                <option value="VENDIDO">Vendido</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-xs">Observación</label>
              <textarea className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi} rows={3}
                placeholder="Notas sobre este animal..." value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={() => setEditando(false)}
              className="text-white/60 font-bold py-3 rounded-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando}
              className="text-white font-black py-3 rounded-2xl disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
              {enviando ? "Guardando..." : "✅ Guardar"}
            </button>
          </div>
        </form>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl" style={glass}>
            <div className="text-center">
              <p className="text-5xl mb-3">⚠️</p>
              <h3 className="text-white font-black text-xl">¿Eliminar animal?</h3>
              <p className="text-white/50 text-sm mt-2">
                Esta acción eliminará <span className="text-white font-bold">{animal.nombre || animal.identificador}</span> del inventario permanentemente.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="text-white/60 font-bold py-3 rounded-2xl"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={enviando}
                className="text-white font-black py-3 rounded-2xl disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#9b2626,#e53e3e)" }}>
                {enviando ? "..." : "🗑️ Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
