import { CheckCircle2, Award, Shield, Users, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAdminCabinetName, listActiveAdmins, pickPrimaryAdmin, type AdminProfile } from "@/lib/admin";
import { useEffect, useMemo, useState } from "react";
import { CabinetMark } from "@/components/brand/CabinetMark";

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

      const mainAdmin = pickPrimaryAdmin(admins);
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

  const cabinetName = getAdminCabinetName(publicAdmin) || "Cabinet non renseigne";
  const geometreName = publicAdmin?.name?.trim() || "Geometre non renseigne";
  const geometreGrade = publicAdmin?.grade?.trim() || "";
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
    <section className="py-16 md:py-24 bg-muted/55">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 md:gap-16 lg:grid-cols-2">
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border/65 shadow-strong">
              <div className="aspect-[4/5] hero-gradient flex items-center justify-center">
                <div className="text-center text-primary-foreground p-8">
                  <div className="w-36 h-36 sm:w-40 sm:h-40 mx-auto mb-6 rounded-full bg-secondary/20 border-4 border-secondary flex items-center justify-center">
                    <CabinetMark className="h-[92%] w-[92%] text-secondary" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold mb-2">{cabinetName}</h3>
                  <p className="text-primary-foreground/80">{geometreName}</p>
                  {geometreGrade ? (
                    <p className="text-primary-foreground/70 mb-4 text-sm">{geometreGrade}</p>
                  ) : (
                    <p className="text-primary-foreground/70 mb-4 text-sm">Grade non renseigne</p>
                  )}
                  <p className="text-secondary font-semibold">
                    {publicAdmin?.city?.trim() ? `Base a ${publicAdmin.city.trim()}` : "Informations du compte"}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 hidden rounded-2xl border border-border/70 bg-card p-6 shadow-strong animate-float sm:block">
              <p className="text-4xl font-serif font-bold text-secondary">{teamValue}</p>
              <p className="text-sm text-muted-foreground">Professionnels</p>
            </div>

            <div className="absolute -top-6 -left-6 hidden rounded-2xl bg-secondary p-6 text-secondary-foreground shadow-gold sm:block">
              <p className="text-4xl font-serif font-bold">{projectsValue}</p>
              <p className="text-sm">Projets realises</p>
            </div>

            <div className="absolute -bottom-4 left-1/4 hidden sm:block w-32 h-32 border-4 border-secondary/30 rounded-xl -z-10" />
          </div>

          <div>
            <span className="mb-4 inline-block rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
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

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {values.map((value) => (
                <div key={value.title} className="rounded-2xl border border-border/75 bg-card/90 p-4 text-center shadow-soft">
                  <h4 className="font-serif font-bold text-foreground mb-1">{value.title}</h4>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>

            <ul className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/82 px-3 py-2 text-sm text-foreground">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/15">
                    <feature.icon className="w-4 h-4 text-secondary" />
                  </div>
                  {feature.text}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button size="lg" className="hero-gradient text-primary-foreground w-full sm:w-auto" asChild>
                <Link to="/a-propos">Decouvrir le Cabinet</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/contact">Nous Contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
