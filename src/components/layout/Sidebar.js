"use client";

import { useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  UserCog,
  Receipt,
  Sparkles,
  TrendingUp,
  Globe,
  DoorOpen,
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
  Coins,
  Receipt,
  Sparkles,
  TrendingUp,
  Globe,
  DoorOpen,
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userType, isSuperAdmin, isHost, permissions, logout } =
    useAuth();

  const groupedMenus = useMemo(() => {
    let menuKey = "Admin";

    if (isSuperAdmin) {
      menuKey = "superadmin";
    } else if (isHost) {
      menuKey = "host";
    } else if (userType === "team_member") {
      // Get role name and normalize it
      const roleName = user?.role?.name || user?.role || "staff";
      const roleNameLower = roleName?.toLowerCase();

      // Normalize co-host variations: handle both "co-host" and "cohost" (case-insensitive)
      // Prefer "cohost" if the role is either "cohost" or "co-host"
      if (roleNameLower === "co-host" || roleNameLower === "cohost") {
        menuKey = roleMenus["cohost"] ? "cohost" : "co-host";
      } else {
        // Check roleMenus with case-insensitive matching
        const matchingKey = Object.keys(roleMenus).find(
          (key) => key.toLowerCase() === roleNameLower,
        );
        menuKey = matchingKey || (roleMenus[roleName] ? roleName : "staff");
      }
    }

    const navItems = roleMenus[menuKey] || roleMenus.Admin;

    const filteredItems = navItems.filter((item) => {
      // Remove legacy Check-In / Out and Profile links from sidebar
      if (item.href === "/check-in-out" || item.href === "/profile") {
        return false;
      }
      // Staff and cohost should not see Staff management menu item
      // Only hosts and superadmins can manage users
      if (!isHost && !isSuperAdmin) {
        if (
          item.href === "/users" &&
          (item.label === "Staff" || item.label === "Users")
        ) {
          return false;
        }
      }
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

  const bookingSubItems = [
    { label: "Today", href: "/bookings?period=today", period: "today" },
    {
      label: "Upcoming",
      href: "/bookings?period=upcoming",
      period: "upcoming",
    },
    { label: "New", href: "/bookings/new", kind: "new" },
  ];

  const bookingsPeriod =
    pathname.startsWith("/bookings") && searchParams
      ? searchParams.get("period") || "today"
      : null;

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
        className={`fixed inset-0 rounded-xl z-40 flex h-screen flex-col bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ease-out lg:sticky lg:top-10 lg:h-[calc(100vh-50px)] lg:inset-y-0 lg:left-0 lg:translate-x-0 ${
          isVisible ? "translate-x-0 w-64" : "-translate-x-full w-0"
        } ${collapsed ? "lg:w-[64px]" : "lg:w-56"} ${
          isDisabled ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {/* Collapse Toggle - Desktop Only */}
        <button
          className="hidden lg:flex absolute top-[10px] -right-3 z-50 h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          onClick={onCollapseToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          disabled={isDisabled}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={3} />
          )}
        </button>

        {/* Navigation Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden lg:py-2 py-1">
          <nav className={collapsed ? "space-y-0.5" : "space-y-0.5"}>
            {Object.entries(groupedMenus).map(([section, items]) => (
              <div key={section} className="px-1">
                {(!collapsedSections.has(section) || collapsed) && (
                  <div className={collapsed ? "space-y-0.5" : "space-y-0.5"}>
                    {items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                      const IconComponent = iconMap[item.icon];
                      const displayLabel =
                        item.href === "/dashboard" ? "Home" : item.label;
                      const isBookingsItem = item.href === "/bookings";
                      const showBookingSubItems =
                        !collapsed &&
                        isBookingsItem &&
                        pathname.startsWith("/bookings");
                      return (
                        <Fragment key={item.href}>
                          <Link
                            href={isDisabled ? "#" : item.href}
                            className={`group relative flex items-center gap-2 mx-1 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                              isActive
                                ? "bg-rose-50 text-rose-700"
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
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-rose-600 rounded-r-full" />
                            )}
                            {isActive && collapsed && (
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-1 w-7 bg-rose-600 rounded-t-full" />
                            )}
                            {IconComponent && (
                              <IconComponent
                                className={`w-[18px] h-[18px] shrink-0 ${
                                  isActive ? "opacity-100" : "opacity-70"
                                }`}
                                strokeWidth={2}
                              />
                            )}
                            {!collapsed && (
                              <span className="flex-1 flex items-center justify-between">
                                <span className="truncate">{displayLabel}</span>
                                {isBookingsItem && (
                                  <ChevronRight
                                    className={`ml-2 h-3.5 w-3.5 transition-transform ${
                                      pathname.startsWith("/bookings")
                                        ? "rotate-90 text-rose-500"
                                        : "text-slate-400"
                                    }`}
                                    strokeWidth={2.5}
                                  />
                                )}
                              </span>
                            )}
                          </Link>
                          {showBookingSubItems && (
                            <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                              {bookingSubItems.map((sub) => {
                                let isSubActive = false;

                                if (sub.period === "today") {
                                  // Default view (/bookings) or explicit period=today
                                  isSubActive =
                                    pathname === "/bookings" ||
                                    (pathname.startsWith("/bookings") &&
                                      (bookingsPeriod === null ||
                                        bookingsPeriod === "today"));
                                } else if (sub.period === "upcoming") {
                                  isSubActive =
                                    pathname.startsWith("/bookings") &&
                                    bookingsPeriod === "upcoming";
                                } else if (sub.kind === "new") {
                                  const baseHref = "/bookings/new";
                                  isSubActive =
                                    pathname === baseHref ||
                                    pathname.startsWith(`${baseHref}/`);
                                }

                                return (
                                  <Link
                                    key={sub.href}
                                    href={isDisabled ? "#" : sub.href}
                                    className={`flex items-center rounded-full px-3 py-1 text-[12px] ${
                                      isSubActive
                                        ? "bg-white text-slate-900"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                    onClick={(e) => {
                                      if (isDisabled) {
                                        e.preventDefault();
                                      } else {
                                        onCloseMobile();
                                      }
                                    }}
                                  >
                                    <span className="truncate">
                                      {sub.label}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </Fragment>
                      );
                    })}
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
