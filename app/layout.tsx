import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext"; // hoặc "@/context/AuthContext" tùy vị trí

// Khai báo font Inter
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bíp Bíp - Rent your ride in a beep!",
  description: "An electric vehicle rental app that's fast, simple, and convenient in Vietnam.",
  viewport: "width=device-width, initial-scale=1.0", // ✅ thêm dòng này
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
