import type { Metadata } from "next";
import { Inter } from "next/font/google";
import 'leaflet/dist/leaflet.css';
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";

// Khai báo font Inter
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bíp Bíp - Rent your ride in a beep!",
  description: "An electric vehicle rental app that's fast, simple, and convenient in Vietnam.",
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-3YV0DZWVL4" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-3YV0DZWVL4', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
