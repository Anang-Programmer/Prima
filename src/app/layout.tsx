import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Prima - MVP",
  description: "Next Generation Shrimp Farming",
};

import FcmBridge from "@/components/FcmBridge";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <FcmBridge />
        {children}
      </body>
    </html>
  );
}
