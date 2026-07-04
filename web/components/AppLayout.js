"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, api, getUsuario } from "@/lib/api";

const FARM_BG = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=85";

const NAV_ITEMS_ADMIN = [
  { icon: "🏠", label: "Dashboard",    href: "/dashboard" },
  { icon: "🐄", label: "Animales",     href: "/inventario" },
  { icon: "💰", label: "Ventas",       href: "/ventas", badge: "Nuevo" },
  { icon: "💸", label: "Gastos",       href: "/gastos" },
  { icon: "🤰", label: "Reproducción", href: "/inventario?filtro=PREÑADA" },
  { icon: "🚨", label: "Salud",        href: "/incidentes" },
  { icon: "📄", label: "Documentos",   href: "/documentos" },
  { icon: "👥", label: "Empleados",    href: "/equipo" },
  { icon: "📢", label: "Tablón",       href: "/anuncios", notif: true },
  { icon: "📊", label: "Reportes",     href: "/reportes" },
  { icon: "🕐", label: "Actividad",    href: "/actividad", notifActividad: true },
];

// En móvil solo mostramos los 5 más usados en la barra inferior
const NAV_MOBILE_PRIMARY = ["/dashboard", "/inventario", "/ventas", "/anuncios", "/incidentes"];

const NAV_ITEMS_SUPER = [
  { icon: "🏡", label: "Fincas", href: "/superadmin" },
];

export default function AppLayout({ children, title, subtitle, searchBar, rightExtra }) {
  const router = useRouter();
  const pathname = usePathname();
  const [nuevos, setNuevos] = useState(0);
  const [nuevasActividades, setNuevasActividades] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [suspendida, setSuspendida] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  useEffect(() => {
    setUsuario(getUsuario());
    api("/usuarios/perfil").then(d => setFotoPerfil(d.fotoPerfil)).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("finca_suspendida") === "1") {
      setSuspendida(true);
    }
  }, []);

  // Cuando está suspendida, revisar cada 5s si ya se reactivó
  useEffect(() => {
    if (!suspendida) return;
    const t = setInterval(async () => {
      try {
        await api("/fincas/mi-finca");
        // Si llega aquí es porque la finca está activa de nuevo
        localStorage.removeItem("finca_suspendida");
        setSuspendida(false);
        router.refresh();
      } catch (e) {
        // Sigue suspendida, no hacer nada
      }
    }, 5000);
    return () => clearInterval(t);
  }, [suspendida]);

  const isSuperAdmin = pathname?.startsWith("/superadmin");
  const enTablon = pathname === "/anuncios";
  const enActividad = pathname === "/actividad";
  const enNotificaciones = pathname === "/notificaciones";
  const esTrabajador = usuario?.role === "TRABAJADOR";
  const navItemsBase = isSuperAdmin ? NAV_ITEMS_SUPER : NAV_ITEMS_ADMIN;
  const navItems = esTrabajador ? navItemsBase.filter(i => i.href !== "/equipo" && i.href !== "/actividad" && i.href !== "/reportes") : navItemsBase;
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

  // Badge de actividades de trabajadores no vistas (solo para ADMIN)
  useEffect(() => {
    if (isSuperAdmin) return;
    const u = getUsuario();
    if (u?.role !== "ADMIN") return;

    async function checkActividades() {
      try {
        const data = await api("/actividad");
        const lastVisto = localStorage.getItem("actividad_last_visto");
        const deTrabajadores = data.filter(a => a.usuario?.role === "TRABAJADOR");
        if (!lastVisto) {
          // Primera vez — marcar todas como vistas
          if (deTrabajadores.length > 0) {
            localStorage.setItem("actividad_last_visto", deTrabajadores[0].createdAt);
          }
          setNuevasActividades(0);
          return;
        }
        const nuevas = deTrabajadores.filter(a => new Date(a.createdAt) > new Date(lastVisto));
        setNuevasActividades(nuevas.length);
      } catch {}
    }
    checkActividades();
    const interval = setInterval(checkActividades, 15000);
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  useEffect(() => {
    if (enActividad || enNotificaciones) {
      localStorage.setItem("actividad_last_visto", new Date().toISOString());
      setNuevasActividades(0);
    }
  }, [enActividad, enNotificaciones]);

  function handleLogout() { logout(); router.push("/"); }
  function go(href) { router.push(href); setMenuOpen(false); }

  const glassNav = {
    background: "rgba(5,25,12,0.82)",
    backdropFilter: "blur(20px)",
    borderColor: "rgba(255,255,255,0.1)",
  };

  // Pantalla de finca suspendida
  if (suspendida) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{
        backgroundImage: `url(${FARM_BG})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <div className="rounded-3xl p-8 max-w-md w-full text-center shadow-2xl" style={{
          background: "rgba(10,5,20,0.88)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(239,68,68,0.4)",
        }}>
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-white font-black text-2xl mb-2">Finca Suspendida</h2>
          <p className="text-white/70 text-sm mb-6 leading-relaxed">
            Tu finca ha sido <span className="text-red-400 font-bold">suspendida temporalmente</span>. No puedes acceder al sistema en este momento.
          </p>
          <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-white/60 text-xs mb-1">Para reactivar tu cuenta, comunícate con:</p>
            <p className="text-white font-bold text-sm">Administrador del Sistema</p>
            <p className="text-blue-300 text-sm mt-1">jhonces20@gmail.com</p>
          </div>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="w-full py-3 rounded-xl text-white font-bold text-sm"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{
      backgroundImage: `url('${FARM_BG}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "linear-gradient(135deg,rgba(5,30,15,0.55) 0%,rgba(10,40,20,0.4) 100%)"
      }} />

      {/* ── SIDEBAR DESKTOP (lg+) — ancho con labels ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full z-20 flex-col py-0 overflow-hidden"
        style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.08)", ...glassNav }}>

        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)", border: "1px solid rgba(45,158,63,0.6)" }}>🐂</div>
          <div>
            <p className="text-white font-black text-sm leading-none tracking-wide">HENRIQUEZ</p>
            <p className="text-green-400 font-bold leading-none mt-0.5" style={{ fontSize: 9, letterSpacing: 1 }}>CATTLE MANAGEMENT</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href.split("?")[0]));
            const notifBadge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
            const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
            return (
              <button key={item.href} onClick={() => go(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 text-left group"
                style={{
                  background: active ? "rgba(45,158,63,0.25)" : "transparent",
                  border: active ? "1px solid rgba(45,158,63,0.4)" : "1px solid transparent",
                }}>
                <span style={{ fontSize: 18, minWidth: 20 }}>{item.icon}</span>
                <span className="flex-1 font-semibold" style={{ fontSize: 13, color: active ? "#86efac" : "rgba(255,255,255,0.75)" }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-white font-black rounded-full px-1.5 py-0.5" style={{ fontSize: 9, background: "#2d9e3f" }}>{item.badge}</span>
                )}
                {notifBadge && (
                  <span className="text-white font-black rounded-full flex items-center justify-center animate-bounce"
                    style={{ background: "#e53e3e", fontSize: 9, minWidth: 16, height: 16, padding: "0 2px" }}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Usuario en sidebar */}
        {usuario && (
          <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => go("/perfil")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-black text-sm shrink-0"
                style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)", color: "white" }}>
                {fotoPerfil ? <img src={fotoPerfil} alt="" className="w-full h-full object-cover" /> : usuario.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-white font-bold text-xs truncate leading-none">{usuario.nombre}</p>
                <p className="text-green-400 font-semibold mt-0.5" style={{ fontSize: 10 }}>
                  {usuario.role === "ADMIN" ? "Administrador" : usuario.role === "SUPER_ADMIN" ? "Super Admin" : "Trabajador"}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1.5 px-3 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/40 font-medium" style={{ fontSize: 10 }}>Sincronizado</span>
            </div>
            <button onClick={handleLogout}
              className="w-full mt-2 py-2 rounded-xl text-red-400 font-bold text-xs hover:bg-red-500/10 transition-all"
              style={{ border: "1px solid rgba(229,62,62,0.2)" }}>
              🚪 Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* ── SIDEBAR MEDIO (md, tablet) — iconos solo ── */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 h-full z-20 flex-col items-center py-4 gap-1"
        style={{ width: 64, borderRight: "1px solid rgba(255,255,255,0.08)", ...glassNav }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 shadow-lg"
          style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)", border: "1px solid rgba(45,158,63,0.6)" }}>🐂</div>
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href.split("?")[0]));
          const notifBadge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
          const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
          return (
            <button key={item.href} onClick={() => go(item.href)}
              className="relative flex flex-col items-center gap-0.5 w-12 py-2 rounded-xl transition-all hover:scale-110"
              style={{ background: active ? "rgba(45,158,63,0.4)" : "transparent", border: active ? "1px solid rgba(45,158,63,0.6)" : "1px solid transparent" }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              <span style={{ fontSize: 8, color: active ? "#86efac" : "rgba(255,255,255,0.45)", fontWeight: active ? 700 : 400 }}>{item.label.slice(0,6)}</span>
              {notifBadge && <span className="absolute top-0.5 right-0.5 bg-red-500 text-white font-black rounded-full flex items-center justify-center" style={{ fontSize: 8, minWidth: 14, height: 14 }}>{badgeCount > 9 ? "9+" : badgeCount}</span>}
            </button>
          );
        })}
        <div className="flex-1" />
        <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 w-12 py-2 rounded-xl hover:scale-110 transition-all">
          <span style={{ fontSize: 17 }}>🚪</span>
          <span style={{ fontSize: 8, color: "rgba(255,100,100,0.8)", fontWeight: 600 }}>Salir</span>
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 md:ml-[64px] lg:ml-[220px]">

        {/* Header */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 sticky top-0 z-10"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", ...glassNav }}>
          <div className="flex items-center gap-2 shrink-0">
            {!isSuperAdmin && (
              <button onClick={() => router.back()}
                className="text-white/60 hover:text-white text-xl mr-1 transition-colors md:hidden">←</button>
            )}
            <div>
              <p className="text-green-300 font-bold uppercase tracking-widest" style={{ fontSize: 10 }}>
                {subtitle || "Ganadería San Jerónimo"}
              </p>
              <h1 className="text-white font-black leading-none text-lg">{title || "Panel"}</h1>
            </div>
          </div>

          {/* Search bar (slot) */}
          {searchBar && <div className="flex-1">{searchBar}</div>}

          <div className="flex items-center gap-2 ml-auto">
            {!isSuperAdmin && !esTrabajador && (
              <button onClick={() => router.push("/notificaciones")}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                style={{ background: enNotificaciones ? "rgba(45,158,63,0.4)" : "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span style={{ fontSize: 16 }}>🔔</span>
                {nuevasActividades > 0 && !enNotificaciones && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black rounded-full flex items-center justify-center animate-bounce"
                    style={{ fontSize: 8, minWidth: 16, height: 16 }}>
                    {nuevasActividades > 9 ? "9+" : nuevasActividades}
                  </span>
                )}
              </button>
            )}
            {usuario && (
              <button onClick={() => router.push("/perfil")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:scale-105 transition-all lg:hidden"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-black text-sm shrink-0"
                  style={{ background: "linear-gradient(135deg,#1a5c2a,#2d9e3f)", color: "white" }}>
                  {fotoPerfil ? <img src={fotoPerfil} alt="" className="w-full h-full object-cover" /> : usuario.nombre?.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-bold hidden sm:block" style={{ fontSize: 12 }}>{usuario.nombre}</span>
              </button>
            )}
            {rightExtra}
            <button onClick={() => setMenuOpen(s => !s)}
              className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <span className="text-white text-lg">{menuOpen ? "✕" : "☰"}</span>
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
                const badge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
          const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
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
                        {badgeCount > 9 ? "9+" : badgeCount}
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
          const badge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
          const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
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
                  {badgeCount > 9 ? "9+" : badgeCount}
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
