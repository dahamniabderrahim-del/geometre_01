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
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 tracking-wider uppercase">
            Nos Expertises
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Des Services <span className="text-gradient">Complets</span> et Professionnels
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon ?? ""] ?? Landmark;
            const shortDescription = service.description.split("\n")[0] ?? service.description;

            return (
              <Link
                key={service.id}
                to="/services"
                className="group relative p-6 bg-card rounded-xl shadow-soft hover:shadow-strong transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {service.category && (
                  <span className="absolute top-4 right-4 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {service.category}
                  </span>
                )}

                <div className="w-14 h-14 rounded-xl hero-gradient flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 overflow-hidden">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-7 h-7 text-secondary" />
                  )}
                </div>

                <h3 className="font-serif text-xl font-bold text-foreground mb-3 group-hover:text-secondary transition-colors">
                  {service.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">{shortDescription}</p>

                <div className="mt-4 flex items-center text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">En savoir plus</span>
                  <svg
                    className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 gold-gradient transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-medium hover:shadow-strong"
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
