import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";
import { SocialButtons } from "@/components/social/SocialButtons";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { listActiveAdmins, pickPrimaryAdmin, type AdminProfile } from "@/lib/admin";
import { CabinetMark } from "@/components/brand/CabinetMark";

const toServiceAnchor = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const services = [
  "Bornage & Délimitation",
  "Division Parcellaire",
  "Topographie & Levés",
  "Copropriété",
  "Expertise Foncière",
  "Photogrammétrie Drone",
].map((label) => ({ label, anchor: toServiceAnchor(label) }));

const quickLinks = [
  { label: "Accueil", href: "/" },
  { label: "Le Cabinet", href: "/a-propos" },
  { label: "Services", href: "/services" },
  { label: "Réalisations", href: "/realisations" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  const { user } = useAuth();
  const { admin } = useAdminProfile(user?.email);
  const [publicAdmin, setPublicAdmin] = useState<AdminProfile | null>(null);

  useEffect(() => {
    let active = true;

    if (admin) {
      setPublicAdmin(admin);
      return () => {
        active = false;
      };
    }

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
  }, [admin]);

  const visibleAdmin = admin ?? publicAdmin;
  const contactAddress = visibleAdmin?.address?.trim() ?? "";
  const contactCity = visibleAdmin?.city?.trim() ?? "";
  const contactPhone = visibleAdmin?.phone?.trim() ?? "";
  const contactEmail = visibleAdmin?.email?.trim() ?? "";
  const openingWeekdays = visibleAdmin?.opening_hours_weekdays?.trim() ?? "";
  const openingSaturday = visibleAdmin?.opening_hours_saturday?.trim() ?? "";
  const hasAnyContact = Boolean(
    contactAddress || contactCity || contactPhone || contactEmail || openingWeekdays || openingSaturday
  );

  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-24 right-[-7rem] h-64 w-64 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute -bottom-28 left-[-6rem] h-64 w-64 rounded-full bg-accent/35 blur-3xl" />
      </div>
      {/* Main footer */}
      <div className="container relative z-10 mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.05] p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-secondary/65 bg-secondary/15">
                <CabinetMark className="h-16 w-16 text-secondary" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold">GéoExpert</span>
                <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/65">
                  Géomètre-Expert Agréé
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-primary-foreground/80">
              Cabinet de Géomètre-Expert au service des particuliers et
              professionnels depuis plus de 25 ans en Algérie.
            </p>
            <SocialButtons size="md" />
          </div>

          {/* Services */}
          <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/[0.04] p-6 backdrop-blur-sm">
            <h4 className="mb-6 flex items-center gap-2 font-serif text-lg font-bold">
              <span className="h-0.5 w-8 bg-secondary" />
              Nos Services
            </h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              {services.map((service) => (
                <li key={service.label}>
                  <Link
                    to={`/services#${service.anchor}`}
                    className="group flex items-center gap-2 transition-colors hover:text-secondary"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/[0.04] p-6 backdrop-blur-sm">
            <h4 className="mb-6 flex items-center gap-2 font-serif text-lg font-bold">
              <span className="h-0.5 w-8 bg-secondary" />
              Liens Rapides
            </h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="group flex items-center gap-2 transition-colors hover:text-secondary"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/[0.04] p-6 backdrop-blur-sm">
            <h4 className="mb-6 flex items-center gap-2 font-serif text-lg font-bold">
              <span className="h-0.5 w-8 bg-secondary" />
              Contact
            </h4>
            <ul className="space-y-4 text-sm text-primary-foreground/82">
              {(contactAddress || contactCity) && (
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/18">
                    <MapPin className="h-4 w-4 text-secondary" />
                  </div>
                  <span>
                    {contactAddress && <>{contactAddress}{contactCity ? <br /> : null}</>}
                    {contactCity}
                  </span>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/18">
                    <Phone className="h-4 w-4 text-secondary" />
                  </div>
                  <span>{contactPhone}</span>
                </li>
              )}
              {contactEmail && (
                <li className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/18">
                    <Mail className="h-4 w-4 text-secondary" />
                  </div>
                  <span>{contactEmail}</span>
                </li>
              )}
              {(openingWeekdays || openingSaturday) && (
                <li className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/18">
                    <Clock className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    {openingWeekdays && <p>{openingWeekdays}</p>}
                    {openingSaturday && <p>{openingSaturday}</p>}
                  </div>
                </li>
              )}
              {!hasAnyContact && <li>Aucune information de contact disponible.</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-primary-foreground/15">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-primary-foreground/65 md:flex-row">
            <p>© 2024 GéoExpert. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <Link to="/mentions-legales" className="transition-colors hover:text-secondary">
                Mentions Légales
              </Link>
              <Link to="/confidentialite" className="transition-colors hover:text-secondary">
                Politique de Confidentialité
              </Link>
              <Link to="/cgv" className="transition-colors hover:text-secondary">
                CGV
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
