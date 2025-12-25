"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getHostsList, impersonateHost, stopImpersonation } from "@/lib/api";

export default function Topbar({ onMenuToggle }) {
  const router = useRouter();
  const { user, logout: authLogout, isAuthenticated, isSuperAdmin, login } = useAuth();
  const [notifications] = useState([
    { id: 1, title: "New booking confirmed" },
    { id: 2, title: "Task overdue: Deep clean pool" },
  ]);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [hasReadNotifications, setHasReadNotifications] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHostSwitcherOpen, setIsHostSwitcherOpen] = useState(false);
  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [switchingHost, setSwitchingHost] = useState(false);
  const [selectedHostId, setSelectedHostId] = useState(null);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const hostSwitcherRef = useRef(null);

  // Check if currently impersonating a host
  const isImpersonating = user?.impersonatedBy || (isSuperAdmin && selectedHostId);
  
  // Show host switcher if superadmin OR currently impersonating
  const showHostSwitcher = isSuperAdmin || isImpersonating;

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

  useEffect(() => {
    if (!isHostSwitcherOpen) return;

    const handleClickOutside = (event) => {
      if (
        hostSwitcherRef.current &&
        !hostSwitcherRef.current.contains(event.target)
      ) {
        setIsHostSwitcherOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHostSwitcherOpen]);

  // Fetch hosts when superadmin opens the host switcher
  useEffect(() => {
    if (showHostSwitcher && isHostSwitcherOpen && hosts.length === 0) {
      fetchHosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHostSwitcher, isHostSwitcherOpen]);

  // Debug logging
  useEffect(() => {
    console.log('🔄 Topbar state updated:');
    console.log('  - isSuperAdmin:', isSuperAdmin);
    console.log('  - isImpersonating:', isImpersonating);
    console.log('  - showHostSwitcher:', showHostSwitcher);
    console.log('  - isHostSwitcherOpen:', isHostSwitcherOpen);
    console.log('  - hosts count:', hosts.length);
    console.log('  - switchingHost:', switchingHost);
  }, [isSuperAdmin, isImpersonating, showHostSwitcher, isHostSwitcherOpen, hosts.length, switchingHost]);

  const fetchHosts = async () => {
    setLoadingHosts(true);
    try {
      const response = await getHostsList();
      console.log('🔵 Hosts API response:', response);
      const hostsData = response.hosts || response.data || response;
      console.log('🔵 Hosts data:', hostsData);
      
      // Normalize hosts to ensure they have _id field
      const normalizedHosts = Array.isArray(hostsData) 
        ? hostsData.map(host => ({
            ...host,
            _id: host._id || host.id // Use id if _id is not present
          }))
        : [];
      
      console.log('🔵 Normalized hosts:', normalizedHosts);
      setHosts(normalizedHosts);
    } catch (error) {
      console.error("Failed to fetch hosts:", error);
      setHosts([]);
    } finally {
      setLoadingHosts(false);
    }
  };

  const handleLogout = () => {
    authLogout();
    router.replace("/login");
  };

  const handleHostSwitch = async (hostId) => {
    console.log('🔵 handleHostSwitch called with hostId:', hostId);
    console.log('🔵 switchingHost state:', switchingHost);
    
    if (!hostId || switchingHost) {
      console.log('❌ Returning early. hostId:', hostId, 'switchingHost:', switchingHost);
      return;
    }
    
    setSwitchingHost(true);
    console.log('🔵 Starting impersonation for host:', hostId);
    
    try {
      console.log('🔵 Calling impersonateHost API...');
      const data = await impersonateHost(hostId);
      console.log('✅ API Response:', data);
      
      // Update auth with new token and user data
      if (data.token && data.user) {
        console.log('🔵 Updating auth with new token and user');
        login(data.token, data.user);
        setSelectedHostId(hostId);
        setIsHostSwitcherOpen(false);
        
        console.log('🔵 Navigating to /host/dashboard');
        router.push("/host/dashboard");
      } else {
        console.error('❌ Response missing token or user:', data);
        alert('Invalid response from server. Please try again.');
      }
    } catch (error) {
      console.error("❌ Failed to switch host:", error);
      console.error("❌ Error details:", error.message);
      alert(error.message || "Failed to switch to host account. Please try again.");
    } finally {
      console.log('🔵 Setting switchingHost back to false');
      setSwitchingHost(false);
    }
  };

  const handleStopImpersonation = async () => {
    setSwitchingHost(true);
    try {
      const data = await stopImpersonation();
      
      // Update auth with superadmin token and user data
      if (data.token && data.user) {
        login(data.token, data.user);
        setSelectedHostId(null);
        
        // Navigate back to superadmin dashboard
        router.push("/superadmin/dashboard");
      }
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
      alert(error.message || "Failed to return to superadmin view. Please try again.");
    } finally {
      setSwitchingHost(false);
    }
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
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
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

          {/* Host Switcher for Superadmin (and during impersonation) */}
          {showHostSwitcher && (
            <div className="relative" ref={hostSwitcherRef}>
              <button
                onClick={() => setIsHostSwitcherOpen((prev) => !prev)}
                disabled={switchingHost}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
              >
                <span>🏠</span>
                <span>{isImpersonating ? "Switch Host" : "View as Host"}</span>
                <span className="text-xs">▼</span>
              </button>
              {isHostSwitcherOpen && (
                <div className="absolute right-0 z-30 mt-3 w-72 max-h-96 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl">
                  <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Switch to Host</span>
                      <button
                        className="text-xs text-slate-400 hover:text-slate-600"
                        onClick={() => setIsHostSwitcherOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  
                  {isImpersonating && (
                    <div className="border-b border-slate-100 px-4 py-3">
                      <button
                        onClick={handleStopImpersonation}
                        disabled={switchingHost}
                        className="w-full rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                      >
                        {switchingHost ? "Switching..." : "⬅️ Return to Superadmin"}
                      </button>
                    </div>
                  )}
                  
                  <div className="py-2">
                    {loadingHosts ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        Loading hosts...
                      </div>
                    ) : hosts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        No hosts found
                      </div>
                    ) : (
                      hosts.map((host) => (
                        <button
                          key={host._id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🖱️ Host button clicked:', host._id, host.name);
                            handleHostSwitch(host._id);
                          }}
                          disabled={switchingHost}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-sm shrink-0">
                              {getInitials(host.name || host.email)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {host.name || "Unnamed Host"}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{host.email}</p>
                              {host.properties && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {host.properties.length} {host.properties.length === 1 ? 'property' : 'properties'}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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

