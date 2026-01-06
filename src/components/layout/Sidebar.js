"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Building2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Coins,
  User,
  LogOut,
  LayoutDashboard,
  Home,
  Calendar,
  Users,
  CreditCard,
  ClipboardList,
  Shield,
  Lock,
  Key,
  UserCog
} from "lucide-react";
import { roleMenus } from "@/data/dummyData";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

// Icon mapping for dynamic icon rendering
const iconMap = {
  Building2,
  LayoutDashboard,
  Home,
  Calendar,
  Users,
  User,
  CreditCard,
  ClipboardList,
  Shield,
  Lock,
  Key,
  UserCog,
  Coins
};

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
    let menuKey = "Admin";
    
    if (isSuperAdmin) {
      menuKey = "superadmin";
    } else if (isHost) {
      menuKey = "host";
    } else if (userType === "team_member") {
      menuKey = user?.role?.name || user?.role || "staff";
    }
    
    const navItems = roleMenus[menuKey] || roleMenus.Admin;
    
    const filteredItems = navItems.filter((item) => {
      if (!item.permission) return true;
      if (isSuperAdmin) return true;
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
      {/* Mobile Overlay */}
      {isVisible && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ease-out lg:static lg:translate-x-0 ${
          isVisible ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[72px] w-[72px]" : "lg:w-64 w-64"} ${
          isDisabled ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between h-16 px-4 border-b border-slate-200">
          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md">
                <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-900 truncate">
                  Zuha Hosts
                </h1>
                <p className="text-[11px] text-slate-500 truncate">Property Management</p>
              </div>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md mx-auto">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          )}
          
          {!collapsed && (
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapse Toggle - Desktop Only */}
        {!collapsed && (
          <button
            className="hidden lg:flex absolute top-[70px] -right-3 z-50 h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            onClick={onCollapseToggle}
            aria-label="Collapse sidebar"
            disabled={isDisabled}
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
        )}
        
        {collapsed && (
          <button
            className="hidden lg:flex absolute top-[70px] -right-3 z-50 h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            onClick={onCollapseToggle}
            aria-label="Expand sidebar"
            disabled={isDisabled}
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
        )}

        {/* Navigation Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden lg:py-4 py-2">
          <nav className={collapsed ? "space-y-1" : "lg:space-y-6 space-y-0"}>
            {Object.entries(groupedMenus).map(([section, items]) => (
              <div key={section} className={collapsed ? "" : "lg:px-3 px-0"}>
                {!collapsed && (
                  <div className="mb-2 px-3 hidden lg:block">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {section}
                    </h3>
                  </div>
                )}
                
                {collapsed && (
                  <div className="mb-1 px-4">
                    <div className="h-px bg-slate-200" />
                  </div>
                )}
                
                {(!collapsedSections.has(section) || collapsed) && (
                  <div className={collapsed ? "space-y-1" : "space-y-0.5 lg:mb-0 mb-0"}>
                    {items.map((item) => {
                      const isActive = pathname === item.href;
                      const IconComponent = iconMap[item.icon];
                      return (
                        <Link
                          key={item.href}
                          href={isDisabled ? "#" : item.href}
                          className={`group relative flex items-center gap-3 lg:mx-1 mx-2 px-3 lg:py-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                            isActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          } ${collapsed ? "justify-center" : ""}`}
                          onClick={(e) => {
                            if (isDisabled) {
                              e.preventDefault();
                            } else {
                              onCloseMobile();
                            }
                          }}
                          title={collapsed ? item.label : undefined}
                        >
                          {isActive && !collapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-blue-600 rounded-r-full" />
                          )}
                          {isActive && collapsed && (
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-1 w-7 bg-blue-600 rounded-t-full" />
                          )}
                          {IconComponent && (
                            <IconComponent 
                              className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}`}
                              strokeWidth={2}
                            />
                          )}
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </Link>
                      );
                    })}
                    
                    {/* Add Logout button after Profile in Account section */}
                    {section === "Account" && (
                      <button
                        onClick={(e) => {
                          handleLogout();
                        }}
                        disabled={isDisabled}
                        className={`group relative flex items-center gap-3 lg:mx-1 mx-2 px-3 lg:py-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-rose-700 hover:bg-rose-50 hover:text-rose-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                          collapsed ? "justify-center" : ""
                        }`}
                        title={collapsed ? "Logout" : undefined}
                      >
                        <LogOut 
                          className="w-[18px] h-[18px] shrink-0 opacity-70"
                          strokeWidth={2}
                        />
                        {!collapsed && (
                          <span className="truncate">Logout</span>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
