const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { periodo } = req.query;
    const ahora = new Date();
    let desde = null;

    if (periodo === "DIARIO") {
      desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    } else if (periodo === "SEMANAL") {
      desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (periodo === "QUINCENAL") {
      desde = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
    } else if (periodo === "MENSUAL") {
      desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    const gastos = await prisma.gasto.findMany({
      where: {
        fincaId: req.user.fincaId,
        ...(desde ? { fecha: { gte: desde } } : {}),
      },
      orderBy: { fecha: "desc" },
      include: { usuario: { select: { nombre: true } } },
    });

    const total = gastos.reduce((s, g) => s + g.monto, 0);
    res.json({ gastos, total });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { descripcion, categoria, monto, moneda, periodicidad, fecha, notas } = req.body;
    if (!descripcion || !monto || !periodicidad) {
      return res.status(400).json({ error: "descripcion, monto y periodicidad son requeridos" });
    }

    const gasto = await prisma.gasto.create({
      data: {
        descripcion,
        categoria: categoria || "OTRO",
        monto: Number(monto),
        moneda: moneda || "NIO",
        periodicidad,
        fecha: fecha ? new Date(fecha) : undefined,
        notas: notas || null,
        fincaId: req.user.fincaId,
        usuarioId: req.user.sub,
      },
      include: { usuario: { select: { nombre: true } } },
    });
    res.status(201).json(gasto);
  } catch (err) { next(err); }
});

router.delete("/:id", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const g = await prisma.gasto.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!g) return res.status(404).json({ error: "No encontrado" });
    await prisma.gasto.delete({ where: { id: g.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
