/*
  Warnings:

  - You are about to drop the column `costoBase` on the `Animal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Animal" DROP COLUMN "costoBase",
ADD COLUMN     "costoCompra" DOUBLE PRECISION,
ADD COLUMN     "precioVenta" DOUBLE PRECISION;
