"use client";
import { useEffect, useState } from "react";
import { SearchIcon, SearchXIcon, XIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useRegister } from "@/lib/api";
import { usePrefs } from "@/lib/store";
import { MOUZAS } from "@/lib/seed";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageHeader } from "../brand";
import PlotRecord from "./PlotRecord";
import LandMap from "../LandMap";

// "২৪৫" and "245" both find dag 245
const dagDigits = (s) =>
  String(s)
    .trim()
    .replace(/[০-৯]/g, (c) => "০১২৩৪৫৬৭৮৯".indexOf(c));

export default function Plots() {
  const tr = useT();
  const state = useRegister();
  const { area } = usePrefs();
  const [selected, setSelected] = useState(null);
  const [mouzaPick, setMouzaPick] = useState(null); // null = follow the area in the top bar
  const [query, setQuery] = useState("");
  const [jump, setJump] = useState(0);

  const mouza = mouzaPick ?? area;
  const want = dagDigits(query);
  const all = Object.keys(state.plots);
  const ids = all.filter((id) => {
    const plot = state.plots[id];
    if (mouza && plot.mouza.en !== mouza) return false;
    return !want || String(plot.dag) === want;
  });
  const filtering = !!want || mouza !== area;
  const clear = () => {
    setMouzaPick(null);
    setQuery("");
  };

  // The map keeps showing all four mouzas, so a click there may sit outside the filters:
  // widen them to the clicked dag first, then scroll down to its record.
  const pick = (id) => {
    const plot = state.plots[id];
    if (mouza && plot.mouza.en !== mouza) setMouzaPick(plot.mouza.en);
    if (want && String(plot.dag) !== want) setQuery("");
    setSelected(id);
    setJump((n) => n + 1);
  };
  useEffect(() => {
    if (!jump) return;
    document.getElementById("plot-" + selected)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [jump, selected]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tr("দাগ ও অংশ", "Plots & shares")}
        description={tr(
          "প্রতিটি দাগকে একটি ব্যাংক হিসাব ভাবুন, আর প্রতিটি মালিকের অংশ তাঁর ব্যালান্স। বিক্রি মানে উত্তোলন: কেউ নিজের ব্যালান্সের বেশি তুলতে পারেন না।",
          "Think of each dag as a bank account and each owner's share as their balance. A sale is a withdrawal: nobody can withdraw more than their balance."
        )}
      />

      <section className="flex flex-col gap-4" aria-labelledby="plots-map-title">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="plots-map-title" className="text-xl font-bold text-primary">
              {tr("জমির ম্যাপ", "Land map")}
            </h2>
            <p className="max-w-[68ch] text-sm text-muted-foreground">
              {tr(
                "চার মৌজার সব দাগ এখানে আঁকা; দাগে চাপ দিলে তাতে পিন বসবে আর নিচে তার রেকর্ড খুলবে।",
                "Every dag in the four mouzas is drawn here. Click a dag to pin it and open its record below."
              )}
            </p>
          </div>
          {selected && (
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
              <XIcon data-icon="inline-start" aria-hidden="true" />
              {tr("পিন সরান", "Clear the pin")}
            </Button>
          )}
        </div>
        <LandMap state={state} selected={selected} onSelect={pick} />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="plots-list-title">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="plots-list-title" className="text-xl font-bold text-primary">
              {tr("দাগের রেকর্ড", "Plot records")}
            </h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {filtering
                ? tr(`${tr.num(all.length)}টি দাগের মধ্যে ${tr.num(ids.length)}টি`, `${ids.length} of ${all.length} dags`)
                : tr(`এই এলাকার ${tr.num(ids.length)}টি দাগ (সব মিলিয়ে ${tr.num(all.length)}টি)`, `${ids.length} dags in this area (${all.length} in all)`)}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <InputGroup className="h-10 min-w-0 flex-1 md:w-52 md:flex-none">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="plot-search"
                inputMode="numeric"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr("দাগ নম্বর, যেমন ২৪৫", "Dag number, e.g. 245")}
                aria-label={tr("দাগ নম্বর দিয়ে খুঁজুন", "Search by dag number")}
              />
            </InputGroup>
            <label htmlFor="plot-mouza" className="sr-only">
              {tr("মৌজা", "Mouza")}
            </label>
            <NativeSelect id="plot-mouza" className="w-full md:w-auto" value={mouza} onChange={(e) => setMouzaPick(e.target.value)}>
              <NativeSelectOption value="">{tr("সব মৌজা", "All mouzas")}</NativeSelectOption>
              {Object.entries(MOUZAS).map(([key, m]) => (
                <NativeSelectOption key={key} value={key}>
                  {tr.pick(m)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {filtering && (
              <Button variant="ghost" onClick={clear}>
                <XIcon data-icon="inline-start" aria-hidden="true" />
                {tr("মুছুন", "Clear")}
              </Button>
            )}
          </div>
        </div>

        {ids.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {ids.map((id) => (
              <div key={id} id={"plot-" + id} className={cn("min-w-0 scroll-mt-32 rounded-lg md:scroll-mt-24", selected === id && "ring-2 ring-primary")}>
                <PlotRecord state={state} plotId={id} />
              </div>
            ))}
          </div>
        ) : (
          <Empty className="rounded-lg border border-dashed bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>{tr("এই খোঁজে কোনো দাগ নেই", "No dag matches this search")}</EmptyTitle>
              <EmptyDescription>{tr("দাগ নম্বর বা মৌজা বদলে আবার দেখুন।", "Try another dag number or mouza.")}</EmptyDescription>
            </EmptyHeader>
            {filtering && (
              <EmptyContent>
                <Button variant="outline" onClick={clear}>
                  {tr("খোঁজ মুছুন", "Clear the search")}
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </section>
    </div>
  );
}
