const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { uploadMedia } = require("../lib/storage");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.use(requireAuth);

// Reportes/eventos en tiempo real: vacunación, tratamiento, pesaje, parto, observación, movimiento
router.get("/", async (req, res) => {
  const { animalId } = req.query;
  const eventos = await prisma.evento.findMany({
    where: {
      animal: { fincaId: req.user.fincaId },
      ...(animalId ? { animalId } : {}),
    },
    orderBy: { fecha: "desc" },
    include: { media: true, usuario: { select: { nombre: true } }, animal: { select: { identificador: true, nombre: true } } },
  });
  res.json(eventos);
});

router.post("/", upload.array("archivos", 10), async (req, res) => {
  const { animalId, tipo, descripcion, peso, fecha } = req.body;
  if (!animalId || !tipo) return res.status(400).json({ error: "animalId y tipo son requeridos" });

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, fincaId: req.user.fincaId },
  });
  if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

  const evento = await prisma.evento.create({
    data: {
      animalId,
      tipo,
      descripcion,
      peso: peso ? Number(peso) : null,
      fecha: fecha ? new Date(fecha) : undefined,
      usuarioId: req.user.sub,
    },
  });

  if (peso) {
    await prisma.animal.update({ where: { id: animalId }, data: { pesoActual: Number(peso) } });
  }

  if (req.files?.length) {
    await Promise.all(
      req.files.map(async (file) => {
        const url = await uploadMedia(file);
        const tipoMedia = file.mimetype.startsWith("video") ? "VIDEO" : "FOTO";
        return prisma.media.create({ data: { url, tipo: tipoMedia, eventoId: evento.id, animalId } });
      })
    );
  }

  const completo = await prisma.evento.findUnique({
    where: { id: evento.id },
    include: { media: true, usuario: { select: { nombre: true } } },
  });

  res.status(201).json(completo);
});

module.exports = router;
