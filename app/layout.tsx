import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WindBorne Balloon Tracker",
  description: "Jr Web dev project for WindBorne Systems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} h-screen w-screen flex flex-col bg-zinc-950 antialiased text-white`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}