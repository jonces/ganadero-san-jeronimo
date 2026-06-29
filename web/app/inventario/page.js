"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, logout } from "@/lib/api";

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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#2d9e3f" }}>
        <button onClick={() => router.push("/dashboard")} className="text-white text-xl font-bold">←</button>
        <span className="font-bold text-lg">🐄 Inventario Animal</span>
        <button onClick={() => { logout(); router.push("/"); }} className="text-white text-sm border border-white rounded-lg px-3 py-1">Salir</button>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {error && <p className="text-red-600 mb-4 bg-red-50 rounded-lg p-3">{error}</p>}

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total", valor: animales.length, color: "#2d9e3f" },
            { label: "Activos", valor: activos.length, color: "#3182ce" },
            { label: "Vendidos", valor: vendidos.length, color: "#b7791f" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl text-white text-center py-4 shadow-md" style={{ background: s.color }}>
              <p className="text-3xl font-black">{s.valor}</p>
              <p className="text-xs font-semibold opacity-90">{s.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-xl py-3 font-bold text-lg mb-4 flex items-center justify-center gap-2"
          style={{ background: showForm ? "#718096" : "#2d9e3f" }}
        >
          {showForm ? "✕ Cancelar" : "+ Registrar Animal"}
        </button>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-md p-5 mb-5 space-y-3">
            <h2 className="font-bold text-gray-700 text-lg border-b pb-2">Nuevo Animal</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Arete / ID *</label>
                <input className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-green-500 focus:outline-none"
                  placeholder="Ej: M-001" value={form.identificador}
                  onChange={(e) => setForm({ ...form, identificador: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                <input className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-green-500 focus:outline-none"
                  placeholder="Ej: La Prieta" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Raza</label>
                <input className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-green-500 focus:outline-none"
                  placeholder="Ej: Brahman" value={form.raza}
                  onChange={(e) => setForm({ ...form, raza: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Fierro (marca)</label>
                <input className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-green-500 focus:outline-none"
                  placeholder="Ej: JCH-22" value={form.fierro}
                  onChange={(e) => setForm({ ...form, fierro: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Sexo</label>
                <select className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-green-500 focus:outline-none"
                  value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                  <option value="HEMBRA">🐄 Hembra</option>
                  <option value="MACHO">🐂 Macho</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Peso (kg)</label>
                <input type="number" className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-green-500 focus:outline-none"
                  placeholder="Ej: 350" value={form.pesoActual}
                  onChange={(e) => setForm({ ...form, pesoActual: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Observación</label>
              <textarea className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-green-500 focus:outline-none resize-none"
                placeholder="Notas sobre el animal..." rows={2} value={form.observacion}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })} />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50">
              <p className="text-2xl mb-1">📷</p>
              <p className="text-gray-600 text-sm font-semibold">Fotos y videos del animal</p>
              <p className="text-gray-400 text-xs mb-2">Puedes seleccionar varias fotos a la vez</p>
              <input type="file" multiple accept="image/*,video/*"
                onChange={(e) => setArchivos(e.target.files)}
                className="text-sm text-gray-500" />
              {archivos.length > 0 && (
                <p className="text-green-600 text-sm mt-2 font-medium">✓ {archivos.length} archivo(s) seleccionado(s)</p>
              )}
            </div>

            <button disabled={enviando} className="w-full text-white rounded-xl p-3 font-bold disabled:opacity-50" style={{ background: "#2d9e3f" }}>
              {enviando ? "Guardando..." : "Guardar Animal"}
            </button>
          </form>
        )}

        <p className="text-gray-500 text-sm mb-3 font-medium">{activos.length} animal{activos.length !== 1 ? "es" : ""} activo{activos.length !== 1 ? "s" : ""}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {animales.map((a) => {
            const foto = a.media?.find((m) => m.tipo === "FOTO") || a.media?.[0];
            return (
              <a key={a.id} href={`/animales/${a.id}`}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow relative">
                {a.estado === "VENDIDO" && (
                  <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">VENDIDO</div>
                )}
                {foto ? (
                  foto.tipo === "FOTO"
                    ? <img src={foto.url} alt={a.identificador} className="w-full h-44 object-cover" />
                    : <video src={foto.url} className="w-full h-44 object-cover" muted />
                ) : (
                  <div className="w-full h-44 flex items-center justify-center text-6xl" style={{ background: "#e8f5e9" }}>
                    {a.sexo === "HEMBRA" ? "🐄" : "🐂"}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h2 className="font-bold text-gray-800 text-base">{a.nombre || a.identificador}</h2>
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white ml-1 shrink-0"
                      style={{ background: a.sexo === "HEMBRA" ? "#e53e3e" : "#3182ce" }}>
                      {a.sexo === "HEMBRA" ? "♀" : "♂"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {a.raza && <p className="text-gray-500">🐾 Raza: <span className="font-medium text-gray-700">{a.raza}</span></p>}
                    {a.fierro && <p className="text-gray-500">🔥 Fierro: <span className="font-medium text-gray-700">{a.fierro}</span></p>}
                    {a.pesoActual && <p className="text-gray-500">⚖️ Peso: <span className="font-medium" style={{ color: "#2d9e3f" }}>{a.pesoActual} kg</span></p>}
                    {a.observacion && <p className="text-gray-400 text-xs mt-1 truncate">📝 {a.observacion}</p>}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Arete: {a.identificador}</p>
                </div>
              </a>
            );
          })}
        </div>

        {animales.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">🐄</div>
            <p className="text-gray-500 text-lg">Aún no hay animales registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
