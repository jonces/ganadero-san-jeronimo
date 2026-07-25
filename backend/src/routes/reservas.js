const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const logActividad = require("../lib/logActividad");

const router = express.Router();

router.use(requireAuth);

// GET /reservas — lista reservas activas de la finca
router.get("/", async (req, res, next) => {
  try {
    const reservas = await prisma.reserva.findMany({
      where: { fincaId: req.user.fincaId },
      include: {
        animal: {
          select: {
            id: true,
            identificador: true,
            nombre: true,
            raza: true,
            sexo: true,
            pesoActual: true,
            estadoComercial: true,
            media: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reservas);
  } catch (err) { next(err); }
});

// POST /reservas — crea reserva
router.post("/", async (req, res, next) => {
  try {
    const { animalId, cliente, telefono, identificacion, precioAcordado, adelanto, metodoPago, fechaVencimiento, notas } = req.body;
    if (!animalId || !cliente || !precioAcordado) {
      return res.status(400).json({ error: "animalId, cliente y precioAcordado son requeridos" });
    }

    const animal = await prisma.animal.findFirst({ where: { id: animalId, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    // Verificar que no haya una reserva ACTIVA para este animal
    const reservaActiva = await prisma.reserva.findFirst({
      where: { animalId, estado: "ACTIVA" },
    });
    if (reservaActiva) {
      return res.status(409).json({ error: "Este animal ya tiene una reserva activa" });
    }

    const reserva = await prisma.reserva.create({
      data: {
        animalId,
        cliente,
        telefono: telefono || null,
        identificacion: identificacion || null,
        precioAcordado: Number(precioAcordado),
        adelanto: adelanto ? Number(adelanto) : 0,
        metodoPago: metodoPago || "EFECTIVO",
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        notas: notas || null,
        fincaId: req.user.fincaId,
        responsableId: req.user.sub,
      },
    });

    // Cambiar estadoComercial del animal a RESERVADO
    await prisma.animal.update({
      where: { id: animalId },
      data: { estadoComercial: "RESERVADO" },
    });

    logActividad({ accion: "Registró reserva", detalle: `Animal: ${animal.identificador} - Cliente: ${cliente}`, modulo: "Inventario", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json(reserva);
  } catch (err) { next(err); }
});

// PATCH /reservas/:id/cancelar — cancela reserva
router.patch("/:id/cancelar", async (req, res, next) => {
  try {
    const reserva = await prisma.reserva.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });

    const { motivoCancelacion, adelantoDevuelto } = req.body;

    await prisma.reserva.update({
      where: { id: reserva.id },
      data: {
        estado: "CANCELADA",
        motivoCancelacion: motivoCancelacion || null,
        adelantoDevuelto: !!adelantoDevuelto,
      },
    });

    // Devolver estado comercial a EN_VENTA
    await prisma.animal.update({
      where: { id: reserva.animalId },
      data: { estadoComercial: "EN_VENTA" },
    });

    logActividad({ accion: "Canceló reserva", detalle: `Cliente: ${reserva.cliente}`, modulo: "Inventario", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PATCH /reservas/:id/completar — marca como completada
router.patch("/:id/completar", async (req, res, next) => {
  try {
    const reserva = await prisma.reserva.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });

    await prisma.reserva.update({
      where: { id: reserva.id },
      data: { estado: "COMPLETADA" },
    });

    logActividad({ accion: "Completó reserva", detalle: `Cliente: ${reserva.cliente}`, modulo: "Inventario", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
