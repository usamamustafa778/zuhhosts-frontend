import { headers } from "next/headers";
import { Roboto } from "next/font/google";
import "./globals.css";
import LayoutBody from "@/components/layout/LayoutBody";
import { isTenantSubdomain } from "@/utils/tenantSubdomain";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const hostHeader = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const rawHost = hostHeader.split(":")[0].toLowerCase().trim();

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "zuhahost.com";
  const isLocalHost =
    rawHost === "localhost" ||
    rawHost === "127.0.0.1" ||
    rawHost.startsWith("192.168.");
  const isBaseOrSubdomain =
    rawHost === baseDomain || rawHost.endsWith(`.${baseDomain}`);

  const tenantSubdomain = isTenantSubdomain(rawHost);
  const isCustomDomainHost = !!rawHost && !isLocalHost && !isBaseOrSubdomain;

  // Treat both tenant subdomains and custom domains as tenant public sites
  const isTenantSiteHost = tenantSubdomain || isCustomDomainHost;

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
      <body className={`${roboto.variable} antialiased`}>
        <LayoutBody isTenantSubdomain={isTenantSiteHost}>{children}</LayoutBody>
      </body>
    </html>
  );
}
