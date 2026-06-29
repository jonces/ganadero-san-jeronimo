/*
  Warnings:

  - You are about to drop the column `precioTotal` on the `Venta` table. All the data in the column will be lost.
  - Added the required column `precioNIO` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioUSD` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PAGADO', 'PENDIENTE', 'PARCIAL');

-- AlterTable
ALTER TABLE "Finca" ADD COLUMN     "tipoCambio" DOUBLE PRECISION NOT NULL DEFAULT 36.5;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "ventaId" TEXT;

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "precioTotal",
ADD COLUMN     "comision" DOUBLE PRECISION,
ADD COLUMN     "descuento" DOUBLE PRECISION,
ADD COLUMN     "direccionComprador" TEXT,
ADD COLUMN     "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PAGADO',
ADD COLUMN     "impuestos" DOUBLE PRECISION,
ADD COLUMN     "metodoPago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'NIO',
ADD COLUMN     "numeroFactura" TEXT,
ADD COLUMN     "precioNIO" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "precioUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "telefonoComprador" TEXT,
ADD COLUMN     "tipoCambio" DOUBLE PRECISION NOT NULL DEFAULT 36.5;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
