import type { Metadata } from "next";
import { Schibsted_Grotesk, Bodoni_Moda, DotGothic16 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Loader } from "@/components/Loader";
import { Cursor } from "@/components/Cursor";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-var",
  display: "swap",
});

const serif = Bodoni_Moda({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600"],
  variable: "--font-serif-var",
  display: "swap",
});

// dot-matrix display face for atmospheric taglines in the space sections
const dot = DotGothic16({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dot-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Micky Thanawarothon",
  description: "Founder, engineer, strategist. I build things that work, with the right strategy.",
  openGraph: {
    title: "Micky Thanawarothon",
    description: "Founder, engineer, strategist. I build things that work.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${dot.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Loader />
          <Cursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
