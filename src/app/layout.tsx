import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
// import { Space_Mono } from 'next/font/google'
import { Gabarito } from "next/font/google";
export const metadata: Metadata = {
  title: "metrohedron",
  description: "nyc subway tracker",
};

// const spacemono = Space_Mono({subsets: ['latin'], weight: '400', display: "swap", })
const gabarito = Gabarito({subsets: ['latin'], weight: '400', display: "swap", })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={gabarito.className}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
