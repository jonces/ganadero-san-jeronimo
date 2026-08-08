const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/mi-finca", async (req, res) => {
  const finca = await prisma.finca.findUnique({
    where: { id: req.user.fincaId },
    include: {
      _count: { select: { animales: true, usuarios: true } },
      usuarios: { where: { role: "ADMIN" }, select: { nombre: true, email: true }, take: 1 },
    },
  });
  res.json(finca);
});

// GET configuración de crecimiento
router.get("/config-crecimiento", async (req, res, next) => {
  try {
    const finca = await prisma.finca.findUnique({
      where: { id: req.user.fincaId },
      select: { precioLibra: true, precioReproductora: true, metaAnimales: true, nombre: true },
    });
    res.json(finca);
  } catch (e) { next(e); }
});

// PATCH actualizar configuración de crecimiento
router.patch("/config-crecimiento", async (req, res, next) => {
  try {
    const { precioLibra, precioReproductora, metaAnimales } = req.body;
    const data = {};
    if (precioLibra       !== undefined) data.precioLibra       = Number(precioLibra);
    if (precioReproductora!== undefined) data.precioReproductora= Number(precioReproductora);
    if (metaAnimales      !== undefined) data.metaAnimales      = Math.round(Number(metaAnimales));
    const finca = await prisma.finca.update({ where: { id: req.user.fincaId }, data });
    res.json({ precioLibra: finca.precioLibra, precioReproductora: finca.precioReproductora, metaAnimales: finca.metaAnimales });
  } catch (e) { next(e); }
});

module.exports = router;
