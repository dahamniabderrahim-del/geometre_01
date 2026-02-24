import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Qu'est-ce qu'un bornage et est-il obligatoire ?",
    answer: "Le bornage est une opération qui permet de définir et matérialiser les limites exactes entre deux propriétés contiguës. Il n'est pas obligatoire légalement, mais fortement recommandé avant toute construction, vente ou travaux à proximité des limites. En cas de litige, seul un géomètre-expert peut réaliser un bornage ayant valeur légale.",
  },
  {
    question: "Combien coûte une prestation de géomètre-expert ?",
    answer: "Les tarifs varient selon la nature de la mission, la superficie du terrain et sa complexité. Un bornage simple peut coûter entre 800€ et 1500€, une division parcellaire entre 1200€ et 3000€. Nous établissons systématiquement un devis gratuit et détaillé avant toute intervention.",
  },
  {
    question: "Quelle est la différence entre un géomètre et un géomètre-expert ?",
    answer: "Le géomètre-expert est un professionnel libéral inscrit à l'Ordre des Géomètres-Experts. Lui seul peut réaliser des actes authentiques ayant valeur juridique : bornages, divisions, états descriptifs de division en copropriété. Il est assermenté et engage sa responsabilité personnelle.",
  },
  {
    question: "Quel délai pour obtenir un bornage ?",
    answer: "Le délai dépend de plusieurs facteurs : disponibilité des propriétaires voisins, recherches documentaires nécessaires, et complexité du dossier. En moyenne, comptez 2 à 4 semaines entre la prise de contact et la réalisation du bornage sur le terrain.",
  },
  {
    question: "Puis-je diviser mon terrain pour le vendre en plusieurs lots ?",
    answer: "Oui, sous réserve de respecter les règles d'urbanisme locales (PLU, règlement de lotissement...). Nous analysons votre projet, vérifions sa faisabilité, et réalisons le document d'arpentage nécessaire à la division. Ce document sera ensuite publié au service de la publicité foncière.",
  },
  {
    question: "Qu'est-ce qu'un plan topographique ?",
    answer: "C'est un relevé détaillé de votre terrain montrant son relief (courbes de niveau), les constructions existantes, la végétation, les réseaux... Il est indispensable pour tout projet de construction car il permet à l'architecte de concevoir un projet adapté à la réalité du terrain.",
  },
];

export function FAQSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              Questions fréquentes
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Vos questions, nos réponses
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Retrouvez les réponses aux questions les plus courantes sur nos prestations.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl shadow-soft px-6 border-none"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
