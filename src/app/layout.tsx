import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

// Geometric sans for all UI and editorial text (variable font, 100–900).
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

// Serif reserved for the wordmark and rare display moments.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: { default: "Atelier Store", template: "%s | Atelier Store" },
  description: "Atelier Store",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
