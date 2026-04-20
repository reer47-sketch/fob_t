-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('CRICKET', 'MEALWORM', 'FEED', 'VEGETABLE', 'MOUSE', 'FROZEN_CHICK', 'FRUIT_FLY', 'OTHER');

-- CreateTable
CREATE TABLE "feedings" (
    "id" SERIAL NOT NULL,
    "animal_id" TEXT NOT NULL,
    "food_type" "FoodType" NOT NULL,
    "feeding_date" TIMESTAMPTZ NOT NULL,
    "quantity" TEXT,
    "memo" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feedings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedings_animal_id_idx" ON "feedings"("animal_id");

-- CreateIndex
CREATE INDEX "feedings_feeding_date_idx" ON "feedings"("feeding_date");

-- AddForeignKey
ALTER TABLE "feedings" ADD CONSTRAINT "feedings_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
