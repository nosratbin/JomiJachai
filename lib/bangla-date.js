import { toBnDigits } from "./i18n";

const BN_MONTHS = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
const EN_MONTHS = ["Boishakh", "Joishtho", "Asharh", "Shrabon", "Bhadro", "Ashwin", "Kartik", "Ogrohayon", "Poush", "Magh", "Falgun", "Choitro"];
const BN_WEEKDAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const BN_GREG = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const DAY = 86400000;

export function banglaDate(d = new Date()) {
  const y = d.getFullYear();
  const today = Date.UTC(y, d.getMonth(), d.getDate());
  const startYear = today >= Date.UTC(y, 3, 14) ? y : y - 1; // 14 April
  let days = Math.round((today - Date.UTC(startYear, 3, 14)) / DAY);
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap(startYear + 1) ? 30 : 29, 30];
  let month = 0;
  while (days >= lengths[month]) days -= lengths[month++];
  return { day: days + 1, month, year: startYear - 593 };
}

export function dateLine(lang, d = new Date()) {
  const b = banglaDate(d);
  if (lang === "bn") {
    return `${BN_WEEKDAYS[d.getDay()]}, ${toBnDigits(b.day)} ${BN_MONTHS[b.month]} ${toBnDigits(b.year)}, ${toBnDigits(d.getDate())} ${BN_GREG[d.getMonth()]} ${toBnDigits(d.getFullYear())}`;
  }
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const greg = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `${weekday}, ${b.day} ${EN_MONTHS[b.month]} ${b.year} · ${greg}`;
}
