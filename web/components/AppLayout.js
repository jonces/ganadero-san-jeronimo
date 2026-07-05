"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, api, getUsuario } from "@/lib/api";

// ── Paleta oficial del sistema ──
const C = {
  primary:   "#145A32",
  secondary: "#1E8449",
  success:   "#27AE60",
  sidebar:   "#145A32",
  sidebarHov:"#1E8449",
  bg:        "#F8F9FA",
  white:     "#FFFFFF",
  text:      "#2C3E50",
  textLight: "#7F8C8D",
  border:    "#E2E8F0",
  red:       "#E74C3C",
};

const NAV_ITEMS_ADMIN = [
  { icon: "⊞",  label: "Dashboard",    href: "/dashboard" },
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

  useEffect(() => {
    if (!suspendida) return;
    const t = setInterval(async () => {
      try {
        await api("/fincas/mi-finca");
        localStorage.removeItem("finca_suspendida");
        setSuspendida(false);
        router.refresh();
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [suspendida]);

  const isSuperAdmin = pathname?.startsWith("/superadmin");
  const enTablon = pathname === "/anuncios";
  const enActividad = pathname === "/actividad";
  const enNotificaciones = pathname === "/notificaciones";
  const esTrabajador = usuario?.role === "TRABAJADOR";
  const navItemsBase = isSuperAdmin ? NAV_ITEMS_SUPER : NAV_ITEMS_ADMIN;
  const navItems = esTrabajador
    ? navItemsBase.filter(i => i.href !== "/equipo" && i.href !== "/actividad" && i.href !== "/reportes")
    : navItemsBase;
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
          if (deTrabajadores.length > 0) localStorage.setItem("actividad_last_visto", deTrabajadores[0].createdAt);
          setNuevasActividades(0);
          return;
        }
        setNuevasActividades(deTrabajadores.filter(a => new Date(a.createdAt) > new Date(lastVisto)).length);
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

  if (suspendida) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: C.bg }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center shadow-xl" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: "#FDE8E8" }}>🔒</div>
          <h2 className="font-black text-2xl mb-2" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>Finca Suspendida</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: C.textLight }}>
            Tu finca ha sido <span style={{ color: C.red, fontWeight: 700 }}>suspendida temporalmente</span>. Comunícate con el administrador para reactivarla.
          </p>
          <div className="rounded-xl p-4 mb-6" style={{ background: "#FDE8E8", border: "1px solid #FADBD8" }}>
            <p className="text-sm font-bold" style={{ color: C.text }}>jhonces20@gmail.com</p>
          </div>
          <button onClick={() => { logout(); router.push("/"); }}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
            style={{ background: C.primary, color: "#FFF" }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: C.bg }}>

      {/* ── SIDEBAR DESKTOP (lg+) — 220px con labels ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full z-20 flex-col overflow-hidden"
        style={{ width: 220, background: C.sidebar, boxShadow: "4px 0 20px rgba(20,90,50,0.25)" }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>🐂</div>
          <div>
            <p className="text-white font-black text-sm leading-none tracking-wide" style={{ fontFamily: "var(--font-poppins)" }}>HENRIQUEZ</p>
            <p className="font-bold leading-none mt-0.5" style={{ fontSize: 9, letterSpacing: 1, color: "rgba(255,255,255,0.65)" }}>CATTLE MANAGEMENT</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href.split("?")[0]));
            const notifBadge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
            const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
            return (
              <button key={item.href} onClick={() => go(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                style={{
                  background: active ? "rgba(255,255,255,0.18)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
                }}>
                <span style={{ fontSize: 17, minWidth: 20 }}>{item.icon}</span>
                <span className="flex-1 font-semibold" style={{
                  fontSize: 13,
                  color: active ? "#FFFFFF" : "rgba(255,255,255,0.72)",
                  fontFamily: "var(--font-inter)",
                }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-white font-black rounded-full px-1.5 py-0.5"
                    style={{ fontSize: 9, background: "#27AE60" }}>{item.badge}</span>
                )}
                {notifBadge && (
                  <span className="text-white font-black rounded-full flex items-center justify-center animate-bounce"
                    style={{ background: C.red, fontSize: 9, minWidth: 16, height: 16, padding: "0 2px" }}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Usuario */}
        {usuario && (
          <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <button onClick={() => go("/perfil")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-black text-sm shrink-0"
                style={{ background: "rgba(255,255,255,0.25)", color: "white" }}>
                {fotoPerfil
                  ? <img src={fotoPerfil} alt="" className="w-full h-full object-cover" />
                  : <span style={{ fontFamily: "var(--font-poppins)" }}>{usuario.nombre?.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-white font-bold text-xs truncate leading-none" style={{ fontFamily: "var(--font-inter)" }}>{usuario.nombre}</p>
                <p className="font-semibold mt-0.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                  {usuario.role === "ADMIN" ? "Administrador" : usuario.role === "SUPER_ADMIN" ? "Super Admin" : "Trabajador"}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1.5 px-3 mt-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
              <span className="font-medium" style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>Sincronizado</span>
            </div>
            <button onClick={handleLogout}
              className="w-full mt-2 py-2 rounded-xl font-bold text-xs transition-all hover:opacity-80"
              style={{ background: "rgba(231,76,60,0.2)", color: "#FF8A8A", border: "1px solid rgba(231,76,60,0.3)" }}>
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* ── SIDEBAR TABLET (md) — iconos ── */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 h-full z-20 flex-col items-center py-4 gap-0.5"
        style={{ width: 64, background: C.sidebar, boxShadow: "4px 0 20px rgba(20,90,50,0.25)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 shadow-lg"
          style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>🐂</div>
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href.split("?")[0]));
          const notifBadge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
          const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
          return (
            <button key={item.href} onClick={() => go(item.href)}
              className="relative flex flex-col items-center gap-0.5 w-12 py-2 rounded-xl transition-all"
              style={{
                background: active ? "rgba(255,255,255,0.2)" : "transparent",
                border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
              }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              <span style={{ fontSize: 8, color: active ? "#FFF" : "rgba(255,255,255,0.5)", fontWeight: active ? 700 : 400 }}>{item.label.slice(0, 6)}</span>
              {notifBadge && (
                <span className="absolute top-0.5 right-0.5 text-white font-black rounded-full flex items-center justify-center"
                  style={{ background: C.red, fontSize: 8, minWidth: 14, height: 14 }}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </button>
          );
        })}
        <div className="flex-1" />
        <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 w-12 py-2 rounded-xl transition-all hover:opacity-80">
          <span style={{ fontSize: 17 }}>🚪</span>
          <span style={{ fontSize: 8, color: "rgba(255,150,150,0.8)", fontWeight: 600 }}>Salir</span>
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[64px] lg:ml-[220px]" style={{ background: C.bg }}>

        {/* Header */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 sticky top-0 z-10"
          style={{ background: C.white, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 shrink-0">
            {!isSuperAdmin && (
              <button onClick={() => router.back()}
                className="text-gray-400 hover:text-gray-700 text-xl mr-1 transition-colors md:hidden">←</button>
            )}
            <div>
              <p className="font-bold uppercase tracking-widest" style={{ fontSize: 10, color: C.secondary }}>
                {subtitle || "Ganadería San Jerónimo"}
              </p>
              <h1 className="font-black leading-none text-lg" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>
                {title || "Panel"}
              </h1>
            </div>
          </div>

          {searchBar && <div className="flex-1">{searchBar}</div>}

          <div className="flex items-center gap-2 ml-auto">
            {!isSuperAdmin && !esTrabajador && (
              <button onClick={() => router.push("/notificaciones")}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:bg-gray-50"
                style={{ border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 16 }}>🔔</span>
                {nuevasActividades > 0 && !enNotificaciones && (
                  <span className="absolute -top-1 -right-1 text-white font-black rounded-full flex items-center justify-center animate-bounce"
                    style={{ background: C.red, fontSize: 8, minWidth: 16, height: 16 }}>
                    {nuevasActividades > 9 ? "9+" : nuevasActividades}
                  </span>
                )}
              </button>
            )}
            {usuario && (
              <button onClick={() => router.push("/perfil")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all lg:hidden"
                style={{ border: `1px solid ${C.border}` }}>
                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-black text-sm shrink-0 text-white"
                  style={{ background: C.primary }}>
                  {fotoPerfil ? <img src={fotoPerfil} alt="" className="w-full h-full object-cover" /> : usuario.nombre?.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold hidden sm:block" style={{ fontSize: 12, color: C.text }}>{usuario.nombre}</span>
              </button>
            )}
            {rightExtra}
            <button onClick={() => setMenuOpen(s => !s)}
              className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-xl transition-all hover:bg-gray-50"
              style={{ border: `1px solid ${C.border}` }}>
              <span style={{ color: C.text, fontSize: 18 }}>{menuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </header>

        {/* Menú móvil desplegable */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMenuOpen(false)}>
            <div className="rounded-t-3xl p-5 pb-28 grid grid-cols-4 gap-3 shadow-2xl"
              style={{ background: C.white }}
              onClick={e => e.stopPropagation()}>
              <p className="col-span-4 font-bold uppercase tracking-widest mb-1" style={{ fontSize: 10, color: C.textLight }}>Todos los módulos</p>
              {navItems.map(item => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                const badge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
                const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
                return (
                  <button key={item.href} onClick={() => go(item.href)}
                    className="relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-all"
                    style={{
                      background: active ? "#EBF5EB" : "#F8F9FA",
                      border: active ? `1px solid ${C.success}40` : `1px solid ${C.border}`,
                    }}>
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                    <span style={{ fontSize: 10, color: active ? C.primary : C.textLight, fontWeight: active ? 700 : 400 }}>
                      {item.label}
                    </span>
                    {badge && (
                      <span className="absolute top-1 right-1 text-white font-black rounded-full flex items-center justify-center"
                        style={{ background: C.red, fontSize: 9, minWidth: 16, height: 16 }}>
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
              <button onClick={handleLogout}
                className="col-span-4 mt-2 py-3 rounded-2xl font-black text-white"
                style={{ background: C.red }}>
                Cerrar sesión
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
        style={{ background: C.white, borderTop: `1px solid ${C.border}`, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        {mobileItems.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const badge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
          const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
          return (
            <button key={item.href} onClick={() => go(item.href)}
              className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all"
              style={{ background: active ? "#EBF5EB" : "transparent" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: active ? C.primary : C.textLight, fontWeight: active ? 700 : 400 }}>
                {item.label}
              </span>
              {badge && (
                <span className="absolute top-0 right-3 text-white font-black rounded-full flex items-center justify-center"
                  style={{ background: C.red, fontSize: 9, minWidth: 16, height: 16 }}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </button>
          );
        })}
        <button onClick={() => setMenuOpen(s => !s)}
          className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all"
          style={{ background: menuOpen ? "#EBF5EB" : "transparent" }}>
          <span style={{ fontSize: 22 }}>☰</span>
          <span style={{ fontSize: 10, color: C.textLight }}>Más</span>
        </button>
      </nav>
    </div>
  );
}
