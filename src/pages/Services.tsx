import { Layout } from "@/components/layout/Layout";
import {
  Landmark,
  FileSpreadsheet,
  Building2,
  ScanLine,
  Crosshair,
  Scale,
  MapPin,
  FileText,
  Ruler,
  Compass,
  FileCheck,
  Plane,
  Calculator,
  CheckCircle2,
  Plus,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const iconMap: Record<string, LucideIcon> = {
  landmark: Landmark,
  file_spreadsheet: FileSpreadsheet,
  building2: Building2,
  scan_line: ScanLine,
  crosshair: Crosshair,
  scale: Scale,
  map_pin: MapPin,
  file_text: FileText,
  ruler: Ruler,
  compass: Compass,
  file_check: FileCheck,
  plane: Plane,
  calculator: Calculator,
};

const iconOptions = [
  { value: "landmark", label: "Landmark" },
  { value: "file_spreadsheet", label: "FileSpreadsheet" },
  { value: "building2", label: "Building2" },
  { value: "scan_line", label: "ScanLine" },
  { value: "crosshair", label: "Crosshair" },
  { value: "scale", label: "Scale" },
  { value: "map_pin", label: "MapPin" },
  { value: "file_text", label: "FileText" },
  { value: "ruler", label: "Ruler" },
  { value: "compass", label: "Compass" },
  { value: "file_check", label: "FileCheck" },
  { value: "plane", label: "Plane" },
  { value: "calculator", label: "Calculator" },
];

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
  const [serviceSearch, setServiceSearch] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

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

  const managedServices = useMemo(() => {
    if (!isAdmin || !admin?.id) return [];
    return services.filter((item) => item.admin_id === admin.id);
  }, [services, isAdmin, admin?.id]);

  const filteredManagedServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) return managedServices;

    return managedServices.filter((item) =>
      [item.title, item.slug, item.category ?? "", item.description]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [managedServices, serviceSearch]);

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
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl shadow-soft p-6">
              <h2 className="font-serif text-xl font-bold mb-4">
                {editingId ? "Modifier un service" : "Ajouter un service"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Titre</label>
                    <Input name="title" value={form.title} onChange={handleFieldChange} required />
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Categorie</label>
                    <Input name="category" value={form.category} onChange={handleFieldChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Icone</label>
                    <select
                      name="icon"
                      value={form.icon}
                      onChange={handleFieldChange}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {iconOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    URL image icone
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      name="image_url"
                      value={form.image_url}
                      onChange={handleFieldChange}
                      placeholder="https://.../icone.png"
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
                      <img src={form.image_url} alt="Preview icone service" className="w-full h-full object-cover" />
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

            <div className="overflow-hidden rounded-2xl border border-[#d8dde6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex flex-col gap-4 border-b border-[#e2e7ef] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#eef1f5] flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-[#3b4a63]" />
                  </div>
                  <div>
                    <h2 className="text-[2rem] font-bold leading-none text-[#111827]">Liste services</h2>
                    <p className="mt-1 text-sm text-[#5c6f88]">{filteredManagedServices.length} services trouves</p>
                  </div>
                </div>

                <div className="relative w-full sm:w-[260px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a98ad]" />
                  <Input
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="h-10 rounded-2xl border-[#cfd6e1] bg-[#f8fafc] pl-9 text-sm text-[#334155] placeholder:text-[#94a3b8]"
                  />
                </div>
              </div>

              <div className="p-6">
                {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
                {!loading && managedServices.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun service.</p>
                )}
                {!loading && managedServices.length > 0 && filteredManagedServices.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun resultat pour cette recherche.</p>
                )}

                {!loading && filteredManagedServices.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-[#e2e7ef] bg-white">
                    <table className="min-w-[860px] w-full text-[0.9rem]">
                      <thead className="bg-[#f8fafc]">
                        <tr>
                          <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Photo</th>
                          <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Titre</th>
                          <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Categorie</th>
                          <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Statut</th>
                          <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredManagedServices.map((item) => {
                          const Icon = iconMap[item.icon ?? ""] ?? Landmark;

                          return (
                            <tr key={item.id} className="border-t border-[#e5e9f0] bg-white text-[0.88rem] text-[#1f2937] hover:bg-[#fff7d6]">
                              <td className="px-5 py-4">
                                <div className="w-10 h-10 rounded-full bg-[#e3d5a4] border border-[#d6c793] overflow-hidden flex items-center justify-center text-[#1f2a44]">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <Icon className="w-4 h-4" />
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-[#111827]">{item.title}</p>
                                <p className="text-[0.78rem] text-[#7b8aa0]">{item.slug}</p>
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-lg bg-[#d9dce2] px-3 py-1.5 text-[0.82rem] font-medium text-[#1f2a44]">
                                  {item.category || "Sans categorie"}
                                </span>
                              </td>
                              <td className="px-5 py-4 font-medium">{item.active ? "Actif" : "Inactif"}</td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                    className="h-8 rounded-xl border-[#cdd4de] bg-white px-4 text-[#111827] hover:bg-[#f8fafc]"
                                  >
                                    <Pencil className="w-4 h-4 mr-1" />
                                    Modifier
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
                                    className="h-8 w-8 rounded-md bg-[#ef2d2d] p-0 text-white hover:bg-[#dc2626]"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!loading && (
                  <div className="mt-3 flex items-center justify-between rounded-b-xl border border-t-0 border-[#e2e7ef] bg-[#f6f8fc] px-4 py-3">
                    <p className="text-sm text-[#6b7890]">
                      Affichage de {filteredManagedServices.length} sur {managedServices.length} services
                    </p>
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#1f2d50] px-3 text-sm font-semibold text-white">
                      1
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
          {!loading && error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && publicServices.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun service actif pour le moment.</p>
          )}

          <div className="space-y-16">
            {publicServices.map((service, index) => {
              const Icon = iconMap[service.icon ?? ""] ?? Landmark;
              const lines = service.description
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean);
              const mainDescription = lines[0] ?? service.description;
              const features = lines.length > 1 ? lines.slice(1) : [];

              return (
                <div
                  key={service.id}
                  className={`grid lg:grid-cols-2 gap-8 items-center ${
                    index % 2 === 1 ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                    <div className="w-14 h-14 rounded-xl hero-gradient flex items-center justify-center mb-6 overflow-hidden">
                      {service.image_url ? (
                        <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-7 h-7 text-primary-foreground" />
                      )}
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {service.title}
                    </h2>
                    {service.category && (
                      <p className="text-sm text-secondary font-medium mb-3">{service.category}</p>
                    )}
                    <p className="text-muted-foreground mb-6 leading-relaxed">{mainDescription}</p>
                    {features.length > 0 && (
                      <ul className="space-y-3 mb-6">
                        {features.map((feature) => (
                          <li key={`${service.id}-${feature}`} className="flex items-center gap-3 text-sm text-foreground">
                            <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button asChild>
                      <Link to="/contact">Envoyer un message</Link>
                    </Button>
                  </div>
                  <div className={`${index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                    <div className="aspect-[4/3] rounded-2xl bg-muted shadow-soft flex items-center justify-center">
                      {service.image_url ? (
                        <img src={service.image_url} alt={service.title} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Icon className="w-24 h-24 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
