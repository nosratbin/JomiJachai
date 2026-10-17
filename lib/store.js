"use client";

import { createContext, useContext } from "react";

const PREFS = "jomijachai:prefs";
const DEFAULTS = { lang: "bn", theme: "light", area: "Rampur", officer: "o1" };

export function loadPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}
export function savePrefs(p) {
  try {
    localStorage.setItem(PREFS, JSON.stringify(p));
  } catch {

  }
}

export const PrefsContext = createContext(null);
export const usePrefs = () => useContext(PrefsContext);
