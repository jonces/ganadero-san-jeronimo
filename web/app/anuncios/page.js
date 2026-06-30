"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const EMOJIS = ["📢", "⚠️", "✅", "🎯", "📌", "🔔", "💡", "🚀", "❗", "🙌"];

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return new Date(date).toLocaleDateString("es", { dateStyle: "medium" });
}

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState([]);
  const [role, setRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", mensaje: "", emoji: "📢" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api("/anuncios");
      setAnuncios(data);
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role);
      }
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, []);

  async function handlePost(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      await api("/anuncios", { method: "POST", body: form });
      setForm({ titulo: "", mensaje: "", emoji: "📢" });
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este anuncio?")) return;
    try {
      await api(`/anuncios/${id}`, { method: "DELETE" });
      load();
    } catch (err) { setError(err.message); }
  }

  const glass = { background: "rgba(5,25,12,0.65)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.12)" };
  const inp = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" };
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <AppLayout title="Tablón de Anuncios" subtitle="Mensajes del administrador">
      {error && <p className="text-red-300 mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>{error}</p>}

      {/* Banner de bienvenida */}
      <div className="rounded-3xl p-6 mb-6 flex items-center gap-5 shadow-2xl"
        style={{ background: "linear-gradient(135deg,rgba(20,80,40,0.8),rgba(10,50,80,0.8))", border: "1px solid rgba(45,158,63,0.3)", backdropFilter: "blur(20px)" }}>
        <div className="text-5xl">📣</div>
        <div>
          <h2 className="text-white font-black text-2xl">Tablón de Anuncios</h2>
          <p className="text-white/60 text-sm mt-1">
            {isAdmin ? "Publica mensajes para que tu equipo los vea al instante." : "Mensajes importantes de tu administrador."}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(s => !s)}
            className="ml-auto text-white font-bold px-5 py-3 rounded-2xl shadow-xl hover:scale-105 transition-transform whitespace-nowrap"
            style={{ background: showForm ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg,#1a6b2a,#2d9e3f)", border: "1px solid rgba(255,255,255,0.2)" }}>
            {showForm ? "✕ Cancelar" : "✏️ Nuevo Anuncio"}
          </button>
        )}
      </div>

      {/* Formulario nuevo anuncio */}
      {showForm && isAdmin && (
        <form onSubmit={handlePost} className="rounded-2xl mb-6 overflow-hidden shadow-2xl" style={glass}>
          <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#1a4a8a,#3182ce)" }}>
            <h3 className="text-white font-black text-lg">✏️ Redactar Anuncio</h3>
          </div>
          <div className="p-5 space-y-4">
            {/* Selector de emoji */}
            <div>
              <label className="text-xs font-bold text-white/50 uppercase">Tipo de mensaje</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {EMOJIS.map((em) => (
                  <button type="button" key={em} onClick={() => setForm({ ...form, emoji: em })}
                    className="text-2xl w-10 h-10 rounded-xl transition-all hover:scale-110"
                    style={{
                      background: form.emoji === em ? "rgba(45,158,63,0.4)" : "rgba(255,255,255,0.07)",
                      border: form.emoji === em ? "2px solid rgba(45,158,63,0.8)" : "1px solid rgba(255,255,255,0.1)",
                    }}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase">Título *</label>
              <input className="w-full rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                style={inp} placeholder="Ej: Reunión mañana a las 7am" value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase">Mensaje *</label>
              <textarea className="w-full rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                style={inp} placeholder="Escribe el mensaje para tu equipo..." rows={4} value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })} required />
            </div>
            <button disabled={enviando} type="submit"
              className="w-full text-white rounded-2xl py-4 font-black disabled:opacity-50 shadow-xl hover:scale-[1.01] transition-transform"
              style={{ background: "linear-gradient(135deg,#1a4a8a,#3182ce)" }}>
              {enviando ? "Publicando..." : "📢 Publicar Anuncio"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de anuncios */}
      <div className="space-y-4">
        {anuncios.map((a, i) => (
          <div key={a.id} className="rounded-2xl overflow-hidden shadow-xl hover:scale-[1.01] transition-all"
            style={glass}>
            {/* Barra de color superior */}
            <div className="h-1" style={{ background: i % 3 === 0 ? "linear-gradient(90deg,#2d9e3f,#27ae60)" : i % 3 === 1 ? "linear-gradient(90deg,#3182ce,#2980b9)" : "linear-gradient(90deg,#d69e2e,#f39c12)" }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl mt-0.5">{a.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-white font-black text-lg leading-tight">{a.titulo}</h3>
                    <p className="text-white/70 text-sm mt-2 leading-relaxed">{a.mensaje}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                          style={{ background: "linear-gradient(135deg,#44337a,#805ad5)" }}>
                          {a.autor.nombre.charAt(0)}
                        </div>
                        <span className="text-white/40 text-xs font-semibold">{a.autor.nombre}</span>
                      </div>
                      <span className="text-white/20 text-xs">·</span>
                      <span className="text-white/30 text-xs">{timeAgo(a.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(a.id)}
                    className="text-white/30 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-900/20"
                    title="Eliminar">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {anuncios.length === 0 && (
        <div className="text-center py-20 rounded-2xl" style={glass}>
          <div className="text-7xl mb-4">📭</div>
          <p className="text-white/50 text-xl font-bold">Sin anuncios todavía</p>
          <p className="text-white/30 text-sm mt-2">
            {isAdmin ? "Publica tu primer anuncio para informar a tu equipo." : "Aquí aparecerán los mensajes de tu administrador."}
          </p>
        </div>
      )}
    </AppLayout>
  );
}
