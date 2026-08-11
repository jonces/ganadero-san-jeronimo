const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use(requireNoEsCampo);

router.get("/", async (req, res, next) => {
  try {
    const { tipo, activo } = req.query;
    const where = { fincaId: req.user.fincaId };
    if (tipo) where.tipo = tipo;
    if (activo !== undefined) where.activo = activo === "true";

    const items = await prisma.proveedor.findMany({
      where,
      orderBy: { nombre: "asc" },
    });
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { nombre, tipo, contacto, telefono, email, direccion, notas } = req.body;
    const item = await prisma.proveedor.create({
      data: { fincaId: req.user.fincaId, nombre, tipo, contacto, telefono, email, direccion, notas },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.proveedor.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });

    const { nombre, tipo, contacto, telefono, email, direccion, notas, activo } = req.body;
    const item = await prisma.proveedor.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(tipo !== undefined && { tipo }),
        ...(contacto !== undefined && { contacto }),
        ...(telefono !== undefined && { telefono }),
        ...(email !== undefined && { email }),
        ...(direccion !== undefined && { direccion }),
        ...(notas !== undefined && { notas }),
        ...(activo !== undefined && { activo }),
      },
    });
    res.json(item);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.proveedor.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });
    await prisma.proveedor.update({ where: { id: req.params.id }, data: { activo: false } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
