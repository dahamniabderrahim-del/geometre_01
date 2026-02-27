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
import { getAdminCabinetName, listActiveAdmins, pickPrimaryAdmin, type AdminProfile } from "@/lib/admin";
import { parseContactNotificationMessage } from "@/lib/notification-message";
import { CabinetMark } from "@/components/brand/CabinetMark";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "Le Cabinet" },
  { href: "/equipe", label: "Equipe" },
  { href: "/services", label: "Services" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/contact", label: "Contact" },
];

type NotificationItem = {
  id: string;
  userId?: string;
  type: "success" | "info" | "warning";
  title: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  subject?: string;
  time: string;
  read: boolean;
};
type NotificationRow = {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  subject?: string | null;
  type: "success" | "info" | "warning" | null;
  read: boolean | null;
  created_at: string;
};
type NotificationUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};
type NotificationFilter = "all" | "unread";

const fallbackNotifications: NotificationItem[] = [];

const notifIcon = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

const notifAvatarClass: Record<NotificationItem["type"], string> = {
  success: "bg-emerald-600",
  info: "bg-primary",
  warning: "bg-secondary",
};

const notifBadgeClass: Record<NotificationItem["type"], string> = {
  success: "bg-emerald-500",
  info: "bg-primary",
  warning: "bg-secondary",
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

const normalizeText = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
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
  const cabinetName =
    getAdminCabinetName(admin) ||
    getAdminCabinetName(publicAdmin) ||
    "Cabinet non renseigne";
  const cabinetSubtitle =
    admin?.grade?.trim() ||
    publicAdmin?.grade?.trim() ||
    "GEOMETRE-EXPERT AGREE";
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
  const [notificationUsers, setNotificationUsers] = useState<Record<string, NotificationUser>>({});
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const initialUnreadSoundPlayedRef = useRef(false);
  const location = useLocation();
  const isHomeTop = !isScrolled;
  const topBarTextClass = "text-foreground/75";
  const topBarPhone = admin?.phone?.trim() || publicAdmin?.phone?.trim() || "";
  const topBarEmail = admin?.email?.trim() || publicAdmin?.email?.trim() || "";
  const topBarAddress = admin?.address?.trim() || publicAdmin?.address?.trim() || "";
  const topBarCity = admin?.city?.trim() || publicAdmin?.city?.trim() || "";
  const topBarLocation = [topBarAddress, topBarCity].filter(Boolean).join(", ");
  const visibleNavLinks = navLinks.filter((link) => link.href !== "/equipe" || isAdmin);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadNotifications = notifications.filter((n) => !n.read);
  const olderNotifications = notifications.filter((n) => n.read);
  const visibleCount = notifFilter === "unread" ? unreadNotifications.length : notifications.length;

  const loadUsersForNotifications = async (rows: NotificationRow[]) => {
    const userIds = Array.from(
      new Set(
        rows
          .map((row) => row.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("users")
      .select("id, name, email, phone")
      .in("id", userIds);

    if (!data) return;

    setNotificationUsers((prev) => {
      const next = { ...prev };
      for (const row of data as NotificationUser[]) {
        next[row.id] = row;
      }
      return next;
    });
  };

  const mapNotificationRowToItem = (row: NotificationRow): NotificationItem => {
    const parsedContact =
      row.title === "Nouveau message"
        ? parseContactNotificationMessage(row.message)
        : null;
    const isLegacyFormatted = /(^|\n)\s*nom\s*:/i.test(row.message) || /(^|\n)\s*sujet\s*:/i.test(row.message);

    return {
      id: row.id,
      userId: row.user_id ?? undefined,
      type: row.type ?? "info",
      title: row.title,
      message: isLegacyFormatted ? parsedContact?.body || row.message : row.message,
      senderName: parsedContact?.senderName,
      senderEmail: parsedContact?.senderEmail,
      senderPhone: parsedContact?.senderPhone,
      subject: row.subject?.trim() || (isLegacyFormatted ? parsedContact?.subject : undefined),
      read: row.read ?? false,
      time: formatDistanceToNow(parseDatabaseTimestamp(row.created_at), {
        addSuffix: true,
        locale: fr,
      }),
    };
  };

  const markAsRead = async (id: string) => {
    if (!isAdmin) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  };

  const markAllRead = async () => {
    if (!isAdmin) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
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
  }, [isAdmin]);

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      if (!isAdmin) {
        setNotifications([]);
        setNotifLoading(false);
        return;
      }
      setNotifLoading(true);
      setNotifError(null);
      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, title, message, subject, type, read, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        if (!isMounted) return;
        setNotifError("Impossible de charger les notifications.");
        setNotifLoading(false);
        return;
      }

      if (!isMounted) return;

      const rows = (data ?? []) as NotificationRow[];
      await loadUsersForNotifications(rows);
      const mapped = rows.map((n) => mapNotificationRowToItem(n));

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
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("notifications-admin")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newRow = payload.new as NotificationRow;
          void loadUsersForNotifications([newRow]);
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
        },
        (payload) => {
          const updatedRow = payload.new as NotificationRow;
          void loadUsersForNotifications([updatedRow]);
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
  }, [isAdmin]);

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

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const renderNotificationItem = (notif: NotificationItem) => {
    const Icon = notifIcon[notif.type];
    const isContactMessage = notif.title === "Nouveau message";
    const linkedUser = notif.userId ? notificationUsers[notif.userId] : undefined;
    const senderName = normalizeText(linkedUser?.name) || normalizeText(notif.senderName) || "Utilisateur";
    const subject = normalizeText(notif.subject) || "Sans sujet";
    const messagePreview = normalizeText(notif.message);
    const linkedEmail = normalizeText(linkedUser?.email);
    const notifEmail = normalizeText(notif.senderEmail);
    const notifTitle = normalizeText(notif.title);
    const notificationAvatarInitial =
      senderName.charAt(0).toUpperCase() ||
      linkedEmail.charAt(0).toUpperCase() ||
      notifEmail.charAt(0).toUpperCase() ||
      notifTitle.charAt(0).toUpperCase() ||
      "N";

    return (
      <button
        key={notif.id}
        onClick={() => !notif.read && void markAsRead(notif.id)}
        className="group relative w-full rounded-xl px-1.5 py-1.5 sm:px-2 sm:py-2 text-left transition-colors hover:bg-primary/5"
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-border/70">
              <AvatarFallback className={cn("text-xs sm:text-sm font-semibold text-white", notifAvatarClass[notif.type])}>
                {notificationAvatarInitial}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              "absolute -bottom-1 -right-1 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 border-card text-white",
              notifBadgeClass[notif.type]
            )}>
              <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </span>
          </div>
          <div className="min-w-0 flex-1 pr-3 sm:pr-4">
            {isContactMessage ? (
              <>
                <p className="truncate text-[0.92rem] sm:text-[1rem] font-semibold leading-5 text-foreground">{senderName}</p>
                <p className="line-clamp-1 text-[0.84rem] sm:text-[0.92rem] leading-5 text-foreground/85">
                  Sujet: {subject}
                </p>
                <p className="line-clamp-1 text-[0.82rem] sm:text-[0.88rem] leading-5 text-muted-foreground">
                  {messagePreview}
                </p>
              </>
            ) : (
              <p className="text-[0.88rem] sm:text-[0.95rem] leading-5 text-foreground">
                <span className="font-semibold">{notif.title}</span>{" "}
                <span className="text-foreground/85">{notif.message}</span>
              </p>
            )}
            <p className="mt-1 text-[11px] sm:text-xs font-semibold text-secondary">{toCompactTime(notif.time)}</p>
          </div>
        </div>
        {!notif.read && <span className="absolute right-2 sm:right-3 top-1/2 h-2 w-2 sm:h-2.5 sm:w-2.5 -translate-y-1/2 rounded-full bg-secondary" />}
      </button>
    );
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
      isScrolled 
        ? "border-border/70 bg-background/88 backdrop-blur-xl shadow-medium"
        : isHomeTop
          ? "border-transparent bg-background/55 backdrop-blur-xl"
          : "border-border/50 bg-background/72 backdrop-blur-xl"
    )}>
      <div className="container mx-auto px-4 lg:px-6">
        {/* Top bar - Only visible when not scrolled */}
        <div className={cn(
          "hidden md:flex items-center justify-between py-2.5 text-xs tracking-wide border-b transition-all duration-300",
          isScrolled 
            ? "h-0 opacity-0 overflow-hidden py-0 border-transparent" 
            : isHomeTop
              ? "border-primary/15"
              : "border-border/70"
        )}>
          <div className="flex items-center gap-5">
            {topBarPhone && (
              <div className={cn("flex items-center gap-2", topBarTextClass)}>
                <Phone className="w-3.5 h-3.5 text-secondary" />
                <span>{topBarPhone}</span>
              </div>
            )}
            {topBarEmail && (
              <div className={cn("flex items-center gap-2", topBarTextClass)}>
                <Mail className="w-3.5 h-3.5 text-secondary" />
                <span>{topBarEmail}</span>
              </div>
            )}
            {topBarLocation && (
              <div className={cn("flex items-center gap-2", topBarTextClass)}>
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                <span>{topBarLocation}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <SocialButtons size="sm" />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border/80 bg-card/85 px-2 py-1 hover:bg-muted transition-colors shadow-soft">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-28 truncate text-xs text-muted-foreground" title={user?.email ?? ""}>
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
        <div className="flex items-center justify-between h-[4.5rem] gap-2 py-1">
          <Link to="/" className="group flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex-none">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border border-primary/15 bg-card/65 flex items-center justify-center transition-all duration-300 shadow-soft group-hover:border-secondary/45 group-hover:shadow-medium">
              <CabinetMark className="h-11 w-11 sm:h-12 sm:w-12 text-secondary" />
            </div>
            <div className="min-w-0">
              <span
                className="block truncate font-serif text-lg sm:text-xl md:text-2xl font-bold text-foreground"
              >
                {cabinetName}
              </span>
              <span className="hidden sm:block text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                {cabinetSubtitle}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-border/70 bg-card/85 px-1.5 py-1 backdrop-blur-sm shadow-soft">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                  location.pathname === link.href
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground/80 hover:text-foreground hover:bg-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3 pl-2">
            {/* Notifications (admin only) */}
            {isAdmin && (
              <div className="relative" ref={notifRef}>
                <button
                  className={cn(
                    "relative p-1.5 sm:p-2 rounded-full border border-border/70 bg-card/80 transition-colors shadow-soft",
                    isHomeTop ? "hover:bg-card" : "hover:bg-muted"
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
                  <Bell className="h-4.5 w-4.5 sm:w-5 sm:h-5 text-foreground/80" />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {/* Notification panel */}
                {notifOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[min(19.5rem,calc(100vw-0.75rem))] sm:w-[22rem] lg:w-[24rem] max-w-[calc(100vw-0.75rem)] overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-strong animate-fade-in">
                    <div className="px-2.5 sm:px-3 pb-2 pt-2.5 sm:pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 border border-border/75">
                            <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                            <AvatarFallback className="bg-muted text-xs sm:text-sm font-semibold text-foreground">
                              {userInitial}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="truncate font-sans text-[1.35rem] sm:text-[1.9rem] font-bold leading-none text-foreground">Notifications</h3>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setNotifActionsOpen((prev) => !prev)}
                            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border/60 bg-muted/55 text-muted-foreground transition-colors hover:bg-muted"
                            title="Options des notifications"
                            aria-label="Options des notifications"
                            aria-expanded={notifActionsOpen}
                            aria-haspopup="menu"
                          >
                            <MoreHorizontal className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                          </button>

                          {notifActionsOpen && (
                            <div className="absolute right-0 top-10 sm:top-11 z-20 w-[min(17rem,calc(100vw-1.25rem))] sm:w-[20rem] rounded-2xl border border-border/80 bg-card p-2 shadow-medium">
                              <button
                                onClick={() => {
                                  void markAllRead();
                                  setNotifActionsOpen(false);
                                }}
                                disabled={unreadCount === 0}
                                className="flex w-full items-center gap-3 rounded-lg bg-muted/60 px-3 py-2 text-left text-[0.96rem] sm:text-[1.05rem] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Check className="h-4 w-4 shrink-0 text-foreground" />
                                <span>Tout marquer comme lu</span>
                              </button>

                              <Link
                                to="/admin/messages"
                                onClick={() => {
                                  setNotifActionsOpen(false);
                                  setNotifOpen(false);
                                }}
                                className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-[0.96rem] sm:text-[1.05rem] font-medium text-foreground transition-colors hover:bg-muted/75"
                              >
                                <Monitor className="h-4 w-4 shrink-0 text-foreground" />
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
                            "rounded-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors",
                            notifFilter === "all" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                          )}
                        >
                          Tout
                        </button>
                        <button
                          onClick={() => setNotifFilter("unread")}
                          className={cn(
                            "rounded-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors",
                            notifFilter === "unread" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                          )}
                        >
                          Non lu
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[22rem] sm:max-h-[26rem] overflow-y-auto px-1.5 sm:px-2 pb-2">
                      {notifLoading && (
                        <div className="px-2 py-3 text-sm text-muted-foreground">
                          Chargement...
                        </div>
                      )}

                      {!notifLoading && notifError && (
                        <div className="px-2 py-3 text-sm text-destructive">
                          {notifError}
                        </div>
                      )}

                      {!notifLoading && !notifError && visibleCount === 0 && (
                        <div className="px-2 py-3 text-sm text-muted-foreground">
                          {notifFilter === "unread" ? "Aucune notification non lue." : "Aucune notification pour le moment."}
                        </div>
                      )}

                      {!notifLoading && !notifError && visibleCount > 0 && (
                        <>
                          {unreadNotifications.length > 0 && (
                            <>
                              <div className="flex items-center justify-between px-2 pb-1 pt-1">
                                <p className="text-sm sm:text-base font-bold text-foreground">Nouveau</p>
                                <Link
                                  to="/admin/messages"
                                  onClick={() => setNotifOpen(false)}
                                  className="text-xs sm:text-sm font-medium text-primary hover:underline"
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
                              <p className="px-2 pb-1 pt-3 text-sm sm:text-base font-bold text-foreground">Plus tôt</p>
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

            {/* Mobile menu button */}
            <button
              className={cn(
                "lg:hidden p-2 rounded-xl border border-border/70 bg-card/85 shadow-soft backdrop-blur-sm transition-colors",
                isHomeTop ? "text-foreground hover:bg-card" : "text-foreground hover:bg-muted"
              )}
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile sidebar nav */}
        <div
          className={cn(
            "fixed inset-0 z-[70] lg:hidden transition-opacity duration-300",
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-hidden={!isOpen}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer le menu"
          />

          <aside
            className={cn(
              "absolute right-0 top-0 h-full w-[88vw] max-w-sm border-l border-border/70 bg-background/97 shadow-strong backdrop-blur-xl transition-transform duration-300",
              isOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-4">
                <p className="font-serif text-lg font-bold text-foreground">Navigation</p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-border/70 bg-card/85 p-2 text-foreground shadow-soft"
                  aria-label="Fermer le menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-1">
                  {visibleNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                        location.pathname === link.href
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/85 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-5 space-y-3 border-t border-border/70 pt-4">
                  {user && (
                    <>
                      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/85 px-3 py-2 shadow-soft">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                          <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{userDisplayName}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>

                      <Link
                        to="/parametres"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Settings className="h-4 w-4" />
                        Parametres
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin/messages"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Bell className="h-4 w-4" />
                          Boite messages
                        </Link>
                      )}

                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          void handleSignOut();
                          setIsOpen(false);
                        }}
                      >
                        Se deconnecter
                      </Button>
                    </>
                  )}

                  {!user && (
                    <Link to="/connexion" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Se connecter
                      </Button>
                    </Link>
                  )}
                </div>
              </nav>

              <div className="border-t border-border/70 px-4 py-3">
                <div className="flex justify-center">
                  <SocialButtons />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </header>
  );
}

