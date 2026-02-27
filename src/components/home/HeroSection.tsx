import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, MapPin, Calendar, Phone, Mail } from "lucide-react";
import heroImage from "@/assets/hero-surveyor.jpg";
import { useEffect, useState } from "react";
import { getAdminCabinetName, listActiveAdmins, pickPrimaryAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { CabinetMark } from "@/components/brand/CabinetMark";

const heroContent = {
  badge: "Geometre-Expert Agree",
  titleBefore: "L'Excellence du",
  titleHighlight: "Foncier",
  titleAfter: "en Algerie",
  description:
    "Cabinet de Geometre-Expert specialise en bornage, topographie, cadastre et expertise fonciere. Precision, legalite et professionnalisme au service de vos projets.",
  cabinetName: "Cabinet non renseigne",
};

const OGEF_LOGO_URL = "https://www.geometres-francophones.org/5e8sef5sdgf/uploads/2017/10/Logo-OGEF-Algerie-1.png";

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
    <section className="relative isolate flex min-h-screen items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackgroundImage})` }}
      >
        <div className="absolute inset-0 hero-gradient opacity-95" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(205_55%_12%/0.72),transparent_45%)]" />
      </div>

      <div className="absolute top-20 right-10 h-64 w-64 rounded-full border border-secondary/35 animate-float" />
      <div
        className="absolute bottom-20 left-10 h-32 w-32 rounded-full border border-secondary/40 animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute top-1/3 right-1/4 h-4 w-4 rounded-full bg-secondary animate-pulse" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 max-w-2xl lg:order-1">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-secondary/35 bg-secondary/20 px-4 py-2 animate-fade-up">
              <span className="text-sm font-semibold tracking-wide text-primary-foreground">{heroContent.badge}</span>
              <div className="h-10 w-32 overflow-hidden rounded-full bg-primary-foreground/10">
                <img
                  src={OGEF_LOGO_URL}
                  alt="Logo OGEF"
                  className="h-full w-full scale-[1.18] object-contain"
                  loading="lazy"
                />
              </div>
            </div>

            <h1
              className="mb-6 font-serif text-4xl font-bold leading-tight text-primary-foreground animate-fade-up md:text-5xl lg:text-6xl"
              style={{ animationDelay: "0.1s" }}
            >
              {heroContent.titleBefore}{" "}
              <span className="text-secondary">{heroContent.titleHighlight}</span>{" "}
              {heroContent.titleAfter}
            </h1>

            <p
              className="mb-8 max-w-2xl text-lg leading-relaxed text-primary-foreground/84 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              {heroContent.description}
            </p>

            <div className="flex flex-col gap-4 animate-fade-up sm:flex-row" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" className="gold-gradient text-secondary-foreground font-semibold shadow-gold hover:shadow-strong" asChild>
                <Link to="/contact">
                  Envoyer un message
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border border-primary-foreground/45 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20"
                asChild
              >
                <Link to="/services">Decouvrir nos services</Link>
              </Button>
            </div>

            <div
              className="mt-10 grid gap-3 border-t border-primary-foreground/25 pt-8 animate-fade-up sm:grid-cols-3 sm:gap-4"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center gap-3 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/8 p-3 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
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
              <div className="flex items-center gap-3 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/8 p-3 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
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
              <div className="flex items-center gap-3 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/8 p-3 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
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

          <div className="order-1 animate-fade-up lg:order-2" style={{ animationDelay: "0.5s" }}>
            <div className="mx-auto w-full max-w-xl rounded-3xl border border-primary-foreground/24 bg-card/12 p-5 backdrop-blur-md sm:p-6 lg:p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-secondary bg-secondary/20 sm:h-36 sm:w-36">
                  <CabinetMark className="h-[92%] w-[92%] text-secondary" />
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/90 transition-colors hover:bg-primary-foreground/20"
                      >
                        <Phone className="h-3.5 w-3.5 text-secondary" />
                        {geometrePhone}
                      </a>
                    )}
                    {geometreEmail && (
                      <a
                        href={`mailto:${geometreEmail}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/90 transition-colors hover:bg-primary-foreground/20"
                      >
                        <Mail className="h-3.5 w-3.5 text-secondary" />
                        {geometreEmail}
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/8 p-3">
                  <div className="h-12 w-40 overflow-hidden rounded-full bg-primary-foreground/10">
                    <img
                      src={OGEF_LOGO_URL}
                      alt="Logo OGEF"
                      className="h-full w-full scale-[1.2] object-contain"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-primary-foreground/90">Inscrit a l'ordre des geometres-experts</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/8 p-3">
                  <Award className="w-5 h-5 text-secondary shrink-0" />
                  <span className="text-primary-foreground/90">
                    Diplome d'ingenieur d'etat en sciences geodesiques et travaux topographiques
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/8 p-3">
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
