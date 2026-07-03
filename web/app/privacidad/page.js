export const metadata = {
  title: "Política de Privacidad — Ganaderos G",
  description: "Política de privacidad del Software Ganadero Henriquez",
};

export default function PrivacidadPage() {
  return (
    <div style={{ background: "#020F05", minHeight: "100vh", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 36 }}>🐄</span>
            <div>
              <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>Ganaderos G</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Software Ganadero Henriquez</p>
            </div>
          </div>
          <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: "0 0 8px" }}>Política de Privacidad</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Última actualización: 2 de julio de 2026</p>
        </div>

        {[
          {
            title: "1. Información que recopilamos",
            content: `Al usar la aplicación Ganaderos G, recopilamos la siguiente información:

• Información de cuenta: nombre completo, dirección de correo electrónico y contraseña (almacenada de forma encriptada).
• Información de la finca: nombre de la finca, ubicación opcional, tipo de cambio configurado.
• Datos del ganado: identificadores, nombres, razas, pesos, estado reproductivo, eventos médicos y fotografías/videos de los animales.
• Registros de ventas e incidentes: datos de transacciones, compradores, precios y reportes de incidentes.
• Fotografías de perfil: imágenes que el usuario carga voluntariamente.
• Datos técnicos: dirección IP, tipo de dispositivo, versión del sistema operativo y registros de actividad dentro de la app.`
          },
          {
            title: "2. Cómo usamos su información",
            content: `Utilizamos la información recopilada para:

• Proveer y mantener el servicio de gestión ganadera.
• Autenticar su identidad y proteger su cuenta.
• Permitir la gestión de inventario, ventas e incidentes de su finca.
• Mejorar la funcionalidad y el rendimiento de la aplicación.
• Enviar notificaciones relacionadas con su cuenta (solo con su consentimiento).
• Cumplir con obligaciones legales aplicables.

No vendemos, alquilamos ni compartimos su información personal con terceros con fines comerciales.`
          },
          {
            title: "3. Almacenamiento y seguridad",
            content: `Su información se almacena en servidores seguros provistos por Railway (infraestructura en la nube). Las fotografías y videos se almacenan en Cloudinary con acceso restringido.

Medidas de seguridad que aplicamos:
• Contraseñas encriptadas con bcrypt (hash de una sola vía).
• Comunicación cifrada mediante HTTPS/TLS en todas las transmisiones.
• Tokens de autenticación JWT con expiración automática.
• Acceso a datos restringido por rol (administrador / trabajador).`
          },
          {
            title: "4. Compartición de datos",
            content: `No compartimos su información personal excepto en los siguientes casos:

• Con proveedores de servicios técnicos necesarios para operar la app (Railway para hosting, Cloudinary para almacenamiento de medios). Estos proveedores están contractualmente obligados a proteger su información.
• Cuando sea requerido por ley o autoridad competente.
• Con su consentimiento explícito.`
          },
          {
            title: "5. Retención de datos",
            content: `Conservamos su información mientras su cuenta esté activa o sea necesaria para prestar el servicio. Al eliminar su cuenta, se eliminan todos sus datos en un plazo máximo de 30 días, salvo que la ley exija un período de retención mayor.`
          },
          {
            title: "6. Sus derechos",
            content: `Usted tiene derecho a:

• Acceder a la información personal que tenemos sobre usted.
• Corregir datos incorrectos o incompletos.
• Solicitar la eliminación de su cuenta y datos asociados.
• Exportar sus datos en formato legible.
• Retirar su consentimiento para el procesamiento de datos en cualquier momento.

Para ejercer estos derechos, contáctenos en: jhonces20@gmail.com`
          },
          {
            title: "7. Menores de edad",
            content: `Ganaderos G no está dirigida a personas menores de 18 años. No recopilamos conscientemente información de menores. Si descubrimos que un menor ha proporcionado información personal, la eliminaremos de inmediato.`
          },
          {
            title: "8. Cambios a esta política",
            content: `Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios significativos mediante un aviso en la aplicación o por correo electrónico. El uso continuado de la app después de dichos cambios constituye su aceptación de la nueva política.`
          },
          {
            title: "9. Contacto",
            content: `Si tiene preguntas sobre esta Política de Privacidad o sobre el manejo de sus datos, contáctenos:

📧 jhonces20@gmail.com
🌐 ganaderosg.app
📍 Nicaragua`
          },
        ].map((s) => (
          <div key={s.title} style={{ marginBottom: 28, padding: 24, background: "rgba(5,25,12,0.70)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ color: "#4ade80", fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>{s.title}</h3>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {s.content}
            </div>
          </div>
        ))}

        <div style={{ textAlign: "center", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
            © 2026 Software Ganadero Henriquez · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
