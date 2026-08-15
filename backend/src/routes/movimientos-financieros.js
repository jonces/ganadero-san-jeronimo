const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use(requireNoEsCampo);

// GET /api/movimientos-financieros
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 50, tipo, desde, hasta, cuentaId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      fincaId: req.user.fincaId,
      anulado: false,
      ...(tipo && { tipo }),
      ...(cuentaId && { cuentaId }),
      ...(desde || hasta ? {
        fecha: {
          ...(desde && { gte: new Date(desde + "T00:00:00") }),
          ...(hasta && { lte: new Date(hasta + "T23:59:59") }),
        },
      } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.movimientoFinanciero.findMany({
        where, orderBy: { fecha: "desc" },
        skip, take: Number(limit),
        include: { cuenta: { select: { nombre: true, tipo: true } } },
      }),
      prisma.movimientoFinanciero.count({ where }),
    ]);
    res.json({ items, total });
  } catch (err) { next(err); }
});

// POST /api/movimientos-financieros
router.post("/", async (req, res, next) => {
  try {
    const { cuentaId, tipo, categoria, concepto, monto, moneda, tipoCambio, fecha, referencia, observaciones, sourceType, sourceId } = req.body;
    if (!tipo || !concepto || !monto) return res.status(400).json({ error: "tipo, concepto y monto son requeridos" });
    const montoD = parseFloat(monto);
    const tcD = tipoCambio ? parseFloat(tipoCambio) : null;
    const montoNIO = moneda === "USD" && tcD ? montoD * tcD : moneda === "NIO" ? montoD : null;

    const mov = await prisma.$transaction(async (tx) => {
      const m = await tx.movimientoFinanciero.create({
        data: {
          fincaId: req.user.fincaId,
          cuentaId: cuentaId || null,
          tipo, categoria: categoria || null,
          concepto, monto: montoD,
          moneda: moneda || "NIO",
          tipoCambio: tcD,
          montoNIO,
          fecha: fecha ? new Date(fecha) : new Date(),
          referencia: referencia || null,
          observaciones: observaciones || null,
          sourceType: sourceType || "MANUAL",
          sourceId: sourceId || null,
          usuarioId: req.user.sub,
        },
      });
      if (cuentaId) {
        await tx.cuentaFinanciera.update({
          where: { id: cuentaId },
          data: { saldoActual: tipo === "INGRESO" ? { increment: montoD } : { decrement: montoD } },
        });
      }
      return m;
    });
    res.status(201).json(mov);
  } catch (err) { next(err); }
});

// PATCH /api/movimientos-financieros/:id/anular
router.patch("/:id/anular", async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const mov = await prisma.movimientoFinanciero.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!mov) return res.status(404).json({ error: "No encontrado" });
    if (mov.anulado) return res.status(400).json({ error: "Ya está anulado" });

    await prisma.$transaction(async (tx) => {
      await tx.movimientoFinanciero.update({
        where: { id: mov.id },
        data: { anulado: true, motivoAnulacion: motivo || "Sin motivo" },
      });
      if (mov.cuentaId) {
        await tx.cuentaFinanciera.update({
          where: { id: mov.cuentaId },
          data: { saldoActual: mov.tipo === "INGRESO" ? { decrement: Number(mov.monto) } : { increment: Number(mov.monto) } },
        });
      }
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
