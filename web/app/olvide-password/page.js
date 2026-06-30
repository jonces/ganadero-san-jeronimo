"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const FARM_BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";

export default function OlvidePasswordPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function enviarCodigo(e) {
    e.preventDefault();
    setCargando(true); setError("");
    try {
      const r = await fetch(`${API_URL}/auth/olvide-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setExito("Si el email existe, recibirás un código en tu correo.");
      setPaso(2);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    if (nueva !== confirmar) return setError("Las contraseñas no coinciden");
    if (nueva.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    setCargando(true); setError("");
    try {
      const r = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, nuevaPassword: nueva }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setExito("✅ Contraseña cambiada. Redirigiendo...");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }

  const inp = "w-full rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 text-base";
  const inpStyle = { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundImage: `url('${FARM_BG}')`, backgroundSize: "cover", backgroundPosition: "center",
    }}>
      <div className="absolute inset-0" style={{ background: "rgba(5,25,12,0.7)" }} />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐄</div>
          <h1 className="text-white font-black text-2xl">Recuperar Contraseña</h1>
          <p className="text-white/50 text-sm mt-1">Ganadero San Jerónimo</p>
        </div>

        <div className="rounded-3xl p-6 shadow-2xl" style={{ background: "rgba(5,25,12,0.75)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          {error && <div className="mb-4 text-red-300 text-sm p-3 rounded-xl" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>{error}</div>}
          {exito && <div className="mb-4 text-green-300 text-sm p-3 rounded-xl" style={{ background: "rgba(45,158,63,0.2)", border: "1px solid rgba(45,158,63,0.4)" }}>{exito}</div>}

          {paso === 1 && (
            <form onSubmit={enviarCodigo} className="space-y-4">
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wide">Tu email</label>
                <input type="email" className={inp} style={inpStyle} placeholder="correo@ejemplo.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button disabled={cargando} type="submit"
                className="w-full text-white font-black py-3 rounded-2xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
                {cargando ? "Enviando..." : "📧 Enviar código"}
              </button>
            </form>
          )}

          {paso === 2 && (
            <form onSubmit={cambiarPassword} className="space-y-4">
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wide">Código de 6 dígitos</label>
                <input type="text" className={inp} style={inpStyle} placeholder="000000" maxLength={6}
                  value={codigo} onChange={e => setCodigo(e.target.value)} required />
              </div>
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wide">Nueva contraseña</label>
                <input type="password" className={inp} style={inpStyle} placeholder="Mínimo 6 caracteres"
                  value={nueva} onChange={e => setNueva(e.target.value)} required minLength={6} />
              </div>
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wide">Confirmar contraseña</label>
                <input type="password" className={inp} style={inpStyle} placeholder="Repite la contraseña"
                  value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
              </div>
              <button disabled={cargando} type="submit"
                className="w-full text-white font-black py-3 rounded-2xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
                {cargando ? "Cambiando..." : "🔑 Cambiar contraseña"}
              </button>
              <button type="button" onClick={() => setPaso(1)} className="w-full text-white/40 text-sm hover:text-white/70 transition-colors">
                ← Volver
              </button>
            </form>
          )}

          <button onClick={() => router.push("/")} className="w-full text-white/40 text-sm mt-4 hover:text-white/70 transition-colors">
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}
