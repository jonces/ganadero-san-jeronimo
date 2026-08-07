import { Suspense } from "react";
import SmartFarmShell from "../../modules/smart-farm-hub/components/SmartFarmShell.js";

export const metadata = {
  title:       "Smart Farm Hub — GanaderoSG",
  description: "Centro de integración IoT: dispositivos, automatización, mapa inteligente y sincronización.",
};

export default function SmartFarmPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#f9fafb" }}>
      <Suspense fallback={
        <div style={{ textAlign: "center", paddingTop: 80, fontFamily: "system-ui,sans-serif" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🌐</p>
          <p style={{ color: "#6b7280" }}>Cargando Smart Farm Hub…</p>
        </div>
      }>
        <SmartFarmShell />
      </Suspense>
    </div>
  );
}
