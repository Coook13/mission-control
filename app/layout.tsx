import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mickythana.com"),
  title: {
    default: "Micky Thanawarothon | Engineer, founder, strategist, investor",
    template: "%s | Micky Thanawarothon",
  },
  description: "Micky Thanawarothon's work across engineering, venture, strategy, finance, and research.",
  authors: [{ name: "Baramee Thanawarothon" }],
  creator: "Baramee Thanawarothon",
  openGraph: {
    title: "Micky Thanawarothon",
    description: "Engineer, founder, strategist, investor.",
    url: "https://mickythana.com",
    siteName: "Micky Thanawarothon",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Micky Thanawarothon",
    description: "Engineer, founder, strategist, investor.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={grotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
