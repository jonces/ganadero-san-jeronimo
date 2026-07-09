const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { Resend } = require("resend");
const logActividad = require("../lib/logActividad");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const tareas = await prisma.tarea.findMany({
      where: { fincaId: req.user.fincaId },
      orderBy: { fecha: "asc" },
      include: {
        animales: {
          include: { animal: { select: { id: true, identificador: true, nombre: true } } },
        },
        creador: { select: { nombre: true } },
      },
    });
    res.json(tareas);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { tipo, descripcion, fecha, animalIds = [] } = req.body;
    if (!tipo || !fecha) return res.status(400).json({ error: "tipo y fecha son requeridos" });

    const tarea = await prisma.tarea.create({
      data: {
        tipo,
        descripcion: descripcion || null,
        fecha: new Date(fecha),
        fincaId: req.user.fincaId,
        creadoPor: req.user.sub,
        animales: {
          create: animalIds.map(animalId => ({ animalId })),
        },
      },
      include: {
        animales: {
          include: { animal: { select: { id: true, identificador: true, nombre: true } } },
        },
        creador: { select: { nombre: true } },
      },
    });

    // Enviar email a todos los trabajadores de la finca
    if (process.env.RESEND_API_KEY && tarea.animales.length > 0) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const trabajadores = await prisma.usuario.findMany({
          where: { fincaId: req.user.fincaId, role: "TRABAJADOR" },
          select: { email: true, nombre: true },
        });
        const fechaStr = new Date(fecha).toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const listaAnimales = tarea.animales.map(ta =>
          `<li>🐄 <strong>${ta.animal.nombre || ta.animal.identificador}</strong> (Arete: ${ta.animal.identificador})</li>`
        ).join("");

        const TIPO_LABELS = {
          VACUNACION: "Vacunación", TRATAMIENTO: "Tratamiento", DESPARASITACION: "Desparasitación",
          PESAJE: "Pesaje", INSEMINACION: "Inseminación", DESTETE: "Destete", OTRO: "Otra tarea",
        };

        for (const t of trabajadores) {
          await resend.emails.send({
            from: "GanaderoSG <noreply@ganaderosg.app>",
            to: t.email,
            subject: `📋 Nueva tarea asignada: ${TIPO_LABELS[tipo] || tipo} — ${fechaStr}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden">
                <div style="background:#145A32;padding:24px;text-align:center">
                  <h1 style="color:white;margin:0;font-size:22px">🐄 GanaderoSG</h1>
                  <p style="color:#86efac;margin:4px 0 0">Sistema de Gestión Ganadera</p>
                </div>
                <div style="padding:28px">
                  <p style="color:#374151;font-size:15px">Hola <strong>${t.nombre}</strong>,</p>
                  <p style="color:#374151">Se te ha asignado una nueva tarea:</p>
                  <div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:16px 0">
                    <p style="margin:0 0 8px"><strong>📌 Tipo:</strong> ${TIPO_LABELS[tipo] || tipo}</p>
                    <p style="margin:0 0 8px"><strong>📅 Fecha:</strong> ${fechaStr}</p>
                    ${descripcion ? `<p style="margin:0 0 8px"><strong>📝 Descripción:</strong> ${descripcion}</p>` : ""}
                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:12px 0"/>
                    <p style="margin:0 0 8px;font-weight:bold">🐄 Animales a atender (${tarea.animales.length}):</p>
                    <ul style="margin:0;padding-left:20px;color:#374151">${listaAnimales}</ul>
                  </div>
                  <p style="color:#6b7280;font-size:13px">Por favor confirma con tu administrador cuando la tarea esté completa.</p>
                </div>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error("Error enviando email de tarea:", emailErr.message);
      }
    }

    logActividad({ accion: `Creó tarea: ${tipo}`, detalle: descripcion || tipo, modulo: "Tareas", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json(tarea);
  } catch (err) { next(err); }
});

router.patch("/:id/completar", async (req, res, next) => {
  try {
    const tarea = await prisma.tarea.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!tarea) return res.status(404).json({ error: "No encontrada" });
    const updated = await prisma.tarea.update({ where: { id: tarea.id }, data: { estado: "COMPLETADA" } });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const del = await prisma.tarea.deleteMany({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (del.count === 0) return res.status(404).json({ error: "No encontrada" });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
