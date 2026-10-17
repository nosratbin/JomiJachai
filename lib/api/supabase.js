import { createInitialState, STATE_VERSION } from "../register";

const EMPTY = { people: {}, plots: {}, shares: {}, deeds: [], log: [] };

function must({ data, error }, what) {
  if (error) throw new Error(`Supabase (${what}): ${error.message}`);
  return data;
}

const deedRow = (d) => ({ no: d.no, plot: d.plot, seller: d.seller, buyer: d.buyer, decimals: d.decimals, date: d.date, officer: d.officer, fingerprint: d.fingerprint });
const logRow = (e) => ({ seq: e.seq, time: e.time, actor: e.user, kind: e.kind, result: e.result, plot: e.plot || null, deed: e.deed || null, text: e.text || null, prev: e.prev, hash: e.hash });
const fromLogRow = (r) => {
  const e = { seq: r.seq, time: r.time, user: r.actor, kind: r.kind, result: r.result, text: r.text || undefined, prev: r.prev, hash: r.hash };
  if (r.plot) e.plot = r.plot;
  if (r.deed) e.deed = r.deed;
  return e;
};

function settingsOf(state) {
  return { state_version: STATE_VERSION, created_at: state.createdAt, next_deed: state.nextDeed, seed_deed_count: state.seedDeedCount };
}

export function toState(rows) {
  const settings = Object.fromEntries(rows.settings.map((r) => [r.key, r.value]));
  const shares = {};
  for (const r of rows.shares) (shares[r.plot] ||= {})[r.person] = r.share;
  return {
    version: STATE_VERSION,
    createdAt: settings.created_at,
    people: Object.fromEntries(rows.people.map((r) => [r.id, { bn: r.bn, en: r.en }])),
    plots: Object.fromEntries(rows.plots.map((r) => [r.id, r.data])),
    shares,
    deeds: rows.deeds.map((r) => ({ ...deedRow(r) })),
    log: rows.log.map(fromLogRow),
    nextDeed: settings.next_deed,
    seedDeedCount: settings.seed_deed_count,
  };
}

export function diff(prev, next) {
  const p = { ...EMPTY, ...prev };
  const people = Object.entries(next.people)
    .filter(([id]) => !p.people[id])
    .map(([id, x]) => ({ id, bn: x.bn, en: x.en }));
  const plots = Object.entries(next.plots)
    .filter(([id]) => !p.plots[id])
    .map(([id, data]) => ({ id, data }));
  const shareUpserts = [];
  const shareDeletes = [];
  for (const plot of new Set([...Object.keys(p.shares), ...Object.keys(next.shares)])) {
    const a = p.shares[plot] || {};
    const b = next.shares[plot] || {};
    for (const [person, share] of Object.entries(b)) if (a[person] !== share) shareUpserts.push({ plot, person, share });
    for (const person of Object.keys(a)) if (!(person in b)) shareDeletes.push({ plot, person });
  }
  const deeds = next.deeds.slice(p.deeds.length).map(deedRow);
  const log = next.log.slice(p.log.length).map(logRow);
  const before = prev?.version ? settingsOf(prev) : {};
  const settings = Object.entries(settingsOf(next))
    .filter(([k, v]) => before[k] !== v)
    .map(([key, value]) => ({ key, value }));
  return { people, plots, deeds, shareUpserts, shareDeletes, log, settings };
}

export function createSupabaseAdapter(getClient) {
  let clientPromise;
  const db = () => (clientPromise ||= Promise.resolve(getClient()));

  async function readAll() {
    const c = await db();
    const [people, plots, shares, deeds, log, settings] = await Promise.all([
      c.from("people").select("*"),
      c.from("plots").select("*"),
      c.from("shares").select("*"),
      c.from("deeds").select("*").order("no"),
      c.from("activity_log").select("*").order("seq"),
      c.from("settings").select("*"),
    ]);
    return {
      people: must(people, "people"),
      plots: must(plots, "plots"),
      shares: must(shares, "shares"),
      deeds: must(deeds, "deeds"),
      log: must(log, "activity_log"),
      settings: must(settings, "settings"),
    };
  }

  async function save(prev, next) {
    const c = await db();
    const d = diff(prev, next);
    if (d.people.length) must(await c.from("people").insert(d.people), "people");
    if (d.plots.length) must(await c.from("plots").insert(d.plots), "plots");
    if (d.deeds.length) must(await c.from("deeds").insert(d.deeds), "deeds");
    if (d.shareUpserts.length) must(await c.from("shares").upsert(d.shareUpserts, { onConflict: "plot,person" }), "shares");
    for (const k of d.shareDeletes) must(await c.from("shares").delete().match(k), "shares");
    if (d.log.length) must(await c.from("activity_log").insert(d.log), "activity_log");
    if (d.settings.length) must(await c.from("settings").upsert(d.settings, { onConflict: "key" }), "settings");
  }

  async function seed() {
    const fresh = createInitialState();
    await save(null, fresh);
    return fresh;
  }

  async function wipe() {
    const c = await db();
    must(await c.rpc("reset_demo"), "reset_demo");
  }

  return {
    name: "supabase",
    shared: true,
    async load() {
      const rows = await readAll();
      const version = rows.settings.find((r) => r.key === "state_version")?.value;
      if (version === STATE_VERSION) return toState(rows);
      if (rows.settings.length || rows.people.length) await wipe();
      return seed();
    },
    save,
    async reset() {
      await wipe();
      return seed();
    },
    
    async watch(onChange) {
      const c = await db();
      let timer;
      const later = () => {
        clearTimeout(timer);
        timer = setTimeout(onChange, 400);
      };
      const channel = c
        .channel("jomijachai-register")
        .on("postgres_changes", { event: "*", schema: "public" }, later)
        .subscribe();
      window.addEventListener("focus", later);
      return () => {
        window.removeEventListener("focus", later);
        c.removeChannel?.(channel);
      };
    },
  };
}
