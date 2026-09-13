import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowRight,
  HeartPulse,
  Languages,
  Menu,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home", exact: true },
  { to: "/how-it-works", label: "How it works" },
  { to: "/mentor", label: "AI mentor" },
] as const;

function useActiveRoute() {
  const { pathname } = useLocation();
  return (to: string, exact = false) => (exact ? pathname === to : pathname === to);
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/" aria-label="Sehat Sahulat — home" className="group flex items-center gap-2.5">
      <span
        className={cn(
          "grid place-items-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.62_0.12_178)] text-primary-foreground shadow-soft transition-transform duration-300 group-hover:scale-105",
          compact ? "size-9" : "size-10",
        )}
      >
        <HeartPulse className={compact ? "size-5" : "size-5"} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight">Sehat Sahulat</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Clear health insights
        </span>
      </span>
    </a>
  );
}

export function SiteHeader({ floating = false }: { floating?: boolean }) {
  const isActive = useActiveRoute();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/85 shadow-soft backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] lg:px-8">
        <Brand />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={link.to}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive(link.to, "exact" in link && link.exact)
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/75 hover:bg-secondary hover:text-foreground",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground xl:flex">
            <ShieldCheck className="size-4 text-primary" /> Private &amp; secure
          </span>
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/" hash="upload">
              Analyze report <ArrowRight className="size-4" />
            </Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
            className="grid size-10 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-secondary lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-b border-border bg-background/95 shadow-soft backdrop-blur-xl lg:hidden animate-fade-in"
        >
          <nav aria-label="Mobile" className="space-y-1 px-5 pb-6 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={cn(
                  "block rounded-2xl px-4 py-3.5 text-base font-semibold transition-colors",
                  isActive(link.to, "exact" in link && link.exact)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Button className="mt-3 w-full" asChild onClick={closeMenu}>
              <Link to="/" hash="upload">
                Analyze my report <ArrowRight className="size-4" />
              </Link>
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" /> Private by design · English + اردو
            </p>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="max-w-sm space-y-4">
            <Brand />
            <p className="text-sm leading-6 text-muted-foreground">
              Lab reports translated into plain English and Urdu, with an urgency check and a care
              suggestion you can actually use.
            </p>
            <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Languages className="size-4 text-primary" /> Made for Pakistan · English + اردو
            </p>
          </div>

          <nav aria-label="Explore">
            <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  to="/"
                  hash="upload"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Analyze a report
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  to="/mentor"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  AI health mentor
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground">
              Get help
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="size-4 text-primary" />
                <Link to="/mentor" className="transition-colors hover:text-primary">
                  Ask the AI mentor
                </Link>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <Link to="/how-it-works" className="transition-colors hover:text-primary">
                  Privacy &amp; process
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground">
              Keep in mind
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Your report is processed securely and never shared. Sehat Sahulat is educational
              guidance — it is not a diagnosis, and never replaces a qualified doctor.
            </p>
            <p className="mt-3 text-sm font-semibold text-foreground">
              In an emergency, go to the nearest hospital or call emergency services right away.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 text-xs text-muted-foreground sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} Sehat Sahulat · Clear guidance, compassionate care.</p>
          <p>Educational use only — always consult a qualified doctor.</p>
        </div>
      </div>
    </footer>
  );
}
