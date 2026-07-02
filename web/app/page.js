"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, saveToken } from "@/lib/api";

const BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";

const FEATURES = [
  { icon: "🐄", title: "Control de animales", desc: "Registro completo de tu ganado" },
  { icon: "💰", title: "Ventas y gastos", desc: "Finanzas claras en tiempo real" },
  { icon: "📊", title: "Reportes PDF", desc: "Informes profesionales al instante" },
  { icon: "👥", title: "Gestión de equipo", desc: "Administra tus trabajadores" },
];

const STATS = [
  { value: "100%", label: "En la nube" },
  { value: "24/7", label: "Disponible" },
  { value: "∞", label: "Animales" },
  { value: "🔒", label: "Seguro" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  function abrirLogin() {
    setShowLogin(true);
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      saveToken(data.token);
      router.push(data.usuario.role === "SUPER_ADMIN" ? "/superadmin" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const glass = {
    background: "rgba(5,20,10,0.72)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.13)",
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Fondo */}
      <div className="fixed inset-0 z-0">
        <img src={BG} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.45)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(5,40,15,0.7) 0%,rgba(10,25,40,0.6) 100%)" }} />
      </div>

      {/* Partículas decorativas */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-10"
            style={{
              width: [300,200,150,250,180,120][i],
              height: [300,200,150,250,180,120][i],
              background: "radial-gradient(circle, #2d9e3f, transparent)",
              top: ["10%","60%","30%","80%","5%","50%"][i],
              left: ["5%","70%","85%","15%","50%","40%"][i],
              filter: "blur(40px)",
            }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-lg"
              style={{ background: "rgba(45,158,63,0.35)", border: "1px solid rgba(45,158,63,0.6)" }}>🐄</div>
            <div>
              <p className="text-green-400 font-black text-sm tracking-widest uppercase">Software Ganadero</p>
              <p className="text-white font-black text-xl leading-none">Henriquez</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs hidden sm:block">¿Ya tienes cuenta?</span>
            <button onClick={abrirLogin}
              className="text-white text-sm font-bold px-4 py-2 rounded-xl transition-all hover:scale-105"
              style={{ background: "rgba(45,158,63,0.3)", border: "1px solid rgba(45,158,63,0.5)" }}>
              Iniciar sesión
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-8 max-w-6xl mx-auto w-full">

          {/* Texto izquierda */}
          <div className={`flex-1 text-center lg:text-left transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(45,158,63,0.2)", border: "1px solid rgba(45,158,63,0.4)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold tracking-wider uppercase">Sistema en línea</span>
            </div>

            <h1 className="text-white font-black leading-tight mb-4" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}>
              Gestiona tu<br />
              <span style={{ background: "linear-gradient(135deg,#4ade80,#22c55e,#16a34a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ganadería
              </span><br />
              desde cualquier lugar
            </h1>

            <p className="text-white/60 text-lg mb-8 max-w-md mx-auto lg:mx-0">
              Control total de animales, ventas, gastos y equipo. Todo en una plataforma profesional y fácil de usar.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-8 max-w-sm mx-auto lg:mx-0">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-2xl p-3 text-center" style={glass}>
                  <p className="text-green-400 font-black text-lg">{s.value}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-3 rounded-2xl p-3" style={glass}>
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{f.title}</p>
                    <p className="text-white/40 text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card derecha */}
          <div ref={cardRef} className={`w-full max-w-sm transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="rounded-3xl p-8 shadow-2xl" style={glass}>

              {!showLogin ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4 shadow-xl"
                      style={{ background: "linear-gradient(135deg,rgba(45,158,63,0.5),rgba(26,107,42,0.8))", border: "1px solid rgba(45,158,63,0.6)" }}>
                      🐄
                    </div>
                    <h2 className="text-white font-black text-2xl">Ganadero SG</h2>
                    <p className="text-white/50 text-sm mt-1">Vacunos & Búfalos</p>
                  </div>

                  <div className="space-y-3">
                    <button onClick={abrirLogin}
                      className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl hover:scale-[1.02] transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)", border: "1px solid rgba(45,158,63,0.5)", boxShadow: "0 8px 32px rgba(45,158,63,0.4)" }}>
                      🔐 Iniciar Sesión
                    </button>
                    <a href="/registro"
                      className="block w-full py-4 rounded-2xl text-center text-white font-black text-lg shadow-xl hover:scale-[1.02] transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg,#7c4a00,#d69e2e)", border: "1px solid rgba(214,158,46,0.5)", boxShadow: "0 8px 32px rgba(214,158,46,0.3)" }}>
                      🌱 Registrar Finca
                    </a>
                  </div>

                  <p className="text-center text-white/20 text-xs mt-6">
                    © 2026 Software Ganadero Henriquez · Todos los derechos reservados
                  </p>
                </>
              ) : (
                <>
                  <button onClick={() => setShowLogin(false)}
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
                    ← Volver
                  </button>

                  <h2 className="text-white font-black text-2xl mb-1">Bienvenido</h2>
                  <p className="text-white/40 text-sm mb-6">Ingresa tus credenciales para continuar</p>

                  {error && (
                    <div className="rounded-xl p-3 mb-4 text-sm text-red-300"
                      style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Correo electrónico</label>
                      <input
                        className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                        type="email" placeholder="tu@email.com"
                        value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Contraseña</label>
                      <div className="relative">
                        <input
                          className="w-full rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                          type={showPassword ? "text" : "password"} placeholder="••••••••"
                          value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 text-lg transition-colors">
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>

                    <button disabled={loading}
                      className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)", boxShadow: "0 8px 32px rgba(45,158,63,0.4)" }}>
                      {loading ? "Entrando..." : "Entrar →"}
                    </button>

                    <button type="button" onClick={() => router.push("/olvide-password")}
                      className="w-full text-center text-white/40 hover:text-white/70 text-sm transition-colors">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-4 px-6">
          <p className="text-white/20 text-xs">Líder en latinoamérica en sistematización de ganaderías 🐄</p>
        </footer>
      </div>
    </main>
  );
}
