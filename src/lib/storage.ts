import { supabase } from "@/integrations/supabase/client";

const PUBLIC_IMAGES_BUCKET = "realisations-images";

function buildFilePath(file: File, folder = "uploads") {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExtension}`;
}

export async function uploadPublicImage(file: File, folder = "uploads") {
  const filePath = buildFilePath(file, folder);

  const { error } = await supabase.storage
    .from(PUBLIC_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(PUBLIC_IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadRealisationImage(file: File) {
  return uploadPublicImage(file, "realisations");
}

export async function uploadEquipeImage(file: File) {
  return uploadPublicImage(file, "equipe");
}

export async function uploadAdminAvatarImage(file: File) {
  return uploadPublicImage(file, "admins/avatar");
}

export async function uploadAdminHeroImage(file: File) {
  return uploadPublicImage(file, "admins/hero");
}
