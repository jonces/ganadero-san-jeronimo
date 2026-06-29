"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, logout } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

export default function InventarioPage() {
  const router = useRouter();
  const [animales, setAnimales] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ identificador: "", nombre: "", raza: "", fierro: "", sexo: "HEMBRA", pesoActual: "", observacion: "" });
  const [archivos, setArchivos] = useState([]);
  const [enviando, setEnviando] = useState(false);

  async function load() {
    try {
      const data = await api("/animales");
      setAnimales(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("autenticado") || err.message.includes("inválido")) router.push("/");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

  async function handleCreate(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/animales`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const animal = await res.json();
      if (!res.ok) throw new Error(animal.error || "Error");

      if (archivos.length > 0) {
        const fd = new FormData();
        Array.from(archivos).forEach((f) => fd.append("archivos", f));
        await fetch(`${API_URL}/animales/${animal.id}/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        });
      }

      setForm({ identificador: "", nombre: "", raza: "", fierro: "", sexo: "HEMBRA", pesoActual: "", observacion: "" });
      setArchivos([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const activos = animales.filter((a) => a.estado === "ACTIVO");
  const vendidos = animales.filter((a) => a.estado === "VENDIDO");

  const glassCard = { background: "rgba(5,25,12,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };
  const glassInput = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" };

  return (
    <AppLayout title="Inventario Animal" subtitle="Gestión de Ganado">
      {error && <p className="text-red-300 mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>{error}</p>}

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Total", valor: animales.length, grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" },
          { label: "Activos", valor: activos.length, grad: "linear-gradient(135deg,#1a4a8a,#3182ce)" },
          { label: "Vendidos", valor: vendidos.length, grad: "linear-gradient(135deg,#7b4f12,#d69e2e)" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl text-white text-center py-4 shadow-xl" style={{ background: s.grad, border: "1px solid rgba(255,255,255,0.2)" }}>
            <p className="text-3xl font-black">{s.valor}</p>
            <p className="text-xs font-semibold opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowForm((s) => !s)}
        className="w-full text-white rounded-xl py-3 font-bold text-lg mb-4 flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] transition-transform"
        style={{ background: showForm ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg,#1a6b2a,#2d9e3f)", border: "1px solid rgba(255,255,255,0.2)" }}
      >
        {showForm ? "✕ Cancelar" : "+ Registrar Animal"}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl mb-5 overflow-hidden shadow-2xl" style={glassCard}>
          <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
            <h2 className="text-white font-black text-lg">🐄 Nuevo Animal</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "identificador", label: "Arete / ID *", placeholder: "Ej: M-001", required: true },
                { key: "nombre", label: "Nombre", placeholder: "Ej: La Prieta" },
                { key: "raza", label: "Raza", placeholder: "Ej: Brahman" },
                { key: "fierro", label: "Fierro (marca)", placeholder: "Ej: JCH-22" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-white/50 uppercase">{f.label}</label>
                  <input className="w-full rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                    style={glassInput} placeholder={f.placeholder} value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-white/50 uppercase">Sexo</label>
                <select className="w-full rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={glassInput} value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                  <option value="HEMBRA">🐄 Hembra</option>
                  <option value="MACHO">🐂 Macho</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase">Peso (kg)</label>
                <input type="number" className="w-full rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={glassInput} placeholder="Ej: 350" value={form.pesoActual}
                  onChange={(e) => setForm({ ...form, pesoActual: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase">Observación</label>
              <textarea className="w-full rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                style={glassInput} placeholder="Notas..." rows={2} value={form.observacion}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })} />
            </div>
            <div className="rounded-xl p-4 text-center" style={{ border: "2px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}>
              <p className="text-2xl mb-1">📷</p>
              <p className="text-white/70 text-sm font-semibold">Fotos y videos del animal</p>
              <input type="file" multiple accept="image/*,video/*" onChange={(e) => setArchivos(e.target.files)} className="text-sm text-white/50 mt-2" />
              {archivos.length > 0 && <p className="text-green-400 text-sm mt-2 font-medium">✓ {archivos.length} archivo(s)</p>}
            </div>
            <button disabled={enviando} className="w-full text-white rounded-xl p-3 font-bold disabled:opacity-50 shadow-xl"
              style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
              {enviando ? "Guardando..." : "Guardar Animal"}
            </button>
          </div>
        </form>
      )}

      <p className="text-white/40 text-sm mb-3 font-medium">{activos.length} animal{activos.length !== 1 ? "es" : ""} activo{activos.length !== 1 ? "s" : ""}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {animales.map((a) => {
          const foto = a.media?.find((m) => m.tipo === "FOTO") || a.media?.[0];
          return (
            <a key={a.id} href={`/animales/${a.id}`}
              className="rounded-2xl shadow-xl overflow-hidden hover:scale-[1.02] transition-all relative"
              style={glassCard}>
              {a.estado === "VENDIDO" && (
                <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">VENDIDO</div>
              )}
              {foto ? (
                foto.tipo === "FOTO"
                  ? <img src={foto.url} alt={a.identificador} className="w-full h-44 object-cover" />
                  : <video src={foto.url} className="w-full h-44 object-cover" muted />
              ) : (
                <div className="w-full h-44 flex items-center justify-center text-6xl"
                  style={{ background: a.sexo === "HEMBRA" ? "rgba(30,60,30,0.8)" : "rgba(20,40,80,0.8)" }}>
                  {a.sexo === "HEMBRA" ? "🐄" : "🐂"}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h2 className="font-bold text-white text-base">{a.nombre || a.identificador}</h2>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white ml-1 shrink-0"
                    style={{ background: a.sexo === "HEMBRA" ? "#e53e3e" : "#3182ce" }}>
                    {a.sexo === "HEMBRA" ? "♀" : "♂"}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  {a.raza && <p className="text-white/50">🐾 Raza: <span className="text-white/80">{a.raza}</span></p>}
                  {a.fierro && <p className="text-white/50">🔥 Fierro: <span className="text-white/80">{a.fierro}</span></p>}
                  {a.pesoActual && <p className="text-white/50">⚖️ Peso: <span className="font-medium text-green-400">{a.pesoActual} kg</span></p>}
                  {a.observacion && <p className="text-white/30 text-xs mt-1 truncate">📝 {a.observacion}</p>}
                </div>
                <p className="text-xs text-white/25 mt-2">Arete: {a.identificador}</p>
              </div>
            </a>
          );
        })}
      </div>

      {animales.length === 0 && !error && (
        <div className="text-center py-16 rounded-2xl" style={glassCard}>
          <div className="text-7xl mb-4">🐄</div>
          <p className="text-white/50 text-lg">Aún no hay animales registrados</p>
        </div>
      )}
    </AppLayout>
  );
}
