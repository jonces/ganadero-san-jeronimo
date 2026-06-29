"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const TIPOS = [
  { value: "OBSERVACION", label: "📝 Observación", color: "#718096" },
  { value: "VACUNACION", label: "💉 Vacunación", color: "#3182ce" },
  { value: "TRATAMIENTO", label: "🏥 Tratamiento", color: "#e53e3e" },
  { value: "PESAJE", label: "⚖️ Pesaje", color: "#d69e2e" },
  { value: "PARTO", label: "🐣 Parto", color: "#805ad5" },
  { value: "MOVIMIENTO", label: "📍 Movimiento", color: "#2d9e3f" },
];

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
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center shadow-md">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={() => router.push("/animales")} className="mt-4 text-green-700 underline">Volver</button>
      </div>
    </div>
  );

  if (!animal) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-bounce">🐄</div>
        <p className="text-gray-500 mt-3">Cargando...</p>
      </div>
    </div>
  );

  const tipoInfo = TIPOS.find((t) => t.value === tipo);
  const fotoPortada = animal.media?.find((m) => m.tipo === "FOTO") || animal.media?.[0];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#2d9e3f" }}>
        <button onClick={() => router.push("/animales")} className="text-white text-xl">←</button>
        <span className="font-bold text-lg">{animal.nombre || animal.identificador}</span>
        <span className="text-2xl">{animal.sexo === "HEMBRA" ? "🐄" : "🐂"}</span>
      </header>

      {/* Foto de portada */}
      {fotoPortada ? (
        fotoPortada.tipo === "FOTO"
          ? <img src={fotoPortada.url} alt={animal.identificador} className="w-full h-56 object-cover" />
          : <video src={fotoPortada.url} className="w-full h-56 object-cover" muted autoPlay loop />
      ) : (
        <div className="w-full h-40 flex items-center justify-center text-8xl" style={{ background: "#e8f5e9" }}>🐄</div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Info del animal */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h1 className="text-2xl font-bold text-gray-800">{animal.nombre || animal.identificador}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1 rounded-full text-white text-sm font-medium" style={{ background: "#2d9e3f" }}>
              {animal.raza || "Sin raza"}
            </span>
            <span className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ background: animal.sexo === "HEMBRA" ? "#e53e3e" : "#3182ce" }}>
              {animal.sexo === "HEMBRA" ? "♀ Hembra" : "♂ Macho"}
            </span>
            {animal.pesoActual && (
              <span className="px-3 py-1 rounded-full text-white text-sm font-medium" style={{ background: "#d69e2e" }}>
                ⚖️ {animal.pesoActual} kg
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-2">Arete: {animal.identificador}</p>
        </div>

        {/* Botón nuevo reporte */}
        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-xl py-3 font-bold text-base flex items-center justify-center gap-2"
          style={{ background: showForm ? "#718096" : "#2d9e3f" }}
        >
          {showForm ? "✕ Cancelar" : "📝 Nuevo Reporte"}
        </button>

        {/* Formulario de reporte */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-5 space-y-4">
            <h2 className="font-bold text-gray-700">Registrar evento</h2>

            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map((t) => (
                <button type="button" key={t.value}
                  onClick={() => setTipo(t.value)}
                  className="rounded-xl py-2 px-3 text-sm font-medium text-white transition-opacity"
                  style={{ background: t.color, opacity: tipo === t.value ? 1 : 0.4 }}>
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none resize-none"
              placeholder="Descripción del evento..."
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />

            {tipo === "PESAJE" && (
              <input
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none"
                type="number" placeholder="Peso en kg"
                value={peso} onChange={(e) => setPeso(e.target.value)}
              />
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-2">📷 Fotos y videos</p>
              <input type="file" multiple accept="image/*,video/*"
                onChange={(e) => setArchivos(e.target.files)}
                className="text-sm text-gray-500" />
            </div>

            <button disabled={enviando}
              className="w-full text-white rounded-xl py-3 font-bold disabled:opacity-50"
              style={{ background: "#2d9e3f" }}>
              {enviando ? "Guardando..." : "Guardar Reporte"}
            </button>
          </form>
        )}

        {/* Historial */}
        <h2 className="font-bold text-gray-700 text-lg px-1">📋 Historial ({animal.eventos.length})</h2>
        <div className="space-y-3">
          {animal.eventos.map((ev) => {
            const tipoEv = TIPOS.find((t) => t.value === ev.tipo);
            return (
              <div key={ev.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between text-white text-sm font-medium"
                  style={{ background: tipoEv?.color || "#718096" }}>
                  <span>{tipoEv?.label || ev.tipo}</span>
                  <span className="opacity-80 text-xs">{new Date(ev.fecha).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <div className="p-4">
                  {ev.descripcion && <p className="text-gray-700 mb-2">{ev.descripcion}</p>}
                  {ev.peso && (
                    <p className="text-sm font-medium mb-2" style={{ color: "#d69e2e" }}>⚖️ Peso registrado: {ev.peso} kg</p>
                  )}
                  {ev.usuario?.nombre && (
                    <p className="text-xs text-gray-400 mb-2">👤 {ev.usuario.nombre}</p>
                  )}
                  {ev.media?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {ev.media.map((m) => (
                        m.tipo === "FOTO" ? (
                          <a key={m.id} href={m.url} target="_blank" rel="noreferrer">
                            <img src={m.url} className="w-full h-24 object-cover rounded-xl" />
                          </a>
                        ) : (
                          <video key={m.id} src={m.url} className="w-full h-24 object-cover rounded-xl" controls />
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {animal.eventos.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p>Sin reportes todavía</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
