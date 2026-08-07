import { Suspense } from "react";
import CopilotoAIShell from "./CopilotoAIShell.js";

export const metadata = {
  title:       "Copiloto IA — GanaderoSG",
  description: "Centro de Inteligencia Artificial para ganadería. Especialistas IA con datos reales de tu finca.",
};

export default function CopilotoAIPage() {
  return (
    <div style={{ height: "100dvh", background: "#0f172a", display: "flex", flexDirection: "column" }}>
      <Suspense fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", color: "#94a3b8", fontFamily: "system-ui" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>🤖</p>
            <p style={{ fontWeight: 700, fontSize: 16 }}>Iniciando AI Core…</p>
          </div>
        </div>
      }>
        <CopilotoAIShell />
      </Suspense>
    </div>
  );
}
