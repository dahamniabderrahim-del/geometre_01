import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowRight, ArrowLeft, Calculator, FileText, User, MapPin } from "lucide-react";

const services = [
  { id: "bornage", name: "Bornage", basePrice: 800 },
  { id: "division", name: "Division parcellaire", basePrice: 1200 },
  { id: "topographie", name: "Plan topographique", basePrice: 600 },
  { id: "copropriete", name: "Copropriété / EDD", basePrice: 1500 },
  { id: "implantation", name: "Implantation", basePrice: 500 },
  { id: "autre", name: "Autre", basePrice: 0 },
];

const surfaceOptions = [
  { id: "small", label: "< 500 m²", multiplier: 1 },
  { id: "medium", label: "500 - 2000 m²", multiplier: 1.5 },
  { id: "large", label: "2000 - 5000 m²", multiplier: 2 },
  { id: "xlarge", label: "> 5000 m²", multiplier: 2.5 },
];

const urgencyOptions = [
  { id: "normal", label: "Normal (2-3 semaines)", multiplier: 1 },
  { id: "fast", label: "Rapide (1 semaine)", multiplier: 1.3 },
  { id: "urgent", label: "Urgent (< 1 semaine)", multiplier: 1.5 },
];

const Devis = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    service: "",
    surface: "",
    urgency: "normal",
    // Step 2
    address: "",
    city: "",
    postalCode: "",
    description: "",
    // Step 3
    name: "",
    email: "",
    phone: "",
    company: "",
    acceptTerms: false,
  });

  const calculateEstimate = () => {
    const service = services.find(s => s.id === formData.service);
    const surface = surfaceOptions.find(s => s.id === formData.surface);
    const urgency = urgencyOptions.find(u => u.id === formData.urgency);
    
    if (!service || !surface || !urgency) return null;
    
    const estimate = service.basePrice * surface.multiplier * urgency.multiplier;
    return {
      min: Math.round(estimate * 0.85),
      max: Math.round(estimate * 1.15),
    };
  };

  const estimate = calculateEstimate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Demande envoyée !",
      description: "Nous vous recontacterons sous 24h avec un devis personnalisé.",
    });
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const canProceed = () => {
    switch (step) {
      case 1: return formData.service && formData.surface;
      case 2: return formData.address && formData.city && formData.postalCode;
      case 3: return formData.name && formData.email && formData.acceptTerms;
      default: return true;
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 bg-muted geometric-pattern">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Demande de <span className="text-gradient">Devis</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Obtenez une estimation gratuite en quelques minutes. Devis détaillé sous 24h.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Progress */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                {[
                  { num: 1, icon: FileText, label: "Service" },
                  { num: 2, icon: MapPin, label: "Localisation" },
                  { num: 3, icon: User, label: "Coordonnées" },
                  { num: 4, icon: Calculator, label: "Récapitulatif" },
                ].map((s, i) => (
                  <div key={s.num} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        step >= s.num
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s.num ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                    </div>
                    {i < 3 && (
                      <div
                        className={`hidden sm:block w-24 lg:w-32 h-1 mx-2 rounded ${
                          step > s.num ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className={step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>Service</span>
                <span className={step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>Localisation</span>
                <span className={step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>Coordonnées</span>
                <span className={step >= 4 ? "text-primary font-medium" : "text-muted-foreground"}>Récapitulatif</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bg-card rounded-xl shadow-soft p-8">
                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                        Type de prestation
                      </h2>
                      <RadioGroup
                        value={formData.service}
                        onValueChange={(value) => setFormData({ ...formData, service: value })}
                        className="grid sm:grid-cols-2 gap-3"
                      >
                        {services.map((service) => (
                          <div key={service.id}>
                            <RadioGroupItem
                              value={service.id}
                              id={service.id}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={service.id}
                              className="flex items-center justify-between p-4 rounded-lg border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                            >
                              <span className="font-medium">{service.name}</span>
                              {service.basePrice > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  à partir de {service.basePrice}€
                                </span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                        Surface approximative
                      </h2>
                      <RadioGroup
                        value={formData.surface}
                        onValueChange={(value) => setFormData({ ...formData, surface: value })}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                      >
                        {surfaceOptions.map((opt) => (
                          <div key={opt.id}>
                            <RadioGroupItem
                              value={opt.id}
                              id={`surface-${opt.id}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`surface-${opt.id}`}
                              className="flex items-center justify-center p-4 rounded-lg border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50 text-center"
                            >
                              {opt.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                        Délai souhaité
                      </h2>
                      <RadioGroup
                        value={formData.urgency}
                        onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                        className="grid sm:grid-cols-3 gap-3"
                      >
                        {urgencyOptions.map((opt) => (
                          <div key={opt.id}>
                            <RadioGroupItem
                              value={opt.id}
                              id={`urgency-${opt.id}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`urgency-${opt.id}`}
                              className="flex items-center justify-center p-4 rounded-lg border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50 text-center"
                            >
                              {opt.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                      Localisation du terrain
                    </h2>
                    <div>
                      <Label htmlFor="address">Adresse *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="12 Rue de la Propriété"
                        className="mt-2"
                        required
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">Code postal *</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          placeholder="75001"
                          className="mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ville *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Paris"
                          className="mt-2"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description du projet (optionnel)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Décrivez votre projet, le contexte, vos besoins spécifiques..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                      Vos coordonnées
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Jean Dupont"
                          className="mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Société (optionnel)</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Ma Société SARL"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="jean@exemple.fr"
                          className="mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Téléphone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="06 12 34 56 78"
                          className="mt-2"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, acceptTerms: checked as boolean })
                        }
                      />
                      <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                        J'accepte que mes données soient utilisées pour me recontacter dans le cadre de cette demande de devis. *
                      </Label>
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                  <div className="space-y-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                      Récapitulatif de votre demande
                    </h2>
                    
                    {/* Estimate */}
                    {estimate && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-2">Estimation indicative</p>
                        <p className="font-serif text-3xl font-bold text-primary">
                          {estimate.min}€ - {estimate.max}€
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          * Estimation non contractuelle. Le devis définitif sera établi après étude de votre dossier.
                        </p>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium text-foreground">Prestation</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service</span>
                            <span className="font-medium">{services.find(s => s.id === formData.service)?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Surface</span>
                            <span className="font-medium">{surfaceOptions.find(s => s.id === formData.surface)?.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Délai</span>
                            <span className="font-medium">{urgencyOptions.find(u => u.id === formData.urgency)?.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-medium text-foreground">Localisation</h3>
                        <div className="text-sm">
                          <p>{formData.address}</p>
                          <p>{formData.postalCode} {formData.city}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h3 className="font-medium text-foreground mb-2">Contact</h3>
                      <div className="text-sm space-y-1">
                        <p>{formData.name} {formData.company && `(${formData.company})`}</p>
                        <p className="text-muted-foreground">{formData.email}</p>
                        <p className="text-muted-foreground">{formData.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4" />
                      Précédent
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {step < 4 ? (
                    <Button type="button" onClick={nextStep} disabled={!canProceed()}>
                      Suivant
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit">
                      Envoyer ma demande
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Devis;
