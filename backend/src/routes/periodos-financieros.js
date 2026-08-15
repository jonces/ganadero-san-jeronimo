const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use(requireNoEsCampo);

// GET /api/periodos-financieros
router.get("/", async (req, res, next) => {
  try {
    const periodos = await prisma.periodoFinanciero.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    });
    res.json(periodos);
  } catch (err) { next(err); }
});

// POST /api/periodos-financieros/cerrar
router.post("/cerrar", async (req, res, next) => {
  try {
    const { anio, mes, tipo, notas } = req.body;
    if (!anio || mes === undefined) return res.status(400).json({ error: "anio y mes son requeridos" });

    const fincaId = req.user.fincaId;
    const anioN = parseInt(anio);
    const mesN = parseInt(mes);

    // Calcular snapshot del período
    const desde = new Date(anioN, mesN - 1, 1);
    const hasta = tipo === "ANUAL"
      ? new Date(anioN, 11, 31, 23, 59, 59)
      : new Date(anioN, mesN, 0, 23, 59, 59);

    const whereF = { fincaId, fecha: { gte: desde, lte: hasta } };
    const [ventas, gastos, prestamos, cxp] = await Promise.all([
      prisma.venta.findMany({ where: { ...whereF, estadoVenta: { not: "REVERSADA" } }, select: { precioNIO: true } }),
      prisma.gasto.findMany({ where: whereF, select: { monto: true } }),
      prisma.prestamo.findMany({ where: { fincaId, estado: "ACTIVO" }, select: { saldoActual: true } }),
      prisma.cuentaPorPagar.findMany({ where: { fincaId, estado: "PENDIENTE" }, select: { monto: true } }),
    ]);

    const ingresos = ventas.reduce((s, v) => s + v.precioNIO, 0);
    const gastosT = gastos.reduce((s, g) => s + g.monto, 0);
    const pasivos = prestamos.reduce((s, p) => s + Number(p.saldoActual), 0)
      + cxp.reduce((s, c) => s + c.monto, 0);

    const periodo = await prisma.periodoFinanciero.upsert({
      where: { fincaId_anio_mes_tipo: { fincaId, anio: anioN, mes: mesN, tipo: tipo || "MENSUAL" } },
      create: {
        fincaId, anio: anioN, mes: mesN, tipo: tipo || "MENSUAL",
        estado: "CERRADO",
        ingresos, gastos: gastosT, flujoNeto: ingresos - gastosT,
        pasivos, notas: notas || null,
        cerradoPor: req.user.sub, cerradoEn: new Date(),
      },
      update: {
        estado: "CERRADO",
        ingresos, gastos: gastosT, flujoNeto: ingresos - gastosT,
        pasivos, notas: notas || null,
        cerradoPor: req.user.sub, cerradoEn: new Date(),
      },
    });

    await prisma.auditoriaFinanciera.create({
      data: {
        fincaId, usuarioId: req.user.sub,
        entidad: "PeriodoFinanciero", entidadId: periodo.id,
        accion: "CERRAR",
        valorNuevo: { anio: anioN, mes: mesN, ingresos, gastos: gastosT },
      },
    });

    res.json(periodo);
  } catch (err) { next(err); }
});

// POST /api/periodos-financieros/:id/reabrir
router.post("/:id/reabrir", async (req, res, next) => {
  try {
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: "motivo es obligatorio para reabrir un período" });

    const periodo = await prisma.periodoFinanciero.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!periodo) return res.status(404).json({ error: "No encontrado" });
    if (periodo.estado !== "CERRADO") return res.status(400).json({ error: "El período no está cerrado" });

    // Solo ADMIN puede reabrir
    if (req.user.role === "TRABAJADOR") return res.status(403).json({ error: "No autorizado para reabrir períodos" });

    const actualizado = await prisma.periodoFinanciero.update({
      where: { id: periodo.id },
      data: { estado: "ABIERTO", reabiertoPor: req.user.sub, reabiertaEn: new Date(), motivoReapertura: motivo },
    });

    await prisma.auditoriaFinanciera.create({
      data: {
        fincaId: req.user.fincaId, usuarioId: req.user.sub,
        entidad: "PeriodoFinanciero", entidadId: periodo.id,
        accion: "REABRIR", motivo,
      },
    });

    res.json(actualizado);
  } catch (err) { next(err); }
});

// GET /api/periodos-financieros/verificar — está cerrado el período actual?
router.get("/verificar", async (req, res, next) => {
  try {
    const { anio, mes } = req.query;
    if (!anio || !mes) return res.json({ cerrado: false });
    const periodo = await prisma.periodoFinanciero.findFirst({
      where: { fincaId: req.user.fincaId, anio: parseInt(anio), mes: parseInt(mes), estado: "CERRADO" },
    });
    res.json({ cerrado: !!periodo, periodo });
  } catch (err) { next(err); }
});

module.exports = router;
