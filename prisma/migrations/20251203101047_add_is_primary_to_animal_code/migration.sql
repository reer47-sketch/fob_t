-- AlterTable
ALTER TABLE "animal_codes" ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "animal_codes_animal_id_is_primary_idx" ON "animal_codes"("animal_id", "is_primary");
