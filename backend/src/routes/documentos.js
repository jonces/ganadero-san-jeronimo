const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { uploadMedia } = require("../lib/storage");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const docs = await prisma.documento.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: { createdAt: "desc" },
    });
    res.json(docs);
  } catch (err) { next(err); }
});

router.post("/", upload.single("archivo"), async (req, res, next) => {
  try {
    const { nombre, tipo, notas } = req.body;
    if (!nombre || !tipo || !req.file) {
      return res.status(400).json({ error: "nombre, tipo y archivo son requeridos" });
    }
    const url = await uploadMedia(req.file);
    const doc = await prisma.documento.create({
      data: { nombre, tipo, notas, url, fincaId: req.user.fincaId },
    });
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const doc = await prisma.documento.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!doc) return res.status(404).json({ error: "Documento no encontrado" });
    await prisma.documento.delete({ where: { id: doc.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
