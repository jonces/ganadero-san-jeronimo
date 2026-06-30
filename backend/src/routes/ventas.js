const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadMedia } = require("../lib/storage");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const ventas = await prisma.venta.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: { fecha: "desc" },
      include: {
        animal: { select: { identificador: true, nombre: true, raza: true } },
        usuario: { select: { nombre: true } },
        media: true,
      },
    });
    res.json(ventas);
  } catch (err) { next(err); }
});

router.get("/stats", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const [
      totalAnimales, machos, hembras, activos, vendidos,
      ventasMes, todasVentas, vacunasPendientes, pesoPromedio,
      finca,
    ] = await Promise.all([
      prisma.animal.count({ where: { fincaId } }),
      prisma.animal.count({ where: { fincaId, sexo: "MACHO" } }),
      prisma.animal.count({ where: { fincaId, sexo: "HEMBRA" } }),
      prisma.animal.count({ where: { fincaId, estado: "ACTIVO" } }),
      prisma.animal.count({ where: { fincaId, estado: "VENDIDO" } }),
      prisma.venta.findMany({ where: { fincaId, fecha: { gte: inicioMes } } }),
      prisma.venta.findMany({ where: { fincaId } }),
      prisma.evento.count({ where: { animal: { fincaId }, tipo: "VACUNACION", fecha: { gte: inicioMes } } }),
      prisma.animal.aggregate({ where: { fincaId, estado: "ACTIVO", pesoActual: { gt: 0 } }, _avg: { pesoActual: true } }),
      prisma.finca.findUnique({ where: { id: fincaId } }),
    ]);

    const totalVentasMesNIO = ventasMes.reduce((s, v) => s + v.precioNIO, 0);
    const totalVentasMesUSD = ventasMes.reduce((s, v) => s + v.precioUSD, 0);
    const totalHistoricoNIO = todasVentas.reduce((s, v) => s + v.precioNIO, 0);

    res.json({
      animales: { total: totalAnimales, machos, hembras, activos, vendidos },
      ventas: {
        cantidadMes: ventasMes.length,
        totalMesNIO: totalVentasMesNIO,
        totalMesUSD: totalVentasMesUSD,
        totalHistoricoNIO,
      },
      vacunasMes: vacunasPendientes,
      pesoPromedio: pesoPromedio._avg.pesoActual || 0,
      tipoCambio: finca?.tipoCambio || 36.5,
    });
  } catch (err) { next(err); }
});

router.post("/", upload.array("archivos", 10), async (req, res, next) => {
  try {
    const {
      animalId, tipoVenta, moneda, precioOriginal,
      pesoKg, precioKg, metodoPago, estadoPago,
      numeroFactura, comision, descuento, impuestos,
      comprador, telefonoComprador, direccionComprador, notas, fecha,
    } = req.body;

    if (!animalId || !tipoVenta || !precioOriginal) {
      return res.status(400).json({ error: "animalId, tipoVenta y precio son requeridos" });
    }

    const animal = await prisma.animal.findFirst({ where: { id: animalId, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    const finca = await prisma.finca.findUnique({ where: { id: req.user.fincaId } });
    const tc = finca?.tipoCambio || 36.5;
    const precio = Number(precioOriginal);
    const precioNIO = moneda === "USD" ? precio * tc : precio;
    const precioUSD = moneda === "USD" ? precio : precio / tc;

    const venta = await prisma.venta.create({
      data: {
        animalId,
        tipoVenta,
        moneda: moneda || "NIO",
        tipoCambio: tc,
        precioNIO,
        precioUSD,
        pesoKg: pesoKg ? Number(pesoKg) : null,
        unidadPeso: req.body.unidadPeso || "LB",
        precioKg: precioKg ? Number(precioKg) : null,
        metodoPago: metodoPago || "EFECTIVO",
        estadoPago: estadoPago || "PAGADO",
        numeroFactura,
        comision: comision ? Number(comision) : null,
        descuento: descuento ? Number(descuento) : null,
        impuestos: impuestos ? Number(impuestos) : null,
        comprador,
        telefonoComprador,
        direccionComprador,
        notas,
        fecha: fecha ? new Date(fecha) : undefined,
        fincaId: req.user.fincaId,
        usuarioId: req.user.sub,
      },
      include: { animal: { select: { identificador: true, nombre: true, raza: true } } },
    });

    await prisma.animal.update({ where: { id: animalId }, data: { estado: "VENDIDO" } });

    if (req.files?.length) {
      await Promise.all(req.files.map(async (file) => {
        const url = await uploadMedia(file);
        const tipo = file.mimetype.startsWith("video") ? "VIDEO" : "FOTO";
        return prisma.media.create({ data: { url, tipo, ventaId: venta.id } });
      }));
    }

    res.status(201).json(venta);
  } catch (err) { next(err); }
});

router.patch("/tipo-cambio", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const { tipoCambio } = req.body;
    if (!tipoCambio) return res.status(400).json({ error: "tipoCambio requerido" });
    const finca = await prisma.finca.update({
      where: { id: req.user.fincaId },
      data: { tipoCambio: Number(tipoCambio) },
    });
    res.json({ tipoCambio: finca.tipoCambio });
  } catch (err) { next(err); }
});

module.exports = router;
