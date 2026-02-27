import { useEffect, useState } from "react";
import {
  Building2,
  Calculator,
  Compass,
  Crosshair,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Landmark,
  MapPin,
  Plane,
  Ruler,
  ScanLine,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type ServiceRow = {
  id: string;
  title: string;
  category: string | null;
  description: string;
  icon: string | null;
  image_url: string | null;
};

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

export function ServicesSection() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, title, category, description, icon, image_url")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(8);

      if (!isMounted) return;
      setServices(data ?? []);
      setLoading(false);
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-24 bg-background geometric-pattern">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
            Nos Expertises
          </span>
          <h2 className="mb-6 font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Des Services <span className="text-gradient">Complets</span> et Professionnels
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Une gamme complete de prestations en topographie, foncier et urbanisme
            pour repondre a tous vos besoins.
          </p>
        </div>

        {loading && (
          <div className="text-center text-sm text-muted-foreground mb-8">Chargement des services...</div>
        )}

        {!loading && services.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mb-8">
            Aucun service actif pour le moment.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon ?? ""] ?? Landmark;
            const shortDescription = service.description.split("\n")[0] ?? service.description;

            return (
              <Link
                key={service.id}
                to="/services"
                className="group relative overflow-hidden rounded-2xl border border-border/75 bg-card/92 p-6 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:border-secondary/35 hover:shadow-strong"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {service.category && (
                  <span className="absolute right-4 top-4 rounded-full border border-border/70 bg-muted/65 px-2 py-1 text-xs font-medium text-muted-foreground">
                    {service.category}
                  </span>
                )}

                <div className="mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl hero-gradient transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-7 h-7 text-secondary" />
                  )}
                </div>

                <h3 className="mb-3 font-serif text-xl font-bold text-foreground transition-colors group-hover:text-secondary">
                  {service.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">{shortDescription}</p>

                <div className="mt-4 flex items-center text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-sm font-medium">En savoir plus</span>
                  <svg
                    className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 origin-left scale-x-0 transform gold-gradient transition-transform group-hover:scale-x-100" />
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-medium transition-all hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-strong"
          >
            Voir tous nos services
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
