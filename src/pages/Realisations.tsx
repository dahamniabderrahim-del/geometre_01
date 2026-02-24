import { Layout } from "@/components/layout/Layout";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Ruler } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { uploadRealisationImage } from "@/lib/storage";

const categoryOptions = [
  { id: "all", name: "Tous" },
  { id: "bornage", name: "Bornage" },
  { id: "division", name: "Division" },
  { id: "topographie", name: "Topographie" },
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

    let query = supabase
      .from("realisations")
      .select("id, admin_id, title, category, image_url, location, date, surface, description")
      .order("created_at", { ascending: false });

    if (isAdmin && admin?.id) {
      query = query.eq("admin_id", admin.id);
    }

    const { data, error: loadError } = await query;

    if (loadError) {
      setError("Impossible de charger les realisations.");
      setProjects([]);
      setLoading(false);
      return;
    }

    setProjects(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, [isAdmin, admin?.id]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [activeCategory, projects]);

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
        description: error?.message ?? "Impossible d'envoyer l'image.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleEdit = (item: Realisation) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      image_url: item.image_url,
      location: item.location,
      date: item.date,
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

    if (!form.title.trim() || !form.image_url.trim()) {
      toast({
        title: "Champs manquants",
        description: "Titre et image sont obligatoires.",
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
          description: updateError.message || "Mise a jour impossible.",
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
          description: insertError.message || "Creation impossible.",
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
      <section className="py-16 bg-muted geometric-pattern">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Nos <span className="text-gradient">Realisations</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Decouvrez nos projets realises. Chaque mission temoigne de notre expertise et de notre engagement qualite.
            </p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="bg-card rounded-xl shadow-soft p-6">
              <h2 className="font-serif text-xl font-bold mb-4">
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
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
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
                    <Input name="date" value={form.date} onChange={handleFormChange} placeholder="Mars 2026" />
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

      <section className="py-8 border-b border-border sticky top-[104px] md:top-[136px] bg-background/95 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
          {!loading && error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && filteredProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune realisation pour le moment.</p>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group cursor-pointer bg-card rounded-xl shadow-soft overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <Badge variant="secondary" className="mb-3">
                    {categoryOptions.find((c) => c.id === project.category)?.name ?? project.category}
                  </Badge>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {project.location}
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
        <DialogContent className="max-w-2xl">
          {selectedProject && (
            <>
              <div className="aspect-video overflow-hidden rounded-lg -mx-6 -mt-6 mb-4">
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
                    <Calendar className="w-4 h-4" />
                    {selectedProject.date}
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
