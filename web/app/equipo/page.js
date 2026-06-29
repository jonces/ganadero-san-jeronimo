"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function EquipoPage() {
  const router = useRouter();
  const [equipo, setEquipo] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", role: "TRABAJADOR" });

  async function load() {
    try {
      const data = await api("/equipo");
      setEquipo(data);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      await api("/equipo", { method: "POST", body: form });
      setForm({ nombre: "", email: "", password: "", role: "TRABAJADOR" });
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await api(`/equipo/${id}`, { method: "DELETE" });
      load();
    } catch (err) { setError(err.message); }
  }

  const admins = equipo.filter((u) => u.role === "ADMIN");
  const trabajadores = equipo.filter((u) => u.role === "TRABAJADOR");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#553c9a" }}>
        <button onClick={() => router.push("/dashboard")} className="text-white text-xl font-bold">←</button>
        <span className="font-bold text-lg">👥 Mi Equipo</span>
        <div />
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {error && <p className="text-red-600 mb-4 bg-red-50 rounded-xl p-3 text-sm">{error}</p>}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl text-white text-center py-4 shadow-md" style={{ background: "#553c9a" }}>
            <p className="text-3xl font-black">{admins.length}</p>
            <p className="text-xs font-semibold opacity-90">Administradores</p>
          </div>
          <div className="rounded-2xl text-white text-center py-4 shadow-md" style={{ background: "#2d9e3f" }}>
            <p className="text-3xl font-black">{trabajadores.length}</p>
            <p className="text-xs font-semibold opacity-90">Trabajadores</p>
          </div>
        </div>

        <button onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-2xl py-4 font-black text-lg mb-5 shadow-lg"
          style={{ background: showForm ? "#718096" : "#553c9a" }}>
          {showForm ? "✕ Cancelar" : "+ Agregar Usuario"}
        </button>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-xl mb-5 overflow-hidden">
            <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#44337a,#805ad5)" }}>
              <h2 className="text-white font-black text-lg">Nuevo Usuario</h2>
              <p className="text-purple-200 text-xs mt-1">El usuario podrá acceder con su email y contraseña</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre completo *</label>
                <input className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
                  placeholder="Ej: Juan Pérez" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email *</label>
                <input type="email" className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
                  placeholder="usuario@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Contraseña *</label>
                <input type="password" className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
                  placeholder="Mínimo 6 caracteres" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Rol</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: "TRABAJADOR", label: "👷 Trabajador", sub: "Puede reportar y subir datos", color: "#2d9e3f" },
                    { value: "ADMIN", label: "👑 Administrador", sub: "Acceso completo a la finca", color: "#553c9a" },
                  ].map((r) => (
                    <button type="button" key={r.value} onClick={() => setForm({ ...form, role: r.value })}
                      className="rounded-xl py-3 px-3 text-sm font-bold border-2 transition-all text-left"
                      style={{ background: form.role === r.value ? r.color : "#fff", color: form.role === r.value ? "#fff" : r.color, borderColor: r.color }}>
                      <div>{r.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.8 }}>{r.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button disabled={enviando} type="submit"
                className="w-full text-white rounded-2xl py-4 font-black disabled:opacity-50"
                style={{ background: "#553c9a" }}>
                {enviando ? "Creando..." : "Crear Usuario"}
              </button>
            </div>
          </form>
        )}

        {/* Lista de usuarios */}
        {[{ titulo: "👑 Administradores", lista: admins, color: "#553c9a" }, { titulo: "👷 Trabajadores", lista: trabajadores, color: "#2d9e3f" }].map((grupo) => (
          grupo.lista.length > 0 && (
            <div key={grupo.titulo} className="mb-5">
              <h2 className="font-bold text-gray-700 mb-3">{grupo.titulo}</h2>
              <div className="space-y-3">
                {grupo.lista.map((u) => (
                  <div key={u.id} className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-white font-black"
                        style={{ background: grupo.color }}>
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{u.nombre}</p>
                        <p className="text-gray-400 text-sm">{u.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Desde: {new Date(u.createdAt).toLocaleDateString("es", { dateStyle: "medium" })}
                        </p>
                      </div>
                    </div>
                    {u.role === "TRABAJADOR" && (
                      <button onClick={() => eliminar(u.id)}
                        className="text-white text-sm font-bold px-3 py-2 rounded-xl"
                        style={{ background: "#e53e3e" }}>
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {equipo.length === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">👥</div>
            <p className="text-gray-500 text-lg font-bold">Sin usuarios aún</p>
            <p className="text-gray-400 text-sm">Agrega trabajadores para que reporten desde sus cuentas</p>
          </div>
        )}
      </div>
    </div>
  );
}
