-- CreateTable
CREATE TABLE "label_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "label_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "label_templates_tenant_id_idx" ON "label_templates"("tenant_id");

-- AddForeignKey
ALTER TABLE "label_templates" ADD CONSTRAINT "label_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
