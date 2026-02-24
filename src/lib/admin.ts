import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isAdminEmail } from "@/lib/auth";

export type AdminProfile = Tables<"admins">;

const ADMIN_SELECT =
  "id, name, grade, email, phone, active, slug, tagline, bio, address, city, opening_hours_weekdays, opening_hours_saturday, avatar_url, hero_image_url, theme_primary, theme_primary_foreground, theme_secondary, theme_secondary_foreground, theme_gradient_hero, theme_gradient_gold";

const CACHE_TTL_MS = 60_000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const now = () => Date.now();

const readCache = <T>(entry?: CacheEntry<T> | null): { hit: boolean; value?: T } => {
  if (!entry) return { hit: false };
  if (entry.expiresAt <= now()) return { hit: false };
  return { hit: true, value: entry.value };
};

let activeAdminsCache: CacheEntry<AdminProfile[]> | null = null;
let activeAdminsPromise: Promise<AdminProfile[]> | null = null;

const adminByEmailCache = new Map<string, CacheEntry<AdminProfile | null>>();
const adminByEmailPromise = new Map<string, Promise<AdminProfile | null>>();

const adminBySlugCache = new Map<string, CacheEntry<AdminProfile | null>>();
const adminBySlugPromise = new Map<string, Promise<AdminProfile | null>>();

export async function fetchAdminByEmail(email?: string | null) {
  if (!email) return null;
  const cacheKey = email.trim().toLowerCase();
  if (!cacheKey) return null;

  const cached = readCache(adminByEmailCache.get(cacheKey));
  if (cached.hit) {
    return cached.value ?? null;
  }

  const inFlight = adminByEmailPromise.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = supabase
    .from("admins")
    .select(ADMIN_SELECT)
    .eq("email", cacheKey)
    .eq("active", true)
    .maybeSingle()
    .then(({ data, error }) => {
      const value = error ? null : data ?? null;
      adminByEmailCache.set(cacheKey, { value, expiresAt: now() + CACHE_TTL_MS });
      adminByEmailPromise.delete(cacheKey);
      return value;
    })
    .catch(() => {
      adminByEmailPromise.delete(cacheKey);
      return null;
    });

  adminByEmailPromise.set(cacheKey, request);
  return request;
}

export async function fetchAdminBySlug(slug?: string | null) {
  if (!slug) return null;
  const cacheKey = slug.trim().toLowerCase();
  if (!cacheKey) return null;

  const cached = readCache(adminBySlugCache.get(cacheKey));
  if (cached.hit) {
    return cached.value ?? null;
  }

  const inFlight = adminBySlugPromise.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = supabase
    .from("admins")
    .select(ADMIN_SELECT)
    .eq("slug", cacheKey)
    .eq("active", true)
    .maybeSingle()
    .then(({ data, error }) => {
      const value = error ? null : data ?? null;
      adminBySlugCache.set(cacheKey, { value, expiresAt: now() + CACHE_TTL_MS });
      adminBySlugPromise.delete(cacheKey);
      return value;
    })
    .catch(() => {
      adminBySlugPromise.delete(cacheKey);
      return null;
    });

  adminBySlugPromise.set(cacheKey, request);
  return request;
}

export async function listActiveAdmins() {
  const cached = readCache(activeAdminsCache);
  if (cached.hit) {
    return cached.value ?? [];
  }

  if (activeAdminsPromise) {
    return activeAdminsPromise;
  }

  activeAdminsPromise = supabase
    .from("admins")
    .select(ADMIN_SELECT)
    .eq("active", true)
    .order("name", { ascending: true })
    .then(({ data, error }) => {
      const value = error ? [] : data ?? [];
      activeAdminsCache = { value, expiresAt: now() + CACHE_TTL_MS };
      activeAdminsPromise = null;
      return value;
    })
    .catch(() => {
      activeAdminsPromise = null;
      return [];
    });

  return activeAdminsPromise;
}

export async function isAdminUser(email?: string | null) {
  if (!email) return false;
  if (isAdminEmail(email)) return true;
  const admin = await fetchAdminByEmail(email);
  return Boolean(admin);
}

export function invalidateAdminCache() {
  activeAdminsCache = null;
  activeAdminsPromise = null;
  adminByEmailCache.clear();
  adminByEmailPromise.clear();
  adminBySlugCache.clear();
  adminBySlugPromise.clear();
}
