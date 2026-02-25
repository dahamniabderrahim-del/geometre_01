import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Qu'est-ce qu'un bornage et est-il obligatoire ?",
    answer:
      "Le bornage est une operation qui permet de definir et materialiser les limites exactes entre deux proprietes contigues. Il n'est pas obligatoire legalement, mais fortement recommande avant toute construction, vente ou travaux a proximite des limites. En cas de litige, seul un geometre-expert peut realiser un bornage ayant valeur legale.",
  },
  {
    question: "Combien coute une prestation de geometre-expert ?",
    answer:
      "Les tarifs varient selon la nature de la mission, la superficie du terrain et sa complexite. Un bornage simple peut couter entre 120000 DZD et 220000 DZD, une division parcellaire entre 180000 DZD et 450000 DZD. Nous analysons votre demande puis nous vous orientons vers la solution la plus adaptee.",
  },
  {
    question: "Quelle est la difference entre un geometre et un geometre-expert ?",
    answer:
      "Le geometre-expert est un professionnel liberal inscrit a l'Ordre des Geometres-Experts. Lui seul peut realiser des actes authentiques ayant valeur juridique : bornages, divisions, etats descriptifs de division en copropriete. Il est assermente et engage sa responsabilite personnelle.",
  },
  {
    question: "Quel delai pour obtenir un bornage ?",
    answer:
      "Le delai depend de plusieurs facteurs : disponibilite des proprietaires voisins, recherches documentaires necessaires, et complexite du dossier. En moyenne, comptez 2 a 4 semaines entre la prise de contact et la realisation du bornage sur le terrain.",
  },
  {
    question: "Puis-je diviser mon terrain pour le vendre en plusieurs lots ?",
    answer:
      "Oui, sous reserve de respecter les regles d'urbanisme locales (PLU, reglement de lotissement...). Nous analysons votre projet, verifions sa faisabilite, et realisons le document d'arpentage necessaire a la division. Ce document sera ensuite publie au service de la publicite fonciere.",
  },
  {
    question: "Qu'est-ce qu'un plan topographique ?",
    answer:
      "C'est un releve detaille de votre terrain montrant son relief (courbes de niveau), les constructions existantes, la vegetation, les reseaux... Il est indispensable pour tout projet de construction car il permet a l'architecte de concevoir un projet adapte a la realite du terrain.",
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
              Questions frequentes
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Vos questions, nos reponses
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              Retrouvez les reponses aux questions les plus courantes sur nos prestations.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl shadow-soft px-6 border-none"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-medium text-foreground hover:text-primary py-5 md:py-6 [&>svg]:h-5 [&>svg]:w-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base md:text-lg text-muted-foreground pb-5 md:pb-6 leading-relaxed">
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
