"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const T = {
  bg: "#F8FAFC", white: "#ffffff", text: "#172033", textSec: "#475569",
  textLight: "#94A3B8", border: "#E2E8F0",
  green: "#16a34a", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  red: "#DC2626", redBg: "#FEF2F2",
  orange: "#EA580C", orangeBg: "#FFF7ED", orangeBorder: "#FED7AA",
  blue: "#2563EB", blueBg: "#EFF6FF",
  purple: "#7C3AED", purpleBg: "#F5F3FF",
};

function fmt(v) {
  if (!v && v !== 0) return "—";
  return "C$ " + Math.round(v).toLocaleString("es-NI");
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub }) {
  return (
    <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function CrecimientoPage() {
  const [plan, setPlan]       = useState(null);
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando]       = useState(false);
  const [editando, setEditando]         = useState(false);
  const [animalDetalle, setAnimalDetalle] = useState(null);
  const [form, setForm] = useState({ precioLibra: "", precioReproductora: "", metaAnimales: "" });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, cfg] = await Promise.all([
        api("/dashboard"),
        api("/fincas/config-crecimiento"),
      ]);
      setPlan(dash.planCrecimiento || null);
      setConfig(cfg);
      setForm({
        precioLibra:        cfg.precioLibra        || 85,
        precioReproductora: cfg.precioReproductora || 29000,
        metaAnimales:       cfg.metaAnimales       || 150,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function guardarConfig() {
    setGuardando(true);
    try {
      await api("/fincas/config-crecimiento", {
        method: "PATCH",
        body: {
          precioLibra:        Number(form.precioLibra),
          precioReproductora: Number(form.precioReproductora),
          metaAnimales:       Number(form.metaAnimales),
        },
      });
      setEditando(false);
      await cargar();
    } catch (e) { alert("Error al guardar"); }
    finally { setGuardando(false); }
  }

  if (loading) return (
    <AppLayout title="Plan de Crecimiento" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      <div style={{ textAlign: "center", padding: "60px 0", color: T.textLight, fontSize: 14 }}>Cargando...</div>
    </AppLayout>
  );

  const p = plan || {};
  const progreso = p.progresoPct || 0;

  return (
    <AppLayout title="Plan de Crecimiento" subtitle="HENRIQUEZ CATTLE MANAGEMENT">

      {/* ── Barra de progreso hacia la meta ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>Progreso hacia la meta</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.text, marginTop: 4 }}>
                {p.animalesActuales || 0} <span style={{ fontSize: 16, color: T.textLight, fontWeight: 600 }}>de {p.metaAnimales || 150} cabezas</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: progreso >= 100 ? T.green : T.blue }}>{progreso}%</div>
              <div style={{ fontSize: 12, color: T.textLight }}>completado</div>
            </div>
          </div>
          {/* Barra */}
          <div style={{ background: T.border, borderRadius: 99, height: 16, overflow: "hidden" }}>
            <div style={{ width: `${progreso}%`, height: "100%", background: progreso >= 100 ? T.green : `linear-gradient(90deg, ${T.blue}, ${T.green})`, borderRadius: 99, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: T.textLight }}>Hoy: {p.animalesActuales || 0} animales</span>
            <span style={{ fontSize: 12, color: T.textLight, fontWeight: 700 }}>
              {p.animalesFaltantes > 0 ? `Faltan ${p.animalesFaltantes} animales` : "¡Meta alcanzada! 🎉"}
            </span>
          </div>
        </div>
      </Card>

      {/* ── 3 cards de resumen ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>

        {/* Novillos listos */}
        <Card>
          <div style={{ padding: "18px 18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>🐂 Novillos listos para vender</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: T.orange }}>{p.totalNovichoListos || 0}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>machos ≥400 lb o ≥18 meses</div>
            <div style={{ marginTop: 12, background: T.orangeBg, border: `1px solid ${T.orangeBorder}`, borderRadius: 10, padding: "8px 12px" }}>
              <div style={{ fontSize: 11, color: T.textSec }}>Valor total del lote</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.orange, marginTop: 2 }}>{fmt(p.valorTotalLote || 0)}</div>
              <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>a C${p.precioLibra || 85}/lb</div>
            </div>
          </div>
        </Card>

        {/* Reproductoras que puedes comprar */}
        <Card>
          <div style={{ padding: "18px 18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>🐄 Reproductoras que puedes comprar</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: T.green }}>{p.reproductrasQueCompras || 0}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>a C${(p.precioReproductora || 29000).toLocaleString("es-NI")} c/u</div>
            <div style={{ marginTop: 12, background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: "8px 12px" }}>
              <div style={{ fontSize: 11, color: T.textSec }}>Te sobra después de comprarlas</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.green, marginTop: 2 }}>{fmt(p.sobrante || 0)}</div>
            </div>
          </div>
        </Card>

        {/* Hato después de la operación */}
        <Card>
          <div style={{ padding: "18px 18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>📈 Hato después de la operación</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: T.purple }}>{p.animalesDespuesDeLote || p.animalesActuales || 0}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>animales totales</div>
            <div style={{ marginTop: 12, background: T.purpleBg, borderRadius: 10, padding: "8px 12px" }}>
              <div style={{ fontSize: 11, color: T.textSec }}>Avance hacia la meta</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.purple, marginTop: 2 }}>
                {Math.min(100, Math.round(((p.animalesDespuesDeLote || 0) / (p.metaAnimales || 150)) * 100))}%
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Lista de novillos listos ── */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title="🐂 Novillos listos para vender"
          sub={p.novichoListos?.length > 0 ? `${p.novichoListos.length} animales · C$${p.precioLibra}/lb · toca un animal para ver su ficha` : "Los machos con ≥400 lb o ≥18 meses aparecen aquí"}
        />

        {p.novichoListos?.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: T.textLight }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🐂</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>No hay novillos listos aún</div>
          </div>
        ) : (
          <>
            {/* Grid de cards con foto */}
            <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {p.novichoListos.map(a => (
                <div key={a.id} onClick={() => setAnimalDetalle(a)}
                  style={{ borderRadius: 12, border: `2px solid ${animalDetalle?.id === a.id ? T.green : T.border}`, overflow: "hidden", cursor: "pointer", background: T.white, transition: "all .15s", boxShadow: animalDetalle?.id === a.id ? `0 0 0 3px ${T.greenBorder}` : "none" }}>
                  {/* Foto */}
                  <div style={{ width: "100%", aspectRatio: "4/3", background: "#E2E8F0", overflow: "hidden", position: "relative" }}>
                    {a.foto
                      ? <img src={a.foto} alt={`Novillo #${a.identificador}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 32 }}>🐂</span>
                          <span style={{ fontSize: 10, color: T.textLight, fontWeight: 600 }}>Sin foto</span>
                        </div>
                    }
                    {/* Badge valor */}
                    <div style={{ position: "absolute", top: 8, right: 8, background: T.green, color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 800, padding: "3px 9px" }}>
                      {fmt(a.valorEstimado)}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: "10px 12px 12px" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>#{a.identificador || "—"}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{a.raza || "Sin raza"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{a.pesoActual ? `${a.pesoActual} lb` : "—"}</span>
                      <span style={{ fontSize: 11, color: T.textLight }}>Ver ficha →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total del lote */}
            <div style={{ margin: "0 16px 16px", background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: T.green }}>Total del lote ({p.novichoListos.length} animales)</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: T.green }}>{fmt(p.valorTotalLote)}</span>
            </div>
          </>
        )}
      </Card>

      {/* ── Panel lateral de detalle ── */}
      {animalDetalle && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: T.white, boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Foto grande */}
          <div style={{ width: "100%", height: 240, background: "#E2E8F0", flexShrink: 0, position: "relative" }}>
            {animalDetalle.foto
              ? <img src={animalDetalle.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🐂</div>
            }
            <button onClick={() => setAnimalDetalle(null)}
              style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
              ✕
            </button>
            <div style={{ position: "absolute", bottom: 12, left: 12, background: T.green, color: "#fff", borderRadius: 10, padding: "6px 14px" }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Valor estimado</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{fmt(animalDetalle.valorEstimado)}</div>
            </div>
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>
              #{animalDetalle.identificador || "Sin arete"}
            </div>
            {animalDetalle.nombre && (
              <div style={{ fontSize: 14, color: T.textSec, marginTop: 2 }}>{animalDetalle.nombre}</div>
            )}

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Raza",            val: animalDetalle.raza || "Sin raza" },
                { label: "Sexo",            val: "Macho" },
                { label: "Peso actual",     val: animalDetalle.pesoActual ? `${animalDetalle.pesoActual} lb` : "—" },
                { label: "Potrero",         val: animalDetalle.potrero || "—" },
                { label: "Estado reprod.",  val: animalDetalle.estadoReproductivo || "—" },
                { label: "Fecha nacimiento",val: animalDetalle.fechaNacimiento ? new Date(animalDetalle.fechaNacimiento).toLocaleDateString("es-NI") : "—" },
                { label: "Costo de compra", val: fmt(animalDetalle.costoCompra) },
                { label: "Precio de venta", val: animalDetalle.precioVenta ? fmt(animalDetalle.precioVenta) : "Sin publicar" },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 13, color: T.textSec }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Cálculo de venta */}
            <div style={{ marginTop: 20, background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: T.green, marginBottom: 10 }}>Cálculo de venta</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: T.textSec }}>Peso × C${p.precioLibra}/lb</span>
                <span style={{ fontWeight: 700 }}>{animalDetalle.pesoActual || 0} × {p.precioLibra}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, color: T.green, borderTop: `1px solid ${T.greenBorder}`, paddingTop: 8, marginTop: 4 }}>
                <span>Total estimado</span>
                <span>{fmt(animalDetalle.valorEstimado)}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: T.textSec, textAlign: "center" }}>
                Con este animal puedes comprar {Math.floor(animalDetalle.valorEstimado / (p.precioReproductora || 29000))} reproductora{Math.floor(animalDetalle.valorEstimado / (p.precioReproductora || 29000)) !== 1 ? "s" : ""}
              </div>
            </div>

            <a href={`/inventario`} style={{ display: "block", marginTop: 14, textAlign: "center", padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, color: T.textSec, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Ver ficha completa en Inventario →
            </a>
          </div>
        </div>
      )}
      {animalDetalle && (
        <div onClick={() => setAnimalDetalle(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 999 }} />
      )}

      {/* ── Configuración ── */}
      <Card>
        <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>⚙️ Configuración del plan</div>
            <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>Actualiza los precios según el mercado</div>
          </div>
          {!editando && (
            <button onClick={() => setEditando(true)}
              style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, color: T.text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Editar
            </button>
          )}
        </div>
        <div style={{ padding: "18px 18px" }}>
          {editando ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                {[
                  { label: "Meta de animales", field: "metaAnimales", prefix: "", suffix: " cabezas", placeholder: "150" },
                  { label: "Precio por libra (C$)", field: "precioLibra", prefix: "C$ ", suffix: "/lb", placeholder: "85" },
                  { label: "Precio reproductora (C$)", field: "precioReproductora", prefix: "C$ ", suffix: "", placeholder: "29,000" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: T.textSec, display: "block", marginBottom: 6 }}>{label}</label>
                    <input type="number" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditando(false)} disabled={guardando}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, fontWeight: 700, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={guardarConfig} disabled={guardando}
                  style={{ flex: 2, padding: "9px 0", borderRadius: 8, border: "none", background: T.green, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[
                { label: "Meta de animales", value: `${config?.metaAnimales || 150} cabezas` },
                { label: "Precio por libra", value: `C$ ${config?.precioLibra || 85}/lb` },
                { label: "Precio reproductora", value: fmt(config?.precioReproductora || 29000) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: T.bg, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: T.textLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

    </AppLayout>
  );
}
