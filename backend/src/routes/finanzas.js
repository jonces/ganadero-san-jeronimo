const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use(requireNoEsCampo);

function rangoFechas(periodo) {
  const ahora = new Date();
  let desde = null;
  let hasta = null;

  if (periodo === "hoy") {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  } else if (periodo === "7d") {
    desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (periodo === "30d") {
    desde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (periodo === "mes" || !periodo) {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  } else if (periodo === "mes_anterior") {
    desde = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    hasta = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);
  } else if (periodo === "año") {
    desde = new Date(ahora.getFullYear(), 0, 1);
  }
  return { desde, hasta: hasta || ahora };
}

router.get("/", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const { periodo } = req.query;
    const { desde, hasta } = rangoFechas(periodo);

    const whereF = { fincaId, fecha: { gte: desde, lte: hasta } };

    const [ventas, gastos] = await Promise.all([
      prisma.venta.findMany({ where: { ...whereF, estadoVenta: { not: "REVERSADA" } }, select: { precioNIO: true } }),
      prisma.gasto.findMany({ where: whereF, select: { monto: true, categoria: true } }),
    ]);

    const ingresos = ventas.reduce((s, v) => s + v.precioNIO, 0);
    const gastosTotal = gastos.reduce((s, g) => s + g.monto, 0);
    const flujoNeto = ingresos - gastosTotal;
    const margen = ingresos > 0 ? (flujoNeto / ingresos) * 100 : 0;

    // Desglose por categoría de gastos
    const porCategoria = {};
    gastos.forEach(g => { porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.monto; });

    // Últimos 12 meses
    const ahora = new Date();
    const hace12 = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
    const [ventasHist, gastosHist] = await Promise.all([
      prisma.venta.findMany({ where: { fincaId, fecha: { gte: hace12 }, estadoVenta: { not: "REVERSADA" } }, select: { fecha: true, precioNIO: true } }),
      prisma.gasto.findMany({ where: { fincaId, fecha: { gte: hace12 } }, select: { fecha: true, monto: true } }),
    ]);

    const meses = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      meses.push({ mes: key, ingresos: 0, gastos: 0 });
    }
    ventasHist.forEach(v => {
      const key = `${v.fecha.getFullYear()}-${String(v.fecha.getMonth() + 1).padStart(2, "0")}`;
      const m = meses.find(x => x.mes === key);
      if (m) m.ingresos += v.precioNIO;
    });
    gastosHist.forEach(g => {
      const key = `${g.fecha.getFullYear()}-${String(g.fecha.getMonth() + 1).padStart(2, "0")}`;
      const m = meses.find(x => x.mes === key);
      if (m) m.gastos += g.monto;
    });

    res.json({ ingresos, gastos: gastosTotal, flujoNeto, margen, porCategoria, meses });
  } catch (err) { next(err); }
});

router.get("/movimientos", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [ventas, gastos] = await Promise.all([
      prisma.venta.findMany({
        where: { fincaId, estadoVenta: { not: "REVERSADA" } },
        orderBy: { fecha: "desc" },
        select: { id: true, fecha: true, precioNIO: true, comprador: true, animal: { select: { identificador: true, nombre: true } } },
      }),
      prisma.gasto.findMany({
        where: { fincaId },
        orderBy: { fecha: "desc" },
        select: { id: true, fecha: true, monto: true, descripcion: true, categoria: true },
      }),
    ]);

    const movimientos = [
      ...ventas.map(v => ({
        id: v.id,
        tipo: "INGRESO",
        fecha: v.fecha,
        descripcion: `Venta: ${v.animal?.nombre || v.animal?.identificador || "Animal"}${v.comprador ? ` a ${v.comprador}` : ""}`,
        categoria: "VENTA",
        monto: v.precioNIO,
      })),
      ...gastos.map(g => ({
        id: g.id,
        tipo: "EGRESO",
        fecha: g.fecha,
        descripcion: g.descripcion,
        categoria: g.categoria,
        monto: g.monto,
      })),
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const total = movimientos.length;
    const items = movimientos.slice(skip, skip + take);

    res.json({ items, total });
  } catch (err) { next(err); }
});

module.exports = router;
