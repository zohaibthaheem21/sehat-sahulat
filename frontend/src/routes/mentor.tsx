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

import { Reveal } from "@/components/reveal";
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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, busy]);

  const send = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply)
        throw new Error(data.error || "The mentor could not answer right now.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply as string }]);
    } catch (caught) {
      setError({
        message:
          caught instanceof Error ? caught.message : "Something went wrong. Please try again.",
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pt-20 pb-12 sm:pt-24">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary backdrop-blur">
              <span className="size-2 rounded-full bg-primary animate-pulse" aria-hidden />
              Always-on guidance
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Your AI health mentor
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Ask anything about lab tests, results or symptoms. Answers come back in plain English
              or Urdu — never as a diagnosis.
            </p>
          </div>
        </Reveal>

        <Reveal delay={40}>
          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.62_0.12_178)] text-primary-foreground shadow-soft">
                <HeartPulse className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display font-semibold">Sehat Mentor</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  {busy ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
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

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {messages.length === 0 && (
                <div
                  className="grid gap-3 sm:grid-cols-2"
                  role="list"
                  aria-label="Suggested questions"
                >
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="listitem"
                      onClick={() => void send(item)}
                      className="rounded-2xl border border-border p-4 text-left text-sm font-medium transition-colors hover:border-primary/50 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
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
                  className={cn(
                    "flex gap-3 animate-fade-up",
                    message.role === "user" && "justify-end",
                  )}
                >
                  {message.role === "assistant" && (
                    <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                      <HeartPulse className="size-4" aria-hidden />
                    </span>
                  )}
                  <div
                    dir={/[\u0600-\u06FF]/.test(message.content) ? "rtl" : "ltr"}
                    lang={/[\u0600-\u06FF]/.test(message.content) ? "ur" : "en"}
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap text-sm leading-7",
                      message.role === "user"
                        ? "rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
                        : "rounded-2xl border border-border bg-background px-4 py-3 text-foreground",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {busy && (
                <p
                  className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
                  <span>Sehat Mentor is thinking…</span>
                </p>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-urgent/20 bg-urgent-soft p-4 text-sm font-semibold text-urgent animate-fade-in"
                >
                  <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p>{error.message}</p>
                    {error.retryQuestion && (
                      <Button size="sm" variant="ghost" className="mt-2" onClick={retry}>
                        <ArrowUp className="size-3.5" aria-hidden /> Try again
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <form onSubmit={submit} className="border-t border-border p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about a test, a value, or a symptom…"
                  aria-label="Message the AI mentor"
                  dir="auto"
                  className="h-12 flex-1 rounded-2xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-12 shrink-0 rounded-2xl cursor-pointer"
                  disabled={busy || !input.trim()}
                  aria-label="Send message"
                >
                  <ArrowUp className="size-5" />
                </Button>
              </div>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" aria-hidden />
                Educational guidance only — not a medical diagnosis.
              </p>
            </form>
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
