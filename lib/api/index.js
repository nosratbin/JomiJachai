"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createRegisterApi } from "./core";
import { createLocalAdapter } from "./local";
import { createSupabaseAdapter } from "./supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const BACKEND = SUPABASE_URL && SUPABASE_KEY ? "supabase" : "local";

const adapter =
  BACKEND === "supabase"
    ?
      createSupabaseAdapter(() => import("@supabase/supabase-js").then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY)))
    : createLocalAdapter();

export const api = createRegisterApi(adapter);

const SERVER = { state: null, status: "idle", error: null, backend: BACKEND, shared: BACKEND === "supabase" };

export function useBackend() {
  const snap = useSyncExternalStore(api.subscribe, api.getSnapshot, () => SERVER);
  useEffect(() => api.start(), []);
  return snap;
}

export function useRegister() {
  return useBackend().state;
}
