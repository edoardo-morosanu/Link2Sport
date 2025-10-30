import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/contexts/AuthContext'
import MobileNav from "@/components/layout/MobileNav";
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
  title: "Link2Sport - Find your game. Connect with players.",
  description: "Connect with fellow athletes and discover sports activities in your area. Join Link2Sport to find your perfect game partner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var pref = localStorage.getItem('theme') || 'system';
                  var doc = document.documentElement;
                  var setDark = function(on){ on ? doc.classList.add('dark') : doc.classList.remove('dark'); };
                  var setLight = function(on){ on ? doc.classList.add('light') : doc.classList.remove('light'); };
                  if (pref === 'dark') {
                    setDark(true); setLight(false);
                  } else if (pref === 'light') {
                    setDark(false); setLight(true);
                  } else {
                    setLight(false);
                    var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    setDark(isDark);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}>
        <AuthProvider>
          {children}
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
