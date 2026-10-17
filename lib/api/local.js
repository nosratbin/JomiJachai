
import { createInitialState, STATE_VERSION } from "../register";

const KEY = "jomijachai:register:v" + STATE_VERSION;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s.version === STATE_VERSION ? s : null;
  } catch {
    return null;
  }
}
function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
  }
}

export function createLocalAdapter() {
  return {
    name: "local",
    shared: false,
    async load() {
      const saved = read();
      if (saved) return saved;
      const fresh = createInitialState();
      write(fresh);
      return fresh;
    },
    async save(prev, next) {
      write(next);
    },
    async reset() {
      const fresh = createInitialState();
      write(fresh);
      return fresh;
    },
    watch(onChange) {
      const onStorage = (e) => e.key === KEY && onChange();
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  };
}
