import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Saarthi — Accessible Job Application Assistant",
  description:
    "Saarthi helps candidates with disabilities navigate job applications effortlessly with intelligent assistance, keyboard navigation, high contrast support, and seamless tracking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F5F5F6] text-[#222222] antialiased">
        <a href="#main-content" className="sr-skip-link">
          Skip to main content
        </a>
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
