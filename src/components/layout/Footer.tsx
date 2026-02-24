import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";
import { SocialButtons } from "@/components/social/SocialButtons";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { listActiveAdmins, type AdminProfile } from "@/lib/admin";

const services = [
  "Bornage & Délimitation",
  "Division Parcellaire",
  "Topographie & Levés",
  "Copropriété",
  "Expertise Foncière",
  "Photogrammétrie Drone",
];

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
        setPublicAdmin(admins[0] ?? null);
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
    <footer className="bg-primary text-primary-foreground">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 border-2 border-secondary flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="12 2 2 22 22 22" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="14" x2="16" y2="14" />
                </svg>
              </div>
              <div>
                <span className="font-serif text-2xl font-bold">GéoExpert</span>
                <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">
                  Géomètre-Expert Agréé
                </p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
              Cabinet de Géomètre-Expert au service des particuliers et
              professionnels depuis plus de 25 ans en Algérie.
            </p>
            <SocialButtons size="md" />
          </div>

          {/* Services */}
          <div>
            <h4 className="font-serif text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-secondary" />
              Nos Services
            </h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="hover:text-secondary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-secondary" />
              Liens Rapides
            </h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="hover:text-secondary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-secondary" />
              Contact
            </h4>
            <ul className="space-y-4 text-sm text-primary-foreground/70">
              {(contactAddress || contactCity) && (
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-secondary" />
                  </div>
                  <span>
                    {contactAddress && <>{contactAddress}{contactCity ? <br /> : null}</>}
                    {contactCity}
                  </span>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-secondary" />
                  </div>
                  <span>{contactPhone}</span>
                </li>
              )}
              {contactEmail && (
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-secondary" />
                  </div>
                  <span>{contactEmail}</span>
                </li>
              )}
              {(openingWeekdays || openingSaturday) && (
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-secondary" />
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
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/50">
            <p>© 2024 GéoExpert. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <Link to="/mentions-legales" className="hover:text-secondary transition-colors">
                Mentions Légales
              </Link>
              <Link to="/confidentialite" className="hover:text-secondary transition-colors">
                Politique de Confidentialité
              </Link>
              <Link to="/cgv" className="hover:text-secondary transition-colors">
                CGV
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
