"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function fmt(v) { if (!v && v !== 0) return "—"; return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("es-NI"); }
function diasParaVencer(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / (1000*60*60*24)); }

const cardGlass = { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(0,0,0,0.10)", borderRadius:14, padding:"16px 20px", marginBottom:16 };
const inputS = { background:"rgba(255,255,255,0.70)", border:"1px solid rgba(0,0,0,0.15)", borderRadius:8, padding:"8px 12px", fontSize:13, color:"#111", outline:"none", width:"100%" };

const ESTADO_COLOR = { ACTIVO:"#15803d", PAGADO:"#6b7280", VENCIDO:"#dc2626", REFINANCIADO:"#1d4ed8", CANCELADO:"#6b7280" };
const ESTADO_BG = { ACTIVO:"#dcfce7", PAGADO:"#f3f4f6", VENCIDO:"#fee2e2", REFINANCIADO:"#dbeafe", CANCELADO:"#f3f4f6" };

export default function DeudasPage() {
  const [prestamos, setPrestamos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPago, setShowPago] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [cuotas, setCuotas] = useState({});
  const [form, setForm] = useState({ acreedor:"", institucion:"", tipo:"COMERCIAL", referencia:"", fechaInicio:"", montoOriginal:"", moneda:"NIO", tasaInteres:"", tipoTasa:"FIJA", plazoMeses:"", cuotaMensual:"", frecuencia:"MENSUAL", proximaCuota:"", vencimiento:"", garantia:"", proposito:"", notas:"" });
  const [formPago, setFormPago] = useState({ monto:"", cuentaId:"", concepto:"" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    setLoading(true);
    try {
      const [p, r, c] = await Promise.all([
        api("/prestamos").catch(() => []),
        api("/prestamos/resumen/totales").catch(() => null),
        api("/cuentas-financieras").catch(() => []),
      ]);
      setPrestamos(Array.isArray(p) ? p : []);
      setResumen(r);
      setCuentas(c);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function verCuotas(prestamoId) {
    if (cuotas[prestamoId]) return;
    try {
      const data = await api(`/prestamos/${prestamoId}/cuotas`);
      setCuotas(prev => ({ ...prev, [prestamoId]: data }));
    } catch {}
  }

  async function crearPrestamo(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api("/prestamos", { method:"POST", body: form });
      setShowForm(false);
      setForm({ acreedor:"", institucion:"", tipo:"COMERCIAL", referencia:"", fechaInicio:"", montoOriginal:"", moneda:"NIO", tasaInteres:"", tipoTasa:"FIJA", plazoMeses:"", cuotaMensual:"", frecuencia:"MENSUAL", proximaCuota:"", vencimiento:"", garantia:"", proposito:"", notas:"" });
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function registrarPago(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api(`/prestamos/${showPago}/pago`, { method:"POST", body: formPago });
      setShowPago(null);
      setFormPago({ monto:"", cuentaId:"", concepto:"" });
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  return (
    <div>
      {error && <div style={{ background:"#fee2e2", color:"#dc2626", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13 }}>{error}<button onClick={()=>setError("")} style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"#dc2626" }}>✕</button></div>}

      {/* Resumen */}
      {resumen && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
          {[
            { label:"Préstamos activos", value:resumen.cantidad, isNum:true, color:"#111" },
            { label:"Total deuda", value:fmt(resumen.totalDeuda), color:"#dc2626" },
            { label:"Cuota mensual", value:fmt(resumen.totalCuotaMensual), color:"#92400e" },
          ].map(c => (
            <div key={c.label} style={cardGlass}>
              <div style={{ fontSize:11, color:"#6b7280", fontWeight:600, marginBottom:4 }}>{c.label}</div>
              <div style={{ fontSize:c.isNum?28:20, fontWeight:800, color:c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Próximos pagos */}
      {resumen?.proximos?.length > 0 && (
        <div style={{ ...cardGlass, borderLeft:"4px solid #f59e0b" }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#92400e", marginBottom:10 }}>⚠️ Próximos pagos</div>
          {resumen.proximos.map((p, i) => {
            const dias = diasParaVencer(p.proximaCuota);
            return (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(0,0,0,0.07)", fontSize:13 }}>
                <span style={{ color:"#111", fontWeight:600 }}>{p.acreedor}</span>
                <span style={{ color: dias !== null && dias <= 7 ? "#dc2626" : "#374151" }}>{fmtDate(p.proximaCuota)} {dias !== null ? `(${dias}d)` : ""}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginBottom:16 }}>
        <button onClick={() => setShowForm(s => !s)}
          style={{ padding:"8px 16px", borderRadius:8, background:"#16a34a", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          + Registrar préstamo
        </button>
      </div>

      {showForm && (
        <form onSubmit={crearPrestamo} style={cardGlass}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:"#111" }}>Nuevo préstamo / deuda</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Acreedor *</label><input required style={inputS} value={form.acreedor} onChange={e=>setForm({...form,acreedor:e.target.value})} placeholder="BANPRO, persona, empresa..." /></div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Institución</label><input style={inputS} value={form.institucion} onChange={e=>setForm({...form,institucion:e.target.value})} /></div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Tipo</label>
              <select style={inputS} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                {["HIPOTECARIO","PERSONAL","COMERCIAL","LINEA_CREDITO","OTRO"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Fecha inicio *</label><input required type="date" style={inputS} value={form.fechaInicio} onChange={e=>setForm({...form,fechaInicio:e.target.value})} /></div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Monto original *</label><input required type="number" min="0.01" step="0.01" style={inputS} value={form.montoOriginal} onChange={e=>setForm({...form,montoOriginal:e.target.value})} /></div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Moneda</label>
              <select style={inputS} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}>
                <option value="NIO">NIO — Córdobas</option>
                <option value="USD">USD — Dólares</option>
              </select>
            </div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Tasa interés (%)</label><input type="number" min="0" step="0.01" style={inputS} value={form.tasaInteres} onChange={e=>setForm({...form,tasaInteres:e.target.value})} /></div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Tipo tasa</label>
              <select style={inputS} value={form.tipoTasa} onChange={e=>setForm({...form,tipoTasa:e.target.value})}>
                <option value="FIJA">Fija</option><option value="VARIABLE">Variable</option>
              </select>
            </div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Plazo (meses)</label><input type="number" min="1" style={inputS} value={form.plazoMeses} onChange={e=>setForm({...form,plazoMeses:e.target.value})} /></div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Cuota mensual</label><input type="number" min="0" step="0.01" style={inputS} value={form.cuotaMensual} onChange={e=>setForm({...form,cuotaMensual:e.target.value})} /></div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Próxima cuota</label><input type="date" style={inputS} value={form.proximaCuota} onChange={e=>setForm({...form,proximaCuota:e.target.value})} /></div>
            <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Vencimiento</label><input type="date" style={inputS} value={form.vencimiento} onChange={e=>setForm({...form,vencimiento:e.target.value})} /></div>
            <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Propósito</label><input style={inputS} value={form.proposito} onChange={e=>setForm({...form,proposito:e.target.value})} placeholder="Ej: Compra de ganado reproductor" /></div>
            <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Garantía</label><input style={inputS} value={form.garantia} onChange={e=>setForm({...form,garantia:e.target.value})} /></div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button type="submit" disabled={enviando} style={{ padding:"8px 20px", background:"#16a34a", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:enviando?.6:1 }}>{enviando?"Guardando...":"Registrar"}</button>
            <button type="button" onClick={()=>setShowForm(false)} style={{ padding:"8px 16px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontWeight:600, cursor:"pointer", color:"#111" }}>Cancelar</button>
          </div>
        </form>
      )}

      {loading ? <div style={{ textAlign:"center", color:"rgba(255,255,255,0.7)", padding:48 }}>Cargando...</div>
        : prestamos.length === 0 ? (
          <div style={{ ...cardGlass, textAlign:"center", padding:"48px 24px" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>💳</div>
            <div style={{ fontWeight:700, color:"#111", marginBottom:6 }}>No hay préstamos registrados</div>
            <div style={{ color:"#6b7280", fontSize:13 }}>Registra tus deudas y préstamos para el control financiero</div>
          </div>
        ) : prestamos.map(p => {
          const pct = p.montoOriginal > 0 ? ((Number(p.montoOriginal) - Number(p.saldoActual)) / Number(p.montoOriginal)) * 100 : 0;
          const dias = diasParaVencer(p.proximaCuota);
          return (
            <div key={p.id} style={{ ...cardGlass, borderLeft:`3px solid ${ESTADO_COLOR[p.estado]||"#111"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#111" }}>{p.acreedor}</div>
                  {p.institucion && <div style={{ fontSize:12, color:"#6b7280" }}>{p.institucion} · {p.tipo}</div>}
                  {p.proposito && <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{p.proposito}</div>}
                </div>
                <span style={{ fontSize:11, fontWeight:700, background:ESTADO_BG[p.estado]||"#f3f4f6", color:ESTADO_COLOR[p.estado]||"#111", padding:"3px 10px", borderRadius:20 }}>{p.estado}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
                <div><div style={{ fontSize:10, color:"#6b7280", fontWeight:600 }}>Monto original</div><div style={{ fontSize:14, fontWeight:700, color:"#374151" }}>{fmt(p.montoOriginal)}</div></div>
                <div><div style={{ fontSize:10, color:"#6b7280", fontWeight:600 }}>Saldo actual</div><div style={{ fontSize:14, fontWeight:700, color:"#dc2626" }}>{fmt(p.saldoActual)}</div></div>
                <div><div style={{ fontSize:10, color:"#6b7280", fontWeight:600 }}>Cuota</div><div style={{ fontSize:14, fontWeight:700, color:"#92400e" }}>{fmt(p.cuotaMensual)||"—"}</div></div>
              </div>
              {/* Barra de progreso */}
              <div style={{ background:"rgba(0,0,0,0.08)", borderRadius:4, height:6, marginBottom:8 }}>
                <div style={{ background:"#16a34a", borderRadius:4, height:6, width:`${Math.min(pct,100)}%`, transition:"width .3s" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#6b7280", marginBottom:10 }}>
                <span>Pagado: {pct.toFixed(1)}%</span>
                {p.proximaCuota && <span style={{ color: dias !== null && dias <= 7 ? "#dc2626" : "#374151" }}>Próx. cuota: {fmtDate(p.proximaCuota)}{dias !== null ? ` (${dias}d)` : ""}</span>}
                {p.tasaInteres && <span>Tasa: {Number(p.tasaInteres).toFixed(2)}%</span>}
              </div>
              {p.estado === "ACTIVO" && (
                <button onClick={() => setShowPago(p.id)}
                  style={{ padding:"7px 16px", borderRadius:8, background:"#1d4ed8", color:"#fff", border:"none", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                  Registrar pago
                </button>
              )}
            </div>
          );
        })}

      {/* Modal pago */}
      {showPago && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <form onSubmit={registrarPago} style={{ background:"rgba(255,255,255,0.92)", backdropFilter:"blur(24px)", borderRadius:16, padding:24, width:"100%", maxWidth:380 }}>
            <div style={{ fontWeight:700, fontSize:15, color:"#111", marginBottom:16 }}>Registrar pago de préstamo</div>
            <div style={{ display:"grid", gap:10 }}>
              <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Monto pagado *</label><input required type="number" min="0.01" step="0.01" style={inputS} value={formPago.monto} onChange={e=>setFormPago({...formPago,monto:e.target.value})} /></div>
              {cuentas.length > 0 && (
                <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Cuenta de egreso</label>
                  <select style={inputS} value={formPago.cuentaId} onChange={e=>setFormPago({...formPago,cuentaId:e.target.value})}>
                    <option value="">Sin cuenta específica</option>
                    {cuentas.map(c=><option key={c.id} value={c.id}>{c.nombre} ({fmt(c.saldoActual)})</option>)}
                  </select>
                </div>
              )}
              <div><label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Concepto</label><input style={inputS} value={formPago.concepto} onChange={e=>setFormPago({...formPago,concepto:e.target.value})} /></div>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:16 }}>
              <button type="submit" disabled={enviando} style={{ flex:1, padding:"10px 0", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:enviando?.6:1 }}>{enviando?"Guardando...":"Registrar pago"}</button>
              <button type="button" onClick={()=>setShowPago(null)} style={{ padding:"10px 16px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontWeight:600, cursor:"pointer", color:"#111" }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
