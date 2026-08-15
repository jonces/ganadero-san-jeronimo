const express = require("express");
const multer = require("multer");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadMedia, uploadMediaConTipo } = require("../lib/storage");
const logActividad = require("../lib/logActividad");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.use(requireAuth);

const includeAnimal = {
  media: { orderBy: { createdAt: "desc" }, take: 5 },
  eventos: { orderBy: { fecha: "desc" }, take: 1 },
  publicacion: true,
};

router.get("/", async (req, res, next) => {
  try {
    const { estadoComercial, potrero, sexo, estado } = req.query;
    const where = { fincaId: req.user.fincaId };
    if (estadoComercial) where.estadoComercial = estadoComercial;
    if (potrero) where.potrero = { contains: potrero, mode: "insensitive" };
    if (sexo)   where.sexo   = sexo;
    if (estado) where.estado = estado;

    const animales = await prisma.animal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: includeAnimal,
    });
    res.json(animales);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
      include: {
        media: { orderBy: { createdAt: "desc" } },
        eventos: { orderBy: { fecha: "desc" }, include: { media: true, usuario: { select: { nombre: true } } } },
        madre: { select: { id: true, identificador: true, nombre: true } },
        crias: { select: { id: true, identificador: true, nombre: true, sexo: true, estado: true }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
    res.json(animal);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { identificador, nombre, raza, fierro, sexo, fechaNacimiento, pesoActual, observacion, estadoReproductivo, madreId, potrero, costoCompra, origen, categoria } = req.body;
    if (!identificador || !sexo) return res.status(400).json({ error: "identificador y sexo son requeridos" });

    // Si existe un animal con el mismo identificador en estado no-activo, eliminarlo para permitir reutilizar el arete
    const existente = await prisma.animal.findFirst({ where: { identificador, fincaId: req.user.fincaId } });
    if (existente) {
      if (existente.estado === "ELIMINADO" || existente.estado === "MUERTO") {
        await prisma.media.deleteMany({ where: { animalId: existente.id } });
        await prisma.evento.deleteMany({ where: { animalId: existente.id } });
        await prisma.incidente.updateMany({ where: { animalId: existente.id }, data: { animalId: null } });
        await prisma.venta.deleteMany({ where: { animalId: existente.id } });
        await prisma.animal.updateMany({ where: { madreId: existente.id }, data: { madreId: null } });
        await prisma.animal.delete({ where: { id: existente.id } });
      } else {
        return res.status(409).json({ error: `Ya existe un animal activo con el identificador "${identificador}"` });
      }
    }

    const animal = await prisma.animal.create({
      data: {
        identificador,
        nombre: nombre || null,
        raza: raza || null,
        fierro: fierro || null,
        sexo,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento + "T12:00:00") : null,
        pesoActual: pesoActual ? Number(pesoActual) : null,
        observacion: observacion || null,
        potrero: potrero || null,
        costoCompra: costoCompra ? Number(costoCompra) : null,
        origen: origen || "FINCA",
        categoria: categoria || null,
        ...(sexo === "HEMBRA" && estadoReproductivo ? { estadoReproductivo } : {}),
        ...(madreId ? { madreId } : {}),
        fincaId: req.user.fincaId,
      },
      include: includeAnimal,
    });

    // Si se registra una cría y se especifica madre, actualizar estado de la madre automáticamente
    if (madreId) {
      const madre = await prisma.animal.findFirst({ where: { id: madreId, fincaId: req.user.fincaId } });
      if (madre && madre.sexo === "HEMBRA") {
        await prisma.animal.update({
          where: { id: madre.id },
          data: {
            estadoReproductivo: "LACTANCIA",
            fechaParto: madre.fechaParto || new Date(),
          },
        });
      }
    }

    logActividad({ accion: "Registró animal", detalle: `${identificador} - ${nombre || ""}`, modulo: "Animales", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json(animal);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    const { nombre, raza, fierro, pesoActual, estado, estadoReproductivo, fechaParto, fechaSecado, madreId, observacion, fechaNacimiento, potrero, estadoComercial, costoCompra, precioVenta, enPlanVenta, categoria } = req.body;

    const str = (v) => (v === "" || v === undefined) ? null : v;
    const data = {};
    if (nombre !== undefined) data.nombre = str(nombre);
    if (raza !== undefined) data.raza = str(raza);
    if (fierro !== undefined) data.fierro = str(fierro);
    if (pesoActual !== undefined) data.pesoActual = pesoActual ? Number(pesoActual) : null;
    if (observacion !== undefined) data.observacion = str(observacion);
    if (madreId !== undefined) data.madreId = madreId || null;
    if (fechaNacimiento !== undefined) data.fechaNacimiento = fechaNacimiento ? new Date(fechaNacimiento + "T12:00:00") : null;
    if (potrero !== undefined) data.potrero = potrero || null;
    if (estadoComercial !== undefined) data.estadoComercial = estadoComercial;
    if (costoCompra !== undefined) data.costoCompra = costoCompra ? Number(costoCompra) : null;
    if (precioVenta !== undefined) data.precioVenta = precioVenta ? Number(precioVenta) : null;
    if (enPlanVenta !== undefined) data.enPlanVenta = Boolean(enPlanVenta);
    if (categoria !== undefined) data.categoria = categoria || null;
    if (fechaParto !== undefined) data.fechaParto = fechaParto ? new Date(fechaParto) : null;
    if (fechaSecado !== undefined) data.fechaSecado = fechaSecado ? new Date(fechaSecado) : null;

    // Actualizar categoría/estado (aplica a machos y hembras)
    if (estadoReproductivo !== undefined && estadoReproductivo !== null) {
      data.estadoReproductivo = estadoReproductivo;
      // Lógica automática solo para hembras
      if (animal.sexo === "HEMBRA") {
        if (estadoReproductivo === "PARIDA" && !animal.fechaParto) {
          data.fechaParto = new Date();
          data.estadoReproductivo = "LACTANCIA";
        }
        if (estadoReproductivo === "SECA") {
          data.fechaSecado = new Date();
        }
      }
    }

    // Si se vende, limpiar estado reproductivo del conteo activo
    if (estado !== undefined) {
      data.estado = estado;
      if (estado === "VENDIDO") {
        logActividad({ accion: "Marcó animal como vendido", detalle: animal.identificador, modulo: "Animales", fincaId: req.user.fincaId, usuarioId: req.user.sub });
      }
    }

    const actualizado = await prisma.animal.update({ where: { id: animal.id }, data, include: includeAnimal });
    res.json(actualizado);
  } catch (err) { next(err); }
});

// Registrar parto — crea cría y actualiza madre automáticamente
router.post("/:id/parto", upload.array("archivos", 10), async (req, res, next) => {
  try {
    const madre = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!madre) return res.status(404).json({ error: "Animal no encontrado" });
    if (madre.sexo !== "HEMBRA") return res.status(400).json({ error: "Solo hembras pueden parir" });

    const { identificadorCria, nombreCria, sexoCria, pesoNacimiento } = req.body;
    if (!identificadorCria || !sexoCria) return res.status(400).json({ error: "identificadorCria y sexoCria son requeridos" });

    // Actualizar madre: LACTANCIA + fecha de parto
    const madreActualizada = await prisma.animal.update({
      where: { id: madre.id },
      data: { estadoReproductivo: "LACTANCIA", fechaParto: new Date() },
    });

    // Crear la cría
    const cria = await prisma.animal.create({
      data: {
        identificador: identificadorCria,
        nombre: nombreCria || null,
        sexo: sexoCria,
        pesoActual: pesoNacimiento ? Number(pesoNacimiento) : null,
        fechaNacimiento: new Date(),
        madreId: madre.id,
        fincaId: req.user.fincaId,
        estadoReproductivo: sexoCria === "HEMBRA" ? "VACIA" : null,
      },
      include: includeAnimal,
    });

    // Subir fotos/videos de la cría si vienen
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(async (file) => {
        const { url, tipo } = await uploadMediaConTipo(file);
        return prisma.media.create({ data: { url, tipo, animalId: cria.id } });
      }));
    }

    logActividad({ accion: "Registró parto", detalle: `Madre: ${madre.identificador} → Cría: ${identificadorCria}`, modulo: "Animales", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json({ madre: madreActualizada, cria });
  } catch (err) { next(err); }
});

// POST /:id/poner-en-venta
router.post("/:id/poner-en-venta", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    const { precio, moneda, modalidad, precioPorUnidad, negociable, descripcion, publicada, contacto, whatsapp, ubicacion } = req.body;
    if (!precio) return res.status(400).json({ error: "El precio es requerido" });

    // Upsert publicación
    const pub = await prisma.publicacionVenta.upsert({
      where: { animalId: animal.id },
      update: {
        precio: Number(precio),
        moneda: moneda || "NIO",
        modalidad: modalidad || "TOTAL",
        precioPorUnidad: precioPorUnidad ? Number(precioPorUnidad) : null,
        negociable: !!negociable,
        descripcion: descripcion || null,
        publicada: publicada !== false,
        fechaPublicacion: new Date(),
        contacto: contacto || null,
        whatsapp: whatsapp || null,
        ubicacion: ubicacion || null,
      },
      create: {
        animalId: animal.id,
        precio: Number(precio),
        moneda: moneda || "NIO",
        modalidad: modalidad || "TOTAL",
        precioPorUnidad: precioPorUnidad ? Number(precioPorUnidad) : null,
        negociable: !!negociable,
        descripcion: descripcion || null,
        publicada: publicada !== false,
        fechaPublicacion: new Date(),
        contacto: contacto || null,
        whatsapp: whatsapp || null,
        ubicacion: ubicacion || null,
      },
    });

    const actualizado = await prisma.animal.update({
      where: { id: animal.id },
      data: { estadoComercial: "EN_VENTA" },
      include: includeAnimal,
    });

    logActividad({ accion: "Puso animal en venta", detalle: animal.identificador, modulo: "Inventario", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.json({ animal: actualizado, publicacion: pub });
  } catch (err) { next(err); }
});

// POST /:id/quitar-de-venta
router.post("/:id/quitar-de-venta", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    // Desactivar publicación si existe
    await prisma.publicacionVenta.updateMany({
      where: { animalId: animal.id },
      data: { publicada: false },
    });

    const actualizado = await prisma.animal.update({
      where: { id: animal.id },
      data: { estadoComercial: "NO_DISPONIBLE" },
      include: includeAnimal,
    });

    logActividad({ accion: "Quitó animal de venta", detalle: animal.identificador, modulo: "Inventario", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.json(actualizado);
  } catch (err) { next(err); }
});

// POST /:id/completar-venta — crea Venta, cambia estado
router.post("/:id/completar-venta", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });

    const {
      tipoVenta, moneda, tipoCambio, precioNIO, precioUSD, pesoKg, unidadPeso, precioKg,
      metodoPago, estadoPago, numeroFactura, comision, descuento, impuestos,
      comprador, telefonoComprador, direccionComprador, notas,
      fechaSalida, pesoFinal, adelantoAplicado, saldoPendiente, reservaId,
    } = req.body;

    if (!tipoVenta || !precioNIO || !precioUSD) {
      return res.status(400).json({ error: "tipoVenta, precioNIO y precioUSD son requeridos" });
    }

    const [venta] = await prisma.$transaction([
      prisma.venta.create({
        data: {
          tipoVenta,
          moneda: moneda || "NIO",
          tipoCambio: tipoCambio ? Number(tipoCambio) : 36.5,
          precioNIO: Number(precioNIO),
          precioUSD: Number(precioUSD),
          pesoKg: pesoKg ? Number(pesoKg) : null,
          unidadPeso: unidadPeso || "LB",
          precioKg: precioKg ? Number(precioKg) : null,
          metodoPago: metodoPago || "EFECTIVO",
          estadoPago: estadoPago || "PAGADO",
          numeroFactura: numeroFactura || null,
          comision: comision ? Number(comision) : null,
          descuento: descuento ? Number(descuento) : null,
          impuestos: impuestos ? Number(impuestos) : null,
          comprador: comprador || null,
          telefonoComprador: telefonoComprador || null,
          direccionComprador: direccionComprador || null,
          notas: notas || null,
          fechaSalida: fechaSalida ? new Date(fechaSalida) : null,
          pesoFinal: pesoFinal ? Number(pesoFinal) : null,
          adelantoAplicado: adelantoAplicado ? Number(adelantoAplicado) : 0,
          saldoPendiente: saldoPendiente ? Number(saldoPendiente) : 0,
          reservaId: reservaId || null,
          animalId: animal.id,
          fincaId: req.user.fincaId,
          usuarioId: req.user.sub,
        },
      }),
      prisma.animal.update({
        where: { id: animal.id },
        data: { estado: "VENDIDO", estadoComercial: "VENTA_COMPLETADA" },
      }),
      prisma.publicacionVenta.updateMany({
        where: { animalId: animal.id },
        data: { publicada: false },
      }),
    ]);

    // Marcar reserva como completada si corresponde
    if (reservaId) {
      await prisma.reserva.updateMany({
        where: { id: reservaId, fincaId: req.user.fincaId },
        data: { estado: "COMPLETADA" },
      }).catch(() => {});
    }

    logActividad({ accion: "Completó venta de animal", detalle: `${animal.identificador} - C$${precioNIO}`, modulo: "Inventario", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.status(201).json(venta);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
    // Borrar relaciones antes de borrar el animal
    await prisma.media.deleteMany({ where: { animalId: animal.id } });
    await prisma.evento.deleteMany({ where: { animalId: animal.id } });
    await prisma.incidente.updateMany({ where: { animalId: animal.id }, data: { animalId: null } });
    await prisma.venta.deleteMany({ where: { animalId: animal.id } });
    // Desvincular crías
    await prisma.animal.updateMany({ where: { madreId: animal.id }, data: { madreId: null } });
    await prisma.animal.delete({ where: { id: animal.id } });
    logActividad({ accion: "Eliminó animal", detalle: animal.identificador, modulo: "Animales", fincaId: req.user.fincaId, usuarioId: req.user.sub });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post("/:id/media", upload.array("archivos", 10), async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
    if (!req.files?.length) return res.status(400).json({ error: "No se enviaron archivos" });

    const creados = await Promise.all(
      req.files.map(async (file) => {
        const { url, tipo } = await uploadMediaConTipo(file);
        return prisma.media.create({ data: { url, tipo, animalId: animal.id } });
      })
    );
    res.status(201).json(creados);
  } catch (err) { next(err); }
});

router.delete("/:id/media/:mediaId", async (req, res, next) => {
  try {
    const animal = await prisma.animal.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!animal) return res.status(404).json({ error: "Animal no encontrado" });
    const media = await prisma.media.findFirst({ where: { id: req.params.mediaId, animalId: animal.id } });
    if (!media) return res.status(404).json({ error: "Archivo no encontrado" });
    await prisma.media.delete({ where: { id: media.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
