"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, saveToken } from "@/lib/api";

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85",
  "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=1920&q=85",
  "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1920&q=85",
  "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1920&q=85",
];

const FEATURES = [
  { icon: "🐄", title: "Control de animales", desc: "Registro completo con fotos y eventos" },
  { icon: "💰", title: "Ventas NIO & USD", desc: "Finanzas con tipo de cambio en tiempo real" },
  { icon: "📊", title: "Reportes PDF", desc: "Informes profesionales al instante" },
  { icon: "🤰", title: "Control reproductivo", desc: "Partos, preñeces y crías" },
  { icon: "👥", title: "Gestión de equipo", desc: "Admins, trabajadores y permisos" },
  { icon: "📱", title: "App Android", desc: "Usa la app desde tu celular en el campo" },
];

const STATS = [
  { value: "100%", label: "En la nube" },
  { value: "24/7", label: "Disponible" },
  { value: "NIO+USD", label: "Doble moneda" },
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
  const [bgIdx, setBgIdx] = useState(0);
  const cardRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
    const t = setInterval(() => setBgIdx(i => (i + 1) % BG_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  function abrirLogin() {
    setShowLogin(true);
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function scrollACard() {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      {/* Fondo con slideshow */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {BG_IMAGES.map((src, i) => (
          <img key={i} src={src} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-2000"
            style={{ opacity: i === bgIdx ? 1 : 0, filter: "brightness(0.38) saturate(1.2)", transitionDuration: "2s" }} />
        ))}
        {/* Overlay gradiente verde oscuro */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(2,15,5,0.75) 0%,rgba(5,30,15,0.65) 50%,rgba(2,10,20,0.75) 100%)" }} />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%)" }} />
      </div>

      {/* Orbs decorativos */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {[
          { w:400, top:"5%", left:"2%", c:"#2d9e3f", delay:"0s" },
          { w:300, top:"60%", left:"65%", c:"#d69e2e", delay:"2s" },
          { w:200, top:"25%", left:"80%", c:"#2d9e3f", delay:"4s" },
          { w:250, top:"75%", left:"10%", c:"#3182ce", delay:"1s" },
        ].map((o, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ width: o.w, height: o.w, background: `radial-gradient(circle, ${o.c}22, transparent)`,
              top: o.top, left: o.left, filter: "blur(60px)", animation: `pulse 6s ease-in-out infinite`, animationDelay: o.delay }} />
        ))}
      </div>

      {/* Indicadores de imagen */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {BG_IMAGES.map((_, i) => (
          <button key={i} onClick={() => setBgIdx(i)}
            className="rounded-full transition-all duration-500"
            style={{ width: i === bgIdx ? 24 : 8, height: 8, background: i === bgIdx ? "#4ade80" : "rgba(255,255,255,0.3)" }} />
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
            <button onClick={scrollACard}
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

            <h1 className="text-white font-black leading-tight mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              El software<br />
              <span style={{ background: "linear-gradient(135deg,#4ade80,#22c55e,#86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ganadero
              </span>{" "}
              más<br />
              profesional de Latinoamérica
            </h1>

            <p className="text-white/60 text-base mb-8 max-w-md mx-auto lg:mx-0">
              Control total de animales, ventas en <strong className="text-white/80">NIO & USD</strong>, gastos, partos y equipo. Diseñado para ganaderos que exigen lo mejor.
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
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto lg:mx-0">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-2.5 rounded-2xl p-3 hover:scale-[1.02] transition-transform" style={glass}>
                  <span className="text-xl">{f.icon}</span>
                  <div>
                    <p className="text-white font-bold text-xs leading-tight">{f.title}</p>
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
