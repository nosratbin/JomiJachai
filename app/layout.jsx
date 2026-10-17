import "./globals.css";
import { Noto_Sans_Bengali, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";

const noto = Noto_Sans_Bengali({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-noto-bn", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-plex-mono", display: "swap" });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "জমিযাচাই · JomiJachai",
  description: "Check a plot before you buy, stop over-selling before a deed is registered, and verify a deed by QR, in Bangla.",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192" }], apple: "/icons/apple-touch-icon.png" },
  
  openGraph: {
    type: "website",
    siteName: "জমিযাচাই · JomiJachai",
    title: "জমিযাচাই · জমি কেনার আগে যাচাই করুন",
    description: "দাগ নম্বর দিন: মালিক, ঝুঁকি আর ম্যাপে জমির অবস্থান। দলিল আসল কি না, কিউআর স্ক্যানে।",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "জমিযাচাই: জমি কেনার আগে যাচাই করুন" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  appleWebApp: { capable: true, title: "জমিযাচাই", statusBarStyle: "default" },
  
  referrer: "no-referrer",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#075e24",
};

const PREPAINT = `try{var r=document.documentElement;r.classList.add("js");var p=JSON.parse(localStorage.getItem("jomijachai:prefs")||"{}");r.classList.toggle("dark",p.theme==="dark");if(p.lang)r.lang=p.lang}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${noto.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      </head>
      <body>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
