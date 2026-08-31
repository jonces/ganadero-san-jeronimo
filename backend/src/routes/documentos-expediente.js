const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");
const { uploadMediaConTipo } = require("../lib/storage");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
router.use(requireAuth);
router.use(requireNoEsCampo);

// GET /documentos-expediente
router.get("/", async (req, res, next) => {
  try {
    const docs = await prisma.documentoExpediente.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: { createdAt: "desc" },
    });
    res.json(docs);
  } catch (err) { next(err); }
});

// POST /documentos-expediente — multipart upload
router.post("/", upload.single("archivo"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
    const { nombre, tipo } = req.body;
    if (!nombre || !tipo) return res.status(400).json({ error: "nombre y tipo son requeridos" });

    const { url, tipo: mediaType } = await uploadMediaConTipo(req.file);
    const doc = await prisma.documentoExpediente.create({
      data: {
        fincaId: req.user.fincaId,
        nombre,
        tipo,
        url,
        mediaType,
        tamanio: req.file.size,
      },
    });
    res.json(doc);
  } catch (err) { next(err); }
});

// DELETE /documentos-expediente/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const doc = await prisma.documentoExpediente.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!doc) return res.status(404).json({ error: "No encontrado" });
    await prisma.documentoExpediente.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
