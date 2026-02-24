import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Clock3, MailOpen, MessageSquare, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parseDatabaseTimestamp } from "@/lib/datetime";
import { parseContactNotificationMessage } from "@/lib/notification-message";

type AdminMessage = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type: "success" | "info" | "warning";
};

const senderInitial = (senderName: string) => {
  const trimmed = senderName.trim();
  return (trimmed.charAt(0) || "U").toUpperCase();
};

const displayValue = (value: string) => {
  const normalized = value.trim();
  return normalized || "-";
};

const AdminMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const { admin, isAdmin, loading: adminLoading } = useAdminProfile(user?.email);

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!admin?.id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("notifications")
      .select("id, title, message, read, created_at, type")
      .eq("admin_id", admin.id)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("Impossible de charger les messages.");
      setMessages([]);
      setLoading(false);
      return;
    }

    const onlyUserMessages = ((data ?? []) as AdminMessage[]).filter((item) => item.title === "Nouveau message");
    setMessages(onlyUserMessages);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    if (!admin?.id) return;
    setMessages((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("admin_id", admin.id);
  };

  const markAllRead = async () => {
    if (!admin?.id) return;
    setMessages((prev) => prev.map((item) => ({ ...item, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("admin_id", admin.id)
      .eq("read", false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadMessages();
  }, [isAdmin, admin?.id]);

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
                <Button variant="outline" size="sm" onClick={() => loadMessages()}>
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
                const parsed = parseContactNotificationMessage(item.message);

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
                            {senderInitial(parsed.senderName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{displayValue(parsed.senderName)}</p>
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
                      <p><span className="font-semibold text-foreground">Nom:</span> {displayValue(parsed.senderName)}</p>
                      <p><span className="font-semibold text-foreground">Email:</span> {displayValue(parsed.senderEmail)}</p>
                      <p><span className="font-semibold text-foreground">Telephone:</span> {displayValue(parsed.senderPhone)}</p>
                      <p><span className="font-semibold text-foreground">Sujet:</span> {displayValue(parsed.subject)}</p>
                    </div>

                    <div className="mb-3 rounded-lg bg-muted/40 p-3">
                      <p className="mb-1 text-sm font-semibold text-foreground">Message:</p>
                      <p className="whitespace-pre-line text-sm text-foreground/90">
                        {displayValue(parsed.body)}
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
