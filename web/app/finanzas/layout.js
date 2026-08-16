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

function PinModal({ onSuccess, esGerente, router }) {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  function handleDigit(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !pin[i] && i > 0) inputs.current[i - 1]?.focus();
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
      else setError(d.error || "Código incorrecto");
    } catch { setError("Error de conexión"); }
    setLoading(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "44px 40px",
        width: 380, boxShadow: "0 32px 96px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🔐</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a3a6c", margin: "0 0 6px" }}>
          Módulo Financiero
        </h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 30 }}>
          Ingresa tu código personal de acceso
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 22 }}>
          {pin.map((d, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 46, height: 54, textAlign: "center",
                fontSize: 24, fontWeight: 800, border: "2.5px solid #e2e8f0",
                borderRadius: 12, outline: "none", color: "#1a3a6c",
                transition: "border-color .15s",
              }}
              onFocus={e => e.target.style.borderColor = "#1a3a6c"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 14, fontWeight: 700 }}>
            ❌ {error}
          </p>
        )}

        <button
          onClick={verificar}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: "#1a3a6c", color: "#fff", fontWeight: 800, fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            marginBottom: 14,
          }}
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>

        {esGerente ? (
          <button
            onClick={() => router.push("/equipo")}
            style={{
              background: "none", border: "none", color: "#1a3a6c",
              fontSize: 13, cursor: "pointer", textDecoration: "underline",
            }}
          >
            ⚙️ Administrar códigos de acceso → Personal
          </button>
        ) : (
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
            Si no tienes código, solicítaselo al Gerente General
          </p>
        )}
      </div>
    </div>
  );
}

export default function FinanzasLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pinOk, setPinOk] = useState(false);
  const [esGerente, setEsGerente] = useState(false);
  const [checking, setChecking] = useState(true);
  const activeTab = TABS.find(t => pathname.startsWith(t.path))?.key || "resumen";

  useEffect(() => {
    const ok = sessionStorage.getItem(PIN_SESSION_KEY) === "1";
    if (ok) setPinOk(true);
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setEsGerente(payload.cargo === "GERENTE_GENERAL" || payload.role === "SUPER_ADMIN");
      }
    } catch {}
    setChecking(false);
  }, []);

  if (checking) return null;

  return (
    <AppLayout title="Finanzas" subtitle="SISTEMA FINANCIERO GANADERO">
      {!pinOk && (
        <PinModal onSuccess={() => setPinOk(true)} esGerente={esGerente} router={router} />
      )}
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
