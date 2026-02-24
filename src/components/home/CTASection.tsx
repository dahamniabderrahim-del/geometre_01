import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { listActiveAdmins, pickPrimaryAdmin, type AdminProfile } from "@/lib/admin";

export function CTASection() {
  const [publicAdmin, setPublicAdmin] = useState<AdminProfile | null>(null);

  useEffect(() => {
    let active = true;

    listActiveAdmins()
      .then((admins) => {
        if (!active) return;
        setPublicAdmin(pickPrimaryAdmin(admins));
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
  const normalizedPhone = contactPhone.replace(/[^\d+]/g, "");

  return (
    <section className="py-20 hero-gradient relative overflow-hidden">
      {/* Geometric pattern */}
      <div className="absolute inset-0 geometric-pattern opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Un projet foncier ? Parlons-en !
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Contactez-nous pour obtenir un devis gratuit et personnalisé. 
            Notre équipe vous répond sous 24h.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/contact">
                Demander un devis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            {contactPhone && (
              <Button
                variant="heroOutline"
                size="xl"
                className="bg-primary-foreground/10"
                asChild
              >
                <a href={`tel:${normalizedPhone}`}>
                  <Phone className="w-5 h-5" />
                  {contactPhone}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
