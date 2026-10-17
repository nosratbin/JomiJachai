import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "out");
const port = Number.parseInt(process.env.PORT || "", 10) || 3000;
const host = process.env.HOST || "0.0.0.0";

if (!existsSync(join(root, "index.html"))) {
  console.error(`No static build found at ${root}. Run "npm run build" first.`);
  process.exit(1);
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

const locate = (pathname) => {
  let clean;
  try {
    clean = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  clean = clean.split("?")[0].split("#")[0];
  const target = resolve(root, "." + normalize(clean));
  if (target !== root && !target.startsWith(root + sep)) {
    return null;
  }
  const candidates = [target];
  if (clean.endsWith("/")) {
    candidates.push(join(target, "index.html"));
  }
  candidates.push(target + ".html");
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  if (existsSync(target) && statSync(target).isDirectory()) {
    const index = join(target, "index.html");
    if (existsSync(index)) {
      return index;
    }
  }
  return null;
};

const cacheFor = (pathname) => {
  if (pathname === "/sw.js") {
    return "no-cache";
  }
  if (pathname.startsWith("/_next/static/") || pathname.startsWith("/icons/")) {
    return "public, max-age=31536000, immutable";
  }
  if (pathname === "/" || extname(pathname) === ".html") {
    return "no-cache";
  }
  return "public, max-age=3600";
};

const send = (req, res, file, status, cache) => {
  const stats = statSync(file);
  res.writeHead(status, {
    "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": stats.size,
    "Cache-Control": cache,
    "X-Content-Type-Options": "nosniff"
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  const stream = createReadStream(file);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
};

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method Not Allowed");
    return;
  }
  const pathname = (req.url || "/").split("?")[0];
  const file = locate(pathname);
  if (file) {
    send(req, res, file, 200, cacheFor(pathname));
    return;
  }
  const notFound = join(root, "404.html");
  if (existsSync(notFound)) {
    send(req, res, notFound, 404, "no-cache");
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

server.listen(port, host, () => {
  console.log(`JomiJachai static server listening on http://${host}:${port} serving ${root}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
