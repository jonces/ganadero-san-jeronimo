const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use(requireNoEsCampo);

async function auditar(fincaId, usuarioId, entidadId, accion, anterior, nuevo) {
  try {
    await prisma.auditoriaFinanciera.create({
      data: { fincaId, usuarioId, entidad: "ActivoFijo", entidadId, accion, valorAnterior: anterior, valorNuevo: nuevo },
    });
  } catch {}
}

// GET /api/activos-fijos
router.get("/", async (req, res, next) => {
  try {
    const { categoria, estado } = req.query;
    const activos = await prisma.activoFijo.findMany({
      where: {
        fincaId: req.user.fincaId,
        ...(categoria && { categoria }),
        ...(estado && { estado }),
      },
      orderBy: { createdAt: "desc" },
      include: { valuaciones: { orderBy: { fecha: "desc" }, take: 1 } },
    });
    res.json(activos);
  } catch (err) { next(err); }
});

// POST /api/activos-fijos
router.post("/", async (req, res, next) => {
  try {
    const { codigo, nombre, categoria, descripcion, fechaAdquisicion, costoAdquisicion, monedaAdquisicion, valorActual, metodoValoracion, ubicacion, proveedor, numeroDocumento, documentoUrl, notas } = req.body;
    if (!nombre || !categoria) return res.status(400).json({ error: "nombre y categoria son requeridos" });
    const activo = await prisma.activoFijo.create({
      data: {
        fincaId: req.user.fincaId,
        codigo: codigo || null, nombre, categoria,
        descripcion: descripcion || null,
        fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
        costoAdquisicion: costoAdquisicion ? parseFloat(costoAdquisicion) : null,
        monedaAdquisicion: monedaAdquisicion || "NIO",
        valorActual: valorActual ? parseFloat(valorActual) : costoAdquisicion ? parseFloat(costoAdquisicion) : null,
        metodoValoracion: metodoValoracion || "COSTO_HISTORICO",
        fechaUltimaValuacion: valorActual ? new Date() : null,
        ubicacion: ubicacion || null,
        proveedor: proveedor || null,
        numeroDocumento: numeroDocumento || null,
        documentoUrl: documentoUrl || null,
        notas: notas || null,
      },
    });
    await auditar(req.user.fincaId, req.user.sub, activo.id, "CREAR", null, activo);
    res.status(201).json(activo);
  } catch (err) { next(err); }
});

// PATCH /api/activos-fijos/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const anterior = await prisma.activoFijo.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!anterior) return res.status(404).json({ error: "No encontrado" });
    const campos = ["codigo","nombre","categoria","descripcion","ubicacion","proveedor","numeroDocumento","documentoUrl","notas","estado"];
    const data = {};
    campos.forEach(c => { if (req.body[c] !== undefined) data[c] = req.body[c]; });
    if (req.body.costoAdquisicion !== undefined) data.costoAdquisicion = parseFloat(req.body.costoAdquisicion);
    if (req.body.valorActual !== undefined) data.valorActual = parseFloat(req.body.valorActual);
    if (req.body.fechaAdquisicion) data.fechaAdquisicion = new Date(req.body.fechaAdquisicion);
    const actualizado = await prisma.activoFijo.update({ where: { id: req.params.id }, data });
    await auditar(req.user.fincaId, req.user.sub, actualizado.id, "MODIFICAR", anterior, actualizado);
    res.json(actualizado);
  } catch (err) { next(err); }
});

// POST /api/activos-fijos/:id/valuacion
router.post("/:id/valuacion", async (req, res, next) => {
  try {
    const activo = await prisma.activoFijo.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!activo) return res.status(404).json({ error: "No encontrado" });
    const { metodo, valorNuevo, moneda, supuestos, notas } = req.body;
    if (!metodo || !valorNuevo) return res.status(400).json({ error: "metodo y valorNuevo requeridos" });
    const valorD = parseFloat(valorNuevo);
    const [valuacion] = await prisma.$transaction([
      prisma.valuacionActivo.create({
        data: {
          fincaId: req.user.fincaId,
          activoId: activo.id,
          tipo: "ACTIVO_FIJO",
          metodo,
          valorAnterior: activo.valorActual,
          valorNuevo: valorD,
          moneda: moneda || "NIO",
          supuestos: supuestos || null,
          notas: notas || null,
          usuarioId: req.user.sub,
        },
      }),
      prisma.activoFijo.update({
        where: { id: activo.id },
        data: { valorActual: valorD, metodoValoracion: metodo, fechaUltimaValuacion: new Date() },
      }),
    ]);
    res.status(201).json(valuacion);
  } catch (err) { next(err); }
});

// GET /api/activos-fijos/resumen
router.get("/resumen/totales", async (req, res, next) => {
  try {
    const fincaId = req.user.fincaId;
    const activos = await prisma.activoFijo.findMany({
      where: { fincaId, estado: "ACTIVO" },
      select: { categoria: true, costoAdquisicion: true, valorActual: true },
    });
    const totalCosto = activos.reduce((s, a) => s + Number(a.costoAdquisicion || 0), 0);
    const totalValor = activos.reduce((s, a) => s + Number(a.valorActual || a.costoAdquisicion || 0), 0);
    const porCategoria = {};
    activos.forEach(a => {
      if (!porCategoria[a.categoria]) porCategoria[a.categoria] = { cantidad: 0, valor: 0 };
      porCategoria[a.categoria].cantidad++;
      porCategoria[a.categoria].valor += Number(a.valorActual || a.costoAdquisicion || 0);
    });
    res.json({ total: activos.length, totalCosto, totalValor, porCategoria });
  } catch (err) { next(err); }
});

module.exports = router;
