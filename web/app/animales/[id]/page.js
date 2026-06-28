"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const TIPOS = ["VACUNACION", "TRATAMIENTO", "PESAJE", "PARTO", "OBSERVACION", "MOVIMIENTO"];

export default function AnimalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [animal, setAnimal] = useState(null);
  const [error, setError] = useState("");
  const [tipo, setTipo] = useState("OBSERVACION");
  const [descripcion, setDescripcion] = useState("");
  const [peso, setPeso] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [enviando, setEnviando] = useState(false);

  async function load() {
    try {
      const data = await api(`/animales/${id}`);
      setAnimal(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("animalId", id);
      formData.append("tipo", tipo);
      formData.append("descripcion", descripcion);
      if (peso) formData.append("peso", peso);
      Array.from(archivos).forEach((f) => formData.append("archivos", f));

      await api("/eventos", { method: "POST", body: formData, isForm: true });
      setDescripcion("");
      setPeso("");
      setArchivos([]);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!animal) return <p className="p-6">Cargando...</p>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <button onClick={() => router.push("/animales")} className="text-green-700 mb-4">← Volver</button>

      <h1 className="text-2xl font-bold mb-1">{animal.nombre || animal.identificador}</h1>
      <p className="text-gray-500 mb-6">{animal.raza || "Sin raza"} · {animal.sexo} · Peso actual: {animal.pesoActual ?? "—"} kg</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 mb-8 space-y-3">
        <h2 className="font-semibold">Nuevo reporte</h2>
        <select className="w-full border rounded-lg p-2" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea className="w-full border rounded-lg p-2" placeholder="Descripción"
          value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        {tipo === "PESAJE" && (
          <input className="w-full border rounded-lg p-2" type="number" placeholder="Peso (kg)"
            value={peso} onChange={(e) => setPeso(e.target.value)} />
        )}
        <input type="file" multiple accept="image/*,video/*" onChange={(e) => setArchivos(e.target.files)} />
        <button disabled={enviando} className="bg-green-700 text-white rounded-lg px-4 py-2 disabled:opacity-50">
          {enviando ? "Enviando..." : "Guardar reporte"}
        </button>
      </form>

      <h2 className="font-semibold mb-3">Historial</h2>
      <div className="space-y-4">
        {animal.eventos.map((ev) => (
          <div key={ev.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span className="font-medium text-green-700">{ev.tipo}</span>
              <span>{new Date(ev.fecha).toLocaleString()} · {ev.usuario?.nombre}</span>
            </div>
            {ev.descripcion && <p className="mb-2">{ev.descripcion}</p>}
            {ev.peso && <p className="text-sm text-gray-500 mb-2">Peso registrado: {ev.peso} kg</p>}
            {ev.media?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {ev.media.map((m) => (
                  m.tipo === "FOTO" ? (
                    <img key={m.id} src={m.url} className="w-full h-24 object-cover rounded-lg" />
                  ) : (
                    <video key={m.id} src={m.url} className="w-full h-24 object-cover rounded-lg" controls />
                  )
                ))}
              </div>
            )}
          </div>
        ))}
        {animal.eventos.length === 0 && <p className="text-gray-500">Sin reportes todavía.</p>}
      </div>
    </main>
  );
}
