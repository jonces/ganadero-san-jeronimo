import { IAProvider } from "../../modules/ia-ganadero/index.js";

export const metadata = {
  title: "Centro IA Ganadero | GanaderoSG",
  description: "Asistente inteligente para gestión ganadera",
};

export default function IAModuleLayout({ children }) {
  return (
    <IAProvider>
      {children}
    </IAProvider>
  );
}
