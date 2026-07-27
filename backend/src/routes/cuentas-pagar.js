const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/resumen", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const ahora = new Date();
    const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const todas = await prisma.cuentaPorPagar.findMany({ where: { fincaId } });

    // Auto-marcar vencidas
    const pendientesVencidas = todas.filter(c => c.estado === "PENDIENTE" && new Date(c.fechaVence) < ahora);
    if (pendientesVencidas.length > 0) {
      await prisma.cuentaPorPagar.updateMany({
        where: { fincaId, estado: "PENDIENTE", fechaVence: { lt: ahora } },
        data: { estado: "VENCIDA" },
      });
      pendientesVencidas.forEach(c => { c.estado = "VENCIDA"; });
    }

    const pendientes = todas.filter(c => c.estado === "PENDIENTE" || c.estado === "VENCIDA");
    const totalPendiente = pendientes.filter(c => c.estado === "PENDIENTE").reduce((s, c) => s + c.monto, 0);
    const totalVencido = pendientes.filter(c => c.estado === "VENCIDA").reduce((s, c) => s + c.monto, 0);
    const venceProximamente = todas.filter(c =>
      c.estado === "PENDIENTE" && new Date(c.fechaVence) >= ahora && new Date(c.fechaVence) <= en7dias
    ).length;
    const pagadasEsteMes = todas.filter(c => c.estado === "PAGADA" && c.pagadaEn && new Date(c.pagadaEn) >= inicioMes).length;

    const porEstado = {};
    todas.forEach(c => { porEstado[c.estado] = (porEstado[c.estado] || 0) + 1; });

    res.json({ totalPendiente, totalVencido, venceProximamente, pagadasEsteMes, porEstado });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { estado } = req.query;
    const fincaId = req.user.fincaId;
    const ahora = new Date();

    // Auto-actualizar vencidas
    await prisma.cuentaPorPagar.updateMany({
      where: { fincaId, estado: "PENDIENTE", fechaVence: { lt: ahora } },
      data: { estado: "VENCIDA" },
    });

    const where = { fincaId };
    if (estado) where.estado = estado;

    const items = await prisma.cuentaPorPagar.findMany({
      where,
      orderBy: [{ estado: "asc" }, { fechaVence: "asc" }],
    });

    // Ordenar: VENCIDA primero, luego PENDIENTE, luego resto
    const orden = { VENCIDA: 0, PENDIENTE: 1, PAGADA: 2, CANCELADA: 3 };
    items.sort((a, b) => (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9) || new Date(a.fechaVence) - new Date(b.fechaVence));

    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { descripcion, proveedor, monto, fechaVence, notas } = req.body;
    const item = await prisma.cuentaPorPagar.create({
      data: {
        fincaId: req.user.fincaId,
        descripcion,
        proveedor,
        monto: Number(monto),
        fechaVence: new Date(fechaVence),
        notas,
      },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.cuentaPorPagar.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });

    const { descripcion, proveedor, monto, fechaVence, estado, notas } = req.body;
    const data = {
      ...(descripcion !== undefined && { descripcion }),
      ...(proveedor !== undefined && { proveedor }),
      ...(monto !== undefined && { monto: Number(monto) }),
      ...(fechaVence !== undefined && { fechaVence: new Date(fechaVence) }),
      ...(estado !== undefined && { estado }),
      ...(notas !== undefined && { notas }),
    };
    if (estado === "PAGADA" && !existing.pagadaEn) data.pagadaEn = new Date();

    const item = await prisma.cuentaPorPagar.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (err) { next(err); }
});

module.exports = router;
