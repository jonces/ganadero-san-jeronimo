const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { uploadMedia } = require("../lib/storage");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.use(requireAuth);

// Listado de animales de la finca del usuario, con su último evento y media reciente
router.get("/", async (req, res) => {
  const animales = await prisma.animal.findMany({
    where: { fincaId: req.user.fincaId },
    orderBy: { createdAt: "desc" },
    include: {
      media: { orderBy: { createdAt: "desc" }, take: 5 },
      eventos: { orderBy: { fecha: "desc" }, take: 1 },
    },
  });
  res.json(animales);
});

router.get("/:id", async (req, res) => {
  const animal = await prisma.animal.findFirst({
    where: { id: req.params.id, fincaId: req.user.fincaId },
    include: {
      media: { orderBy: { createdAt: "desc" } },
      eventos: { orderBy: { fecha: "desc" }, include: { media: true, usuario: { select: { nombre: true } } } },
    },
  });
  if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
  res.json(animal);
});

router.post("/", async (req, res) => {
  const { identificador, nombre, raza, sexo, fechaNacimiento, pesoActual } = req.body;
  if (!identificador || !sexo) {
    return res.status(400).json({ error: "identificador y sexo son requeridos" });
  }

  const animal = await prisma.animal.create({
    data: {
      identificador,
      nombre,
      raza,
      sexo,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      pesoActual: pesoActual ? Number(pesoActual) : null,
      fincaId: req.user.fincaId,
    },
  });
  res.status(201).json(animal);
});

router.patch("/:id", async (req, res) => {
  const animal = await prisma.animal.findFirst({
    where: { id: req.params.id, fincaId: req.user.fincaId },
  });
  if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

  const { nombre, raza, pesoActual, estado } = req.body;
  const actualizado = await prisma.animal.update({
    where: { id: animal.id },
    data: { nombre, raza, pesoActual: pesoActual ? Number(pesoActual) : undefined, estado },
  });
  res.json(actualizado);
});

// Sube foto(s)/video(s) sueltos asociados directamente al animal (sin evento)
router.post("/:id/media", upload.array("archivos", 10), async (req, res) => {
  const animal = await prisma.animal.findFirst({
    where: { id: req.params.id, fincaId: req.user.fincaId },
  });
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
});

module.exports = router;
