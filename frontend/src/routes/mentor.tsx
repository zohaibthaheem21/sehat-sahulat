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
  const [inputVal, setInputVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; retryQuestion?: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setInputVal("");
    setError(null);
    setBusy(true);

    try {
      const response = await fetch(`${API_BASE}/api/mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const textBody = await response.text();
      let data: { reply?: string; error?: string; detail?: string } = {};
      try {
        data = JSON.parse(textBody);
      } catch {
        throw new Error(
          response.ok
            ? "Invalid server response format."
            : `Server returned error (${response.status}). Please check API key configuration.`
        );
      }

      if (!response.ok || !data.reply) {
        throw new Error(data.reply || data.error || data.detail || "The mentor could not answer right now.");
      }

      setMessages((current) => [...current, { role: "assistant", content: data.reply as string }]);
    } catch (caught) {
      setError({
        message:
          caught instanceof Error ? caught.message : "Something went wrong. Please try again.",
        retryQuestion: text,
      });
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!inputVal.trim() || busy) return;
    void send(inputVal);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col min-h-0 overflow-hidden px-4 py-3 sm:px-6">
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
        <div className="mt-2 flex flex-1 flex-col min-h-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
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
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
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
          <form onSubmit={submit} className="relative z-20 border-t border-border p-3 sm:p-4 shrink-0 bg-card">
            <div className="flex items-center gap-2.5">
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inputVal.trim() && !busy) send(inputVal);
                  }
                }}
                placeholder="Ask about a test, a value, or a symptom…"
                aria-label="Message the AI mentor"
                autoComplete="off"
                disabled={busy}
                style={{
                  color: "#0f172a",
                  backgroundColor: "#ffffff",
                  caretColor: "#0d9488",
                  opacity: 1,
                  pointerEvents: "auto",
                  WebkitUserSelect: "text",
                  userSelect: "text",
                  fontSize: "16px",
                }}
                className="h-12 flex-1 rounded-xl border-2 border-primary/60 px-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <Button
                type="submit"
                size="icon"
                className="size-12 shrink-0 rounded-xl cursor-pointer"
                disabled={busy || !inputVal.trim()}
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

