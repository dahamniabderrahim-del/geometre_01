import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { listActiveAdmins } from "@/lib/admin";
import type { AdminProfile } from "@/lib/admin";
import { setLocalAuth } from "@/lib/local-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Chrome, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const INVALID_TABLE_CREDENTIALS = "invalid_table_credentials";

const isEmailAlreadyExistsError = (error?: { message?: string | null; code?: string | null } | null) => {
  const normalizedMessage = (error?.message ?? "").toLowerCase();
  const code = (error?.code ?? "").toLowerCase();
  return (
    code === "23505" ||
    normalizedMessage.includes("duplicate key value") ||
    normalizedMessage.includes("email deja utilise") ||
    normalizedMessage.includes("email already")
  );
};

const Connexion = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [defaultAdmin, setDefaultAdmin] = useState<AdminProfile | null>(null);
  const [adminLookupLoading, setAdminLookupLoading] = useState(true);
  const redirectParam = new URLSearchParams(location.search).get("redirect");
  const redirectPath =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null;

  useEffect(() => {
    let active = true;

    const loadDefaultAdmin = async () => {
      setAdminLookupLoading(true);
      const data = await listActiveAdmins();
      if (!active) return;
      setDefaultAdmin(data[0] ?? null);
      setAdminLookupLoading(false);
    };

    loadDefaultAdmin();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signin") {
        const signInEmail = normalizeEmail(formData.email);
        const signInPassword = formData.password;

        const { data: adminRow } = await supabase
          .from("admins")
          .select("id, name, email, password, active, avatar_url")
          .ilike("email", signInEmail)
          .limit(1)
          .maybeSingle();

        if (adminRow?.active && adminRow.password === signInPassword) {
          setLocalAuth({
            id: adminRow.id,
            email: adminRow.email,
            full_name: adminRow.name || signInEmail.split("@")[0],
            avatar_url: adminRow.avatar_url,
            role: "admin",
          });
          toast({
            title: "Connexion reussie",
            description: "Bienvenue !",
          });
          navigate(redirectPath ?? "/admin/equipe");
          return;
        }

        const { data: userRow } = await supabase
          .from("users")
          .select("id, name, email, password")
          .ilike("email", signInEmail)
          .limit(1)
          .maybeSingle();

        if (userRow && userRow.password === signInPassword) {
          setLocalAuth({
            id: userRow.id,
            email: userRow.email,
            full_name: userRow.name || signInEmail.split("@")[0],
            role: "user",
          });
          toast({
            title: "Connexion reussie",
            description: "Bienvenue !",
          });
          navigate(redirectPath ?? "/");
          return;
        }

        throw new Error(INVALID_TABLE_CREDENTIALS);
      } else {
        if (!formData.name.trim()) {
          toast({
            title: "Nom requis",
            description: "Veuillez renseigner votre nom complet.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!defaultAdmin?.id) {
          toast({
            title: "Admin manquant",
            description: "Aucun admin actif disponible pour lier ce compte.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: "Mot de passe court",
            description: "Minimum 6 caracteres.",
            variant: "destructive",
          });
          return;
        }

        const signupEmail = normalizeEmail(formData.email);
        const signupPassword = formData.password;

        const [{ data: existingAdmin }, { data: existingUser }] = await Promise.all([
          supabase.from("admins").select("id").ilike("email", signupEmail).limit(1).maybeSingle(),
          supabase.from("users").select("id").ilike("email", signupEmail).limit(1).maybeSingle(),
        ]);

        if (existingAdmin || existingUser) {
          toast({
            title: "Email deja utilise",
            description: "Un compte avec cet email existe deja.",
            variant: "destructive",
          });
          return;
        }

        const { data: insertedUser, error: insertError } = await supabase
          .from("users")
          .insert({
            name: formData.name.trim(),
            email: signupEmail,
            password: signupPassword,
            admin_id: defaultAdmin.id,
          })
          .select("id, name, email")
          .single();

        if (insertError || !insertedUser) {
          throw insertError ?? new Error("Creation du compte impossible.");
        }

        setLocalAuth({
          id: insertedUser.id,
          email: insertedUser.email,
          full_name: insertedUser.name || signupEmail.split("@")[0],
          role: "user",
        });

        toast({
          title: "Compte cree",
          description: "Votre compte a ete cree avec succes.",
        });
        navigate(redirectPath ?? "/");
        return;
      }
    } catch (err: any) {
      if (mode === "signin" && err?.message === INVALID_TABLE_CREDENTIALS) {
        toast({
          title: "Connexion impossible",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive",
        });
        return;
      }

      if (mode === "signup" && isEmailAlreadyExistsError(err)) {
        toast({
          title: "Email deja utilise",
          description: "Un compte avec cet email existe deja.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erreur",
        description: err?.message ?? "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`,
      },
    });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <section className="py-16 bg-muted geometric-pattern border-b border-border/70">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              <ShieldCheck className="w-3.5 h-3.5" />
              Espace securise
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              {mode === "signin" ? "Se connecter" : "Creer un compte"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {mode === "signin"
                ? "Accedez a votre espace."
                : "Creez un compte pour suivre vos demandes."}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl">
            <div className="bg-card rounded-2xl border border-border shadow-medium p-8 md:p-10">
              <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    mode === "signin"
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    mode === "signup"
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Creer un compte
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-border font-medium"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Chrome className="w-4 h-4" />
                Continuer avec Google
              </Button>
              <div className="flex items-center gap-3 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou avec email
                <span className="h-px flex-1 bg-border" />
              </div>
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@exemple.com"
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    className="h-11 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && !adminLookupLoading && !defaultAdmin && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Aucun admin actif disponible.
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-11"
                disabled={isLoading || (mode === "signup" && !defaultAdmin)}
              >
                {mode === "signin" ? "Se connecter" : "Creer le compte"}
              </Button>
            </form>

            <div className="text-sm text-muted-foreground mt-6 text-center">
              {mode === "signin" ? (
                <>
                  Pas encore de compte?{" "}
                  <button
                    type="button"
                    className="text-secondary hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Creer un compte
                  </button>
                </>
              ) : (
                <>
                  Deja un compte?{" "}
                  <button
                    type="button"
                    className="text-secondary hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </section>
    </Layout>
  );
};

export default Connexion;
