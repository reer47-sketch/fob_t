/*
  Warnings:

  - The primary key for the `tenant_codes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `tenant_codes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tenant_codes" DROP CONSTRAINT "tenant_codes_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "tenant_codes_pkey" PRIMARY KEY ("id");
