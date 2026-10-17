"use client";
import { SearchIcon, ScanQrCodeIcon, UsersIcon, SmartphoneIcon, LandmarkIcon, LockIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { go } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResetButton, BackendBadge } from "../brand";

export default function Help() {
  const tr = useT();
  const items = [
    [
      SearchIcon,
      tr("জমি কেনার আগে", "Before you buy land"),
      tr("দাগ নম্বর দিয়ে খুঁজুন। সবুজ মানে নিরাপদ, হলুদ মানে সতর্ক থাকুন, লাল মানে ঝুঁকিপূর্ণ।", "Search by dag number. Green means safe, yellow means be careful, red means risky."),
    ],
    [
      ScanQrCodeIcon,
      tr("দলিল হাতে পেলে", "When you get a deed"),
      tr("দলিলের কিউআর স্ক্যান করুন, তারপর কাগজের শতাংশ সরকারি রেকর্ডের সঙ্গে মিলিয়ে দেখুন। না মিললে টাকা দেবেন না।", "Scan the deed's QR, then compare the decimals on the paper with the official record. If they don't match, don't pay."),
    ],
    [
      UsersIcon,
      tr("স্মার্টফোন নেই?", "No smartphone?"),
      tr("পরের ধাপে ইউনিয়ন ডিজিটাল সেন্টারের উদ্যোক্তা আপনার হয়ে যাচাই করবেন", "In the next phase, the Union Digital Centre operator will check for you."),
    ],
    [
      SmartphoneIcon,
      tr("অ্যাপ হিসেবে রাখুন", "Keep it as an app"),
      tr("ক্রোম ব্রাউজারের মেনু (⋮) থেকে \"হোম স্ক্রিনে যোগ করুন\" চাপুন। প্লে স্টোর লাগবে না।", "In Chrome, open the menu (⋮) and tap \"Add to Home screen\". No Play Store needed."),
    ],
  ];
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl leading-tight font-bold text-balance">{tr("কীভাবে ব্যবহার করবেন", "How to use it")}</h1>
      <Accordion type="single" collapsible defaultValue="0" className="flex flex-col gap-2">
        {items.map(([Icon, h, p], i) => (
          <AccordionItem key={h} value={String(i)} className="overflow-hidden rounded-md border-0 bg-card">
            <AccordionTrigger className="bg-brand px-4 py-3.5 text-base font-semibold text-brand-foreground hover:no-underline data-[state=open]:bg-brand-strong [&>svg]:text-brand-foreground">
              <span className="flex items-center gap-3">
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {h}
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-3 text-base">{p}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Alert className="bg-card">
        <LockIcon />
        <AlertTitle>{tr("আপনার তথ্য", "Your information")}</AlertTitle>
        <AlertDescription>
          {tr("নাগরিকেরা জমির অবস্থা ও মালিকের নাম দেখেন। জাতীয় পরিচয়পত্র ও ফোন নম্বর শুধু অনুমোদিত কর্মকর্তারা দেখেন।", "Citizens see a plot's status and owners' names. NID and phone numbers are shown only to authorised officers.")}
        </AlertDescription>
      </Alert>
      <BackendBadge className="text-muted-foreground" />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="bg-card" onClick={() => go("officer")}>
          <LandmarkIcon data-icon="inline-start" />
          {tr("অফিসার পোর্টাল", "Officer Portal")}
        </Button>
        <ResetButton variant="ghost" />
      </div>
    </div>
  );
}
