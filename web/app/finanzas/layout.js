"use client";
import { usePathname, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";

const TABS = [
  { key: "resumen",   label: "Resumen",           path: "/finanzas/resumen" },
  { key: "caja",      label: "Caja y Bancos",      path: "/finanzas/caja-bancos" },
  { key: "activos",   label: "Activos",            path: "/finanzas/activos" },
  { key: "deudas",    label: "Deudas",             path: "/finanzas/deudas" },
  { key: "cierres",   label: "Cierres",            path: "/finanzas/cierres" },
  { key: "informes",  label: "Informes",           path: "/finanzas/informes" },
  { key: "expediente",label: "🏦 Expediente Bancario", path: "/finanzas/expediente" },
];

export default function FinanzasLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = TABS.find(t => pathname.startsWith(t.path))?.key || "resumen";

  return (
    <AppLayout title="Finanzas" subtitle="SISTEMA FINANCIERO GANADERO">
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
