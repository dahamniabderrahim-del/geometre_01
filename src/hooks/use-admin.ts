import { useEffect, useState } from "react";
import { fetchAdminByEmail } from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";
import type { AdminProfile } from "@/lib/admin";

export function useAdminProfile(email?: string | null) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!email) {
      setAdmin(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    fetchAdminByEmail(email)
      .then((data) => {
        if (!active) return;
        setAdmin(data);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [email]);

  const isAdmin = isAdminEmail(email) || Boolean(admin);

  return { admin, isAdmin, loading };
}
