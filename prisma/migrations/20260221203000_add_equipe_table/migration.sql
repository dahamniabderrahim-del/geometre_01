CREATE TABLE "equipe" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "bio" TEXT,
  "image_url" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "equipe_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "equipe_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "equipe_admin_id_active_sort_order_idx" ON "equipe"("admin_id", "active", "sort_order");

DROP TRIGGER IF EXISTS set_updated_at_equipe ON "equipe";
CREATE TRIGGER set_updated_at_equipe
BEFORE UPDATE ON "equipe"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
