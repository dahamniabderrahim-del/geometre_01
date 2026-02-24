import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MapPin, Phone, Mail, Bell, Check, CheckCircle, AlertTriangle, Info, Monitor, MoreHorizontal, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SocialButtons } from "@/components/social/SocialButtons";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { clearLocalAuth } from "@/lib/local-auth";
import { parseDatabaseTimestamp } from "@/lib/datetime";
import { listActiveAdmins, pickPrimaryAdmin, type AdminProfile } from "@/lib/admin";
import { parseContactNotificationMessage } from "@/lib/notification-message";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "Le Cabinet" },
  { href: "/equipe", label: "Equipe" },
  { href: "/services", label: "Services" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/blog", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

type NotificationItem = {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  time: string;
  read: boolean;
};
type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | null;
  read: boolean | null;
  created_at: string;
};
type NotificationFilter = "all" | "unread";

const fallbackNotifications: NotificationItem[] = [];

const notifIcon = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

const notifAvatarClass: Record<NotificationItem["type"], string> = {
  success: "bg-[#1f6f43]",
  info: "bg-[#1877f2]",
  warning: "bg-[#c06c00]",
};

const notifBadgeClass: Record<NotificationItem["type"], string> = {
  success: "bg-[#42b72a]",
  info: "bg-[#1877f2]",
  warning: "bg-[#f7b928]",
};

const toCompactTime = (value: string) => {
  const normalized = value.replace(/^il y a\s+/i, "").trim();
  const amount = normalized.match(/\d+/)?.[0];

  if (!amount) return "A l'instant";
  if (normalized.includes("minute")) return `${amount} min`;
  if (normalized.includes("heure")) return `${amount} h`;
  if (normalized.includes("jour")) return `${amount} j`;
  if (normalized.includes("semaine")) return `${amount} sem`;
  if (normalized.includes("mois")) return `${amount} mois`;
  if (normalized.includes("an")) return `${amount} an`;

  return normalized;
};

const playNotificationSound = () => {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return;

  try {
    const audioContext = new window.AudioContext();
    const startAt = audioContext.currentTime;

    const playTone = (frequency: number, start: number, duration: number, peakGain: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);

      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.exponentialRampToValueAtTime(peakGain, start + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(start);
      oscillator.stop(start + duration);
    };

    void audioContext.resume().catch(() => undefined);
    playTone(880, startAt, 0.08, 0.03);
    playTone(1175, startAt + 0.09, 0.1, 0.02);

    window.setTimeout(() => {
      void audioContext.close().catch(() => undefined);
    }, 450);
  } catch {
    // Some browsers may block audio before user interaction.
  }
};

export function Header() {
  const { user } = useAuth();
  const { admin, isAdmin } = useAdminProfile(user?.email);
  const [publicAdmin, setPublicAdmin] = useState<AdminProfile | null>(null);
  const visibleAdmin = admin ?? publicAdmin;
  const cabinetName = visibleAdmin?.tagline?.trim() || "Cabinet non renseigne";
  const cabinetSubtitle = visibleAdmin?.grade?.trim() || "GEOMETRE-EXPERT AGREE";
  const userDisplayName =
    (isAdmin && admin?.name) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Compte";
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const userAvatarUrl =
    (isAdmin ? admin?.avatar_url ?? undefined : undefined) ||
    (user?.user_metadata?.avatar_url as string | undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifActionsOpen, setNotifActionsOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(fallbackNotifications);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const initialUnreadSoundPlayedRef = useRef(false);
  const location = useLocation();
  const isHomeTop =
    !isScrolled && (location.pathname === "/" || location.pathname === "/a-propos");
  const topBarTextClass = isHomeTop
    ? "text-black"
    : "text-muted-foreground";
  const topBarPhone = visibleAdmin?.phone?.trim() ?? "";
  const topBarEmail = visibleAdmin?.email?.trim() ?? "";
  const topBarAddress = visibleAdmin?.address?.trim() ?? "";
  const topBarCity = visibleAdmin?.city?.trim() ?? "";
  const topBarLocation = [topBarAddress, topBarCity].filter(Boolean).join(", ");
  const visibleNavLinks = navLinks.filter((link) => link.href !== "/equipe" || isAdmin);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadNotifications = notifications.filter((n) => !n.read);
  const olderNotifications = notifications.filter((n) => n.read);
  const visibleCount = notifFilter === "unread" ? unreadNotifications.length : notifications.length;

  const mapNotificationRowToItem = (row: NotificationRow): NotificationItem => {
    const parsedContact =
      row.title === "Nouveau message"
        ? parseContactNotificationMessage(row.message)
        : null;

    return {
      id: row.id,
      type: row.type ?? "info",
      title: row.title,
      message: row.message,
      senderName: parsedContact?.senderName,
      senderEmail: parsedContact?.senderEmail,
      subject: parsedContact?.subject,
      read: row.read ?? false,
      time: formatDistanceToNow(parseDatabaseTimestamp(row.created_at), {
        addSuffix: true,
        locale: fr,
      }),
    };
  };

  const markAsRead = async (id: string) => {
    if (!admin?.id) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("admin_id", admin.id);
  };

  const markAllRead = async () => {
    if (!admin?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("admin_id", admin.id)
      .eq("read", false);
  };

  const handleSignOut = async () => {
    clearLocalAuth();
    await supabase.auth.signOut();
  };

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

  useEffect(() => {
    initialUnreadSoundPlayedRef.current = false;
  }, [admin?.id]);

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      if (!isAdmin || !admin?.id) {
        setNotifications([]);
        setNotifLoading(false);
        return;
      }
      setNotifLoading(true);
      setNotifError(null);
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, read, created_at")
        .eq("admin_id", admin.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        if (!isMounted) return;
        setNotifError("Impossible de charger les notifications.");
        setNotifLoading(false);
        return;
      }

      if (!isMounted) return;

      const mapped = ((data ?? []) as NotificationRow[]).map((n) => mapNotificationRowToItem(n));

      if (!initialUnreadSoundPlayedRef.current && mapped.some((item) => !item.read)) {
        playNotificationSound();
        initialUnreadSoundPlayedRef.current = true;
      }

      setNotifications(mapped);
      setNotifLoading(false);
    };

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, admin?.id]);

  useEffect(() => {
    if (!isAdmin || !admin?.id) return;

    const channel = supabase
      .channel(`notifications-admin-${admin.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `admin_id=eq.${admin.id}`,
        },
        (payload) => {
          const newRow = payload.new as NotificationRow;
          const nextItem = mapNotificationRowToItem(newRow);

          setNotifications((prev) => {
            if (prev.some((item) => item.id === nextItem.id)) return prev;
            return [nextItem, ...prev].slice(0, 10);
          });
          setNotifLoading(false);
          setNotifError(null);

          if (!nextItem.read) {
            playNotificationSound();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `admin_id=eq.${admin.id}`,
        },
        (payload) => {
          const updatedRow = payload.new as NotificationRow;
          const updatedItem = mapNotificationRowToItem(updatedRow);

          setNotifications((prev) => {
            const index = prev.findIndex((item) => item.id === updatedItem.id);
            if (index === -1) return [updatedItem, ...prev].slice(0, 10);

            const next = [...prev];
            next[index] = updatedItem;
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `admin_id=eq.${admin.id}`,
        },
        (payload) => {
          const oldRow = payload.old as { id?: string };
          if (!oldRow?.id) return;
          setNotifications((prev) => prev.filter((item) => item.id !== oldRow.id));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, admin?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setNotifActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderNotificationItem = (notif: NotificationItem) => {
    const Icon = notifIcon[notif.type];
    const isContactMessage = notif.title === "Nouveau message";
    const senderName = notif.senderName?.trim() || "Utilisateur";
    const subject = notif.subject?.trim() || "Sans sujet";
    const notificationAvatarInitial =
      senderName.charAt(0).toUpperCase() ||
      notif.senderEmail?.trim().charAt(0).toUpperCase() ||
      notif.title.trim().charAt(0).toUpperCase() ||
      "N";

    return (
      <button
        key={notif.id}
        onClick={() => !notif.read && void markAsRead(notif.id)}
        className="group relative w-full rounded-xl px-2 py-2 text-left transition-colors hover:bg-black/[0.04]"
      >
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border border-black/10">
              <AvatarFallback className={cn("text-sm font-semibold text-white", notifAvatarClass[notif.type])}>
                {notificationAvatarInitial}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#f0f2f5] text-white",
              notifBadgeClass[notif.type]
            )}>
              <Icon className="h-3 w-3" />
            </span>
          </div>
          <div className="min-w-0 flex-1 pr-4">
            {isContactMessage ? (
              <>
                <p className="truncate text-[1rem] font-semibold leading-5 text-[#1c1e21]">{senderName}</p>
                <p className="line-clamp-2 text-[0.92rem] leading-5 text-[#1c1e21]/90">
                  Sujet: {subject}
                </p>
              </>
            ) : (
              <p className="text-[0.95rem] leading-5 text-[#1c1e21]">
                <span className="font-semibold">{notif.title}</span>{" "}
                <span className="text-[#1c1e21]/90">{notif.message}</span>
              </p>
            )}
            <p className="mt-1 text-xs font-semibold text-[#1877f2]">{toCompactTime(notif.time)}</p>
          </div>
        </div>
        {!notif.read && <span className="absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#1877f2]" />}
      </button>
    );
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled 
        ? "bg-card/95 backdrop-blur-md shadow-medium"
        : isHomeTop
          ? "bg-white/70 backdrop-blur-sm"
          : "bg-transparent"
    )}>
      <div className="container mx-auto px-4">
        {/* Top bar - Only visible when not scrolled */}
        <div className={cn(
          "hidden md:flex items-center justify-between py-2 text-sm border-b transition-all duration-300",
          isScrolled 
            ? "h-0 opacity-0 overflow-hidden py-0 border-transparent" 
            : isHomeTop
              ? "border-black/20"
              : "border-border/50"
        )}>
          <div className="flex items-center gap-6">
            {topBarPhone && (
              <div className={cn("flex items-center gap-2", topBarTextClass)}>
                <Phone className="w-4 h-4 text-secondary" />
                <span>{topBarPhone}</span>
              </div>
            )}
            {topBarEmail && (
              <div className={cn("flex items-center gap-2", topBarTextClass)}>
                <Mail className="w-4 h-4 text-secondary" />
                <span>{topBarEmail}</span>
              </div>
            )}
            {topBarLocation && (
              <div className={cn("flex items-center gap-2", topBarTextClass)}>
                <MapPin className="w-4 h-4 text-secondary" />
                <span>{topBarLocation}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <SocialButtons size="sm" />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-2 py-1 hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn("max-w-28 truncate text-xs", isHomeTop ? "text-black" : "text-muted-foreground")} title={user?.email ?? ""}>
                      {userDisplayName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="max-w-56 truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/parametres">
                      <Settings className="w-4 h-4 mr-2" />
                      Parametres
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/messages">Boite messages</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>Se deconnecter</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Main nav */}
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 hero-gradient rounded-lg flex items-center justify-center shadow-medium group-hover:shadow-gold transition-all duration-300">
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
              <span className={cn("font-serif text-2xl font-bold", isHomeTop ? "text-black" : "text-foreground")}>
                {cabinetName}
              </span>
              <span className={cn(
                "hidden sm:block text-xs font-medium tracking-wider uppercase",
                isHomeTop ? "text-black/70" : "text-muted-foreground"
              )}>
                {cabinetSubtitle}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  location.pathname === link.href
                    ? "bg-secondary/20 text-secondary"
                    : isHomeTop
                      ? "text-black/90 hover:text-black hover:bg-black/10"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Notifications (admin only) */}
            {isAdmin && (
              <div className="relative" ref={notifRef}>
                <button
                  className={cn(
                    "relative p-2 rounded-full transition-colors",
                    isHomeTop ? "hover:bg-black/10" : "hover:bg-muted"
                  )}
                  onClick={() => {
                    setNotifOpen((prev) => {
                      const next = !prev;
                      if (!next) {
                        setNotifActionsOpen(false);
                      }
                      return next;
                    });
                  }}
                >
                  <Bell className={cn("w-5 h-5", isHomeTop ? "text-black/90" : "text-foreground/70")} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {/* Notification panel */}
                {notifOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[22rem] sm:w-[24rem] overflow-hidden rounded-2xl border border-black/10 bg-[#f0f2f5] shadow-[0_18px_42px_rgba(0,0,0,0.24)] animate-fade-in">
                    <div className="px-3 pb-2 pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar className="h-10 w-10 shrink-0 border border-black/10">
                            <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                            <AvatarFallback className="bg-[#e2e5ea] text-sm font-semibold text-[#1c1e21]">
                              {userInitial}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="truncate font-sans text-[2rem] font-bold leading-none text-[#1c1e21]">Notifications</h3>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setNotifActionsOpen((prev) => !prev)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#65676b] transition-colors hover:bg-black/5"
                            title="Options des notifications"
                            aria-label="Options des notifications"
                            aria-expanded={notifActionsOpen}
                            aria-haspopup="menu"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>

                          {notifActionsOpen && (
                            <div className="absolute right-0 top-11 z-20 w-80 rounded-2xl border border-black/10 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
                              <button
                                onClick={() => {
                                  void markAllRead();
                                  setNotifActionsOpen(false);
                                }}
                                disabled={unreadCount === 0}
                                className="flex w-full items-center gap-3 rounded-lg bg-black/[0.06] px-3 py-2 text-left text-[1.12rem] font-medium text-[#1c1e21] transition-colors hover:bg-black/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Check className="h-4 w-4 shrink-0 text-[#2e3135]" />
                                <span>Tout marquer comme lu</span>
                              </button>

                              <Link
                                to="/admin/messages"
                                onClick={() => {
                                  setNotifActionsOpen(false);
                                  setNotifOpen(false);
                                }}
                                className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-[1.12rem] font-medium text-[#1c1e21] transition-colors hover:bg-black/[0.06]"
                              >
                                <Monitor className="h-4 w-4 shrink-0 text-[#2e3135]" />
                                <span>Ouvrir les notifications</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => setNotifFilter("all")}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                            notifFilter === "all" ? "bg-[#dce8ff] text-[#1877f2]" : "text-[#1c1e21] hover:bg-black/5"
                          )}
                        >
                          Tout
                        </button>
                        <button
                          onClick={() => setNotifFilter("unread")}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                            notifFilter === "unread" ? "bg-[#dce8ff] text-[#1877f2]" : "text-[#1c1e21] hover:bg-black/5"
                          )}
                        >
                          Non lu
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[26rem] overflow-y-auto px-2 pb-2">
                      {notifLoading && (
                        <div className="px-2 py-3 text-sm text-[#65676b]">
                          Chargement...
                        </div>
                      )}

                      {!notifLoading && notifError && (
                        <div className="px-2 py-3 text-sm text-destructive">
                          {notifError}
                        </div>
                      )}

                      {!notifLoading && !notifError && visibleCount === 0 && (
                        <div className="px-2 py-3 text-sm text-[#65676b]">
                          {notifFilter === "unread" ? "Aucune notification non lue." : "Aucune notification pour le moment."}
                        </div>
                      )}

                      {!notifLoading && !notifError && visibleCount > 0 && (
                        <>
                          {unreadNotifications.length > 0 && (
                            <>
                              <div className="flex items-center justify-between px-2 pb-1 pt-1">
                                <p className="text-base font-bold text-[#1c1e21]">Nouveau</p>
                                <Link
                                  to="/admin/messages"
                                  onClick={() => setNotifOpen(false)}
                                  className="text-sm font-medium text-[#1877f2] hover:underline"
                                >
                                  Voir tout
                                </Link>
                              </div>
                              <div className="space-y-1">
                                {unreadNotifications.map((notif) => renderNotificationItem(notif))}
                              </div>
                            </>
                          )}

                          {notifFilter === "all" && olderNotifications.length > 0 && (
                            <>
                              <p className="px-2 pb-1 pt-3 text-base font-bold text-[#1c1e21]">Plus tôt</p>
                              <div className="space-y-1">
                                {olderNotifications.map((notif) => renderNotificationItem(notif))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <Link to="/connexion" className="hidden md:block">
                <Button variant="outline">Se connecter</Button>
              </Link>
            )}

            <Link to="/devis" className="hidden md:block">
              <Button className="gold-gradient text-secondary-foreground font-semibold shadow-gold hover:shadow-strong transition-all">
                Devis Gratuit
              </Button>
            </Link>

            {/* Mobile menu button */}
            <button
              className={cn(
                "lg:hidden p-2 rounded-md",
                isHomeTop
                  ? "text-black hover:bg-black/10"
                  : "hover:bg-muted"
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <nav className={cn(
            "lg:hidden py-4 border-t animate-fade-in",
            isHomeTop
              ? "border-black/10 bg-white/80 backdrop-blur-sm"
              : "border-border"
          )}>
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-secondary/20 text-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-4 space-y-3">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center gap-3 rounded-lg border border-border bg-card/80 px-3 py-2 text-left hover:bg-muted transition-colors">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                        <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{userDisplayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel className="max-w-56 truncate">{user?.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/parametres" onClick={() => setIsOpen(false)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Parametres
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/messages" onClick={() => setIsOpen(false)}>
                          Boite messages
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                    >
                      Se deconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Link to="/devis" onClick={() => setIsOpen(false)}>
                <Button className="w-full gold-gradient text-secondary-foreground font-semibold">
                  Devis Gratuit
                </Button>
              </Link>
              {!user && (
                <Link to="/connexion" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Se connecter
                  </Button>
                </Link>
              )}
              <div className="flex justify-center pt-2">
                <SocialButtons />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

