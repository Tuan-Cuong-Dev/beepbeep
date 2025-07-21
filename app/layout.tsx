import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import 'leaflet/dist/leaflet.css';
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// ✅ CHỈ title + description giữ lại ở metadata
export const metadata: Metadata = {
  title: "Bíp Bíp - Thuê xe dễ như bấm còi!",
  description: "Ứng dụng dịch vụ xe điện nhanh chóng, đơn giản và tiện lợi – từ Việt Nam vươn ra thế giới.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/assets/images/favicon-bipbip.png", type: "image/png" },
    ],
    apple: "/assets/images/apple-touch-icon.png",
  },
};



// ✅ TÁCH viewport thành export riêng
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FFJ85KTLJT" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-FFJ85KTLJT', {
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
