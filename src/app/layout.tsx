import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { StoreShell } from "@/components/store-shell";
import { getStoreSettings } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AND Shop — Thoughtful things for everyday living",
    template: "%s | AND Shop",
  },
  description:
    "A small, considered collection of useful and beautiful things, chosen slowly in Dhaka, Bangladesh.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = isSupabaseConfigured() ? await getStoreSettings() : null;
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
      <body>
        <StoreShell settings={settings}>{children}</StoreShell>
      </body>
    </html>
  );
}
