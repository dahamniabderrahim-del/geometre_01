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
    <section className="relative overflow-hidden py-20 hero-gradient">
      {/* Geometric pattern */}
      <div className="absolute inset-0 geometric-pattern opacity-10" />
      <div className="absolute -top-24 right-[-5rem] h-64 w-64 rounded-full bg-secondary/25 blur-3xl" />
      <div className="absolute -bottom-28 left-[-6rem] h-64 w-64 rounded-full bg-accent/30 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary-foreground/20 bg-primary-foreground/8 px-6 py-10 text-center backdrop-blur-sm md:px-10">
          <h2 className="mb-6 font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
            Un projet foncier ? Parlons-en !
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/82">
            Contactez-nous pour recevoir une reponse rapide et personnalisee.
            Notre equipe vous repond sous 24h.
          </p>

          <div className="flex justify-center gap-4 flex-col sm:flex-row">
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/contact">
                Envoyer un message
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
