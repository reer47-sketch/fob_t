/*
  Warnings:

  - You are about to drop the column `is_active` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `codes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[category,code,parent_id]` on the table `codes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "animals_is_active_idx";

-- DropIndex
DROP INDEX "codes_category_code_key";

-- DropIndex
DROP INDEX "codes_is_active_idx";

-- AlterTable
ALTER TABLE "animal_parents" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "animals" DROP COLUMN "is_active",
ADD COLUMN     "is_del" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "codes" DROP COLUMN "is_active",
ADD COLUMN     "is_del" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "animal_parents_is_public_idx" ON "animal_parents"("is_public");

-- CreateIndex
CREATE INDEX "animals_is_del_idx" ON "animals"("is_del");

-- CreateIndex
CREATE INDEX "animals_is_public_idx" ON "animals"("is_public");

-- CreateIndex
CREATE INDEX "codes_is_del_idx" ON "codes"("is_del");

-- CreateIndex
CREATE UNIQUE INDEX "codes_category_code_parent_id_key" ON "codes"("category", "code", "parent_id");
