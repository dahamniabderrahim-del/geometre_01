import { Layout } from "@/components/layout/Layout";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { uploadPublicImage } from "@/lib/storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import serviceTopographieImage from "@/assets/service-topographie.jpg";
import serviceBornageImage from "@/assets/service-bornage.jpg";
import serviceFoncierImage from "@/assets/service-foncier.jpg";

type ServiceRow = {
  id: string;
  admin_id: string;
  title: string;
  slug: string;
  category: string | null;
  description: string;
  icon: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

type ServiceForm = {
  title: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  image_url: string;
  active: boolean;
  sort_order: number;
};

type ServiceSeedTemplate = {
  title: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  active: boolean;
  sort_order: number;
};

const REQUIRED_SERVICE_TEMPLATES: ServiceSeedTemplate[] = [
  {
    title: "Etablissement de document d'arpentage",
    slug: "etablissement-document-arpentage",
    category: "Foncier",
    description:
      "Preparation et etablissement du document d'arpentage pour vos demarches foncieres.\nReleve terrain et bornage selon les regles en vigueur.\nPlan et details techniques conformes au dossier administratif.\nAccompagnement jusqu'au depot du document.",
    icon: "file_check",
    active: true,
    sort_order: 90,
  },
  {
    title: "Bornage",
    slug: "bornage",
    category: "Foncier",
    description:
      "Delimitation officielle et contradictoire des proprietes.\nBornage amiable ou judiciaire selon votre dossier.\nReperes et plans de limites conformes aux normes.\nAccompagnement technique pour securiser vos droits fonciers.",
    icon: "map_pin",
    active: true,
    sort_order: 91,
  },
];

const DEFAULT_ARPENTAGE_SERVICE: ServiceRow = {
  id: "default-arpentage-service",
  admin_id: "default",
  title: "Etablissement de document d'arpentage",
  slug: "etablissement-document-arpentage",
  category: "Foncier",
  description: "Preparation et etablissement du document d'arpentage pour vos demarches foncieres.\nReleve terrain et bornage selon les regles en vigueur.\nPlan et details techniques conformes au dossier administratif.\nAccompagnement jusqu'au depot du document.",
  icon: "file_check",
  image_url: null,
  active: true,
  sort_order: 9000,
};

const emptyForm: ServiceForm = {
  title: "",
  slug: "",
  category: "",
  description: "",
  icon: "landmark",
  image_url: "",
  active: true,
  sort_order: 0,
};

const makeSlug = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const formatServiceCardTitle = (title: string) => {
  return title.replace(/\bet\b/gi, "&").replace(/\s+/g, " ").trim().toUpperCase();
};

const serviceFallbackImages = [
  serviceTopographieImage,
  serviceBornageImage,
  serviceFoncierImage,
];

const getServiceFallbackImage = (service: Pick<ServiceRow, "title" | "slug" | "category">, index: number) => {
  const text = `${service.title} ${service.slug} ${service.category ?? ""}`.toLowerCase();

  if (text.includes("topographie") || text.includes("mesur")) {
    return serviceTopographieImage;
  }

  if (text.includes("bornage") || text.includes("division") || text.includes("arpentage")) {
    return serviceBornageImage;
  }

  if (text.includes("foncier") || text.includes("expertise")) {
    return serviceFoncierImage;
  }

  return serviceFallbackImages[index % serviceFallbackImages.length];
};

const Services = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { admin, isAdmin } = useAdminProfile(user?.email);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const buildRequiredServiceRows = (adminId: string) => {
    return REQUIRED_SERVICE_TEMPLATES.map((item) => ({
      admin_id: adminId,
      title: item.title,
      slug: item.slug,
      category: item.category,
      description: item.description,
      icon: item.icon,
      image_url: null as string | null,
      active: item.active,
      sort_order: item.sort_order,
    }));
  };

  const ensureRequiredServicesForAdmin = async (
    adminId: string,
    ownRows: Pick<ServiceRow, "slug">[]
  ) => {
    const ownSlugs = new Set(ownRows.map((item) => item.slug.toLowerCase()));
    const missingRows = buildRequiredServiceRows(adminId).filter(
      (item) => !ownSlugs.has(item.slug.toLowerCase())
    );

    if (missingRows.length === 0) {
      return false;
    }

    const { error: ensureError } = await supabase
      .from("services")
      .upsert(missingRows, { onConflict: "admin_id,slug" });

    if (ensureError) {
      return false;
    }

    return true;
  };

  const seedServicesForAdmin = async (adminId: string) => {
    const { data: templateRows } = await supabase
      .from("services")
      .select("title, slug, category, description, icon, image_url, active, sort_order")
      .neq("admin_id", adminId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const rows = (templateRows ?? []).map((item) => ({
      admin_id: adminId,
      title: item.title,
      slug: item.slug,
      category: item.category,
      description: item.description,
      icon: item.icon,
      image_url: item.image_url,
      active: item.active,
      sort_order: item.sort_order,
    }));

    const rowSlugs = new Set(rows.map((item) => item.slug.toLowerCase()));
    for (const required of buildRequiredServiceRows(adminId)) {
      if (!rowSlugs.has(required.slug.toLowerCase())) {
        rows.push(required);
      }
    }

    if (rows.length === 0) {
      return false;
    }

    const { error: seedError } = await supabase
      .from("services")
      .upsert(rows, { onConflict: "admin_id,slug" });

    if (seedError) {
      return false;
    }

    return true;
  };

  const loadServices = async (allowSeed = true) => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("services")
      .select("id, admin_id, title, slug, category, description, icon, image_url, active, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (isAdmin && admin?.id) {
      // Admin page must still show active services from the table for public display,
      // while keeping admin management scoped to the admin-owned rows only.
      query = query.or(`admin_id.eq.${admin.id},active.eq.true`);
    } else {
      query = query.eq("active", true);
    }

    const { data, error: loadError } = await query;

    if (loadError) {
      setError("Impossible de charger les services.");
      setServices([]);
      setLoading(false);
      return;
    }

    if (isAdmin && admin?.id && allowSeed) {
      const ownRows = (data ?? []).filter((item) => item.admin_id === admin.id);
      const ownCount = ownRows.length;
      if (ownCount === 0) {
        const seeded = await seedServicesForAdmin(admin.id);
        if (seeded) {
          toast({
            title: "Services importes",
            description: "Les services ont ete ajoutes a votre compte admin.",
          });
          await loadServices(false);
          return;
        }
      } else {
        const ensured = await ensureRequiredServicesForAdmin(admin.id, ownRows);
        if (ensured) {
          toast({
            title: "Services ajoutes",
            description: "Etablissement de document d'arpentage et Bornage ont ete ajoutes.",
          });
          await loadServices(false);
          return;
        }
      }
    }

    setServices(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, [isAdmin, admin?.id]);

  const publicServices = useMemo(() => {
    const activeServices = services.filter((item) => item.active);
    const hasArpentageService = activeServices.some((item) => {
      const title = item.title.toLowerCase();
      const slug = item.slug.toLowerCase();
      return title.includes("arpentage") || slug.includes("arpentage");
    });

    const merged = hasArpentageService
      ? activeServices
      : [...activeServices, DEFAULT_ARPENTAGE_SERVICE];

    return merged
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
  }, [services]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "sort_order") {
      setForm((prev) => ({
        ...prev,
        sort_order: Number.isNaN(Number(value)) ? 0 : Number(value),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setUploadingImage(true);
      const publicUrl = await uploadPublicImage(file, "services");
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      toast({
        title: "Image uploadee",
        description: "La photo a ete envoyee depuis votre bureau.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur upload",
        description: error?.message ?? "Impossible d'envoyer l'image.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleEdit = (item: ServiceRow) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      slug: item.slug,
      category: item.category ?? "",
      description: item.description,
      icon: item.icon ?? "landmark",
      image_url: item.image_url ?? "",
      active: item.active,
      sort_order: item.sort_order,
    });
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 200);
  };

  const handleDelete = async (id: string) => {
    if (!admin?.id) {
      toast({
        title: "Acces refuse",
        description: "Compte admin requis.",
        variant: "destructive",
      });
      return;
    }

    const ok = window.confirm("Supprimer ce service ?");
    if (!ok) return;

    const { error: deleteError } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("admin_id", admin.id);

    if (deleteError) {
      toast({
        title: "Erreur",
        description: "Suppression impossible.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Service supprime",
      description: "Le service a ete retire.",
    });

    if (editingId === id) {
      resetForm();
    }

    await loadServices();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin?.id) {
      toast({
        title: "Profil admin manquant",
        description: "Impossible de lier ce service a votre compte admin.",
        variant: "destructive",
      });
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const slug = (form.slug.trim() || makeSlug(title)).trim();

    if (!title || !description) {
      toast({
        title: "Champs manquants",
        description: "Titre et description sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (!slug) {
      toast({
        title: "Slug invalide",
        description: "Le slug genere est vide. Modifiez le titre.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const payload = {
      admin_id: admin.id,
      title,
      slug,
      category: form.category.trim() || null,
      description,
      icon: form.icon.trim() || null,
      image_url: form.image_url.trim() || null,
      active: form.active,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("services")
        .update(payload)
        .eq("id", editingId)
        .eq("admin_id", admin.id);

      if (updateError) {
        toast({
          title: "Erreur",
          description: updateError.message || "Mise a jour impossible.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "Service modifie",
        description: "Les changements ont ete enregistres.",
      });
    } else {
      const { error: insertError } = await supabase.from("services").insert(payload);

      if (insertError) {
        toast({
          title: "Erreur",
          description: insertError.message || "Creation impossible.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "Service ajoute",
        description: "Le nouveau service est en ligne.",
      });
    }

    resetForm();
    await loadServices();
    setSaving(false);
  };

  return (
    <Layout>
      <section className="py-16 bg-muted geometric-pattern">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Nos <span className="text-gradient">Services</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Une gamme complete de prestations pour repondre a vos besoins fonciers et topographiques.
            </p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div ref={formCardRef} className="bg-card rounded-xl shadow-soft p-6">
              <h2 className="font-serif text-xl font-bold mb-4">
                {editingId ? "Modifier un service" : "Ajouter un service"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Titre</label>
                    <Input ref={titleInputRef} name="title" value={form.title} onChange={handleFieldChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Slug</label>
                    <Input
                      name="slug"
                      value={form.slug}
                      onChange={handleFieldChange}
                      placeholder="auto depuis le titre"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Categorie</label>
                  <Input name="category" value={form.category} onChange={handleFieldChange} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    URL image service (JPG)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      name="image_url"
                      value={form.image_url}
                      onChange={handleFieldChange}
                      placeholder="https://.../service.jpg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-3 min-w-[44px] text-base leading-none"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      title="Choisir depuis ordinateur"
                      aria-label="Choisir depuis ordinateur"
                    >
                      ...
                    </Button>
                    <Input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleServiceImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </div>
                  {uploadingImage && <p className="text-xs text-muted-foreground mt-2">Upload en cours...</p>}
                  {form.image_url && (
                    <div className="mt-3 w-16 h-16 rounded-lg bg-muted overflow-hidden border border-border flex items-center justify-center">
                      <img src={form.image_url} alt="Preview image service" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={handleFieldChange}
                    rows={5}
                    placeholder="Ligne 1: resume. Lignes suivantes: points forts."
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving || uploadingImage}>
                    {editingId ? (
                      <>
                        <Pencil className="w-4 h-4 mr-2" />
                        Modifier
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                      </>
                    )}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">Besoin d'accompagnement ?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Contactez-nous pour discuter de votre projet. Nous vous repondons sous 24h.
          </p>
          <Button variant="heroOutline" size="lg" asChild>
            <Link to="/contact">Nous contacter</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
