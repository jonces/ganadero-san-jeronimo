"use client";
import { useEffect, useState } from "react";
import { api, getUsuario } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const CARGOS = [
  {
    value: "GERENTE_GENERAL",
    label: "Gerente General",
    icon: "🏆",
    desc: "Dirección y toma de decisiones de la finca",
    permisoAdmin: true,
  },
  {
    value: "ADMINISTRADOR",
    label: "Administrador",
    icon: "📋",
    desc: "Gestión administrativa y financiera",
    permisoAdmin: true,
  },
  {
    value: "RESPONSABLE_NOMINA",
    label: "Responsable de Nómina",
    icon: "💼",
    desc: "Manejo de pagos, salarios y nómina del personal",
    permisoAdmin: false,
  },
  {
    value: "TRABAJADOR_CAMPO",
    label: "Trabajador de Campo",
    icon: "🌿",
    desc: "Labores generales en la finca",
    permisoAdmin: false,
  },
  {
    value: "VAQUERO",
    label: "Vaquero",
    icon: "🐄",
    desc: "Cuido y manejo del ganado",
    permisoAdmin: false,
  },
  {
    value: "OTRO",
    label: "Otro",
    icon: "👤",
    desc: "Otro cargo no listado",
    permisoAdmin: false,
  },
];

function cargoLabel(cargo) {
  return CARGOS.find(c => c.value === cargo)?.label || cargo || "Sin cargo";
}

function cargoIcon(cargo) {
  return CARGOS.find(c => c.value === cargo)?.icon || "👤";
}

function cargoGrad(cargo) {
  const map = {
    GERENTE_GENERAL:    "linear-gradient(135deg,#92400E,#D97706)",
    ADMINISTRADOR:      "linear-gradient(135deg,#44337a,#805ad5)",
    RESPONSABLE_NOMINA: "linear-gradient(135deg,#065F46,#059669)",
    TRABAJADOR_CAMPO:   "linear-gradient(135deg,#1a6b2a,#2d9e3f)",
    VAQUERO:            "linear-gradient(135deg,#1e40af,#3b82f6)",
    OTRO:               "linear-gradient(135deg,#374151,#6B7280)",
  };
  return map[cargo] || map.OTRO;
}

function estadoColor(estado) {
  if (estado === "activo")   return { dot: "#22c55e", label: "Activo ahora", bg: "rgba(34,197,94,0.15)"  };
  if (estado === "reciente") return { dot: "#eab308", label: "Reciente",     bg: "rgba(234,179,8,0.15)"  };
  return                            { dot: "#6b7280", label: "Desconectado", bg: "rgba(107,114,128,0.1)" };
}

function tiempoDesde(fecha) {
  if (!fecha) return "Nunca";
  const mins = Math.floor((Date.now() - new Date(fecha)) / 60000);
  if (mins < 1)  return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

export default function EquipoPage() {
  const [equipo, setEquipo]           = useState([]);
  const [conectados, setConectados]   = useState([]);
  const [error, setError]             = useState("");
  const [showForm, setShowForm]       = useState(false);
  const [enviando, setEnviando]       = useState(false);
  const [esAdmin, setEsAdmin]         = useState(false);
  const [esGerente, setEsGerente]     = useState(false);
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [editando, setEditando]       = useState(null); // usuario que se está editando
  const [guardando, setGuardando]     = useState(false);
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", role: "TRABAJADOR", cargo: "",
  });

  async function load() {
    try {
      const data = await api("/equipo");
      setEquipo(data);
    } catch (err) { setError(err.message); }
  }

  async function loadConectados() {
    try {
      const data = await api("/equipo/conectados");
      setConectados(data);
    } catch { setConectados([]); }
  }

  useEffect(() => {
    const u = getUsuario();
    setEsAdmin(u?.role === "ADMIN" || u?.role === "SUPER_ADMIN");
    const gerente = u?.cargo === "GERENTE_GENERAL" || u?.role === "ADMIN" || u?.role === "SUPER_ADMIN";
    setEsGerente(gerente);
    setPuedeEditar(gerente);
    load();
    if (gerente) {
      loadConectados();
      const interval = setInterval(loadConectados, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Al elegir cargo, asigna el role automáticamente
  function elegirCargo(cargo) {
    const def = CARGOS.find(c => c.value === cargo);
    setForm(f => ({
      ...f,
      cargo,
      role: def?.permisoAdmin ? "ADMIN" : "TRABAJADOR",
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.cargo) { setError("Debes seleccionar el cargo del usuario"); return; }
    setEnviando(true);
    setError("");
    try {
      await api("/equipo", { method: "POST", body: form });
      setForm({ nombre: "", email: "", password: "", role: "TRABAJADOR", cargo: "" });
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function guardarCambio(nuevoCargo) {
    if (!editando) return;
    setGuardando(true);
    setError("");
    try {
      const def = CARGOS.find(c => c.value === nuevoCargo);
      await api(`/equipo/${editando.id}`, {
        method: "PATCH",
        body: { cargo: nuevoCargo, role: def?.permisoAdmin ? "ADMIN" : "TRABAJADOR" },
      });
      setEditando(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await api(`/equipo/${id}`, { method: "DELETE" });
      load();
    } catch (err) { setError(err.message); }
  }

  // Agrupar por cargo
  const porCargo = CARGOS.map(c => ({
    ...c,
    usuarios: equipo.filter(u => u.cargo === c.value),
  })).filter(c => c.usuarios.length > 0);

  const sinCargo = equipo.filter(u => !u.cargo || !CARGOS.find(c => c.value === u.cargo));

  const glass = {
    background: "rgba(5,25,12,0.6)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.12)",
  };
  const inp = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
  };

  return (
    <AppLayout title="Mi Equipo" subtitle="Personal de la finca">
      {error && (
        <p className="mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}>
          {error}
        </p>
      )}

      {/* Panel conectados — solo Gerente General y Admin */}
      {esGerente && conectados.length > 0 && (
        <div className="rounded-2xl mb-5 overflow-hidden shadow-xl" style={{ background: "rgba(5,25,12,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>🟢 Quién está conectado</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>
                {conectados.filter(u => u.estado === "activo").length} activos ahora · se actualiza cada 30s
              </p>
            </div>
          </div>
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            {conectados.map(u => {
              const e = estadoColor(u.estado);
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: e.bg }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: cargoGrad(u.cargo), flexShrink: 0 }}>
                    {cargoIcon(u.cargo)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{u.nombre}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{cargoLabel(u.cargo)}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.dot }} />
                      <span style={{ color: e.dot, fontSize: 11, fontWeight: 700 }}>{e.label}</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>{tiempoDesde(u.lastSeen)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total personal", valor: equipo.length, grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" },
          { label: "Administradores", valor: equipo.filter(u => u.role === "ADMIN").length, grad: "linear-gradient(135deg,#44337a,#805ad5)" },
          { label: "Responsable Nómina", valor: equipo.filter(u => u.cargo === "RESPONSABLE_NOMINA").length, grad: "linear-gradient(135deg,#065F46,#059669)" },
          { label: "Trabajadores", valor: equipo.filter(u => u.role === "TRABAJADOR").length, grad: "linear-gradient(135deg,#374151,#6B7280)" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl text-white text-center py-4 shadow-xl"
            style={{ background: s.grad, border: "1px solid rgba(255,255,255,0.2)" }}>
            <p className="text-3xl font-black">{s.valor}</p>
            <p className="text-xs font-semibold opacity-80 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Botón agregar */}
      {esAdmin && (
        <button onClick={() => { setShowForm(s => !s); setError(""); }}
          className="w-full text-white rounded-2xl py-4 font-black text-lg mb-5 shadow-xl"
          style={{ background: showForm ? "rgba(100,100,100,0.4)" : "linear-gradient(135deg,#44337a,#805ad5)", border: "1px solid rgba(255,255,255,0.2)" }}>
          {showForm ? "✕ Cancelar" : "+ Agregar Usuario"}
        </button>
      )}

      {/* Formulario */}
      {esAdmin && showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl mb-5 overflow-hidden shadow-2xl" style={glass}>
          <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#44337a,#805ad5)" }}>
            <h2 className="text-white font-black text-lg">Nuevo Usuario</h2>
            <p className="text-purple-200 text-xs mt-1">El usuario podrá acceder con su email y contraseña</p>
          </div>

          <div className="p-5 space-y-5">
            {/* Campos de texto */}
            {[
              { key: "nombre",   label: "Nombre completo *", type: "text",     placeholder: "Ej: Ana García",         required: true },
              { key: "email",    label: "Email *",            type: "email",    placeholder: "usuario@email.com",      required: true },
              { key: "password", label: "Contraseña *",       type: "password", placeholder: "Mínimo 6 caracteres",   required: true, minLength: 6 },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">{f.label}</label>
                <input type={f.type} className="w-full rounded-xl p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={inp} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  required={f.required} minLength={f.minLength} />
              </div>
            ))}

            {/* Selector de cargo */}
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                Cargo / Puesto *
              </label>
              <p className="text-white/30 text-xs mt-1 mb-3">
                Esto define cómo aparece el usuario en el sistema y sus responsabilidades
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {CARGOS.map(c => {
                  const sel = form.cargo === c.value;
                  return (
                    <button type="button" key={c.value} onClick={() => elegirCargo(c.value)}
                      style={{
                        borderRadius: 12,
                        padding: "12px",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all .15s",
                        background: sel ? cargoGrad(c.value) : "rgba(255,255,255,0.05)",
                        border: sel ? "1.5px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{c.desc}</div>
                      {c.permisoAdmin && (
                        <div style={{ fontSize: 9, marginTop: 4, background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: 99, display: "inline-block", fontWeight: 700 }}>
                          Acceso Admin
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview del cargo seleccionado */}
            {form.cargo && form.nombre && (
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: cargoGrad(form.cargo) }}>
                  {cargoIcon(form.cargo)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{form.nombre}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{cargoLabel(form.cargo)}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                    Permisos: {form.role === "ADMIN" ? "Administrador" : "Trabajador"}
                  </div>
                </div>
              </div>
            )}

            <button disabled={enviando || !form.cargo} type="submit"
              className="w-full text-white rounded-2xl py-4 font-black disabled:opacity-40 shadow-xl"
              style={{ background: "linear-gradient(135deg,#44337a,#805ad5)" }}>
              {enviando ? "Creando usuario..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de usuarios agrupada por cargo */}
      {porCargo.length === 0 && sinCargo.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={glass}>
          <div className="text-7xl mb-4">👥</div>
          <p className="text-white/50 text-lg font-bold">Sin usuarios aún</p>
          <p className="text-white/30 text-sm">Agrega personal para que accedan al sistema</p>
        </div>
      ) : (
        <div className="space-y-6">
          {porCargo.map(grupo => (
            <div key={grupo.value}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{grupo.icon}</span>
                <h2 style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {grupo.label}
                </h2>
                <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
                  {grupo.usuarios.length}
                </span>
              </div>
              <div className="space-y-3">
                {grupo.usuarios.map(u => (
                  <div key={u.id} className="rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xl" style={glass}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: cargoGrad(u.cargo), flexShrink: 0 }}>
                        {cargoIcon(u.cargo)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>{u.nombre}</p>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 1 }}>
                          {cargoLabel(u.cargo)}
                          {u.role === "ADMIN" && (
                            <span style={{ marginLeft: 6, background: "rgba(139,92,246,0.3)", color: "#c4b5fd", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                              Admin
                            </span>
                          )}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 2 }}>{u.email}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {puedeEditar && (
                        <button onClick={() => setEditando(u)}
                          className="text-sm font-bold px-3 py-2 rounded-xl"
                          style={{ background: "rgba(139,92,246,0.3)", border: "1px solid rgba(139,92,246,0.5)", color: "#c4b5fd" }}>
                          ✏️
                        </button>
                      )}
                      {esAdmin && u.role !== "ADMIN" && (
                        <button onClick={() => eliminar(u.id)}
                          className="text-sm font-bold px-3 py-2 rounded-xl"
                          style={{ background: "rgba(220,38,38,0.3)", border: "1px solid rgba(220,38,38,0.5)", color: "#fca5a5" }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Usuarios sin cargo asignado (legacy) */}
          {sinCargo.length > 0 && (
            <div>
              <h2 style={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                👤 Sin cargo asignado
              </h2>
              <div className="space-y-3">
                {sinCargo.map(u => (
                  <div key={u.id} className="rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xl" style={glass}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: "linear-gradient(135deg,#374151,#6B7280)" }}>
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>{u.nombre}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{u.role === "ADMIN" ? "Administrador" : "Trabajador"}</p>
                        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{u.email}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {puedeEditar && (
                        <button onClick={() => setEditando(u)}
                          className="text-sm font-bold px-3 py-2 rounded-xl"
                          style={{ background: "rgba(139,92,246,0.3)", border: "1px solid rgba(139,92,246,0.5)", color: "#c4b5fd" }}>
                          ✏️
                        </button>
                      )}
                      {esAdmin && u.role !== "ADMIN" && (
                        <button onClick={() => eliminar(u.id)}
                          className="text-sm font-bold px-3 py-2 rounded-xl"
                          style={{ background: "rgba(220,38,38,0.3)", border: "1px solid rgba(220,38,38,0.5)", color: "#fca5a5" }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Modal cambiar cargo */}
      {editando && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setEditando(null)}>
          <div style={{ background: "#0d1f10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, width: "100%", maxWidth: 480, overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: cargoGrad(editando.cargo), flexShrink: 0 }}>
                {cargoIcon(editando.cargo)}
              </div>
              <div>
                <p style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>{editando.nombre}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Cargo actual: {cargoLabel(editando.cargo)}</p>
              </div>
              <button onClick={() => setEditando(null)} style={{ marginLeft: "auto", color: "rgba(255,255,255,0.4)", fontSize: 20, background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            {/* Selección de cargo */}
            <div style={{ padding: 20 }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Seleccionar nuevo cargo
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {CARGOS.map(c => {
                  const sel = editando.cargo === c.value;
                  return (
                    <button key={c.value} disabled={guardando}
                      onClick={() => guardarCambio(c.value)}
                      style={{
                        borderRadius: 12, padding: "12px", textAlign: "left", cursor: guardando ? "not-allowed" : "pointer",
                        transition: "all .15s", opacity: guardando ? 0.6 : 1,
                        background: sel ? cargoGrad(c.value) : "rgba(255,255,255,0.05)",
                        border: sel ? "1.5px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{c.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{c.desc}</div>
                      {sel && <div style={{ fontSize: 9, marginTop: 4, background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: 99, display: "inline-block", fontWeight: 700 }}>Actual</div>}
                    </button>
                  );
                })}
              </div>
              {guardando && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", marginTop: 12 }}>Guardando cambio...</p>}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
