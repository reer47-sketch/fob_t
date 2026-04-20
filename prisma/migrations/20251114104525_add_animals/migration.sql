-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AcquisitionType" AS ENUM ('ADOPTION', 'HATCHING');

-- CreateEnum
CREATE TYPE "Quality" AS ENUM ('S', 'A', 'B', 'C');

-- CreateEnum
CREATE TYPE "ParentType" AS ENUM ('FATHER', 'MOTHER');

-- CreateEnum
CREATE TYPE "CodeCategory" AS ENUM ('SPECIES', 'MORPH', 'TRAIT', 'COLOR');

-- CreateTable
CREATE TABLE "codes" (
    "id" TEXT NOT NULL,
    "category" "CodeCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "acquisitionType" "AcquisitionType" NOT NULL,
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "deathDate" TIMESTAMP(3),
    "qrCodeUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_codes" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animal_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_details" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "currentSize" TEXT,
    "tailStatus" TEXT,
    "distinctiveMarks" TEXT,
    "quality" "Quality",
    "healthStatus" TEXT,
    "specialNeeds" TEXT,
    "isMating" BOOLEAN NOT NULL DEFAULT false,
    "cageInfo" TEXT,
    "flooringInfo" TEXT,
    "habitatNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_parents" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "parentType" "ParentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animal_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_images" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "codes_category_idx" ON "codes"("category");

-- CreateIndex
CREATE INDEX "codes_parentId_idx" ON "codes"("parentId");

-- CreateIndex
CREATE INDEX "codes_isActive_idx" ON "codes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "codes_category_code_key" ON "codes"("category", "code");

-- CreateIndex
CREATE INDEX "animals_tenantId_idx" ON "animals"("tenantId");

-- CreateIndex
CREATE INDEX "animals_uniqueId_idx" ON "animals"("uniqueId");

-- CreateIndex
CREATE INDEX "animals_isActive_idx" ON "animals"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "animals_tenantId_uniqueId_key" ON "animals"("tenantId", "uniqueId");

-- CreateIndex
CREATE INDEX "animal_codes_animalId_idx" ON "animal_codes"("animalId");

-- CreateIndex
CREATE INDEX "animal_codes_codeId_idx" ON "animal_codes"("codeId");

-- CreateIndex
CREATE UNIQUE INDEX "animal_codes_animalId_codeId_key" ON "animal_codes"("animalId", "codeId");

-- CreateIndex
CREATE UNIQUE INDEX "animal_details_animalId_key" ON "animal_details"("animalId");

-- CreateIndex
CREATE INDEX "animal_parents_animalId_idx" ON "animal_parents"("animalId");

-- CreateIndex
CREATE INDEX "animal_parents_parentId_idx" ON "animal_parents"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "animal_parents_animalId_parentId_key" ON "animal_parents"("animalId", "parentId");

-- CreateIndex
CREATE INDEX "animal_images_animalId_idx" ON "animal_images"("animalId");

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_codes" ADD CONSTRAINT "animal_codes_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_codes" ADD CONSTRAINT "animal_codes_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_details" ADD CONSTRAINT "animal_details_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_parents" ADD CONSTRAINT "animal_parents_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_parents" ADD CONSTRAINT "animal_parents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_images" ADD CONSTRAINT "animal_images_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
