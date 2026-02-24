import { Layout } from "@/components/layout/Layout";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { listActiveAdmins, type AdminProfile } from "@/lib/admin";
import { formatContactNotificationMessage } from "@/lib/notification-message";
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
        setDefaultAdmin(admins[0] ?? null);
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
  const contactCabinetName = contactAdmin?.name?.trim() ?? "";
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
        targetAdminId = admins[0]?.id ?? null;
      }

      if (!targetAdminId) {
        toast({
          title: "Compte non lie",
          description: "Aucun admin n'est lie a ce compte.",
          variant: "destructive",
        });
        return;
      }

      const { error: userError } = await supabase
        .from("users")
        .upsert(
          {
            id: user.id,
            name: senderName,
            email: senderEmail,
            password: "",
            phone: senderPhone,
            subject: messageSubject,
            message: messageBody,
            admin_id: targetAdminId,
          },
          { onConflict: "email" }
        );

      const notificationPayload = {
        admin_id: targetAdminId,
        title: "Nouveau message",
        message: formatContactNotificationMessage({
          name: senderName,
          email: senderEmail,
          phone: senderPhone,
          subject: messageSubject,
          message: messageBody,
        }),
        type: "info",
        read: false,
      };

      let { error: notifError } = await supabase.from("notifications").insert(notificationPayload);

      if (notifError) {
        toast({
          title: "Erreur",
          description: notifError.message ?? "Impossible d'envoyer le message. Réessayez.",
          variant: "destructive",
        });
        return;
      }

      if (userError) {
        // Non bloquant: certaines politiques RLS peuvent refuser la mise a jour de la table users.
        console.warn("users upsert ignored:", userError.message);
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
      <section className="py-16 bg-muted geometric-pattern">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="text-gradient">Contactez</span>-nous
            </h1>
            <p className="text-muted-foreground text-lg">
              Une question, un projet ? N'hésitez pas à nous contacter. Nous vous
              répondrons sous 24h.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card rounded-xl shadow-soft p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg hero-gradient flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-foreground mb-1">
                      Cabinet expert foncier
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {contactCabinetName || "Cabinet non renseigne."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-soft p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg hero-gradient flex items-center justify-center shrink-0">
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

              <div className="bg-card rounded-xl shadow-soft p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg hero-gradient flex items-center justify-center shrink-0">
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

              <div className="bg-card rounded-xl shadow-soft p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg hero-gradient flex items-center justify-center shrink-0">
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

              <div className="bg-card rounded-xl shadow-soft p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg hero-gradient flex items-center justify-center shrink-0">
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
              <div className="bg-card rounded-xl shadow-soft p-8">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
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
                          placeholder="Demande de devis"
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
      <section className="h-96 relative">
        {mapSrc ? (
          <iframe
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localisation GéoExpert"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center px-4 text-center">
            <p className="text-muted-foreground">
              Position indisponible. Veuillez renseigner l'adresse du cabinet dans la base de donnees.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Contact;
