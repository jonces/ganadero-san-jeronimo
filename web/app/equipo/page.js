"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUsuario } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

export default function EquipoPage() {
  const router = useRouter();
  const [equipo, setEquipo] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", role: "TRABAJADOR" });

  const usuario = getUsuario();
  const esAdmin = usuario?.role === "ADMIN" || usuario?.role === "SUPER_ADMIN";

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

  const glass = { background: "rgba(5,25,12,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };
  const inp = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" };

  return (
    <AppLayout title="Mi Equipo" subtitle="Administradores y Trabajadores">
      {error && <p className="text-red-300 mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>{error}</p>}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Administradores", valor: admins.length, grad: "linear-gradient(135deg,#44337a,#805ad5)" },
          { label: "Trabajadores", valor: trabajadores.length, grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl text-white text-center py-4 shadow-xl" style={{ background: s.grad, border: "1px solid rgba(255,255,255,0.2)" }}>
            <p className="text-3xl font-black">{s.valor}</p>
            <p className="text-xs font-semibold opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {esAdmin && (
        <button onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-2xl py-4 font-black text-lg mb-5 shadow-xl hover:scale-[1.01] transition-transform"
          style={{ background: showForm ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg,#44337a,#805ad5)", border: "1px solid rgba(255,255,255,0.2)" }}>
          {showForm ? "✕ Cancelar" : "+ Agregar Usuario"}
        </button>
      )}

      {esAdmin && showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl mb-5 overflow-hidden shadow-2xl" style={glass}>
          <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#44337a,#805ad5)" }}>
            <h2 className="text-white font-black text-lg">Nuevo Usuario</h2>
            <p className="text-purple-200 text-xs mt-1">El usuario podrá acceder con su email y contraseña</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { key: "nombre", label: "Nombre completo *", type: "text", placeholder: "Ej: Juan Pérez", required: true },
              { key: "email", label: "Email *", type: "email", placeholder: "usuario@email.com", required: true },
              { key: "password", label: "Contraseña *", type: "password", placeholder: "Mínimo 6 caracteres", required: true, minLength: 6 },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-bold text-white/50 uppercase">{f.label}</label>
                <input type={f.type} className="w-full rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={inp} placeholder={f.placeholder} value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required} minLength={f.minLength} />
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-white/50 uppercase">Rol</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { value: "TRABAJADOR", label: "👷 Trabajador", sub: "Reporta datos de la finca", grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" },
                  { value: "ADMIN", label: "👑 Administrador", sub: "Acceso completo", grad: "linear-gradient(135deg,#44337a,#805ad5)" },
                ].map((r) => (
                  <button type="button" key={r.value} onClick={() => setForm({ ...form, role: r.value })}
                    className="rounded-xl py-3 px-3 text-sm font-bold transition-all text-left"
                    style={{
                      background: form.role === r.value ? r.grad : "rgba(255,255,255,0.05)",
                      border: form.role === r.value ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                      color: "#fff"
                    }}>
                    <div>{r.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <button disabled={enviando} type="submit"
              className="w-full text-white rounded-2xl py-4 font-black disabled:opacity-50 shadow-xl"
              style={{ background: "linear-gradient(135deg,#44337a,#805ad5)" }}>
              {enviando ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      )}

      {[{ titulo: "👑 Administradores", lista: admins, grad: "linear-gradient(135deg,#44337a,#805ad5)" }, { titulo: "👷 Trabajadores", lista: trabajadores, grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }].map((grupo) => (
        grupo.lista.length > 0 && (
          <div key={grupo.titulo} className="mb-5">
            <h2 className="font-bold text-white/70 mb-3">{grupo.titulo}</h2>
            <div className="space-y-3">
              {grupo.lista.map((u) => (
                <div key={u.id} className="rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xl" style={glass}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-white font-black"
                      style={{ background: grupo.grad }}>
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white">{u.nombre}</p>
                      <p className="text-white/40 text-sm">{u.email}</p>
                      <p className="text-xs text-white/30 mt-1">
                        Desde: {new Date(u.createdAt).toLocaleDateString("es", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                  {esAdmin && u.role === "TRABAJADOR" && (
                    <button onClick={() => eliminar(u.id)}
                      className="text-white text-sm font-bold px-3 py-2 rounded-xl"
                      style={{ background: "rgba(220,38,38,0.3)", border: "1px solid rgba(220,38,38,0.5)" }}>
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
        <div className="text-center py-16 rounded-2xl" style={glass}>
          <div className="text-7xl mb-4">👥</div>
          <p className="text-white/50 text-lg font-bold">Sin usuarios aún</p>
          <p className="text-white/30 text-sm">Agrega trabajadores para que reporten desde sus cuentas</p>
        </div>
      )}
    </AppLayout>
  );
}
