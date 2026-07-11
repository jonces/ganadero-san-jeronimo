"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, logout } from "@/lib/api";

export default function AnimalesPage() {
  const router = useRouter();
  const [animales, setAnimales] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ identificador: "", nombre: "", raza: "", sexo: "HEMBRA" });

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

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api("/animales", { method: "POST", body: form });
      setForm({ identificador: "", nombre: "", raza: "", sexo: "HEMBRA" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#2d9e3f" }}>
        <button onClick={() => router.push("/dashboard")} className="text-white text-xl">←</button>
        <span className="font-bold text-lg tracking-wide">🐄 Inventario Animal</span>
        <button
          onClick={() => { logout(); router.push("/"); }}
          className="text-white text-sm border border-white rounded-lg px-3 py-1"
        >
          Salir
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {error && <p className="text-red-600 mb-4 bg-red-50 rounded-lg p-3">{error}</p>}

        {/* Botón agregar */}
        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-xl py-3 font-bold text-lg mb-4 flex items-center justify-center gap-2"
          style={{ background: "#2d9e3f" }}
        >
          {showForm ? "✕ Cancelar" : "+ Registrar Animal"}
        </button>

        {/* Formulario */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-md p-5 mb-5 space-y-3">
            <h2 className="font-bold text-gray-700 text-lg">Nuevo Animal</h2>
            <input className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none"
              placeholder="Arete / Identificador *" value={form.identificador}
              onChange={(e) => setForm({ ...form, identificador: e.target.value })} required />
            <input className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none"
              placeholder="Nombre" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <input className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none"
              placeholder="Raza" value={form.raza}
              onChange={(e) => setForm({ ...form, raza: e.target.value })} />
            <select className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none"
              value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
              <option value="HEMBRA">🐄 Hembra</option>
              <option value="MACHO">🐂 Macho</option>
            </select>
            <button className="w-full text-white rounded-xl p-3 font-bold" style={{ background: "#2d9e3f" }}>
              Guardar Animal
            </button>
          </form>
        )}

        {/* Contador */}
        <p className="text-gray-500 text-sm mb-3 font-medium">{animales.length} animal{animales.length !== 1 ? "es" : ""} registrado{animales.length !== 1 ? "s" : ""}</p>

        {/* Grid de animales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {animales.map((a) => {
            const foto = a.media?.find((m) => m.tipo === "FOTO") || a.media?.[0];
            return (
              <div key={a.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <a href={`/animales/${a.id}`}>
                  {foto ? (
                    foto.tipo === "FOTO"
                      ? <img src={foto.url} alt={a.identificador} className="w-full h-48 object-cover" />
                      : <video src={foto.url} className="w-full h-48 object-cover" muted />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-6xl" style={{ background: "#e8f5e9" }}>
                      🐄
                    </div>
                  )}
                  <div className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="font-bold text-gray-800 text-lg">{a.nombre || a.identificador}</h2>
                      <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
                        style={{ background: a.sexo === "HEMBRA" ? "#e53e3e" : "#3182ce" }}>
                        {a.sexo === "HEMBRA" ? "♀" : "♂"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{a.raza || "Raza no registrada"}</p>
                    {a.pesoActual && (
                      <p className="text-sm font-medium mt-1" style={{ color: "#2d9e3f" }}>⚖️ {a.pesoActual} kg</p>
                    )}
                    {a.identificador !== a.nombre && a.nombre && (
                      <p className="text-xs text-gray-400 mt-1">Arete: {a.identificador}</p>
                    )}
                  </div>
                </a>
                <div className="px-4 pb-4">
                  <a href={`/animales/${a.id}`}
                    className="w-full block text-center text-white text-sm font-bold rounded-xl py-2"
                    style={{ background: "#1a3a6c" }}>
                    Ver informe completo
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {animales.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">🐄</div>
            <p className="text-gray-500 text-lg">Aún no hay animales registrados</p>
            <p className="text-gray-400 text-sm mt-1">Presiona "+ Registrar Animal" para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
