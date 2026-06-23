import type { Metadata } from "next";
import { Anton, Instrument_Serif, Inter, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/crm/app-frame";
import { ScrollReset } from "@/components/site/scroll-reset";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "РРК",
  description: "Русский Разговорный Клуб",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${plusJakartaSans.variable} ${anton.variable} ${instrumentSerif.variable}`}>
        <ScrollReset />
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
