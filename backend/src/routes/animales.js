const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadMedia } = require("../lib/storage");
const logActividad = require("../lib/logActividad");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.use(requireAuth);

const includeAnimal = {
  media: { orderBy: { createdAt: "desc" }, take: 5 },
  eventos: { orderBy: { fecha: "desc" }, take: 1 },
};

router.get("/", async (req, res, next) => {
  try {
    const animales = await prisma.animal.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: { createdAt: "desc" },
      include: includeAnimal,
    });
    res.json(animales);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
      include: {
        media: { orderBy: { createdAt: "desc" } },
        eventos: { orderBy: { fecha: "desc" }, include: { media: true, usuario: { select: { nombre: true } } } },
      },
    });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
    res.json(animal);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { identificador, nombre, raza, fierro, sexo, fechaNacimiento, pesoActual, observacion, estadoReproductivo, madreId } = req.body;
    if (!identificador || !sexo) return res.status(400).json({ error: "identificador y sexo son requeridos" });

    const animal = await prisma.animal.create({
      data: {
        identificador,
        nombre: nombre || null,
        raza: raza || null,
        fierro: fierro || null,
        sexo,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        pesoActual: pesoActual ? Number(pesoActual) : null,
        observacion: observacion || null,
        ...(sexo === "HEMBRA" && estadoReproductivo ? { estadoReproductivo } : {}),
        ...(madreId ? { madreId } : {}),
        fincaId: req.user.fincaId,
      },
      include: includeAnimal,
    });

    logActividad({ accion: "Registró animal", detalle: `${identificador} - ${nombre || ""}`, modulo: "Animales", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json(animal);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    const { nombre, raza, fierro, pesoActual, estado, estadoReproductivo, fechaParto, fechaSecado, madreId, observacion } = req.body;

    const str = (v) => (v === "" || v === undefined) ? null : v;
    const data = {};
    if (nombre !== undefined) data.nombre = str(nombre);
    if (raza !== undefined) data.raza = str(raza);
    if (fierro !== undefined) data.fierro = str(fierro);
    if (pesoActual !== undefined) data.pesoActual = pesoActual ? Number(pesoActual) : null;
    if (observacion !== undefined) data.observacion = str(observacion);
    if (madreId !== undefined) data.madreId = madreId || null;
    if (fechaParto !== undefined) data.fechaParto = fechaParto ? new Date(fechaParto) : null;
    if (fechaSecado !== undefined) data.fechaSecado = fechaSecado ? new Date(fechaSecado) : null;

    // Transición de estado reproductivo con lógica automática
    if (estadoReproductivo !== undefined && animal.sexo === "HEMBRA") {
      data.estadoReproductivo = estadoReproductivo;
      // Si pasa a PARIDA, registrar fecha de parto
      if (estadoReproductivo === "PARIDA" && !animal.fechaParto) {
        data.fechaParto = new Date();
        // Auto-transicionar a LACTANCIA
        data.estadoReproductivo = "LACTANCIA";
      }
      if (estadoReproductivo === "SECA") {
        data.fechaSecado = new Date();
      }
    }

    // Si se vende, limpiar estado reproductivo del conteo activo
    if (estado !== undefined) {
      data.estado = estado;
      if (estado === "VENDIDO") {
        logActividad({ accion: "Marcó animal como vendido", detalle: animal.identificador, modulo: "Animales", fincaId: req.user.fincaId, usuarioId: req.user.sub });
      }
    }

    const actualizado = await prisma.animal.update({ where: { id: animal.id }, data, include: includeAnimal });
    res.json(actualizado);
  } catch (err) { next(err); }
});

// Registrar parto — crea cría y actualiza madre automáticamente
router.post("/:id/parto", async (req, res, next) => {
  try {
    const madre = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!madre) return res.status(404).json({ error: "Animal no encontrado" });
    if (madre.sexo !== "HEMBRA") return res.status(400).json({ error: "Solo hembras pueden parir" });

    const { identificadorCria, nombreCria, sexoCria, pesoNacimiento } = req.body;
    if (!identificadorCria || !sexoCria) return res.status(400).json({ error: "identificadorCria y sexoCria son requeridos" });

    // Actualizar madre: PARIDA → LACTANCIA + fecha de parto
    const madreActualizada = await prisma.animal.update({
      where: { id: madre.id },
      data: { estadoReproductivo: "LACTANCIA", fechaParto: new Date() },
    });

    // Crear la cría
    const cria = await prisma.animal.create({
      data: {
        identificador: identificadorCria,
        nombre: nombreCria || null,
        sexo: sexoCria,
        pesoActual: pesoNacimiento ? Number(pesoNacimiento) : null,
        madreId: madre.id,
        fincaId: req.user.fincaId,
        estadoReproductivo: sexoCria === "HEMBRA" ? "VACIA" : null,
      },
      include: includeAnimal,
    });

    logActividad({ accion: "Registró parto", detalle: `Madre: ${madre.identificador} → Cría: ${identificadorCria}`, modulo: "Animales", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json({ madre: madreActualizada, cria });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
    await prisma.animal.delete({ where: { id: animal.id } });
    logActividad({ accion: "Eliminó animal", detalle: animal.identificador, modulo: "Animales", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post("/:id/media", upload.array("archivos", 10), async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
    if (!req.files?.length) return res.status(400).json({ error: "No se enviaron archivos" });

    const creados = await Promise.all(
      req.files.map(async (file) => {
        const url = await uploadMedia(file);
        const tipo = file.mimetype.startsWith("video") ? "VIDEO" : "FOTO";
        return prisma.media.create({ data: { url, tipo, animalId: animal.id } });
      })
    );
    res.status(201).json(creados);
  } catch (err) { next(err); }
});

router.delete("/:id/media/:mediaId", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
    const media = await prisma.media.findFirst({ where: { id: req.params.mediaId, animalId: animal.id } });
    if (!media) return res.status(404).json({ error: "Archivo no encontrado" });
    await prisma.media.delete({ where: { id: media.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
