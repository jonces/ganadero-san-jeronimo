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

    const [comprasMes, todasCompras] = await Promise.all([
      prisma.compra.findMany({ where: { fincaId, fecha: { gte: inicioMes } } }),
      prisma.compra.findMany({ where: { fincaId }, orderBy: { fecha: "desc" }, take: 5 }),
    ]);

    const totalMes = comprasMes.reduce((s, c) => s + c.total, 0);
    const cantidadMes = comprasMes.length;

    const porTipoMap = {};
    comprasMes.forEach(c => {
      porTipoMap[c.tipo] = (porTipoMap[c.tipo] || 0) + c.total;
    });
    const porTipo = Object.entries(porTipoMap).map(([tipo, total]) => ({ tipo, total }));

    res.json({ totalMes, cantidadMes, porTipo, ultimasCompras: todasCompras });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { tipo, fechaDesde, fechaHasta, page = 1, limit = 50 } = req.query;
    const where = { fincaId: req.user.fincaId };
    if (tipo) where.tipo = tipo;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde + "T00:00:00");
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta + "T23:59:59");
    }

    const [items, total] = await Promise.all([
      prisma.compra.findMany({
        where,
        orderBy: { fecha: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.compra.count({ where }),
    ]);

    res.json({ items, total });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { tipo, descripcion, proveedor, cantidad, precioUnit, fecha, factura, notas } = req.body;
    const total = (Number(cantidad) || 1) * Number(precioUnit);
    const compra = await prisma.compra.create({
      data: {
        fincaId: req.user.fincaId,
        tipo,
        descripcion,
        proveedor,
        cantidad: Number(cantidad) || 1,
        precioUnit: Number(precioUnit),
        total,
        fecha: fecha ? new Date(fecha + "T12:00:00") : new Date(),
        factura,
        notas,
      },
    });
    res.json(compra);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.compra.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });

    const { tipo, descripcion, proveedor, cantidad, precioUnit, fecha, factura, notas } = req.body;
    const cant = cantidad !== undefined ? Number(cantidad) : existing.cantidad;
    const pu = precioUnit !== undefined ? Number(precioUnit) : existing.precioUnit;

    const compra = await prisma.compra.update({
      where: { id: req.params.id },
      data: {
        ...(tipo !== undefined && { tipo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(proveedor !== undefined && { proveedor }),
        cantidad: cant,
        precioUnit: pu,
        total: cant * pu,
        ...(fecha !== undefined && { fecha: new Date(fecha + "T12:00:00") }),
        ...(factura !== undefined && { factura }),
        ...(notas !== undefined && { notas }),
      },
    });
    res.json(compra);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.compra.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });
    await prisma.compra.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
