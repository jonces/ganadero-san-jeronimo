"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function fmt(v) {
  if (v === null || v === undefined) return "—";
  return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const TIPOS = ["CAJA", "CAJA_CHICA", "BANCO"];
const TIPO_LABEL = { CAJA: "Caja general", CAJA_CHICA: "Caja chica", BANCO: "Banco" };
const TIPO_COLOR = { CAJA: "#15803d", CAJA_CHICA: "#92400e", BANCO: "#1d4ed8" };

export default function CajaBancosPage() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState(null); // cuentaId
  const [form, setForm] = useState({ nombre: "", tipo: "CAJA", banco: "", moneda: "NIO", ultimosCuatro: "", saldoInicial: "", notas: "" });
  const [formTransf, setFormTransf] = useState({ cuentaOrigenId: "", cuentaDestinoId: "", monto: "", moneda: "NIO", concepto: "" });
  const [formMov, setFormMov] = useState({ tipo: "INGRESO", categoria: "", concepto: "", monto: "", moneda: "NIO", referencia: "", observaciones: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    setLoading(true);
    try { setCuentas(await api("/cuentas-financieras")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function crearCuenta(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api("/cuentas-financieras", { method: "POST", body: form });
      setShowForm(false);
      setForm({ nombre: "", tipo: "CAJA", banco: "", moneda: "NIO", ultimosCuatro: "", saldoInicial: "", notas: "" });
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function crearTransferencia(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api("/cuentas-financieras/transferencia", { method: "POST", body: formTransf });
      setShowTransferencia(false);
      setFormTransf({ cuentaOrigenId: "", cuentaDestinoId: "", monto: "", moneda: "NIO", concepto: "" });
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function registrarMovimiento(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api("/movimientos-financieros", { method: "POST", body: { ...formMov, cuentaId: showMovimiento } });
      setShowMovimiento(null);
      setFormMov({ tipo: "INGRESO", categoria: "", concepto: "", monto: "", moneda: "NIO", referencia: "", observaciones: "" });
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  const totalCaja = cuentas.filter(c => c.tipo !== "BANCO").reduce((s, c) => s + Number(c.saldoActual), 0);
  const totalBanco = cuentas.filter(c => c.tipo === "BANCO").reduce((s, c) => s + Number(c.saldoActual), 0);

  return (
    <div>
      {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{error}<button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>✕</button></div>}

      {/* Resumen total */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Cajas", value: fmt(totalCaja), color: "#15803d" },
          { label: "Total Bancos", value: fmt(totalBanco), color: "#1d4ed8" },
          { label: "Total disponible", value: fmt(totalCaja + totalBanco), color: "#111" },
        ].map(c => (
          <div key={c.label} style={cardGlass}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setShowForm(s => !s)}
          style={{ padding: "8px 16px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Nueva cuenta/caja
        </button>
        {cuentas.length >= 2 && (
          <button onClick={() => setShowTransferencia(s => !s)}
            style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.60)", color: "#111", border: "1px solid rgba(0,0,0,0.15)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ⇄ Transferencia interna
          </button>
        )}
      </div>

      {/* Form nueva cuenta */}
      {showForm && (
        <form onSubmit={crearCuenta} style={{ ...cardGlass, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#111" }}>Nueva cuenta o caja</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Nombre *</label><input required style={inputS} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Caja finca, BANPRO CTA" /></div>
            <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Tipo *</label>
              <select style={inputS} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </div>
            {form.tipo === "BANCO" && <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Banco</label><input style={inputS} value={form.banco} onChange={e => setForm({ ...form, banco: e.target.value })} placeholder="BANPRO, LAFISE, BAC..." /></div>}
            {form.tipo === "BANCO" && <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Últimos 4 dígitos (opcional)</label><input style={inputS} maxLength={4} value={form.ultimosCuatro} onChange={e => setForm({ ...form, ultimosCuatro: e.target.value })} placeholder="••••" /></div>}
            <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Moneda</label>
              <select style={inputS} value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
                <option value="NIO">NIO — Córdobas</option>
                <option value="USD">USD — Dólares</option>
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Saldo inicial</label><input type="number" min="0" step="0.01" style={inputS} value={form.saldoInicial} onChange={e => setForm({ ...form, saldoInicial: e.target.value })} placeholder="0" /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={enviando} style={{ padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: enviando ? 0.6 : 1 }}>{enviando ? "Guardando..." : "Crear"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.60)", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#111" }}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Form transferencia */}
      {showTransferencia && (
        <form onSubmit={crearTransferencia} style={{ ...cardGlass, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#111" }}>⇄ Transferencia interna — no afecta ingresos ni gastos</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Cuenta origen *</label>
              <select required style={inputS} value={formTransf.cuentaOrigenId} onChange={e => setFormTransf({ ...formTransf, cuentaOrigenId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({fmt(c.saldoActual)})</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Cuenta destino *</label>
              <select required style={inputS} value={formTransf.cuentaDestinoId} onChange={e => setFormTransf({ ...formTransf, cuentaDestinoId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {cuentas.filter(c => c.id !== formTransf.cuentaOrigenId).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Monto *</label><input required type="number" min="0.01" step="0.01" style={inputS} value={formTransf.monto} onChange={e => setFormTransf({ ...formTransf, monto: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Concepto</label><input style={inputS} value={formTransf.concepto} onChange={e => setFormTransf({ ...formTransf, concepto: e.target.value })} placeholder="Ej: Depósito semanal" /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={enviando} style={{ padding: "8px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: enviando ? 0.6 : 1 }}>{enviando ? "Transfiriendo..." : "Transferir"}</button>
            <button type="button" onClick={() => setShowTransferencia(false)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.60)", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#111" }}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista de cuentas */}
      {loading ? (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: 48 }}>Cargando...</div>
      ) : cuentas.length === 0 ? (
        <div style={{ ...cardGlass, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏦</div>
          <div style={{ fontWeight: 700, color: "#111", marginBottom: 6 }}>No hay cuentas registradas</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Agrega una caja o cuenta bancaria para comenzar</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {cuentas.map(c => (
            <div key={c.id} style={{ ...cardGlass, marginBottom: 0, borderTop: `3px solid ${TIPO_COLOR[c.tipo] || "#111"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{c.nombre}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {TIPO_LABEL[c.tipo]}{c.banco ? ` · ${c.banco}` : ""}{c.ultimosCuatro ? ` ····${c.ultimosCuatro}` : ""}
                  </div>
                </div>
                <span style={{ background: c.estado === "ACTIVA" ? "#dcfce7" : "#f3f4f6", color: c.estado === "ACTIVA" ? "#15803d" : "#6b7280", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{c.estado}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Saldo actual</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: Number(c.saldoActual) >= 0 ? "#111" : "#dc2626" }}>{fmt(c.saldoActual)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Saldo inicial: {fmt(c.saldoInicial)} · {c.moneda}</div>
              </div>
              <button onClick={() => setShowMovimiento(c.id)}
                style={{ width: "100%", padding: "7px 0", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", color: "#111" }}>
                + Registrar movimiento
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal movimiento */}
      {showMovimiento && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <form onSubmit={registrarMovimiento} style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 16 }}>Registrar movimiento</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Tipo *</label>
                <select required style={inputS} value={formMov.tipo} onChange={e => setFormMov({ ...formMov, tipo: e.target.value })}>
                  <option value="INGRESO">Ingreso</option>
                  <option value="EGRESO">Egreso</option>
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Concepto *</label><input required style={inputS} value={formMov.concepto} onChange={e => setFormMov({ ...formMov, concepto: e.target.value })} /></div>
              <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Monto *</label><input required type="number" min="0.01" step="0.01" style={inputS} value={formMov.monto} onChange={e => setFormMov({ ...formMov, monto: e.target.value })} /></div>
              <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Categoría</label><input style={inputS} value={formMov.categoria} onChange={e => setFormMov({ ...formMov, categoria: e.target.value })} placeholder="ALIMENTACION, SALARIO, OTRO..." /></div>
              <div><label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>Referencia</label><input style={inputS} value={formMov.referencia} onChange={e => setFormMov({ ...formMov, referencia: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" disabled={enviando} style={{ flex: 1, padding: "10px 0", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: enviando ? 0.6 : 1 }}>{enviando ? "Guardando..." : "Registrar"}</button>
              <button type="button" onClick={() => setShowMovimiento(null)} style={{ padding: "10px 16px", background: "rgba(255,255,255,0.60)", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#111" }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
