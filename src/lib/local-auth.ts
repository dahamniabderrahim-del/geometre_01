import type { User } from "@supabase/supabase-js";

export type LocalAuthRecord = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: "admin" | "user";
  password_updated_at?: string | null;
  password_fingerprint?: string | null;
};

const STORAGE_KEY = "geomweb_local_auth";
export const LOCAL_AUTH_CHANGED_EVENT = "geomweb-local-auth-changed";

const canUseWindow = () => typeof window !== "undefined";

const buildUserFromRecord = (record: LocalAuthRecord): User => {
  return {
    id: record.id,
    email: record.email,
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {
      full_name: record.full_name,
      avatar_url: record.avatar_url ?? undefined,
      role: record.role,
      password_updated_at: record.password_updated_at ?? undefined,
      password_fingerprint: record.password_fingerprint ?? undefined,
    },
  } as User;
};

export function setLocalAuth(record: LocalAuthRecord) {
  if (!canUseWindow()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new Event(LOCAL_AUTH_CHANGED_EVENT));
}

export function clearLocalAuth() {
  if (!canUseWindow()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(LOCAL_AUTH_CHANGED_EVENT));
}

export function getLocalAuthRecord(): LocalAuthRecord | null {
  if (!canUseWindow()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LocalAuthRecord>;
    if (!parsed?.id || !parsed?.email) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      full_name: parsed.full_name ?? parsed.email.split("@")[0],
      avatar_url: parsed.avatar_url ?? null,
      role: parsed.role === "admin" ? "admin" : "user",
      password_updated_at:
        typeof parsed.password_updated_at === "string" ? parsed.password_updated_at : null,
      password_fingerprint:
        typeof parsed.password_fingerprint === "string" ? parsed.password_fingerprint : null,
    };
  } catch {
    return null;
  }
}

export function getLocalAuthUser(): User | null {
  const record = getLocalAuthRecord();
  if (!record) return null;
  return buildUserFromRecord(record);
}
