const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/estadisticas", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    const hembras = await prisma.animal.findMany({
      where: { fincaId, sexo: "HEMBRA", estado: { not: "ELIMINADO" } },
      select: { estadoReproductivo: true, fechaParto: true, eventos: { where: { tipo: "PARTO" }, select: { fecha: true } } },
    });

    const totalHembras = hembras.length;
    const totalPreñadas = hembras.filter(h => h.estadoReproductivo === "PREÑADA").length;
    const tasaPreñez = totalHembras > 0 ? Math.round((totalPreñadas / totalHembras) * 100) : 0;

    // Partos este mes: eventos PARTO en el mes actual o fechaParto este mes
    const partosEsteMes = hembras.filter(h =>
      h.eventos.some(e => e.fecha >= inicioMes && e.fecha <= finMes)
    ).length;

    // Partos últimos 6 meses
    const hace6 = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    const todos = hembras.flatMap(h => h.eventos.filter(e => e.fecha >= hace6));
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cantidad = todos.filter(e => {
        const ek = `${e.fecha.getFullYear()}-${String(e.fecha.getMonth() + 1).padStart(2, "0")}`;
        return ek === key;
      }).length;
      meses.push({ mes: key, cantidad });
    }

    res.json({ totalHembras, totalPreñadas, partosEsteMes, tasaPreñez, partosUltimos6Meses: meses });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { estadoReproductivo, potrero } = req.query;
    const where = { fincaId: req.user.fincaId, sexo: "HEMBRA", estado: { not: "ELIMINADO" } };
    if (estadoReproductivo && estadoReproductivo !== "TODAS") where.estadoReproductivo = estadoReproductivo;
    if (potrero) where.potrero = { contains: potrero, mode: "insensitive" };

    const animales = await prisma.animal.findMany({
      where,
      orderBy: [
        { fechaParto: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        media: { orderBy: { createdAt: "desc" }, take: 1 },
        eventos: { where: { tipo: "PARTO" }, orderBy: { fecha: "desc" }, take: 5 },
      },
    });

    res.json(animales);
  } catch (err) { next(err); }
});

router.patch("/:id/estado-reproductivo", async (req, res, next) => {
  try {
    const { estadoReproductivo, fechaParto } = req.body;
    const existing = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId, sexo: "HEMBRA" } });
    if (!existing) return res.status(404).json({ error: "Animal no encontrado" });

    const animal = await prisma.animal.update({
      where: { id: req.params.id },
      data: {
        estadoReproductivo,
        ...(fechaParto !== undefined && { fechaParto: fechaParto ? new Date(fechaParto) : null }),
      },
    });
    res.json(animal);
  } catch (err) { next(err); }
});

module.exports = router;
