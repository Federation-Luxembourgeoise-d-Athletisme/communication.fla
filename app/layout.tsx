import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { SessionProvider } from "@/lib/session";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Communication FLA",
  description: "Outil interne de gestion de la communication de la Fédération Luxembourgeoise d'Athlétisme",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${barlow.variable} ${barlowCondensed.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
