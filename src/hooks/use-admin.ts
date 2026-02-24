import { useEffect, useState } from "react";
import { ADMIN_CACHE_UPDATED_EVENT, fetchAdminByEmail } from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";
import type { AdminProfile } from "@/lib/admin";
import { getLocalAuthRecord } from "@/lib/local-auth";

const buildFallbackAdminFromLocal = (id: string, email: string, fullName: string): AdminProfile =>
  ({
    id,
    name: fullName,
    grade: null,
    email,
    password: "",
    phone: null,
    active: true,
    slug: null,
    tagline: null,
    bio: null,
    address: null,
    city: null,
    opening_hours_weekdays: null,
    opening_hours_saturday: null,
    avatar_url: null,
    hero_image_url: null,
    theme_primary: null,
    theme_primary_foreground: null,
    theme_secondary: null,
    theme_secondary_foreground: null,
    theme_gradient_hero: null,
    theme_gradient_gold: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdminProfile);

export function useAdminProfile(email?: string | null) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const normalizedEmail = email?.trim().toLowerCase() ?? null;

    if (!normalizedEmail) {
      setAdmin(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const loadAdmin = async () => {
      setLoading(true);
      try {
        const data = await fetchAdminByEmail(normalizedEmail);
        if (!active) return;
        setAdmin(data);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void loadAdmin();

    const onAdminCacheUpdated = () => {
      void loadAdmin();
    };

    window.addEventListener(ADMIN_CACHE_UPDATED_EVENT, onAdminCacheUpdated);

    return () => {
      active = false;
      window.removeEventListener(ADMIN_CACHE_UPDATED_EVENT, onAdminCacheUpdated);
    };
  }, [email]);

  const localAuth = getLocalAuthRecord();
  const normalizedHookEmail = email?.toLowerCase();
  const normalizedLocalEmail = localAuth?.email?.toLowerCase();
  const hasLocalAdminRole =
    Boolean(normalizedHookEmail) &&
    localAuth?.role === "admin" &&
    normalizedHookEmail === normalizedLocalEmail;

  const fallbackAdmin =
    !admin && hasLocalAdminRole && localAuth
      ? buildFallbackAdminFromLocal(
          localAuth.id,
          localAuth.email,
          localAuth.full_name || localAuth.email.split("@")[0]
        )
      : null;

  const isAdmin = hasLocalAdminRole || isAdminEmail(email) || Boolean(admin);

  return { admin: admin ?? fallbackAdmin, isAdmin, loading };
}
