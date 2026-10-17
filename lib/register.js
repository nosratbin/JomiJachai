import * as F from "./fraction";
import { sha256, sha256Sync } from "./sha256";
import { PEOPLE, PLOTS, SHARES, SEED_DEEDS, SEED_APPLICATIONS, SEED_VERIFICATIONS, FIRST_NEW_DEED, OFFICERS } from "./seed";

export const STATE_VERSION = 6;
const DAY = 24 * 60 * 60 * 1000;

export function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);

export function fingerprintText(deed, state) {
  const plot = state.plots[deed.plot];
  return [
    deed.no,
    plot.mouza.en,
    `JL ${plot.jl}`,
    `Dag ${plot.dag}`,
    state.people[deed.seller].en,
    state.people[deed.buyer].en,
    F.toKey(F.parse(deed.decimals)),
    deed.date,
  ].join("|");
}

function logEntryText(e) {
  return JSON.stringify([e.seq, e.time, e.user, e.kind, e.result, e.plot || "", e.deed || "", e.text?.en || ""]);
}
function appendLog(state, entry) {
  const prev = state.log.length ? state.log[state.log.length - 1].hash : "0".repeat(64);
  const e = { seq: state.log.length + 1, time: new Date().toISOString(), ...entry };
  e.prev = prev;
  e.hash = sha256Sync(prev + logEntryText(e));
  return { ...state, log: [...state.log, e] };
}
export function verifyLogChain(log) {
  let prev = "0".repeat(64);
  for (const e of log) {
    if (e.prev !== prev || sha256Sync(prev + logEntryText(e)) !== e.hash) return { ok: false, brokenAt: e.seq };
    prev = e.hash;
  }
  return { ok: true };
}

export function createInitialState(now = new Date()) {
  let state = {
    version: STATE_VERSION,
    createdAt: now.toISOString(),
    people: JSON.parse(JSON.stringify(PEOPLE)),
    plots: JSON.parse(JSON.stringify(PLOTS)),
    shares: Object.fromEntries(
      Object.entries(SHARES).map(([plot, s]) => [plot, Object.fromEntries(Object.entries(s).map(([p, v]) => [p, F.toKey(F.parse(v))]))])
    ),
    deeds: [],
    log: [],
    nextDeed: FIRST_NEW_DEED,
    seedDeedCount: SEED_DEEDS.length,
  };
  const dayStart = (daysAgo) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 10, (daysAgo * 53) % 330).getTime();
  const events = [
    ...SEED_DEEDS.map((x) => ({ kind: "deed", x })),
    ...SEED_APPLICATIONS.map((x) => ({ kind: "application", x })),
    ...SEED_VERIFICATIONS.map((x) => ({ kind: "verification", x })),
  ].sort((a, b) => b.x.daysAgo - a.x.daysAgo);
  const first = events.length ? events[0].x.daysAgo + 1 : 0;
  state = appendLog(state, {
    time: new Date(dayStart(first)).toISOString(),
    user: "system",
    kind: "seed",
    result: "info",
    text: { bn: "ভূমি রেজিস্টার চালু হলো", en: "Land register started" },
  });
  let lastDay = -1;
  let n = 0;
  for (const { kind, x } of events) {
    n = x.daysAgo === lastDay ? n + 1 : 0;
    lastDay = x.daysAgo;
    const at = (k) => new Date(dayStart(x.daysAgo) + (n * 3 + k) * 7 * 60 * 1000).toISOString();
    const day = dateKey(new Date(dayStart(x.daysAgo)));
    if (kind === "deed") {
      const deed = { no: x.no, plot: x.plot, seller: x.seller, buyer: x.buyer, decimals: F.toKey(F.parse(x.decimals)), date: day, officer: x.officer };
      deed.fingerprint = sha256Sync(fingerprintText(deed, state));
      state = { ...state, deeds: [...state.deeds, deed] };
      const plot = state.plots[x.plot];
      const [s, b, q] = [state.people[x.seller], state.people[x.buyer], F.display(F.parse(x.decimals))];
      state = appendLog(state, { time: at(0), user: x.officer, kind: "check", result: "passed", plot: x.plot, text: { bn: `যাচাই পাস: ${s.bn}, দাগ ${plot.dag}, ${q} শতাংশ`, en: `Checks passed: ${s.en}, Dag ${plot.dag}, ${q} decimals` } });
      state = appendLog(state, {
        time: at(1),
        user: x.officer,
        kind: "register",
        result: "approved",
        plot: x.plot,
        deed: x.no,
        text: { bn: `দলিল ${x.no} নিবন্ধিত: ${s.bn} → ${b.bn}, দাগ ${plot.dag}, ${q} শতাংশ`, en: `Deed ${x.no} registered: ${s.en} → ${b.en}, Dag ${plot.dag}, ${q} decimals` },
      });
    } else if (kind === "application") {
      const input = { plot: x.plot, seller: x.seller, decimals: x.decimals };
      state = logCheck(state, input, checkSale(state, input, day), x.officer, at(0));
    } else {
      state = logVerification(state, x.deed, x.result, "citizen", at(0));
    }
  }
  return state;
}

// ---- Lookups ----
export const ownersOf = (state, plotId) =>
  Object.entries(state.shares[plotId] || {})
    .map(([person, share]) => ({ person, share: F.parse(share) }))
    .filter((o) => !F.isZero(o.share))
    .sort((a, b) => F.cmp(b.share, a.share));

export const shareOf = (state, plotId, person) => F.parse(state.shares[plotId]?.[person] || "0");

export function findPerson(state, name) {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return null;
  return Object.entries(state.people).find(([, p]) => p.bn.toLowerCase() === n || p.en.toLowerCase() === n)?.[0] || null;
}

export function lastAcquisition(state, plotId, person) {
  const deeds = state.deeds.filter((d) => d.plot === plotId && d.buyer === person);
  return deeds.length ? deeds[deeds.length - 1] : null;
}

export function plotTotalCheck(state, plotId) {
  return F.cmp(F.sum(Object.values(state.shares[plotId] || {})), F.parse(state.plots[plotId].total)) === 0;
}

export function checkSale(state, { plot: plotId, seller, decimals }, today = dateKey()) {
  const plot = state.plots[plotId];
  const qty = F.parse(decimals);
  const owned = shareOf(state, plotId, seller);
  const fmt = (f) => F.display(f);
  const rules = [];

  const isOwner = !F.isZero(owned);
  rules.push({
    id: 1,
    status: isOwner ? "pass" : "fail",
    title: { bn: "বিক্রেতা এই দাগের রেকর্ডভুক্ত মালিক", en: "Seller is a recorded owner of this dag" },
    detail: isOwner
      ? { bn: `রেজিস্টারে মালিক হিসেবে আছেন`, en: "Listed as an owner in the register" }
      : { bn: "এই দাগের মালিকের তালিকায় বিক্রেতার নাম নেই", en: "The seller is not on this dag's list of owners" },
  });

  const enough = qty && F.cmp(qty, owned) <= 0;
  rules.push({
    id: 2,
    status: enough ? "pass" : "fail",
    title: { bn: "বিক্রির শতাংশ ≤ বিক্রেতার অবশিষ্ট অংশ", en: "Decimals sold ≤ seller's remaining share" },
    detail: enough
      ? { bn: `${fmt(qty)} শতাংশ বিক্রি, আছে ${fmt(owned)}`, en: `Sells ${fmt(qty)}, owns ${fmt(owned)}` }
      : { bn: `${fmt(qty)} শতাংশ বিক্রি করছেন, কিন্তু আছে মাত্র ${fmt(owned)}`, en: `Sells ${fmt(qty)}, owns only ${fmt(owned)}` },
  });

  const cc = plot.flags.courtCase;
  rules.push({
    id: 3,
    status: cc ? "fail" : "pass",
    title: { bn: "জমিতে কোনো চলমান মামলা নেই", en: "No open court case on the plot" },
    detail: cc || { bn: "কোনো মামলা নথিভুক্ত নেই", en: "No case on record" },
  });

  const ka = plot.flags.khas || plot.flags.acquisition;
  rules.push({
    id: 4,
    status: ka ? "fail" : "pass",
    title: { bn: "খাস জমি নয়, অধিগ্রহণাধীনও নয়", en: "Not khas land and not under acquisition" },
    detail: ka || { bn: "ব্যক্তিমালিকানাধীন জমি", en: "Privately owned land" },
  });

  const mg = plot.flags.mortgage;
  rules.push({
    id: 5,
    status: mg ? "warn" : "pass",
    title: { bn: "ব্যাংকে বন্ধক নেই", en: "Not mortgaged to a bank" },
    detail: mg || { bn: "কোনো বন্ধক নথিভুক্ত নেই", en: "No mortgage on record" },
  });

  const last = lastAcquisition(state, plotId, seller);
  const age = last ? daysBetween(last.date, today) : null;
  const flip = last && age <= 30;
  rules.push({
    id: 6,
    status: flip ? "warn" : "pass",
    title: { bn: "৩০ দিনের মধ্যে আবার বিক্রি নয়", en: "Not resold within 30 days" },
    detail: flip
      ? { bn: `বিক্রেতা ${age} দিন আগে দলিল ${last.no} মূলে কিনেছেন`, en: `Seller bought this ${age} days ago (deed ${last.no})` }
      : { bn: "সাম্প্রতিক কোনো কেনা নেই", en: "No recent purchase" },
  });

  const verdict = rules.some((r) => r.status === "fail") ? "blocked" : rules.some((r) => r.status === "warn") ? "warning" : "clear";
  return { rules, verdict, owned, qty };
}

// ---- Actions ----
export function logCheck(state, input, check, officer, time) {
  const plot = state.plots[input.plot];
  const sellerName = state.people[input.seller] || { bn: input.seller, en: input.seller };
  const failed = check.rules.filter((r) => r.status === "fail");
  const text =
    check.verdict === "blocked"
      ? {
          bn: `আটকানো হয়েছে: ${sellerName.bn}, দাগ ${plot.dag}, ${F.display(check.qty)} শতাংশ। কারণ: ${failed.map((r) => r.detail.bn).join("; ")}`,
          en: `Blocked: ${sellerName.en}, Dag ${plot.dag}, ${F.display(check.qty)} decimals. Reason: ${failed.map((r) => r.detail.en).join("; ")}`,
        }
      : {
          bn: `যাচাই পাস: ${sellerName.bn}, দাগ ${plot.dag}, ${F.display(check.qty)} শতাংশ${check.verdict === "warning" ? " (সতর্কতাসহ)" : ""}`,
          en: `Checks passed: ${sellerName.en}, Dag ${plot.dag}, ${F.display(check.qty)} decimals${check.verdict === "warning" ? " (with warnings)" : ""}`,
        };
  return appendLog(state, { ...(time && { time }), user: officer, kind: "check", result: check.verdict === "blocked" ? "blocked" : check.verdict === "warning" ? "warning" : "passed", plot: input.plot, text });
}

function ensurePerson(state, name) {
  const existing = findPerson(state, name);
  if (existing) return [state, existing];
  const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const clean = String(name).trim();
  return [{ ...state, people: { ...state.people, [id]: { bn: clean, en: clean } } }, id];
}

function applyTransfer(state, plotId, seller, buyer, qty) {
  const s = { ...state.shares[plotId] };
  s[seller] = F.toKey(F.sub(F.parse(s[seller] || "0"), qty));
  s[buyer] = F.toKey(F.add(F.parse(s[buyer] || "0"), qty));
  if (F.isZero(F.parse(s[seller]))) delete s[seller];
  return { ...state, shares: { ...state.shares, [plotId]: s } };
}

export async function registerSale(state, input, officer, today = dateKey()) {
  const check = checkSale(state, input, today);
  if (check.verdict === "blocked") throw new Error("Sale is blocked");
  let buyer;
  [state, buyer] = ensurePerson(state, input.buyerName);
  if (buyer === input.seller) throw new Error("Buyer and seller are the same person");
  const deed = {
    no: `2026-${String(state.nextDeed).padStart(4, "0")}`,
    plot: input.plot,
    seller: input.seller,
    buyer,
    decimals: F.toKey(check.qty),
    date: today,
    officer,
  };
  deed.fingerprint = await sha256(fingerprintText(deed, state));
  state = applyTransfer(state, input.plot, input.seller, buyer, check.qty);
  state = { ...state, deeds: [...state.deeds, deed], nextDeed: state.nextDeed + 1 };
  const plot = state.plots[input.plot];
  state = appendLog(state, {
    user: officer,
    kind: "register",
    result: "approved",
    plot: input.plot,
    deed: deed.no,
    text: {
      bn: `দলিল ${deed.no} নিবন্ধিত: ${state.people[input.seller].bn} → ${state.people[buyer].bn}, দাগ ${plot.dag}, ${F.display(check.qty)} শতাংশ`,
      en: `Deed ${deed.no} registered: ${state.people[input.seller].en} → ${state.people[buyer].en}, Dag ${plot.dag}, ${F.display(check.qty)} decimals`,
    },
  });
  return { state, deed };
}

// ---- Deed verification (QR) ----
export function verifyDeed(state, deedNo, qrHash) {
  const deed = state.deeds.find((d) => d.no === deedNo);
  if (!deed) return { found: false };
  const recomputed = sha256Sync(fingerprintText(deed, state));
  const recordIntact = recomputed === deed.fingerprint;
  const qrMatches = qrHash ? qrHash.toLowerCase() === recomputed : null;
  return { found: true, deed, recomputed, recordIntact, qrMatches };
}

export function logVerification(state, deedNo, result, who = "citizen", time) {
  return appendLog(state, {
    ...(time && { time }),
    user: who,
    kind: "verify",
    result,
    deed: deedNo,
    text:
      result === "genuine"
        ? { bn: `দলিল ${deedNo} যাচাই: আসল`, en: `Deed ${deedNo} verified: genuine` }
        : result === "altered"
        ? { bn: `দলিল ${deedNo} যাচাই: বদলানো কপি ধরা পড়েছে`, en: `Deed ${deedNo} checked: altered copy detected` }
        : { bn: `দলিল ${deedNo} যাচাই: কিউআর রেকর্ডের সঙ্গে মেলেনি`, en: `Deed ${deedNo} checked: QR does not match the record` },
  });
}

// ---- Citizen: one-word answer for a plot ----
export function plotStatus(state, plotId, today = dateKey()) {
  const plot = state.plots[plotId];
  const owners = ownersOf(state, plotId);
  const reasons = [];
  const cc = plot.flags.courtCase;
  if (cc) reasons.push({ level: "risky", bn: `এই জমিতে চলমান মামলা আছে (${cc.bn})`, en: `Open court case on this plot (${cc.en})` });
  if (plot.flags.khas) reasons.push({ level: "risky", bn: "এটি সরকারি খাস জমি; কেউ ব্যক্তিগতভাবে বিক্রি করতে পারেন না", en: "This is government khas land; no private person can sell it" });
  if (plot.flags.acquisition) reasons.push({ level: "risky", bn: `জমিটি সরকারি অধিগ্রহণাধীন (${plot.flags.acquisition.bn})`, en: `The plot is under government acquisition (${plot.flags.acquisition.en})` });
  if (plot.flags.mortgage) reasons.push({ level: "careful", bn: "জমিটি ব্যাংকে বন্ধক আছে; ঋণ শোধের প্রমাণ দেখে নিন", en: "The plot is mortgaged to a bank; ask for proof the loan is repaid" });
  const recent = state.deeds.filter((d) => d.plot === plotId && daysBetween(d.date, today) <= 30);
  if (recent.length) reasons.push({ level: "careful", bn: `গত ৩০ দিনে এই জমির অংশ বিক্রি হয়েছে (দলিল ${recent.map((d) => d.no).join(", ")})`, en: `Part of this plot was sold in the last 30 days (deed ${recent.map((d) => d.no).join(", ")})` });
  if (owners.length > 1) reasons.push({ level: "careful", bn: `${owners.length} জন শরিক; আপনি অবিভক্ত অংশ কিনবেন, আর শরিকদের অগ্রক্রয়ের অধিকার থাকতে পারে`, en: `${owners.length} co-owners; you would buy an undivided share, and co-owners may have a pre-emption right` });
  const level = reasons.some((r) => r.level === "risky") ? "risky" : reasons.some((r) => r.level === "careful") ? "careful" : "safe";
  if (level === "safe") reasons.push({ level: "safe", bn: "কোনো মামলা, বন্ধক বা সরকারি দাবি নথিভুক্ত নেই", en: "No court case, mortgage or government claim on record" });
  return { level, reasons, owners };
}

export function exportSync(state) {
  const deeds = state.deeds.slice(state.seedDeedCount).map((d) => [d.no, d.plot, d.seller, state.people[d.buyer].bn, state.people[d.buyer].en, d.decimals, d.date, d.officer]);
  const json = JSON.stringify(deeds);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function importSync(state, payload) {
  const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  const rows = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  let added = 0;
  for (const [no, plot, seller, buyerBn, buyerEn, decimals, date, officer] of rows) {
    if (state.deeds.some((d) => d.no === no)) continue;
    let buyer = findPerson(state, buyerEn) || findPerson(state, buyerBn);
    if (!buyer) {
      buyer = "p" + Math.random().toString(36).slice(2, 9);
      state = { ...state, people: { ...state.people, [buyer]: { bn: buyerBn, en: buyerEn } } };
    }
    const deed = { no, plot, seller, buyer, decimals, date, officer };
    deed.fingerprint = sha256Sync(fingerprintText(deed, state));
    state = applyTransfer(state, plot, seller, buyer, F.parse(decimals));
    state = { ...state, deeds: [...state.deeds, deed], nextDeed: Math.max(state.nextDeed, parseInt(no.split("-")[1], 10) + 1) };
    added++;
  }
  if (added)
    state = appendLog(state, { user: "sync", kind: "sync", result: "info", text: { bn: `অফিসার পোর্টাল থেকে ${added}টি দলিল যুক্ত হলো`, en: `${added} deed(s) copied from the Officer Portal` } });
  return { state, added };
}

export const officerName = (id) => OFFICERS.find((o) => o.id === id);
