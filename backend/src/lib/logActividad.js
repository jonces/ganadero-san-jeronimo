const prisma = require("../prisma");

async function logActividad({ accion, detalle, modulo, fincaId, usuarioId }) {
  try {
    await prisma.actividadLog.create({ data: { accion, detalle, modulo, fincaId, usuarioId } });
  } catch {}
}

module.exports = logActividad;
