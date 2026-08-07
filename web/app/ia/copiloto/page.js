import { CopilotoShell } from "../../../modules/copiloto-ganadero/components/CopilotoShell.js";

export const metadata = {
  title: "Copiloto Ganadero — GanaderoSG",
  description: "Centro de Decisiones Inteligente para tu finca ganadera.",
};

export default function CopilotoPage() {
  return (
    <div style={{ height: "100dvh", overflow: "hidden" }}>
      <CopilotoShell />
    </div>
  );
}
