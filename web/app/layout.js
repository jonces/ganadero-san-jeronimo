import "./globals.css";

export const metadata = {
  title: "Ganadero San Jerónimo",
  description: "Sistema profesional de gestión de fincas ganaderas · Nicaragua",
  manifest: "/manifest.json",
  themeColor: "#2d9e3f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ganadero SG",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2d9e3f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ganadero SG" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
