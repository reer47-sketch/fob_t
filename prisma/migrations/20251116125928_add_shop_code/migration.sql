/*
  Warnings:

  - A unique constraint covering the columns `[shop_code]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "shop_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_shop_code_key" ON "tenants"("shop_code");
