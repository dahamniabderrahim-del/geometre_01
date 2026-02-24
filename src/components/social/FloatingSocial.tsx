import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { listActiveAdmins, type AdminProfile } from "@/lib/admin";

export function FloatingSocial() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [publicAdmin, setPublicAdmin] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowNotification(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

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
  }, []);

  const contactPhone = publicAdmin?.phone?.trim() ?? "";
  const whatsappNumber = contactPhone.replace(/\D/g, "");
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";
  const phoneHref = contactPhone ? `tel:${contactPhone.replace(/[^\d+]/g, "")}` : "";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showNotification && !isOpen && (
        <div className="absolute bottom-16 right-0 bg-card shadow-strong rounded-lg p-4 w-64 animate-fade-in">
          <button
            onClick={() => setShowNotification(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-sm text-foreground font-medium">Besoin d'aide ?</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contactez-nous sur WhatsApp pour une reponse rapide !
          </p>
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card rotate-45" />
        </div>
      )}

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-card shadow-strong rounded-xl p-4 space-y-3 animate-fade-in">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 social-btn-whatsapp rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Reponse rapide</p>
              </div>
            </a>
          )}

          <a
            href="https://m.me/geoexpert"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 social-btn-facebook rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Messenger</p>
              <p className="text-xs text-muted-foreground">Discuter sur Facebook</p>
            </div>
          </a>

          {phoneHref && (
            <a
              href={phoneHref}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Telephone</p>
                <p className="text-xs text-muted-foreground">{contactPhone}</p>
              </div>
            </a>
          )}
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-strong transition-all duration-300",
          isOpen
            ? "bg-foreground text-background rotate-180"
            : "social-btn-whatsapp animate-pulse-glow"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>
    </div>
  );
}
