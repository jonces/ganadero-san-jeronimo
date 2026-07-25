-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "costoBase" DOUBLE PRECISION,
ADD COLUMN     "estadoComercial" TEXT NOT NULL DEFAULT 'NO_DISPONIBLE',
ADD COLUMN     "origen" TEXT NOT NULL DEFAULT 'FINCA',
ADD COLUMN     "potrero" TEXT;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "adelantoAplicado" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "estadoVenta" TEXT NOT NULL DEFAULT 'CONFIRMADA',
ADD COLUMN     "fechaSalida" TIMESTAMP(3),
ADD COLUMN     "motivoRevision" TEXT,
ADD COLUMN     "pesoFinal" DOUBLE PRECISION,
ADD COLUMN     "reservaId" TEXT,
ADD COLUMN     "saldoPendiente" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "PublicacionVenta" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'NIO',
    "modalidad" TEXT NOT NULL DEFAULT 'TOTAL',
    "precioPorUnidad" DOUBLE PRECISION,
    "negociable" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,
    "publicada" BOOLEAN NOT NULL DEFAULT true,
    "fechaPublicacion" TIMESTAMP(3),
    "contacto" TEXT,
    "whatsapp" TEXT,
    "ubicacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicacionVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "telefono" TEXT,
    "identificacion" TEXT,
    "precioAcordado" DOUBLE PRECISION NOT NULL,
    "adelanto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metodoPago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "fechaReserva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "motivoCancelacion" TEXT,
    "adelantoDevuelto" BOOLEAN NOT NULL DEFAULT false,
    "responsableId" TEXT,
    "notas" TEXT,
    "fincaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicacionVenta_animalId_key" ON "PublicacionVenta"("animalId");

-- AddForeignKey
ALTER TABLE "PublicacionVenta" ADD CONSTRAINT "PublicacionVenta_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
