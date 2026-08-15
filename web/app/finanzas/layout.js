"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ganadero-san-jeronimo-production.up.railway.app/api";

const TABS = [
  { key: "resumen",    label: "Resumen",               path: "/finanzas/resumen" },
  { key: "caja",       label: "Caja y Bancos",          path: "/finanzas/caja-bancos" },
  { key: "activos",    label: "Activos",                path: "/finanzas/activos" },
  { key: "deudas",     label: "Deudas",                 path: "/finanzas/deudas" },
  { key: "cierres",    label: "Cierres",                path: "/finanzas/cierres" },
  { key: "informes",   label: "Informes",               path: "/finanzas/informes" },
  { key: "expediente", label: "🏦 Expediente Bancario", path: "/finanzas/expediente" },
];

const PIN_SESSION_KEY = "finanzas_pin_ok";

function PinModal({ onSuccess, isAdmin }) {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState(["", "", "", "", "", ""]);
  const [changeMsg, setChangeMsg] = useState("");
  const inputs = useRef([]);
  const newInputs = useRef([]);

  function handleDigit(i, val, arr, setArr, refs) {
    if (!/^\d?$/.test(val)) return;
    const next = [...arr];
    next[i] = val;
    setArr(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e, arr, setArr, refs) {
    if (e.key === "Backspace" && !arr[i] && i > 0) refs.current[i - 1]?.focus();
  }

  async function verificar() {
    const code = pin.join("");
    if (code.length < 6) { setError("Ingresa los 6 dígitos"); return; }
    setLoading(true); setError("");
    try {
      const token = sessionStorage.getItem("token");
      const r = await fetch(`${API_BASE}/finanzas-pin/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pin: code }),
      });
      const d = await r.json();
      if (r.ok) { sessionStorage.setItem(PIN_SESSION_KEY, "1"); onSuccess(); }
      else setError(d.error || "PIN incorrecto");
    } catch { setError("Error de conexión"); }
    setLoading(false);
  }

  async function cambiarPin() {
    const code = newPin.join("");
    if (code.length < 6) { setChangeMsg("Ingresa los 6 dígitos del nuevo PIN"); return; }
    setLoading(true); setChangeMsg("");
    try {
      const token = sessionStorage.getItem("token");
      const r = await fetch(`${API_BASE}/finanzas-pin/cambiar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pin: code }),
      });
      const d = await r.json();
      if (r.ok) { setChangeMsg("✅ PIN actualizado. Ahora ingresa el nuevo PIN para acceder."); setChangingPin(false); setNewPin(["","","","","",""]); }
      else setChangeMsg(d.error || "Error al cambiar PIN");
    } catch { setChangeMsg("Error de conexión"); }
    setLoading(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 36px",
        width: 360, boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        textAlign: "center",
      }}>
        {!changingPin ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a3a6c", margin: "0 0 6px" }}>
              Módulo Financiero
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>
              Ingresa el PIN de 6 dígitos para acceder
            </p>

            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
              {pin.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputs.current[i] = el}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value, pin, setPin, inputs)}
                  onKeyDown={e => handleKeyDown(i, e, pin, setPin, inputs)}
                  style={{
                    width: 44, height: 52, textAlign: "center",
                    fontSize: 22, fontWeight: 700, border: "2px solid #e2e8f0",
                    borderRadius: 10, outline: "none", color: "#1a3a6c",
                    transition: "border-color .15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#1a3a6c"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
                ❌ {error}
              </p>
            )}

            <button
              onClick={verificar}
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: 12, border: "none",
                background: "#1a3a6c", color: "#fff", fontWeight: 700, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                marginBottom: 12,
              }}
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>

            {isAdmin && (
              <button
                onClick={() => { setChangingPin(true); setError(""); }}
                style={{
                  background: "none", border: "none", color: "#1a3a6c",
                  fontSize: 13, cursor: "pointer", textDecoration: "underline",
                }}
              >
                ⚙️ Cambiar PIN (Gerente General)
              </button>
            )}

            {!isAdmin && (
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
                Si no tienes el PIN, solicítaselo al Gerente General
              </p>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a3a6c", margin: "0 0 6px" }}>
              Cambiar PIN Financiero
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              Elige un nuevo PIN de 6 dígitos.<br />
              <strong>Compártelo solo con el personal autorizado.</strong>
            </p>

            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
              {newPin.map((d, i) => (
                <input
                  key={i}
                  ref={el => newInputs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value, newPin, setNewPin, newInputs)}
                  onKeyDown={e => handleKeyDown(i, e, newPin, setNewPin, newInputs)}
                  style={{
                    width: 44, height: 52, textAlign: "center",
                    fontSize: 22, fontWeight: 700, border: "2px solid #e2e8f0",
                    borderRadius: 10, outline: "none", color: "#1a3a6c",
                  }}
                  onFocus={e => e.target.style.borderColor = "#2d9e3f"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {changeMsg && (
              <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600,
                color: changeMsg.startsWith("✅") ? "#15803d" : "#dc2626" }}>
                {changeMsg}
              </p>
            )}

            <button
              onClick={cambiarPin}
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: 12, border: "none",
                background: "#2d9e3f", color: "#fff", fontWeight: 700, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                marginBottom: 10,
              }}
            >
              {loading ? "Guardando..." : "Guardar nuevo PIN"}
            </button>

            <button
              onClick={() => { setChangingPin(false); setChangeMsg(""); setNewPin(["","","","","",""]); }}
              style={{
                background: "none", border: "none", color: "#64748b",
                fontSize: 13, cursor: "pointer", textDecoration: "underline",
              }}
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function FinanzasLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pinOk, setPinOk] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const activeTab = TABS.find(t => pathname.startsWith(t.path))?.key || "resumen";

  useEffect(() => {
    // Verificar si ya tiene el PIN desbloqueado en esta sesión
    const ok = sessionStorage.getItem(PIN_SESSION_KEY) === "1";
    // Detectar si es admin
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setIsAdmin(payload.role === "ADMIN");
        // Si es ADMIN y no hay PIN configurado, dar acceso directo
        if (payload.role === "ADMIN" && ok) setPinOk(true);
        else if (ok) setPinOk(true);
      }
    } catch {}
    setChecking(false);
  }, []);

  if (checking) return null;

  return (
    <AppLayout title="Finanzas" subtitle="SISTEMA FINANCIERO GANADERO">
      {!pinOk && (
        <PinModal onSuccess={() => setPinOk(true)} isAdmin={isAdmin} />
      )}
      {/* Navegación interna */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 24,
        overflowX: "auto", paddingBottom: 4,
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const isExpediente = tab.key === "expediente";
          return (
            <button key={tab.key} onClick={() => router.push(tab.path)}
              style={{
                padding: isExpediente ? "8px 18px" : "7px 16px",
                borderRadius: 8,
                border: isExpediente
                  ? isActive ? "1px solid #4ade80" : "1px solid rgba(74,222,128,0.40)"
                  : isActive ? "1px solid rgba(255,255,255,0.30)" : "1px solid transparent",
                background: isExpediente
                  ? isActive ? "rgba(74,222,128,0.20)" : "rgba(74,222,128,0.08)"
                  : isActive ? "rgba(255,255,255,0.15)" : "transparent",
                color: isExpediente ? "#4ade80" : isActive ? "#ffffff" : "rgba(255,255,255,0.60)",
                fontWeight: isActive || isExpediente ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all .15s",
                flexShrink: 0,
              }}>
              {tab.label}
            </button>
          );
        })}
      </div>
      {children}
    </AppLayout>
  );
}
