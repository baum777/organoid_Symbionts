import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Syne } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const metadataBase = new URL(siteUrl);

const headline = Syne({
  subsets: ["latin"],
  variable: "--font-headline-face",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body-face",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-face",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Organoid Symbiont",
    template: "%s · Organoid Symbiont",
  },
  description: "Meme-native wetware, organoids, and the interface bottleneck.",
  applicationName: "Organoid Symbiont",
  keywords: [
    "organoid",
    "wetware",
    "biohybrid compute",
    "memetic landing page",
    "transhumanist crypto",
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Organoid Symbiont",
    description: "A research-aware landing page for biohybrid compute and wetware discourse.",
    type: "website",
    url: "/",
    siteName: "Organoid Symbiont",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Organoid Symbiont preview image",
      },
      {
        url: "/og-fallback.svg",
        width: 1200,
        height: 630,
        alt: "Organoid Symbiont fallback preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Organoid Symbiont",
    description: "A research-aware landing page for biohybrid compute and wetware discourse.",
    images: ["/api/og", "/og-fallback.svg"],
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${headline.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-void font-sans text-ink antialiased">
        <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
          <div className="absolute left-1/2 top-[-10rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(103,232,249,0.22)_0%,_rgba(103,232,249,0.08)_28%,_transparent_66%)] blur-3xl animate-drift" />
          <div className="absolute right-[-10rem] top-[22rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,_rgba(232,121,249,0.20)_0%,_rgba(232,121,249,0.08)_30%,_transparent_70%)] blur-3xl animate-float" />
          <div className="absolute bottom-[-12rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(110,231,183,0.16)_0%,_rgba(110,231,183,0.06)_34%,_transparent_70%)] blur-3xl animate-drift" />
        </div>
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_32px,32px_100%] opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_85%)]" />
        {children}
      </body>
    </html>
  );
}
