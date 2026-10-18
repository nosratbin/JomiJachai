"use client";
import { useState } from "react";
import { ArrowLeftIcon, PrinterIcon, FileSearchIcon, ChevronRightIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useRegister } from "@/lib/api";
import { usePrefs } from "@/lib/store";
import { OFFICERS, officeOf } from "@/lib/seed";
import { go, verifyLink } from "@/lib/nav";
import * as F from "@/lib/fraction";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageHeader, QR, Fingerprint, GREEN_HEAD } from "../brand";
import { AreaScope, inArea } from "./AreaScope";

export function DeedPaper({ deed, state }) {
  const tr = useT();
  const plot = state.plots[deed.plot];
  const officer = OFFICERS.find((o) => o.id === deed.officer) || OFFICERS[0];
  const Row = ({ k, v, mono }) => (
    <div className="grid grid-cols-[minmax(7rem,9.5rem)_1fr] gap-3 py-[3px]">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={`docink font-semibold ${mono ? "num" : ""}`}>{v}</dd>
    </div>
  );
  return (
    <article className="deed-paper rounded-lg p-5 shadow-sm sm:p-8" aria-label={tr("দলিল", "Deed")}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-info pb-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{tr("“জমিযাচাই” · নিবন্ধিত দলিলের অনুলিপি", "JomiJachai · copy of a registered deed")}</p>
          <h2 className="docink mt-1 text-2xl font-bold sm:text-[1.7rem]">{tr("সাফ কবলা দলিল", "Sale deed (saf kabala)")}</h2>
          <p className="text-sm text-muted-foreground">{tr.pick(officeOf(plot.mouza.en))}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">{tr("দলিল নং", "Deed no.")}</div>
          <div className="num docink text-xl font-semibold">{tr.num(deed.no)}</div>
          <div className="text-sm text-muted-foreground">{tr.date(deed.date)}</div>
        </div>
      </header>

      <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto]">
        <dl className="min-w-0">
          <Row k={tr("দাতা (বিক্রেতা)", "Seller")} v={tr.pick(state.people[deed.seller])} />
          <Row k={tr("গ্রহীতা (ক্রেতা)", "Buyer")} v={tr.pick(state.people[deed.buyer])} />
          <div className="mt-4 mb-1 font-heading font-semibold">{tr("তফসিল (জমির বিবরণ)", "Schedule of land")}</div>
          <Row k={tr("মৌজা", "Mouza")} v={`${tr.pick(plot.mouza)}, ${tr("জেএল", "JL")} ${tr.num(plot.jl)}`} />
          <Row k={tr("খতিয়ান", "Khatian")} v={tr.num(plot.khatian)} mono />
          <Row k={tr("দাগ", "Dag")} v={tr.num(plot.dag)} mono />
          <Row k={tr("হস্তান্তরিত জমি", "Land transferred")} v={`${tr.num(F.display(deed.decimals))} ${tr("শতাংশ", "decimals")}`} mono />
          <Row k={tr("শ্রেণি", "Land class")} v={tr.pick(plot.landType)} />
          <div className="mt-5 text-sm text-muted-foreground">
            {tr("নিবন্ধনকারী", "Registered by")}: {tr.pick(officer)}
          </div>
        </dl>
        <div className="flex flex-col items-center gap-2">
          <QR text={verifyLink(deed)} size={156} />
          <p className="max-w-[12rem] text-center text-xs text-muted-foreground">{tr("ফোনের ক্যামেরায় স্ক্যান করে যাচাই করুন", "Scan with a phone camera to verify")}</p>
        </div>
      </div>

      <footer className="mt-6 border-t border-paper-line pt-3">
        <div className="text-xs text-muted-foreground">{tr("ডিজিটাল ছাপ (SHA-256)", "Digital fingerprint (SHA-256)")}</div>
        <Fingerprint hash={deed.fingerprint} className="docink" />
      </footer>
    </article>
  );
}

export function DeedList() {
  const tr = useT();
  const state = useRegister();
  const { area } = usePrefs();
  const [allAreas, setAllAreas] = useState(false);
  const deeds = [...state.deeds].reverse().filter((d) => allAreas || inArea(state, d.plot, area));
  const empty = !deeds.length;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tr("নিবন্ধিত দলিল", "Registered deeds")}
        description={tr("প্রতিটি দলিলের ডিজিটাল ছাপ তার কিউআর কোডে আছে। ছাপের প্রথম অংশ এখানে দেখানো হলো।", "Every deed's digital fingerprint is inside its QR code. The start of each fingerprint is shown here.")}
      />
      <AreaScope all={allAreas} setAll={setAllAreas} shown={deeds.length} total={state.deeds.length} noun={{ bn: "দলিল", en: "deeds" }} />
      {empty ? (
        <Empty className="rounded-lg border border-dashed bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSearchIcon />
            </EmptyMedia>
            <EmptyTitle>{tr("এই এলাকায় এখনো কোনো দলিল নেই", "No deeds in this area yet")}</EmptyTitle>
            <EmptyDescription>{tr("অন্য এলাকার দলিল দেখতে পারবেন, অথবা ওপরের এলাকা বদলে নিন।", "You can look at the other areas, or change the area at the top.")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => setAllAreas(true)}>
              {tr("সব এলাকার দলিল", "Deeds from all areas")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card className="py-0">
          <Table className="min-w-[680px]">
            <TableHeader className={GREEN_HEAD}>
              <TableRow className={GREEN_HEAD}>
                <TableHead className="pl-5">{tr("দলিল নং", "Deed no.")}</TableHead>
                <TableHead>{tr("তারিখ", "Date")}</TableHead>
                <TableHead>{tr("দাগ", "Dag")}</TableHead>
                <TableHead>{tr("দাতা → গ্রহীতা", "Seller → Buyer")}</TableHead>
                <TableHead className="text-right">{tr("শতাংশ", "Decimals")}</TableHead>
                <TableHead>{tr("ডিজিটাল ছাপ", "Fingerprint")}</TableHead>
                <TableHead className="w-10 pr-5">
                  <span className="sr-only">{tr("খুলুন", "Open")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deeds.map((d) => (
                <TableRow key={d.no} className="cursor-pointer" onClick={() => go("deed-" + d.no)}>
                  <TableCell className="pl-5">
                    <button onClick={() => go("deed-" + d.no)} className="num cursor-pointer font-semibold text-primary underline-offset-4 hover:underline">
                      {tr.num(d.no)}
                    </button>
                  </TableCell>
                  <TableCell>{tr.date(d.date)}</TableCell>
                  <TableCell className="num">
                    {tr.num(state.plots[d.plot].dag)}
                    {allAreas ? <span className="font-normal text-muted-foreground"> · {tr.pick(state.plots[d.plot].mouza)}</span> : null}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {tr.pick(state.people[d.seller])} → {tr.pick(state.people[d.buyer])}
                  </TableCell>
                  <TableCell className="num text-right">{tr.num(F.display(d.decimals))}</TableCell>
                  <TableCell className="mono text-sm text-muted-foreground">{d.fingerprint.slice(0, 12)}…</TableCell>
                  <TableCell className="pr-5 text-muted-foreground">
                    <ChevronRightIcon className="size-4" aria-hidden="true" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export function DeedView({ no }) {
  const tr = useT();
  const state = useRegister();
  const deed = state.deeds.find((d) => d.no === no);
  if (!deed) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileSearchIcon />
          </EmptyMedia>
          <EmptyTitle>{tr("এই নম্বরের কোনো দলিল নেই", "No deed with this number")}</EmptyTitle>
          <EmptyDescription>{tr("নম্বরটি আবার দেখুন, অথবা সব দলিলের তালিকা খুলুন।", "Check the number, or open the list of all deeds.")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => go("officer-deeds")}>
            {tr("দলিলের তালিকা", "All deeds")}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant="ghost" className="-ml-2" onClick={() => go("officer-deeds")}>
          <ArrowLeftIcon data-icon="inline-start" />
          {tr("সব দলিল", "All deeds")}
        </Button>
        <span className="flex-1" />
        {!window.__JJ_NO_PRINT__ && (
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" />
            {tr("প্রিন্ট", "Print")}
          </Button>
        )}
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <DeedPaper deed={deed} state={state} />
      </div>
    </div>
  );
}
