import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Award, MapPin, Calendar, Phone, Mail } from "lucide-react";
import heroImage from "@/assets/hero-surveyor.jpg";
import { useEffect, useState } from "react";
import { getAdminCabinetName, listActiveAdmins, pickPrimaryAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

const heroContent = {
  badge: "Geometre-Expert Agree",
  titleBefore: "L'Excellence du",
  titleHighlight: "Foncier",
  titleAfter: "en Algerie",
  description:
    "Cabinet de Geometre-Expert specialise en bornage, topographie, cadastre et expertise fonciere. Precision, legalite et professionnalisme au service de vos projets.",
  cabinetName: "Cabinet non renseigne",
};

export function HeroSection() {
  const [heroBackgroundImage, setHeroBackgroundImage] = useState(heroImage);
  const [heroCabinetName, setHeroCabinetName] = useState(heroContent.cabinetName);
  const [geometreName, setGeometreName] = useState("");
  const [geometreGrade, setGeometreGrade] = useState("");
  const [geometrePhone, setGeometrePhone] = useState("");
  const [geometreEmail, setGeometreEmail] = useState("");
  const [teamCount, setTeamCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadHeroData = async () => {
      const admins = await listActiveAdmins();
      if (!active) return;

      const mainAdmin = pickPrimaryAdmin(admins);
      const dynamicHeroImage = mainAdmin?.hero_image_url?.trim();
      setHeroBackgroundImage(dynamicHeroImage || heroImage);
      setHeroCabinetName(getAdminCabinetName(mainAdmin) || heroContent.cabinetName);
      setGeometreName(mainAdmin?.name?.trim() || "");
      setGeometreGrade(mainAdmin?.grade?.trim() || "");
      setGeometrePhone(mainAdmin?.phone?.trim() || "");
      setGeometreEmail(mainAdmin?.email?.trim() || "");

      let teamCountQuery = supabase.from("equipe").select("id", { count: "exact", head: true }).eq("active", true);
      let projectsCountQuery = supabase.from("realisations").select("id", { count: "exact", head: true });
      let servicesCountQuery = supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("active", true);

      if (mainAdmin?.id) {
        teamCountQuery = teamCountQuery.eq("admin_id", mainAdmin.id);
        projectsCountQuery = projectsCountQuery.eq("admin_id", mainAdmin.id);
        servicesCountQuery = servicesCountQuery.eq("admin_id", mainAdmin.id);
      }

      const [{ count: team }, { count: projects }, { count: services }] = await Promise.all([
        teamCountQuery,
        projectsCountQuery,
        servicesCountQuery,
      ]);

      if (!active) return;
      setTeamCount(team ?? 0);
      setProjectsCount(projects ?? 0);
      setServicesCount(services ?? 0);
    };

    loadHeroData()
      .catch(() => {
        if (!active) return;
        setHeroBackgroundImage(heroImage);
        setHeroCabinetName(heroContent.cabinetName);
        setGeometreName("");
        setGeometreGrade("");
        setGeometrePhone("");
        setGeometreEmail("");
        setTeamCount(0);
        setProjectsCount(0);
        setServicesCount(0);
      });

    return () => {
      active = false;
    };
  }, []);

  const geometrePhoneHref = geometrePhone ? `tel:${geometrePhone.replace(/[^\d+]/g, "")}` : "";
  const cabinetCardTitle = (() => {
    const trimmed = heroCabinetName.trim();
    if (!trimmed) return heroContent.cabinetName;
    return /^cabinet\b/i.test(trimmed) ? trimmed : `Cabinet ${trimmed}`;
  })();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackgroundImage})` }}
      >
        <div className="absolute inset-0 hero-gradient opacity-95" />
      </div>

      <div className="absolute top-20 right-10 w-64 h-64 border-2 border-secondary/20 rounded-full animate-float" />
      <div
        className="absolute bottom-20 left-10 w-32 h-32 border-2 border-secondary/30 rounded-full animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-secondary rounded-full animate-pulse" />

      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary mb-6 animate-fade-up border border-secondary/30">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-wide">{heroContent.badge}</span>
            </div>

            <h1
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              {heroContent.titleBefore}{" "}
              <span className="text-secondary">{heroContent.titleHighlight}</span>{" "}
              {heroContent.titleAfter}
            </h1>

            <p
              className="text-lg text-primary-foreground/80 mb-8 leading-relaxed animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              {heroContent.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" className="gold-gradient text-secondary-foreground font-semibold shadow-gold hover:shadow-strong" asChild>
                <Link to="/contact">
                  Envoyer un message
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/services">Decouvrir nos services</Link>
              </Button>
            </div>

            <div
              className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-primary-foreground/20 animate-fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-primary-foreground">
                    {teamCount}
                  </p>
                  <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">
                    Professionnels
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-primary-foreground">
                    {projectsCount}
                  </p>
                  <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">
                    Projets realises
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-primary-foreground">
                    {servicesCount}
                  </p>
                  <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">
                    Services actifs
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-1 animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <div className="mx-auto w-full max-w-xl bg-card/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 lg:p-8 border border-primary-foreground/20">
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary/20 border-4 border-secondary flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-12 h-12 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 2 22 22 22" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="14" x2="16" y2="14" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl font-bold text-primary-foreground">{cabinetCardTitle}</h3>
                <p className="text-secondary font-medium">{geometreGrade || "Grade non renseigne"}</p>
                {geometreName && (
                  <p className="mt-1 text-sm text-primary-foreground/85">{geometreName}</p>
                )}
                {(geometrePhone || geometreEmail) && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {geometrePhone && geometrePhoneHref && (
                      <a
                        href={geometrePhoneHref}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/90 hover:bg-primary-foreground/20 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-secondary" />
                        {geometrePhone}
                      </a>
                    )}
                    {geometreEmail && (
                      <a
                        href={`mailto:${geometreEmail}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/90 hover:bg-primary-foreground/20 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 text-secondary" />
                        {geometreEmail}
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 p-3 bg-primary-foreground/5 rounded-lg">
                  <Shield className="w-5 h-5 text-secondary shrink-0" />
                  <span className="text-primary-foreground/90">Inscrit a l'ordre des geometres-experts</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-primary-foreground/5 rounded-lg">
                  <Award className="w-5 h-5 text-secondary shrink-0" />
                  <span className="text-primary-foreground/90">
                    Diplome d'ingenieur d'etat en sciences geodesiques et travaux topographiques
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-primary-foreground/5 rounded-lg">
                  <MapPin className="w-5 h-5 text-secondary shrink-0" />
                  <span className="text-primary-foreground/90">Agree sur tout le territoire national</span>
                </div>
              </div>

              <Button className="w-full mt-6 gold-gradient text-secondary-foreground font-semibold" asChild>
                <Link to="/a-propos">En savoir plus</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-secondary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
