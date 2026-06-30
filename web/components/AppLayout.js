"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, api } from "@/lib/api";

const FARM_BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";

const NAV_ITEMS_ADMIN = [
  { icon: "🏠", label: "Inicio", href: "/dashboard" },
  { icon: "🐄", label: "Animales", href: "/inventario" },
  { icon: "💰", label: "Ventas", href: "/ventas" },
  { icon: "💸", label: "Gastos", href: "/gastos" },
  { icon: "🚨", label: "Incidentes", href: "/incidentes" },
  { icon: "📄", label: "Docs", href: "/documentos" },
  { icon: "👥", label: "Equipo", href: "/equipo" },
  { icon: "📢", label: "Tablón", href: "/anuncios", notif: true },
];

const NAV_ITEMS_SUPER = [
  { icon: "🏡", label: "Fincas", href: "/superadmin" },
];

export default function AppLayout({ children, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const [nuevos, setNuevos] = useState(0);

  const isSuperAdmin = pathname?.startsWith("/superadmin");
  const enTablon = pathname === "/anuncios";

  useEffect(() => {
    if (isSuperAdmin) return;

    async function checkNuevos() {
      try {
        const data = await api("/anuncios");
        const lastVisto = localStorage.getItem("tablon_last_visto");
        if (!lastVisto) {
          setNuevos(data.length);
          return;
        }
        const count = data.filter(a => new Date(a.createdAt) > new Date(lastVisto)).length;
        setNuevos(count);
      } catch {}
    }

    checkNuevos();
    const interval = setInterval(checkNuevos, 30000);
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  // Cuando entra al tablón, marcar como visto
  useEffect(() => {
    if (enTablon) {
      localStorage.setItem("tablon_last_visto", new Date().toISOString());
      setNuevos(0);
    }
  }, [enTablon]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex" style={{
      backgroundImage: `url('${FARM_BG}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "linear-gradient(135deg, rgba(5,30,15,0.55) 0%, rgba(10,40,20,0.4) 100%)"
      }} />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full z-20 flex flex-col items-center py-6 gap-2"
        style={{
          width: 72,
          background: "rgba(5,25,12,0.75)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
        }}>
        {/* Logo */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg"
          style={{ background: "rgba(45,158,63,0.4)", border: "1px solid rgba(45,158,63,0.6)" }}>
          🐄
        </div>

        {/* Nav links */}
        {(isSuperAdmin ? NAV_ITEMS_SUPER : NAV_ITEMS_ADMIN).map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const badge = item.notif && nuevos > 0 && !active;
          return (
            <button key={item.href}
              onClick={() => router.push(item.href)}
              className="relative flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl transition-all hover:scale-110"
              style={{
                background: active ? "rgba(45,158,63,0.5)" : "transparent",
                border: active ? "1px solid rgba(45,158,63,0.7)" : "1px solid transparent",
              }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 9, color: active ? "#86efac" : "rgba(255,255,255,0.55)", fontWeight: active ? 700 : 400 }}>
                {item.label}
              </span>
              {badge && (
                <span className="absolute top-1 right-1 flex items-center justify-center text-white font-black rounded-full animate-bounce"
                  style={{
                    background: "#e53e3e",
                    fontSize: 9,
                    minWidth: 16,
                    height: 16,
                    padding: "0 3px",
                    boxShadow: "0 0 6px rgba(229,62,62,0.8)",
                  }}>
                  {nuevos > 9 ? "9+" : nuevos}
                </span>
              )}
            </button>
          );
        })}

        <div className="flex-1" />
        <button onClick={handleLogout}
          className="flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl transition-all hover:scale-110"
          style={{ border: "1px solid transparent" }}>
          <span style={{ fontSize: 20 }}>🚪</span>
          <span style={{ fontSize: 9, color: "rgba(255,100,100,0.8)", fontWeight: 600 }}>Salir</span>
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 ml-[72px]">
        <header className="flex items-center justify-between px-6 py-4"
          style={{
            background: "rgba(5,25,12,0.65)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}>
          <div className="flex items-center gap-3">
            {!isSuperAdmin && (
              <button onClick={() => router.push("/dashboard")}
                className="text-white/60 hover:text-white text-xl mr-1 transition-colors">←</button>
            )}
            <div>
              <p className="text-green-300 text-xs font-bold uppercase tracking-widest">
                {subtitle || "Ganadería San Jerónimo"}
              </p>
              <h1 className="text-white font-black text-xl leading-none">{title || "Panel"}</h1>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center gap-1">
            <div className="text-3xl">🐄</div>
            <p className="text-white/70 text-xs font-bold tracking-widest uppercase">Ganadero SG</p>
          </div>

          <button onClick={handleLogout}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
            🚪 Cerrar sesión
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
