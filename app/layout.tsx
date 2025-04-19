import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

import ReactQueryProvider from "@/lib/query-client";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auth Starter Kit",
  description: "A full-stack starter kit with authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="pt-16">{children}</div>
          </main>
          <Toaster position="top-right" />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
