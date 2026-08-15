"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function fmt(v) { if (!v && v !== 0) return "—"; return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

const cardGlass = { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(0,0,0,0.10)", borderRadius:14, padding:"16px 20px", marginBottom:16 };
const inputS = { background:"rgba(255,255,255,0.70)", border:"1px solid rgba(0,0,0,0.15)", borderRadius:8, padding:"8px 12px", fontSize:13, color:"#111", outline:"none", width:"100%" };

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function CierresPage() {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCierre, setShowCierre] = useState(false);
  const [showReabrir, setShowReabrir] = useState(null);
  const [form, setForm] = useState({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1, tipo:"MENSUAL", notas:"" });
  const [formReabrir, setFormReabrir] = useState({ motivo:"" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    setLoading(true);
    try { setPeriodos(await api("/periodos-financieros")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function cerrarPeriodo(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api("/periodos-financieros/cerrar", { method:"POST", body: form });
      setShowCierre(false);
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function reabrirPeriodo(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api(`/periodos-financieros/${showReabrir}/reabrir`, { method:"POST", body: formReabrir });
      setShowReabrir(null);
      setFormReabrir({ motivo:"" });
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  const cerrados = periodos.filter(p => p.estado === "CERRADO");
  const abiertos = periodos.filter(p => p.estado === "ABIERTO");

  return (
    <div>
      {error && <div style={{ background:"#fee2e2", color:"#dc2626", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13 }}>{error}<button onClick={()=>setError("")} style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"#dc2626" }}>✕</button></div>}

      <div style={{ ...cardGlass, background:"rgba(255,255,255,0.40)", marginBottom:20 }}>
        <div style={{ fontWeight:700, fontSize:13, color:"#374151", marginBottom:6 }}>¿Para qué sirven los cierres?</div>
        <div style={{ fontSize:12, color:"#6b7280" }}>
          Un cierre financiero guarda un snapshot del período (ingresos, gastos, flujo neto, pasivos) y bloquea modificaciones históricas.
          Los administradores pueden reabrir un período con motivo obligatorio. Cada cierre queda registrado en auditoría.
        </div>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={cardGlass}><div style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Períodos cerrados</div><div style={{ fontSize:24, fontWeight:800, color:"#111" }}>{cerrados.length}</div></div>
        <div style={cardGlass}><div style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Períodos abiertos</div><div style={{ fontSize:24, fontWeight:800, color:"#15803d" }}>{abiertos.length}</div></div>
      </div>

      <div style={{ marginBottom:16 }}>
        <button onClick={() => setShowCierre(s => !s)}
          style={{ padding:"8px 16px", borderRadius:8, background:"#1d4ed8", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          + Cerrar período
        </button>
      </div>

      {showCierre && (
        <form onSubmit={cerrarPeriodo} style={cardGlass}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:"#111" }}>Cierre de período</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Año *</label>
              <select style={inputS} value={form.anio} onChange={e=>setForm({...form,anio:parseInt(e.target.value)})}>
                {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Mes *</label>
              <select style={inputS} value={form.mes} onChange={e=>setForm({...form,mes:parseInt(e.target.value)})}>
                {MESES.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Tipo</label>
              <select style={inputS} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                <option value="MENSUAL">Mensual</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Notas</label><textarea style={{ ...inputS, resize:"vertical" }} rows={2} value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} /></div>
          </div>
          <div style={{ background:"#fef3c7", border:"1px solid #fcd34d", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#92400e", marginBottom:12 }}>
            ⚠️ El cierre calculará automáticamente ingresos, gastos y pasivos del período seleccionado y guardará un snapshot.
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button type="submit" disabled={enviando} style={{ padding:"8px 20px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:enviando?.6:1 }}>{enviando?"Cerrando...":"Cerrar período"}</button>
            <button type="button" onClick={()=>setShowCierre(false)} style={{ padding:"8px 16px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontWeight:600, cursor:"pointer", color:"#111" }}>Cancelar</button>
          </div>
        </form>
      )}

      {loading ? <div style={{ textAlign:"center", color:"rgba(255,255,255,0.7)", padding:48 }}>Cargando...</div>
        : periodos.length === 0 ? (
          <div style={{ ...cardGlass, textAlign:"center", padding:"48px 24px" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
            <div style={{ fontWeight:700, color:"#111", marginBottom:6 }}>No hay períodos registrados</div>
            <div style={{ color:"#6b7280", fontSize:13 }}>Cierra el período mensual para guardar un snapshot financiero</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {periodos.map(p => {
              const isCerrado = p.estado === "CERRADO";
              const label = `${MESES[p.mes-1] || p.mes} ${p.anio}`;
              return (
                <div key={p.id} style={{ ...cardGlass, marginBottom:0, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontWeight:700, fontSize:14, color:"#111" }}>{label}</span>
                      <span style={{ fontSize:11, fontWeight:700, background:isCerrado?"#dcfce7":"#fef3c7", color:isCerrado?"#15803d":"#92400e", padding:"2px 8px", borderRadius:20 }}>{p.estado}</span>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>{p.tipo}</span>
                    </div>
                    {isCerrado && p.ingresos !== null && (
                      <div style={{ display:"flex", gap:16, marginTop:6, fontSize:12 }}>
                        <span>Ingresos: <strong style={{ color:"#15803d" }}>{fmt(p.ingresos)}</strong></span>
                        <span>Gastos: <strong style={{ color:"#dc2626" }}>{fmt(p.gastos)}</strong></span>
                        <span>Flujo: <strong style={{ color:p.flujoNeto>=0?"#15803d":"#dc2626" }}>{fmt(p.flujoNeto)}</strong></span>
                      </div>
                    )}
                    {isCerrado && p.cerradoEn && <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>Cerrado: {new Date(p.cerradoEn).toLocaleDateString("es-NI")}</div>}
                  </div>
                  {isCerrado && (
                    <button onClick={() => setShowReabrir(p.id)}
                      style={{ padding:"6px 14px", borderRadius:8, background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.15)", fontSize:12, fontWeight:600, cursor:"pointer", color:"#374151" }}>
                      Reabrir
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Modal reabrir */}
      {showReabrir && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <form onSubmit={reabrirPeriodo} style={{ background:"rgba(255,255,255,0.92)", backdropFilter:"blur(24px)", borderRadius:16, padding:24, width:"100%", maxWidth:380 }}>
            <div style={{ fontWeight:700, fontSize:15, color:"#111", marginBottom:8 }}>Reabrir período</div>
            <div style={{ fontSize:12, color:"#6b7280", marginBottom:16 }}>Esta acción queda registrada en auditoría. Motivo obligatorio.</div>
            <textarea required style={{ ...inputS, resize:"vertical", marginBottom:12 }} rows={3} placeholder="Motivo de reapertura..." value={formReabrir.motivo} onChange={e=>setFormReabrir({motivo:e.target.value})} />
            <div style={{ display:"flex", gap:8 }}>
              <button type="submit" disabled={enviando} style={{ flex:1, padding:"10px 0", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:enviando?.6:1 }}>{enviando?"Reabriendo...":"Reabrir"}</button>
              <button type="button" onClick={()=>setShowReabrir(null)} style={{ padding:"10px 16px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontWeight:600, cursor:"pointer", color:"#111" }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
