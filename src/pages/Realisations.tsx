import { Layout } from "@/components/layout/Layout";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, CalendarDays, Ruler, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { uploadRealisationImage } from "@/lib/storage";
import { getReadableErrorMessage } from "@/lib/error-message";
import { format, isValid, parse, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const categoryOptions = [
  { id: "all", name: "Tous" },
  { id: "bornage", name: "Bornage" },
  { id: "division", name: "Division" },
  { id: "topographie", name: "Topographie" },
  { id: "expertise-fonciere", name: "Expertise fonciere" },
  { id: "copropriete", name: "Copropriete" },
  { id: "implantation", name: "Implantation" },
];

const formCategoryOptions = categoryOptions.filter((item) => item.id !== "all");

type Realisation = {
  id: string;
  admin_id: string;
  title: string;
  category: string;
  image_url: string;
  location: string;
  date: string;
  surface: string;
  description: string;
};

type RealisationForm = {
  title: string;
  category: string;
  image_url: string;
  location: string;
  date: string;
  surface: string;
  description: string;
};

const emptyForm: RealisationForm = {
  title: "",
  category: "bornage",
  image_url: "",
  location: "",
  date: "",
  surface: "",
  description: "",
};

const SAMPLE_REALISATIONS: Realisation[] = [
  {
    id: "sample-topo-1",
    admin_id: "sample",
    title: "Leve topographique pour projet de lotissement",
    category: "topographie",
    image_url:
      "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=1200&q=80",
    location: "Oran",
    date: "2026-01-12",
    surface: "12 ha",
    description:
      "Leve planimetrique et altimetrique complet pour la conception d'un lotissement residentiel avec integration des contraintes terrain.",
  },
  {
    id: "sample-topo-2",
    admin_id: "sample",
    title: "Modelisation topographique par drone",
    category: "topographie",
    image_url:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    location: "Mostaganem",
    date: "2025-11-08",
    surface: "95 ha",
    description:
      "Campagne drone photogrammetrique avec generation de modele numerique de terrain et orthophoto haute resolution.",
  },
  {
    id: "sample-exf-1",
    admin_id: "sample",
    title: "Expertise fonciere pour regularisation cadastrale",
    category: "expertise-fonciere",
    image_url:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    location: "Alger",
    date: "2025-10-21",
    surface: "3 200 m2",
    description:
      "Analyse documentaire, verification des emprises et rapport d'expertise pour appuyer un dossier de regularisation fonciere.",
  },
  {
    id: "sample-topo-3",
    admin_id: "sample",
    title: "Plan topographique pour infrastructure routiere",
    category: "topographie",
    image_url:
      "https://images.unsplash.com/photo-1473447198193-3d2bff7f6fce?auto=format&fit=crop&w=1200&q=80",
    location: "Constantine",
    date: "2025-09-03",
    surface: "18 km lineaires",
    description:
      "Leves de detail sur axe routier avec profils en long et en travers pour etudes techniques et implantation.",
  },
  {
    id: "sample-exf-2",
    admin_id: "sample",
    title: "Expertise contradictoire des limites de propriete",
    category: "expertise-fonciere",
    image_url:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    location: "Tlemcen",
    date: "2025-07-17",
    surface: "1 450 m2",
    description:
      "Mission d'expertise fonciere contradictoire avec constat sur site, confrontation des titres et propositions de resolution.",
  },
];

const dateFormats = ["dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy-MM-dd", "MMMM yyyy", "MMM yyyy"];

const parseRealisationDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fromIso = parseISO(trimmed);
  if (isValid(fromIso)) return fromIso;

  for (const pattern of dateFormats) {
    const parsed = parse(trimmed, pattern, new Date(), { locale: fr });
    if (isValid(parsed)) return parsed;
  }

  return null;
};

const formatRealisationDate = (value: string) => {
  const parsed = parseRealisationDate(value);
  if (!parsed) return value || "Date non renseignee";
  return format(parsed, "d MMMM yyyy", { locale: fr });
};

const Realisations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { admin, isAdmin } = useAdminProfile(user?.email);

  const [activeCategory, setActiveCategory] = useState("all");
  const [projects, setProjects] = useState<Realisation[]>([]);
  const [selectedProject, setSelectedProject] = useState<Realisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<RealisationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    const baseSelect = "id, title, category, image_url, location, date, surface, description";
    const withAdminSelect = `admin_id, ${baseSelect}`;

    const runQuery = async (withAdminId: boolean, adminId?: string) => {
      let query = supabase
        .from("realisations")
        .select(withAdminId ? withAdminSelect : baseSelect)
        .order("created_at", { ascending: false });

      if (adminId) {
        query = query.eq("admin_id", adminId);
      }

      return query;
    };

    let rows: any[] = [];
    let loadError: any = null;

    if (isAdmin && admin?.id) {
      const scoped = await runQuery(true, admin.id);
      rows = scoped.data ?? [];
      loadError = scoped.error;

      // If no rows for the current admin, fallback to all rows so the page does not look empty.
      if (!loadError && rows.length === 0) {
        const unscoped = await runQuery(true);
        rows = unscoped.data ?? [];
        loadError = unscoped.error;
      }

      // If admin_id-based query fails (schema mismatch/permissions), fallback to public field set.
      if (loadError) {
        const publicFallback = await runQuery(false);
        rows = publicFallback.data ?? [];
        loadError = publicFallback.error;
      }
    } else {
      // Public view does not need admin_id.
      const publicQuery = await runQuery(false);
      rows = publicQuery.data ?? [];
      loadError = publicQuery.error;
    }

    if (loadError) {
      console.error("realisations load failed:", loadError);
      setError("Connexion indisponible: affichage des realisations d'exemple.");
      setProjects(SAMPLE_REALISATIONS);
      setLoading(false);
      return;
    }

    const normalizedRows: Realisation[] = (rows ?? []).map((row: any) => ({
      id: row.id,
      admin_id: row.admin_id ?? "public",
      title: row.title,
      category: row.category,
      image_url: row.image_url,
      location: row.location,
      date: row.date,
      surface: row.surface,
      description: row.description,
    }));

    if (normalizedRows.length === 0) {
      setProjects(SAMPLE_REALISATIONS);
      setError(null);
      setLoading(false);
      return;
    }

    setProjects(normalizedRows);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, [isAdmin, admin?.id]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [activeCategory, projects]);

  const selectedFormDate = useMemo(() => parseRealisationDate(form.date), [form.date]);
  const selectedFormDateLabel = selectedFormDate
    ? format(selectedFormDate, "d MMMM yyyy", { locale: fr })
    : form.date || "Selectionner une date";

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Fichier invalide",
        description: "Veuillez sélectionner une image.",
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
      const publicUrl = await uploadRealisationImage(file);
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      toast({
        title: "Image uploadée",
        description: "L'image a été envoyée depuis votre ordinateur.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur upload",
        description: getReadableErrorMessage(error, "Impossible d'envoyer l'image."),
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleEdit = (item: Realisation) => {
    const parsedDate = parseRealisationDate(item.date);
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      image_url: item.image_url,
      location: item.location,
      date: parsedDate ? format(parsedDate, "yyyy-MM-dd") : "",
      surface: item.surface,
      description: item.description,
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

    const ok = window.confirm("Supprimer cette realisation ?");
    if (!ok) return;

    const { error: deleteError } = await supabase
      .from("realisations")
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

    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }

    if (editingId === id) {
      resetForm();
    }

    toast({
      title: "Realisation supprimee",
      description: "La realisation a ete retiree.",
    });

    await loadProjects();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin?.id) {
      toast({
        title: "Profil admin manquant",
        description: "Impossible de lier cette realisation a votre compte admin.",
        variant: "destructive",
      });
      return;
    }

    if (!form.title.trim() || !form.image_url.trim() || !form.date.trim()) {
      toast({
        title: "Champs manquants",
        description: "Titre, image et date sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const payload = {
      admin_id: admin.id,
      title: form.title.trim(),
      category: form.category,
      image_url: form.image_url.trim(),
      location: form.location.trim(),
      date: form.date.trim(),
      surface: form.surface.trim(),
      description: form.description.trim(),
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("realisations")
        .update(payload)
        .eq("id", editingId)
        .eq("admin_id", admin.id);

      if (updateError) {
        toast({
          title: "Erreur",
          description: getReadableErrorMessage(updateError, "Mise a jour impossible."),
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "Realisation modifiee",
        description: "Les changements ont ete enregistres.",
      });
    } else {
      const { error: insertError } = await supabase.from("realisations").insert(payload);

      if (insertError) {
        toast({
          title: "Erreur",
          description: getReadableErrorMessage(insertError, "Creation impossible."),
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "Realisation ajoutee",
        description: "La realisation a ete ajoutee.",
      });
    }

    resetForm();
    await loadProjects();
    setSaving(false);
  };

  return (
    <Layout>
      <section className="premium-hero">
        <div className="absolute inset-0 geometric-pattern opacity-10" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="mb-4 font-serif text-4xl font-bold text-primary-foreground md:text-5xl">
              Nos <span className="text-gradient">Realisations</span>
            </h1>
            <p className="text-lg text-primary-foreground/82">
              Decouvrez nos projets realises. Chaque mission temoigne de notre expertise et de notre engagement qualite.
            </p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="border-b border-border/70 bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="premium-card-strong p-6 sm:p-7">
              <h2 className="mb-4 font-serif text-xl font-bold">
                {editingId ? "Modifier une realisation" : "Ajouter une realisation"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Titre</label>
                    <Input name="title" value={form.title} onChange={handleFormChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Categorie</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleFormChange}
                      className="h-11 w-full rounded-xl border border-input/90 bg-white/80 px-3.5 text-sm shadow-[0_8px_18px_-14px_hsl(var(--foreground)/0.45)] backdrop-blur-sm"
                    >
                      {formCategoryOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Image (URL)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      name="image_url"
                      value={form.image_url}
                      onChange={handleFormChange}
                      placeholder="https://..."
                      required
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
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </div>
                  {uploadingImage && (
                    <p className="text-xs text-muted-foreground mt-2">Upload en cours...</p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Localisation</label>
                    <Input name="location" value={form.location} onChange={handleFormChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                      <Input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleFormChange}
                        required
                        className="h-11 pl-10"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selectedFormDate ? `Date selectionnee: ${selectedFormDateLabel}` : "Selectionnez une date de realisation"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            date: format(new Date(), "yyyy-MM-dd"),
                          }))
                        }
                      >
                        Aujourd'hui
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            date: format(new Date(new Date().setDate(new Date().getDate() - 1)), "yyyy-MM-dd"),
                          }))
                        }
                      >
                        Hier
                      </Button>
                      {form.date && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-muted-foreground"
                          onClick={() => setForm((prev) => ({ ...prev, date: "" }))}
                        >
                          Effacer
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Surface</label>
                    <Input name="surface" value={form.surface} onChange={handleFormChange} placeholder="1200 m2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <Textarea name="description" value={form.description} onChange={handleFormChange} rows={4} />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving || uploadingImage}>
                    {editingId ? "Mettre a jour" : "Ajouter"}
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

      <section className="sticky top-[104px] z-40 border-b border-border/70 bg-background/85 py-6 backdrop-blur-xl md:top-[136px]">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/80 p-2 shadow-soft">
            {categoryOptions.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted/75 hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
          {!loading && error && <p className="text-sm text-amber-600">{error}</p>}
          {!loading && !error && filteredProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune realisation pour le moment.</p>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-strong"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {isAdmin && admin?.id === project.admin_id && (
                    <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEdit(project);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="h-8 w-8 rounded-lg border-border/70 bg-card/90 text-primary hover:bg-card"
                        title="Modifier"
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(project.id);
                        }}
                        className="h-8 w-8 rounded-lg bg-destructive p-0 text-destructive-foreground hover:bg-destructive/90"
                        title="Supprimer"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <Badge variant="secondary" className="mb-3 border border-secondary/25 bg-secondary/15">
                    {categoryOptions.find((c) => c.id === project.category)?.name ?? project.category}
                  </Badge>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {project.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {formatRealisationDate(project.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Ruler className="w-4 h-4" />
                      {project.surface}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl rounded-3xl border border-border/80 bg-card/95 shadow-strong">
          {selectedProject && (
            <>
              <div className="-mx-6 -mt-6 mb-4 aspect-video overflow-hidden rounded-b-lg">
                <img
                  src={selectedProject.image_url}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <DialogHeader>
                <Badge variant="secondary" className="w-fit">
                  {categoryOptions.find((c) => c.id === selectedProject.category)?.name ?? selectedProject.category}
                </Badge>
                <DialogTitle className="font-serif text-2xl">{selectedProject.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {selectedProject.location}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    {formatRealisationDate(selectedProject.date)}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Ruler className="w-4 h-4" />
                    {selectedProject.surface}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{selectedProject.description}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Realisations;
