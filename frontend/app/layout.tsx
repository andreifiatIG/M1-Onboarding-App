import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalNavigation from "@/components/GlobalNavigation";
import { Toaster } from "sonner";
// import NotificationProvider from "@/components/notifications/NotificationProvider";
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
  title: "M1 Villa Management System",
  description: "M1 Villa Management System with PostgreSQL backend",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#0D9488",
        },
      }}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
            <header className="flex justify-between items-center p-4 gap-4 h-16 bg-white/20 backdrop-blur-lg border-b border-white/20">
              {/* Logo */}
              <div className="flex items-center">
                <img 
                  src="https://i.ibb.co/FbhdWR5C/ILS-OS-Logo.png" 
                  alt="ILS Logo" 
                  className="h-8 w-auto"
                />
              </div>
              
              {/* User Actions */}
              <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton>
                  <button className="bg-white/20 backdrop-blur-md border border-white/30 text-slate-700 hover:text-slate-900 rounded-lg font-medium text-sm h-10 px-4 cursor-pointer transition-all duration-200">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-medium text-sm h-10 px-4 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <GlobalNavigation />
                <UserButton />
              </SignedIn>
              </div>
            </header>
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
