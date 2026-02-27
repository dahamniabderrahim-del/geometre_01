import { Layout } from "@/components/layout/Layout";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getAdminCabinetName, listActiveAdmins, pickPrimaryAdmin, type AdminProfile } from "@/lib/admin";
import { getReadableErrorMessage } from "@/lib/error-message";
import { Link } from "react-router-dom";

const Contact = () => {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [defaultAdmin, setDefaultAdmin] = useState<AdminProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email ?? "" }));
    }
  }, [user, formData.email]);

  useEffect(() => {
    let active = true;
    listActiveAdmins()
      .then((admins) => {
        if (!active) return;
        setDefaultAdmin(pickPrimaryAdmin(admins));
      })
      .catch(() => {
        if (!active) return;
        setDefaultAdmin(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const contactAdmin = defaultAdmin;
  const contactCabinetName = getAdminCabinetName(contactAdmin);
  const contactGeometreName = contactAdmin?.name?.trim() ?? "";
  const contactAddress = contactAdmin?.address?.trim() ?? "";
  const contactCity = contactAdmin?.city?.trim() ?? "";
  const contactPhone = contactAdmin?.phone?.trim() ?? "";
  const contactEmail = contactAdmin?.email?.trim() ?? "";
  const openingWeekdays = contactAdmin?.opening_hours_weekdays?.trim() ?? "";
  const openingSaturday = contactAdmin?.opening_hours_saturday?.trim() ?? "";
  const mapLocation = [contactAddress, contactCity].filter(Boolean).join(", ");
  const mapSrc = mapLocation
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapLocation)}&z=17&output=embed`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;

    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter avant d'envoyer un message.",
        variant: "destructive",
      });
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const isSchemaMismatchError = (error?: { message?: string | null; code?: string | null } | null) => {
        const message = (error?.message ?? "").toLowerCase();
        const code = (error?.code ?? "").toLowerCase();
        return (
          code === "pgrst204" ||
          message.includes("schema cache") ||
          (message.includes("could not find the") && message.includes("column")) ||
          (message.includes("column") && message.includes("does not exist"))
        );
      };

      const { name, email, phone, subject, message } = formData;
      const senderName = name.trim();
      const senderEmail = (user.email ?? email).trim();
      const senderPhone = phone.trim();
      const messageSubject = subject.trim();
      const messageBody = message.trim();

      if (!senderPhone) {
        toast({
          title: "Telephone requis",
          description: "Veuillez renseigner votre numero de telephone.",
          variant: "destructive",
        });
        return;
      }
      let targetAdminId = defaultAdmin?.id ?? null;

      if (!targetAdminId) {
        const admins = await listActiveAdmins();
        targetAdminId = pickPrimaryAdmin(admins)?.id ?? null;
      }

      const userContactPayload = {
        name: senderName,
        email: senderEmail,
        phone: senderPhone,
        ...(targetAdminId ? { admin_id: targetAdminId } : {}),
      };

      const userPayloadVariants: Array<Record<string, unknown>> = [
        userContactPayload,
        {
          name: senderName,
          email: senderEmail,
          phone: senderPhone,
        },
        {
          name: senderName,
          email: senderEmail,
        },
      ];

      let userSaveError: { message?: string | null; code?: string | null } | null = null;

      for (const payload of userPayloadVariants) {
        const { data: updatedById, error: updateByIdError } = await supabase
          .from("users")
          .update(payload as any)
          .eq("id", user.id)
          .select("id")
          .maybeSingle();

        if (updateByIdError) {
          userSaveError = updateByIdError;
          if (isSchemaMismatchError(updateByIdError)) {
            continue;
          }
          break;
        }

        if (updatedById) {
          userSaveError = null;
          break;
        }

        const { data: updatedByEmail, error: updateByEmailError } = await supabase
          .from("users")
          .update(payload as any)
          .eq("email", senderEmail)
          .select("id")
          .maybeSingle();

        if (updateByEmailError) {
          userSaveError = updateByEmailError;
          if (isSchemaMismatchError(updateByEmailError)) {
            continue;
          }
          break;
        }

        if (updatedByEmail) {
          userSaveError = null;
          break;
        }

        const { error: insertUserError } = await supabase.from("users").insert({
          id: user.id,
          ...payload,
          password: "",
        } as any);

        if (!insertUserError) {
          userSaveError = null;
          break;
        }

        userSaveError = insertUserError;
        if (!isSchemaMismatchError(insertUserError)) {
          break;
        }
      }

      if (userSaveError) {
        // Non bloquant: l'envoi de notification continue meme si la table users
        // refuse la mise a jour (RLS/politiques/colonnes).
        console.warn("users write fallback:", userSaveError.message);
      }

      let resolvedUserId: string | null = null;

      const { data: userById } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      resolvedUserId = userById?.id ?? null;

      if (!resolvedUserId) {
        const { data: userByEmail } = await supabase
          .from("users")
          .select("id")
          .ilike("email", senderEmail)
          .limit(1)
          .maybeSingle();
        resolvedUserId = userByEmail?.id ?? null;
      }

      if (!resolvedUserId) {
        const insertUserPayload: Record<string, unknown> = {
          id: user.id,
          name: senderName || senderEmail.split("@")[0],
          email: senderEmail,
          password: "",
          phone: senderPhone,
          ...(targetAdminId ? { admin_id: targetAdminId } : {}),
        };

        const { data: insertedUser } = await supabase
          .from("users")
          .insert(insertUserPayload as any)
          .select("id")
          .maybeSingle();
        resolvedUserId = insertedUser?.id ?? null;
      }

      if (!resolvedUserId) {
        toast({
          title: "Erreur",
          description: "Impossible de lier le message a cet utilisateur. Reconnectez-vous puis reessayez.",
          variant: "destructive",
        });
        return;
      }

      const notificationPayload = {
        user_id: resolvedUserId,
        title: "Nouveau message",
        subject: messageSubject,
        message: messageBody,
        type: "info",
        read: false,
      };

      const { error: notifError } = await supabase.from("notifications").insert(notificationPayload as any);

      if (notifError) {
        toast({
          title: "Erreur",
          description: getReadableErrorMessage(notifError, "Impossible d'envoyer le message. Reessayez."),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="premium-hero">
        <div className="absolute inset-0 geometric-pattern opacity-10" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="mb-4 font-serif text-4xl font-bold text-primary-foreground md:text-5xl">
              <span className="text-gradient">Contactez</span>-nous
            </h1>
            <p className="text-lg text-primary-foreground/82">
              Une question, un projet ? N'hésitez pas à nous contacter. Nous vous
              répondrons sous 24h.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl hero-gradient">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">
                      Cabinet expert foncier
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {contactCabinetName || "Cabinet non renseigne."}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Geometre: {contactGeometreName || "Non renseigne"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl hero-gradient">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">
                      Adresse
                    </h3>
                    {(contactAddress || contactCity) ? (
                      <p className="text-muted-foreground text-sm">
                        {contactAddress}
                        {contactAddress && contactCity ? <br /> : null}
                        {contactCity}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm">Adresse non renseignee.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl hero-gradient">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">
                      Téléphone
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {contactPhone || "Telephone non renseigne."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl hero-gradient">
                    <Mail className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">Email</h3>
                    <p className="text-muted-foreground text-sm">
                      {contactEmail || "Email non renseigne."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl hero-gradient">
                    <Clock className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">
                      Horaires
                    </h3>
                    {(openingWeekdays || openingSaturday) ? (
                      <p className="text-muted-foreground text-sm">
                        {openingWeekdays}
                        {openingWeekdays && openingSaturday ? <br /> : null}
                        {openingSaturday}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm">Horaires non renseignes.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="premium-card-strong p-8">
                <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
                  Envoyez-nous un message
                </h2>

                {loading ? (
                  <p className="text-muted-foreground">Chargement...</p>
                ) : !user ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Vous devez être connecté pour envoyer un message.
                    </p>
                    <Link to="/connexion?redirect=/contact">
                      <Button>Se connecter</Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Nom complet *
                        </label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Jean Dupont"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={user?.email ?? formData.email}
                          onChange={handleChange}
                          placeholder="jean@exemple.fr"
                          readOnly={!!user?.email}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Telephone *
                        </label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="06 12 34 56 78"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Sujet *
                        </label>
                        <Input
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Demande d'information"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Message *
                      </label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Décrivez votre projet..."
                        rows={6}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full sm:w-auto"
                      disabled={isSubmitting}
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? "Envoi..." : "Envoyer le message"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps */}
      <section className="relative py-4 pb-16">
        <div className="container mx-auto px-4">
        <div className="premium-card-strong overflow-hidden p-2">
        <div className="h-96 overflow-hidden rounded-2xl">
        {mapSrc ? (
          <iframe
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Localisation ${contactCabinetName || "Cabinet"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted px-4 text-center">
            <p className="text-muted-foreground">
              Position indisponible. Veuillez renseigner l'adresse du cabinet dans la base de donnees.
            </p>
          </div>
        )}
        </div>
        </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;



