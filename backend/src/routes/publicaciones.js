const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const logActividad = require("../lib/logActividad");

const router = express.Router();

// GET /publicaciones — lista publicaciones de la finca
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const pubs = await prisma.publicacionVenta.findMany({
      where: {
        animal: { fincaId: req.user.fincaId },
      },
      include: {
        animal: {
          select: {
            id: true,
            identificador: true,
            nombre: true,
            raza: true,
            sexo: true,
            fechaNacimiento: true,
            pesoActual: true,
            estadoComercial: true,
            estado: true,
            potrero: true,
            media: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(pubs);
  } catch (err) { next(err); }
});

// POST /publicaciones — crea publicación
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { animalId, precio, moneda, modalidad, precioPorUnidad, negociable, descripcion, publicada, contacto, whatsapp, ubicacion } = req.body;
    if (!animalId || !precio) return res.status(400).json({ error: "animalId y precio son requeridos" });

    const animal = await prisma.animal.findFirst({ where: { id: animalId, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    // Verificar que no exista una publicación activa
    const existente = await prisma.publicacionVenta.findUnique({ where: { animalId } });
    if (existente && existente.publicada) {
      return res.status(409).json({ error: "Este animal ya tiene una publicación activa" });
    }

    let pub;
    if (existente) {
      // Actualizar la existente
      pub = await prisma.publicacionVenta.update({
        where: { animalId },
        data: {
          precio: Number(precio),
          moneda: moneda || "NIO",
          modalidad: modalidad || "TOTAL",
          precioPorUnidad: precioPorUnidad ? Number(precioPorUnidad) : null,
          negociable: !!negociable,
          descripcion: descripcion || null,
          publicada: publicada !== false,
          fechaPublicacion: new Date(),
          contacto: contacto || null,
          whatsapp: whatsapp || null,
          ubicacion: ubicacion || null,
        },
      });
    } else {
      pub = await prisma.publicacionVenta.create({
        data: {
          animalId,
          precio: Number(precio),
          moneda: moneda || "NIO",
          modalidad: modalidad || "TOTAL",
          precioPorUnidad: precioPorUnidad ? Number(precioPorUnidad) : null,
          negociable: !!negociable,
          descripcion: descripcion || null,
          publicada: publicada !== false,
          fechaPublicacion: new Date(),
          contacto: contacto || null,
          whatsapp: whatsapp || null,
          ubicacion: ubicacion || null,
        },
      });
    }

    // Actualizar estado comercial del animal
    await prisma.animal.update({
      where: { id: animalId },
      data: { estadoComercial: "EN_VENTA" },
    });

    logActividad({ accion: "Publicó animal en venta", detalle: animal.identificador, modulo: "Inventario", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json(pub);
  } catch (err) { next(err); }
});

// PATCH /publicaciones/:id — actualiza publicación
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const pub = await prisma.publicacionVenta.findFirst({
      where: { id: req.params.id, animal: { fincaId: req.user.fincaId } },
    });
    if (!pub) return res.status(404).json({ error: "Publicación no encontrada" });

    const { precio, moneda, modalidad, precioPorUnidad, negociable, descripcion, publicada, contacto, whatsapp, ubicacion } = req.body;
    const data = {};
    if (precio !== undefined) data.precio = Number(precio);
    if (moneda !== undefined) data.moneda = moneda;
    if (modalidad !== undefined) data.modalidad = modalidad;
    if (precioPorUnidad !== undefined) data.precioPorUnidad = precioPorUnidad ? Number(precioPorUnidad) : null;
    if (negociable !== undefined) data.negociable = !!negociable;
    if (descripcion !== undefined) data.descripcion = descripcion || null;
    if (publicada !== undefined) data.publicada = !!publicada;
    if (contacto !== undefined) data.contacto = contacto || null;
    if (whatsapp !== undefined) data.whatsapp = whatsapp || null;
    if (ubicacion !== undefined) data.ubicacion = ubicacion || null;

    const actualizada = await prisma.publicacionVenta.update({ where: { id: pub.id }, data });
    res.json(actualizada);
  } catch (err) { next(err); }
});

// DELETE /publicaciones/:id — quita de venta
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const pub = await prisma.publicacionVenta.findFirst({
      where: { id: req.params.id, animal: { fincaId: req.user.fincaId } },
    });
    if (!pub) return res.status(404).json({ error: "Publicación no encontrada" });

    await prisma.publicacionVenta.update({
      where: { id: pub.id },
      data: { publicada: false },
    });
    await prisma.animal.update({
      where: { id: pub.animalId },
      data: { estadoComercial: "NO_DISPONIBLE" },
    });

    logActividad({ accion: "Quitó animal de venta", detalle: pub.animalId, modulo: "Inventario", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /publicaciones/publica/:fincaSlug — endpoint público
router.get("/publica/:fincaSlug", async (req, res, next) => {
  try {
    // Buscar finca por nombre o id (usamos fincaSlug como nombre parcial)
    const finca = await prisma.finca.findFirst({
      where: {
        OR: [
          { id: req.params.fincaSlug },
          { nombre: { contains: req.params.fincaSlug, mode: "insensitive" } },
        ],
      },
    });
    if (!finca) return res.status(404).json({ error: "Finca no encontrada" });

    const pubs = await prisma.publicacionVenta.findMany({
      where: {
        publicada: true,
        animal: { fincaId: finca.id, estado: "ACTIVO" },
      },
      include: {
        animal: {
          select: {
            id: true,
            identificador: true,
            nombre: true,
            raza: true,
            sexo: true,
            fechaNacimiento: true,
            pesoActual: true,
            estadoComercial: true,
            media: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(pubs);
  } catch (err) { next(err); }
});

module.exports = router;
