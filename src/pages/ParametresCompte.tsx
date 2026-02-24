import { Layout } from "@/components/layout/Layout";
import { GoogleAddressAutocomplete } from "@/components/inputs/GoogleAddressAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAdminCache, listActiveAdmins, pickPrimaryAdmin, type AdminProfile } from "@/lib/admin";
import { getLocalAuthRecord, setLocalAuth } from "@/lib/local-auth";
import { uploadAdminAvatarImage, uploadAdminHeroImage } from "@/lib/storage";
import { KeyRound, Save, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type AdminForm = {
  name: string;
  email: string;
  phone: string;
  active: boolean;
  cabinet_name: string;
  bio: string;
  address: string;
  city: string;
  opening_hours_weekdays: string;
  opening_hours_saturday: string;
  avatar_url: string;
  hero_image_url: string;
};

const DEFAULT_GEOMETRE_NAME = "";
const DEFAULT_CABINET_NAME = "";

const emptyAdminForm: AdminForm = {
  name: DEFAULT_GEOMETRE_NAME,
  email: "",
  phone: "",
  active: true,
  cabinet_name: DEFAULT_CABINET_NAME,
  bio: "",
  address: "",
  city: "",
  opening_hours_weekdays: "",
  opening_hours_saturday: "",
  avatar_url: "",
  hero_image_url: "",
};

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const ParametresCompte = () => {
  const { user, loading: authLoading } = useAuth();
  const { admin, isAdmin, loading: adminLoading } = useAdminProfile(user?.email);
  const { toast } = useToast();
  const [fallbackAdmin, setFallbackAdmin] = useState<AdminProfile | null>(null);
  const [loadingExistingValues, setLoadingExistingValues] = useState(false);

  const [form, setForm] = useState<AdminForm>(emptyAdminForm);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const currentAdmin = admin ?? fallbackAdmin;

  useEffect(() => {
    let active = true;

    if (!isAdmin) {
      setFallbackAdmin(null);
      setLoadingExistingValues(false);
      return () => {
        active = false;
      };
    }

    if (admin) {
      setFallbackAdmin(admin);
      setLoadingExistingValues(false);
      return () => {
        active = false;
      };
    }

    setLoadingExistingValues(true);
    listActiveAdmins()
      .then((admins) => {
        if (!active) return;
        setFallbackAdmin(pickPrimaryAdmin(admins));
        setLoadingExistingValues(false);
      })
      .catch(() => {
        if (!active) return;
        setFallbackAdmin(null);
        setLoadingExistingValues(false);
      });

    return () => {
      active = false;
    };
  }, [admin, isAdmin]);

  useEffect(() => {
    if (!currentAdmin) return;
    setForm({
      name: currentAdmin.name ?? DEFAULT_GEOMETRE_NAME,
      email: currentAdmin.email ?? "",
      phone: currentAdmin.phone ?? "",
      active: currentAdmin.active ?? true,
      cabinet_name: currentAdmin.tagline ?? DEFAULT_CABINET_NAME,
      bio: currentAdmin.bio ?? "",
      address: currentAdmin.address ?? "",
      city: currentAdmin.city ?? "",
      opening_hours_weekdays: currentAdmin.opening_hours_weekdays ?? "",
      opening_hours_saturday: currentAdmin.opening_hours_saturday ?? "",
      avatar_url: currentAdmin.avatar_url ?? "",
      hero_image_url: currentAdmin.hero_image_url ?? "",
    });
  }, [currentAdmin]);

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (address: string) => {
    setForm((prev) => ({ ...prev, address }));
  };

  const handleAddressSelect = ({ address, city }: { address: string; city: string }) => {
    setForm((prev) => ({
      ...prev,
      address,
      city: city || prev.city,
    }));
  };

  const saveAdminSettings = async () => {
    if (!isAdmin || !currentAdmin?.id) return;

    const geometreName = form.name.trim();
    const cabinetName = form.cabinet_name.trim();
    const email = normalizeEmail(form.email);
    if (!geometreName) {
      toast({
        title: "Champ requis",
        description: "Le nom du geometre est obligatoire.",
        variant: "destructive",
      });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir un email valide.",
        variant: "destructive",
      });
      return;
    }

    setSavingAdmin(true);

    if (email !== normalizeEmail(currentAdmin.email)) {
      const [{ data: existingAdmin }, { data: existingUser }] = await Promise.all([
        supabase
          .from("admins")
          .select("id")
          .ilike("email", email)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("users")
          .select("id")
          .ilike("email", email)
          .limit(1)
          .maybeSingle(),
      ]);

      if (existingAdmin && existingAdmin.id !== currentAdmin.id) {
        toast({
          title: "Email deja utilise",
          description: "Un autre compte admin utilise deja cet email.",
          variant: "destructive",
        });
        setSavingAdmin(false);
        return;
      }

      if (existingUser) {
        toast({
          title: "Email deja utilise",
          description: "Cet email est deja utilise par un utilisateur.",
          variant: "destructive",
        });
        setSavingAdmin(false);
        return;
      }
    }

    const payload = {
      name: geometreName,
      email,
      phone: form.phone.trim() || null,
      active: form.active,
      tagline: cabinetName || null,
      bio: form.bio.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      opening_hours_weekdays: form.opening_hours_weekdays.trim() || null,
      opening_hours_saturday: form.opening_hours_saturday.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      hero_image_url: form.hero_image_url.trim() || null,
    };

    const { error } = await supabase.from("admins").update(payload).eq("id", currentAdmin.id);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message || "Modification impossible.",
        variant: "destructive",
      });
      setSavingAdmin(false);
      return;
    }

    const localAuth = getLocalAuthRecord();
    if (localAuth && normalizeEmail(localAuth.email) === normalizeEmail(currentAdmin.email)) {
      setLocalAuth({
        ...localAuth,
        email,
        full_name: geometreName,
        avatar_url: payload.avatar_url ?? localAuth.avatar_url,
      });
    }

    toast({
      title: "Parametres mis a jour",
      description: "Les informations du geometre et du cabinet ont ete enregistrees.",
    });
    invalidateAdminCache();

    setSavingAdmin(false);
  };

  const uploadImage = async (file: File, kind: "avatar" | "hero") => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Fichier invalide",
        description: "Veuillez selectionner une image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Image trop lourde",
        description: "La taille maximale est 10 Mo.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (kind === "avatar") setUploadingAvatar(true);
      if (kind === "hero") setUploadingHero(true);

      const publicUrl = kind === "avatar"
        ? await uploadAdminAvatarImage(file)
        : await uploadAdminHeroImage(file);

      if (kind === "avatar") {
        setForm((prev) => ({ ...prev, avatar_url: publicUrl }));
      } else {
        setForm((prev) => ({ ...prev, hero_image_url: publicUrl }));
      }

      toast({
        title: "Image uploadee",
        description: "Image ajoutee depuis votre ordinateur.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur upload",
        description: error?.message ?? "Impossible d'envoyer l'image.",
        variant: "destructive",
      });
    } finally {
      if (kind === "avatar") setUploadingAvatar(false);
      if (kind === "hero") setUploadingHero(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, "avatar");
    e.target.value = "";
  };

  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, "hero");
    e.target.value = "";
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Mot de passe court",
        description: "Minimum 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== passwordConfirm) {
      toast({
        title: "Confirmation invalide",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    if (isAdmin && currentAdmin?.id) {
      const { error } = await supabase.from("admins").update({ password }).eq("id", currentAdmin.id);
      if (error) {
        toast({
          title: "Erreur",
          description: error.message || "Changement de mot de passe impossible.",
          variant: "destructive",
        });
        setSavingPassword(false);
        return;
      }
      invalidateAdminCache();
    } else if (user?.id) {
      const { error } = await supabase.from("users").update({ password }).eq("id", user.id);
      if (error) {
        toast({
          title: "Erreur",
          description: error.message || "Changement de mot de passe impossible.",
          variant: "destructive",
        });
        setSavingPassword(false);
        return;
      }
    } else {
      toast({
        title: "Erreur",
        description: "Compte introuvable.",
        variant: "destructive",
      });
      setSavingPassword(false);
      return;
    }

    toast({
      title: "Mot de passe modifie",
      description: "Votre mot de passe a ete mis a jour.",
    });

    setPassword("");
    setPasswordConfirm("");
    setSavingPassword(false);
  };

  if (authLoading || adminLoading || loadingExistingValues) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-muted-foreground mb-4">Vous devez etre connecte.</p>
            <Link to="/connexion">
              <Button>Se connecter</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-muted geometric-pattern">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Settings className="w-10 h-10 text-secondary" />
            Parametres du compte
          </h1>
          <p className="text-muted-foreground">Modifiez toutes les informations du compte.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 space-y-8">
          {isAdmin && (
            <>
              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <h2 className="font-serif text-xl font-bold mb-4">Informations du bureau</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nom du geometre expert foncier
                    </label>
                    <Input name="name" value={form.name} onChange={handleFieldChange} placeholder="Ex: Ayoub Benali" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <Input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFieldChange}
                      placeholder="admin@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Telephone</label>
                    <Input name="phone" value={form.phone} onChange={handleFieldChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Compte actif</label>
                    <div className="h-10 px-3 border border-input rounded-md bg-background flex items-center justify-between">
                      <span className="text-sm text-foreground">
                        {form.active ? "Actif" : "Inactif"}
                      </span>
                      <Switch
                        checked={form.active}
                        onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nom du cabinet
                    </label>
                    <Input
                      name="cabinet_name"
                      value={form.cabinet_name}
                      onChange={handleFieldChange}
                      placeholder="Ex: Cabinet geometre expert foncier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Adresse</label>
                    <GoogleAddressAutocomplete
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleAddressChange}
                      onAddressSelect={handleAddressSelect}
                      placeholder="Rechercher l'adresse du bureau"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Ville</label>
                    <Input name="city" value={form.city} onChange={handleFieldChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Horaires semaine</label>
                    <Input
                      name="opening_hours_weekdays"
                      value={form.opening_hours_weekdays}
                      onChange={handleFieldChange}
                      placeholder="Lun - Ven: 9h - 18h"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Horaires samedi</label>
                    <Input
                      name="opening_hours_saturday"
                      value={form.opening_hours_saturday}
                      onChange={handleFieldChange}
                      placeholder="Sam: 9h - 12h"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                  <Textarea name="bio" value={form.bio} onChange={handleFieldChange} rows={4} />
                </div>
                <div className="mt-4">
                  <Button type="button" onClick={saveAdminSettings} disabled={savingAdmin}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer informations
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <h2 className="font-serif text-xl font-bold mb-4">Photos du compte</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Photo profil (URL)</label>
                    <div className="flex gap-2">
                      <Input
                        name="avatar_url"
                        value={form.avatar_url}
                        onChange={handleFieldChange}
                        placeholder="https://.../photo.jpg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 px-3 min-w-[44px] text-base leading-none"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        title="Choisir depuis ordinateur"
                        aria-label="Choisir depuis ordinateur"
                      >
                        ...
                      </Button>
                    </div>
                    <Input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                      disabled={uploadingAvatar}
                    />
                    {form.avatar_url && (
                      <div className="mt-3 w-20 h-20 rounded-full border border-border overflow-hidden">
                        <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Image hero page d'accueil (URL)</label>
                    <div className="flex gap-2">
                      <Input
                        name="hero_image_url"
                        value={form.hero_image_url}
                        onChange={handleFieldChange}
                        placeholder="https://.../hero.jpg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 px-3 min-w-[44px] text-base leading-none"
                        onClick={() => heroInputRef.current?.click()}
                        disabled={uploadingHero}
                        title="Choisir depuis ordinateur"
                        aria-label="Choisir depuis ordinateur"
                      >
                        ...
                      </Button>
                    </div>
                    <Input
                      ref={heroInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHeroFileChange}
                      disabled={uploadingHero}
                    />
                    {form.hero_image_url && (
                      <div
                        className="mt-3 aspect-[4/2] rounded-lg border border-border overflow-hidden cursor-pointer"
                        onClick={() => heroInputRef.current?.click()}
                        title="Cliquer pour modifier l'image de la page d'accueil"
                      >
                        <img src={form.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Button type="button" onClick={saveAdminSettings} disabled={savingAdmin || uploadingAvatar || uploadingHero}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer photos
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="bg-card rounded-xl shadow-soft p-6 border border-border max-w-2xl">
            <h2 className="font-serif text-xl font-bold mb-4">Mot de passe</h2>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nouveau mot de passe</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirmer mot de passe</label>
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="******"
                />
              </div>
              <Button type="submit" disabled={savingPassword}>
                <KeyRound className="w-4 h-4 mr-2" />
                Changer mot de passe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ParametresCompte;
