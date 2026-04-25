import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getBranding } from "@/lib/branding";

const inter = Inter({ subsets: ["latin"] });

const branding = getBranding();

export const metadata: Metadata = {
  title: `${branding.name} · ${branding.tagline}`,
  description: "Visuell ukeplanlegger for tasks og content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
