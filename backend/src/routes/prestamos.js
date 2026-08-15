const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use(requireNoEsCampo);

async function auditar(fincaId, usuarioId, entidadId, accion, anterior, nuevo, motivo) {
  try {
    await prisma.auditoriaFinanciera.create({
      data: { fincaId, usuarioId, entidad: "Prestamo", entidadId, accion, valorAnterior: anterior, valorNuevo: nuevo, motivo },
    });
  } catch {}
}

// GET /api/prestamos
router.get("/", async (req, res, next) => {
  try {
    const { estado } = req.query;
    const prestamos = await prisma.prestamo.findMany({
      where: { fincaId: req.user.fincaId, ...(estado && { estado }) },
      orderBy: { createdAt: "desc" },
      include: {
        cuotas: {
          where: { estado: "PENDIENTE" },
          orderBy: { fechaVence: "asc" },
          take: 3,
        },
      },
    });
    res.json(prestamos);
  } catch (err) { next(err); }
});

// POST /api/prestamos
router.post("/", async (req, res, next) => {
  try {
    const {
      acreedor, institucion, tipo, referencia, fechaInicio, montoOriginal, moneda,
      tasaInteres, tipoTasa, plazoMeses, cuotaMensual, frecuencia,
      proximaCuota, vencimiento, garantia, proposito, documentoUrl, notas,
    } = req.body;
    if (!acreedor || !montoOriginal || !fechaInicio)
      return res.status(400).json({ error: "acreedor, montoOriginal y fechaInicio son requeridos" });
    const montoD = parseFloat(montoOriginal);
    const prestamo = await prisma.prestamo.create({
      data: {
        fincaId: req.user.fincaId,
        acreedor, institucion: institucion || null,
        tipo: tipo || "OTRO", referencia: referencia || null,
        fechaInicio: new Date(fechaInicio),
        montoOriginal: montoD, moneda: moneda || "NIO",
        saldoActual: montoD,
        tasaInteres: tasaInteres ? parseFloat(tasaInteres) : null,
        tipoTasa: tipoTasa || null,
        plazoMeses: plazoMeses ? parseInt(plazoMeses) : null,
        cuotaMensual: cuotaMensual ? parseFloat(cuotaMensual) : null,
        frecuencia: frecuencia || "MENSUAL",
        proximaCuota: proximaCuota ? new Date(proximaCuota) : null,
        vencimiento: vencimiento ? new Date(vencimiento) : null,
        garantia: garantia || null,
        proposito: proposito || null,
        documentoUrl: documentoUrl || null,
        notas: notas || null,
      },
    });
    await auditar(req.user.fincaId, req.user.sub, prestamo.id, "CREAR", null, prestamo, null);
    res.status(201).json(prestamo);
  } catch (err) { next(err); }
});

// PATCH /api/prestamos/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const anterior = await prisma.prestamo.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!anterior) return res.status(404).json({ error: "No encontrado" });
    const campos = ["acreedor","institucion","tipo","referencia","garantia","proposito","documentoUrl","notas","estado","frecuencia","tipoTasa"];
    const data = {};
    campos.forEach(c => { if (req.body[c] !== undefined) data[c] = req.body[c]; });
    if (req.body.tasaInteres !== undefined) data.tasaInteres = parseFloat(req.body.tasaInteres);
    if (req.body.cuotaMensual !== undefined) data.cuotaMensual = parseFloat(req.body.cuotaMensual);
    if (req.body.saldoActual !== undefined) data.saldoActual = parseFloat(req.body.saldoActual);
    if (req.body.plazoMeses !== undefined) data.plazoMeses = parseInt(req.body.plazoMeses);
    if (req.body.proximaCuota) data.proximaCuota = new Date(req.body.proximaCuota);
    if (req.body.vencimiento) data.vencimiento = new Date(req.body.vencimiento);
    const actualizado = await prisma.prestamo.update({ where: { id: req.params.id }, data });
    await auditar(req.user.fincaId, req.user.sub, actualizado.id, "MODIFICAR", anterior, actualizado, null);
    res.json(actualizado);
  } catch (err) { next(err); }
});

// POST /api/prestamos/:id/pago
router.post("/:id/pago", async (req, res, next) => {
  try {
    const prestamo = await prisma.prestamo.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!prestamo) return res.status(404).json({ error: "No encontrado" });
    const { monto, cuentaId, cuotaId, concepto } = req.body;
    const montoD = parseFloat(monto);
    if (!montoD || montoD <= 0) return res.status(400).json({ error: "Monto inválido" });

    const nuevoSaldo = Math.max(0, Number(prestamo.saldoActual) - montoD);
    const nuevoEstado = nuevoSaldo === 0 ? "PAGADO" : "ACTIVO";

    await prisma.$transaction(async (tx) => {
      await tx.prestamo.update({
        where: { id: prestamo.id },
        data: { saldoActual: nuevoSaldo, estado: nuevoEstado },
      });
      if (cuotaId) {
        await tx.cuotaPrestamo.update({
          where: { id: cuotaId },
          data: { estado: "PAGADA", fechaPago: new Date() },
        });
      }
      // Registrar movimiento financiero
      const mov = await tx.movimientoFinanciero.create({
        data: {
          fincaId: req.user.fincaId,
          cuentaId: cuentaId || null,
          tipo: "EGRESO",
          categoria: "PAGO_PRESTAMO",
          concepto: concepto || `Pago préstamo: ${prestamo.acreedor}`,
          monto: montoD,
          moneda: prestamo.moneda,
          sourceType: "PAGO_PRESTAMO",
          sourceId: prestamo.id,
          usuarioId: req.user.sub,
          fecha: new Date(),
        },
      });
      if (cuentaId) {
        await tx.cuentaFinanciera.update({
          where: { id: cuentaId },
          data: { saldoActual: { decrement: montoD } },
        });
      }
    });
    res.json({ ok: true, nuevoSaldo, estado: nuevoEstado });
  } catch (err) { next(err); }
});

// GET /api/prestamos/resumen
router.get("/resumen/totales", async (req, res, next) => {
  try {
    const prestamos = await prisma.prestamo.findMany({
      where: { fincaId: req.user.fincaId, estado: "ACTIVO" },
      select: { saldoActual: true, cuotaMensual: true, moneda: true, acreedor: true, proximaCuota: true },
    });
    const totalDeuda = prestamos.reduce((s, p) => s + Number(p.saldoActual), 0);
    const totalCuotaMensual = prestamos.reduce((s, p) => s + Number(p.cuotaMensual || 0), 0);
    const proximos = prestamos
      .filter(p => p.proximaCuota)
      .sort((a, b) => new Date(a.proximaCuota) - new Date(b.proximaCuota))
      .slice(0, 5);
    res.json({ cantidad: prestamos.length, totalDeuda, totalCuotaMensual, proximos });
  } catch (err) { next(err); }
});

// POST /api/prestamos/:id/cuotas - generar cronograma
router.post("/:id/cuotas", async (req, res, next) => {
  try {
    const prestamo = await prisma.prestamo.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!prestamo) return res.status(404).json({ error: "No encontrado" });
    const { cuotas } = req.body; // array de {numeroCuota, fechaVence, capital, interes, otrosCargos}
    if (!Array.isArray(cuotas) || cuotas.length === 0)
      return res.status(400).json({ error: "cuotas es requerido" });

    await prisma.cuotaPrestamo.deleteMany({ where: { prestamoId: prestamo.id, estado: "PENDIENTE" } });
    let saldo = Number(prestamo.saldoActual);
    const data = cuotas.map(c => {
      const capital = parseFloat(c.capital) || 0;
      const interes = parseFloat(c.interes) || 0;
      const otros = parseFloat(c.otrosCargos) || 0;
      const total = capital + interes + otros;
      saldo = Math.max(0, saldo - capital);
      return {
        prestamoId: prestamo.id,
        numeroCuota: c.numeroCuota,
        fechaVence: new Date(c.fechaVence),
        capital, interes, otrosCargos: otros, total, saldo,
        estado: "PENDIENTE",
      };
    });
    await prisma.cuotaPrestamo.createMany({ data });
    res.status(201).json({ creadas: data.length });
  } catch (err) { next(err); }
});

// GET /api/prestamos/:id/cuotas
router.get("/:id/cuotas", async (req, res, next) => {
  try {
    const cuotas = await prisma.cuotaPrestamo.findMany({
      where: { prestamoId: req.params.id },
      orderBy: { numeroCuota: "asc" },
    });
    res.json(cuotas);
  } catch (err) { next(err); }
});

module.exports = router;
