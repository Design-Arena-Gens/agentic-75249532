import "./globals.css";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

export const metadata = {
  title: "Agentic Image Studio",
  description: "Conversational AI image generation with live iterative editing."
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
