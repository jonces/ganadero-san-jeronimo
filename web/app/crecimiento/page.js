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
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando]   = useState(false);
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
      {p.novichoListos?.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader title="Novillos listos para vender" sub={`${p.novichoListos.length} animales identificados · precio C$${p.precioLibra}/lb`} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["Arete", "Nombre", "Raza", "Peso (lb)", "Valor estimado"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700, color: T.textSec, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.novichoListos.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.white : T.bg }}>
                    <td style={{ padding: "10px 16px", fontWeight: 800, color: T.text }}>#{a.identificador || "—"}</td>
                    <td style={{ padding: "10px 16px", color: T.textSec }}>{a.nombre || "Sin nombre"}</td>
                    <td style={{ padding: "10px 16px", color: T.textSec }}>{a.raza || "Sin raza"}</td>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: T.text }}>{a.pesoActual ? `${a.pesoActual} lb` : "—"}</td>
                    <td style={{ padding: "10px 16px", fontWeight: 800, color: T.green }}>{fmt(a.valorEstimado)}</td>
                  </tr>
                ))}
                <tr style={{ background: T.greenBg, borderTop: `2px solid ${T.greenBorder}` }}>
                  <td colSpan={4} style={{ padding: "10px 16px", fontWeight: 800, color: T.green, textAlign: "right" }}>TOTAL DEL LOTE</td>
                  <td style={{ padding: "10px 16px", fontWeight: 900, color: T.green, fontSize: 15 }}>{fmt(p.valorTotalLote)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {p.novichoListos?.length === 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ padding: "40px 24px", textAlign: "center", color: T.textLight }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🐂</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>No hay novillos listos aún</div>
            <div style={{ fontSize: 13 }}>Los machos con ≥400 lb o ≥18 meses aparecerán aquí automáticamente</div>
          </div>
        </Card>
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
