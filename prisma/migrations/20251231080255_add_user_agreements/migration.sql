-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agreed_at" TIMESTAMPTZ,
ADD COLUMN     "data_collection_agreed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketing_agreed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacy_agreed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "terms_agreed" BOOLEAN NOT NULL DEFAULT false;
