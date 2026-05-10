import type { Metadata } from "next";
import { Geist, Geist_Mono, Jua, Mali } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const jua = Jua({
  subsets: ["latin"],
  weight: "400",
});

const mali = Mali({
  subsets: ["thai"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Askademy",
  description: "Playful Academic Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${jua.className} bg-[#F8F9FE]`} 
            style={{ fontFamily: `${jua.style.fontFamily}, ${mali.style.fontFamily}` }}>
        {children}
      </body>
    </html>
  );
}
