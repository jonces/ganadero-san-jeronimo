"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, api, getUsuario } from "@/lib/api";

// ── Paleta oficial del sistema ──
const C = {
  primary:   "#4ade80",
  secondary: "#22c55e",
  success:   "#16a34a",
  sidebar:   "rgba(4,14,8,0.80)",
  sidebarHov:"rgba(255,255,255,0.07)",
  bg:        "transparent",
  white:     "rgba(8,20,14,0.62)",
  text:      "#ffffff",
  textLight: "rgba(255,255,255,0.50)",
  border:    "rgba(255,255,255,0.10)",
  red:       "#f87171",
};

// Cargos con acceso limitado (solo campo/operativo)
const CARGOS_CAMPO = ["TRABAJADOR_CAMPO", "VAQUERO"];

// Rutas bloqueadas para trabajadores de campo y vaqueros
const RUTAS_SOLO_ADMIN = [
  "/ventas", "/finanzas", "/compras", "/proveedores",
  "/cuentas-pagar", "/equipo", "/reportes", "/documentos", "/crecimiento", "/actividad",
  "/gastos/nomina",
];

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { icon: "⊞",  label: "Dashboard",   href: "/dashboard" },
    ],
  },
  {
    label: "GANADERÍA",
    items: [
      { icon: "🐄", label: "Animales",      href: "/inventario" },
      { icon: "🤰", label: "Reproducción",  href: "/reproduccion" },
      { icon: "📋", label: "Eventos",       href: "/eventos" },
      { icon: "🚨", label: "Salud",         href: "/incidentes" },
    ],
  },
  {
    label: "COMERCIAL",
    items: [
      { icon: "💰", label: "Ventas",        href: "/ventas", badge: "Nuevo" },
      { icon: "🛒", label: "Compras",       href: "/compras" },
      { icon: "🏭", label: "Proveedores",   href: "/proveedores" },
    ],
  },
  {
    label: "FINANZAS",
    items: [
      { icon: "💸", label: "Gastos",        href: "/gastos" },
      { icon: "💳", label: "Finanzas",      href: "/finanzas" },
      { icon: "📑", label: "Cuentas x pagar", href: "/cuentas-pagar" },
    ],
  },
  {
    label: "GESTIÓN",
    items: [
      { icon: "📦", label: "Insumos",           href: "/insumos" },
      { icon: "👥", label: "Personal",           href: "/equipo" },
      { icon: "📄", label: "Documentos",         href: "/documentos" },
      { icon: "📢", label: "Tablón",             href: "/anuncios", notif: true },
      { icon: "🕐", label: "Actividad",          href: "/actividad", notifActividad: true },
      { icon: "📊", label: "Reportes",           href: "/reportes" },
    ],
  },
  {
    label: "ANÁLISIS",
    items: [
      { icon: "📈", label: "Plan de Crecimiento", href: "/crecimiento" },
      { icon: "🤖", label: "Centro IA",           href: "/ia", badge: "Beta" },
    ],
  },
];

const NAV_ITEMS_ADMIN = NAV_GROUPS.flatMap(g => g.items);

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
  const esCampo = CARGOS_CAMPO.includes(usuario?.cargo);
  const navItemsBase = isSuperAdmin ? NAV_ITEMS_SUPER : NAV_ITEMS_ADMIN;
  const navItems = esCampo
    ? navItemsBase.filter(i => !RUTAS_SOLO_ADMIN.some(r => i.href.startsWith(r)))
    : esTrabajador
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

  // Bloquear acceso a rutas restringidas para trabajadores de campo y vaqueros
  const rutaBloqueada = esCampo && RUTAS_SOLO_ADMIN.some(r => pathname?.startsWith(r));
  if (rutaBloqueada) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.28),rgba(0,0,0,0.28)), url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2560&q=80)", backgroundSize:"cover", backgroundPosition:"center", backgroundColor:"#0a1a0d" }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center shadow-xl" style={{ background: "rgba(10,20,30,0.28)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="font-black text-2xl mb-2" style={{ color: "#fff" }}>Acceso restringido</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            No tienes permiso para ver esta sección. Contacta a tu administrador o gerente si necesitas acceso.
          </p>
          <button onClick={() => router.push("/dashboard")}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: C.primary, color: "#FFF" }}>
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen flex" style={{
      backgroundImage: "linear-gradient(rgba(0,0,0,0.12),rgba(0,0,0,0.12)), url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2560&q=80)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      backgroundColor: "#0a1a0d",
    }}>

      {/* ── SIDEBAR DESKTOP (lg+) ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full z-20 flex-col overflow-hidden"
        style={{ width: 228, background: "rgba(10,20,30,0.28)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,.18)", boxShadow: "0 10px 40px rgba(0,0,0,.35)" }}>

        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🐂</div>
            <div>
              <p style={{ color: "#fff", fontWeight: 900, fontSize: 13, letterSpacing: 1, margin: 0, fontFamily: "var(--font-poppins)" }}>HENRIQUEZ</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 8.5, letterSpacing: 1.5, margin: 0, marginTop: 1 }}>CATTLE MANAGEMENT</p>
            </div>
          </div>
        </div>

        {/* Nav con grupos */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px", scrollbarWidth: "none" }}>
          {(isSuperAdmin ? [{ label: null, items: NAV_ITEMS_SUPER }] : NAV_GROUPS).map((group, gi) => {
            const groupItems = esCampo
              ? group.items.filter(i => !RUTAS_SOLO_ADMIN.some(r => i.href.startsWith(r)))
              : esTrabajador
                ? group.items.filter(i => i.href !== "/equipo" && i.href !== "/actividad" && i.href !== "/reportes")
                : group.items;
            if (groupItems.length === 0) return null;
            return (
              <div key={gi} style={{ marginBottom: 4 }}>
                {group.label && (
                  <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, padding: "10px 10px 4px", margin: 0 }}>
                    {group.label}
                  </p>
                )}
                {groupItems.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && !item.href.includes("?") && pathname?.startsWith(item.href));
                  const notifBadge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
                  const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
                  return (
                    <button key={item.href} onClick={() => go(item.href)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 10, border: "none", cursor: "pointer",
                        background: active ? "rgba(255,255,255,0.14)" : "transparent",
                        marginBottom: 1, position: "relative", textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Indicador activo izquierdo */}
                      {active && (
                        <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: "0 3px 3px 0", background: "#4ade80" }} />
                      )}
                      {/* Ícono */}
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: active ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                        filter: active ? "drop-shadow(0 0 5px rgba(74,222,128,0.7))" : "none",
                      }}>
                        {item.icon}
                      </div>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? "#fff" : "rgba(255,255,255,0.68)", fontFamily: "var(--font-inter)" }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: item.badge === "Beta" ? "#7C3AED" : "#16a34a", borderRadius: 20, padding: "2px 6px" }}>
                          {item.badge}
                        </span>
                      )}
                      {notifBadge && (
                        <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Usuario */}
        {usuario && (
          <div style={{ padding: "12px 10px 14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => go("/perfil")}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", marginBottom: 8, textAlign: "left" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14, border: "2px solid rgba(255,255,255,0.3)" }}>
                {fotoPerfil ? <img src={fotoPerfil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : usuario.nombre?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 12, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario.nombre}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                  <p style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: 10, margin: 0 }}>
                    {usuario.role === "ADMIN" ? "Administrador" : usuario.role === "SUPER_ADMIN" ? "Super Admin" : "Trabajador"}
                  </p>
                </div>
              </div>
            </button>
            <button onClick={handleLogout}
              style={{ width: "100%", padding: "9px 0", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer", background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              Cerrar sesión →
            </button>
          </div>
        )}
      </aside>

      {/* ── SIDEBAR TABLET (md) — iconos ── */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 h-full z-20 flex-col items-center py-4 gap-0.5"
        style={{ width: 64, background: "rgba(10,20,30,0.28)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,.18)", boxShadow: "0 10px 40px rgba(0,0,0,.35)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 shadow-lg"
          style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>🐂</div>
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && !item.href.includes("?") && pathname?.startsWith(item.href));
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
      <div className="flex-1 flex flex-col min-h-screen md:ml-[64px] lg:ml-[228px]" style={{ background: "transparent" }}>

        {/* Header */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 sticky top-0 z-10"
          style={{ background: "rgba(10,20,30,0.28)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.18)", boxShadow: "0 10px 40px rgba(0,0,0,.35)" }}>
          <div className="flex items-center gap-2 shrink-0">
            {!isSuperAdmin && (
              <button onClick={() => router.back()}
                className="text-gray-400 hover:text-gray-700 text-xl mr-1 transition-colors md:hidden">←</button>
            )}
            <div>
              <p className="font-bold uppercase tracking-widest" style={{ fontSize: 10, color: "#4ade80" }}>
                {subtitle || "Ganadería San Jerónimo"}
              </p>
              <h1 className="font-black leading-none text-lg" style={{ color: "#fff", fontFamily: "var(--font-poppins)" }}>
                {title || "Panel"}
              </h1>
            </div>
          </div>

          {searchBar && <div className="flex-1">{searchBar}</div>}

          <div className="flex items-center gap-2 ml-auto">
            {!isSuperAdmin && !esTrabajador && (
              <button onClick={() => router.push("/notificaciones")}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                style={{ border: "1px solid rgba(255,255,255,.18)", background: "rgba(10,20,30,0.28)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all lg:hidden"
                style={{ border: "1px solid rgba(255,255,255,.18)", background: "rgba(10,20,30,0.28)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-black text-sm shrink-0 text-white"
                  style={{ background: C.success }}>
                  {fotoPerfil ? <img src={fotoPerfil} alt="" className="w-full h-full object-cover" /> : usuario.nombre?.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold hidden sm:block" style={{ fontSize: 12, color: "#fff" }}>{usuario.nombre}</span>
              </button>
            )}
            {rightExtra}
            <button onClick={() => setMenuOpen(s => !s)}
              className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={{ border: "1px solid rgba(255,255,255,.18)", background: "rgba(10,20,30,0.28)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
              <span style={{ color: "#fff", fontSize: 18 }}>{menuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </header>

        {/* Menú móvil desplegable */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMenuOpen(false)}>
            <div className="rounded-t-3xl p-5 pb-28 grid grid-cols-4 gap-3 shadow-2xl"
              style={{ background: "rgba(10,20,30,0.28)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,.18)" }}
              onClick={e => e.stopPropagation()}>
              <p className="col-span-4 font-bold uppercase tracking-widest mb-1" style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>Todos los módulos</p>
              {navItems.map(item => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                const badge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
                const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
                return (
                  <button key={item.href} onClick={() => go(item.href)}
                    className="relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-all"
                    style={{
                      background: active ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                      border: active ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.10)",
                    }}>
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                    <span style={{ fontSize: 10, color: active ? "#4ade80" : "rgba(255,255,255,0.55)", fontWeight: active ? 700 : 400 }}>
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
        style={{ background: "rgba(10,20,30,0.28)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,.18)", boxShadow: "0 10px 40px rgba(0,0,0,.35)" }}>
        {mobileItems.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const badge = (item.notif && nuevos > 0 && !active) || (item.notifActividad && nuevasActividades > 0 && !active);
          const badgeCount = item.notifActividad ? nuevasActividades : nuevos;
          return (
            <button key={item.href} onClick={() => go(item.href)}
              className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all"
              style={{ background: active ? "rgba(74,222,128,0.12)" : "transparent" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: active ? "#4ade80" : "rgba(255,255,255,0.50)", fontWeight: active ? 700 : 400 }}>
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
          style={{ background: menuOpen ? "rgba(74,222,128,0.12)" : "transparent" }}>
          <span style={{ fontSize: 22 }}>☰</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.50)" }}>Más</span>
        </button>
      </nav>
    </div>
  );
}
