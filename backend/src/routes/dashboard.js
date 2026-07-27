const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);

    // ── Animales activos ──
    const animales = await prisma.animal.findMany({
      where: { fincaId, estado: "ACTIVO" },
      select: { sexo: true, estadoReproductivo: true, estadoComercial: true, pesoActual: true, fechaNacimiento: true, createdAt: true },
    });

    const animalesActivos = animales.length;
    const vacas = animales.filter(a => a.sexo === "HEMBRA" && (!a.fechaNacimiento || (ahora - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 365) >= 2)).length;
    const toros = animales.filter(a => a.sexo === "MACHO" && (!a.fechaNacimiento || (ahora - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 365) >= 2)).length;
    const novillos = animales.filter(a => a.sexo === "MACHO" && a.fechaNacimiento && (ahora - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 365) < 2).length;
    const novillas = animales.filter(a => a.sexo === "HEMBRA" && a.fechaNacimiento && (ahora - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 365) < 2 && (ahora - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 30) >= 6).length;
    const terneros = animales.filter(a => a.sexo === "MACHO" && a.fechaNacimiento && (ahora - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 30) < 6).length;
    const terneras = animales.filter(a => a.sexo === "HEMBRA" && a.fechaNacimiento && (ahora - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 30) < 6).length;
    const prenadas = animales.filter(a => a.estadoReproductivo === "PREÑADA").length;
    const enVenta = animales.filter(a => a.estadoComercial === "EN_VENTA").length;
    const reservados = animales.filter(a => a.estadoComercial === "RESERVADO").length;

    // ── Ventas del mes ──
    const ventasMesRaw = await prisma.venta.findMany({
      where: { fincaId, fecha: { gte: inicioMes, lt: finMes }, estadoVenta: { not: "REVERSADA" } },
      select: { precioNIO: true, estadoPago: true, animalId: true, animal: { select: { costoCompra: true } } },
    });
    const ventasMesTotal = ventasMesRaw.reduce((s, v) => s + (v.precioNIO || 0), 0);
    const ventasMesCantidad = ventasMesRaw.length;
    const costoAnimalesVendidos = ventasMesRaw.reduce((s, v) => s + (v.animal?.costoCompra || 0), 0);
    const ventasCobradas = ventasMesRaw.filter(v => v.estadoPago === "PAGADO").reduce((s, v) => s + (v.precioNIO || 0), 0);

    // ── Gastos del mes ──
    const gastosMesRaw = await prisma.gasto.findMany({
      where: { fincaId, fecha: { gte: inicioMes, lt: finMes } },
      select: { monto: true, categoria: true },
    });
    const gastosMesTotal = gastosMesRaw.reduce((s, g) => s + (g.monto || 0), 0);
    const gastosPorCategoria = {};
    for (const g of gastosMesRaw) {
      gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] || 0) + g.monto;
    }
    const categorias = Object.entries(gastosPorCategoria).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);

    // ── Ganancias ──
    const gananciaNeta = ventasMesTotal - costoAnimalesVendidos - gastosMesTotal;
    const margenGanancia = ventasMesTotal > 0 ? (gananciaNeta / ventasMesTotal) * 100 : 0;

    // ── Capital invertido = costoCompra animales + todos los gastos + todas las compras ──
    const [animalesComprados, todosLosGastos, todasLasCompras] = await Promise.all([
      prisma.animal.findMany({ where: { fincaId, madreId: null, costoCompra: { not: null } }, select: { costoCompra: true } }),
      prisma.gasto.findMany({ where: { fincaId }, select: { monto: true } }),
      prisma.compra.findMany({ where: { fincaId, tipo: { not: "ANIMAL" } }, select: { total: true } }),
    ]);
    const totalCostoAnimales = animalesComprados.reduce((s, a) => s + (a.costoCompra || 0), 0);
    const totalGastosHistorico = todosLosGastos.reduce((s, g) => s + (g.monto || 0), 0);
    const totalComprasOtros = todasLasCompras.reduce((s, c) => s + (c.total || 0), 0);
    const capitalInvertido = totalCostoAnimales + totalGastosHistorico + totalComprasOtros;

    // ── Caja disponible ──
    const todosGastosPagados = await prisma.gasto.findMany({ where: { fincaId }, select: { monto: true } });
    const totalGastosPagados = todosGastosPagados.reduce((s, g) => s + (g.monto || 0), 0);
    const todasVentasCobradas = await prisma.venta.findMany({
      where: { fincaId, estadoPago: "PAGADO", estadoVenta: { not: "REVERSADA" } },
      select: { precioNIO: true },
    });
    const totalVentasCobradas = todasVentasCobradas.reduce((s, v) => s + (v.precioNIO || 0), 0);
    const cajaDisponible = totalVentasCobradas - totalGastosPagados;

    // ── Valor estimado del hato ──
    const valorEstimadoHato = animales.reduce((s, a) => s + (a.pesoActual ? a.pesoActual * 50 : 15000), 0);

    // ── Gráfica 6 meses ──
    const graficaMeses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const f = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
      const mes = d.toLocaleDateString("es", { month: "short" });
      const [vtas, gsts] = await Promise.all([
        prisma.venta.aggregate({ where: { fincaId, fecha: { gte: d, lt: f }, estadoVenta: { not: "REVERSADA" } }, _sum: { precioNIO: true } }),
        prisma.gasto.aggregate({ where: { fincaId, fecha: { gte: d, lt: f } }, _sum: { monto: true } }),
      ]);
      const ingresos = vtas._sum.precioNIO || 0;
      const gastos = gsts._sum.monto || 0;
      graficaMeses.push({ mes, ingresos, gastos, flujoNeto: ingresos - gastos });
    }

    // ── Indicadores productivos ──
    const animalesConPeso = animales.filter(a => a.pesoActual);
    const pesoPromedio = animalesConPeso.length > 0
      ? animalesConPeso.reduce((s, a) => s + a.pesoActual, 0) / animalesConPeso.length
      : 0;
    const hembrasActivas = animales.filter(a => a.sexo === "HEMBRA").length;
    const tasaPrenez = hembrasActivas > 0 ? (prenadas / hembrasActivas) * 100 : 0;

    // Nacimientos del mes: eventos tipo PARTO del mes
    const partosMes = await prisma.evento.count({
      where: {
        tipo: "PARTO",
        fecha: { gte: inicioMes, lt: finMes },
        animal: { fincaId },
      },
    });

    // Natalidad y mortalidad anuales
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);
    const partosAnio = await prisma.evento.count({ where: { tipo: "PARTO", fecha: { gte: inicioAnio }, animal: { fincaId } } });
    const muertesAnio = await prisma.incidente.count({ where: { fincaId, tipo: "MUERTE", fecha: { gte: inicioAnio } } });
    const natalidad = animalesActivos > 0 ? (partosAnio / animalesActivos) * 100 : 0;
    const mortalidad = animalesActivos > 0 ? (muertesAnio / animalesActivos) * 100 : 0;

    res.json({
      animalesActivos,
      resumenHato: { vacas, toros, novillos, novillas, terneros, terneras, prenadas, enVenta, reservados, nacimientosMes: partosMes },
      ventasMes: { total: ventasMesTotal, cantidad: ventasMesCantidad, moneda: "NIO" },
      gastosMes: { total: gastosMesTotal, categorias },
      gananciaNeta,
      margenGanancia,
      capitalInvertido,
      cajaDisponible,
      valorEstimadoHato,
      graficaMeses,
      pesoPromedio,
      tasaPrenez,
      nacimientosMes: partosMes,
      natalidad,
      mortalidad,
      alertas: [],
    });
  } catch (err) { next(err); }
});

module.exports = router;
