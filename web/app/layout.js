import "./globals.css";

export const metadata = {
  title: "Ganadero San Jerónimo",
  description: "Gestión de ganado en tiempo real",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
