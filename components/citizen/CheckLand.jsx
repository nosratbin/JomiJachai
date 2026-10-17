"use client";
import { useEffect, useState } from "react";
import { SearchIcon, SearchXIcon, LockIcon, HistoryIcon, XIcon, MapIcon, SparklesIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useRegister } from "@/lib/api";
import { plotStatus } from "@/lib/register";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PlotSlip, { LEVEL, plotSentence } from "../PlotSlip";
import LandMap from "../LandMap";
import { ReadAloudButton } from "../brand";

const EXAMPLES = ["312", "245", "118", "077", "609"];

const RECENT_KEY = "jomijachai:recent";
function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveRecent(ids) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {}
}

function findPlot(state, m, d) {
  const ascii = String(d).replace(/[০-৯]/g, (c) => "০১২৩৪৫৬৭৮৯".indexOf(c)).trim();
  return Object.keys(state.plots).find((k) => (!m || state.plots[k].mouza.en === m) && ascii !== "" && Number(state.plots[k].dag) === Number(ascii)) || null;
}

function fromRoute(route) {
  const m = route.match(/^check-([A-Za-z]+)-(\d+)$/);
  return m ? [m[1], m[2]] : ["", ""];
}

const scrollTo = (id) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);

const ADVICE = {
  safe: ["রেকর্ডে কোনো বাধা নেই। তবু টাকা দেওয়ার আগে বিক্রেতার দলিল ও পরিচয়পত্র মিলিয়ে নিন।", "Nothing on record stops this sale. Still, check the seller's deed and ID before you pay."],
  careful: ["কেনা যায়, তবে নিচের বিষয়গুলো আগে মিটিয়ে নিন।", "You can buy, but settle the points below first."],
  risky: ["নিচের সমস্যা না মেটা পর্যন্ত এই জমির জন্য টাকা দেবেন না।", "Don't pay for this land until the problem below is resolved."],
};

export default function CheckLand({ route }) {
  const tr = useT();
  const state = useRegister();
  const mouzas = [...new Map(Object.values(state.plots).map((p) => [p.mouza.en, p.mouza])).values()];
  const [m0, d0] = fromRoute(route);
  const [mouza, setMouza] = useState(m0);
  const [dag, setDag] = useState(d0);
  const [plotId, setPlotId] = useState(() => (d0 ? findPlot(state, m0, d0) : null));
  const [notFound, setNotFound] = useState("");
  const [recent, setRecent] = useState([]);
  useEffect(() => setRecent(loadRecent().filter((id) => state.plots[id])), []);

  function show(id) {
    setPlotId(id);
    setNotFound("");
    setMouza(state.plots[id].mouza.en);
    setDag(state.plots[id].dag);
    const next = [id, ...recent.filter((x) => x !== id)].slice(0, 4);
    setRecent(next);
    saveRecent(next);
    scrollTo("cl-result");
  }

  function search(e) {
    e?.preventDefault();
    if (!String(dag).trim()) return document.getElementById("cl-dag")?.focus();
    const id = findPlot(state, mouza, dag);
    if (id) return show(id);
    setPlotId(null);
    setNotFound(dag);
  }

  function clear() {
    setPlotId(null);
    setNotFound("");
    setDag("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => document.getElementById("cl-dag")?.focus(), 300);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl leading-tight font-bold text-balance">{tr("জমি কেনার আগে যাচাই করুন", "Check land before you buy")}</h1>
        <p className="text-muted-foreground">{tr("দাগ নম্বর দিন: মালিক, ঝুঁকি আর ম্যাপে অবস্থান, এক জায়গায়।", "Enter a dag number: owners, risks and the place on the map, in one place.")}</p>
      </div>

      <form onSubmit={search} role="search" className="flex flex-col gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
        <InputGroup className="h-14 rounded-xl">
          <InputGroupAddon>
            <SearchIcon className="size-5" />
          </InputGroupAddon>
          <InputGroupInput
            id="cl-dag"
            className="text-xl font-semibold"
            inputMode="numeric"
            enterKeyHint="search"
            value={dag}
            onChange={(e) => setDag(e.target.value)}
            placeholder={tr("দাগ নম্বর, যেমন ৩১২", "Dag number, e.g. 312")}
            aria-label={tr("দাগ নম্বর", "Dag number")}
            autoComplete="off"
          />
          {dag && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-sm" aria-label={tr("মুছুন", "Clear")} onClick={clear}>
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <div className="flex gap-2">
          <NativeSelect id="cl-mouza" className="min-w-0 flex-1" value={mouza} onChange={(e) => setMouza(e.target.value)} aria-label={tr("মৌজা", "Mouza")}>
            <NativeSelectOption value="">{tr("সব মৌজা", "All mouzas")}</NativeSelectOption>
            {mouzas.map((m) => (
              <NativeSelectOption key={m.en} value={m.en}>
                {tr("মৌজা", "Mouza")} {tr.pick(m)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="submit" size="lg" className="h-11 shrink-0 px-6">
            {tr("যাচাই করুন", "Check")}
          </Button>
        </div>
      </form>

      {!plotId && (
        <div className="flex flex-col gap-4">
          {recent.length > 0 && <Chips icon={HistoryIcon} title={tr("সাম্প্রতিক খোঁজ", "Recent searches")} ids={recent} state={state} onPick={show} />}
          <Chips icon={SparklesIcon} title={tr("দেখে নিন", "Try these")} ids={EXAMPLES.filter((id) => !recent.includes(id))} state={state} onPick={show} />
        </div>
      )}

      {notFound && (
        <Alert variant="warning" className="bg-card">
          <SearchXIcon />
          <AlertTitle>{tr(`দাগ ${tr.num(notFound)} পাওয়া যায়নি`, `Dag ${notFound} not found`)}</AlertTitle>
          <AlertDescription>{tr("নম্বরটি আবার দেখুন, অথবা মৌজা “সব মৌজা” করে খুঁজুন।", "Check the number, or set the mouza to “All mouzas” and search again.")}</AlertDescription>
        </Alert>
      )}

      {plotId && <Answer state={state} id={plotId} onClear={clear} />}

      <section id="cl-map" className="flex scroll-mt-20 flex-col gap-3" aria-labelledby="cl-map-title">
        <h2 id="cl-map-title" className="flex items-center gap-2 text-lg font-bold">
          <MapIcon className="size-5 text-primary" aria-hidden="true" />
          {plotId ? tr("ম্যাপে দাগটির অবস্থান", "Where the dag is") : tr("অথবা ম্যাপে দাগ বেছে নিন", "Or pick a dag on the map")}
        </h2>
        <LandMap state={state} selected={plotId} onSelect={show} card={false} />
      </section>

      {plotId && (
        <section className="flex flex-col gap-3" aria-label={tr("দাগের পর্চা", "Plot record")}>
          <PlotSlip state={state} plotId={plotId} brief />
        </section>
      )}

      <p className="flex gap-2 text-sm text-muted-foreground">
        <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {tr("জাতীয় পরিচয়পত্র বা ফোন নম্বরের মতো ব্যক্তিগত তথ্য শুধু অনুমোদিত কর্মকর্তারা দেখেন।", "Personal details such as NID or phone numbers are shown only to authorised officers.")}
      </p>
    </div>
  );
}

function Chips({ icon: Icon, title, ids, state, onPick }) {
  const tr = useT();
  if (!ids.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {ids.map((id) => {
          const p = state.plots[id];
          const level = plotStatus(state, id).level;
          return (
            <button
              type="button"
              key={id}
              onClick={() => onPick(id)}
              className="press inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-card px-4 text-[0.9375rem] font-semibold ring-1 ring-border hover:ring-primary"
            >
              <span className={cn("legend-swatch", level)} aria-hidden="true" />
              {tr("দাগ", "Dag")} {tr.num(p.dag)}
              <span className="font-normal text-muted-foreground">{tr.pick(p.mouza)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Answer({ state, id, onClear }) {
  const tr = useT();
  const p = state.plots[id];
  const { level, reasons } = plotStatus(state, id);
  const L = LEVEL[level];
  return (
    <section id="cl-result" className="scroll-mt-20 overflow-hidden rounded-2xl bg-card ring-1 ring-border" aria-live="polite" aria-labelledby="cl-answer">
      <div className={cn("flex items-center gap-3 px-4 py-4 text-background", L.bar)}>
        <span key={id} className="answer-pop inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-background/15">
          <L.icon className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold opacity-90">{tr(`দাগ ${tr.num(p.dag)} · মৌজা ${p.mouza.bn}`, `Dag ${p.dag} · Mouza ${p.mouza.en}`)}</p>
          <h2 id="cl-answer" className="text-[1.75rem] leading-tight font-bold">
            {tr(L.bn, L.en)}
          </h2>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <p className="text-lg leading-snug font-semibold">{tr(...ADVICE[level])}</p>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted-foreground">{level === "safe" ? tr("রেকর্ডে যা আছে", "On record") : tr(`সতর্কতা (${tr.num(reasons.length)})`, `Warnings (${reasons.length})`)}</p>
          <ul className="flex flex-col gap-2">
            {reasons.map((r) => {
              const R = LEVEL[r.level];
              return (
                <li key={r.en} className="flex gap-3 rounded-xl bg-muted px-3 py-3 leading-snug">
                  <R.icon className={cn("mt-0.5 size-5 shrink-0", R.text)} aria-hidden="true" />
                  <span>{tr(tr.num(r.bn), r.en)}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReadAloudButton text={plotSentence(tr, state, id)} />
          <Button variant="ghost" onClick={onClear}>
            <SearchIcon data-icon="inline-start" />
            {tr("আরেকটি দাগ খুঁজুন", "Check another dag")}
          </Button>
        </div>
      </div>
    </section>
  );
}
