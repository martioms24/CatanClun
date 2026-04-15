import type { Metadata, Viewport } from "next";
import { Cinzel, EB_Garamond } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { ServiceWorkerRegister } from "@/components/notifications/ServiceWorkerRegister";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Catan Clun | Carcassonne Score Tracker",
  description: "Track Carcassonne game scores for the Catan Clun friend group",
  manifest: "/manifest.json",
  applicationName: "Catán Clun",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Catán Clun",
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-96x96.png",
    apple: "/web-app-manifest-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e3a5f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${cinzel.variable} ${ebGaramond.variable}`}>
      <body>
        <ServiceWorkerRegister />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
