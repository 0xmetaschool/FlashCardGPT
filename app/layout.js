import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/ui/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FlashCardGPT",
  description: "Generate flash cards by uploading documents",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}<Footer/></body>
    </html>
  );
}
