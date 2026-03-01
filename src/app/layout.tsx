import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Option 1: Inter Font
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ReachMasked - Contact without compromise",
  description: "Privacy-first vehicle contact platform. Scan to notify owners about parking, lights, or safety issues without exchanging numbers.",
};

import { Providers } from "@/components/providers/session-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
