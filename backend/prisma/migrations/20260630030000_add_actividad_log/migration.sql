-- CreateTable
CREATE TABLE "ActividadLog" (
    "id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "modulo" TEXT NOT NULL,
    "fincaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActividadLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActividadLog" ADD CONSTRAINT "ActividadLog_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadLog" ADD CONSTRAINT "ActividadLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
