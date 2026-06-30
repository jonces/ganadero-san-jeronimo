const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth);

// GET todos los anuncios de la finca
router.get("/", async (req, res, next) => {
  try {
    const anuncios = await prisma.anuncio.findMany({
      where: { fincaId: req.user.fincaId },
      include: { autor: { select: { nombre: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(anuncios);
  } catch (err) { next(err); }
});

// POST nuevo anuncio (solo ADMIN)
router.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { titulo, mensaje, emoji } = req.body;
    if (!titulo || !mensaje) return res.status(400).json({ error: "Título y mensaje son requeridos" });
    const anuncio = await prisma.anuncio.create({
      data: { titulo, mensaje, emoji: emoji || "📢", fincaId: req.user.fincaId, autorId: req.user.id },
      include: { autor: { select: { nombre: true, role: true } } },
    });
    res.json(anuncio);
  } catch (err) { next(err); }
});

// DELETE anuncio (solo ADMIN)
router.delete("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    await prisma.anuncio.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
