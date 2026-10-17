"use client";

import { toBnDigits } from "./i18n";

const hasSynth = () => typeof window !== "undefined" && "speechSynthesis" in window;
const isAndroid = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

let voicesPromise = null;
function loadVoices() {
  if (!hasSynth()) return Promise.resolve([]);
  voicesPromise ||= new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const now = synth.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(synth.getVoices());
    synth.addEventListener?.("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
  return voicesPromise;
}

export async function findVoice(lang) {
  const voices = await loadVoices();
  const l = (v) => (v.lang || "").toLowerCase().replace("_", "-");
  if (lang === "bn") {
    return (
      voices.find((v) => l(v) === "bn-bd") ||
      voices.find((v) => l(v) === "bn-in") ||
      voices.find((v) => l(v).startsWith("bn")) ||
      voices.find((v) => /bangla|bengali|বাংলা/i.test(v.name)) ||
      null
    );
  }
  return voices.find((v) => l(v) === "en-gb") || voices.find((v) => l(v).startsWith("en")) || null;
}

export function sentences(text, max = 180) {
  const parts = String(text)
    .split(/(?<=[।.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (p.length <= max) out.push(p);
    else {
      let cur = "";
      for (const piece of p.split(/(?<=[,;:])\s+/)) {
        if ((cur + " " + piece).trim().length > max && cur) {
          out.push(cur.trim());
          cur = piece;
        } else cur = (cur + " " + piece).trim();
      }
      if (cur) out.push(cur.trim());
    }
  }
  return out;
}

export function prepare(text, lang) {
  let t = String(text).replace(/\s*·\s*/g, ", ");
  if (lang === "bn") t = toBnDigits(t);
  return t.replace(/([0-9০-৯])-([0-9০-৯])/g, "$1 $2");
}

// ---- playback ----
let current = null;

export function stopSpeaking() {
  current?.stop();
  current = null;
}

function speakWithDevice(parts, lang, voice, onDone) {
  const synth = window.speechSynthesis;
  let i = 0;
  let stopped = false;
  synth.cancel();
  const next = () => {
    if (stopped) return;
    if (i >= parts.length) return onDone();
    const u = new SpeechSynthesisUtterance(parts[i++]);
    u.lang = voice?.lang || (lang === "bn" ? "bn-BD" : "en-GB");
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onend = next;
    u.onerror = (e) => (e.error === "interrupted" || e.error === "canceled" ? null : onDone(e));
    synth.speak(u);
    synth.resume(); 
  };
  next();
  return {
    stop() {
      stopped = true;
      synth.cancel();
    },
  };
}

function speakOnline(parts, lang, onDone) {
  let i = 0;
  let stopped = false;
  const audio = new Audio();
  const next = () => {
    if (stopped) return;
    if (i >= parts.length) return onDone();
    audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(parts[i++])}`;
    audio.play().catch((e) => onDone(e));
  };
  audio.onended = next;
  audio.onerror = () => onDone(new Error("online voice failed"));
  next();
  return {
    stop() {
      stopped = true;
      audio.pause();
      audio.removeAttribute("src");
    },
  };
}

export async function speak(text, lang = "bn", { onEnd } = {}) {
  stopSpeaking();
  const parts = sentences(prepare(text, lang));
  if (!parts.length) return "unavailable";
  let finished = false;
  const done = (err) => {
    if (finished) return;
    finished = true;
    current = null;
    onEnd?.(err);
  };
  const voice = hasSynth() ? await findVoice(lang) : null;
  if (voice || (hasSynth() && (lang !== "bn" || isAndroid()))) {
    // A matching device voice, or Android, whose Google TTS often reads Bangla without listing it.
    current = speakWithDevice(parts, lang, voice, done);
    return "device";
  }
  if (typeof navigator !== "undefined" && navigator.onLine !== false) {
    current = speakOnline(parts, lang, done);
    return "online";
  }
  return "unavailable";
}

export function canSpeak() {
  return typeof window !== "undefined";
}
