import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "../components/providers";
import Chatbot from "../components/Chatbot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HealthMate - Online Doctor Consultations",
  description:
    "Connect with certified doctors online for quality healthcare. Professional medical consultations from the comfort of your home.",
  keywords: [
    "telemedicine",
    "online doctor",
    "healthcare",
    "consultation",
    "medical advice",
    "teleconsultation",
  ],
  authors: [{ name: "HealthMate" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Chatbot />
        </Providers>
      </body>
    </html>
  );
}