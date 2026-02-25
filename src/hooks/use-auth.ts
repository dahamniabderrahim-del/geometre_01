import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  clearLocalAuth,
  getLocalAuthRecord,
  getLocalAuthUser,
  LOCAL_AUTH_CHANGED_EVENT,
  setLocalAuth,
} from "@/lib/local-auth";
import { supabase } from "@/integrations/supabase/client";
import { getPasswordFingerprint } from "@/lib/password-fingerprint";

const PASSWORD_CHECK_INTERVAL_MS = 3_000;

const sameTimestamp = (a?: string | null, b?: string | null) => {
  if (!a || !b) return false;
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  if (Number.isNaN(aMs) || Number.isNaN(bMs)) return a === b;
  return aMs === bMs;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const syncLocalAuth = () => {
      const localUser = getLocalAuthUser();
      setSession(null);
      setUser(localUser);
      setLoading(false);
    };

    const validatePasswordStamp = async () => {
      const record = getLocalAuthRecord();
      if (!record) return;
      const hasFingerprint = Boolean(record.password_fingerprint);
      const hasStamp = Boolean(record.password_updated_at);

      // Force one secure session format: fingerprint must exist.
      // Old/incomplete sessions are logged out immediately.
      if (!hasFingerprint) {
        clearLocalAuth();
        return;
      }

      if (record.role === "admin") {
        const { data, error } = await supabase
          .from("admins")
          .select("id, name, email, avatar_url, active, password, password_updated_at")
          .ilike("email", record.email.trim().toLowerCase())
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          console.warn("auth admin check failed:", error.message);
          return;
        }
        if (!data || !data.active) {
          clearLocalAuth();
          return;
        }

        if (record.id !== data.id || record.email !== data.email) {
          setLocalAuth({
            ...record,
            id: data.id,
            email: data.email,
            full_name: data.name?.trim() || record.full_name,
            avatar_url: data.avatar_url ?? record.avatar_url ?? null,
            password_updated_at: data.password_updated_at ?? record.password_updated_at ?? null,
          });
        }

        if (hasStamp) {
          const dbStamp = data.password_updated_at ?? null;
          if (!dbStamp || !sameTimestamp(record.password_updated_at, dbStamp)) {
            clearLocalAuth();
            return;
          }
        }

        if (hasFingerprint) {
          const dbFingerprint = await getPasswordFingerprint(data.password ?? "");
          if (record.password_fingerprint !== dbFingerprint) {
            clearLocalAuth();
            return;
          }
        }

        return;
      }

      const normalizedEmail = record.email.trim().toLowerCase();

      const { data: byId, error: byIdError } = await supabase
        .from("users")
        .select("id, name, email, password, password_updated_at")
        .eq("id", record.id)
        .maybeSingle();

      if (cancelled) return;
      if (byIdError) {
        console.warn("auth user(id) check failed:", byIdError.message);
        return;
      }

      let data = byId;

      if (!data) {
        const { data: byEmail, error: byEmailError } = await supabase
          .from("users")
          .select("id, name, email, password, password_updated_at")
          .ilike("email", normalizedEmail)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (byEmailError) {
          console.warn("auth user(email) check failed:", byEmailError.message);
          return;
        }
        data = byEmail;
      }

      if (!data) {
        clearLocalAuth();
        return;
      }

      if (record.id !== data.id || record.email !== data.email) {
        setLocalAuth({
          ...record,
          id: data.id,
          email: data.email,
          full_name: data.name?.trim() || record.full_name,
          password_updated_at: data.password_updated_at ?? record.password_updated_at ?? null,
        });
      }

      if (hasStamp) {
        const dbStamp = data.password_updated_at ?? null;
        if (!dbStamp || !sameTimestamp(record.password_updated_at, dbStamp)) {
          clearLocalAuth();
          return;
        }
      }

      if (hasFingerprint) {
        const dbFingerprint = await getPasswordFingerprint(data.password ?? "");
        if (record.password_fingerprint !== dbFingerprint) {
          clearLocalAuth();
        }
      }
    };

    syncLocalAuth();
    void validatePasswordStamp();

    window.addEventListener(LOCAL_AUTH_CHANGED_EVENT, syncLocalAuth);
    window.addEventListener("storage", syncLocalAuth);
    const handleFocus = () => {
      void validatePasswordStamp();
    };

    window.addEventListener("focus", handleFocus);

    const intervalId = window.setInterval(() => {
      void validatePasswordStamp();
    }, PASSWORD_CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener(LOCAL_AUTH_CHANGED_EVENT, syncLocalAuth);
      window.removeEventListener("storage", syncLocalAuth);
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(intervalId);
    };
  }, []);

  return { session, user, loading };
}
