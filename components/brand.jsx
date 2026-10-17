"use client";
import { useEffect, useMemo, useState } from "react";
import { CheckIcon, XIcon, TriangleAlertIcon, MoonIcon, SunIcon, RotateCcwIcon, DatabaseIcon, MonitorSmartphoneIcon, Volume2Icon, SquareIcon } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/speech";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/store";
import { api, useBackend } from "@/lib/api";
import { dateLine } from "@/lib/bangla-date";
import { qrSvg } from "@/lib/qr";
import * as F from "@/lib/fraction";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn("size-10 shrink-0", className)}>
      <rect width="48" height="48" rx="12" fill="#075E24" />
      <g stroke="#fff" strokeOpacity=".17" strokeWidth="1.3" fill="none" strokeLinecap="round">
        <path d="M-2 13.5 50 6.5M-2 35 50 28.5M13 -2 17.5 50M34.5 -2 39 50M17.5 23 0 25.5" />
      </g>
      <rect x=".5" y=".5" width="47" height="47" rx="11.5" fill="none" stroke="#fff" strokeOpacity=".22" />
      <path d="M24 43c-1.4-3.2-4.6-7.4-8.1-11.4C12.4 27.7 10.5 24.4 10.5 19.5a13.5 13.5 0 0 1 27 0c0 4.9-1.9 8.2-5.4 12.1C28.6 35.6 25.4 39.8 24 43z" fill="#fff" />
      <path d="M17.4 14.4 30 12l2.6 11.6-12.4 2.6z" fill="#A6E36B" stroke="#075E24" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M21.2 19.4l2.6 2.6 4.6-5.2" fill="none" stroke="#075E24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function Logo({ small = false, sub, className }) {
  const tr = useT();
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={small ? "size-8" : "size-10"} />
      <span className="flex flex-col leading-tight">
        <span className={cn("font-extrabold tracking-tight text-primary", small ? "text-lg" : "text-[1.375rem]")}>{tr("জমিযাচাই", "JomiJachai")}</span>
        {sub !== false && <span className="hidden text-sm text-muted-foreground sm:block">{sub || tr("জমি কেনার আগে যাচাই", "Check land before you buy")}</span>}
      </span>
    </span>
  );
}

export function LangToggle({ inverse = false, className }) {
  const { lang, setPrefs } = usePrefs();
  return (
    <div className={cn("inline-flex overflow-hidden rounded-md text-sm font-semibold", inverse ? "bg-brand-strong" : "bg-muted", className)} role="group" aria-label="ভাষা / Language">
      {[
        ["bn", "বাং"],
        ["en", "EN"],
      ].map(([k, label]) => {
        const on = lang === k;
        return (
          <button
            key={k}
            lang={k}
            onClick={() => setPrefs({ lang: k })}
            aria-pressed={on}
            className={cn(
              "press min-h-9 min-w-11 cursor-pointer px-2.5",
              inverse ? (on ? "bg-brand-foreground text-brand" : "text-brand-foreground/85 hover:text-brand-foreground") : on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggle({ inverse = false }) {
  const { theme, setPrefs } = usePrefs();
  const tr = useT();
  const isDark = theme === "dark";
  const label = isDark ? tr("আলো থিম", "Light theme") : tr("অন্ধকার থিম", "Dark theme");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setPrefs({ theme: isDark ? "light" : "dark" })}
          aria-label={label}
          className={cn("press inline-flex size-9 cursor-pointer items-center justify-center rounded-md", inverse ? "text-brand-foreground/85 hover:bg-brand-strong hover:text-brand-foreground" : "text-muted-foreground hover:bg-muted")}
        >
          {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function DateStrip({ className }) {
  const tr = useT();
  const [line, setLine] = useState("");
  useEffect(() => setLine(dateLine(tr.lang)), [tr.lang]);
  return (
    <div className={cn("bg-brand text-brand-foreground", className)}>
      <div className="container-site flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1 text-sm font-medium">
        <span suppressHydrationWarning>
          {line}
        </span>
        <span className="flex items-center gap-1.5">
          <LangToggle inverse />
          <ThemeToggle inverse />
        </span>
      </div>
    </div>
  );
}

export function BackendBadge({ className }) {
  const tr = useT();
  const { backend } = useBackend();
  const shared = backend === "supabase";
  const Icon = shared ? DatabaseIcon : MonitorSmartphoneIcon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {shared ? tr("শেয়ার করা ডেটাবেস (Supabase)", "Shared database (Supabase)") : tr("রেজিস্টার: এই ব্রাউজারে", "Register: this browser")}
    </span>
  );
}

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-[1.75rem] font-bold text-primary md:text-3xl">{title}</h1>
        {description && <p className="max-w-[68ch] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export const GREEN_HEAD = "bg-brand hover:bg-brand [&_th]:font-semibold [&_th]:text-brand-foreground";

const STATUS = {
  pass: [CheckIcon, "bg-success"],
  fail: [XIcon, "bg-destructive"],
  warn: [TriangleAlertIcon, "bg-warning"],
};
export function StatusIcon({ status, className }) {
  const [Icon, bg] = STATUS[status] || STATUS.pass;
  return (
    <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full text-background", bg, className)}>
      <Icon className="size-4" strokeWidth={3} aria-hidden="true" />
    </span>
  );
}

export const OWNER_SHADES = ["var(--owner-1)", "var(--owner-2)", "var(--owner-3)", "var(--owner-4)", "var(--owner-5)"];
export function ShareBar({ owners, total, people, selling, sellerId }) {
  const tr = useT();
  const t = F.toNumber(total);
  return (
    <div className="sharebar" role="img" aria-label={tr("মালিকদের অংশ", "Owners' shares")}>
      {owners.map((o, i) => {
        const val = F.toNumber(o.share);
        const sell = selling && o.person === sellerId ? Math.min(F.toNumber(selling), val) : 0;
        const style = { background: OWNER_SHADES[i % OWNER_SHADES.length], color: "var(--owner-foreground)" };
        const label = tr.pick(people[o.person]).split(" ")[0];
        return [
          <span key={o.person} style={{ ...style, flexGrow: val - sell }} title={`${tr.pick(people[o.person])}: ${F.display(o.share)}`}>
            {(val - sell) / t > 0.12 ? `${label} ${tr.num(F.toDecimalString(F.parse(String(val - sell)), 2))}` : ""}
          </span>,
          sell > 0 ? (
            <span key={o.person + "-sell"} className="selling" style={{ ...style, flexGrow: sell }}>
              {sell / t > 0.1 ? tr("বিক্রি", "sale") : ""}
            </span>
          ) : null,
        ];
      })}
    </div>
  );
}

export function QR({ text, size = 168, className }) {
  const svg = useMemo(() => qrSvg(text, { dark: "#111", light: "#fff" }), [text]);
  return <div className={cn("shrink-0 rounded-md bg-white p-1.5", className)} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Fingerprint({ hash, className }) {
  return <code className={cn("mono text-sm leading-relaxed break-all", className)}>{hash.match(/.{1,4}/g).join(" ")}</code>;
}

export function useReveal(deps = []) {
  useEffect(() => {
    const els = [...document.querySelectorAll("[data-reveal]:not(.is-in)")];
    if (!("IntersectionObserver" in window)) return els.forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps);
}

export function ResetButton({ variant = "outline", description }) {
  const tr = useT();
  const { backend } = useBackend();
  const shared = backend === "supabase";
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant}>
          <RotateCcwIcon data-icon="inline-start" />
          {tr("রেজিস্টার রিসেট", "Reset register")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <RotateCcwIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>{tr("রেজিস্টার শুরুর অবস্থায় ফেরাবেন?", "Reset the register?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ||
              (shared
                ? tr("শেয়ার করা ডেটাবেস শুরুর অবস্থায় ফিরে যাবে, সব ডিভাইসের জন্য। সব নতুন দলিল ও কার্যলিপি মুছে যাবে।", "The shared database returns to its starting state, for every device. All new deeds and log lines are removed.")
                : tr("এই ডিভাইসের রেজিস্টার শুরুর অবস্থায় ফিরে যাবে। সব নতুন দলিল ও কার্যলিপি মুছে যাবে।", "This device's register returns to its starting state. All new deeds and log lines are removed."))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tr("না", "Cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              api
                .reset()
                .then(() => toast.success(tr("রেজিস্টার রিসেট হয়েছে", "Register reset")))
                .catch((e) => toast.error(String(e.message || e)))
            }
          >
            {tr("হ্যাঁ, মুছে নতুন করে শুরু করুন", "Yes, clear and restart")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReadAloudButton({ text, className, size, variant = "outline" }) {
  const tr = useT();
  const [state, setState] = useState("idle");
  useEffect(() => () => stopSpeaking(), []);
  async function toggle() {
    if (state !== "idle") {
      stopSpeaking();
      return setState("idle");
    }
    setState("loading");
    const mode = await speak(text, tr.lang, {
      onEnd: (err) => {
        setState("idle");
        if (err) toast.error(tr("শোনানো গেল না। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।", "Could not play the voice. Check the internet connection and try again."));
      },
    });
    if (mode === "unavailable") {
      setState("idle");
      toast.error(tr("এই ডিভাইসে বাংলা ভয়েস নেই", "No Bangla voice on this device"), {
        description: tr("অ্যান্ড্রয়েডে: Settings → Text-to-speech → Google → বাংলা ভয়েস ইনস্টল করুন। অথবা ইন্টারনেট চালু করে আবার চেষ্টা করুন।", "On Android: Settings → Text-to-speech → Google → install the Bangla voice. Or connect to the internet and try again."),
      });
    } else setState("speaking");
  }
  const speaking = state === "speaking";
  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={toggle} aria-pressed={speaking}>
      {state === "loading" ? <Spinner data-icon="inline-start" /> : speaking ? <SquareIcon data-icon="inline-start" /> : <Volume2Icon data-icon="inline-start" />}
      {speaking ? tr("থামান", "Stop") : tr("পড়ে শোনান", "Read aloud")}
    </Button>
  );
}
