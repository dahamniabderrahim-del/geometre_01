import { CheckCircle2, Award, Shield, Users, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { listActiveAdmins, type AdminProfile } from "@/lib/admin";
import { useEffect, useMemo, useState } from "react";

const values = [
  {
    title: "Precision",
    description: "Des mesures exactes avec les technologies GPS et stations totales.",
  },
  {
    title: "Neutralite",
    description: "Un regard impartial et objectif sur chaque situation fonciere.",
  },
  {
    title: "Legalite",
    description: "Respect strict des procedures legales et reglementaires.",
  },
];

export function AboutSection() {
  const [publicAdmin, setPublicAdmin] = useState<AdminProfile | null>(null);
  const [teamCount, setTeamCount] = useState<number | null>(null);
  const [projectsCount, setProjectsCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const admins = await listActiveAdmins();
      if (!active) return;

      const mainAdmin = admins[0] ?? null;
      setPublicAdmin(mainAdmin);

      let teamCountQuery = supabase.from("equipe").select("id", { count: "exact", head: true }).eq("active", true);
      let projectsCountQuery = supabase.from("realisations").select("id", { count: "exact", head: true });

      if (mainAdmin?.id) {
        teamCountQuery = teamCountQuery.eq("admin_id", mainAdmin.id);
        projectsCountQuery = projectsCountQuery.eq("admin_id", mainAdmin.id);
      }

      const [teamResult, projectsResult] = await Promise.all([teamCountQuery, projectsCountQuery]);
      if (!active) return;

      setTeamCount(teamResult.count ?? 0);
      setProjectsCount(projectsResult.count ?? 0);
    };

    loadData().catch(() => {
      if (!active) return;
      setPublicAdmin(null);
      setTeamCount(0);
      setProjectsCount(0);
    });

    return () => {
      active = false;
    };
  }, []);

  const cabinetName = publicAdmin?.tagline?.trim() || "Cabinet geometre expert foncier";
  const geometreName = publicAdmin?.name?.trim() || "Ayoub Benali";
  const teamValue = teamCount === null ? "--" : String(teamCount);
  const projectsValue = projectsCount === null ? "--" : String(projectsCount);
  const teamFeatureLabel =
    teamCount === null
      ? "Equipe professionnelle"
      : `Equipe de ${teamCount} professionnel${teamCount > 1 ? "s" : ""}`;

  const features = useMemo(
    () => [
      { icon: Shield, text: "Inscrit a l'Ordre des Geometres" },
      { icon: Users, text: teamFeatureLabel },
      { icon: Target, text: "Precision certifiee GPS/GNSS" },
      { icon: Clock, text: "Respect des delais" },
      { icon: Award, text: "Accompagnement foncier" },
      { icon: CheckCircle2, text: "Tarification transparente" },
    ],
    [teamFeatureLabel]
  );

  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <div className="aspect-[4/5] hero-gradient flex items-center justify-center">
                <div className="text-center text-primary-foreground p-8">
                  <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-secondary/20 border-4 border-secondary flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-14 h-14 text-secondary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 2 22 22 22" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="14" x2="16" y2="14" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-3xl font-bold mb-2">{cabinetName}</h3>
                  <p className="text-primary-foreground/80 mb-4">{geometreName}</p>
                  <p className="text-secondary font-semibold">
                    {publicAdmin?.city?.trim() ? `Base a ${publicAdmin.city.trim()}` : "Informations du compte"}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-card rounded-xl shadow-strong p-6 animate-float">
              <p className="text-4xl font-serif font-bold text-secondary">{teamValue}</p>
              <p className="text-sm text-muted-foreground">Professionnels</p>
            </div>

            <div className="absolute -top-6 -left-6 bg-secondary rounded-xl shadow-gold p-6 text-secondary-foreground">
              <p className="text-4xl font-serif font-bold">{projectsValue}</p>
              <p className="text-sm">Projets realises</p>
            </div>

            <div className="absolute -bottom-4 left-1/4 w-32 h-32 border-4 border-secondary/30 rounded-xl -z-10" />
          </div>

          <div>
            <span className="inline-block px-4 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 tracking-wider uppercase">
              Notre Cabinet
            </span>

            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              L'Expertise au Service de <span className="text-gradient">Votre Foncier</span>
            </h2>

            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Le cabinet {cabinetName} accompagne les particuliers, promoteurs, notaires et collectivites
              dans leurs projets fonciers et topographiques.
            </p>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              {teamCount !== null
                ? `Notre equipe de ${teamCount} professionnel${teamCount > 1 ? "s" : ""} met son savoir-faire et ses equipements a votre service.`
                : "Notre equipe professionnelle met son savoir-faire et ses equipements a votre service."}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {values.map((value) => (
                <div key={value.title} className="text-center p-4 bg-card rounded-xl shadow-soft">
                  <h4 className="font-serif font-bold text-foreground mb-1">{value.title}</h4>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>

            <ul className="grid grid-cols-2 gap-3 mb-8">
              {features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 text-secondary" />
                  </div>
                  {feature.text}
                </li>
              ))}
            </ul>

            <div className="flex gap-4">
              <Button size="lg" className="hero-gradient text-primary-foreground" asChild>
                <Link to="/a-propos">Decouvrir le Cabinet</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Nous Contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
