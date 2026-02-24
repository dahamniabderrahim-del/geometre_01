import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getConfiguredAdminEmails, isAdminEmail } from "@/lib/auth";

export type AdminProfile = Tables<"admins">;

type AdminWithCabinetAliases = AdminProfile & {
  cabinet_name?: string | null;
  nom_cabinet?: string | null;
};

const ADMIN_SELECT = "*";

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

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? "";
const nonEmpty = (value?: string | null) => Boolean(value?.trim());

export function getAdminCabinetName(admin?: AdminProfile | null) {
  const record = (admin ?? null) as AdminWithCabinetAliases | null;
  if (!record) return "";

  return (
    record.cabinet_name?.trim() ||
    record.tagline?.trim() ||
    record.nom_cabinet?.trim() ||
    ""
  );
}

const profileScore = (admin: AdminProfile) =>
  (nonEmpty(getAdminCabinetName(admin)) ? 4 : 0) +
  (nonEmpty(admin.grade) ? 3 : 0) +
  (nonEmpty(admin.name) ? 2 : 0) +
  (nonEmpty(admin.phone) ? 1 : 0) +
  (nonEmpty(admin.email) ? 1 : 0);

const byUpdatedAtDesc = (a: AdminProfile, b: AdminProfile) => {
  const updatedAtA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
  const updatedAtB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
  return updatedAtB - updatedAtA;
};

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
    .ilike("email", cacheKey)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
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
    .order("updated_at", { ascending: false })
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

export function pickPrimaryAdmin(admins: AdminProfile[]) {
  if (!admins.length) return null;
  const bestProfile = [...admins].sort((a, b) => {
    const scoreDiff = profileScore(b) - profileScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return byUpdatedAtDesc(a, b);
  })[0];

  const configuredEmails = getConfiguredAdminEmails();
  if (!configuredEmails.length) {
    return bestProfile ?? admins[0];
  }

  const matchedAdmin = admins.find((admin) =>
    configuredEmails.includes(normalizeEmail(admin.email))
  );

  if (matchedAdmin && profileScore(matchedAdmin) >= profileScore(bestProfile ?? matchedAdmin)) {
    return matchedAdmin;
  }

  return bestProfile ?? matchedAdmin ?? admins[0];
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
