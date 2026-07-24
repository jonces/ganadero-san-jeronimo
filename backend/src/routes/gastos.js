const express = require("express");
const multer  = require("multer");
const prisma  = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadMediaConTipo } = require("../lib/storage");
const logActividad = require("../lib/logActividad");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { periodo, categoria, receptor, desde: desdeParam, hasta: hastaParam } = req.query;
    const ahora = new Date();
    let desde = null;

    if (periodo === "DIARIO") {
      desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    } else if (periodo === "SEMANAL") {
      desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (periodo === "QUINCENAL") {
      desde = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
    } else if (periodo === "MENSUAL") {
      desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    // Si vienen fechas exactas desde/hasta, tienen prioridad
    if (desdeParam) desde = new Date(desdeParam + "T00:00:00");
    const hasta = hastaParam ? new Date(hastaParam + "T23:59:59") : null;

    const gastos = await prisma.gasto.findMany({
      where: {
        fincaId: req.user.fincaId,
        ...(desde ? { fecha: { gte: desde } } : {}),
        ...(hasta ? { fecha: { ...(desde ? { gte: desde } : {}), lte: hasta } } : {}),
        ...(categoria ? { categoria } : {}),
        ...(receptor ? { receptor: { contains: receptor, mode: "insensitive" } } : {}),
      },
      orderBy: { fecha: "desc" },
      include: { usuario: { select: { nombre: true } } },
    });

    const total = gastos.reduce((s, g) => s + g.monto, 0);
    res.json({ gastos, total });
  } catch (err) { next(err); }
});

// Lista de usuarios de la finca (para selector)
router.get("/usuarios-finca", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { fincaId: req.user.fincaId },
      select: { id: true, nombre: true, role: true },
      orderBy: { nombre: "asc" },
    });
    res.json(usuarios);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { descripcion, categoria, monto, moneda, periodicidad, fecha, notas, responsable, receptor } = req.body;
    if (!descripcion || !monto || !periodicidad) {
      return res.status(400).json({ error: "descripcion, monto y periodicidad son requeridos" });
    }

    const gasto = await prisma.gasto.create({
      data: {
        descripcion,
        categoria: categoria || "OTRO",
        monto: Number(monto),
        moneda: moneda || "NIO",
        periodicidad,
        fecha: fecha ? new Date(fecha) : undefined,
        notas: notas || null,
        responsable: responsable || null,
        receptor: receptor || null,
        fincaId: req.user.fincaId,
        usuarioId: req.user.sub,
      },
      include: { usuario: { select: { nombre: true } }, finca: { select: { nombre: true, ubicacion: true } } },
    });
    logActividad({ accion: "Registró gasto", detalle: `${descripcion} — C$ ${monto}`, modulo: "Gastos", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json(gasto);
  } catch (err) { next(err); }
});

router.patch("/:id", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const g = await prisma.gasto.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!g) return res.status(404).json({ error: "No encontrado" });
    const { descripcion, categoria, monto, fecha, periodicidad, notas, responsable, receptor } = req.body;
    const updated = await prisma.gasto.update({
      where: { id: g.id },
      data: {
        ...(descripcion  !== undefined && { descripcion }),
        ...(categoria    !== undefined && { categoria }),
        ...(monto        !== undefined && { monto: parseFloat(monto) }),
        ...(fecha        !== undefined && { fecha: new Date(fecha) }),
        ...(periodicidad !== undefined && { periodicidad }),
        ...(notas        !== undefined && { notas }),
        ...(responsable  !== undefined && { responsable }),
        ...(receptor     !== undefined && { receptor }),
      },
      include: { usuario: { select: { nombre: true } }, finca: { select: { nombre: true, ubicacion: true } } },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/:id", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const g = await prisma.gasto.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!g) return res.status(404).json({ error: "No encontrado" });
    await prisma.gasto.delete({ where: { id: g.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Subir prueba de pago (foto o documento)
router.post("/:id/media", upload.array("archivos", 5), async (req, res, next) => {
  try {
    const gasto = await prisma.gasto.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!gasto) return res.status(404).json({ error: "Gasto no encontrado" });
    if (!req.files?.length) return res.status(400).json({ error: "No se enviaron archivos" });

    const creados = await Promise.all(
      req.files.map(async (file) => {
        const { url, tipo } = await uploadMediaConTipo(file);
        return prisma.media.create({ data: { url, tipo, gastoId: gasto.id } });
      })
    );
    res.status(201).json(creados);
  } catch (err) { next(err); }
});

// Obtener pruebas de un pago
router.get("/:id/media", async (req, res, next) => {
  try {
    const gasto = await prisma.gasto.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!gasto) return res.status(404).json({ error: "Gasto no encontrado" });
    const media = await prisma.media.findMany({ where: { gastoId: gasto.id }, orderBy: { createdAt: "asc" } });
    res.json(media);
  } catch (err) { next(err); }
});

// Eliminar prueba
router.delete("/:id/media/:mediaId", async (req, res, next) => {
  try {
    const gasto = await prisma.gasto.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!gasto) return res.status(404).json({ error: "Gasto no encontrado" });
    const media = await prisma.media.findFirst({ where: { id: req.params.mediaId, gastoId: gasto.id } });
    if (!media) return res.status(404).json({ error: "Archivo no encontrado" });
    await prisma.media.delete({ where: { id: media.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
