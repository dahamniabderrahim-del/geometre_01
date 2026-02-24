import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser, listActiveAdmins, pickPrimaryAdmin } from "@/lib/admin";
import { setLocalAuth } from "@/lib/local-auth";
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
          setLocalAuth({
            id: user.id,
            email: user.email,
            full_name:
              (user.user_metadata?.full_name as string | undefined) ||
              user.email.split("@")[0],
            avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
            role: "admin",
          });
        }
        navigate(redirectPath ?? "/admin/equipe");
      } else {
        const user = data.session?.user;
        const admins = await listActiveAdmins();
        const defaultAdmin = pickPrimaryAdmin(admins);

        if (user?.email) {
          const normalizedEmail = user.email.trim().toLowerCase();
          const userName =
            (user.user_metadata?.full_name as string | undefined) ||
            normalizedEmail.split("@")[0];

          const { data: existingUser } = await supabase
            .from("users")
            .select("id, name, email")
            .ilike("email", normalizedEmail)
            .limit(1)
            .maybeSingle();

          let localUser = existingUser;

          if (!existingUser) {
            const { data: insertedUser, error: upsertError } = await supabase
              .from("users")
              .upsert(
                {
                  id: user.id,
                  name: userName,
                  email: normalizedEmail,
                  password: "",
                  admin_id: defaultAdmin?.id ?? null,
                },
                { onConflict: "email" }
              )
              .select("id, name, email")
              .single();

            if (upsertError) {
              console.warn("Google signup users upsert failed:", upsertError.message);
            }

            localUser = insertedUser ?? null;
          }

          setLocalAuth({
            id: localUser?.id ?? user.id,
            email: localUser?.email ?? normalizedEmail,
            full_name: localUser?.name || userName,
            avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
            role: "user",
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
