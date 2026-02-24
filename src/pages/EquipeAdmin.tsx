import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { uploadEquipeImage } from "@/lib/storage";
import { Plus, Pencil, Search, Trash2, Users } from "lucide-react";

type EquipeRow = {
  id: string;
  admin_id: string;
  prenom: string | null;
  name: string;
  role: string | null;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

type EquipeForm = {
  prenom: string;
  name: string;
  role: string;
  date_of_birth: string;
  email: string;
  phone: string;
  bio: string;
  image_url: string;
  active: boolean;
  sort_order: number;
};

const roleOptions = [
  "Geometre-Expert",
  "Ingenieur Topographe",
  "Technicien Topographe",
  "Responsable Cadastre",
  "Expert Foncier",
  "Assistant du Geometre",
  "Technicien Drone",
  "Dessinateur DAO",
  "Assistant Administratif",
];

const emptyForm: EquipeForm = {
  prenom: "",
  name: "",
  role: "",
  date_of_birth: "",
  email: "",
  phone: "",
  bio: "",
  image_url: "",
  active: true,
  sort_order: 0,
};

const EquipeAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const { admin, isAdmin, loading: adminLoading } = useAdminProfile(user?.email);
  const { toast } = useToast();

  const [members, setMembers] = useState<EquipeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<EquipeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const addImageInputRef = useRef<HTMLInputElement | null>(null);
  const rowImageInputRef = useRef<HTMLInputElement | null>(null);

  const [rowEditId, setRowEditId] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<EquipeForm>(emptyForm);
  const [rowSaving, setRowSaving] = useState(false);
  const [rowUploadingImage, setRowUploadingImage] = useState(false);
  const [showRowImageOptions, setShowRowImageOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const hasCustomRole = form.role.trim() !== "" && !roleOptions.includes(form.role.trim());
  const rowHasCustomRole =
    rowDraft.role.trim() !== "" && !roleOptions.includes(rowDraft.role.trim());

  const filteredMembers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return members;

    return members.filter((member) =>
      [
        member.prenom ?? "",
        member.name ?? "",
        member.role ?? "",
        member.email ?? "",
        member.phone ?? "",
        member.date_of_birth ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [members, searchTerm]);

  const loadMembers = async () => {
    if (!admin?.id) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("equipe")
      .select(
        "id, admin_id, prenom, name, role, date_of_birth, email, phone, bio, image_url, active, sort_order"
      )
      .eq("admin_id", admin.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setMembers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadMembers();
  }, [isAdmin, admin?.id]);

  const resetForm = () => {
    setForm(emptyForm);
  };

  const cancelRowEdit = () => {
    setRowEditId(null);
    setRowDraft(emptyForm);
    setShowRowImageOptions(false);
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

  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, active: e.target.checked }));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const publicUrl = await uploadEquipeImage(file);
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

  const startRowEdit = (item: EquipeRow) => {
    setRowEditId(item.id);
    setRowDraft({
      prenom: item.prenom ?? "",
      name: item.name,
      role: item.role ?? "",
      date_of_birth: item.date_of_birth ?? "",
      email: item.email ?? "",
      phone: item.phone ?? "",
      bio: item.bio ?? "",
      image_url: item.image_url ?? "",
      active: item.active,
      sort_order: item.sort_order,
    });
    setShowRowImageOptions(false);
  };

  const handleRowDraftChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "sort_order") {
      setRowDraft((prev) => ({
        ...prev,
        sort_order: Number.isNaN(Number(value)) ? 0 : Number(value),
      }));
      return;
    }

    setRowDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowDraft((prev) => ({ ...prev, active: e.target.checked }));
  };

  const handleRowImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setRowUploadingImage(true);
      const publicUrl = await uploadEquipeImage(file);
      setRowDraft((prev) => ({ ...prev, image_url: publicUrl }));
      toast({
        title: "Image uploadee",
        description: "La photo du membre a ete mise a jour.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur upload",
        description: error?.message ?? "Impossible d'envoyer l'image.",
        variant: "destructive",
      });
    } finally {
      setRowUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Supprimer ce membre de l'equipe ?");
    if (!ok) return;

    const { error } = await supabase.from("equipe").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erreur",
        description: "Suppression impossible.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Membre supprime",
      description: "Le membre a ete retire de l'equipe.",
    });

    if (rowEditId === id) {
      cancelRowEdit();
    }

    await loadMembers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin?.id) {
      toast({
        title: "Profil admin manquant",
        description: "Impossible de lier ce membre a votre compte admin.",
        variant: "destructive",
      });
      return;
    }

    const prenom = form.prenom.trim();
    const name = form.name.trim();

    if (!prenom || !name) {
      toast({
        title: "Champs requis",
        description: "Le prenom et le nom sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const payload = {
      admin_id: admin.id,
      prenom,
      name,
      role: form.role.trim() || null,
      date_of_birth: form.date_of_birth || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      bio: form.bio.trim() || null,
      image_url: form.image_url.trim() || null,
      active: form.active,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
    };

    const { error } = await supabase.from("equipe").insert(payload);
    if (error) {
      toast({
        title: "Erreur",
        description: error.message || "Creation impossible.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({
      title: "Membre ajoute",
      description: "Le nouveau membre est ajoute a l'equipe.",
    });

    resetForm();
    await loadMembers();
    setSaving(false);
  };

  const handleRowSave = async (id: string) => {
    if (!admin?.id) return;

    const prenom = rowDraft.prenom.trim();
    const name = rowDraft.name.trim();

    if (!prenom || !name) {
      toast({
        title: "Champs requis",
        description: "Le prenom et le nom sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setRowSaving(true);

    const payload = {
      admin_id: admin.id,
      prenom,
      name,
      role: rowDraft.role.trim() || null,
      date_of_birth: rowDraft.date_of_birth || null,
      email: rowDraft.email.trim() || null,
      phone: rowDraft.phone.trim() || null,
      bio: rowDraft.bio.trim() || null,
      image_url: rowDraft.image_url.trim() || null,
      active: rowDraft.active,
      sort_order: Number.isFinite(rowDraft.sort_order) ? rowDraft.sort_order : 0,
    };

    const { error } = await supabase.from("equipe").update(payload).eq("id", id);
    if (error) {
      toast({
        title: "Erreur",
        description: error.message || "Mise a jour impossible.",
        variant: "destructive",
      });
      setRowSaving(false);
      return;
    }

    toast({
      title: "Membre modifie",
      description: "La ligne a ete modifiee.",
    });

    cancelRowEdit();
    await loadMembers();
    setRowSaving(false);
  };

  if (authLoading || adminLoading) {
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
            <p className="text-muted-foreground mb-4">Vous devez etre connecte pour gerer l'equipe.</p>
            <Link to="/connexion">
              <Button>Se connecter</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-destructive">Acces refuse.</p>
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
            <Users className="w-10 h-10 text-secondary" />
            Equipe
          </h1>
          <p className="text-muted-foreground">Gestion des membres de votre equipe.</p>
        </div>
      </section>

      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-xl shadow-soft p-6 mb-8">
            <h2 className="font-serif text-xl font-bold mb-4">Ajouter un nouveau membre</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Prenom</label>
                  <Input name="prenom" value={form.prenom} onChange={handleFieldChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nom</label>
                  <Input name="name" value={form.name} onChange={handleFieldChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Date de naissance</label>
                  <Input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleFieldChange} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleFieldChange}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Selectionner un role</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                    {hasCustomRole && <option value={form.role}>{form.role}</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFieldChange}
                    placeholder="prenom.nom@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Telephone</label>
                  <Input name="phone" value={form.phone} onChange={handleFieldChange} placeholder="+213..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Photo</label>
                <div className="flex items-center gap-2">
                  <Input
                    name="image_url"
                    value={form.image_url}
                    onChange={handleFieldChange}
                    placeholder="Ajouter URL de la photo"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3 min-w-[44px] text-base leading-none"
                    onClick={() => addImageInputRef.current?.click()}
                    disabled={uploadingImage}
                    title="Choisir depuis ordinateur"
                    aria-label="Choisir depuis ordinateur"
                  >
                    ...
                  </Button>
                  <Input
                    ref={addImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </div>

                {uploadingImage && <p className="text-xs text-muted-foreground mt-2">Upload en cours...</p>}
                {form.image_url && (
                  <div className="mt-3 w-16 h-16 rounded-lg bg-muted overflow-hidden border border-border">
                    <img src={form.image_url} alt="Preview membre" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                <Textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleFieldChange}
                  rows={4}
                  placeholder="Presentation du membre"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="member-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={handleActiveChange}
                  className="h-4 w-4"
                />
                <label htmlFor="member-active" className="text-sm text-foreground">
                  Membre actif
                </label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving || uploadingImage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d8dde6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex flex-col gap-4 border-b border-[#e2e7ef] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#eef1f5] flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#3b4a63]" />
                </div>
                <div>
                  <h2 className="text-[2rem] font-bold leading-none text-[#111827]">Liste equipe</h2>
                  <p className="mt-1 text-sm text-[#5c6f88]">{filteredMembers.length} membres trouves</p>
                </div>
              </div>

              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a98ad]" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  className="h-10 rounded-2xl border-[#cfd6e1] bg-[#f8fafc] pl-9 text-sm text-[#334155] placeholder:text-[#94a3b8]"
                />
              </div>
            </div>

            <div className="p-6">
            {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
            {!loading && members.length === 0 && <p className="text-sm text-muted-foreground">Aucun membre.</p>}
            {!loading && members.length > 0 && filteredMembers.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun resultat pour cette recherche.</p>
            )}

            {!loading && filteredMembers.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-[#e2e7ef] bg-white">
                <table className="min-w-[1120px] w-full text-[0.9rem]">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Photo</th>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Prenom</th>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Nom</th>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Role</th>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Naissance</th>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Email</th>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Telephone</th>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Statut</th>
                      <th className="px-5 py-3 text-left text-[0.82rem] font-semibold uppercase tracking-wide text-[#667892]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => {
                      if (rowEditId === member.id) {
                        return (
                          <tr key={member.id} className="border-t border-[#e5e9f0] align-top bg-white text-[0.88rem] text-[#1f2937] hover:bg-[#fff7d6]">
                            <td className="px-5 py-3 min-w-[230px]">
                              <button
                                type="button"
                                onClick={() => setShowRowImageOptions((prev) => !prev)}
                                className="w-10 h-10 rounded-full bg-[#eef1f5] border border-[#dbe1ea] overflow-hidden flex items-center justify-center"
                              >
                                {rowDraft.image_url ? (
                                  <img
                                    src={rowDraft.image_url}
                                    alt="Photo membre"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Users className="w-5 h-5 text-muted-foreground" />
                                )}
                              </button>
                              <p className="text-[11px] text-muted-foreground mt-1">Cliquer sur la photo pour modifier</p>
                              {showRowImageOptions && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      name="image_url"
                                      value={rowDraft.image_url}
                                      onChange={handleRowDraftChange}
                                      placeholder="URL photo"
                                      className="h-8 text-[0.82rem]"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-8 px-2 min-w-[34px] text-sm leading-none"
                                      onClick={() => rowImageInputRef.current?.click()}
                                      disabled={rowUploadingImage}
                                      title="Choisir depuis ordinateur"
                                      aria-label="Choisir depuis ordinateur"
                                    >
                                      ...
                                    </Button>
                                    <Input
                                      ref={rowImageInputRef}
                                      type="file"
                                      accept="image/*"
                                      onChange={handleRowImageFileChange}
                                      disabled={rowUploadingImage}
                                      className="hidden"
                                    />
                                  </div>
                                  {rowUploadingImage && (
                                    <p className="text-[11px] text-muted-foreground">Upload en cours...</p>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3 min-w-[150px]">
                              <Input name="prenom" value={rowDraft.prenom} onChange={handleRowDraftChange} className="h-8 text-[0.82rem]" />
                            </td>
                            <td className="px-5 py-3 min-w-[150px]">
                              <Input name="name" value={rowDraft.name} onChange={handleRowDraftChange} className="h-8 text-[0.82rem]" />
                            </td>
                            <td className="px-5 py-3 min-w-[180px]">
                              <select
                                name="role"
                                value={rowDraft.role}
                                onChange={handleRowDraftChange}
                                className="w-full h-8 rounded-md border border-input bg-background px-2 text-[0.82rem]"
                              >
                                <option value="">Selectionner un role</option>
                                {roleOptions.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                                {rowHasCustomRole && <option value={rowDraft.role}>{rowDraft.role}</option>}
                              </select>
                            </td>
                            <td className="px-5 py-3 min-w-[140px]">
                              <Input
                                type="date"
                                name="date_of_birth"
                                value={rowDraft.date_of_birth}
                                onChange={handleRowDraftChange}
                                className="h-8 text-[0.82rem]"
                              />
                            </td>
                            <td className="px-5 py-3 min-w-[220px]">
                              <Input
                                type="email"
                                name="email"
                                value={rowDraft.email}
                                onChange={handleRowDraftChange}
                                className="h-8 text-[0.82rem]"
                              />
                            </td>
                            <td className="px-5 py-3 min-w-[160px]">
                              <Input name="phone" value={rowDraft.phone} onChange={handleRowDraftChange} className="h-8 text-[0.82rem]" />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                type="checkbox"
                                checked={rowDraft.active}
                                onChange={handleRowActiveChange}
                                className="h-4 w-4"
                              />
                            </td>
                            <td className="px-5 py-3 min-w-[220px]">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleRowSave(member.id)}
                                  disabled={rowSaving || rowUploadingImage}
                                  className="h-8 rounded-xl bg-[#1f2d50] px-3 text-white hover:bg-[#17233f]"
                                >
                                  Enregistrer
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelRowEdit}
                                  disabled={rowSaving}
                                  className="h-8 rounded-xl border-[#cdd4de] bg-white px-3 text-[#111827] hover:bg-[#f8fafc]"
                                >
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleDelete(member.id)}
                                  disabled={rowSaving}
                                  className="h-8 w-8 rounded-md bg-[#ef2d2d] p-0 text-white hover:bg-[#dc2626]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const birthDate = member.date_of_birth
                        ? new Date(member.date_of_birth).toLocaleDateString("fr-FR")
                        : "-";
                      const initials = `${(member.prenom ?? "").charAt(0)}${member.name.charAt(0)}`
                        .toUpperCase()
                        .trim() || "M";
                      return (
                        <tr
                          key={member.id}
                          className="border-t border-[#e5e9f0] bg-white text-[0.88rem] text-[#1f2937] hover:bg-[#fff7d6]"
                        >
                          <td className="px-5 py-4">
                            <div className="w-10 h-10 rounded-full bg-[#e3d5a4] border border-[#d6c793] overflow-hidden flex items-center justify-center text-sm font-semibold text-[#1f2a44]">
                              {member.image_url ? (
                                <img
                                  src={member.image_url}
                                  alt={`${member.prenom ?? ""} ${member.name}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">{member.prenom || "-"}</td>
                          <td className="px-5 py-4 font-semibold text-[#111827]">{member.name}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-lg bg-[#d9dce2] px-3 py-1.5 text-[0.82rem] font-medium text-[#1f2a44]">
                              {member.role || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[#5c6f88]">{birthDate}</td>
                          <td className="px-5 py-4 text-[#5c6f88]">{member.email || "-"}</td>
                          <td className="px-5 py-4 text-[#5c6f88]">{member.phone || "-"}</td>
                          <td className="px-5 py-4 font-medium">{member.active ? "Actif" : "Inactif"}</td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startRowEdit(member)}
                                className="h-8 rounded-xl border-[#cdd4de] bg-white px-4 text-[#111827] hover:bg-[#f8fafc]"
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDelete(member.id)}
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
                  Affichage de {filteredMembers.length} sur {members.length} membres
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
    </Layout>
  );
};

export default EquipeAdmin;
