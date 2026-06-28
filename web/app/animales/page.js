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
    const interval = setInterval(load, 15000); // refresco en "tiempo real"
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
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-700">Mi ganado</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowForm((s) => !s)} className="bg-green-700 text-white rounded-lg px-4 py-2">
            {showForm ? "Cancelar" : "+ Animal"}
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="border rounded-lg px-4 py-2"
          >
            Salir
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-2 gap-3">
          <input className="border rounded-lg p-2" placeholder="Identificador (arete)" value={form.identificador}
            onChange={(e) => setForm({ ...form, identificador: e.target.value })} required />
          <input className="border rounded-lg p-2" placeholder="Nombre" value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input className="border rounded-lg p-2" placeholder="Raza" value={form.raza}
            onChange={(e) => setForm({ ...form, raza: e.target.value })} />
          <select className="border rounded-lg p-2" value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
            <option value="HEMBRA">Hembra</option>
            <option value="MACHO">Macho</option>
          </select>
          <button className="col-span-2 bg-green-700 text-white rounded-lg p-2">Guardar</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {animales.map((a) => (
          <a
            key={a.id}
            href={`/animales/${a.id}`}
            className="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
          >
            {a.media?.[0] && (
              a.media[0].tipo === "FOTO" ? (
                <img src={a.media[0].url} alt={a.identificador} className="w-full h-40 object-cover rounded-lg mb-3" />
              ) : (
                <video src={a.media[0].url} className="w-full h-40 object-cover rounded-lg mb-3" muted />
              )
            )}
            <h2 className="font-semibold text-lg">{a.nombre || a.identificador}</h2>
            <p className="text-sm text-gray-500">{a.raza || "Sin raza registrada"} · {a.sexo}</p>
            {a.pesoActual && <p className="text-sm text-gray-500">Peso: {a.pesoActual} kg</p>}
          </a>
        ))}
      </div>

      {animales.length === 0 && !error && (
        <p className="text-gray-500 mt-10 text-center">Aún no hay animales registrados.</p>
      )}
    </main>
  );
}
