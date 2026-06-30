const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth);

const includeAnuncio = {
  autor: { select: { nombre: true, role: true } },
  comentarios: {
    include: { autor: { select: { nombre: true, role: true } } },
    orderBy: { createdAt: "asc" },
  },
};

// GET todos los anuncios de la finca
router.get("/", async (req, res, next) => {
  try {
    const anuncios = await prisma.anuncio.findMany({
      where: { fincaId: req.user.fincaId },
      include: includeAnuncio,
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
      data: { titulo, mensaje, emoji: emoji || "📢", fincaId: req.user.fincaId, autorId: req.user.sub },
      include: includeAnuncio,
    });
    res.json(anuncio);
  } catch (err) { next(err); }
});

// POST comentario en un anuncio (todos los usuarios)
router.post("/:id/comentarios", async (req, res, next) => {
  try {
    const { mensaje } = req.body;
    if (!mensaje?.trim()) return res.status(400).json({ error: "El mensaje no puede estar vacío" });
    const comentario = await prisma.comentario.create({
      data: { mensaje: mensaje.trim(), anuncioId: req.params.id, autorId: req.user.sub },
      include: { autor: { select: { nombre: true, role: true } } },
    });
    res.json(comentario);
  } catch (err) { next(err); }
});

// DELETE comentario (solo el autor o ADMIN)
router.delete("/:anuncioId/comentarios/:id", async (req, res, next) => {
  try {
    const comentario = await prisma.comentario.findUnique({ where: { id: req.params.id } });
    if (!comentario) return res.status(404).json({ error: "Comentario no encontrado" });
    if (comentario.autorId !== req.user.sub && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "No autorizado" });
    }
    await prisma.comentario.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
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
