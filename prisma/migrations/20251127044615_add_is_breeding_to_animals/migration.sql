-- AlterTable
ALTER TABLE "animals" ADD COLUMN     "is_breeding" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "animals_is_breeding_idx" ON "animals"("is_breeding");
