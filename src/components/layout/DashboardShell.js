"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "@/hooks/useAuth";

const DashboardContext = createContext(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardShell");
  }
  return context;
};

// Mobile Bottom Navigation Component
function MobileBottomNav({ onMenuToggle }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNewClick = () => {
    router.push("/bookings/new");
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 safe-bottom">
      <div className="grid grid-cols-5 items-center px-2 py-2">
        {/* Today */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-1 ${
            pathname === "/dashboard" ? "text-rose-500" : "text-slate-500"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={pathname === "/dashboard" ? 2.5 : 2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <span
            className={`text-xs ${
              pathname === "/dashboard" ? "font-semibold" : "font-medium"
            }`}
          >
            Today
          </span>
        </Link>

        {/* Tasks */}
        <Link
          href="/tasks"
          className={`flex flex-col items-center justify-center gap-1 ${
            pathname === "/tasks" || pathname.startsWith("/tasks/")
              ? "text-rose-500"
              : "text-slate-500"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={
                pathname === "/tasks" || pathname.startsWith("/tasks/")
                  ? 2.5
                  : 2
              }
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <span
            className={`text-xs ${
              pathname === "/tasks" || pathname.startsWith("/tasks/")
                ? "font-semibold"
                : "font-medium"
            }`}
          >
            Tasks
          </span>
        </Link>

        {/* New (Plus Icon - Center) */}
        <button
          onClick={handleNewClick}
          className="flex flex-col items-center justify-center gap-1"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500 text-white shadow-lg active:scale-95 transition-transform">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span className="text-xs font-medium text-slate-500">New</span>
        </button>

        {/* Bookings */}
        <Link
          href="/bookings"
          className={`flex flex-col items-center justify-center gap-1 ${
            pathname === "/bookings" || pathname.startsWith("/bookings/")
              ? "text-rose-500"
              : "text-slate-500"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={
                pathname === "/bookings" ||
                pathname.startsWith("/bookings/")
                  ? 2.5
                  : 2
              }
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span
            className={`text-xs ${
              pathname === "/bookings" || pathname.startsWith("/bookings/")
                ? "font-semibold"
                : "font-medium"
            }`}
          >
            Bookings
          </span>
        </Link>

        {/* Menu */}
        <button
          onClick={onMenuToggle}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 active:text-slate-700"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <span className="text-xs font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if current route is login or register
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Sidebar should be disabled if not authenticated or still loading
  // During SSR, assume loading to prevent hydration mismatch
  const isSidebarDisabled = !mounted || isLoading || !isAuthenticated;

  const contextValue = useMemo(() => ({}), []);

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
        {/* Desktop Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          isVisible={sidebarVisible}
          isDisabled={isSidebarDisabled}
          onCollapseToggle={() => setSidebarCollapsed((prev) => !prev)}
          onCloseMobile={() => setSidebarVisible(false)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar - Desktop Only */}
          <div className="hidden lg:block">
            <Topbar onMenuToggle={() => setSidebarVisible((prev) => !prev)} />
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-10 pb-24 lg:pb-6">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          {isAuthenticated && !isAuthPage && (
            <MobileBottomNav
              onMenuToggle={() => setSidebarVisible((prev) => !prev)}
            />
          )}
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
