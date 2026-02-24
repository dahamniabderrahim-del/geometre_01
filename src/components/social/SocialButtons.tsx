import { useEffect, useState } from "react";
import { Facebook, Instagram, Linkedin, MessageCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { listActiveAdmins, type AdminProfile } from "@/lib/admin";

interface SocialButtonsProps {
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}

type SocialLink = {
  name: string;
  icon: LucideIcon;
  href: string;
  className: string;
  hoverColor: string;
};

const staticSocialLinks: SocialLink[] = [
  {
    name: "Facebook",
    icon: Facebook,
    href: "https://facebook.com/geoexpert",
    className: "social-btn-facebook",
    hoverColor: "hover:bg-facebook",
  },
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://instagram.com/geoexpert",
    className: "social-btn-instagram",
    hoverColor: "",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "https://linkedin.com/company/geoexpert",
    className: "social-btn-linkedin",
    hoverColor: "hover:bg-linkedin",
  },
];

export function SocialButtons({ size = "md", showLabels = false, className }: SocialButtonsProps) {
  const [publicAdmin, setPublicAdmin] = useState<AdminProfile | null>(null);

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
  const socialLinks: SocialLink[] = [
    staticSocialLinks[0],
    ...(whatsappHref
      ? [{
          name: "WhatsApp",
          icon: MessageCircle,
          href: whatsappHref,
          className: "social-btn-whatsapp",
          hoverColor: "hover:bg-whatsapp",
        }]
      : []),
    staticSocialLinks[1],
    staticSocialLinks[2],
  ];

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110",
            sizeClasses[size],
            social.className
          )}
          title={social.name}
        >
          <social.icon className={iconSizes[size]} />
          {showLabels && (
            <span className="ml-2 text-sm font-medium">{social.name}</span>
          )}
        </a>
      ))}
    </div>
  );
}
