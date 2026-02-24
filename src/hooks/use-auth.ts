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

const PASSWORD_CHECK_INTERVAL_MS = 10_000;

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

      if (record.role === "admin") {
        const { data, error } = await supabase
          .from("admins")
          .select("id, active, password_updated_at")
          .eq("id", record.id)
          .maybeSingle();

        if (cancelled || error) return;
        if (!data || !data.active) {
          clearLocalAuth();
          return;
        }

        const dbStamp = data.password_updated_at ?? null;

        if (!record.password_updated_at && dbStamp) {
          setLocalAuth({ ...record, password_updated_at: dbStamp });
          return;
        }

        if (record.password_updated_at && dbStamp && record.password_updated_at !== dbStamp) {
          clearLocalAuth();
        }

        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, password_updated_at")
        .eq("id", record.id)
        .maybeSingle();

      if (cancelled || error) return;
      if (!data) {
        clearLocalAuth();
        return;
      }

      const dbStamp = data.password_updated_at ?? null;

      if (!record.password_updated_at && dbStamp) {
        setLocalAuth({ ...record, password_updated_at: dbStamp });
        return;
      }

      if (record.password_updated_at && dbStamp && record.password_updated_at !== dbStamp) {
        clearLocalAuth();
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
