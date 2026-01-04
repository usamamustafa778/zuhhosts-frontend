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
    router.push('/bookings');
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 safe-bottom">
      <div className="grid grid-cols-5 items-center px-2 py-3">
        {/* Today */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-1 ${
            pathname === "/dashboard"
              ? "text-rose-500"
              : "text-slate-500"
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname === "/dashboard" ? 2.5 : 2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className={`text-xs ${pathname === "/dashboard" ? 'font-semibold' : 'font-medium'}`}>
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
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname === "/tasks" || pathname.startsWith("/tasks/") ? 2.5 : 2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className={`text-xs ${pathname === "/tasks" || pathname.startsWith("/tasks/") ? 'font-semibold' : 'font-medium'}`}>
            Tasks
          </span>
        </Link>

        {/* New (Plus Icon - Center) */}
        <button
          onClick={handleNewClick}
          className="flex flex-col items-center justify-center gap-1"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500 text-white shadow-lg active:scale-95 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-medium text-slate-500">
            New
          </span>
        </button>

        {/* Listings */}
        <Link
          href="/properties"
          className={`flex flex-col items-center justify-center gap-1 ${
            pathname === "/properties" || pathname.startsWith("/properties/")
              ? "text-rose-500"
              : "text-slate-500"
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname === "/properties" || pathname.startsWith("/properties/") ? 2.5 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className={`text-xs ${pathname === "/properties" || pathname.startsWith("/properties/") ? 'font-semibold' : 'font-medium'}`}>
            Listings
          </span>
        </Link>

        {/* Menu */}
        <button
          onClick={onMenuToggle}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 active:text-slate-700"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs font-medium">
            Menu
          </span>
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

  const contextValue = useMemo(
    () => ({}),
    []
  );

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
            <Topbar
              onMenuToggle={() => setSidebarVisible((prev) => !prev)}
            />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-10 pb-24 lg:pb-6">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          {isAuthenticated && !isAuthPage && (
            <MobileBottomNav onMenuToggle={() => setSidebarVisible((prev) => !prev)} />
          )}
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
