import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ToastWrapper from "@/components/ToastWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clipify Post",
  description: "Paste Video Link Here",
  icons: {
    icon: "/bestlogo.png",
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <html lang="en" className="dark">
        <head>
          <link rel="icon" href="/bestlogo.png" type="image/png" />
        </head>
        <body className={`${inter.className} bg-black text-white min-h-screen`}>
          {children}
          <ToastWrapper />
        </body>
      </html>
    </ClerkProvider>
  );
}