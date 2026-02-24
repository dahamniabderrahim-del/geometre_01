import { Layout } from "@/components/layout/Layout";
import {
  Award,
  Shield,
  Users,
  Target,
  Briefcase,
  GraduationCap,
  Building,
  CheckCircle2,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listActiveAdmins, type AdminProfile } from "@/lib/admin";

const credentials = [
  {
    icon: GraduationCap,
    title: "Formation qualifiante",
    description: "Parcours en sciences geodesiques et travaux topographiques.",
  },
  {
    icon: Shield,
    title: "Agrement National",
    description: "Agree selon la reglementation en vigueur.",
  },
  {
    icon: Award,
    title: "Ordre des Geometres",
    description: "Inscrit a l'Ordre National des Geometres-Experts d'Algerie",
  },
  {
    icon: Building,
    title: "Organisation qualite",
    description: "Processus internes structures pour assurer la qualite des prestations.",
  },
];

const values = [
  {
    icon: Target,
    title: "Precision",
    description:
      "Des mesures exactes avec les dernieres technologies GPS/GNSS et stations totales de haute precision.",
  },
  {
    icon: Shield,
    title: "Neutralite",
    description:
      "Un regard impartial et objectif sur chaque situation fonciere, garant de l'equite entre les parties.",
  },
  {
    icon: Briefcase,
    title: "Legalite",
    description:
      "Respect strict des procedures legales algeriennes et des normes professionnelles internationales.",
  },
];

type TeamMember = {
  id: string;
  name: string;
  prenom: string | null;
  role: string | null;
  bio: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

const APropos = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [publicAdmin, setPublicAdmin] = useState<AdminProfile | null>(null);
  const [projectsCount, setProjectsCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadPageData = async () => {
      setTeamLoading(true);
      let teamQuery = supabase
        .from("equipe")
        .select("id, name, prenom, role, bio, image_url, active, sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      let projectsCountQuery = supabase.from("realisations").select("id", { count: "exact", head: true });
      let servicesCountQuery = supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("active", true);

      if (publicAdmin?.id) {
        teamQuery = teamQuery.eq("admin_id", publicAdmin.id);
        projectsCountQuery = projectsCountQuery.eq("admin_id", publicAdmin.id);
        servicesCountQuery = servicesCountQuery.eq("admin_id", publicAdmin.id);
      }

      const [{ data: teamData }, { count: projects }, { count: services }] = await Promise.all([
        teamQuery,
        projectsCountQuery,
        servicesCountQuery,
      ]);

      if (!mounted) return;
      setTeamMembers(teamData ?? []);
      setProjectsCount(projects ?? 0);
      setServicesCount(services ?? 0);
      setTeamLoading(false);
    };

    loadPageData().catch(() => {
      if (!mounted) return;
      setTeamMembers([]);
      setProjectsCount(0);
      setServicesCount(0);
      setTeamLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [publicAdmin?.id]);

  useEffect(() => {
    let active = true;

    listActiveAdmins()
      .then((admins) => {
        if (!active) return;
        setPublicAdmin(admins[0] ?? null);
      })
      .catch(() => {
        if (!active) return;
        setPublicAdmin(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const contactPhone = publicAdmin?.phone?.trim() ?? "";
  const contactEmail = publicAdmin?.email?.trim() ?? "";
  const contactPhoneHref = contactPhone ? `tel:${contactPhone.replace(/[^\d+]/g, "")}` : "";
  const cabinetName = publicAdmin?.tagline?.trim() || "Cabinet geometre expert foncier";
  const geometreName = publicAdmin?.name?.trim() || "Ayoub Benali";
  const geometreGrade = publicAdmin?.grade?.trim() || "Geometre expert foncier";
  const cabinetCity = publicAdmin?.city?.trim() || "";
  const teamCount = teamMembers.length;
  const contactChannelsCount = [contactPhone, contactEmail].filter(Boolean).length;
  const stats = [
    { value: String(teamCount), label: "Professionnels" },
    { value: String(projectsCount), label: "Projets realises" },
    { value: String(servicesCount), label: "Services actifs" },
    { value: String(contactChannelsCount), label: "Canaux de contact" },
  ];

  return (
    <Layout>
      <section className="relative py-24 hero-gradient overflow-hidden">
        <div className="absolute inset-0 geometric-pattern opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-semibold mb-4 tracking-wider uppercase">
              Notre Cabinet
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Presentation du <span className="text-secondary">Cabinet</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              {cabinetName} est un cabinet de Geometre-Expert, avec une approche technique
              rigoureuse adaptee a vos besoins fonciers.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                Le Geometre-Expert : <span className="text-gradient">Garant du Foncier</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Le Geometre-Expert est un professionnel liberal assermente qui exerce une mission
                  de service public. Il est le seul habilite a fixer les limites des proprietes
                  foncieres de maniere definitive.
                </p>
                <p>
                  Le cabinet {cabinetName} est pilote par {geometreName} ({geometreGrade}). Nous intervenons pour des
                  missions de bornage, topographie, expertise et conseil.
                </p>
                <p>
                  Equipe des dernieres technologies (GPS RTK, drones, scanner 3D),{" "}
                  {teamCount > 0
                    ? `notre equipe de ${teamCount} professionnel${teamCount > 1 ? "s" : ""} vous accompagne dans tous vos projets fonciers avec rigueur et professionnalisme.`
                    : "notre equipe professionnelle vous accompagne dans tous vos projets fonciers avec rigueur et professionnalisme."}
                </p>
              </div>

              <div className="mt-8 flex gap-4">
                <Button size="lg" className="gold-gradient text-secondary-foreground" asChild>
                  <Link to="/devis">Demander un Devis</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">Nous Contacter</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {credentials.map((cred) => (
                <div
                  key={cred.title}
                  className="p-6 bg-card rounded-xl shadow-soft border border-border hover:shadow-medium transition-all"
                >
                  <div className="w-12 h-12 rounded-lg hero-gradient flex items-center justify-center mb-4">
                    <cred.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-serif font-bold text-foreground mb-2">{cred.title}</h3>
                  <p className="text-sm text-muted-foreground">{cred.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 tracking-wider uppercase">
              Nos Engagements
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Les Valeurs qui Nous Guident
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center p-8 bg-card rounded-2xl shadow-soft">
                <div className="w-16 h-16 mx-auto rounded-full hero-gradient flex items-center justify-center mb-6">
                  <value.icon className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-4">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 tracking-wider uppercase">
              Notre Equipe
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Des Experts a Votre Service
            </h2>
          </div>

          {teamLoading && (
            <p className="text-center text-sm text-muted-foreground">Chargement de l'equipe...</p>
          )}

          {!teamLoading && teamMembers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Aucun membre actif dans l'equipe pour le moment.
            </p>
          )}

          {!teamLoading && teamMembers.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member) => {
                const fullName = [member.prenom, member.name].filter(Boolean).join(" ").trim() || member.name;
                return (
                <div
                  key={member.id}
                  className="group p-6 bg-card rounded-xl shadow-soft hover:shadow-medium transition-all text-center"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full hero-gradient flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden">
                    {member.image_url ? (
                      <img src={member.image_url} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-10 h-10 text-secondary" />
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-foreground mb-1">{fullName}</h3>
                  <p className="text-secondary text-sm font-medium mb-2">{member.role || "Membre de l'equipe"}</p>
                  <p className="text-xs text-muted-foreground">{member.bio || "Professionnel qualifie du cabinet."}</p>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 tracking-wider uppercase">
                Zone d'Intervention
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                Nous Intervenons sur <span className="text-gradient">Tout le Territoire</span>
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {cabinetCity
                  ? `Base a ${cabinetCity}, nous intervenons sur tout le territoire national pour vos projets fonciers et topographiques.`
                  : "Nous intervenons sur tout le territoire national pour vos projets fonciers et topographiques."}
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Alger et sa region metropolitaine",
                  "Oran, Constantine, Annaba",
                  "Toutes les wilayas du Nord",
                  "Wilayas du Sud sur demande",
                ].map((zone) => (
                  <li key={zone} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                    <span className="text-foreground">{zone}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-4">
                {contactPhoneHref && (
                  <Button className="hero-gradient text-primary-foreground" asChild>
                    <a href={contactPhoneHref}>
                      <Phone className="w-4 h-4 mr-2" />
                      Nous Appeler
                    </a>
                  </Button>
                )}
                {contactEmail && (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${contactEmail}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Nous Ecrire
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-strong h-[400px]">
              <iframe
                src="https://www.google.com/maps?q=35.6971,-0.6308&z=12&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Zone d'intervention ${cabinetName}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Besoin d'un Geometre-Expert ?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Contactez-nous pour une etude personnalisee de votre projet. Devis gratuit et sans
            engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gold-gradient text-secondary-foreground font-semibold" asChild>
              <Link to="/devis">Demander un Devis Gratuit</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/contact">Prendre Rendez-vous</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default APropos;
