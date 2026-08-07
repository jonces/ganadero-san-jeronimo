import { AcademiaShell } from "../../modules/academia-ganadera/components/AcademiaShell.js";

export const metadata = {
  title: "Academia Ganadera — GanaderoSG",
  description: "Aprende ganadería con IA: cursos, simuladores, certificados y biblioteca personalizada.",
};

export default function AcademiaPage() {
  return (
    <div style={{ height: "100dvh", overflow: "hidden" }}>
      <AcademiaShell />
    </div>
  );
}
