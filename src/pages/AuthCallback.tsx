import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser, listActiveAdmins, pickPrimaryAdmin } from "@/lib/admin";
import { setLocalAuth } from "@/lib/local-auth";
import { getPasswordFingerprint } from "@/lib/password-fingerprint";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectParam = new URLSearchParams(location.search).get("redirect");
  const redirectPath =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null;

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        navigate(redirectPath ? `/connexion?redirect=${encodeURIComponent(redirectPath)}` : "/connexion");
        return;
      }

      const email = data.session?.user?.email;
      const isAdmin = await isAdminUser(email);
      if (isAdmin) {
        const user = data.session?.user;
        if (user?.id && user.email) {
          const { data: adminRow } = await supabase
            .from("admins")
            .select("id, name, email, avatar_url, password, password_updated_at")
            .ilike("email", user.email.trim().toLowerCase())
            .eq("active", true)
            .limit(1)
            .maybeSingle();

          const passwordFingerprint = await getPasswordFingerprint(adminRow?.password ?? "");
          setLocalAuth({
            id: adminRow?.id ?? user.id,
            email: adminRow?.email ?? user.email,
            full_name:
              adminRow?.name ||
              (user.user_metadata?.full_name as string | undefined) ||
              user.email.split("@")[0],
            avatar_url:
              adminRow?.avatar_url ??
              (user.user_metadata?.avatar_url as string | undefined) ??
              null,
            role: "admin",
            password_updated_at: adminRow?.password_updated_at ?? null,
            password_fingerprint: passwordFingerprint,
          });
        }
        navigate(redirectPath ?? "/admin/equipe");
      } else {
        const user = data.session?.user;
        const admins = await listActiveAdmins();
        const defaultAdmin = pickPrimaryAdmin(admins);
        const targetAdminId = defaultAdmin?.id ?? null;

        if (user?.email) {
          const normalizedEmail = user.email.trim().toLowerCase();
          const userName =
            (user.user_metadata?.full_name as string | undefined) ||
            normalizedEmail.split("@")[0];

          const { data: upsertedUser, error: upsertError } = await supabase
            .from("users")
            .upsert(
              {
                name: userName,
                email: normalizedEmail,
                password: "",
                admin_id: targetAdminId,
              },
              { onConflict: "email" }
            )
            .select("id, name, email, password, password_updated_at")
            .single();

          if (upsertError) {
            console.warn("Google signup users upsert failed:", upsertError.message);
          }

          const passwordFingerprint = await getPasswordFingerprint(upsertedUser?.password ?? "");
          setLocalAuth({
            id: upsertedUser?.id ?? user.id,
            email: upsertedUser?.email ?? normalizedEmail,
            full_name: upsertedUser?.name || userName,
            avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
            role: "user",
            password_updated_at: upsertedUser?.password_updated_at ?? null,
            password_fingerprint: passwordFingerprint,
          });
        }
        navigate(redirectPath ?? "/");
      }
    };

    run();
  }, [navigate, redirectPath]);

  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <p className="text-muted-foreground">Connexion en cours...</p>
        </div>
      </section>
    </Layout>
  );
};

export default AuthCallback;
