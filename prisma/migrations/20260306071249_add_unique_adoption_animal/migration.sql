/*
  Warnings:

  - A unique constraint covering the columns `[animal_id]` on the table `adoptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "adoptions_animal_id_key" ON "adoptions"("animal_id");
