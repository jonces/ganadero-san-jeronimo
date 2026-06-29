"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

const TIPOS = [
  { value: "FIERRO_ANUAL", label: "🔥 Certificado de Fierro Anual", color: "#e53e3e" },
  { value: "PERMISO_ALCALDIA", label: "🏛️ Permiso de Alcaldía", color: "#3182ce" },
  { value: "CARTA_VENTA", label: "📝 Carta de Venta", color: "#2d9e3f" },
  { value: "OTRO", label: "📎 Otro Documento", color: "#718096" },
];

export default function DocumentosPage() {
  const router = useRouter();
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("FIERRO_ANUAL");
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch(`${API_URL}/documentos`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (res.ok) setDocs(data);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!archivo) return setError("Selecciona un archivo");
    setEnviando(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("nombre", nombre);
      fd.append("tipo", tipo);
      fd.append("archivo", archivo);
      const res = await fetch(`${API_URL}/documentos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setNombre("");
      setArchivo(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`${API_URL}/documentos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#3182ce" }}>
        <button onClick={() => router.push("/dashboard")} className="text-white text-xl font-bold">←</button>
        <span className="font-bold text-lg">📄 Documentos Legales</span>
        <div />
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {error && <p className="text-red-600 mb-4 bg-red-50 rounded-xl p-3 text-sm">{error}</p>}

        {/* Botón subir */}
        <button onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-2xl py-4 font-black text-lg mb-5 shadow-lg"
          style={{ background: showForm ? "#718096" : "#3182ce" }}>
          {showForm ? "✕ Cancelar" : "+ Subir Documento"}
        </button>

        {/* Formulario simple */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-5 mb-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nombre del documento</label>
              <input className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-blue-400 focus:outline-none"
                placeholder="Ej: Fierro anual 2025" value={nombre}
                onChange={(e) => setNombre(e.target.value)} required />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TIPOS.map((t) => (
                  <button type="button" key={t.value} onClick={() => setTipo(t.value)}
                    className="rounded-xl py-2 px-3 text-sm font-bold border-2 transition-all"
                    style={{
                      background: tipo === t.value ? t.color : "#fff",
                      color: tipo === t.value ? "#fff" : t.color,
                      borderColor: t.color,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50">
              <p className="text-2xl mb-1">📎</p>
              <p className="text-gray-500 text-sm mb-2">Selecciona el archivo (PDF o imagen)</p>
              <input type="file" accept=".pdf,image/*"
                onChange={(e) => setArchivo(e.target.files[0])} required />
              {archivo && <p className="text-green-600 text-sm mt-2 font-medium">✓ {archivo.name}</p>}
            </div>

            <button disabled={enviando} type="submit"
              className="w-full text-white rounded-xl py-3 font-bold disabled:opacity-50"
              style={{ background: "#3182ce" }}>
              {enviando ? "Subiendo..." : "Guardar Documento"}
            </button>
          </form>
        )}

        {/* Lista de documentos */}
        <div className="space-y-3">
          {docs.map((doc) => {
            const t = TIPOS.find((x) => x.value === doc.tipo) || TIPOS[3];
            const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.url);
            const esPDF = /\.pdf$/i.test(doc.url);
            return (
              <div key={doc.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                {esImagen && <img src={doc.url} alt={doc.nombre} className="w-full h-40 object-cover" />}
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{esPDF ? "📄" : esImagen ? "🖼️" : "📎"}</span>
                    <div>
                      <p className="font-bold text-gray-800">{doc.nombre}</p>
                      <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
                        style={{ background: t.color }}>{t.label}</span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(doc.createdAt).toLocaleDateString("es", { dateStyle: "long" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a href={doc.url} target="_blank" rel="noreferrer"
                      className="text-white text-xs font-bold px-3 py-2 rounded-xl text-center"
                      style={{ background: t.color }}>
                      {esPDF ? "Ver PDF" : "Ver"}
                    </a>
                    <button onClick={() => handleDelete(doc.id)}
                      className="text-white text-xs font-bold px-3 py-2 rounded-xl"
                      style={{ background: "#e53e3e" }}>
                      🗑️ Borrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {docs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">📄</div>
            <p className="text-gray-500 text-lg font-bold">Sin documentos aún</p>
            <p className="text-gray-400 text-sm mt-1">Sube tus certificados y permisos legales</p>
          </div>
        )}
      </div>
    </div>
  );
}
