const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function calcularEstado(stockActual, stockMinimo) {
  if (stockActual <= 0) return "AGOTADO";
  if (stockActual <= stockMinimo * 1.5) return "BAJO";
  return "OPTIMO";
}

router.get("/alertas", async (req, res, next) => {
  try {
    const items = await prisma.insumo.findMany({ where: { fincaId: req.user.fincaId } });
    const alertas = items
      .filter(i => i.stockActual <= i.stockMinimo)
      .map(i => ({ ...i, estadoStock: calcularEstado(i.stockActual, i.stockMinimo) }));
    res.json(alertas);
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { categoria, estado } = req.query;
    const where = { fincaId: req.user.fincaId };
    if (categoria) where.categoria = categoria;

    const items = await prisma.insumo.findMany({ where, orderBy: { nombre: "asc" } });
    let result = items.map(i => ({ ...i, estadoStock: calcularEstado(i.stockActual, i.stockMinimo) }));

    if (estado) result = result.filter(i => i.estadoStock === estado);

    res.json({ items: result, total: result.length });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { nombre, categoria, unidad, stockActual, stockMinimo, precioUnit, proveedor, notas } = req.body;
    const item = await prisma.insumo.create({
      data: {
        fincaId: req.user.fincaId,
        nombre,
        categoria,
        unidad,
        stockActual: Number(stockActual) || 0,
        stockMinimo: Number(stockMinimo) || 0,
        precioUnit: precioUnit ? Number(precioUnit) : null,
        proveedor,
        notas,
      },
    });
    res.json({ ...item, estadoStock: calcularEstado(item.stockActual, item.stockMinimo) });
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.insumo.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });

    const { nombre, categoria, unidad, stockActual, stockMinimo, precioUnit, proveedor, notas } = req.body;
    const item = await prisma.insumo.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(categoria !== undefined && { categoria }),
        ...(unidad !== undefined && { unidad }),
        ...(stockActual !== undefined && { stockActual: Number(stockActual) }),
        ...(stockMinimo !== undefined && { stockMinimo: Number(stockMinimo) }),
        ...(precioUnit !== undefined && { precioUnit: precioUnit ? Number(precioUnit) : null }),
        ...(proveedor !== undefined && { proveedor }),
        ...(notas !== undefined && { notas }),
      },
    });
    res.json({ ...item, estadoStock: calcularEstado(item.stockActual, item.stockMinimo) });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.insumo.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });
    await prisma.insumo.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
