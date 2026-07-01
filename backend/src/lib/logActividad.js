const prisma = require("../prisma");
const notificarAdmin = require("./notificarAdmin");

async function logActividad({ accion, detalle, modulo, fincaId, usuarioId }) {
  try {
    await prisma.actividadLog.create({ data: { accion, detalle, modulo, fincaId, usuarioId } });
    // Notificar al admin solo si el que actúa es un TRABAJADOR
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { role: true } });
    if (usuario?.role === "TRABAJADOR") {
      notificarAdmin({ fincaId, usuarioId, accion, detalle, modulo });
    }
  } catch {}
}

module.exports = logActividad;
