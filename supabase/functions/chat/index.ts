import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de GeoExpert, un cabinet de geometre-expert agree base en Algerie.

Ton role est d'aider les visiteurs du site en repondant a leurs questions sur :
- Les services proposes : bornage, division parcellaire, copropriete, topographie, implantation, expertise fonciere
- Les procedures foncieres et cadastrales en Algerie
- Les delais et etapes d'un projet de geometre
- La prise de rendez-vous et les demandes de devis

Regles :
- Reponds toujours en francais
- Sois professionnel, courtois et concis
- Si tu ne connais pas la reponse exacte, oriente le visiteur vers un contact direct
- Ne donne jamais de prix precis, invite plutot a demander un devis gratuit
- Mentionne que GeoExpert est disponible du lundi au vendredi de 9h a 18h et le samedi de 9h a 12h`;

type ChatMessage = {
  role?: string;
  content?: string;
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const buildFallbackReply = (userText: string) => {
  const normalized = userText.trim().toLowerCase();

  if (!normalized) {
    return "Bonjour. Je peux vous aider pour le bornage, la topographie, la copropriete et les demarches foncieres. Vous pouvez aussi demander un devis gratuit.";
  }

  if (normalized.includes("devis") || normalized.includes("prix") || normalized.includes("tarif")) {
    return "Pour un tarif precis, merci de demander un devis gratuit via le formulaire. Le montant depend du type de mission et de la localisation.";
  }

  if (normalized.includes("bornage")) {
    return "Le bornage permet de fixer officiellement les limites d'un terrain. Nous pouvons vous accompagner de la preparation du dossier jusqu'au plan final.";
  }

  if (normalized.includes("contact") || normalized.includes("telephone") || normalized.includes("rendez")) {
    return "Vous pouvez nous contacter via la page Contact ou demander un devis en ligne. Horaires: lundi-vendredi 9h-18h, samedi 9h-12h.";
  }

  return "Merci pour votre message. Je peux vous aider sur les services de geometre-expert, les demarches foncieres et la preparation de votre demande de devis.";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawMessages = Array.isArray(body?.messages) ? (body.messages as ChatMessage[]) : [];
    const messages = rawMessages
      .filter((message) => typeof message?.role === "string" && typeof message?.content === "string")
      .map((message) => ({ role: message.role as string, content: message.content as string }));

    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return jsonResponse({
        choices: [
          {
            message: {
              role: "assistant",
              content: buildFallbackReply(lastUserMessage),
            },
          },
        ],
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error("AI gateway error:", response.status, details);

      if (response.status === 429) {
        return jsonResponse({ error: "Trop de requetes, veuillez reessayer plus tard." }, 429);
      }

      if (response.status === 402) {
        return jsonResponse({ error: "Service temporairement indisponible." }, 402);
      }

      return jsonResponse({ error: "Erreur du service IA" }, 500);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("chat error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
