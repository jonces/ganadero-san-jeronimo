"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveToken } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const glass = { background: "rgba(5,25,12,0.70)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };
const gi = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" };

const ROLE_LABEL = { ADMIN: "Administrador", TRABAJADOR: "Trabajador", SUPER_ADMIN: "Super Admin" };
const ROLE_COLOR = { ADMIN: "#4ade80", TRABAJADOR: "#60a5fa", SUPER_ADMIN: "#c084fc" };
const ROLE_BG = { ADMIN: "rgba(45,158,63,0.2)", TRABAJADOR: "rgba(49,130,206,0.2)", SUPER_ADMIN: "rgba(128,90,213,0.2)" };

export default function PerfilPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [nombre, setNombre] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [msgNombre, setMsgNombre] = useState("");

  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [msgPass, setMsgPass] = useState("");

  useEffect(() => {
    api("/usuarios/perfil")
      .then(d => { setPerfil(d); setNombre(d.nombre); })
      .catch(() => router.push("/"));
  }, []);

  async function handleNombre(e) {
    e.preventDefault();
    setGuardandoNombre(true); setMsgNombre("");
    try {
      await api("/usuarios/perfil", { method: "PATCH", body: { nombre } });
      setMsgNombre("✅ Nombre actualizado");
      setPerfil(p => ({ ...p, nombre }));
    } catch (err) {
      setMsgNombre("❌ " + err.message);
    } finally { setGuardandoNombre(false); }
  }

  async function handlePassword(e) {
    e.preventDefault();
    if (passNueva !== passConfirm) { setMsgPass("❌ Las contraseñas no coinciden"); return; }
    if (passNueva.length < 6) { setMsgPass("❌ Mínimo 6 caracteres"); return; }
    setGuardandoPass(true); setMsgPass("");
    try {
      await api("/usuarios/perfil/password", { method: "PATCH", body: { passwordActual: passActual, nuevaPassword: passNueva } });
      setMsgPass("✅ Contraseña cambiada correctamente");
      setPassActual(""); setPassNueva(""); setPassConfirm("");
    } catch (err) {
      setMsgPass("❌ " + err.message);
    } finally { setGuardandoPass(false); }
  }

  if (!perfil) return (
    <AppLayout title="Mi Perfil">
      <div className="text-center py-20 text-white/40 text-4xl animate-pulse">👤</div>
    </AppLayout>
  );

  const inicial = perfil.nombre?.charAt(0).toUpperCase();

  return (
    <AppLayout title="Mi Perfil" subtitle="Datos de tu cuenta">
      {/* Avatar y datos */}
      <div className="rounded-3xl p-6 mb-5 flex flex-col items-center gap-3 shadow-2xl" style={glass}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-4xl text-white shadow-xl"
          style={{ background: ROLE_BG[perfil.role] || "rgba(255,255,255,0.1)", border: `2px solid ${ROLE_COLOR[perfil.role] || "#fff"}` }}>
          {inicial}
        </div>
        <div className="text-center">
          <p className="text-white font-black text-xl">{perfil.nombre}</p>
          <p className="text-white/40 text-sm mt-0.5">{perfil.email}</p>
        </div>
        <span className="text-xs font-black px-4 py-1.5 rounded-full"
          style={{ background: ROLE_BG[perfil.role], color: ROLE_COLOR[perfil.role], border: `1px solid ${ROLE_COLOR[perfil.role]}` }}>
          {ROLE_LABEL[perfil.role] || perfil.role}
        </span>
        <p className="text-white/20 text-xs">Miembro desde {new Date(perfil.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}</p>
      </div>

      {/* Cambiar nombre */}
      <div className="rounded-3xl p-5 mb-4 shadow-xl" style={glass}>
        <h3 className="text-white font-black text-base mb-4">✏️ Cambiar nombre</h3>
        <form onSubmit={handleNombre} className="space-y-3">
          <div>
            <label className="text-white/40 text-xs">Nombre completo</label>
            <input className="w-full rounded-xl px-4 py-3 text-base mt-1" style={gi}
              value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>
          {msgNombre && <p className="text-sm" style={{ color: msgNombre.startsWith("✅") ? "#4ade80" : "#fc8181" }}>{msgNombre}</p>}
          <button type="submit" disabled={guardandoNombre || nombre === perfil.nombre}
            className="w-full py-3 rounded-2xl text-white font-black disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
            {guardandoNombre ? "Guardando..." : "Guardar nombre"}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="rounded-3xl p-5 shadow-xl" style={glass}>
        <h3 className="text-white font-black text-base mb-4">🔐 Cambiar contraseña</h3>
        <form onSubmit={handlePassword} className="space-y-3">
          <div>
            <label className="text-white/40 text-xs">Contraseña actual</label>
            <div className="relative mt-1">
              <input type={showPass ? "text" : "password"} className="w-full rounded-xl px-4 py-3 text-base pr-12" style={gi}
                value={passActual} onChange={e => setPassActual(e.target.value)} required placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-lg">{showPass ? "🙈" : "👁️"}</button>
            </div>
          </div>
          <div>
            <label className="text-white/40 text-xs">Nueva contraseña</label>
            <input type={showPass ? "text" : "password"} className="w-full rounded-xl px-4 py-3 text-base mt-1" style={gi}
              value={passNueva} onChange={e => setPassNueva(e.target.value)} required placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="text-white/40 text-xs">Confirmar nueva contraseña</label>
            <input type={showPass ? "text" : "password"} className="w-full rounded-xl px-4 py-3 text-base mt-1" style={gi}
              value={passConfirm} onChange={e => setPassConfirm(e.target.value)} required placeholder="Repite la contraseña" />
          </div>
          {msgPass && <p className="text-sm" style={{ color: msgPass.startsWith("✅") ? "#4ade80" : "#fc8181" }}>{msgPass}</p>}
          <button type="submit" disabled={guardandoPass || !passActual || !passNueva || !passConfirm}
            className="w-full py-3 rounded-2xl text-white font-black disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg,#44337a,#805ad5)" }}>
            {guardandoPass ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
