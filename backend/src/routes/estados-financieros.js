const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use(requireNoEsCampo);

function rangoFechas(desde, hasta) {
  return {
    gte: desde ? new Date(desde + "T00:00:00") : new Date(new Date().getFullYear(), 0, 1),
    lte: hasta ? new Date(hasta + "T23:59:59") : new Date(),
  };
}

// GET /api/estados-financieros/resumen - datos para el dashboard de finanzas
router.get("/resumen", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const [cuentas, prestamos, cxp, animales, activosFijos, finca] = await Promise.all([
      prisma.cuentaFinanciera.findMany({ where: { fincaId, estado: "ACTIVA" }, select: { tipo: true, saldoActual: true, moneda: true } }),
      prisma.prestamo.findMany({ where: { fincaId, estado: "ACTIVO" }, select: { saldoActual: true, moneda: true } }),
      prisma.cuentaPorPagar.findMany({ where: { fincaId, estado: "PENDIENTE" }, select: { monto: true } }),
      prisma.animal.findMany({ where: { fincaId, estado: "ACTIVO" }, select: { costoCompra: true, pesoActual: true } }),
      prisma.activoFijo.findMany({ where: { fincaId, estado: "ACTIVO" }, select: { valorActual: true, costoAdquisicion: true } }),
      prisma.finca.findUnique({ where: { id: fincaId }, select: { precioLibra: true, tipoCambio: true } }),
    ]);

    const caja = cuentas.filter(c => c.tipo === "CAJA" || c.tipo === "CAJA_CHICA").reduce((s, c) => s + Number(c.saldoActual), 0);
    const bancos = cuentas.filter(c => c.tipo === "BANCO").reduce((s, c) => s + Number(c.saldoActual), 0);
    const totalDeudas = prestamos.reduce((s, p) => s + Number(p.saldoActual), 0);
    const totalCxP = cxp.reduce((s, c) => s + c.monto, 0);
    const valorGanado = animales.reduce((s, a) => {
      if (a.pesoActual && finca?.precioLibra) return s + (a.pesoActual * finca.precioLibra);
      return s + Number(a.costoCompra || 0);
    }, 0);
    const valorActivosFijos = activosFijos.reduce((s, a) => s + Number(a.valorActual || a.costoAdquisicion || 0), 0);

    const activosCorrientes = caja + bancos;
    const activosBiologicos = valorGanado;
    const activosFijosTotal = valorActivosFijos;
    const totalActivos = activosCorrientes + activosBiologicos + activosFijosTotal;
    const totalPasivos = totalDeudas + totalCxP;
    const patrimonioNeto = totalActivos - totalPasivos;

    res.json({
      caja, bancos, totalDeudas, totalCxP,
      valorGanado, valorActivosFijos,
      activosCorrientes, activosBiologicos, activosFijosTotal,
      totalActivos, totalPasivos, patrimonioNeto,
      cantidadAnimales: animales.length,
      tipoCambio: finca?.tipoCambio || 36.5,
    });
  } catch (err) { next(err); }
});

// GET /api/estados-financieros/resultados
router.get("/resultados", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const { desde, hasta } = req.query;
    const rango = rangoFechas(desde, hasta);
    const whereF = { fincaId, fecha: rango };

    const [ventas, gastos, compras] = await Promise.all([
      prisma.venta.findMany({ where: { ...whereF, estadoVenta: { not: "REVERSADA" } }, select: { precioNIO: true, animal: { select: { nombre: true, identificador: true } } } }),
      prisma.gasto.findMany({ where: whereF, select: { monto: true, categoria: true, descripcion: true } }),
      prisma.compra.findMany({ where: whereF, select: { total: true, tipo: true, descripcion: true } }),
    ]);

    const ingresoVentas = ventas.reduce((s, v) => s + v.precioNIO, 0);

    // Costos directos: compras de ANIMAL, INSUMO, y gastos de producción
    const categoriasCosto = ["ALIMENTACION", "MEDICAMENTO", "VETERINARIA", "VACUNA", "TRANSPORTE"];
    const costosDirectos = gastos.filter(g => categoriasCosto.includes(g.categoria)).reduce((s, g) => s + g.monto, 0)
      + compras.reduce((s, c) => s + c.total, 0);

    const gastosOp = gastos.filter(g => !categoriasCosto.includes(g.categoria)).reduce((s, g) => s + g.monto, 0);
    const totalGastos = costosDirectos + gastosOp;
    const margenBruto = ingresoVentas - costosDirectos;
    const resultadoOperativo = margenBruto - gastosOp;

    const porCategoriaGastos = {};
    gastos.forEach(g => { porCategoriaGastos[g.categoria] = (porCategoriaGastos[g.categoria] || 0) + g.monto; });

    res.json({
      ingresoVentas, costosDirectos, gastosOp, totalGastos,
      margenBruto, resultadoOperativo,
      porCategoriaGastos,
      cantidadVentas: ventas.length,
    });
  } catch (err) { next(err); }
});

// GET /api/estados-financieros/balance
router.get("/balance", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const [cuentas, prestamos, cxp, animales, activosFijos, finca] = await Promise.all([
      prisma.cuentaFinanciera.findMany({ where: { fincaId, estado: "ACTIVA" } }),
      prisma.prestamo.findMany({ where: { fincaId } }),
      prisma.cuentaPorPagar.findMany({ where: { fincaId } }),
      prisma.animal.findMany({ where: { fincaId, estado: "ACTIVO" }, select: { costoCompra: true, pesoActual: true, nombre: true, identificador: true } }),
      prisma.activoFijo.findMany({ where: { fincaId, estado: "ACTIVO" } }),
      prisma.finca.findUnique({ where: { id: fincaId }, select: { precioLibra: true, tipoCambio: true } }),
    ]);

    const cajas = cuentas.filter(c => c.tipo !== "BANCO");
    const bancosCuentas = cuentas.filter(c => c.tipo === "BANCO");
    const totalCaja = cajas.reduce((s, c) => s + Number(c.saldoActual), 0);
    const totalBancos = bancosCuentas.reduce((s, c) => s + Number(c.saldoActual), 0);
    const totalCxPendiente = cxp.filter(c => c.estado === "PENDIENTE").reduce((s, c) => s + c.monto, 0);

    const valorGanado = animales.reduce((s, a) => {
      if (a.pesoActual && finca?.precioLibra) return s + (a.pesoActual * finca.precioLibra);
      return s + Number(a.costoCompra || 0);
    }, 0);
    const valorActivosFijosT = activosFijos.filter(a => a.estado === "ACTIVO").reduce((s, a) => s + Number(a.valorActual || a.costoAdquisicion || 0), 0);

    const prestamosActivos = prestamos.filter(p => p.estado === "ACTIVO");
    const prestamosLargoPlazo = prestamosActivos.filter(p => p.plazoMeses && p.plazoMeses > 12);
    const prestamosCortoPlazo = prestamosActivos.filter(p => !p.plazoMeses || p.plazoMeses <= 12);
    const totalDeudaCP = prestamosCortoPlazo.reduce((s, p) => s + Number(p.saldoActual), 0);
    const totalDeudaLP = prestamosLargoPlazo.reduce((s, p) => s + Number(p.saldoActual), 0);

    const activosCorrientes = totalCaja + totalBancos;
    const totalActivos = activosCorrientes + valorGanado + valorActivosFijosT;
    const totalPasivos = totalCxPendiente + totalDeudaCP + totalDeudaLP;
    const patrimonio = totalActivos - totalPasivos;
    const ecuacionCuadra = Math.abs(totalActivos - (totalPasivos + patrimonio)) < 0.01;

    res.json({
      activos: {
        corrientes: { cajas: totalCaja, bancos: totalBancos, total: activosCorrientes, detalleCajas: cajas, detalleBancos: bancosCuentas },
        biologicos: { ganado: valorGanado, cantidadAnimales: animales.length },
        fijos: { total: valorActivosFijosT, detalle: activosFijos.filter(a => a.estado === "ACTIVO") },
        total: totalActivos,
      },
      pasivos: {
        corrientes: { cxp: totalCxPendiente, deudaCP: totalDeudaCP, total: totalCxPendiente + totalDeudaCP, detalleCxP: cxp.filter(c => c.estado === "PENDIENTE") },
        largoPlazo: { deudaLP: totalDeudaLP, total: totalDeudaLP, detalle: prestamosLargoPlazo },
        total: totalPasivos,
      },
      patrimonio,
      ecuacionCuadra,
    });
  } catch (err) { next(err); }
});

// GET /api/estados-financieros/flujo-efectivo
router.get("/flujo-efectivo", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const { desde, hasta } = req.query;

    const ahora = new Date();
    const hace12 = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
    const rango = { gte: desde ? new Date(desde + "T00:00:00") : hace12, lte: hasta ? new Date(hasta + "T23:59:59") : ahora };
    const whereF = { fincaId, fecha: rango };

    const [ventas, gastos, transferencias] = await Promise.all([
      prisma.venta.findMany({ where: { ...whereF, estadoVenta: { not: "REVERSADA" } }, select: { fecha: true, precioNIO: true } }),
      prisma.gasto.findMany({ where: whereF, select: { fecha: true, monto: true, categoria: true } }),
      prisma.movimientoFinanciero.findMany({ where: { ...whereF, sourceType: { not: "TRANSFERENCIA" }, anulado: false }, select: { fecha: true, monto: true, tipo: true, categoria: true } }),
    ]);

    // Agrupar por mes
    const mesesMap = {};
    const addToMes = (fecha, tipo, monto) => {
      const d = new Date(fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!mesesMap[key]) mesesMap[key] = { mes: key, entradas: 0, salidas: 0 };
      if (tipo === "INGRESO") mesesMap[key].entradas += monto;
      else mesesMap[key].salidas += monto;
    };

    ventas.forEach(v => addToMes(v.fecha, "INGRESO", v.precioNIO));
    gastos.forEach(g => addToMes(g.fecha, "EGRESO", g.monto));
    // Solo movimientos manuales que no sean de ventas/gastos ya contados
    transferencias.filter(m => m.sourceType === "MANUAL").forEach(m => addToMes(m.fecha, m.tipo, Number(m.monto)));

    const meses = Object.values(mesesMap).sort((a, b) => a.mes.localeCompare(b.mes));
    let saldo = 0;
    meses.forEach(m => {
      m.flujoNeto = m.entradas - m.salidas;
      saldo += m.flujoNeto;
      m.saldoAcumulado = saldo;
    });

    const totalEntradas = meses.reduce((s, m) => s + m.entradas, 0);
    const totalSalidas = meses.reduce((s, m) => s + m.salidas, 0);
    res.json({ meses, totalEntradas, totalSalidas, flujoNeto: totalEntradas - totalSalidas });
  } catch (err) { next(err); }
});

// GET /api/estados-financieros/indicadores
router.get("/indicadores", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const { desde, hasta } = req.query;
    const rango = rangoFechas(desde, hasta);
    const whereF = { fincaId, fecha: rango };

    const [ventas, gastos, cuentas, prestamos, cxp, animales, activosFijos, finca] = await Promise.all([
      prisma.venta.findMany({ where: { ...whereF, estadoVenta: { not: "REVERSADA" } }, select: { precioNIO: true } }),
      prisma.gasto.findMany({ where: whereF, select: { monto: true } }),
      prisma.cuentaFinanciera.findMany({ where: { fincaId, estado: "ACTIVA" }, select: { saldoActual: true, tipo: true } }),
      prisma.prestamo.findMany({ where: { fincaId, estado: "ACTIVO" }, select: { saldoActual: true } }),
      prisma.cuentaPorPagar.findMany({ where: { fincaId, estado: "PENDIENTE" }, select: { monto: true } }),
      prisma.animal.findMany({ where: { fincaId, estado: "ACTIVO" }, select: { costoCompra: true, pesoActual: true } }),
      prisma.activoFijo.findMany({ where: { fincaId, estado: "ACTIVO" }, select: { valorActual: true, costoAdquisicion: true } }),
      prisma.finca.findUnique({ where: { id: fincaId }, select: { precioLibra: true } }),
    ]);

    const ingresos = ventas.reduce((s, v) => s + v.precioNIO, 0);
    const gastosT = gastos.reduce((s, g) => s + g.monto, 0);
    const resultado = ingresos - gastosT;
    const activosCorrientes = cuentas.reduce((s, c) => s + Number(c.saldoActual), 0);
    const pasivosCorrientes = cxp.reduce((s, c) => s + c.monto, 0) + prestamos.reduce((s, p) => s + Number(p.saldoActual), 0) * 0.2;
    const valorGanado = animales.reduce((s, a) => s + (a.pesoActual && finca?.precioLibra ? a.pesoActual * finca.precioLibra : Number(a.costoCompra || 0)), 0);
    const valorActivosFijosT = activosFijos.reduce((s, a) => s + Number(a.valorActual || a.costoAdquisicion || 0), 0);
    const totalActivos = activosCorrientes + valorGanado + valorActivosFijosT;
    const totalPasivos = prestamos.reduce((s, p) => s + Number(p.saldoActual), 0) + cxp.reduce((s, c) => s + c.monto, 0);
    const patrimonio = totalActivos - totalPasivos;

    const calcular = (num, den, label) => den > 0 ? { valor: num / den, disponible: true, label } : { valor: null, disponible: false, label, razon: "Datos insuficientes" };

    res.json({
      liquidezCorriente: calcular(activosCorrientes, pasivosCorrientes, "Activos corrientes / Pasivos corrientes"),
      endeudamiento: calcular(totalPasivos, totalActivos, "Pasivos / Activos"),
      margenNeto: calcular(resultado, ingresos, "Resultado neto / Ingresos"),
      roa: calcular(resultado, totalActivos, "Resultado / Activos"),
      roe: calcular(resultado, patrimonio, "Resultado / Patrimonio"),
      capitalTrabajo: { valor: activosCorrientes - pasivosCorrientes, disponible: true, label: "Activos corrientes - Pasivos corrientes" },
      resumen: { ingresos, gastos: gastosT, resultado, totalActivos, totalPasivos, patrimonio },
    });
  } catch (err) { next(err); }
});

module.exports = router;
