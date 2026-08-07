import { Suspense } from "react";
import PredictiveShell from "../../modules/predictive-intelligence/components/PredictiveShell.js";

export const metadata = {
  title:       "Inteligencia Predictiva — GanaderoSG",
  description: "Motor predictivo que anticipa riesgos y oportunidades en tu finca ganadera.",
};

export default function PredictiveIntelligencePage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#f9fafb" }}>
      <Suspense fallback={
        <div style={{ textAlign: "center", paddingTop: 80, fontFamily: "system-ui,sans-serif" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🔮</p>
          <p style={{ color: "#6b7280" }}>Cargando motor predictivo…</p>
        </div>
      }>
        <PredictiveShell />
      </Suspense>
    </div>
  );
}
