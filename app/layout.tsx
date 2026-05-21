import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { XmtpProviderWrapper } from "./context/XmtpProviderWrapper";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MezoPay - Gasless Venmo-style Payments & Group Bills on Mezo",
  description: "The ultimate decentralized Venmo on Mezo. Register case-insensitive @handles, send gasless MUSD via permit2, and split group tabs in a single transaction.",
  keywords: [
    "Mezo",
    "MUSD",
    "Decentralized Finance",
    "Gasless Payments",
    "Permit2",
    "EIP-2612",
    "Group Splits",
    "Web3 Payments",
    "Bitcoin",
    "BTC L2"
  ],
  openGraph: {
    title: "MezoPay - Gasless Venmo-style Payments & Group Bills on Mezo",
    description: "Decentralized Venmo on Mezo. Register case-insensitive @handles, send gasless MUSD via permit2, and split group tabs in a single transaction.",
    url: "https://mezopay.app",
    siteName: "MezoPay",
    images: [
      {
        url: "https://raw.githubusercontent.com/mezo-org/branding/main/share-preview.png", // Swap this URL with your custom shared preview image link
        width: 1200,
        height: 630,
        alt: "MezoPay Preview Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MezoPay - Gasless Venmo-style Payments & Group Bills on Mezo",
    description: "Decentralized Venmo on Mezo. Register case-insensitive @handles, send gasless MUSD via permit2, and split group tabs in a single transaction.",
    images: ["https://raw.githubusercontent.com/mezo-org/branding/main/share-preview.png"], // Swap this URL with your custom shared preview image link
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${syne.variable} h-full`}>
      <body className="min-h-full">
        <XmtpProviderWrapper><AppProviders>{children}</AppProviders></XmtpProviderWrapper>
      </body>
    </html>
  );
}
