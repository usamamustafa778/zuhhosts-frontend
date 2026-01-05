"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { roleMenus } from "@/data/dummyData";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

const groupBySection = (items = []) =>
  items.reduce((acc, item) => {
    const key = item.section || "General";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

export default function Sidebar({
  collapsed,
  isVisible,
  isDisabled = false,
  onCollapseToggle,
  onCloseMobile,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userType, isSuperAdmin, isHost, permissions, logout } = useAuth();
  
  const groupedMenus = useMemo(() => {
    // Determine which menu to show based on user type
    let menuKey = "Admin"; // Default fallback
    
    if (isSuperAdmin) {
      menuKey = "superadmin";
    } else if (isHost) {
      menuKey = "host";
    } else if (userType === "team_member") {
      // For team members, use their role
      menuKey = user?.role?.name || user?.role || "staff";
    }
    
    // Get menu items and filter by permissions
    const navItems = roleMenus[menuKey] || roleMenus.Admin;
    
    // Filter items based on user permissions
    const filteredItems = navItems.filter((item) => {
      // If no permission required, show the item
      if (!item.permission) return true;
      
      // Superadmin has all permissions
      if (isSuperAdmin) return true;
      
      // Check if user has the required permission
      return hasPermission(permissions, item.permission);
    });
    
    return groupBySection(filteredItems);
  }, [user, userType, isSuperAdmin, isHost, permissions]);
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  const handleSectionToggle = (section) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    onCloseMobile();
    router.replace("/login");
  };

  return (
    <>
      {isVisible && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isVisible ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-20" : "lg:w-72"} ${isDisabled ? "sidebar-disabled" : ""}`}
      >
        {/* Header with Close Button for Mobile */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-500/10 p-2 text-xl text-blue-600">
              🏠
            </span>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold tracking-wide text-slate-900">
                  Zuha Hosts
                </p>
                <p className="text-xs text-slate-500">Property Management</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Close Button */}
            <button
              className="lg:hidden rounded-full p-1.5 text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Desktop Collapse Button */}
            <button
              className="hidden rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 lg:inline-flex"
              onClick={onCollapseToggle}
              aria-label="Toggle sidebar width"
              disabled={isDisabled}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-4">
          <div className="space-y-4">
            {Object.entries(groupedMenus).map(([section, items]) => (
              <div
                key={section}
                className="rounded-xl border border-transparent px-2 py-1 hover:border-slate-100"
              >
                <button
                  className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  onClick={() => handleSectionToggle(section)}
                  disabled={isDisabled}
                >
                  <span>{section}</span>
                  <span>{collapsedSections.has(section) ? "+" : "−"}</span>
                </button>
                {!collapsedSections.has(section) && (
                  <nav className="mt-1 space-y-1">
                    {items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={isDisabled ? "#" : item.href}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                          onClick={(e) => {
                            if (isDisabled) {
                              e.preventDefault();
                            } else {
                              onCloseMobile();
                            }
                          }}
                        >
                          <span className="text-lg">{item.icon}</span>
                          {!collapsed && <span>{item.label}</span>}
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - Earnings, Profile & Logout - Fixed at Bottom */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 space-y-2">
          <Link
            href="/earnings"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/earnings"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
              } else {
                onCloseMobile();
              }
            }}
          >
            <span className="text-lg">💰</span>
            {!collapsed && <span>Earnings</span>}
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/profile"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
              } else {
                onCloseMobile();
              }
            }}
          >
            <span className="text-lg">👤</span>
            {!collapsed && <span>Profile</span>}
          </Link>

          <button
            onClick={handleLogout}
            disabled={isDisabled}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            <span className="text-lg">🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

