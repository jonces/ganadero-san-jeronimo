const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireNoEsCampo } = require("../middleware/auth");

const router = express.Router();

async function generarCodigo(fincaId) {
  const count = await prisma.informeFinanciero.count({ where: { fincaId } });
  const año = new Date().getFullYear();
  return `FIN-${año}-${String(count + 1).padStart(6, "0")}`;
}

// GET /api/informes-financieros/verificar/:token - PÚBLICO, sin auth
router.get("/verificar/:token", async (req, res, next) => {
  try {
    const informe = await prisma.informeFinanciero.findFirst({
      where: { token: req.params.token },
      select: {
        codigo: true, empresa: true, estado: true, tipo: true,
        periodoDesde: true, periodoHasta: true, generadoEn: true,
        finca: { select: { nombre: true } },
      },
    });
    if (!informe) return res.status(404).json({ error: "Informe no encontrado" });
    res.json({
      valido: informe.estado === "GENERADO",
      codigo: informe.codigo,
      empresa: informe.empresa || informe.finca?.nombre,
      tipo: informe.tipo,
      periodo: `${informe.periodoDesde ? new Date(informe.periodoDesde).toLocaleDateString("es-NI") : ""} al ${informe.periodoHasta ? new Date(informe.periodoHasta).toLocaleDateString("es-NI") : ""}`,
      fechaEmision: informe.generadoEn,
      estado: informe.estado,
    });
  } catch (err) { next(err); }
});

// Rutas privadas — requieren autenticación
router.use(requireAuth);
router.use(requireNoEsCampo);

// GET /api/informes-financieros
router.get("/", async (req, res, next) => {
  try {
    const informes = await prisma.informeFinanciero.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: { createdAt: "desc" },
      include: { versiones: { orderBy: { version: "desc" }, take: 1 } },
    });
    res.json(informes);
  } catch (err) { next(err); }
});

// POST /api/informes-financieros - crear borrador
router.post("/", async (req, res, next) => {
  try {
    const {
      empresa, institucion, montoSolicitado, monedaSolicitud, plazoMeses,
      destinoCredito, periodoDesde, periodoHasta, moneda, documentosIncluidos,
    } = req.body;
    if (!periodoDesde || !periodoHasta) return res.status(400).json({ error: "periodoDesde y periodoHasta son requeridos" });

    const codigo = await generarCodigo(req.user.fincaId);
    const informe = await prisma.informeFinanciero.create({
      data: {
        fincaId: req.user.fincaId,
        codigo,
        empresa: empresa || null,
        institucion: institucion || null,
        montoSolicitado: montoSolicitado ? parseFloat(montoSolicitado) : null,
        monedaSolicitud: monedaSolicitud || "NIO",
        plazoMeses: plazoMeses ? parseInt(plazoMeses) : null,
        destinoCredito: destinoCredito || null,
        periodoDesde: new Date(periodoDesde),
        periodoHasta: new Date(periodoHasta),
        moneda: moneda || "NIO",
        documentosIncluidos: documentosIncluidos || [],
        estado: "BORRADOR",
        usuarioId: req.user.sub,
      },
    });

    await prisma.auditoriaFinanciera.create({
      data: {
        fincaId: req.user.fincaId, usuarioId: req.user.sub,
        entidad: "InformeFinanciero", entidadId: informe.id,
        accion: "CREAR", valorNuevo: { codigo, estado: "BORRADOR" },
      },
    });

    res.status(201).json(informe);
  } catch (err) { next(err); }
});

// PATCH /api/informes-financieros/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const informe = await prisma.informeFinanciero.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!informe) return res.status(404).json({ error: "No encontrado" });
    if (informe.estado === "ANULADO") return res.status(400).json({ error: "Informe anulado" });

    const campos = ["empresa","institucion","destinoCredito","moneda","monedaSolicitud","documentosIncluidos"];
    const data = {};
    campos.forEach(c => { if (req.body[c] !== undefined) data[c] = req.body[c]; });
    if (req.body.montoSolicitado !== undefined) data.montoSolicitado = parseFloat(req.body.montoSolicitado);
    if (req.body.plazoMeses !== undefined) data.plazoMeses = parseInt(req.body.plazoMeses);
    if (req.body.periodoDesde) data.periodoDesde = new Date(req.body.periodoDesde);
    if (req.body.periodoHasta) data.periodoHasta = new Date(req.body.periodoHasta);

    const actualizado = await prisma.informeFinanciero.update({ where: { id: req.params.id }, data });
    res.json(actualizado);
  } catch (err) { next(err); }
});

// POST /api/informes-financieros/:id/generar - marcar como generado y crear versión
router.post("/:id/generar", async (req, res, next) => {
  try {
    const informe = await prisma.informeFinanciero.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!informe) return res.status(404).json({ error: "No encontrado" });
    if (informe.anulado) return res.status(400).json({ error: "Informe anulado" });

    const { snapshot, pdfUrl } = req.body;
    const ultimaVersion = await prisma.versionInforme.findFirst({
      where: { informeId: informe.id }, orderBy: { version: "desc" },
    });
    const version = (ultimaVersion?.version || 0) + 1;

    const [versionCreada] = await prisma.$transaction([
      prisma.versionInforme.create({
        data: {
          informeId: informe.id,
          version, pdfUrl: pdfUrl || null,
          snapshot: snapshot || null,
          usuarioId: req.user.sub,
        },
      }),
      prisma.informeFinanciero.update({
        where: { id: informe.id },
        data: { estado: "GENERADO", generadoEn: new Date() },
      }),
    ]);

    await prisma.auditoriaFinanciera.create({
      data: {
        fincaId: req.user.fincaId, usuarioId: req.user.sub,
        entidad: "InformeFinanciero", entidadId: informe.id,
        accion: "GENERAR_INFORME", valorNuevo: { version, codigo: informe.codigo },
      },
    });

    res.json({ version: versionCreada, informe: { codigo: informe.codigo, token: informe.token } });
  } catch (err) { next(err); }
});

// POST /api/informes-financieros/:id/anular
router.post("/:id/anular", async (req, res, next) => {
  try {
    if (req.user.role === "TRABAJADOR") return res.status(403).json({ error: "No autorizado" });
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: "motivo es requerido" });
    const informe = await prisma.informeFinanciero.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!informe) return res.status(404).json({ error: "No encontrado" });
    await prisma.informeFinanciero.update({
      where: { id: informe.id },
      data: { estado: "ANULADO", anulado: true, anuladoPor: req.user.sub, anuladoEn: new Date(), motivoAnulacion: motivo },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
