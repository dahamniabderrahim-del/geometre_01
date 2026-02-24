import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getLocalAuthUser, LOCAL_AUTH_CHANGED_EVENT } from "@/lib/local-auth";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncLocalAuth = () => {
      const localUser = getLocalAuthUser();
      setSession(null);
      setUser(localUser);
      setLoading(false);
    };

    syncLocalAuth();
    window.addEventListener(LOCAL_AUTH_CHANGED_EVENT, syncLocalAuth);
    window.addEventListener("storage", syncLocalAuth);

    return () => {
      window.removeEventListener(LOCAL_AUTH_CHANGED_EVENT, syncLocalAuth);
      window.removeEventListener("storage", syncLocalAuth);
    };
  }, []);

  return { session, user, loading };
}
