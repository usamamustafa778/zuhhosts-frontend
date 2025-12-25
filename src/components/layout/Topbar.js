"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const roles = ["Admin", "Manager", "Staff"];

export default function Topbar({ role, onRoleChange, onMenuToggle }) {
  const router = useRouter();
  const { user, logout: authLogout, isAuthenticated } = useAuth();
  const [notifications] = useState([
    { id: 1, title: "New booking confirmed" },
    { id: 2, title: "Task overdue: Deep clean pool" },
  ]);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [hasReadNotifications, setHasReadNotifications] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  const handleLogout = () => {
    authLogout();
    router.replace("/login");
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            onClick={onMenuToggle}
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="text-sm font-semibold">Menu</span>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <div className="relative hidden flex-1 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm sm:flex">
            <span className="text-slate-400">🔍</span>
            <input
              placeholder="Quick search (properties, guests, tasks...)"
              className="ml-2 flex-1 bg-transparent focus:outline-none"
            />
          </div>
          <select
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {roles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <div className="relative" ref={notificationsRef}>
            <button
              className={`relative rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 ${hasReadNotifications ? '' : 'font-bold'}`}
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                if (!hasReadNotifications) {
                  setHasReadNotifications(true);
                }
              }}
            >
              🔔
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 z-30 mt-3 w-64 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Notifications</span>
                  <button
                    className="text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-slate-600"
                    >
                      {item.title}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-center text-xs text-slate-400">
                      You're all caught up!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {isAuthenticated && user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                aria-label="Profile menu"
              >
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name || "User"}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span>{getInitials(user.name)}</span>
                )}
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 z-30 mt-3 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user.name || "User"}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

