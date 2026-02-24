import { CheckCircle2, Award, Shield, Users, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  { icon: Award, text: "Plus de 25 ans d'expérience" },
  { icon: Shield, text: "Inscrit à l'Ordre des Géomètres" },
  { icon: Users, text: "Équipe de 12 professionnels" },
  { icon: Target, text: "Précision certifiée GPS/GNSS" },
  { icon: Clock, text: "Respect des délais garantis" },
  { icon: CheckCircle2, text: "Tarification transparente" },
];

const values = [
  {
    title: "Précision",
    description: "Des mesures exactes avec les dernières technologies GPS et stations totales.",
  },
  {
    title: "Neutralité",
    description: "Un regard impartial et objectif sur chaque situation foncière.",
  },
  {
    title: "Légalité",
    description: "Respect strict des procédures légales et réglementaires.",
  },
];

export function AboutSection() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image and stats */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <div className="aspect-[4/5] hero-gradient flex items-center justify-center">
                <div className="text-center text-primary-foreground p-8">
                  {/* Logo */}
                  <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-secondary/20 border-4 border-secondary flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-14 h-14 text-secondary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 2 22 22 22" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="14" x2="16" y2="14" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-3xl font-bold mb-2">GéoExpert</h3>
                  <p className="text-primary-foreground/80 mb-4">Cabinet de Géomètre-Expert</p>
                  <p className="text-secondary font-semibold">Depuis 1999</p>
                </div>
              </div>
            </div>

            {/* Floating stats cards */}
            <div className="absolute -bottom-6 -right-6 bg-card rounded-xl shadow-strong p-6 animate-float">
              <p className="text-4xl font-serif font-bold text-secondary">98%</p>
              <p className="text-sm text-muted-foreground">Clients satisfaits</p>
            </div>

            <div className="absolute -top-6 -left-6 bg-secondary rounded-xl shadow-gold p-6 text-secondary-foreground">
              <p className="text-4xl font-serif font-bold">2000+</p>
              <p className="text-sm">Projets réalisés</p>
            </div>

            {/* Decorative */}
            <div className="absolute -bottom-4 left-1/4 w-32 h-32 border-4 border-secondary/30 rounded-xl -z-10" />
          </div>

          {/* Right - Content */}
          <div>
            <span className="inline-block px-4 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 tracking-wider uppercase">
              Notre Cabinet
            </span>
            
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              L'Expertise au Service de{" "}
              <span className="text-gradient">Votre Foncier</span>
            </h2>
            
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Depuis plus de 25 ans, notre cabinet accompagne les particuliers, 
              promoteurs, notaires et collectivités dans tous leurs projets fonciers 
              et topographiques en Algérie.
            </p>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Notre équipe d'experts qualifiés met son savoir-faire et ses équipements 
              de pointe à votre service pour garantir des prestations de la plus haute qualité.
            </p>

            {/* Values */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {values.map((value) => (
                <div key={value.title} className="text-center p-4 bg-card rounded-xl shadow-soft">
                  <h4 className="font-serif font-bold text-foreground mb-1">{value.title}</h4>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>

            {/* Features grid */}
            <ul className="grid grid-cols-2 gap-3 mb-8">
              {features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 text-secondary" />
                  </div>
                  {feature.text}
                </li>
              ))}
            </ul>

            <div className="flex gap-4">
              <Button size="lg" className="hero-gradient text-primary-foreground" asChild>
                <Link to="/a-propos">Découvrir le Cabinet</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Nous Contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}