import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  clearLocalAuth,
  getLocalAuthRecord,
  getLocalAuthUser,
  LOCAL_AUTH_CHANGED_EVENT,
} from "@/lib/local-auth";
import { supabase } from "@/integrations/supabase/client";
import { getPasswordFingerprint } from "@/lib/password-fingerprint";

const PASSWORD_CHECK_INTERVAL_MS = 3_000;

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
          .select("id, active, password, password_updated_at")
          .eq("id", record.id)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          clearLocalAuth();
          return;
        }
        if (!data || !data.active) {
          clearLocalAuth();
          return;
        }

        if (hasStamp) {
          const dbStamp = data.password_updated_at ?? null;
          if (!dbStamp || record.password_updated_at !== dbStamp) {
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

      const { data, error } = await supabase
        .from("users")
        .select("id, password, password_updated_at")
        .eq("id", record.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        clearLocalAuth();
        return;
      }
      if (!data) {
        clearLocalAuth();
        return;
      }

      if (hasStamp) {
        const dbStamp = data.password_updated_at ?? null;
        if (!dbStamp || record.password_updated_at !== dbStamp) {
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
