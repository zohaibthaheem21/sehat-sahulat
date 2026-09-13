import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUp,
  CircleAlert,
  HeartPulse,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const API_BASE = import.meta.env["VITE_API_BASE_URL"] || "";

const suggestions = [
  "What does high HbA1c mean?",
  "میرا ہیموگلوبن کم ہے، کیا کروں؟",
  "Explain my cholesterol report simply",
  "Which doctor should I see for thyroid tests?",
];

export const Route = createFileRoute("/mentor")({
  head: () => ({
    meta: [
      { title: "AI Health Mentor | Sehat Sahulat" },
      {
        name: "description",
        content:
          "Ask the Sehat Sahulat AI mentor about lab tests, results and next steps in simple English or Urdu.",
      },
      { property: "og:title", content: "AI Health Mentor | Sehat Sahulat" },
      {
        property: "og:description",
        content: "Understand any lab test in plain English or Urdu, instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MentorPage,
});

function MentorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; retryQuestion?: string } | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 && chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const send = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setBusy(true);

    try {
      const response = await fetch(`${API_BASE}/api/mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      let replyText = "";
      try {
        const data = (await response.json()) as { reply?: string; detail?: string; error?: string };
        replyText = data.reply || data.detail || data.error || "";
      } catch {
        replyText = "";
      }

      if (!response.ok || !replyText) {
        throw new Error(replyText || "The AI mentor could not respond right now. Please check back shortly.");
      }

      setMessages((current) => [...current, { role: "assistant", content: replyText }]);
    } catch (caught) {
      setError({
        message: caught instanceof Error ? caught.message : "Something went wrong. Please try again.",
        retryQuestion: text,
      });
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const retry = () => {
    if (error?.retryQuestion) void send(error.retryQuestion);
  };

  const hasUrdu = /[\u0600-\u06FF]/.test(input);
  const dir = hasUrdu ? "rtl" : "ltr";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-28 pb-16 sm:px-6 sm:pt-32">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <span className="size-2 rounded-full bg-primary animate-pulse" aria-hidden />
            Always-on guidance
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your AI Health Mentor
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ask anything about lab tests, results or symptoms in plain English or Urdu.
          </p>
        </div>

        <div className="flex min-h-[500px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
          {/* Card Top Header */}
          <div className="flex items-center gap-3 border-b border-border bg-card/50 px-6 py-4 backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow">
              <HeartPulse className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-display font-semibold text-foreground">Sehat Mentor</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                {busy ? (
                  <span className="flex items-center gap-1.5 text-primary font-medium">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Thinking…
                  </span>
                ) : (
                  <>
                    Online · English & اردو{" "}
                    <ShieldCheck className="size-3.5 text-primary" aria-hidden />
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Chat Messages Container */}
          <div ref={chatBoxRef} className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6 max-h-[460px]">
            {messages.length === 0 && (
              <div className="grid gap-3 sm:grid-cols-2" role="list">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void send(item)}
                    className="rounded-2xl border border-border bg-background p-4 text-left text-sm font-medium text-foreground transition-all hover:border-primary/60 hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
                  >
                    <Sparkles className="mb-2 size-4 text-primary" aria-hidden />
                    {item}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn("flex gap-3", message.role === "user" && "justify-end")}
              >
                {message.role === "assistant" && (
                  <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                    <HeartPulse className="size-4" aria-hidden />
                  </span>
                )}
                <div
                  dir={/[\u0600-\u06FF]/.test(message.content) ? "rtl" : "ltr"}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground shadow-sm",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
                <span>Sehat Mentor is analyzing your question…</span>
              </p>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-urgent/30 bg-urgent-soft p-4 text-sm font-medium text-urgent">
                <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div className="flex-1">
                  <p>{error.message}</p>
                  {error.retryQuestion && (
                    <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={retry}>
                      <ArrowUp className="mr-1 size-3.5" /> Try again
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Input Area */}
          <form onSubmit={submit} className="border-t border-border bg-card p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                id="mentor-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a test, a value, or a symptom…"
                aria-label="Message the AI mentor"
                dir={dir}
                disabled={busy}
                className="h-12 flex-1 rounded-2xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <Button
                type="submit"
                size="icon"
                className="size-12 shrink-0 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow"
                disabled={busy || !input.trim()}
                aria-label="Send message"
              >
                <ArrowUp className="size-5" />
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden />
              Educational guidance only — not a medical diagnosis.
            </p>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
