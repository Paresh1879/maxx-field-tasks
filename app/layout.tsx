import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import PwaRegister from "./pwa-register";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maxx HubApp",
  description: "Turn field meeting notes into HubSpot tasks.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "HubApp",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c2d48",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
