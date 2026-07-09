CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fincaId" TEXT NOT NULL,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TareaAnimal" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    CONSTRAINT "TareaAnimal_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TareaAnimal" ADD CONSTRAINT "TareaAnimal_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TareaAnimal" ADD CONSTRAINT "TareaAnimal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
