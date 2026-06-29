const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { uploadMedia } = require("../lib/storage");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const incidentes = await prisma.incidente.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: { fecha: "desc" },
      include: {
        animal: { select: { identificador: true, nombre: true } },
        usuario: { select: { nombre: true } },
        media: true,
      },
    });
    res.json(incidentes);
  } catch (err) { next(err); }
});

router.post("/", upload.array("archivos", 10), async (req, res, next) => {
  try {
    const { tipo, gravedad, descripcion, tratamiento, animalId, fecha } = req.body;
    if (!tipo || !descripcion) return res.status(400).json({ error: "tipo y descripcion son requeridos" });

    const incidente = await prisma.incidente.create({
      data: {
        tipo,
        gravedad: gravedad || "LEVE",
        descripcion,
        tratamiento: tratamiento || null,
        animalId: animalId || null,
        fecha: fecha ? new Date(fecha) : undefined,
        fincaId: req.user.fincaId,
        usuarioId: req.user.sub,
      },
    });

    if (req.files?.length) {
      await Promise.all(req.files.map(async (file) => {
        const url = await uploadMedia(file);
        const tipoMedia = file.mimetype.startsWith("video") ? "VIDEO" : "FOTO";
        return prisma.media.create({ data: { url, tipo: tipoMedia, incidenteId: incidente.id } });
      }));
    }

    res.status(201).json(incidente);
  } catch (err) { next(err); }
});

router.patch("/:id/resolver", async (req, res, next) => {
  try {
    const inc = await prisma.incidente.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!inc) return res.status(404).json({ error: "No encontrado" });
    const updated = await prisma.incidente.update({ where: { id: inc.id }, data: { estado: "RESUELTO" } });
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
