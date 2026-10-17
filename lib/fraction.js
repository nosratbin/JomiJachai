
const Z = BigInt(0), ONE = BigInt(1), TWO = BigInt(2), TEN = BigInt(10);
const pow10 = (k) => {
  let r = ONE;
  for (let i = 0; i < k; i++) r *= TEN;
  return r;
};

function gcd(a, b) {
  a = a < Z ? -a : a;
  b = b < Z ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || ONE;
}

export function frac(n, d = 1) {
  n = BigInt(n);
  d = BigInt(d);
  if (d === Z) throw new Error("Division by zero");
  if (d < Z) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export function parse(input) {
  if (input && typeof input === "object" && "n" in input) return input;
  const s = String(input ?? "").trim().replace(/[০-৯]/g, (c) => String("০১২৩৪৫৬৭৮৯".indexOf(c)));
  if (!s) return null;
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return add(frac(m[1]), frac(m[2], m[3]));
  m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) return frac(m[1], m[2]);
  m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (m && (m[2] || m[3])) {
    const whole = m[2] || "0";
    const dec = m[3] || "";
    const n = BigInt(whole + dec) * (m[1] ? -ONE : ONE);
    return frac(n, pow10(dec.length));
  }
  return null;
}

export const toKey = (f) => `${f.n}/${f.d}`;
export const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
export const cmp = (a, b) => {
  const x = a.n * b.d - b.n * a.d;
  return x > Z ? 1 : x < Z ? -1 : 0;
};
export const isZero = (a) => a.n === Z;
export const ZERO = frac(0);

export function sum(list) {
  return list.reduce((acc, x) => add(acc, parse(x)), ZERO);
}

function exactDecimal(f, places = 4) {
  const scale = pow10(places);
  return (f.n * scale) % f.d === Z;
}

export function toDecimalString(f, places = 4) {
  const neg = f.n < Z;
  const n = neg ? -f.n : f.n;
  const scale = pow10(places);
  // round half up
  const scaled = (n * scale * TWO + f.d) / (TWO * f.d);
  const whole = scaled / scale;
  let rest = (scaled % scale).toString().padStart(places, "0").replace(/0+$/, "");
  return (neg ? "-" : "") + whole.toString() + (rest ? "." + rest : "");
}

export function display(f) {
  f = parse(f);
  if (!f) return "";
  if (exactDecimal(f)) return toDecimalString(f);
  return `${toDecimalString(f)} (${f.n}/${f.d})`;
}

export const toNumber = (f) => Number(parse(f).n) / Number(parse(f).d);
