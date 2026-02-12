"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { useCurrency } from "@/hooks/useCurrency";
import { getAllHosts, impersonateHost, stopImpersonation, search, getImageUrl, getMyTenant } from "@/lib/api";
import { fetchExchangeRates } from "@/utils/currencyUtils";

export default function Topbar({ onMenuToggle }) {
  const router = useRouter();
  const { user, logout: authLogout, isAuthenticated, isSuperAdmin, login, isHost } = useAuth();
  const { activeSubscription, hasActiveSubscription, loadActiveSubscription } = useUserSubscriptions();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHostSwitcherOpen, setIsHostSwitcherOpen] = useState(false);
  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [switchingHost, setSwitchingHost] = useState(false);
  const [selectedHostId, setSelectedHostId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const { currency, updateCurrency, isLoading: isCurrencyLoading } = useCurrency();
  const profileRef = useRef(null);
  const hostSwitcherRef = useRef(null);
  const searchRef = useRef(null);
  const currencyRef = useRef(null);

  // Check if currently impersonating a host
  const isImpersonating = user?.impersonatedBy || user?.isImpersonating || (isSuperAdmin && selectedHostId);

  // Show host switcher if original user is superadmin (even while impersonating)
  // OR if user is currently a superadmin
  const showHostSwitcher = isSuperAdmin || user?.originalRole === 'superadmin' || isImpersonating;

  // Load subscription on mount for non-superadmin users
  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin && isHost) {
      loadActiveSubscription();
    }
  }, [isAuthenticated, isSuperAdmin, isHost]);

  // Initialize exchange rates on mount
  useEffect(() => {
    fetchExchangeRates().catch((error) => {
      console.error("Failed to initialize exchange rates:", error);
    });
  }, []);

  // Load tenant for owners (API: id, name, slug, publicUrl, businessType, country, status)
  useEffect(() => {
    if (!isAuthenticated || isSuperAdmin || (!user?.tenantId && !isHost)) {
      setTenant(null);
      return;
    }
    getMyTenant()
      .then((data) => {
        if (!data) {
          setTenant(null);
          return;
        }
        // Normalize to API shape: id, name, slug, publicUrl, businessType, country, status
        setTenant({
          id: data.id ?? data._id,
          name: data.name,
          slug: data.slug,
          publicUrl: data.publicUrl,
          businessType: data.businessType,
          country: data.country,
          status: data.status,
        });
      })
      .catch(() => setTenant(null));
  }, [isAuthenticated, isSuperAdmin, isHost, user?.tenantId]);

  // When profile/tenant is updated elsewhere (e.g. profile/personal-info), refresh tenant in navbar
  useEffect(() => {
    const onTenantUpdated = (event) => {
      const data = event.detail;
      if (!data) return;
      setTenant({
        id: data.id ?? data._id,
        name: data.name,
        slug: data.slug,
        publicUrl: data.publicUrl,
        businessType: data.businessType,
        country: data.country,
        status: data.status,
      });
    };
    window.addEventListener("tenant-updated", onTenantUpdated);
    return () => window.removeEventListener("tenant-updated", onTenantUpdated);
  }, []);

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

  // Handle click outside search dropdown
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  // Handle click outside currency dropdown
  useEffect(() => {
    if (!isCurrencyOpen) return;

    const handleClickOutside = (event) => {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target)
      ) {
        setIsCurrencyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCurrencyOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await search(searchQuery.trim());
        setSearchResults(results);
        setIsSearchOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
      const response = await getAllHosts();
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
      // Silently handle the error - this is expected if the endpoint doesn't exist
      // or if the user doesn't have permission
      console.log('ℹ️ Could not fetch hosts list (this is normal if not superadmin)');
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
    console.log('🔵 Current user:', user);
    console.log('🔵 Is currently impersonating:', isImpersonating);
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
        console.log('🔵 New user data:', data.user);
        login(data.token, data.user);
        setSelectedHostId(hostId);
        setIsHostSwitcherOpen(false);

        // Show success message
        const action = isImpersonating ? 'Switched to' : 'Now viewing as';
        alert(`✅ ${action} ${data.user.name}`);

        router.push("/dashboard");
      } else {
        console.error('❌ Response missing token or user:', data);
        alert('Invalid response from server. Please try again.');
      }
    } catch (error) {
      console.error("❌ Failed to switch host:", error);
      console.error("❌ Error details:", error.message);

      // More helpful error message
      let errorMessage = error.message || "Failed to switch to host account.";

      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        errorMessage = "⚠️ Backend needs updating!\n\n" +
          "The impersonation endpoint needs to check 'originalRole' to allow " +
          "switching between hosts.\n\n" +
          "Please share 'BACKEND_FIX_HOST_SWITCHING.md' with your backend team.";
      }

      alert(errorMessage);
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

  const handleSearchResultClick = (type, id, item = null) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);

    switch (type) {
      case "property":
        router.push(`/properties`);
        break;
      case "guest":
        router.push(`/guests`);
        break;
      case "task":
        router.push(`/tasks`);
        break;
      case "booking":
        // Navigate to booking detail page
        if (id) {
          router.push(`/bookings/${id}`);
        } else {
          router.push(`/bookings`);
        }
        break;
      default:
        break;
    }
  };

  const handleCurrencyChange = async (newCurrency) => {
    if (newCurrency === currency || isCurrencyLoading) return;

    try {
      // Update currency (pass isSuperAdmin flag to skip API call for superadmin)
      await updateCurrency(newCurrency, isSuperAdmin);
      setIsCurrencyOpen(false);

      // Currency change event is already dispatched by updateCurrency
      // All components using useCurrencyConversion will automatically re-render
      // No page reload needed - real-time updates!
    } catch (error) {
      console.error("Failed to update currency:", error);
      alert("Failed to update currency. Please try again.");
    }
  };

  const currencyOptions = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white shadow-sm">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-amber-900">👁️ Viewing as:</span>
              <span className="text-amber-800">{user?.name || user?.email}</span>
              {user?.originalEmail && (
                <span className="text-amber-600 text-xs">
                  (You: {user.originalEmail})
                </span>
              )}
            </div>
            <button
              onClick={handleStopImpersonation}
              disabled={switchingHost}
              className="rounded-full bg-amber-900 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800 transition-colors disabled:opacity-50"
            >
              {switchingHost ? "Switching..." : "⬅️ Exit View"}
            </button>
          </div>
        </div>
      )}

      {/* Mobile App Style Topbar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          {/* Left: Menu */}
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-slate-100 transition-colors"
            onClick={onMenuToggle}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Center: Logo/Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-slate-900">ZuhHosts</h1>
          </div>

          {/* Right: Currency + Avatar + Business name */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setIsCurrencyOpen((prev) => !prev)}
                  disabled={isCurrencyLoading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                  aria-label="Select currency"
                >
                  <span className="text-base">
                    {currencyOptions.find(c => c.code === currency)?.symbol || "$"}
                  </span>
                </button>
                {isCurrencyOpen && (
                  <div className="absolute right-0 z-30 mt-3 w-48 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
                    <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Currency</span>
                        <button
                          className="text-xs text-slate-400 hover:text-slate-600"
                          onClick={() => setIsCurrencyOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div className="py-2">
                      {currencyOptions.map((option) => (
                        <button
                          key={option.code}
                          onClick={() => handleCurrencyChange(option.code)}
                          disabled={isCurrencyLoading || option.code === currency}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors disabled:opacity-50 ${option.code === currency ? "bg-slate-100" : ""
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{option.symbol}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{option.name}</p>
                              <p className="text-xs text-slate-500">{option.code}</p>
                            </div>
                            {option.code === currency && (
                              <span className="text-emerald-600">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {isAuthenticated && user && (
              <>
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-sm active:scale-95 transition-transform"
                    aria-label="Profile menu"
                  >
                    {getImageUrl(user.profilePicture) ? (
                      <img
                        src={getImageUrl(user.profilePicture)}
                        alt={user.name || "User"}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(user.name)}</span>
                    )}
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 z-30 mt-3 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                      <div className="px-4 py-4 border-b border-slate-100">
                        <p className="font-semibold text-slate-900">{user.name || "User"}</p>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          My Profile
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Account Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {tenant?.name && (
                  <div className="min-w-0 max-w-[120px]">
                    <p className="truncate text-sm font-medium text-slate-700" title={tenant.name}>{tenant.name}</p>
                    {tenant.businessType && (
                      <p className="truncate text-xs text-slate-500 capitalize" title={tenant.businessType}>
                        {tenant.businessType.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Topbar */}
      <div className="hidden lg:block border-b border-slate-200 px-8 py-3">
        {/* Subscription Status Banner - Show for active or rejected subscriptions */}
        {isAuthenticated && !isSuperAdmin && hasActiveSubscription && activeSubscription &&
          (activeSubscription.status === "approved" || activeSubscription.status === "rejected") && (
            <div className={`mb-3 rounded-lg px-4 py-2 ${activeSubscription.status === "approved"
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-rose-50 border border-rose-200"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {activeSubscription.status === "approved" ? "✓ Active Subscription" : "✗ Subscription Rejected"}
                  </span>
                  <span className="text-xs text-slate-600 capitalize">
                    {activeSubscription.package?.replace("_", " ")} Plan
                  </span>
                  {activeSubscription.status === "approved" && activeSubscription.maxProperties && (
                    <span className="text-xs text-slate-500">
                      • {activeSubscription.maxProperties === -1 ? "Unlimited" : activeSubscription.maxProperties} properties
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        <div className="flex items-center gap-3">
          <div className="relative flex-1" ref={searchRef}>
            <div className="relative flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Quick search (properties, guests, tasks...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults) setIsSearchOpen(true);
                }}
                className="ml-2 flex-1 bg-transparent focus:outline-none"
              />
              {isSearching && (
                <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults && (
              <div className="absolute z-[100] mt-2 w-full max-h-[500px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      Search Results ({searchResults.total})
                    </span>
                    <button
                      className="text-xs text-slate-400 hover:text-slate-600"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="py-2">
                  {/* Properties */}
                  {searchResults.properties && searchResults.properties.length > 0 && (
                    <div className="px-4 py-2">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Properties ({searchResults.counts?.properties || 0})
                      </h4>
                      {searchResults.properties.map((property) => (
                        <button
                          key={property.id || property._id}
                          onClick={() => handleSearchResultClick("property", property.id || property._id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors mb-1"
                        >
                          <p className="text-sm font-medium text-slate-900">{property.title}</p>
                          <p className="text-xs text-slate-500">{property.location}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Guests */}
                  {searchResults.guests && searchResults.guests.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Guests ({searchResults.counts?.guests || 0})
                      </h4>
                      {searchResults.guests.map((guest) => (
                        <button
                          key={guest.id || guest._id}
                          onClick={() => handleSearchResultClick("guest", guest.id || guest._id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors mb-1"
                        >
                          <p className="text-sm font-medium text-slate-900">{guest.name}</p>
                          <p className="text-xs text-slate-500">{guest.email || guest.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tasks */}
                  {searchResults.tasks && searchResults.tasks.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Tasks ({searchResults.counts?.tasks || 0})
                      </h4>
                      {searchResults.tasks.map((task) => (
                        <button
                          key={task.id || task._id}
                          onClick={() => handleSearchResultClick("task", task.id || task._id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors mb-1"
                        >
                          <p className="text-sm font-medium text-slate-900">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bookings */}
                  {searchResults.bookings && searchResults.bookings.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Bookings ({searchResults.counts?.bookings || 0})
                      </h4>
                      {searchResults.bookings.map((booking) => {
                        const bookingId = booking.id || booking._id;
                        return (
                          <button
                            key={bookingId}
                            onClick={() => handleSearchResultClick("booking", bookingId, booking)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors mb-1"
                          >
                            <p className="text-sm font-medium text-slate-900">
                              {booking.property_id?.title || booking.guest_id?.name || "Booking"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.guest_id?.name && `${booking.guest_id.name} • `}
                              {booking.start_date && new Date(booking.start_date).toLocaleDateString()}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* No Results */}
                  {searchResults.total === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Currency Selector */}
          {isAuthenticated && (
            <div className="relative" ref={currencyRef}>
              <button
                onClick={() => setIsCurrencyOpen((prev) => !prev)}
                disabled={isCurrencyLoading}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                aria-label="Select currency"
              >
                <span className="text-base">
                  {currencyOptions.find(c => c.code === currency)?.symbol || "$"}
                </span>
                <span className="hidden sm:inline">{currency}</span>
                <span className="text-xs">▼</span>
              </button>
              {isCurrencyOpen && (
                <div className="absolute right-0 z-30 mt-3 w-48 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
                  <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Select Currency</span>
                      <button
                        className="text-xs text-slate-400 hover:text-slate-600"
                        onClick={() => setIsCurrencyOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="py-2">
                    {currencyOptions.map((option) => (
                      <button
                        key={option.code}
                        onClick={() => handleCurrencyChange(option.code)}
                        disabled={isCurrencyLoading || option.code === currency}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors disabled:opacity-50 ${option.code === currency ? "bg-slate-100" : ""
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{option.symbol}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{option.name}</p>
                            <p className="text-xs text-slate-500">{option.code}</p>
                          </div>
                          {option.code === currency && (
                            <span className="text-emerald-600">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  aria-label="Profile menu"
                >
                  {getImageUrl(user.profilePicture) ? (
                    <img
                      src={getImageUrl(user.profilePicture)}
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
              {tenant?.name && (
                <div className="max-w-[180px] shrink-0 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700" title={tenant.name}>{tenant.name}</p>
                  {tenant.businessType && (
                    <p className="truncate text-xs text-slate-500 capitalize" title={tenant.businessType}>
                      {tenant.businessType.replace(/_/g, " ")}
                    </p>
                  )}
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

