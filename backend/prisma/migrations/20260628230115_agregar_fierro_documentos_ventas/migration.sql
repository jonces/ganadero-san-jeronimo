-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('FIERRO_ANUAL', 'PERMISO_ALCALDIA', 'CARTA_VENTA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoVenta" AS ENUM ('EN_PIE', 'POR_PESO');

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "fierro" TEXT,
ADD COLUMN     "observacion" TEXT;

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "url" TEXT NOT NULL,
    "notas" TEXT,
    "fincaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "tipoVenta" "TipoVenta" NOT NULL,
    "pesoKg" DOUBLE PRECISION,
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "precioKg" DOUBLE PRECISION,
    "comprador" TEXT,
    "notas" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
