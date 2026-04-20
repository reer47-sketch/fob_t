/*
  Warnings:

  - You are about to drop the column `animalId` on the `animal_codes` table. All the data in the column will be lost.
  - You are about to drop the column `codeId` on the `animal_codes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `animal_codes` table. All the data in the column will be lost.
  - You are about to drop the column `animalId` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `cageInfo` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `currentSize` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `distinctiveMarks` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `flooringInfo` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `habitatNotes` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `healthStatus` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `isMating` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `specialNeeds` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `tailStatus` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `animal_details` table. All the data in the column will be lost.
  - You are about to drop the column `animalId` on the `animal_images` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `animal_images` table. All the data in the column will be lost.
  - You are about to drop the column `displayOrder` on the `animal_images` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `animal_images` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `animal_images` table. All the data in the column will be lost.
  - You are about to drop the column `animalId` on the `animal_parents` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `animal_parents` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `animal_parents` table. All the data in the column will be lost.
  - You are about to drop the column `parentType` on the `animal_parents` table. All the data in the column will be lost.
  - You are about to drop the column `acquisitionDate` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `acquisitionType` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `deathDate` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `qrCodeUrl` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `uniqueId` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `codes` table. All the data in the column will be lost.
  - You are about to drop the column `displayOrder` on the `codes` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `codes` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `codes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `codes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[animal_id,code_id]` on the table `animal_codes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[animal_id]` on the table `animal_details` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[animal_id,parent_id]` on the table `animal_parents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,unique_id]` on the table `animals` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `animal_id` to the `animal_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code_id` to the `animal_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `animal_id` to the `animal_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `animal_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `animal_id` to the `animal_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_url` to the `animal_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `animal_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `animal_id` to the `animal_parents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parent_id` to the `animal_parents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parent_type` to the `animal_parents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acquisition_date` to the `animals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acquisition_type` to the `animals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `animals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unique_id` to the `animals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `animals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "animal_codes" DROP CONSTRAINT "animal_codes_animalId_fkey";

-- DropForeignKey
ALTER TABLE "animal_codes" DROP CONSTRAINT "animal_codes_codeId_fkey";

-- DropForeignKey
ALTER TABLE "animal_details" DROP CONSTRAINT "animal_details_animalId_fkey";

-- DropForeignKey
ALTER TABLE "animal_images" DROP CONSTRAINT "animal_images_animalId_fkey";

-- DropForeignKey
ALTER TABLE "animal_parents" DROP CONSTRAINT "animal_parents_animalId_fkey";

-- DropForeignKey
ALTER TABLE "animal_parents" DROP CONSTRAINT "animal_parents_parentId_fkey";

-- DropForeignKey
ALTER TABLE "animals" DROP CONSTRAINT "animals_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "codes" DROP CONSTRAINT "codes_parentId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenantId_fkey";

-- DropIndex
DROP INDEX "animal_codes_animalId_codeId_key";

-- DropIndex
DROP INDEX "animal_codes_animalId_idx";

-- DropIndex
DROP INDEX "animal_codes_codeId_idx";

-- DropIndex
DROP INDEX "animal_details_animalId_key";

-- DropIndex
DROP INDEX "animal_images_animalId_idx";

-- DropIndex
DROP INDEX "animal_parents_animalId_idx";

-- DropIndex
DROP INDEX "animal_parents_animalId_parentId_key";

-- DropIndex
DROP INDEX "animal_parents_parentId_idx";

-- DropIndex
DROP INDEX "animals_isActive_idx";

-- DropIndex
DROP INDEX "animals_tenantId_idx";

-- DropIndex
DROP INDEX "animals_tenantId_uniqueId_key";

-- DropIndex
DROP INDEX "animals_uniqueId_idx";

-- DropIndex
DROP INDEX "codes_isActive_idx";

-- DropIndex
DROP INDEX "codes_parentId_idx";

-- DropIndex
DROP INDEX "users_tenantId_idx";

-- AlterTable
ALTER TABLE "animal_codes" DROP COLUMN "animalId",
DROP COLUMN "codeId",
DROP COLUMN "createdAt",
ADD COLUMN     "animal_id" TEXT NOT NULL,
ADD COLUMN     "code_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "animal_details" DROP COLUMN "animalId",
DROP COLUMN "cageInfo",
DROP COLUMN "createdAt",
DROP COLUMN "currentSize",
DROP COLUMN "distinctiveMarks",
DROP COLUMN "flooringInfo",
DROP COLUMN "habitatNotes",
DROP COLUMN "healthStatus",
DROP COLUMN "isMating",
DROP COLUMN "specialNeeds",
DROP COLUMN "tailStatus",
DROP COLUMN "updatedAt",
ADD COLUMN     "animal_id" TEXT NOT NULL,
ADD COLUMN     "cage_info" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "current_size" TEXT,
ADD COLUMN     "distinctive_marks" TEXT,
ADD COLUMN     "flooring_info" TEXT,
ADD COLUMN     "habitat_notes" TEXT,
ADD COLUMN     "health_status" TEXT,
ADD COLUMN     "is_mating" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "special_needs" TEXT,
ADD COLUMN     "tail_status" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "animal_images" DROP COLUMN "animalId",
DROP COLUMN "createdAt",
DROP COLUMN "displayOrder",
DROP COLUMN "imageUrl",
DROP COLUMN "updatedAt",
ADD COLUMN     "animal_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "display_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "image_url" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "animal_parents" DROP COLUMN "animalId",
DROP COLUMN "createdAt",
DROP COLUMN "parentId",
DROP COLUMN "parentType",
ADD COLUMN     "animal_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "parent_id" TEXT NOT NULL,
ADD COLUMN     "parent_type" "ParentType" NOT NULL;

-- AlterTable
ALTER TABLE "animals" DROP COLUMN "acquisitionDate",
DROP COLUMN "acquisitionType",
DROP COLUMN "createdAt",
DROP COLUMN "deathDate",
DROP COLUMN "isActive",
DROP COLUMN "qrCodeUrl",
DROP COLUMN "tenantId",
DROP COLUMN "uniqueId",
DROP COLUMN "updatedAt",
ADD COLUMN     "acquisition_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "acquisition_type" "AcquisitionType" NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "death_date" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "qr_code_url" TEXT,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "unique_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "codes" DROP COLUMN "createdAt",
DROP COLUMN "displayOrder",
DROP COLUMN "isActive",
DROP COLUMN "parentId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "display_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "createdAt",
DROP COLUMN "rejectionReason",
DROP COLUMN "tenantId",
DROP COLUMN "updatedAt",
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "tenant_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "animal_codes_animal_id_idx" ON "animal_codes"("animal_id");

-- CreateIndex
CREATE INDEX "animal_codes_code_id_idx" ON "animal_codes"("code_id");

-- CreateIndex
CREATE UNIQUE INDEX "animal_codes_animal_id_code_id_key" ON "animal_codes"("animal_id", "code_id");

-- CreateIndex
CREATE UNIQUE INDEX "animal_details_animal_id_key" ON "animal_details"("animal_id");

-- CreateIndex
CREATE INDEX "animal_images_animal_id_idx" ON "animal_images"("animal_id");

-- CreateIndex
CREATE INDEX "animal_parents_animal_id_idx" ON "animal_parents"("animal_id");

-- CreateIndex
CREATE INDEX "animal_parents_parent_id_idx" ON "animal_parents"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "animal_parents_animal_id_parent_id_key" ON "animal_parents"("animal_id", "parent_id");

-- CreateIndex
CREATE INDEX "animals_tenant_id_idx" ON "animals"("tenant_id");

-- CreateIndex
CREATE INDEX "animals_unique_id_idx" ON "animals"("unique_id");

-- CreateIndex
CREATE INDEX "animals_is_active_idx" ON "animals"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "animals_tenant_id_unique_id_key" ON "animals"("tenant_id", "unique_id");

-- CreateIndex
CREATE INDEX "codes_parent_id_idx" ON "codes"("parent_id");

-- CreateIndex
CREATE INDEX "codes_is_active_idx" ON "codes"("is_active");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_codes" ADD CONSTRAINT "animal_codes_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_codes" ADD CONSTRAINT "animal_codes_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_details" ADD CONSTRAINT "animal_details_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_parents" ADD CONSTRAINT "animal_parents_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_parents" ADD CONSTRAINT "animal_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_images" ADD CONSTRAINT "animal_images_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
