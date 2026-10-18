"use client";
import { MapPinIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/store";
import { MOUZAS } from "@/lib/seed";
import { Button } from "@/components/ui/button";

/** The area picker in the top bar decides which area's work an officer is looking at.
 *  This bar says so out loud, and gives the one-click way back to the whole register. */
export function AreaScope({ all, setAll, shown, total, noun }) {
  const tr = useT();
  const { area } = usePrefs();
  const mouza = MOUZAS[area] || MOUZAS.Rampur;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-card px-4 py-3 text-sm">
      <MapPinIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="min-w-0">
        <span className="font-semibold">{all ? tr("সব এলাকা", "All areas") : tr(`এলাকা: ${mouza.bn}`, `Area: ${mouza.en}`)}</span>
        <span className="text-muted-foreground">
          {" · "}
          {tr(`${tr.num(shown)} / ${tr.num(total)} ${tr.pick(noun)} দেখানো হচ্ছে`, `Showing ${shown} of ${total} ${tr.pick(noun)}`)}
        </span>
      </p>
      <Button variant="outline" size="sm" className="ml-auto" onClick={() => setAll(!all)}>
        {all ? tr("শুধু এই এলাকা", "This area only") : tr("সব এলাকা দেখুন", "Show all areas")}
      </Button>
    </div>
  );
}

/** True when a plot of this register belongs to the area in view. */
export const inArea = (state, plotId, area) => !!plotId && state.plots[plotId]?.mouza.en === area;
