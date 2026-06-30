"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      saveToken(data.token);
      if (data.usuario.role === "SUPER_ADMIN") {
        router.push("/superadmin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#87CEEB" }}>

      {/* Hero superior con vacas */}
      <div className="relative flex flex-col items-center justify-center pt-10 pb-0" style={{ minHeight: "55vh", background: "linear-gradient(180deg, #5bb8f5 0%, #87CEEB 60%, #6ab04c 100%)" }}>

        {/* Logo central */}
        <div className="flex flex-col items-center z-10 mb-4">
          <div className="relative flex items-center justify-center mb-2">
            <div className="rounded-full flex items-center justify-center shadow-2xl border-4 border-white"
              style={{ width: 120, height: 120, background: "radial-gradient(circle at 40% 40%, #4caf50, #1a6b2a)" }}>
              <span style={{ fontSize: 64 }}>🐄</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-semibold tracking-widest uppercase opacity-90">Software</p>
            <div className="flex items-center gap-1 justify-center">
              <span className="font-black text-white drop-shadow-lg" style={{ fontSize: 38, letterSpacing: 2 }}>GANADERO</span>
              <span className="font-black text-white rounded px-1 ml-1" style={{ fontSize: 22, background: "#1a6b2a" }}>SG</span>
            </div>
            <div className="rounded-lg px-4 py-1 mt-1 inline-block" style={{ background: "#6b3a1f" }}>
              <span className="text-white text-xs font-bold tracking-wide">Vacunos &amp; Búfalos</span>
            </div>
          </div>
        </div>

        {/* Fila de vacas con emojis grandes */}
        <div className="w-full flex justify-center items-end gap-0 overflow-hidden" style={{ marginTop: 8 }}>
          {["🐄","🐂","🐄","🐃","🐄","🐂","🐄","🐃","🐄"].map((e, i) => (
            <span key={i} style={{
              fontSize: i % 2 === 0 ? 52 : 44,
              filter: i % 3 === 0 ? "none" : "brightness(0.85)",
              marginBottom: i % 2 === 0 ? 0 : 8,
              transform: i % 2 !== 0 ? "scaleX(-1)" : "none"
            }}>{e}</span>
          ))}
        </div>

        {/* Franja verde con texto */}
        <div className="w-full py-3 text-center" style={{ background: "rgba(26,107,42,0.93)" }}>
          <span className="text-white font-black text-xl tracking-wide drop-shadow"
            style={{ textShadow: "2px 2px 6px #000a" }}>
            Líder en latinoamérica en sistematización de ganaderías
          </span>
        </div>
      </div>

      {/* Sección inferior: botones o formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ background: "#f0f4f0" }}>
        {!showLogin ? (
          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => setShowLogin(true)}
              className="w-full text-white rounded-2xl py-4 font-bold text-xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #1a6b2a, #2d9e3f)" }}
            >
              🔐 Iniciar Sesión
            </button>
            <a href="/registro"
              className="block w-full text-center text-white rounded-2xl py-4 font-bold text-xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #b7791f, #d69e2e)" }}
            >
              🌱 Registrar Nueva Finca
            </a>
            <p className="text-center text-gray-400 text-xs mt-4">
              © 2025 Ganadero SG · Todos los derechos reservados
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm space-y-4">
            <h2 className="text-xl font-bold text-center" style={{ color: "#1a6b2a" }}>Iniciar Sesión</h2>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Correo electrónico</label>
              <input className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none"
                type="email" placeholder="tu@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Contraseña</label>
              <input className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none"
                type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button disabled={loading}
              className="w-full text-white rounded-xl p-3 font-bold text-lg disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1a6b2a, #2d9e3f)" }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <button type="button" onClick={() => router.push("/olvide-password")}
              className="w-full text-green-400/70 text-sm hover:text-green-300 transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
            <button type="button" onClick={() => setShowLogin(false)}
              className="w-full text-gray-500 text-sm underline">
              ← Volver
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
