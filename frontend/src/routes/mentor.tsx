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

import { SiteHeader } from "@/components/site-chrome";
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 py-3 sm:px-6">
        {/* Header Title */}
        <div className="py-1.5 text-center shrink-0">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Your AI health mentor
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Ask anything about lab tests, results or symptoms in plain English or Urdu.
          </p>
        </div>

        {/* Chat Card Container */}
        <div className="mt-2 flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {/* Top Banner */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0 bg-card">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.62_0.12_178)] text-primary-foreground shadow-soft">
              <HeartPulse className="size-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-foreground">Sehat Mentor</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {busy ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin text-primary" /> Thinking…
                  </span>
                ) : (
                  <>
                    Online · English &amp; اردو <ShieldCheck className="size-3.5 text-primary" />
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.length === 0 && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void send(item)}
                    className="rounded-xl border border-border p-3.5 text-left text-xs sm:text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-secondary/40 cursor-pointer"
                  >
                    <Sparkles className="mb-1.5 size-4 text-primary" />
                    {item}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2.5 animate-fade-up",
                  message.role === "user" && "justify-end",
                )}
              >
                {message.role === "assistant" && (
                  <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                    <HeartPulse className="size-3.5" />
                  </span>
                )}
                <div
                  dir={/[\u0600-\u06FF]/.test(message.content) ? "rtl" : "ltr"}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap text-sm leading-6",
                    message.role === "user"
                      ? "rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground"
                      : "rounded-2xl border border-border bg-background px-4 py-2.5 text-foreground",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {busy && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Sehat Mentor is typing…</span>
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-urgent/20 bg-urgent-soft p-3 text-xs font-semibold text-urgent">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <div className="flex-1">
                  <p>{error.message}</p>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Fixed Bottom Input Bar */}
          <form onSubmit={submit} className="border-t border-border p-3 sm:p-4 shrink-0 bg-card relative z-50">
            <div className="flex items-center gap-2.5 relative z-50">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onInput={(event) => setInput((event.target as HTMLInputElement).value)}
                placeholder="Ask about a test, a value, or a symptom…"
                aria-label="Message the AI mentor"
                dir="auto"
                style={{ color: "#1D2624", backgroundColor: "#ffffff" }}
                className="h-12 flex-1 rounded-xl border-2 border-primary/30 px-4 text-base font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 relative z-50"
              />
              <Button
                type="submit"
                size="icon"
                className="size-12 shrink-0 rounded-xl cursor-pointer relative z-50"
                disabled={busy || !input.trim()}
                aria-label="Send message"
              >
                <ArrowUp className="size-5" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Educational guidance only — not a medical diagnosis.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
