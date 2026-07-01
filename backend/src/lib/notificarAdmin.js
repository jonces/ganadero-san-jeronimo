const prisma = require("../prisma");

const EMOJIS = {
  Animales: "🐄", Ventas: "💰", Gastos: "💸", Incidentes: "🚨",
  Documentos: "📄", Equipo: "👥", Eventos: "📋", default: "📢",
};

async function notificarAdmin({ fincaId, usuarioId, accion, detalle, modulo, urgente = false }) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    // Obtener admin(s) de la finca y el nombre del trabajador
    const [admins, trabajador, finca] = await Promise.all([
      prisma.usuario.findMany({ where: { fincaId, role: "ADMIN" }, select: { email: true, nombre: true } }),
      prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nombre: true } }),
      prisma.finca.findUnique({ where: { id: fincaId }, select: { nombre: true } }),
    ]);

    if (!admins.length) return;

    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emoji = EMOJIS[modulo] || EMOJIS.default;
    const color = urgente ? "#e53e3e" : "#1a6b2a";
    const bgColor = urgente ? "#fff5f5" : "#f0f9f0";
    const hora = new Date().toLocaleString("es-NI", { timeZone: "America/Managua", dateStyle: "short", timeStyle: "short" });

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#f9f9f9">
        <div style="background:${color};padding:16px 20px;border-radius:12px 12px 0 0">
          <h2 style="color:white;margin:0;font-size:18px">${emoji} ${urgente ? "⚠️ INCIDENTE REGISTRADO" : "Nueva actividad en tu finca"}</h2>
        </div>
        <div style="background:white;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
          <p style="color:#4a5568;margin:0 0 12px">Hola, te informamos de una nueva actividad en <strong>${finca?.nombre || "tu finca"}</strong>:</p>
          <div style="background:${bgColor};border-left:4px solid ${color};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:16px">
            <p style="margin:0 0 4px;color:#2d3748;font-weight:700;font-size:16px">${accion}</p>
            ${detalle ? `<p style="margin:0;color:#718096;font-size:14px">${detalle}</p>` : ""}
          </div>
          <table style="width:100%;font-size:13px;color:#718096">
            <tr><td style="padding:4px 0"><strong>👤 Trabajador:</strong></td><td>${trabajador?.nombre || "Desconocido"}</td></tr>
            <tr><td style="padding:4px 0"><strong>📂 Módulo:</strong></td><td>${emoji} ${modulo}</td></tr>
            <tr><td style="padding:4px 0"><strong>🕐 Hora:</strong></td><td>${hora}</td></tr>
          </table>
          <div style="margin-top:20px;text-align:center">
            <a href="https://ganaderosg.app/actividad" style="background:${color};color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
              Ver actividad completa →
            </a>
          </div>
          <p style="color:#a0aec0;font-size:11px;text-align:center;margin-top:16px">
            Ganadero SG · Software Ganadero Henriquez<br>
            <a href="https://ganaderosg.app" style="color:#a0aec0">ganaderosg.app</a>
          </p>
        </div>
      </div>
    `;

    await Promise.all(admins.map(admin =>
      resend.emails.send({
        from: "Ganadero SG <noreply@ganaderosg.app>",
        to: admin.email,
        subject: urgente
          ? `🚨 Incidente registrado en ${finca?.nombre || "tu finca"}`
          : `${emoji} ${accion} — ${finca?.nombre || "tu finca"}`,
        html,
      })
    ));
  } catch (e) {
    // No bloquear la operación si el email falla
  }
}

module.exports = notificarAdmin;
