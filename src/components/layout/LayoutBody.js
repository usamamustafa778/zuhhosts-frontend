"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { Toaster } from "react-hot-toast";

/**
 * Client wrapper: show dashboard shell only for app routes, never for auth or tenant public site.
 * When isTenantSubdomain is true (e.g. zuha-stays.zuhahost.com), the middleware rewrites
 * to /public/[slug]/... but the client pathname stays e.g. /properties — so we must
 * hide the dashboard for the entire tenant subdomain.
 */
export default function LayoutBody({ isTenantSubdomain = false, children }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/" ||
    pathname === "/onboarding" ||
    pathname?.startsWith("/public/");

  const showDashboard = !isAuthPage && !isTenantSubdomain;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
          loading: {
            iconTheme: { primary: "#3b82f6", secondary: "#fff" },
          },
        }}
      />
      {showDashboard ? <DashboardShell>{children}</DashboardShell> : children}
    </>
  );
}
