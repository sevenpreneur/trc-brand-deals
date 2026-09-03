import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

/** Metropolis dipakai untuk seluruh UI — geometric sans, angka rapat dan tegas. */
const metropolis = localFont({
  variable: "--font-metropolis",
  display: "swap",
  src: [
    { path: "./fonts/Metropolis-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Metropolis-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/Metropolis-SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/Metropolis-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/Metropolis-ExtraBold.otf", weight: "800", style: "normal" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRC Brand Deals",
  description:
    "Evaluasi 360 workflow inbound WhatsApp brand deals TRC: volume, response time, heatmap, dan percakapan yang butuh aksi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${metropolis.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
