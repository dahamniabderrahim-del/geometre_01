-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "slug" TEXT;
ALTER TABLE "admins" ADD COLUMN     "tagline" TEXT;
ALTER TABLE "admins" ADD COLUMN     "bio" TEXT;
ALTER TABLE "admins" ADD COLUMN     "address" TEXT;
ALTER TABLE "admins" ADD COLUMN     "city" TEXT;
ALTER TABLE "admins" ADD COLUMN     "avatar_url" TEXT;
ALTER TABLE "admins" ADD COLUMN     "hero_image_url" TEXT;
ALTER TABLE "admins" ADD COLUMN     "theme_primary" TEXT;
ALTER TABLE "admins" ADD COLUMN     "theme_primary_foreground" TEXT;
ALTER TABLE "admins" ADD COLUMN     "theme_secondary" TEXT;
ALTER TABLE "admins" ADD COLUMN     "theme_secondary_foreground" TEXT;
ALTER TABLE "admins" ADD COLUMN     "theme_gradient_hero" TEXT;
ALTER TABLE "admins" ADD COLUMN     "theme_gradient_gold" TEXT;

-- CreateTable
CREATE TABLE "admin_users" (
    "admin_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("admin_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_slug_key" ON "admins"("slug");

-- CreateIndex
CREATE INDEX "admin_users_user_id_idx" ON "admin_users"("user_id");

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
