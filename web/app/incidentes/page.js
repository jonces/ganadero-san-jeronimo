"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/AppLayout";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

const TIPOS = [
  { value: "ENFERMEDAD", label: "🤒 Enfermedad", color: "#e53e3e" },
  { value: "ACCIDENTE", label: "⚠️ Accidente", color: "#ed8936" },
  { value: "MUERTE", label: "💀 Muerte", color: "#2d3748" },
  { value: "OTRO", label: "📋 Otro", color: "#718096" },
];

const GRAVEDADES = [
  { value: "LEVE", label: "🟡 Leve", color: "#d69e2e" },
  { value: "MODERADA", label: "🟠 Moderada", color: "#ed8936" },
  { value: "GRAVE", label: "🔴 Grave", color: "#e53e3e" },
  { value: "CRITICA", label: "⚫ Crítica", color: "#2d3748" },
];

export default function IncidentesPage() {
  const router = useRouter();
  const [incidentes, setIncidentes] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [form, setForm] = useState({
    tipo: "ENFERMEDAD", gravedad: "LEVE", descripcion: "",
    tratamiento: "", animalId: "", fecha: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    const [r1, r2] = await Promise.all([
      fetch(`${API_URL}/incidentes`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      fetch(`${API_URL}/animales`, { headers: { Authorization: `Bearer ${getToken()}` } }),
    ]);
    const [inc, ani] = await Promise.all([r1.json(), r2.json()]);
    if (r1.ok) setIncidentes(inc);
    if (r2.ok) setAnimales(ani);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      Array.from(archivos).forEach((f) => fd.append("archivos", f));
      const res = await fetch(`${API_URL}/incidentes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setForm({ tipo: "ENFERMEDAD", gravedad: "LEVE", descripcion: "", tratamiento: "", animalId: "", fecha: new Date().toISOString().slice(0, 10) });
      setArchivos([]);
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function resolver(id) {
    await fetch(`${API_URL}/incidentes/${id}/resolver`, { method: "PATCH", headers: { Authorization: `Bearer ${getToken()}` } });
    load();
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este incidente permanentemente? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`${API_URL}/incidentes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) load();
    else alert("Error al eliminar el incidente. Intente de nuevo.");
  }

  const activos = incidentes.filter((i) => i.estado === "ACTIVO");
  const resueltos = incidentes.filter((i) => i.estado === "RESUELTO");

  return (
    <AppLayout title="🚨 Incidentes" subtitle="Accidentes, enfermedades y muertes">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl text-white text-center py-4 shadow-md" style={{ background: "#c53030" }}>
          <p className="text-3xl font-black">{activos.length}</p>
          <p className="text-xs font-semibold opacity-90">Activos / Sin resolver</p>
        </div>
        <div className="rounded-2xl text-white text-center py-4 shadow-md" style={{ background: "#2d9e3f" }}>
          <p className="text-3xl font-black">{resueltos.length}</p>
          <p className="text-xs font-semibold opacity-90">Resueltos</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        {error && <p className="text-red-600 mb-4 bg-red-50 rounded-xl p-3 text-sm">{error}</p>}

        <button onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-2xl py-4 font-black text-lg mb-5 shadow-lg"
          style={{ background: showForm ? "#718096" : "#c53030" }}>
          {showForm ? "✕ Cancelar" : "🚨 Reportar Incidente"}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl mb-5 overflow-hidden">
            <div className="px-5 py-4" style={{ background: "#c53030" }}>
              <h2 className="text-white font-black text-lg">Nuevo Reporte de Incidente</h2>
              <p className="text-red-200 text-xs mt-1">Reporta accidentes, enfermedades o muertes</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Tipo de incidente</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TIPOS.map((t) => (
                    <button type="button" key={t.value} onClick={() => setForm({ ...form, tipo: t.value })}
                      className="rounded-xl py-2 px-3 text-sm font-bold border-2 transition-all"
                      style={{ background: form.tipo === t.value ? t.color : "#fff", color: form.tipo === t.value ? "#fff" : t.color, borderColor: t.color }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Gravedad</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {GRAVEDADES.map((g) => (
                    <button type="button" key={g.value} onClick={() => setForm({ ...form, gravedad: g.value })}
                      className="rounded-xl py-2.5 text-sm font-bold border-2 transition-all"
                      style={{ background: form.gravedad === g.value ? g.color : "#fff", color: form.gravedad === g.value ? "#fff" : g.color, borderColor: g.color }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Animal afectado (opcional)</label>
                <select className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-red-400 focus:outline-none bg-gray-50"
                  value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })}>
                  <option value="">— General / Sin animal específico —</option>
                  {animales.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre ? `${a.nombre} (${a.identificador})` : a.identificador}{a.raza ? ` · ${a.raza}` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Fecha</label>
                <input type="date" className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-red-400 focus:outline-none bg-gray-50"
                  value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción *</label>
                <textarea className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-red-400 focus:outline-none resize-none bg-gray-50"
                  placeholder="Describe el incidente con el mayor detalle posible..." rows={4}
                  value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Tratamiento aplicado</label>
                <textarea className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-red-400 focus:outline-none resize-none bg-gray-50"
                  placeholder="Medicamentos, dosis, procedimientos..." rows={2}
                  value={form.tratamiento} onChange={(e) => setForm({ ...form, tratamiento: e.target.value })} />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50">
                <p className="text-2xl mb-1">📷</p>
                <p className="text-gray-500 text-sm mb-2">Fotos o videos del incidente</p>
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => setArchivos(e.target.files)} className="text-sm" />
                {archivos.length > 0 && <p className="text-green-600 text-sm mt-2 font-medium">✓ {archivos.length} archivo(s)</p>}
              </div>

              <button disabled={enviando} type="submit"
                className="w-full text-white rounded-2xl py-4 font-black disabled:opacity-50"
                style={{ background: "#c53030" }}>
                {enviando ? "Guardando..." : "🚨 Reportar Incidente"}
              </button>
            </div>
          </form>
        )}

        {/* Lista */}
        <div className="space-y-3">
          {incidentes.map((inc) => {
            const t = TIPOS.find((x) => x.value === inc.tipo) || TIPOS[3];
            const g = GRAVEDADES.find((x) => x.value === inc.gravedad) || GRAVEDADES[0];
            return (
              <div key={inc.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: t.color }}>
                  <span className="text-white font-black text-sm">{t.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs px-2 py-1 rounded-full font-bold" style={{ background: g.color }}>{g.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${inc.estado === "RESUELTO" ? "bg-green-500 text-white" : "bg-yellow-400 text-gray-800"}`}>
                      {inc.estado === "RESUELTO" ? "✅ Resuelto" : "⏳ Activo"}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  {inc.animal && <p className="font-bold text-gray-700 mb-1">🐄 {inc.animal.nombre || inc.animal.identificador}</p>}
                  <p className="text-gray-700 mb-2">{inc.descripcion}</p>
                  {inc.tratamiento && <p className="text-sm text-blue-600 mb-2">💊 Tratamiento: {inc.tratamiento}</p>}
                  <p className="text-xs text-gray-400">{new Date(inc.fecha).toLocaleDateString("es", { dateStyle: "long" })} · {inc.usuario?.nombre}</p>
                  {inc.media?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {inc.media.map((m) => <img key={m.id} src={m.url} className="w-full h-20 object-cover rounded-xl" />)}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {inc.estado === "ACTIVO" && (
                      <button onClick={() => resolver(inc.id)}
                        className="text-white text-sm font-bold px-4 py-2 rounded-xl"
                        style={{ background: "#2d9e3f" }}>
                        ✅ Marcar como resuelto
                      </button>
                    )}
                    <button onClick={() => eliminar(inc.id)}
                      className="text-white text-sm font-bold px-4 py-2 rounded-xl"
                      style={{ background: "#742a2a" }}>
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {incidentes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">🐄</div>
            <p className="text-gray-500 text-lg font-bold">Sin incidentes registrados</p>
            <p className="text-gray-400 text-sm mt-1">¡Eso es buena señal!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
