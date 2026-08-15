"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function fmt(v) {
  if (!v && v !== 0) return "—";
  return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const cardGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 14,
  padding: "16px 20px",
  marginBottom: 16,
};
const inputS = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  color: "#111",
  outline: "none",
  width: "100%",
};

const CATEGORIAS = ["TERRENO","VEHICULO","MAQUINARIA","INFRAESTRUCTURA","EQUIPO","SISTEMA_SOLAR","CORRAL","BODEGA","HERRAMIENTA","OTRO"];
const CAT_EMOJI = { TERRENO:"🌍", VEHICULO:"🚜", MAQUINARIA:"⚙️", INFRAESTRUCTURA:"🏗️", EQUIPO:"🔧", SISTEMA_SOLAR:"☀️", CORRAL:"🐄", BODEGA:"🏠", HERRAMIENTA:"🔨", OTRO:"📦" };

export default function ActivosPage() {
  const [tab, setTab] = useState("fijos");
  const [activos, setActivos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [animales, setAnimales] = useState([]);
  const [finca, setFinca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre:"", categoria:"TERRENO", descripcion:"", fechaAdquisicion:"", costoAdquisicion:"", monedaAdquisicion:"NIO", valorActual:"", metodoValoracion:"COSTO_HISTORICO", ubicacion:"", proveedor:"", numeroDocumento:"", notas:"" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    setLoading(true);
    try {
      const [a, r, anim, f] = await Promise.all([
        api("/activos-fijos").catch(() => []),
        api("/activos-fijos/resumen/totales").catch(() => null),
        api("/animales").catch(() => []),
        api("/fincas/mi-finca").catch(() => null),
      ]);
      setActivos(Array.isArray(a) ? a : []);
      setResumen(r);
      setAnimales(Array.isArray(anim) ? anim.filter(x => x.estado === "ACTIVO") : []);
      setFinca(f);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function crearActivo(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api("/activos-fijos", { method: "POST", body: form });
      setShowForm(false);
      setForm({ nombre:"", categoria:"TERRENO", descripcion:"", fechaAdquisicion:"", costoAdquisicion:"", monedaAdquisicion:"NIO", valorActual:"", metodoValoracion:"COSTO_HISTORICO", ubicacion:"", proveedor:"", numeroDocumento:"", notas:"" });
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  // Valor del hato
  const precioLibra = finca?.precioLibra || 85;
  const valorHato = animales.reduce((s, a) => {
    if (a.pesoActual) return s + (a.pesoActual * precioLibra);
    return s + (a.costoCompra || 0);
  }, 0);
  const costoHato = animales.reduce((s, a) => s + (a.costoCompra || 0), 0);

  // Distribución por categoría ganado
  const catGanado = {};
  animales.forEach(a => {
    const cat = a.sexo === "MACHO" ? (a.nombre?.toLowerCase().includes("toro") ? "Toro" : a.pesoActual > 300 ? "Novillo" : "Ternero")
      : (a.estadoReproductivo ? "Vaca reproductora" : a.pesoActual > 200 ? "Novilla" : "Ternera");
    if (!catGanado[cat]) catGanado[cat] = { cantidad: 0, valor: 0 };
    catGanado[cat].cantidad++;
    catGanado[cat].valor += a.pesoActual ? a.pesoActual * precioLibra : (a.costoCompra || 0);
  });

  return (
    <div>
      {error && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Resumen totales */}
      {resumen && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Activos fijos", value: fmt(resumen.totalValor), sub: `${resumen.total} registros`, color: "#1d4ed8" },
            { label: "Activos biológicos", value: fmt(valorHato), sub: `${animales.length} animales (est.)`, color: "#15803d" },
            { label: "Total activos", value: fmt((resumen.totalValor||0) + valorHato), color: "#111" },
          ].map(c => (
            <div key={c.label} style={cardGlass}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
              {c.sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Tabs Fijos / Biológicos */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[{key:"fijos",label:"Activos Fijos"},{key:"biologicos",label:"Activos Biológicos (Ganado)"}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${tab===t.key?"rgba(0,0,0,0.25)":"rgba(0,0,0,0.10)"}`, background:tab===t.key?"rgba(255,255,255,0.75)":"rgba(255,255,255,0.35)", color:"#111", fontWeight:tab===t.key?700:500, fontSize:13, cursor:"pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "fijos" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setShowForm(s => !s)}
              style={{ padding: "8px 16px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              + Registrar activo
            </button>
          </div>

          {showForm && (
            <form onSubmit={crearActivo} style={{ ...cardGlass }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#111" }}>Nuevo Activo Fijo</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Nombre *</label><input required style={inputS} value={form.nombre} onChange={e => setForm({...form,nombre:e.target.value})} /></div>
                <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Categoría *</label>
                  <select required style={inputS} value={form.categoria} onChange={e => setForm({...form,categoria:e.target.value})}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Fecha adquisición</label><input type="date" style={inputS} value={form.fechaAdquisicion} onChange={e => setForm({...form,fechaAdquisicion:e.target.value})} /></div>
                <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Costo adquisición (C$)</label><input type="number" min="0" step="0.01" style={inputS} value={form.costoAdquisicion} onChange={e => setForm({...form,costoAdquisicion:e.target.value})} /></div>
                <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Valor actual (C$)</label><input type="number" min="0" step="0.01" style={inputS} value={form.valorActual} onChange={e => setForm({...form,valorActual:e.target.value})} placeholder="Si difiere del costo" /></div>
                <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Método valoración</label>
                  <select style={inputS} value={form.metodoValoracion} onChange={e => setForm({...form,metodoValoracion:e.target.value})}>
                    <option value="COSTO_HISTORICO">Costo histórico</option>
                    <option value="VALOR_MERCADO">Valor de mercado</option>
                    <option value="PERICIAL">Avalúo pericial</option>
                  </select>
                </div>
                <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Ubicación</label><input style={inputS} value={form.ubicacion} onChange={e => setForm({...form,ubicacion:e.target.value})} /></div>
                <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>No. Documento</label><input style={inputS} value={form.numeroDocumento} onChange={e => setForm({...form,numeroDocumento:e.target.value})} /></div>
                <div className="col-span-2" style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Descripción</label><textarea style={{ ...inputS, resize: "vertical" }} rows={2} value={form.descripcion} onChange={e => setForm({...form,descripcion:e.target.value})} /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={enviando} style={{ padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{enviando?"Guardando...":"Registrar"}</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.60)", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#111" }}>Cancelar</button>
              </div>
            </form>
          )}

          {loading ? <div style={{ textAlign:"center", color:"rgba(255,255,255,0.7)", padding:48 }}>Cargando...</div>
            : activos.length === 0 ? (
              <div style={{ ...cardGlass, textAlign:"center", padding:"48px 24px" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🏗️</div>
                <div style={{ fontWeight:700, color:"#111", marginBottom:6 }}>No hay activos registrados</div>
                <div style={{ color:"#6b7280", fontSize:13 }}>Registra terrenos, vehículos, maquinaria e infraestructura</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                {activos.map(a => (
                  <div key={a.id} style={{ ...cardGlass, marginBottom:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div><span style={{ fontSize:20 }}>{CAT_EMOJI[a.categoria]||"📦"}</span></div>
                      <span style={{ fontSize:10, fontWeight:700, background:"#dbeafe", color:"#1d4ed8", padding:"2px 8px", borderRadius:20 }}>{a.categoria}</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:4 }}>{a.nombre}</div>
                    {a.ubicacion && <div style={{ fontSize:11, color:"#6b7280", marginBottom:6 }}>📍 {a.ubicacion}</div>}
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#374151", marginBottom:4 }}>
                      <span>Costo: {fmt(a.costoAdquisicion)}</span>
                      <span style={{ fontWeight:700 }}>Valor: {fmt(a.valorActual || a.costoAdquisicion)}</span>
                    </div>
                    {a.fechaAdquisicion && <div style={{ fontSize:11, color:"#9ca3af" }}>Adquirido: {new Date(a.fechaAdquisicion).toLocaleDateString("es-NI")}</div>}
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {tab === "biologicos" && (
        <>
          <div style={{ ...cardGlass, borderLeft: "4px solid #f59e0b", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, marginBottom: 6 }}>NOTA IMPORTANTE</div>
            <div style={{ fontSize: 12, color: "#374151" }}>
              Los valores mostrados son <strong>estimaciones</strong> calculadas a partir del peso y precio de referencia por libra configurado en la finca.
              No representan un avalúo profesional. Se diferencia entre <strong>costo histórico</strong> (lo que se pagó) y <strong>valor estimado actual</strong> (estimación basada en peso × precio/lb).
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
            <div style={cardGlass}><div style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Animales activos</div><div style={{ fontSize:22, fontWeight:800, color:"#111" }}>{animales.length}</div></div>
            <div style={cardGlass}><div style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Costo histórico</div><div style={{ fontSize:18, fontWeight:800, color:"#374151" }}>{fmt(costoHato)}</div><div style={{ fontSize:10, color:"#9ca3af" }}>Lo que se pagó</div></div>
            <div style={cardGlass}><div style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Valor estimado</div><div style={{ fontSize:18, fontWeight:800, color:"#15803d" }}>{fmt(valorHato)}</div><div style={{ fontSize:10, color:"#9ca3af" }}>Peso × C${precioLibra}/lb</div></div>
            <div style={cardGlass}><div style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Variación estimada</div><div style={{ fontSize:18, fontWeight:800, color: valorHato-costoHato >= 0 ? "#15803d" : "#dc2626" }}>{fmt(valorHato - costoHato)}</div><div style={{ fontSize:10, color:"#9ca3af" }}>No realizada</div></div>
          </div>

          <div style={cardGlass}>
            <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:14 }}>Distribución del hato por categoría</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"rgba(0,0,0,0.05)", borderBottom:"1px solid rgba(0,0,0,0.10)" }}>
                    <th style={{ textAlign:"left", padding:"8px 12px", color:"#374151", fontWeight:600, fontSize:11 }}>Categoría</th>
                    <th style={{ textAlign:"right", padding:"8px 12px", color:"#374151", fontWeight:600, fontSize:11 }}>Cantidad</th>
                    <th style={{ textAlign:"right", padding:"8px 12px", color:"#374151", fontWeight:600, fontSize:11 }}>Valor estimado</th>
                    <th style={{ textAlign:"right", padding:"8px 12px", color:"#374151", fontWeight:600, fontSize:11 }}>% del hato</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(catGanado).sort((a,b) => b[1].valor - a[1].valor).map(([cat, d]) => (
                    <tr key={cat} style={{ borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
                      <td style={{ padding:"8px 12px", color:"#111", fontWeight:600 }}>{cat}</td>
                      <td style={{ padding:"8px 12px", color:"#374151", textAlign:"right" }}>{d.cantidad}</td>
                      <td style={{ padding:"8px 12px", color:"#111", fontWeight:700, textAlign:"right" }}>{fmt(d.valor)}</td>
                      <td style={{ padding:"8px 12px", color:"#6b7280", textAlign:"right" }}>{valorHato > 0 ? ((d.valor/valorHato)*100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                  <tr style={{ background:"rgba(0,0,0,0.04)", fontWeight:800 }}>
                    <td style={{ padding:"8px 12px", color:"#111" }}>Total</td>
                    <td style={{ padding:"8px 12px", color:"#111", textAlign:"right" }}>{animales.length}</td>
                    <td style={{ padding:"8px 12px", color:"#15803d", textAlign:"right" }}>{fmt(valorHato)}</td>
                    <td style={{ padding:"8px 12px", color:"#111", textAlign:"right" }}>100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:12, fontSize:11, color:"#9ca3af" }}>
              * Valor estimado calculado con C${precioLibra}/lb de referencia. No representa avalúo oficial.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
