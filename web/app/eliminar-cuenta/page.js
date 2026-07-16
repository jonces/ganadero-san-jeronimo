export const metadata = {
  title: "Eliminar cuenta — Ganaderos G",
  description: "Cómo solicitar la eliminación de tu cuenta y tus datos en Ganaderos G",
};

export default function EliminarCuentaPage() {
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
          <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: "0 0 8px" }}>Eliminación de cuenta y datos</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            Esta página aplica a la aplicación <strong style={{ color: "rgba(255,255,255,0.7)" }}>Ganaderos G</strong> (Google
            Play) y a la versión web ganaderosg.app, desarrolladas por Software Ganadero Henriquez.
          </p>
        </div>

        {[
          {
            title: "Cómo solicitar la eliminación de tu cuenta",
            content: `Para solicitar que eliminemos tu cuenta y todos los datos asociados, sigue estos pasos:

1. Envía un correo a jhonces20@gmail.com desde la dirección de correo con la que está registrada tu cuenta.
2. Usa el asunto "Eliminar mi cuenta de Ganaderos G".
3. Indica el nombre de tu finca para verificar tu identidad.

Procesaremos tu solicitud en un plazo máximo de 30 días y te confirmaremos por correo cuando esté completada.`
          },
          {
            title: "Qué datos se eliminan",
            content: `Al eliminar tu cuenta se borran de forma permanente:

• Tu información de cuenta (nombre, correo electrónico y contraseña).
• Si eres administrador de la finca: todos los datos de la finca, incluidos los registros de animales, ventas, gastos, incidentes, documentos, anuncios y las cuentas de los trabajadores asociados.
• Las fotografías y videos subidos a la plataforma.

Estos datos no se pueden recuperar después de la eliminación.`
          },
          {
            title: "Qué datos se conservan y por cuánto tiempo",
            content: `• Copias de seguridad técnicas: pueden conservar datos hasta 90 días después de la eliminación, tras lo cual se borran definitivamente.
• No conservamos ningún otro dato personal después de ese periodo.`
          },
          {
            title: "Eliminación parcial de datos",
            content: `Si solo quieres borrar algunos datos sin eliminar tu cuenta (por ejemplo, fotos, animales o registros específicos), puedes hacerlo directamente dentro de la aplicación, o solicitarlo al mismo correo jhonces20@gmail.com indicando qué datos deseas borrar.`
          },
        ].map((s) => (
          <div
            key={s.title}
            style={{
              background: "rgba(5,25,8,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <h3 style={{ color: "#4ade80", fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>{s.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line", margin: 0 }}>
              {s.content}
            </p>
          </div>
        ))}

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", marginTop: 24 }}>
          © 2026 Software Ganadero Henriquez · <a href="/privacidad" style={{ color: "#4ade80" }}>Política de privacidad</a>
        </p>
      </div>
    </div>
  );
}
