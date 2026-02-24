import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || "Une erreur est survenue.");
    return;
  }

  if (!resp.body) {
    onError("Pas de réponse du serveur.");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") break;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: newMessages,
      onDelta: upsert,
      onDone: () => setLoading(false),
      onError: (msg) => {
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
        setLoading(false);
      },
    });
  }, [input, loading, messages]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full hero-gradient shadow-strong flex items-center justify-center text-secondary hover:scale-110 transition-transform"
          aria-label="Ouvrir le chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-3rem)] bg-card border border-border rounded-2xl shadow-strong flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="hero-gradient px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-secondary" />
              <span className="font-serif font-bold text-primary-foreground text-sm">
                Assistant GéoExpert
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot className="w-10 h-10 mx-auto mb-3 text-secondary/60" />
                <p className="font-medium">Bonjour ! 👋</p>
                <p className="mt-1">Comment puis-je vous aider ?</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-secondary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-secondary text-secondary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-secondary" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground animate-pulse">
                  En train de réfléchir...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-secondary/50 text-foreground placeholder:text-muted-foreground"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-lg hero-gradient flex items-center justify-center text-secondary disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
