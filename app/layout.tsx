import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Ghostly Premium - Ethereal Digital Experiences",
  description: "Immersive 3D experiences that blur the line between reality and the digital realm",
  keywords: "3D, WebGL, immersive, premium, digital experiences, interactive design",
  openGraph: {
    title: "Ghostly Premium - Ethereal Digital Experiences",
    description: "Immersive 3D experiences that blur the line between reality and the digital realm",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
