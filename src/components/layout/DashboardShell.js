"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [role, setRole] = useState("Admin");
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
    () => ({
      role,
      setRole,
    }),
    [role]
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          isVisible={sidebarVisible}
          isDisabled={isSidebarDisabled}
          onCollapseToggle={() => setSidebarCollapsed((prev) => !prev)}
          onCloseMobile={() => setSidebarVisible(false)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            role={role}
            onRoleChange={setRole}
            onMenuToggle={() => setSidebarVisible((prev) => !prev)}
          />
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
