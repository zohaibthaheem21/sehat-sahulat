import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Brain,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  Gauge,
  Languages,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import heroImage from "@/assets/sehat-clinic-hero.jpg";
import { UrgencyBadge, FlagDot, FlagPill, type Flag, type Urgency } from "@/components/badges";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReportResult = {
  extraction: {
    values: Array<{
      test_name: string;
      value: string;
      unit: string;
      reference_range: string;
      flag: Flag;
    }>;
    raw_notes: string | null;
  };
  interpretation: {
    items: Array<{
      test_name: string;
      explanation_en: string;
      explanation_ur: string;
      next_step: string;
    }>;
    disclaimer: string;
  };
  urgency: { urgency: Urgency; reasoning: string };
  scheduling: {
    chosen_slot: {
      doctor_name: string;
      specialty: string;
      date: string;
      time: string;
      hospital_type: "government" | "private";
    };
    reason: string;
  };
};

// Keep the browser pointing to the FastAPI backend at http://localhost:8000 by default,
// or use VITE_API_BASE_URL environment variable if defined.
const API_BASE = import.meta.env["VITE_API_BASE_URL"] || "";
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const steps = [
  "Reading report",
  "Preparing explanation",
  "Checking urgency",
  "Finding appointment",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sehat Sahulat | Understand Your Lab Report" },
      {
        name: "description",
        content:
          "Upload a lab report for clear English and Urdu guidance, urgency checks, and a suggested appointment.",
      },
      { property: "og:title", content: "Sehat Sahulat | Clear Lab Report Guidance" },
      {
        property: "og:description",
        content: "Understand your lab report in simple English and Urdu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const pipeline = [
  {
    icon: ScanLine,
    title: "Reads your report",
    body: "Every test name, value, unit and reference range is pulled from the photo and flagged normal, high or low.",
  },
  {
    icon: Brain,
    title: "Explains it simply",
    body: "Each result is rewritten in everyday English and Urdu, with a practical next step for you.",
  },
  {
    icon: Gauge,
    title: "Rates the urgency",
    body: "Routine, Needs Attention or Urgent — with the reasoning behind the rating in one short line.",
  },
  {
    icon: CalendarCheck,
    title: "Suggests care",
    body: "A realistic appointment with the right specialist, at a government or private hospital.",
  },
];

const benefits = [
  {
    icon: ScanLine,
    title: "Understand every value",
    body: "Your numbers translated into plain language — no jargon, and no unnecessary panic.",
  },
  {
    icon: Languages,
    title: "Bilingual, always",
    body: "Every explanation is written in simple English and Urdu at the same time.",
  },
  {
    icon: Gauge,
    title: "Know how urgent",
    body: "A clear Routine, Needs Attention or Urgent rating, with the reasoning explained.",
  },
  {
    icon: MessageCircle,
    title: "A mentor on call",
    body: "Follow-up questions answered any time by the AI health mentor.",
  },
];

function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "results">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => {
    if (status !== "loading") return;
    const timer = window.setInterval(
      () => setStep((current) => Math.min(current + 1, steps.length - 1)),
      3200,
    );
    return () => window.clearInterval(timer);
  }, [status]);

  const chooseFile = useCallback(
    (next: File) => {
      setError("");
      if (!acceptedTypes.includes(next.type)) {
        setError("Please upload a JPEG, PNG, or WEBP image");
        return;
      }
      if (next.size > 12 * 1024 * 1024) {
        setError("Please choose an image smaller than 12 MB");
        return;
      }
      if (preview) URL.revokeObjectURL(preview);
      setFile(next);
      setPreview(URL.createObjectURL(next));
      setResult(null);
      setStatus("idle");
    },
    [preview],
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setPreview("");
    setError("");
  }, []);

  const analyze = async () => {
    if (!file) return;
    setError("");
    setStatus("loading");
    setStep(0);
    const data = new FormData();
    data.append("file", file);
    try {
      const response = await fetch(`${API_BASE}/api/process`, { method: "POST", body: data });
      if (!response.ok) {
        if (response.status === 400) throw new Error("Please upload a JPEG, PNG, or WEBP image");
        if (response.status === 422)
          throw new Error("Could not read this report clearly. Please try a clearer photo.");
        throw new Error("Something went wrong processing your report. Please try again.");
      }
      setResult((await response.json()) as ReportResult);
      setStatus("results");
      window.setTimeout(
        () => document.querySelector("#results")?.scrollIntoView({ behavior: "smooth" }),
        60,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong processing your report. Please try again.",
      );
      setStatus("idle");
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <SiteHeader floating />

      <Hero />

      <TrustStrip />

      <HowItWorks />

      <WhySection />

      <section
        id="upload"
        className="scroll-mt-20 border-t border-border bg-gradient-to-b from-background to-card/60 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-5xl px-5">
          <SectionHeading
            eyebrow="Your report, simplified"
            title="Start with a clear photo"
            subtitle="Use a well-lit image where every test name and value is easy to read. JPEG, PNG or WEBP, up to 12 MB."
          />
          <Reveal className="mt-10">
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-card sm:p-8">
              {status === "loading" ? (
                <LoadingState activeStep={step} preview={preview} />
              ) : (
                <div>
                  <UploadDropzone
                    file={file}
                    preview={preview}
                    error={error}
                    onFile={chooseFile}
                    onRemove={removeFile}
                  />
                  <div className="mt-6 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="size-4 text-primary" /> Securely processed. Never
                      shared.
                    </p>
                    <Button
                      size="lg"
                      disabled={!file}
                      onClick={analyze}
                      className="w-full sm:w-auto"
                    >
                      Analyze report <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {status === "results" && result && (
        <Results
          result={result}
          onReset={() => {
            removeFile();
            setResult(null);
            setStatus("idle");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[30rem] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-40 size-96 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-low/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="max-w-2xl animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Healthcare, made understandable
          </p>

          <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.1rem]">
            Your health.
            <br />
            <span className="text-gradient">Clearly explained.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Upload a photo of your lab report and get a calm, simple explanation in English and Urdu
            — plus an urgency check and a clear next step.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <a href="#upload">
                <UploadCloud className="size-5" /> Analyze my report
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-semibold text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" aria-hidden /> Private by design
            </li>
            <li className="flex items-center gap-2">
              <Languages className="size-5 text-primary" aria-hidden /> English + Urdu
            </li>
            <li className="flex items-center gap-2">
              <Stethoscope className="size-5 text-primary" aria-hidden /> Doctor-friendly guidance
            </li>
          </ul>
        </div>

        <div className="relative lg:pl-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 size-56 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-6 size-48 rounded-full bg-accent/25 blur-3xl"
          />

          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lifted">
            <img
              src={heroImage}
              alt="A doctor warmly explaining a lab report to a patient"
              width={1600}
              height={1100}
              fetchPriority="high"
              className="aspect-[4/3] size-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-hero/70 via-hero/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-5 text-primary-foreground">
              <p className="text-sm font-semibold">Report review session</p>
              <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold backdrop-blur">
                Live · Karachi
              </span>
            </div>
          </div>

          <article className="absolute -left-3 top-8 hidden w-60 rounded-2xl border border-border bg-card/95 p-4 shadow-lifted backdrop-blur-lg lg:block animate-float-slow">
            <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Sample extraction
            </p>
            <div className="mt-3 divide-y divide-border">
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="truncate text-sm font-semibold">Hemoglobin</span>
                <FlagPill flag="low" />
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="truncate text-sm font-semibold">Vitamin D</span>
                <FlagPill flag="high" />
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="truncate text-sm font-semibold">Creatinine</span>
                <FlagPill flag="normal" />
              </div>
            </div>
          </article>

          <div
            className="absolute -right-2 bottom-10 hidden items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lifted backdrop-blur-lg lg:flex animate-float-slow"
            style={{ animationDelay: "1.4s" }}
          >
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-attention opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-attention" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">Ready in ~30 seconds</p>
              <p className="text-xs text-muted-foreground">4 AI agents · English + اردو</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const stats = [
    { icon: Bot, value: "4", label: "AI agents working together" },
    { icon: Languages, value: "2", label: "Languages, side by side" },
    { icon: Clock3, value: "~30s", label: "From photo to guidance" },
    { icon: MessageCircle, value: "24/7", label: "AI mentor, always on call" },
  ];
  return (
    <section className="bg-hero text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-foreground/10">
                <stat.icon className="size-5 text-accent" aria-hidden />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold leading-none text-accent">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Made for real people"
            title={
              <>
                Less medical jargon.
                <br />
                More peace of mind.
              </>
            }
            subtitle="A report can feel overwhelming. Sehat Sahulat turns complex values into clear guidance, while helping you understand when — and where — to seek care."
          />
        </Reveal>

        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pipeline.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <article className="group relative h-full rounded-3xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lifted">
                  <div className="flex items-start justify-between">
                    <span className="relative z-10 grid size-14 place-items-center rounded-2xl border border-border bg-background text-primary shadow-soft transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="size-6" aria-hidden />
                    </span>
                    <span className="font-display text-sm font-bold text-muted-foreground/60 transition-colors group-hover:text-primary/70">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-12 text-center">
          <Button variant="secondary" size="lg" asChild>
            <Link to="/how-it-works">
              See the full process <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="border-y border-border bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Why people use Sehat Sahulat"
            title="Peace of mind, one report at a time"
            subtitle="Built for patients who want clear answers — not more confusion."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} delay={index * 80}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-border bg-background p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted">
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 blur-2xl transition-transform duration-300 group-hover:scale-150"
                />
                <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <benefit.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoadingState({ activeStep, preview }: { activeStep: number; preview: string }) {
  const progress = ((activeStep + 1) / steps.length) * 100;
  return (
    <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-muted">
        <img
          src={preview}
          alt="Your lab report being analyzed"
          className="size-full object-contain p-10 opacity-80"
        />
        <div className="pointer-events-none absolute inset-x-10 top-5 h-px bg-primary shadow-[0_0_18px_var(--primary)] animate-scan" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-hero/85 px-3 py-1.5 text-xs font-bold text-primary-foreground backdrop-blur">
          <span className="size-2 animate-pulse rounded-full bg-accent" /> 4 AI agents working
        </div>
      </div>
      <div className="flex flex-col justify-center p-7 sm:p-10" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Analysis in progress
        </p>
        <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          We’re reading your report
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This usually takes 10–30 seconds. Please keep this page open.
        </p>

        <div className="mt-8 space-y-5" role="list" aria-label="Analysis steps">
          {steps.map((label, index) => (
            <div
              key={label}
              role="listitem"
              className={cn(
                "flex items-center gap-4 transition-opacity duration-300",
                index > activeStep ? "opacity-35" : "opacity-100",
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-300",
                  index < activeStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === activeStep
                      ? "border-primary bg-secondary text-primary"
                      : "border-border text-muted-foreground",
                )}
              >
                {index < activeStep ? (
                  <Check className="size-4" />
                ) : (
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      index === activeStep && "animate-pulse bg-primary",
                    )}
                  />
                )}
              </span>
              <span className="text-sm font-semibold">
                {label}
                {index === activeStep ? "…" : ""}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Step {activeStep + 1} of {steps.length} — {steps[activeStep]}
          </p>
        </div>
      </div>
    </div>
  );
}

function Results({ result, onReset }: { result: ReportResult; onReset: () => void }) {
  const [language, setLanguage] = useState<"en" | "ur">("en");
  const urgency = result.urgency.urgency;
  const slot = result.scheduling.chosen_slot;
  const values = result.extraction.values;
  const abnormal = values.filter((item) => item.flag === "high" || item.flag === "low").length;

  return (
    <section
      id="results"
      className="scroll-mt-16 border-t border-border bg-background py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <CheckCircle2 className="size-4" aria-hidden /> Analysis complete
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Your report, explained
              </h2>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {values.length} tests found
                {abnormal > 0 ? ` · ${abnormal} flagged for attention` : " · all within range"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <UrgencyBadge urgency={urgency} />
              <Button variant="secondary" onClick={onReset}>
                <RotateCcw className="size-4" /> Analyze another
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <Reveal>
              <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
                    <FileCheck2 className="size-5 text-primary" aria-hidden /> Extracted values
                  </h3>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                    {values.length} tests
                  </span>
                </div>
                <div className="mt-4 divide-y divide-border">
                  {values.map((item) => (
                    <div
                      key={`${item.test_name}-${item.value}`}
                      className={cn(
                        "grid gap-2 py-5 sm:grid-cols-[1.5fr_1fr_auto] sm:items-center sm:gap-6",
                        item.flag === "high" && "-mx-3 rounded-2xl bg-attention-soft/40 px-3",
                        item.flag === "low" && "-mx-3 rounded-2xl bg-low-soft/40 px-3",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FlagDot flag={item.flag} />
                        <span className="truncate font-semibold">{item.test_name}</span>
                      </div>
                      <p className="text-lg font-bold sm:text-right">
                        {item.value}{" "}
                        <span className="text-xs font-medium text-muted-foreground">
                          {item.unit}
                        </span>
                      </p>
                      <div className="flex items-center gap-3 sm:justify-end">
                        <FlagPill flag={item.flag} />
                        <p className="text-xs text-muted-foreground">
                          Range {item.reference_range}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>

            <Reveal delay={80}>
              <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="font-display text-xl font-semibold tracking-tight">
                    What this means
                  </h3>
                  <div
                    role="group"
                    aria-label="Explanation language"
                    className="flex rounded-full bg-muted p-1"
                  >
                    <button
                      type="button"
                      aria-pressed={language === "en"}
                      onClick={() => setLanguage("en")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                        language === "en"
                          ? "bg-card text-foreground shadow-soft"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Languages className="size-4" aria-hidden /> English
                    </button>
                    <button
                      type="button"
                      aria-pressed={language === "ur"}
                      onClick={() => setLanguage("ur")}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                        language === "ur"
                          ? "bg-card text-foreground shadow-soft"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      اردو
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  {result.interpretation.items.map((item, index) => (
                    <article
                      key={item.test_name}
                      className="relative border-l-2 border-primary/50 pl-5"
                    >
                      <span
                        aria-hidden
                        className="absolute -left-[7px] top-1.5 size-2.5 rounded-full bg-primary"
                      />
                      <h4 className="font-display font-semibold tracking-tight">
                        {index + 1}. {item.test_name}
                      </h4>
                      <p
                        dir={language === "ur" ? "rtl" : "ltr"}
                        lang={language === "ur" ? "ur" : "en"}
                        className="mt-2 text-sm leading-7 text-muted-foreground"
                      >
                        {language === "en" ? item.explanation_en : item.explanation_ur}
                      </p>
                      <p className="mt-3 inline-flex items-start gap-2 rounded-xl bg-secondary px-3 py-2 text-sm">
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span>
                          <strong>Next step:</strong> {item.next_step}
                        </span>
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </Reveal>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <Reveal delay={40}>
              <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    Urgency check
                  </h3>
                  <UrgencyBadge urgency={urgency} size="sm" />
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {result.urgency.reasoning}
                </p>
              </section>
            </Reveal>

            <Reveal delay={80}>
              <section className="relative overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground shadow-lifted sm:p-7">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/25 blur-3xl"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-20 -left-10 size-52 rounded-full bg-accent/20 blur-3xl"
                />

                <p className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
                  <CalendarCheck className="size-4 text-accent" aria-hidden /> Suggested appointment
                </p>
                <div className="relative mt-5 flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-foreground/10">
                    <Stethoscope className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      {slot.doctor_name}
                    </h3>
                    <p className="text-sm text-primary-foreground/65">{slot.specialty}</p>
                  </div>
                </div>
                <dl className="relative mt-6 space-y-3 border-t border-primary-foreground/15 pt-5 text-sm">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="size-4 text-accent" aria-hidden />
                    <span>
                      {new Date(`${slot.date}T00:00:00`).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock3 className="size-4 text-accent" aria-hidden />
                    <span>{slot.time}</span>
                  </div>
                  <div className="flex items-center gap-3 capitalize">
                    <MapPin className="size-4 text-accent" aria-hidden />
                    <span>{slot.hospital_type} hospital</span>
                  </div>
                </dl>
                <p className="relative mt-5 rounded-2xl bg-primary-foreground/5 px-4 py-3 text-xs leading-5 text-primary-foreground/70">
                  {result.scheduling.reason}
                </p>

                <AppointmentForm />
              </section>
            </Reveal>
          </div>
        </div>

        <Reveal className="mt-8">
          <div className="flex items-start gap-3 rounded-3xl border border-attention/25 bg-attention-soft p-5 text-sm leading-6 text-foreground">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-attention" aria-hidden />
            <p>
              <strong>Medical disclaimer.</strong>{" "}
              {result.interpretation.disclaimer ||
                "This is not a medical diagnosis. Please consult a doctor for confirmation."}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function AppointmentForm() {
  const [sent, setSent] = useState(false);
  const inputClasses =
    "h-11 w-full rounded-xl border border-primary-foreground/20 bg-hero px-3 pl-10 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/40 focus:border-accent/70 focus:ring-2 focus:ring-accent/25";

  if (sent) {
    return (
      <div className="relative mt-6 rounded-2xl border border-routine/30 bg-primary-foreground/10 p-6 text-center animate-fade-in">
        <CheckCircle2 className="mx-auto size-8 text-accent" aria-hidden />
        <h3 className="mt-3 font-display text-lg font-semibold tracking-tight">Request received</h3>
        <p className="mt-2 text-sm text-primary-foreground/70">
          The care team will contact you shortly.
        </p>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };
  return (
    <form
      onSubmit={submit}
      className="relative mt-6 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-5"
    >
      <h3 className="font-display text-lg font-semibold tracking-tight">
        Request this appointment
      </h3>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-primary-foreground/70">
            Full name
          </span>
          <span className="relative block">
            <UserRound
              className="absolute left-3 top-3.5 size-4 text-primary-foreground/50"
              aria-hidden
            />
            <input
              required
              aria-label="Full name"
              placeholder="Your full name"
              className={inputClasses}
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-primary-foreground/70">
            Phone number
          </span>
          <span className="relative block">
            <Phone
              className="absolute left-3 top-3.5 size-4 text-primary-foreground/50"
              aria-hidden
            />
            <input
              required
              type="tel"
              aria-label="Phone number"
              placeholder="03XX-XXXXXXX"
              className={inputClasses}
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-primary-foreground/70">
            Preferred day
          </span>
          <span className="relative block">
            <CalendarDays
              className="absolute left-3 top-3.5 size-4 text-primary-foreground/50"
              aria-hidden
            />
            <select
              aria-label="Preferred day"
              className="h-11 w-full appearance-none rounded-xl border border-primary-foreground/20 bg-hero px-3 pl-10 pr-9 text-sm text-primary-foreground outline-none focus:border-accent/70"
            >
              <option className="bg-hero">Tomorrow</option>
              <option className="bg-hero">This week</option>
              <option className="bg-hero">Next week</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-3.5 size-4 text-primary-foreground/50"
              aria-hidden
            />
          </span>
        </label>
      </div>
      <Button
        type="submit"
        className="mt-4 w-full bg-accent text-accent-foreground shadow-soft hover:bg-accent/90 hover:-translate-y-0.5"
      >
        Send request <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
