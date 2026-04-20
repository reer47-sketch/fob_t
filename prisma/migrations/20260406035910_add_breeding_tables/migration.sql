-- CreateEnum
CREATE TYPE "PairingStatus" AS ENUM ('WAITING', 'MATING', 'LAYING_SOON', 'LAID', 'DONE', 'COOLING');

-- CreateEnum
CREATE TYPE "EggStatus" AS ENUM ('INCUBATING', 'HATCHED', 'FAILED');

-- CreateEnum
CREATE TYPE "FertileStatus" AS ENUM ('UNKNOWN', 'FERTILE', 'INFERTILE');

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racks" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "cols" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "racks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rack_cells" (
    "id" TEXT NOT NULL,
    "rack_id" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "animal_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rack_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pairings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "female_id" TEXT NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "status" "PairingStatus" NOT NULL DEFAULT 'WAITING',
    "memo" TEXT,
    "done_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pairing_males" (
    "id" TEXT NOT NULL,
    "pairing_id" TEXT NOT NULL,
    "male_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pairing_males_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eggs" (
    "id" TEXT NOT NULL,
    "pairing_id" TEXT NOT NULL,
    "female_id" TEXT NOT NULL,
    "lay_date" TIMESTAMPTZ NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "fertile_status" "FertileStatus" NOT NULL DEFAULT 'UNKNOWN',
    "humidity" INTEGER,
    "substrate" TEXT,
    "status" "EggStatus" NOT NULL DEFAULT 'INCUBATING',
    "hatch_date" TIMESTAMPTZ,
    "memo" TEXT,
    "hatched_animal_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "eggs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_logs" (
    "id" SERIAL NOT NULL,
    "egg_id" TEXT NOT NULL,
    "temp" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temperature_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "zones_tenant_id_idx" ON "zones"("tenant_id");

-- CreateIndex
CREATE INDEX "racks_zone_id_idx" ON "racks"("zone_id");

-- CreateIndex
CREATE INDEX "rack_cells_rack_id_idx" ON "rack_cells"("rack_id");

-- CreateIndex
CREATE INDEX "rack_cells_animal_id_idx" ON "rack_cells"("animal_id");

-- CreateIndex
CREATE UNIQUE INDEX "rack_cells_rack_id_row_col_key" ON "rack_cells"("rack_id", "row", "col");

-- CreateIndex
CREATE INDEX "pairings_tenant_id_idx" ON "pairings"("tenant_id");

-- CreateIndex
CREATE INDEX "pairings_female_id_idx" ON "pairings"("female_id");

-- CreateIndex
CREATE INDEX "pairings_status_idx" ON "pairings"("status");

-- CreateIndex
CREATE INDEX "pairing_males_pairing_id_idx" ON "pairing_males"("pairing_id");

-- CreateIndex
CREATE INDEX "pairing_males_male_id_idx" ON "pairing_males"("male_id");

-- CreateIndex
CREATE UNIQUE INDEX "pairing_males_pairing_id_male_id_key" ON "pairing_males"("pairing_id", "male_id");

-- CreateIndex
CREATE UNIQUE INDEX "eggs_hatched_animal_id_key" ON "eggs"("hatched_animal_id");

-- CreateIndex
CREATE INDEX "eggs_pairing_id_idx" ON "eggs"("pairing_id");

-- CreateIndex
CREATE INDEX "eggs_female_id_idx" ON "eggs"("female_id");

-- CreateIndex
CREATE INDEX "eggs_status_idx" ON "eggs"("status");

-- CreateIndex
CREATE INDEX "eggs_lay_date_idx" ON "eggs"("lay_date");

-- CreateIndex
CREATE INDEX "temperature_logs_egg_id_idx" ON "temperature_logs"("egg_id");

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racks" ADD CONSTRAINT "racks_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rack_cells" ADD CONSTRAINT "rack_cells_rack_id_fkey" FOREIGN KEY ("rack_id") REFERENCES "racks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rack_cells" ADD CONSTRAINT "rack_cells_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_female_id_fkey" FOREIGN KEY ("female_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairing_males" ADD CONSTRAINT "pairing_males_pairing_id_fkey" FOREIGN KEY ("pairing_id") REFERENCES "pairings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairing_males" ADD CONSTRAINT "pairing_males_male_id_fkey" FOREIGN KEY ("male_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eggs" ADD CONSTRAINT "eggs_pairing_id_fkey" FOREIGN KEY ("pairing_id") REFERENCES "pairings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eggs" ADD CONSTRAINT "eggs_female_id_fkey" FOREIGN KEY ("female_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eggs" ADD CONSTRAINT "eggs_hatched_animal_id_fkey" FOREIGN KEY ("hatched_animal_id") REFERENCES "animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_egg_id_fkey" FOREIGN KEY ("egg_id") REFERENCES "eggs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
