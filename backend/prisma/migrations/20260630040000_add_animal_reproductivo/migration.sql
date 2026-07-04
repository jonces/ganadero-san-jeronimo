-- AlterTable: agregar campos reproductivos al Animal
ALTER TABLE "Animal" ADD COLUMN "estadoReproductivo" TEXT;
ALTER TABLE "Animal" ADD COLUMN "fechaParto" TIMESTAMP(3);
ALTER TABLE "Animal" ADD COLUMN "fechaSecado" TIMESTAMP(3);
ALTER TABLE "Animal" ADD COLUMN "madreId" TEXT;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_madreId_fkey" FOREIGN KEY ("madreId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
