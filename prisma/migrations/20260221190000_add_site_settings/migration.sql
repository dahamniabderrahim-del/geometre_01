-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL DEFAULT 'default',
    "cabinet_name" TEXT,
    "cabinet_subtitle" TEXT,
    "hero_badge" TEXT,
    "hero_title_before" TEXT,
    "hero_title_highlight" TEXT,
    "hero_title_after" TEXT,
    "hero_description" TEXT,
    "years_experience" INTEGER,
    "projects_completed" INTEGER,
    "response_hours" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

INSERT INTO "site_settings" ("key") VALUES ('default')
ON CONFLICT ("key") DO NOTHING;
