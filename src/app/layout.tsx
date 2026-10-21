import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "QR Sipariş", template: "%s | QR Sipariş" },
  description: "Restoranlar için QR menü ve gerçek zamanlı sipariş yönetim sistemi.",
};

export const viewport: Viewport = { themeColor: "#528024" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
