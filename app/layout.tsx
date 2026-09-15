import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

/** Inter untuk seluruh UI — menyamai design system Genesis. */
const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
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
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Shell dashboard ada di app/(dashboard)/layout.tsx: halaman auth tanpa sidebar. */}
      <body className="min-h-full">{children}</body>
    </html>
  );
}
