-- Sistema Financiero Profesional - PROMPT MAESTRO
-- Nuevos modelos: CuentaFinanciera, MovimientoFinanciero, TransferenciaInterna,
--                 ActivoFijo, ValuacionActivo, Prestamo, CuotaPrestamo,
--                 PeriodoFinanciero, InformeFinanciero, VersionInforme, AuditoriaFinanciera

-- Agregar campo tipoCambio a Gasto (si no existe)
ALTER TABLE "Gasto" ADD COLUMN IF NOT EXISTS "tipoCambio" DOUBLE PRECISION;

-- CuentaFinanciera
CREATE TABLE IF NOT EXISTS "CuentaFinanciera" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'CAJA',
    "banco" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'NIO',
    "ultimosCuatro" TEXT,
    "saldoInicial" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldoActual" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuentaFinanciera_pkey" PRIMARY KEY ("id")
);

-- MovimientoFinanciero
CREATE TABLE IF NOT EXISTS "MovimientoFinanciero" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "cuentaId" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'NIO',
    "tipoCambio" DECIMAL(15,6),
    "montoNIO" DECIMAL(15,2),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referencia" TEXT,
    "comprobante" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "usuarioId" TEXT,
    "observaciones" TEXT,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivoAnulacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimientoFinanciero_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MovimientoFinanciero_fincaId_fecha_idx" ON "MovimientoFinanciero"("fincaId", "fecha");
CREATE INDEX IF NOT EXISTS "MovimientoFinanciero_fincaId_sourceType_sourceId_idx" ON "MovimientoFinanciero"("fincaId", "sourceType", "sourceId");

-- TransferenciaInterna
CREATE TABLE IF NOT EXISTS "TransferenciaInterna" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "cuentaOrigenId" TEXT NOT NULL,
    "cuentaDestinoId" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'NIO',
    "concepto" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransferenciaInterna_pkey" PRIMARY KEY ("id")
);

-- ActivoFijo
CREATE TABLE IF NOT EXISTS "ActivoFijo" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'OTRO',
    "descripcion" TEXT,
    "fechaAdquisicion" TIMESTAMP(3),
    "costoAdquisicion" DECIMAL(15,2),
    "monedaAdquisicion" TEXT NOT NULL DEFAULT 'NIO',
    "valorActual" DECIMAL(15,2),
    "metodoValoracion" TEXT NOT NULL DEFAULT 'COSTO_HISTORICO',
    "fechaUltimaValuacion" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "ubicacion" TEXT,
    "proveedor" TEXT,
    "numeroDocumento" TEXT,
    "documentoUrl" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivoFijo_pkey" PRIMARY KEY ("id")
);

-- ValuacionActivo
CREATE TABLE IF NOT EXISTS "ValuacionActivo" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'REVALUACION',
    "referenciaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" TEXT NOT NULL DEFAULT 'MERCADO',
    "valorAnterior" DECIMAL(15,2),
    "valorNuevo" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'NIO',
    "supuestos" TEXT,
    "notas" TEXT,
    "usuarioId" TEXT,
    "esRealizada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValuacionActivo_pkey" PRIMARY KEY ("id")
);

-- Prestamo
CREATE TABLE IF NOT EXISTS "Prestamo" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "acreedor" TEXT NOT NULL,
    "institucion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'PRESTAMO',
    "referencia" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoOriginal" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'NIO',
    "saldoActual" DECIMAL(15,2) NOT NULL,
    "tasaInteres" DECIMAL(6,4),
    "tipoTasa" TEXT NOT NULL DEFAULT 'FIJA',
    "plazoMeses" INTEGER,
    "cuotaMensual" DECIMAL(15,2),
    "frecuencia" TEXT NOT NULL DEFAULT 'MENSUAL',
    "proximaCuota" TIMESTAMP(3),
    "vencimiento" TIMESTAMP(3),
    "garantia" TEXT,
    "proposito" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "documentoUrl" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prestamo_pkey" PRIMARY KEY ("id")
);

-- CuotaPrestamo
CREATE TABLE IF NOT EXISTS "CuotaPrestamo" (
    "id" TEXT NOT NULL,
    "prestamoId" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "fechaVence" TIMESTAMP(3) NOT NULL,
    "capital" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otrosCargos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuotaPrestamo_pkey" PRIMARY KEY ("id")
);

-- PeriodoFinanciero
CREATE TABLE IF NOT EXISTS "PeriodoFinanciero" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'MENSUAL',
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "ingresos" DECIMAL(15,2),
    "gastos" DECIMAL(15,2),
    "flujoNeto" DECIMAL(15,2),
    "activos" DECIMAL(15,2),
    "pasivos" DECIMAL(15,2),
    "patrimonio" DECIMAL(15,2),
    "cerradoPor" TEXT,
    "cerradoEn" TIMESTAMP(3),
    "reabiertoPor" TEXT,
    "reabiertaEn" TIMESTAMP(3),
    "motivoReapertura" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeriodoFinanciero_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PeriodoFinanciero_fincaId_anio_mes_tipo_key" ON "PeriodoFinanciero"("fincaId", "anio", "mes", "tipo");

-- InformeFinanciero
CREATE TABLE IF NOT EXISTS "InformeFinanciero" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'EXPEDIENTE_BANCARIO',
    "empresa" TEXT,
    "institucion" TEXT,
    "montoSolicitado" DECIMAL(15,2),
    "plazoMeses" INTEGER,
    "destinoCredito" TEXT,
    "periodoDesde" TIMESTAMP(3),
    "periodoHasta" TIMESTAMP(3),
    "moneda" TEXT NOT NULL DEFAULT 'NIO',
    "documentosIncluidos" JSONB,
    "parametros" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "token" TEXT NOT NULL,
    "usuarioId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InformeFinanciero_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InformeFinanciero_codigo_key" ON "InformeFinanciero"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "InformeFinanciero_token_key" ON "InformeFinanciero"("token");

-- VersionInforme
CREATE TABLE IF NOT EXISTS "VersionInforme" (
    "id" TEXT NOT NULL,
    "informeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "pdfUrl" TEXT,
    "excelUrl" TEXT,
    "snapshot" JSONB,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VersionInforme_pkey" PRIMARY KEY ("id")
);

-- AuditoriaFinanciera
CREATE TABLE IF NOT EXISTS "AuditoriaFinanciera" (
    "id" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "accion" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditoriaFinanciera_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditoriaFinanciera_fincaId_createdAt_idx" ON "AuditoriaFinanciera"("fincaId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditoriaFinanciera_entidad_entidadId_idx" ON "AuditoriaFinanciera"("entidad", "entidadId");

-- Foreign Keys
ALTER TABLE "CuentaFinanciera" ADD CONSTRAINT "CuentaFinanciera_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaFinanciera"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransferenciaInterna" ADD CONSTRAINT "TransferenciaInterna_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransferenciaInterna" ADD CONSTRAINT "TransferenciaInterna_cuentaOrigenId_fkey" FOREIGN KEY ("cuentaOrigenId") REFERENCES "CuentaFinanciera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransferenciaInterna" ADD CONSTRAINT "TransferenciaInterna_cuentaDestinoId_fkey" FOREIGN KEY ("cuentaDestinoId") REFERENCES "CuentaFinanciera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivoFijo" ADD CONSTRAINT "ActivoFijo_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ValuacionActivo" ADD CONSTRAINT "ValuacionActivo_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ValuacionActivo" ADD CONSTRAINT "ValuacionActivo_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "ActivoFijo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CuotaPrestamo" ADD CONSTRAINT "CuotaPrestamo_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeriodoFinanciero" ADD CONSTRAINT "PeriodoFinanciero_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InformeFinanciero" ADD CONSTRAINT "InformeFinanciero_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VersionInforme" ADD CONSTRAINT "VersionInforme_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "InformeFinanciero"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditoriaFinanciera" ADD CONSTRAINT "AuditoriaFinanciera_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
