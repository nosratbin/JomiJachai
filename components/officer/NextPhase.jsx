"use client";
import { ShieldCheckIcon, MessageSquareIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PageHeader, GREEN_HEAD } from "../brand";

export default function NextPhase() {
  const tr = useT();
  const label = (
    <Badge variant="warning" className="mb-2">
      {tr("পরের ধাপ · এখনো চালু নয়", "Planned · not live yet")}
    </Badge>
  );
  const heirs = [
    [tr("স্ত্রী", "Wife"), tr("১/৮ (সন্তান থাকায়)", "1/8 (there are children)"), "5/40", "1.25"],
    [tr("ছেলে ১", "Son 1"), tr("বাকি ৭/৮-এর ২ ভাগ", "2 parts of the remaining 7/8"), "14/40", "3.5"],
    [tr("ছেলে ২", "Son 2"), tr("২ ভাগ", "2 parts"), "14/40", "3.5"],
    [tr("মেয়ে", "Daughter"), tr("১ ভাগ", "1 part"), "7/40", "1.75"],
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tr("পরের ধাপ", "Next phase")}
        description={tr("একই ভূমি রেজিস্টারের ওপর এই সুবিধাগুলো পরের ধাপে যোগ হবে; এগুলো এখনো চালু নয়, শুধু নকশা।", "These features come next, on the same land register. They are designs only and not live yet.")}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            {label}
            <CardTitle className="text-xl">{tr("উত্তরাধিকারের অংশীদারিত্ব রেকর্ড", "Inheritance shares on record")}</CardTitle>
            <CardDescription>
              {tr("ওয়ারিশ সনদ থেকে প্রত্যেক ওয়ারিশের অংশীদারিত্ব প্রস্তাব করে; কর্মকর্তা যাচাই করেন। উদাহরণ: দাগ ১১৮, ১০ শতাংশ, একজন পুরুষ মারা গেছেন; রেখে গেছেন স্ত্রী, দুই ছেলে, এক মেয়ে।", "Proposes each heir's share from the heir certificate; an officer verifies. Example: Dag 118, 10 decimals; a man dies leaving his wife, two sons and one daughter.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className={GREEN_HEAD}>
                <TableRow className={GREEN_HEAD}>
                  <TableHead>{tr("ওয়ারিশ", "Heir")}</TableHead>
                  <TableHead>{tr("নিয়ম", "Rule")}</TableHead>
                  <TableHead className="text-right">{tr("অংশ", "Share")}</TableHead>
                  <TableHead className="text-right">{tr("শতাংশ", "Decimals")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heirs.map(([h, r, s, d]) => (
                  <TableRow key={h}>
                    <TableCell className="font-semibold">{h}</TableCell>
                    <TableCell className="whitespace-normal">{r}</TableCell>
                    <TableCell className="num text-right">{tr.num(s)}</TableCell>
                    <TableCell className="num text-right">{tr.num(d)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            {tr("কোনো নারী মারা গেলে স্বামী পান ১/৪। জটিল ক্ষেত্র ও অন্য ধর্মের আইন কর্মকর্তার পর্যালোচনায় যায়।", "If a woman dies, her husband takes 1/4. Complex cases and other personal laws go to officer review.")}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            {label}
            <CardTitle className="text-xl">{tr("নামজারি নিজে থেকে শুরু", "Namjari starts automatically")}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ol className="relative flex flex-col gap-4">
              {[
                tr("যাচাই করা দলিল নিবন্ধিত হয়", "A checked deed is registered"),
                tr("নামজারি মামলা নিজে থেকে দাখিল হয়, ক্রেতাকে কিছু জমা দিতে হয় না", "The namjari case is filed automatically; the buyer submits nothing"),
                tr("ইউনিয়ন ভূমি সহকারী কর্মকর্তা যাচাই করেন", "The Union Land Assistant Officer verifies"),
                tr("এসি ল্যান্ড অনুমোদন করেন; নতুন খতিয়ান ও ডিসিআর", "AC Land approves; new khatian and DCR issued"),
              ].map((s, i, arr) => (
                <li key={i} className="relative flex gap-3">
                  {i < arr.length - 1 && <span className="absolute top-8 bottom-[-1rem] left-3.5 w-px bg-border" aria-hidden="true" />}
                  <span className="num relative flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{tr.num(i + 1)}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">{tr("প্রতিটি ধাপে ক্রেতা এসএমএস পান, আর সরকারি ফি আগেই দেখতে পান।", "The buyer gets an SMS at each step and sees the official fee up front.")}</CardFooter>
        </Card>

        <Card>
          <CardHeader>
            {label}
            <CardTitle className="text-xl">{tr("বিদ্যুৎ বিলের মতো ভূমি কর", "Land tax like a utility bill")}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="max-w-sm rounded-2xl rounded-bl-sm bg-muted p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquareIcon className="size-3.5" aria-hidden="true" />
                SMS · JomiJachai
              </div>
              <p className="mt-1.5">
                {tr(
                  "ভূমি উন্নয়ন কর ২০২৬-২৭: দাগ ১৫০, মৌজা রামপুর। পরিমাণ ৳৮০ (উদাহরণ)। বিকাশ, নগদ বা ব্যাংকে দিন। পরিশোধের পর কিউআরসহ ডিজিটাল দাখিলা পাবেন।",
                  "Land development tax 2026-27: Dag 150, mouza Rampur. Amount Tk 80 (example). Pay by bKash, Nagad or bank. You get a digital dakhila with a QR after payment."
                )}
              </p>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">{tr("বিল অংশের রেজিস্টার অনুসরণ করে, তাই বিক্রি বা উত্তরাধিকারের পর সঠিক মালিকের কাছে যায়।", "The bill follows the share register, so after a sale or inheritance it goes to the right owner.")}</CardFooter>
        </Card>

        <Card>
          <CardHeader>
            {label}
            <CardTitle className="text-xl">{tr("ইউনিয়ন ডিজিটাল সেন্টারে সাহায্য", "Help at Union Digital Centres")}</CardTitle>
            <CardDescription>
              {tr("স্মার্টফোন না থাকলে উদ্যোক্তা কাজটি করে দেন, তবে গ্রামবাসীর নিজের ফোনে আসা কোড (ওটিপি) দেওয়ার পরই।", "Without a smartphone, the centre's operator does it for the villager, but only after the villager gives the code (OTP) sent to their own phone.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3" aria-hidden="true">
            <InputOTP maxLength={6} value="481" disabled containerClassName="has-disabled:opacity-100">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="size-11 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <ShieldCheckIcon className="size-6 text-primary" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
