const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadMediaConTipo } = require("../lib/storage");
const notificarAdmin = require("../lib/notificarAdmin");
const logActividad = require("../lib/logActividad");

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
        const { url, tipo: tipoMedia } = await uploadMediaConTipo(file);
        return prisma.media.create({ data: { url, tipo: tipoMedia, incidenteId: incidente.id } });
      }));
    }

    // Si es muerte, marcar el animal como MUERTO automáticamente
    if (tipo === "MUERTE" && animalId) {
      await prisma.animal.update({
        where: { id: animalId },
        data: { estado: "MUERTO", estadoReproductivo: null },
      }).catch(() => {});
    }

    logActividad({ accion: `Registró incidente: ${tipo}`, detalle: descripcion, modulo: "Incidentes", fincaId: req.user.fincaId, usuarioId: req.user.sub });

    // Notificación urgente al admin siempre que se registre un incidente
    notificarAdmin({
      fincaId: req.user.fincaId,
      usuarioId: req.user.sub,
      accion: `Incidente registrado: ${tipo}`,
      detalle: `${gravedad || "LEVE"} — ${descripcion}`,
      modulo: "Incidentes",
      urgente: true,
    });

    res.status(201).json(incidente);
  } catch (err) { next(err); }
});

router.patch("/:id/resolver", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const inc = await prisma.incidente.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!inc) return res.status(404).json({ error: "No encontrado" });
    const updated = await prisma.incidente.update({ where: { id: inc.id }, data: { estado: "RESUELTO" } });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const inc = await prisma.incidente.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!inc) return res.status(404).json({ error: "Incidente no encontrado" });
    // Borrar media relacionada primero
    await prisma.media.deleteMany({ where: { incidenteId: inc.id } }).catch(() => {});
    await prisma.incidente.delete({ where: { id: inc.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando incidente:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
