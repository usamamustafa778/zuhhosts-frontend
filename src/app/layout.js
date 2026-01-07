"use client";

import { Roboto } from "next/font/google";
import "./globals.css";
import DashboardShell from "@/components/layout/DashboardShell";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Pages that should not have the dashboard shell
  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/";

  return (
    <html lang="en" className={roboto.variable}>
      <head>
        <title>Zuha Host - Modern Property Management Platform</title>
        <meta name="description" content="Zuha Host - Modern property management platform for Airbnb hosts. Manage bookings, properties, guests, and earnings all in one place." />
        <meta name="keywords" content="property management, Airbnb host, vacation rental, booking management, property rental, host dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Zuha Host" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${roboto.variable} antialiased`}
      >
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
        {isAuthPage ? children : <DashboardShell>{children}</DashboardShell>}
      </body>
    </html>
  );
}
