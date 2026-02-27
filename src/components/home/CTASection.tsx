import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { listActiveAdmins, pickPrimaryAdmin, type AdminProfile } from "@/lib/admin";
import type { CSSProperties } from "react";

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
  const ctaBarClass =
    "min-h-14 min-w-[16rem] border-white/80 bg-white/[0.72] text-slate-900 shadow-medium backdrop-blur-xl hover:bg-white/[0.9] hover:border-white";
  const glassCardStyle: CSSProperties = {
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  };
  const glassLayerStyle: CSSProperties = {
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  };
  const ctaBarStyle: CSSProperties = {
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  return (
    <section className="relative overflow-hidden py-20 hero-gradient-green">
      {/* Geometric pattern */}
      <div className="absolute inset-0 geometric-pattern opacity-10" />
      <div className="absolute -top-24 right-[-5rem] h-64 w-64 rounded-full bg-secondary/25 blur-3xl" />
      <div className="absolute -bottom-28 left-[-6rem] h-64 w-64 rounded-full bg-accent/30 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/40 bg-white/[0.34] px-6 py-10 text-center backdrop-blur-2xl shadow-medium md:px-10" style={glassCardStyle}>
          <div className="pointer-events-none absolute -inset-10 opacity-70 blur-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.68),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(187,247,208,0.42),transparent_46%)]" />
          <div className="pointer-events-none absolute inset-0 bg-emerald-50/[0.22] backdrop-blur-md" style={glassLayerStyle} />

          <div className="relative z-10 text-slate-900">
            <h2 className="mb-6 font-serif text-3xl font-bold text-slate-900 md:text-4xl">
              Un projet foncier ? Parlons-en !
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-slate-900">
              Contactez-nous pour recevoir une reponse rapide et personnalisee.
              Notre equipe vous repond sous 24h.
            </p>

            <div className="flex justify-center gap-4 flex-col sm:flex-row">
              <Button
                variant="heroOutline"
                size="xl"
                className={ctaBarClass}
                style={ctaBarStyle}
                asChild
              >
                <Link to="/contact">
                  Envoyer un message
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              {contactPhone && (
                <Button
                  variant="heroOutline"
                  size="xl"
                  className={ctaBarClass}
                  style={ctaBarStyle}
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
      </div>
    </section>
  );
}
