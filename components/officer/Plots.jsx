"use client";
import { useT } from "@/lib/i18n";
import { useRegister } from "@/lib/api";
import { PageHeader } from "../brand";
import { useState } from "react";
import PlotRecord from "./PlotRecord";
import LandMap from "../LandMap";

export default function Plots() {
  const tr = useT();
  const state = useRegister();
  const [selected, setSelected] = useState(null);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tr("দাগ ও অংশ", "Plots & shares")}
        description={tr(
          "প্রতিটি দাগকে একটি ব্যাংক হিসাব ভাবুন, আর প্রতিটি মালিকের অংশ তাঁর ব্যালান্স। বিক্রি মানে উত্তোলন: কেউ নিজের ব্যালান্সের বেশি তুলতে পারেন না।",
          "Think of each dag as a bank account and each owner's share as their balance. A sale is a withdrawal: nobody can withdraw more than their balance."
        )}
      />
      <section className="grid items-start gap-5 rounded-lg bg-card p-5 lg:grid-cols-[16rem_minmax(0,1fr)]" aria-labelledby="plots-map-title">
        <LandMap
          state={state}
          selected={selected}
          onSelect={(id) => {
            setSelected(id);
            document.getElementById("plot-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
        <div className="flex flex-col gap-3 lg:order-first">
          <h2 id="plots-map-title" className="text-xl font-bold text-primary">
            {tr("জমির ম্যাপ", "Land map")}
          </h2>
          <p className="text-muted-foreground">{tr("দাগে চাপ দিলে তাতে পিন বসবে আর নিচে তার রেকর্ড খুলবে।", "Click a dag to pin it and jump to its record below.")}</p>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        {Object.keys(state.plots).map((id) => (
          <div key={id} id={"plot-" + id} className={"scroll-mt-28 rounded-lg " + (selected === id ? "ring-2 ring-primary" : "")}>
            <PlotRecord state={state} plotId={id} />
          </div>
        ))}
      </div>
    </div>
  );
}
