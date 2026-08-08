const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const ahora = new Date();

    // Soporte para ?mes=8&año=2026 (mes 1-12)
    const mesParam  = req.query.mes  ? parseInt(req.query.mes,  10) - 1 : ahora.getMonth(); // 0-indexed
    const añoParam  = req.query.año  ? parseInt(req.query.año,  10)     : ahora.getFullYear();
    const inicioMes = new Date(añoParam, mesParam, 1);
    const finMes    = new Date(añoParam, mesParam + 1, 1);

    // ── Nombre de la finca + config crecimiento ──
    const fincaData = await prisma.finca.findUnique({
      where: { id: fincaId },
      select: { nombre: true, precioLibra: true, precioReproductora: true, metaAnimales: true },
    });
    const nombreFinca        = fincaData?.nombre           || "Mi Finca";
    const precioLibra        = fincaData?.precioLibra       || 85;
    const precioReproductora = fincaData?.precioReproductora|| 29000;
    const metaAnimales       = fincaData?.metaAnimales      || 150;

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

    // ── Capital invertido = TODAS las compras + todos los gastos históricos ──
    const [todosLosGastos, todasLasCompras, todasVentasCobradas] = await Promise.all([
      prisma.gasto.findMany({ where: { fincaId }, select: { monto: true } }),
      prisma.compra.findMany({ where: { fincaId }, select: { total: true, pagadoDeCaja: true } }),
      prisma.venta.findMany({ where: { fincaId, estadoPago: "PAGADO", estadoVenta: { not: "REVERSADA" } }, select: { precioNIO: true } }),
    ]);
    const totalGastosHistorico  = todosLosGastos.reduce((s, g) => s + (g.monto  || 0), 0);
    const totalTodasCompras     = todasLasCompras.reduce((s, c) => s + (c.total  || 0), 0);
    const totalPagadoDeCaja     = todasLasCompras.reduce((s, c) => s + (c.pagadoDeCaja || 0), 0);
    const totalVentasCobradas   = todasVentasCobradas.reduce((s, v) => s + (v.precioNIO || 0), 0);

    // Capital invertido = todas las compras + todos los gastos (todo va a la ganadería)
    const capitalInvertido = totalTodasCompras + totalGastosHistorico;

    // Caja disponible = ventas cobradas − gastos − solo la parte de compras que salió de la caja
    const cajaDisponible = totalVentasCobradas - totalGastosHistorico - totalPagadoDeCaja;

    // ── Valor estimado del hato ──
    // Valor hato: usa precioVenta del animal si tiene, sino C$15,000 por defecto
    const animalesConPrecio = await prisma.animal.findMany({
      where: { fincaId, estado: "ACTIVO" },
      select: { precioVenta: true },
    });
    const valorEstimadoHato = animalesConPrecio.reduce((s, a) => s + (a.precioVenta || 15000), 0);

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

    // ── Fase de la ganadería ──
    const ratioRecuperacion = capitalInvertido > 0 ? totalVentasCobradas / capitalInvertido : 0;
    let fase, faseDescripcion, faseColor;
    if (ratioRecuperacion < 0.25) {
      fase = "INVERSION";
      faseDescripcion = "Estás construyendo tu hato. Todo lo invertido está creciendo en valor dentro de tus animales.";
      faseColor = "rojo";
    } else if (ratioRecuperacion < 0.75) {
      fase = "TRANSICION";
      faseDescripcion = "Tu hato ya genera ingresos pero aún no recupera la inversión total. Vas en buen camino.";
      faseColor = "amarillo";
    } else {
      fase = "PRODUCTIVA";
      faseDescripcion = "Tu ganadería ya genera retornos sobre la inversión. El hato trabaja para ti.";
      faseColor = "verde";
    }

    // ── ROI del hato ──
    const gananciasLatente = valorEstimadoHato - capitalInvertido;
    const roiPorcentaje = capitalInvertido > 0 ? (gananciasLatente / capitalInvertido) * 100 : 0;

    // ── Plan de crecimiento: novillos/machos listos para venta ──
    const animalesCompletos = await prisma.animal.findMany({
      where: { fincaId, estado: "ACTIVO" },
      select: { id: true, identificador: true, nombre: true, sexo: true, fechaNacimiento: true, pesoActual: true, precioVenta: true, estadoComercial: true, raza: true },
    });

    const novichoListos = animalesCompletos.filter(a => {
      if (a.sexo !== "MACHO") return false;
      if (a.estadoComercial === "RESERVADO") return false;
      const edadMeses = a.fechaNacimiento ? (ahora - new Date(a.fechaNacimiento)) / (1000*60*60*24*30) : null;
      const pesoListo = a.pesoActual && a.pesoActual >= 400;
      const edadLista = edadMeses && edadMeses >= 18;
      return pesoListo || edadLista;
    });

    const valorLotePorLibra = novichoListos.reduce((s, a) => s + ((a.pesoActual || 0) * precioLibra), 0);
    const reproductrasQueCompras = valorLotePorLibra > 0 ? Math.floor(valorLotePorLibra / precioReproductora) : 0;
    const sobrante = valorLotePorLibra - (reproductrasQueCompras * precioReproductora);

    const planCrecimiento = {
      metaAnimales,
      animalesActuales:     animalesActivos,
      progresoPct:          Math.min(100, Math.round((animalesActivos / metaAnimales) * 100)),
      animalesFaltantes:    Math.max(0, metaAnimales - animalesActivos),
      precioLibra,
      precioReproductora,
      novichoListos:        novichoListos.map(a => ({
        id: a.id,
        identificador: a.identificador,
        nombre: a.nombre,
        raza: a.raza,
        pesoActual: a.pesoActual || 0,
        valorEstimado: (a.pesoActual || 0) * precioLibra,
      })),
      totalNovichoListos:   novichoListos.length,
      valorTotalLote:       valorLotePorLibra,
      reproductrasQueCompras,
      sobrante,
      animalesDespuesDeLote: animalesActivos - novichoListos.length + reproductrasQueCompras,
    };

    // ── Base reproductora ──
    const candidatosVenta = novichoListos;
    const valorProyectadoLote = valorLotePorLibra;
    const baseReproductora = {
      vacas:           animales.filter(a => a.sexo === "HEMBRA" && (!a.fechaNacimiento || (ahora - new Date(a.fechaNacimiento)) / (1000*60*60*24*365) >= 2)).length,
      sementales:      animales.filter(a => a.sexo === "MACHO"  && (!a.fechaNacimiento || (ahora - new Date(a.fechaNacimiento)) / (1000*60*60*24*365) >= 2)).length,
      novillas,
      candidatosVenta: candidatosVenta.length,
      valorProyectado: valorProyectadoLote,
    };

    // ── Línea de tiempo: inversión acumulada mes a mes (12 meses) ──
    const timelineInversion = [];
    let acumuladoInv = 0;
    let acumuladoVentas = 0;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const f = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
      const mes = d.toLocaleDateString("es", { month: "short", year: "2-digit" });
      const [cmpMes, gstMes, vtaMes] = await Promise.all([
        prisma.compra.aggregate({ where: { fincaId, fecha: { gte: d, lt: f } }, _sum: { total: true } }),
        prisma.gasto.aggregate({ where: { fincaId, fecha: { gte: d, lt: f } }, _sum: { monto: true } }),
        prisma.venta.aggregate({ where: { fincaId, fecha: { gte: d, lt: f }, estadoPago: "PAGADO", estadoVenta: { not: "REVERSADA" } }, _sum: { precioNIO: true } }),
      ]);
      acumuladoInv    += (cmpMes._sum.total || 0) + (gstMes._sum.monto || 0);
      acumuladoVentas += (vtaMes._sum.precioNIO || 0);
      timelineInversion.push({ mes, inversion: acumuladoInv, ventas: acumuladoVentas });
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
      nombreFinca,
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
      fase, faseDescripcion, faseColor,
      roiHato: { invertido: capitalInvertido, valorHato: valorEstimadoHato, gananciasLatente, roiPorcentaje },
      baseReproductora,
      planCrecimiento,
      alertas: [],
    });
  } catch (err) { next(err); }
});

module.exports = router;
