-- AlterTable
ALTER TABLE "users" ADD COLUMN     "message" TEXT,
ADD COLUMN     "subject" TEXT;

-- CreateTable
CREATE TABLE "realisations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "realisations_pkey" PRIMARY KEY ("id")
);
