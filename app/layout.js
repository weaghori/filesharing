import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Aghori Share | Anonymous & Ephemeral File Sharing",
  description:
    "Aghori Share — Fast, anonymous, and ephemeral file sharing powered by Supabase and MongoDB. Share any file with no size limit and a live 24-hour self-destruct countdown timer.",
  icons: {
    icon: "/Aghori_Baba_Icon_Black.png",
    shortcut: "/Aghori_Baba_Icon_Black.png",
    apple: "/Aghori_Baba_Icon_Black.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('aghori-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col transition-colors duration-200"
        suppressHydrationWarning
      >
        <Suspense fallback={<div className="h-16 w-full border-b border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#05070B]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 dark:border-[#151E32] bg-white dark:bg-[#05070B] py-8 text-center text-xs text-zinc-500 dark:text-[#94A3B8] transition-colors">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-white">Aghori Share</span>
              <span>— Ephemeral File Infrastructure</span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-[#94A3B8]/70">
              Zero registration. Files are automatically purged from storage upon 24-hour expiration.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
