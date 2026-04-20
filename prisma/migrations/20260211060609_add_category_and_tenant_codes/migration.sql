-- AlterEnum
ALTER TYPE "CodeCategory" ADD VALUE 'CATEGORY';

-- CreateTable
CREATE TABLE "tenant_codes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_codes_tenant_id_idx" ON "tenant_codes"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_codes_code_id_idx" ON "tenant_codes"("code_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_codes_tenant_id_code_id_key" ON "tenant_codes"("tenant_id", "code_id");

-- AddForeignKey
ALTER TABLE "tenant_codes" ADD CONSTRAINT "tenant_codes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_codes" ADD CONSTRAINT "tenant_codes_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
