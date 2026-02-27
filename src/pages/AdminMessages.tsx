import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Clock3, MailOpen, MessageSquare, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parseDatabaseTimestamp } from "@/lib/datetime";
import { parseContactNotificationMessage } from "@/lib/notification-message";

type AdminMessage = {
  id: string;
  title: string;
  message: string;
  user_id: string | null;
  subject: string | null;
  read: boolean;
  created_at: string;
  type: "success" | "info" | "warning";
};
type UserContact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

const normalizeText = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const senderInitial = (senderName: string) => {
  const trimmed = normalizeText(senderName);
  return (trimmed.charAt(0) || "U").toUpperCase();
};

const displayValue = (value: string) => {
  const normalized = normalizeText(value);
  return normalized || "-";
};

const AdminMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminProfile(user?.email);

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserContact>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async (showLoader = true) => {
    if (!isAdmin) {
      setMessages([]);
      setLoading(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    }
    setError(null);

    const { data, error: loadError } = await supabase
      .from("notifications")
      .select("id, title, message, user_id, subject, read, created_at, type")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("Impossible de charger les messages.");
      setMessages([]);
      setLoading(false);
      return;
    }

    const allNotifications = (data ?? []) as AdminMessage[];
    setMessages(allNotifications);

    const userIds = Array.from(
      new Set(
        allNotifications
          .map((item) => item.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, email, phone")
        .in("id", userIds);

      if (usersData) {
        const nextUsersById = (usersData as UserContact[]).reduce<Record<string, UserContact>>((acc, current) => {
          acc[current.id] = current;
          return acc;
        }, {});
        setUsersById(nextUsersById);
      }
    }

    setLoading(false);
  }, [isAdmin]);

  const markAsRead = async (id: string) => {
    if (!isAdmin) return;
    setMessages((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  };

  const markAllRead = async () => {
    if (!isAdmin) return;
    setMessages((prev) => prev.map((item) => ({ ...item, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    void loadMessages(true);
  }, [isAdmin, loadMessages]);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("admin-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          void loadMessages(false);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, loadMessages]);

  useEffect(() => {
    if (!isAdmin) return;

    const intervalId = window.setInterval(() => {
      void loadMessages(false);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAdmin, loadMessages]);

  if (authLoading || adminLoading) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-muted-foreground mb-4">Vous devez etre connecte.</p>
            <Link to="/connexion">
              <Button>Se connecter</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-destructive">Acces refuse.</p>
          </div>
        </section>
      </Layout>
    );
  }

  const unreadCount = messages.filter((item) => !item.read).length;

  return (
    <Layout>
      <section className="py-16 bg-muted geometric-pattern">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Bell className="w-10 h-10 text-secondary" />
            Boite de messages
          </h1>
          <p className="text-muted-foreground">
            Messages recus des utilisateurs. Non lus: <span className="font-semibold">{unreadCount}</span>
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Messages totaux</p>
              <p className="text-2xl font-bold text-foreground">{messages.length}</p>
            </div>
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-3 shadow-soft">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Non lus</p>
              <p className="text-2xl font-bold text-secondary">{unreadCount}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-soft p-6 border border-border/70">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-serif text-xl font-bold">Liste des messages</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void loadMessages(true)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead}>
                  <MailOpen className="w-4 h-4 mr-2" />
                  Tout marquer lu
                </Button>
              )}
              </div>
            </div>

            {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
            {!loading && error && <p className="text-sm text-destructive">{error}</p>}
            {!loading && !error && messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/70" />
                <p className="text-sm text-muted-foreground">Aucun message.</p>
              </div>
            )}

            <div className="space-y-3">
              {messages.map((item) => {
                const isContactMessage = item.title === "Nouveau message";
                const parsed = isContactMessage ? parseContactNotificationMessage(item.message) : null;
                const linkedUser = item.user_id ? usersById[item.user_id] : undefined;
                const isLegacyFormatted = /(^|\n)\s*nom\s*:/i.test(item.message) || /(^|\n)\s*sujet\s*:/i.test(item.message);
                const senderName = isContactMessage
                  ? normalizeText(linkedUser?.name) || normalizeText(parsed?.senderName) || "Utilisateur"
                  : normalizeText(linkedUser?.name) || "Systeme";
                const senderEmail = isContactMessage
                  ? normalizeText(linkedUser?.email) || normalizeText(parsed?.senderEmail) || ""
                  : normalizeText(linkedUser?.email);
                const senderPhone = isContactMessage
                  ? normalizeText(linkedUser?.phone) || normalizeText(parsed?.senderPhone) || ""
                  : normalizeText(linkedUser?.phone);
                const subject =
                  normalizeText(item.subject) ||
                  (isContactMessage ? (isLegacyFormatted ? normalizeText(parsed?.subject) : "") : normalizeText(item.title));
                const body =
                  isContactMessage && isLegacyFormatted
                    ? normalizeText(parsed?.body) || normalizeText(item.message)
                    : normalizeText(item.message);

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 md:p-5 transition-colors ${
                      item.read
                        ? "border-border bg-background"
                        : "border-secondary/40 bg-secondary/5"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                            {senderInitial(senderName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{displayValue(senderName)}</p>
                          {!isContactMessage && (
                            <p className="text-xs text-muted-foreground">{displayValue(item.title)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.read ? "outline" : "secondary"}>
                          {item.read ? "Lu" : "Nouveau"}
                        </Badge>
                        {!item.read && (
                          <Button size="sm" variant="outline" onClick={() => markAsRead(item.id)}>
                            Marquer lu
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 grid gap-1 text-sm text-foreground/90 sm:grid-cols-2 sm:gap-x-6">
                      <p><span className="font-semibold text-foreground">Nom:</span> {displayValue(senderName)}</p>
                      <p><span className="font-semibold text-foreground">Email:</span> {displayValue(senderEmail)}</p>
                      <p><span className="font-semibold text-foreground">Telephone:</span> {displayValue(senderPhone)}</p>
                      <p><span className="font-semibold text-foreground">Sujet:</span> {displayValue(subject)}</p>
                    </div>

                    <div className="mb-3 rounded-lg bg-muted/40 p-3">
                      <p className="mb-1 text-sm font-semibold text-foreground">Message:</p>
                      <p className="whitespace-pre-line text-sm text-foreground/90">
                        {displayValue(body)}
                      </p>
                    </div>

                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5" />
                      {parseDatabaseTimestamp(item.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminMessages;
