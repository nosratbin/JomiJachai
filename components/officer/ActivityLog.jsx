"use client";
import { ShieldCheckIcon, ShieldAlertIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useRegister } from "@/lib/api";
import { verifyLogChain, officerName } from "@/lib/register";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, GREEN_HEAD } from "../brand";

const RESULT = {
  approved: ["success", "অনুমোদিত", "Approved"],
  passed: ["success", "যাচাই পাস", "Checks passed"],
  blocked: ["destructive", "আটকানো", "Blocked"],
  warning: ["warning", "সতর্কতা", "Warning"],
  genuine: ["success", "আসল", "Genuine"],
  altered: ["destructive", "বদলানো", "Altered"],
  mismatch: ["destructive", "মেলেনি", "No match"],
  info: ["secondary", "তথ্য", "Info"],
};

export default function ActivityLog() {
  const tr = useT();
  const state = useRegister();
  const chain = verifyLogChain(state.log);
  const who = (u) => {
    const o = officerName(u);
    if (o) return tr.pick(o).split(",")[0];
    return { citizen: tr("নাগরিক অ্যাপ", "Citizen App"), system: tr("সিস্টেম", "System"), sync: tr("সিঙ্ক", "Sync") }[u] || u;
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tr("কার্যলিপি", "Activity log")}
        description={tr(
          "প্রতিটি যাচাই, অনুমোদন ও আটকানো চেষ্টা, কে কখন করেছেন তাসহ। কার্যলিপিতে শুধু নতুন লাইন যোগ হয়; পুরোনো লাইন বদলানো, অপসারণ কিংবা বাতিল করা যায় না।",
          "Every check, approval and blocked attempt, with who did it and when. New lines can only be added; old lines cannot be edited or deleted."
        )}
      />
      <Alert variant={chain.ok ? "success" : "destructive"}>
        {chain.ok ? <ShieldCheckIcon /> : <ShieldAlertIcon />}
        <AlertTitle>{chain.ok ? tr("কার্যলিপির শিকল অক্ষত", "Log chain intact") : tr(`কার্যলিপি বদলানো হয়েছে (লাইন ${tr.num(chain.brokenAt)})`, `Log was changed (line ${chain.brokenAt})`)}</AlertTitle>
        <AlertDescription>
          {tr("প্রতিটি লাইনের SHA-256 ছাপ আগের লাইনের ছাপের সঙ্গে যুক্ত, তাই মাঝখানের কোনো লাইন বদলালে শিকল ভেঙে যায়।", "Each line's SHA-256 fingerprint includes the previous line's, so changing any line breaks the chain.")}
        </AlertDescription>
      </Alert>
      <Card className="py-0">
        <Table className="min-w-[760px]">
          <TableHeader className={GREEN_HEAD}>
            <TableRow className={GREEN_HEAD}>
              <TableHead className="pl-5">#</TableHead>
              <TableHead>{tr("সময়", "Time")}</TableHead>
              <TableHead>{tr("কে", "Who")}</TableHead>
              <TableHead>{tr("ফল", "Result")}</TableHead>
              <TableHead>{tr("বিবরণ", "Details")}</TableHead>
              <TableHead className="pr-5">{tr("ছাপ", "Hash")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...state.log].reverse().map((e) => {
              const [variant, bn, en] = RESULT[e.result] || RESULT.info;
              return (
                <TableRow key={e.seq} className="align-top">
                  <TableCell className="num pl-5 text-muted-foreground">{tr.num(e.seq)}</TableCell>
                  <TableCell className="text-sm">{tr.time(e.time)}</TableCell>
                  <TableCell className="text-sm">{who(e.user)}</TableCell>
                  <TableCell>
                    <Badge variant={variant}>{tr(bn, en)}</Badge>
                  </TableCell>
                  <TableCell className="min-w-[18rem] whitespace-normal">{tr.num(tr.pick(e.text))}</TableCell>
                  <TableCell className="mono pr-5 text-xs text-muted-foreground">{e.hash.slice(0, 8)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
