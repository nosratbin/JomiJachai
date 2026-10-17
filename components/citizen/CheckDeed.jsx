"use client";
import { useEffect, useRef, useState } from "react";
import { CameraIcon, CameraOffIcon, SearchIcon, Volume2Icon, CircleCheckIcon, OctagonXIcon, ShieldCheckIcon, ShieldXIcon, FileSearchIcon, ChevronDownIcon, RotateCcwIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { api, useRegister } from "@/lib/api";
import { verifyDeed } from "@/lib/register";
import { go } from "@/lib/nav";
import * as F from "@/lib/fraction";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Fingerprint, ReadAloudButton } from "../brand";

// Route from a QR code: v-2026-0147-<64 hex fingerprint>
function parseVerifyRoute(route) {
  const m = route.match(/^v-(\d{4}-\d{4})-([0-9a-f]{64})$/i);
  return m ? { no: m[1], hash: m[2].toLowerCase() } : null;
}

function Scanner({ onResult, onClose }) {
  const tr = useT();
  const videoRef = useRef(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let stream,
      timer,
      stopped = false;
    (async () => {
      try {
        if (!("BarcodeDetector" in window)) throw new Error("unsupported");
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const tick = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length) return onResult(codes[0].rawValue);
          } catch {
            /* keep trying */
          }
          timer = setTimeout(tick, 250);
        };
        tick();
      } catch (e) {
        setErr(e.message === "unsupported" ? "unsupported" : "camera");
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);
  return (
    <Card className="gap-0 py-0">
      {err ? (
        <Alert variant="warning" className="rounded-none border-0 border-b">
          <CameraOffIcon />
          <AlertTitle>{err === "unsupported" ? tr("এই ব্রাউজারে অ্যাপের ভেতরে স্ক্যান হয় না", "This browser can't scan inside the app") : tr("ক্যামেরা চালু করা যায়নি", "The camera could not be opened")}</AlertTitle>
          <AlertDescription>{tr("ফোনের সাধারণ ক্যামেরা দিয়ে দলিলের কিউআর স্ক্যান করুন; লিংকটি খুললেই এই যাচাইয়ের পাতা আসবে। অথবা নিচে দলিল নম্বর লিখুন।", "Scan the deed's QR with the phone's normal camera; opening the link brings you to this check. Or type the deed number below.")}</AlertDescription>
        </Alert>
      ) : (
        <div className="relative">
          <video ref={videoRef} className="aspect-square w-full bg-black object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]" aria-hidden="true" />
        </div>
      )}
      <div className="p-3">
        <Button variant="outline" className="w-full" onClick={onClose}>
          {tr("বন্ধ করুন", "Close")}
        </Button>
      </div>
    </Card>
  );
}

function Verdict({ ok, title, subtitle }) {
  const Icon = ok ? CircleCheckIcon : OctagonXIcon;
  return (
    <div className={cn("flex items-center gap-3.5 border-b p-5", ok ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10")}>
      <span className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-card shadow-xs", ok ? "text-success" : "text-destructive")}>
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className={cn("font-heading text-[1.75rem] leading-tight font-bold", ok ? "text-success" : "text-destructive")}>{title}</div>
        <div className="text-sm font-semibold">{subtitle}</div>
      </div>
    </div>
  );
}

export default function CheckDeed({ route }) {
  const tr = useT();
  const state = useRegister();
  const fromQr = parseVerifyRoute(route);
  const [deedNo, setDeedNo] = useState(fromQr?.no || "");
  const [lookup, setLookup] = useState(fromQr);
  const [scanning, setScanning] = useState(false);
  const [paper, setPaper] = useState("");
  const [compare, setCompare] = useState(null);
  const logged = useRef("");

  useEffect(() => {
    const q = parseVerifyRoute(route);
    if (q) {
      setLookup(q);
      setDeedNo(q.no);
      setCompare(null);
      setPaper("");
    }
  }, [route]);

  const res = lookup ? verifyDeed(state, lookup.no, lookup.hash) : null;

  useEffect(() => {
    if (res?.found && res.qrMatches === false && logged.current !== route) {
      logged.current = route;
      api.recordVerification(lookup.no, "mismatch").catch(() => {});
    }
  }, [res?.found, res?.qrMatches, route]);

  function onScan(text) {
    setScanning(false);
    const i = text.indexOf("#");
    if (i >= 0) go(text.slice(i + 1));
  }
  function searchByNumber(e) {
    e.preventDefault();
    const n = deedNo.replace(/[০-৯]/g, (c) => "০১২৩৪৫৬৭৮৯".indexOf(c)).trim();
    setLookup({ no: n, hash: null });
    setCompare(null);
    setPaper("");
    if (route !== "citizen-deed") history.replaceState(null, "", "#citizen-deed");
  }
  function comparePaper(e) {
    e.preventDefault();
    const p = F.parse(paper);
    if (!p) return;
    const same = F.cmp(p, F.parse(res.deed.decimals)) === 0;
    setCompare({ same, paper: p });
    api.recordVerification(res.deed.no, same ? "genuine" : "altered").catch(() => {});
  }

  const deed = res?.found ? res.deed : null;
  const plot = deed && state.plots[deed.plot];
  const official = deed && F.display(deed.decimals);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-tight font-bold text-balance">{tr("দলিল আসল কি না যাচাই করুন", "Check if a deed is genuine")}</h1>
        <p className="text-muted-foreground">{tr("দলিলের কিউআর স্ক্যান করুন অথবা দলিল নম্বর লিখুন।", "Scan the QR code on the deed, or type the deed number.")}</p>
      </div>

      {scanning ? (
        <Scanner onResult={onScan} onClose={() => setScanning(false)} />
      ) : (
        <Button size="lg" className="h-14 w-full text-base" onClick={() => setScanning(true)}>
          <CameraIcon data-icon="inline-start" />
          {tr("কিউআর স্ক্যান করুন", "Scan QR code")}
        </Button>
      )}

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Separator className="flex-1" />
        {tr("অথবা", "or")}
        <Separator className="flex-1" />
      </div>

      <form onSubmit={searchByNumber}>
        <Field>
          <FieldLabel htmlFor="cd-no">{tr("দলিল নম্বর", "Deed number")}</FieldLabel>
          <InputGroup>
            <InputGroupInput id="cd-no" className="num" value={deedNo} onChange={(e) => setDeedNo(e.target.value)} placeholder={tr("যেমন ২০২৬-০১৪৭", "e.g. 2026-0147")} autoComplete="off" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="secondary" size="sm" className="h-8">
                <SearchIcon data-icon="inline-start" />
                {tr("খুঁজুন", "Find")}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </form>

      {!lookup && !scanning && (
        <ol className="flex flex-col gap-2" aria-label={tr("কীভাবে যাচাই করবেন", "How to check")}>
          {[
            [tr("কিউআর স্ক্যান করুন", "Scan the QR"), tr("দলিলের কিউআর কোডে ক্যামেরা ধরুন, অথবা দলিল নম্বর লিখুন।", "Point the camera at the deed's QR code, or type the deed number.")],
            [tr("শতাংশ মিলিয়ে দেখুন", "Compare the decimals"), tr("কাগজে লেখা শতাংশ লিখলে সরকারি রেকর্ডের সঙ্গে মেলানো হবে।", "Type the decimals written on the paper and they are compared with the official record.")],
            [tr("না মিললে টাকা দেবেন না", "If it doesn't match, don't pay"), tr("মিল না থাকলে দলিলটি বদলানো বা জাল হতে পারে।", "A mismatch means the deed may be altered or fake.")],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">{tr.num(i + 1)}</span>
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {lookup && !res.found && (
        <Alert variant="warning">
          <FileSearchIcon />
          <AlertTitle>{tr(`দলিল ${tr.num(lookup.no)} এই রেজিস্টারে নেই`, `Deed ${lookup.no} is not in this register`)}</AlertTitle>
          <AlertDescription>
            {tr(
              "নম্বরটি ঠিক আছে কি না দেখুন। দলিলটি সদ্য নিবন্ধিত হলে অফিসার পোর্টালের \"ফোনে সিঙ্ক\" কিউআর স্ক্যান করে নতুন দলিলগুলো এই ফোনে আনুন।",
              "Check the number. If the deed was just registered, scan the \"Sync to phone\" QR in the Officer Portal to bring new deeds to this phone."
            )}
          </AlertDescription>
        </Alert>
      )}

      {deed && res.qrMatches === false && (
        <Card className="gap-0 py-0 ring-destructive/40" aria-live="polite">
          <Verdict ok={false} title={tr("জাল কিউআর", "Fake QR code")} subtitle={tr("কিউআর-এর ডিজিটাল ছাপ সরকারি রেকর্ডের সঙ্গে মেলেনি", "The QR's fingerprint does not match the official record")} />
          <CardContent className="py-4">{tr("এই কাগজের তথ্য বিশ্বাস করবেন না। নিচে সরকারি রেকর্ডে দলিলটি কেমন আছে তা দেখুন।", "Don't trust this paper. The official record of the deed is shown below.")}</CardContent>
        </Card>
      )}

      {deed && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-muted-foreground">{tr("সরকারি রেকর্ড", "Official record")}</p>
            <CardTitle className="num text-xl">{tr.num(deed.no)}</CardTitle>
            {res.qrMatches === true && (
              <CardAction>
                <Badge variant="success">
                  <ShieldCheckIcon data-icon="inline-start" />
                  {tr("কিউআর মিলেছে", "QR matches")}
                </Badge>
              </CardAction>
            )}
            {res.qrMatches === false && (
              <CardAction>
                <Badge variant="destructive">
                  <ShieldXIcon data-icon="inline-start" />
                  {tr("কিউআর মেলেনি", "QR mismatch")}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
              <dt className="text-muted-foreground">{tr("দাতা", "Seller")}</dt>
              <dd className="font-semibold">{tr.pick(state.people[deed.seller])}</dd>
              <dt className="text-muted-foreground">{tr("গ্রহীতা", "Buyer")}</dt>
              <dd className="font-semibold">{tr.pick(state.people[deed.buyer])}</dd>
              <dt className="text-muted-foreground">{tr("জমি", "Land")}</dt>
              <dd className="font-semibold">
                {tr("দাগ", "Dag")} {tr.num(plot.dag)}, {tr.pick(plot.mouza)}
              </dd>
              <dt className="text-muted-foreground">{tr("পরিমাণ", "Amount")}</dt>
              <dd className="num text-lg font-semibold">
                {tr.num(official)} {tr("শতাংশ", "decimals")}
              </dd>
              <dt className="text-muted-foreground">{tr("তারিখ", "Date")}</dt>
              <dd>{tr.date(deed.date)}</dd>
            </dl>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="group -ml-3 text-muted-foreground">
                  {tr("ডিজিটাল ছাপ দেখুন", "Show digital fingerprint")}
                  <ChevronDownIcon data-icon="inline-end" className="transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Fingerprint hash={res.recomputed} className="mt-1 block rounded-lg bg-muted p-3 text-muted-foreground" />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {deed && res.qrMatches !== false && !compare && (
        <Card>
          <CardHeader>
            <CardTitle>{tr("হাতের কাগজ মিলিয়ে দেখুন", "Compare the paper in your hand")}</CardTitle>
            <CardDescription>{tr("কাগজে লেখা পরিমাণ সরকারি রেকর্ডের সঙ্গে মেলে কি না দেখুন।", "See whether the amount on the paper matches the official record.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={comparePaper}>
              <Field>
                <FieldLabel htmlFor="cd-paper">{tr("আপনার হাতের কাগজে কত শতাংশ লেখা আছে?", "How many decimals does the paper say?")}</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="cd-paper" className="num text-lg" inputMode="decimal" value={paper} onChange={(e) => setPaper(e.target.value)} placeholder={tr("যেমন ২০", "e.g. 20")} autoComplete="off" />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{tr("শতাংশ", "decimals")}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>{tr("নাম ও দাগ নম্বরও ওপরের সরকারি রেকর্ডের সঙ্গে মিলিয়ে নিন।", "Also compare the names and dag number with the official record above.")}</FieldDescription>
              </Field>
              <Button type="submit" size="lg" className="mt-4 w-full">
                {tr("মিলিয়ে দেখুন", "Compare")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {compare && (
        <Card className={cn("gap-0 py-0", compare.same ? "ring-success/40" : "ring-destructive/40")} aria-live="polite">
          <Verdict
            ok={compare.same}
            title={compare.same ? tr("আসল কপি", "Genuine copy") : tr("বদলানো কপি", "Altered copy")}
            subtitle={compare.same ? tr("কাগজ সরকারি রেকর্ডের সঙ্গে মিলেছে", "The paper matches the official record") : tr("কাগজ সরকারি রেকর্ডের সঙ্গে মেলেনি", "The paper does not match the official record")}
          />
          <div className="grid grid-cols-2 divide-x">
            <div className="flex flex-col gap-0.5 p-5">
              <div className="text-sm text-muted-foreground">{tr("সরকারি রেকর্ড", "Official record")}</div>
              <div className="num text-3xl font-semibold">{tr.num(official)}</div>
              <div className="text-sm text-muted-foreground">{tr("শতাংশ", "decimals")}</div>
            </div>
            <div className="flex flex-col gap-0.5 p-5">
              <div className="text-sm text-muted-foreground">{tr("এই কপিতে লেখা", "This copy says")}</div>
              <div className={cn("num text-3xl font-semibold", !compare.same && "text-destructive line-through decoration-2")}>{tr.num(F.display(compare.paper))}</div>
              <div className="text-sm text-muted-foreground">{tr("শতাংশ", "decimals")}</div>
            </div>
          </div>
          <CardFooter className="flex-col gap-2">
            <ReadAloudButton
              size="lg"
              className="w-full"
              text={
                compare.same
                  ? tr(`দলিল ${deed.no} আসল। সরকারি রেকর্ডে ${official} শতাংশ।`, `Deed ${deed.no} is genuine. The official record says ${official} decimals.`)
                  : tr(`সাবধান। এই দলিলের কপি বদলানো। সরকারি রেকর্ডে ${official} শতাংশ, কিন্তু কাগজে ${F.display(compare.paper)} শতাংশ।`, `Warning. This copy of the deed is altered. The official record says ${official} decimals, but the paper says ${F.display(compare.paper)}.`)
              }
            />
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setCompare(null);
                setPaper("");
              }}
            >
              <RotateCcwIcon data-icon="inline-start" />
              {tr("আরেকটি কাগজ মিলিয়ে দেখুন", "Compare another paper")}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
