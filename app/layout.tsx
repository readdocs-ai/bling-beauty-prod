import "./globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppHelp } from "@/components/whatsapp-help";
import { CartProvider } from "@/components/cart/cart-context";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fontDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Bling Beauty | Prestige Skincare & Luxury Beauty",
  description: "Discover prestige skincare and luxury beauty collections at Bling Beauty Products.",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <CartProvider>
          <SiteHeader />
          <main className="relative">{children}</main>
          <SiteFooter />
          <WhatsAppHelp />
        </CartProvider>
      </body>
    </html>
  );
}
