import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Find Qibla Direction",
  description:
    "A simple web app to find the Qibla direction from your location.",
  keywords: [
    "Qibla",
    "Qibla Direction",
    "Find Qibla",
    "Islam",
    "Prayer Direction",
    "Muslim",
    "Compass",
    "Geolocation",
    "Hasanali Asadov",
    "Asadov.site",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
