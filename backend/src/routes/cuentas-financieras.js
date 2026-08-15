const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");
const logActividad = require("../lib/logActividad");

const router = express.Router();
router.use(requireAuth);
router.use(requireNoEsCampo);

async function auditar(fincaId, usuarioId, entidad, entidadId, accion, valorAnterior, valorNuevo, motivo) {
  try {
    await prisma.auditoriaFinanciera.create({
      data: { fincaId, usuarioId, entidad, entidadId, accion, valorAnterior, valorNuevo, motivo },
    });
  } catch {}
}

// GET /api/cuentas-financieras
router.get("/", async (req, res, next) => {
  try {
    const cuentas = await prisma.cuentaFinanciera.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: { createdAt: "asc" },
    });
    res.json(cuentas);
  } catch (err) { next(err); }
});

// POST /api/cuentas-financieras
router.post("/", async (req, res, next) => {
  try {
    const { nombre, tipo, banco, moneda, ultimosCuatro, saldoInicial, notas } = req.body;
    if (!nombre || !tipo) return res.status(400).json({ error: "nombre y tipo son requeridos" });
    const saldo = parseFloat(saldoInicial) || 0;
    const cuenta = await prisma.cuentaFinanciera.create({
      data: {
        fincaId: req.user.fincaId,
        nombre, tipo, banco: banco || null,
        moneda: moneda || "NIO",
        ultimosCuatro: ultimosCuatro || null,
        saldoInicial: saldo,
        saldoActual: saldo,
        notas: notas || null,
      },
    });
    await auditar(req.user.fincaId, req.user.sub, "CuentaFinanciera", cuenta.id, "CREAR", null, cuenta, null);
    res.status(201).json(cuenta);
  } catch (err) { next(err); }
});

// PATCH /api/cuentas-financieras/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const anterior = await prisma.cuentaFinanciera.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!anterior) return res.status(404).json({ error: "No encontrado" });
    const { nombre, banco, moneda, ultimosCuatro, estado, notas } = req.body;
    const actualizado = await prisma.cuentaFinanciera.update({
      where: { id: req.params.id },
      data: {
        ...(nombre && { nombre }),
        ...(banco !== undefined && { banco }),
        ...(moneda && { moneda }),
        ...(ultimosCuatro !== undefined && { ultimosCuatro }),
        ...(estado && { estado }),
        ...(notas !== undefined && { notas }),
      },
    });
    await auditar(req.user.fincaId, req.user.sub, "CuentaFinanciera", actualizado.id, "MODIFICAR", anterior, actualizado, null);
    res.json(actualizado);
  } catch (err) { next(err); }
});

// GET /api/cuentas-financieras/:id/movimientos
router.get("/:id/movimientos", async (req, res, next) => {
  try {
    const cuenta = await prisma.cuentaFinanciera.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!cuenta) return res.status(404).json({ error: "No encontrado" });
    const movs = await prisma.movimientoFinanciero.findMany({
      where: { cuentaId: req.params.id, anulado: false },
      orderBy: { fecha: "desc" },
      take: 100,
    });
    res.json(movs);
  } catch (err) { next(err); }
});

// POST /api/cuentas-financieras/transferencia
router.post("/transferencia", async (req, res, next) => {
  try {
    const { cuentaOrigenId, cuentaDestinoId, monto, moneda, concepto } = req.body;
    if (!cuentaOrigenId || !cuentaDestinoId || !monto)
      return res.status(400).json({ error: "Faltan campos requeridos" });
    if (cuentaOrigenId === cuentaDestinoId)
      return res.status(400).json({ error: "Origen y destino deben ser diferentes" });
    const montoD = parseFloat(monto);
    if (isNaN(montoD) || montoD <= 0) return res.status(400).json({ error: "Monto inválido" });

    const [origen, destino] = await Promise.all([
      prisma.cuentaFinanciera.findFirst({ where: { id: cuentaOrigenId, fincaId: req.user.fincaId } }),
      prisma.cuentaFinanciera.findFirst({ where: { id: cuentaDestinoId, fincaId: req.user.fincaId } }),
    ]);
    if (!origen || !destino) return res.status(404).json({ error: "Cuenta no encontrada" });

    const [transferencia] = await prisma.$transaction([
      prisma.transferenciaInterna.create({
        data: {
          fincaId: req.user.fincaId,
          cuentaOrigenId, cuentaDestinoId,
          monto: montoD, moneda: moneda || "NIO",
          concepto: concepto || "Transferencia interna",
          usuarioId: req.user.sub,
        },
      }),
      prisma.cuentaFinanciera.update({
        where: { id: cuentaOrigenId },
        data: { saldoActual: { decrement: montoD } },
      }),
      prisma.cuentaFinanciera.update({
        where: { id: cuentaDestinoId },
        data: { saldoActual: { increment: montoD } },
      }),
    ]);

    await auditar(req.user.fincaId, req.user.sub, "TransferenciaInterna", transferencia.id, "CREAR",
      null, { monto: montoD, origen: origen.nombre, destino: destino.nombre }, null);
    res.status(201).json(transferencia);
  } catch (err) { next(err); }
});

module.exports = router;
