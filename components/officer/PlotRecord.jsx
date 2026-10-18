"use client";
import { CheckIcon, TriangleAlertIcon, GavelIcon, LandmarkIcon, BuildingIcon, BanknoteIcon, ShieldCheckIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { ownersOf, plotTotalCheck } from "@/lib/register";
import * as F from "@/lib/fraction";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareBar, OWNER_SHADES } from "../brand";


export function FlagPills({ plot }) {
  const tr = useT();
  const f = plot.flags;
  const pills = [];
  if (f.courtCase)
    pills.push(
      <Badge key="c" variant="destructive">
        <GavelIcon data-icon="inline-start" />
        {tr("চলমান মামলা", "Court case")}
      </Badge>
    );
  if (f.khas)
    pills.push(
      <Badge key="k" variant="destructive">
        <LandmarkIcon data-icon="inline-start" />
        {tr("খাস জমি", "Khas land")}
      </Badge>
    );
  if (f.acquisition)
    pills.push(
      <Badge key="a" variant="destructive">
        <BuildingIcon data-icon="inline-start" />
        {tr("অধিগ্রহণাধীন", "Under acquisition")}
      </Badge>
    );
  if (f.mortgage)
    pills.push(
      <Badge key="m" variant="warning">
        <BanknoteIcon data-icon="inline-start" />
        {tr("ব্যাংকে বন্ধক", "Mortgaged")}
      </Badge>
    );
  if (!pills.length)
    pills.push(
      <Badge key="ok" variant="success">
        <ShieldCheckIcon data-icon="inline-start" />
        {tr("কোনো দাবি নেই", "No claims")}
      </Badge>
    );
  return <div className="flex flex-wrap gap-1.5">{pills}</div>;
}

export default function PlotRecord({ state, plotId, selling, sellerId, compact = false }) {
  const tr = useT();
  const plot = state.plots[plotId];
  const owners = ownersOf(state, plotId);
  const exact = plotTotalCheck(state, plotId);
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold text-muted-foreground">{tr("ভূমি রেজিস্টার", "Land register")}</p>
        <CardTitle className="text-2xl font-bold">
          {tr("দাগ", "Dag")} <span className="num">{tr.num(plot.dag)}</span>
        </CardTitle>
        <CardDescription>
          {tr("মৌজা", "Mouza")} {tr.pick(plot.mouza)} · {tr("জেএল", "JL")} {tr.num(plot.jl)} · {tr("খতিয়ান", "Khatian")} {tr.num(plot.khatian)}
        </CardDescription>
        <CardAction className="text-right">
          <div className="num text-2xl font-semibold">{tr.num(F.display(plot.total))}</div>
          <div className="text-xs text-muted-foreground">{tr("শতাংশ মোট", "decimals total")}</div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FlagPills plot={plot} />
          <span className="text-sm text-muted-foreground">· {tr.pick(plot.landType)}</span>
        </div>
        {Object.values(plot.flags).filter(Boolean).map((f, i) => (
          <p key={i} className="-mt-2 text-sm text-muted-foreground">
            {tr.pick(f)}
          </p>
        ))}
        <ShareBar owners={owners} total={plot.total} people={state.people} selling={selling} sellerId={sellerId} />
        {!compact && (
          <div className="flex flex-col">
            <div className="flex items-baseline justify-between gap-3 border-b pb-1.5 text-sm text-muted-foreground">
              <span>{tr("মালিক", "Owner")}</span>
              <span className="text-right">{tr("অবশিষ্ট অংশ (শতাংশ)", "Remaining (decimals)")}</span>
            </div>
            <ul>
              {owners.map((o, i) => (
                <li key={o.person} className={cn("flex items-baseline justify-between gap-3 border-b py-1.5 last:border-b-0", o.person === sellerId && "bg-accent/50 font-semibold")}>
                  <span className="min-w-0 break-words">
                    <span className="mr-2 inline-block size-2.5 shrink-0 rounded-sm align-middle" style={{ background: OWNER_SHADES[i % OWNER_SHADES.length] }} aria-hidden="true" />
                    {tr.pick(state.people[o.person])}
                    {o.person === sellerId ? <span className="ml-2 text-sm font-normal text-muted-foreground">({tr("বিক্রেতা", "seller")})</span> : null}
                  </span>
                  <span className="num shrink-0 text-right">{tr.num(F.display(o.share))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className={cn("mt-auto gap-2 text-sm", exact ? "text-success" : "text-destructive")}>
        {exact ? <CheckIcon className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" /> : <TriangleAlertIcon className="size-4 shrink-0" aria-hidden="true" />}
        <span>
          {exact
            ? tr(`সব অংশ মিলে ঠিক ${tr.num(F.display(plot.total))} শতাংশ (ভগ্নাংশে হিসাব, কোনো রাউন্ডিং নেই)`, `Shares add up to exactly ${F.display(plot.total)} decimals (kept as fractions, no rounding)`)
            : tr("অংশের যোগফল মিলছে না", "Shares do not add up")}
        </span>
      </CardFooter>
    </Card>
  );
}
