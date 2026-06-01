import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#FEFF00',
};

export const metadata: Metadata = {
  title: "Wedding Planner Qisti & Aldi",
  description: "Aplikasi Perencanaan Pernikahan Qisti & Aldi",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wedding Planner',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${inter.variable} antialiased`}
        style={{ fontFamily: "'Inter', Arial, Helvetica, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
