"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, api } from "@/lib/api";

const FARM_BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";

const NAV_ITEMS_ADMIN = [
  { icon: "🏠", label: "Inicio",     href: "/dashboard" },
  { icon: "🐄", label: "Animales",   href: "/inventario" },
  { icon: "💰", label: "Ventas",     href: "/ventas" },
  { icon: "💸", label: "Gastos",     href: "/gastos" },
  { icon: "🚨", label: "Incidentes", href: "/incidentes" },
  { icon: "📄", label: "Docs",       href: "/documentos" },
  { icon: "👥", label: "Equipo",     href: "/equipo" },
  { icon: "📢", label: "Tablón",     href: "/anuncios", notif: true },
  { icon: "📊", label: "Reportes",   href: "/reportes" },
  { icon: "🕐", label: "Actividad",  href: "/actividad" },
];

// En móvil solo mostramos los 5 más usados en la barra inferior
const NAV_MOBILE_PRIMARY = ["/dashboard", "/inventario", "/ventas", "/anuncios", "/incidentes"];

const NAV_ITEMS_SUPER = [
  { icon: "🏡", label: "Fincas", href: "/superadmin" },
];

export default function AppLayout({ children, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const [nuevos, setNuevos] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isSuperAdmin = pathname?.startsWith("/superadmin");
  const enTablon = pathname === "/anuncios";
  const navItems = isSuperAdmin ? NAV_ITEMS_SUPER : NAV_ITEMS_ADMIN;
  const mobileItems = navItems.filter(i => NAV_MOBILE_PRIMARY.includes(i.href));

  useEffect(() => {
    if (isSuperAdmin) return;
    async function checkNuevos() {
      try {
        const data = await api("/anuncios");
        const lastVisto = localStorage.getItem("tablon_last_visto");
        if (!lastVisto) { setNuevos(data.length); return; }
        setNuevos(data.filter(a => new Date(a.createdAt) > new Date(lastVisto)).length);
      } catch {}
    }
    checkNuevos();
    const interval = setInterval(checkNuevos, 30000);
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  useEffect(() => {
    if (enTablon) {
      localStorage.setItem("tablon_last_visto", new Date().toISOString());
      setNuevos(0);
    }
  }, [enTablon]);

  function handleLogout() { logout(); router.push("/"); }
  function go(href) { router.push(href); setMenuOpen(false); }

  const glassNav = {
    background: "rgba(5,25,12,0.82)",
    backdropFilter: "blur(20px)",
    borderColor: "rgba(255,255,255,0.1)",
  };

  return (
    <div className="min-h-screen flex" style={{
      backgroundImage: `url('${FARM_BG}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "linear-gradient(135deg,rgba(5,30,15,0.55) 0%,rgba(10,40,20,0.4) 100%)"
      }} />

      {/* ── SIDEBAR (tablet md+ y desktop) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full z-20 flex-col items-center py-6 gap-1"
        style={{ width: 72, borderRight: "1px solid rgba(255,255,255,0.1)", ...glassNav }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-lg"
          style={{ background: "rgba(45,158,63,0.4)", border: "1px solid rgba(45,158,63,0.6)" }}>🐄</div>

        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const badge = item.notif && nuevos > 0 && !active;
          return (
            <button key={item.href} onClick={() => go(item.href)}
              className="relative flex flex-col items-center gap-0.5 w-14 py-2 rounded-xl transition-all hover:scale-110"
              style={{
                background: active ? "rgba(45,158,63,0.5)" : "transparent",
                border: active ? "1px solid rgba(45,158,63,0.7)" : "1px solid transparent",
              }}>
              <span style={{ fontSize: 19 }}>{item.icon}</span>
              <span style={{ fontSize: 9, color: active ? "#86efac" : "rgba(255,255,255,0.5)", fontWeight: active ? 700 : 400 }}>
                {item.label}
              </span>
              {badge && (
                <span className="absolute top-0.5 right-0.5 flex items-center justify-center text-white font-black rounded-full animate-bounce"
                  style={{ background: "#e53e3e", fontSize: 8, minWidth: 15, height: 15, padding: "0 2px", boxShadow: "0 0 6px rgba(229,62,62,0.8)" }}>
                  {nuevos > 9 ? "9+" : nuevos}
                </span>
              )}
            </button>
          );
        })}

        <div className="flex-1" />
        <button onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 w-14 py-2 rounded-xl hover:scale-110 transition-all">
          <span style={{ fontSize: 19 }}>🚪</span>
          <span style={{ fontSize: 9, color: "rgba(255,100,100,0.8)", fontWeight: 600 }}>Salir</span>
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 md:ml-[72px]">

        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", ...glassNav }}>
          <div className="flex items-center gap-2">
            {!isSuperAdmin && (
              <button onClick={() => router.back()}
                className="text-white/60 hover:text-white text-xl mr-1 transition-colors md:hidden">←</button>
            )}
            <div>
              <p className="text-green-300 font-bold uppercase tracking-widest" style={{ fontSize: 10 }}>
                {subtitle || "Ganadería San Jerónimo"}
              </p>
              <h1 className="text-white font-black leading-none text-lg md:text-xl">{title || "Panel"}</h1>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center">
            <div className="text-2xl">🐄</div>
            <p className="text-white/60 font-bold tracking-widest uppercase" style={{ fontSize: 9 }}>Ganadero SG</p>
          </div>

          {/* Botón menú completo en móvil */}
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(s => !s)}
              className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <span className="text-white text-lg">{menuOpen ? "✕" : "☰"}</span>
            </button>
            <button onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:scale-105 transition-all"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
              🚪 Cerrar sesión
            </button>
          </div>
        </header>

        {/* Menú desplegable móvil (todos los módulos) */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setMenuOpen(false)}>
            <div className="rounded-t-3xl p-5 pb-28 grid grid-cols-4 gap-3" style={{ ...glassNav, border: "none" }}
              onClick={e => e.stopPropagation()}>
              <p className="col-span-4 text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Todos los módulos</p>
              {navItems.map(item => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                const badge = item.notif && nuevos > 0 && !active;
                return (
                  <button key={item.href} onClick={() => go(item.href)}
                    className="relative flex flex-col items-center gap-1 py-3 rounded-2xl"
                    style={{
                      background: active ? "rgba(45,158,63,0.4)" : "rgba(255,255,255,0.07)",
                      border: active ? "1px solid rgba(45,158,63,0.6)" : "1px solid rgba(255,255,255,0.1)",
                    }}>
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                    <span style={{ fontSize: 10, color: active ? "#86efac" : "rgba(255,255,255,0.7)", fontWeight: active ? 700 : 400 }}>
                      {item.label}
                    </span>
                    {badge && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white font-black rounded-full flex items-center justify-center"
                        style={{ fontSize: 9, minWidth: 16, height: 16 }}>
                        {nuevos > 9 ? "9+" : nuevos}
                      </span>
                    )}
                  </button>
                );
              })}
              <button onClick={handleLogout}
                className="col-span-4 mt-2 py-3 rounded-2xl font-black text-white"
                style={{ background: "rgba(220,38,38,0.3)", border: "1px solid rgba(220,38,38,0.5)" }}>
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Contenido */}
        <main className="flex-1 p-3 md:p-6 overflow-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── BARRA INFERIOR MÓVIL ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around px-2 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.12)", ...glassNav }}>
        {mobileItems.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const badge = item.notif && nuevos > 0 && !active;
          return (
            <button key={item.href} onClick={() => go(item.href)}
              className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all"
              style={{
                background: active ? "rgba(45,158,63,0.35)" : "transparent",
                border: active ? "1px solid rgba(45,158,63,0.5)" : "1px solid transparent",
              }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: active ? "#86efac" : "rgba(255,255,255,0.5)", fontWeight: active ? 700 : 400 }}>
                {item.label}
              </span>
              {badge && (
                <span className="absolute top-0 right-3 bg-red-500 text-white font-black rounded-full flex items-center justify-center animate-bounce"
                  style={{ fontSize: 9, minWidth: 16, height: 16, boxShadow: "0 0 6px rgba(229,62,62,0.8)" }}>
                  {nuevos > 9 ? "9+" : nuevos}
                </span>
              )}
            </button>
          );
        })}
        {/* Botón "más" para abrir el menú completo */}
        <button onClick={() => setMenuOpen(s => !s)}
          className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all"
          style={{ background: menuOpen ? "rgba(255,255,255,0.15)" : "transparent", border: "1px solid transparent" }}>
          <span style={{ fontSize: 22 }}>☰</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>Más</span>
        </button>
      </nav>
    </div>
  );
}
