"use client";
import { DatabaseIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useRegister, useBackend } from "@/lib/api";
import { exportSync } from "@/lib/register";
import { appBaseUrl, go } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, QR } from "../brand";

export default function SyncPhone() {
  const tr = useT();
  const state = useRegister();
  const { shared } = useBackend();
  const newDeeds = state.deeds.length - state.seedDeedCount;
  const link = `${appBaseUrl()}#s-${exportSync(state)}`;
  const steps = [
    tr("ফোনের ক্যামেরা দিয়ে কিউআর স্ক্যান করুন।", "Scan the QR with the phone's camera."),
    tr("লিংকটি খুললে নাগরিক অ্যাপে দলিলগুলো যোগ হবে।", "Open the link; the Citizen App adds the deeds."),
    tr("এবার যেকোনো দলিলের কিউআর স্ক্যান করে যাচাই করুন।", "Now scan any deed's QR to verify it."),
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tr("ফোনে সিঙ্ক", "Sync to phone")}
        description={tr(
          "শেয়ার করা অনলাইন ডেটাবেস চালু না থাকলে রেজিস্টার প্রতিটি ডিভাইসে আলাদাভাবে থাকে। এই কিউআর স্ক্যান করলে এই কম্পিউটারে নিবন্ধিত দলিলগুলো ফোনেও প্রদর্শিত হয়।",
          "When the shared online database is not switched on, each device keeps its own register. Scanning this QR copies the deeds registered on this computer to the phone."
        )}
      />
      {shared ? (
        <Card>
          <CardContent className="flex items-start gap-4">
            <DatabaseIcon className="mt-1 size-8 shrink-0 text-primary" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">{tr("শেয়ার করা ডেটাবেস চালু আছে", "The shared database is on")}</h2>
              <p>{tr("ল্যাপটপ আর ফোন একই Supabase ডেটাবেস দেখে। নতুন দলিল ফোনে নিজে থেকেই চলে যায়; সিঙ্ক কিউআর লাগবে না।", "The laptop and the phone read the same Supabase database. New deeds reach the phone by themselves; no sync QR is needed.")}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
            <QR text={newDeeds > 0 ? link : `${appBaseUrl()}#citizen`} size={232} />
            <div className="flex min-w-0 max-w-[44ch] flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Badge variant={newDeeds > 0 ? "success" : "secondary"} className="mb-1">
                  {newDeeds > 0 ? tr(`${tr.num(newDeeds)}টি নতুন দলিল`, `${newDeeds} new deed(s)`) : tr("এখনো নতুন দলিল নেই", "No new deeds yet")}
                </Badge>
                <h2 className="text-2xl font-bold">{newDeeds > 0 ? tr("ফোন দিয়ে এই কোডটি স্ক্যান করুন", "Scan this code with the phone") : tr("ফোনে নাগরিক অ্যাপ খুলুন", "Open the Citizen App on the phone")}</h2>
              </div>
              {newDeeds > 0 ? (
                <ol className="flex flex-col gap-3">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="num flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{tr.num(i + 1)}</span>
                      <span className="pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <>
                  <p>{tr("কোডটি স্ক্যান করলে ফোনে নাগরিক অ্যাপ খুলবে। এই কম্পিউটারে বিক্রি নিবন্ধন করলে এখানে নতুন কোড আসবে, যা নতুন দলিলগুলোও ফোনে নিয়ে যাবে।", "Scanning it opens the Citizen App on the phone. Register a sale on this computer and a new code appears here that also copies the new deeds to the phone.")}</p>
                  <Button className="w-fit" onClick={() => go("officer")}>
                    {tr("বিক্রি নিবন্ধন করুন", "Register a sale")}
                  </Button>
                </>
              )}
              {typeof window !== "undefined" && /^(localhost|127\.)/.test(window.location.hostname) && (
                <p className="text-sm text-muted-foreground">
                  {tr("এই কম্পিউটারের ঠিকানা (localhost) ফোন থেকে খোলে না; ফোনে স্ক্যান করতে Vercel-এর অনলাইন ঠিকানা থেকে এই পাতা খুলুন।", "This computer's address (localhost) can't be opened from a phone; open this page from the online Vercel address to scan it with a phone.")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
