"use client";

import { usePrefs } from "./store";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const toBnDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

export function useT() {
  const { lang } = usePrefs();
  const bn = lang === "bn";
  const tr = (b, e) => (bn ? b : e);
  tr.lang = lang;
  tr.bn = bn;
  tr.pick = (obj) => (obj ? (bn ? obj.bn : obj.en) : "");
  tr.num = (s) => (bn ? toBnDigits(s) : String(s));
  tr.date = (iso) => {
    const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    return d.toLocaleDateString(bn ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  };
  tr.time = (iso) =>
    new Date(iso).toLocaleString(bn ? "bn-BD" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return tr;
}
