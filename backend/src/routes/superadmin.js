const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Acceso denegado" });
  next();
}

router.use(requireAuth, requireSuperAdmin);

// Todas las fincas
router.get("/fincas", async (req, res, next) => {
  try {
    const fincas = await prisma.finca.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { animales: true, usuarios: true, ventas: true } },
        usuarios: { where: { role: "ADMIN" }, select: { nombre: true, email: true } },
      },
    });
    res.json(fincas);
  } catch (err) { next(err); }
});

// Detalle completo de una finca
router.get("/fincas/:id", async (req, res, next) => {
  try {
    const [finca, animales, ventas, incidentes, gastos, equipo] = await Promise.all([
      prisma.finca.findUnique({ where: { id: req.params.id } }),
      prisma.animal.findMany({ where: { fincaId: req.params.id }, include: { media: { take: 1 } }, orderBy: { createdAt: "desc" } }),
      prisma.venta.findMany({ where: { fincaId: req.params.id }, include: { animal: { select: { identificador: true, nombre: true } } }, orderBy: { fecha: "desc" } }),
      prisma.incidente.findMany({ where: { fincaId: req.params.id }, include: { animal: { select: { identificador: true, nombre: true } } }, orderBy: { fecha: "desc" } }),
      prisma.gasto.findMany({ where: { fincaId: req.params.id }, orderBy: { fecha: "desc" } }),
      prisma.usuario.findMany({ where: { fincaId: req.params.id, role: { not: "SUPER_ADMIN" } }, select: { id: true, nombre: true, email: true, role: true, createdAt: true } }),
    ]);
    if (!finca) return res.status(404).json({ error: "Finca no encontrada" });
    res.json({ finca, animales, ventas, incidentes, gastos, equipo });
  } catch (err) { next(err); }
});

// Activar/desactivar finca
router.patch("/fincas/:id/toggle", async (req, res, next) => {
  try {
    const finca = await prisma.finca.findUnique({ where: { id: req.params.id } });
    if (!finca) return res.status(404).json({ error: "No encontrada" });
    const updated = await prisma.finca.update({
      where: { id: finca.id },
      data: { activa: !finca.activa },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// Eliminar finca y todos sus datos
router.delete("/fincas/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const finca = await prisma.finca.findUnique({ where: { id } });
    if (!finca) return res.status(404).json({ error: "Finca no encontrada" });

    // Eliminar en cascada todos los datos relacionados
    await prisma.$transaction([
      prisma.actividadLog.deleteMany({ where: { fincaId: id } }),
      prisma.tareaAnimal.deleteMany({ where: { tarea: { fincaId: id } } }),
      prisma.tarea.deleteMany({ where: { fincaId: id } }),
      prisma.evento.deleteMany({ where: { animal: { fincaId: id } } }),
      prisma.media.deleteMany({ where: { animal: { fincaId: id } } }),
      prisma.venta.deleteMany({ where: { fincaId: id } }),
      prisma.gasto.deleteMany({ where: { fincaId: id } }),
      prisma.animal.deleteMany({ where: { fincaId: id } }),
      prisma.usuario.deleteMany({ where: { fincaId: id } }),
      prisma.finca.delete({ where: { id } }),
    ]);

    res.json({ ok: true, mensaje: `Finca "${finca.nombre}" eliminada correctamente` });
  } catch (err) { next(err); }
});

// Stats globales
router.get("/stats", async (req, res, next) => {
  try {
    const [totalFincas, fincasActivas, totalAnimales, totalUsuarios, totalVentas] = await Promise.all([
      prisma.finca.count(),
      prisma.finca.count({ where: { activa: true } }),
      prisma.animal.count(),
      prisma.usuario.count({ where: { role: { not: "SUPER_ADMIN" } } }),
      prisma.venta.aggregate({ _sum: { precioNIO: true } }),
    ]);
    res.json({
      totalFincas, fincasActivas,
      totalAnimales, totalUsuarios,
      totalVentasNIO: totalVentas._sum.precioNIO || 0,
    });
  } catch (err) { next(err); }
});

module.exports = router;
