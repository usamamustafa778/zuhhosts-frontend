"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAllBookings, getAllProperties, search } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";

/** Owner dashboard – for users with roleType: 'owner' (business/tenant owner; what signups get). */
export default function OwnerDashboard({ user }) {
  const router = useRouter();
  const { formatWithConversion } = useCurrencyConversion();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaysBookings, setTodaysBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [activeView, setActiveView] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchOwnerStats();
    fetchTodaysBookings();
    fetchUpcomingBookings();
    fetchAllProperties();
    fetchAllBookings();
  }, [user]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(async () => {
      try {
        const results = await search(searchQuery.trim());
        setSearchResults(results);
        setIsSearchOpen(true);
      } catch (err) {
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchOwnerStats = async () => {
    try {
      const token = getAuthToken();
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const res = await fetch(
        `${base}/api/tenants/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data?.stats || data?.tenant?.stats || {});
      }
    } catch (err) {
      console.error("Error fetching owner stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysBookings = async () => {
    try {
      const bookings = await getAllBookings("?period=today");
      setTodaysBookings(Array.isArray(bookings) ? bookings : []);
    } catch (err) {
      setTodaysBookings([]);
    }
  };

  const fetchUpcomingBookings = async () => {
    try {
      const bookings = await getAllBookings("?period=upcoming");
      setUpcomingBookings(Array.isArray(bookings) ? bookings : []);
    } catch (err) {
      setUpcomingBookings([]);
    }
  };

  const fetchAllProperties = async () => {
    try {
      const properties = await getAllProperties();
      setAllProperties(Array.isArray(properties) ? properties : []);
    } catch (err) {
      setAllProperties([]);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const bookings = await getAllBookings();
      setAllBookings(Array.isArray(bookings) ? bookings : []);
    } catch (err) {
      setAllBookings([]);
    }
  };

  const getAvailablePropertiesCount = () => {
    if (allProperties.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookedToday = new Set();
    allBookings.forEach((b) => {
      if (!b.start_date || !b.end_date) return;
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      if (today >= start && today <= end) {
        const id = b.property_id?._id || b.property_id?.id || b.propertyId || b.property_id;
        if (id) bookedToday.add(id.toString());
      }
    });
    return allProperties.filter((p) => {
      const id = (p.id || p._id)?.toString();
      return p.status === "available" && !bookedToday.has(id);
    }).length;
  };

  const handleSearchResultClick = (type, id) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    if (type === "property") router.push("/properties");
    else if (type === "guest") router.push("/guests");
    else if (type === "task") router.push("/tasks");
    else if (type === "booking") router.push(id ? `/bookings/${id}` : "/bookings");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-slate-100 bg-white text-sm text-slate-500">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const revenueChange = stats?.revenueChange ?? 0;
  const occupancyRate = stats?.occupancyRate ?? 0;
  const monthlyRevenue = stats?.monthlyRevenue ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-0 lg:space-y-12 lg:py-4">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-4 text-white shadow-lg">
          <p className="text-xs font-medium text-slate-300">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold">{formatWithConversion(stats?.totalRevenue || 0, "USD")}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={revenueChange >= 0 ? "text-emerald-300" : "text-red-300"}>
              {revenueChange >= 0 ? "↑" : "↓"} {Math.abs(revenueChange)}%
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/properties")}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs font-medium text-slate-500">Properties</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.properties ?? allProperties.length}</p>
          <span className="mt-2 inline-block text-xs font-medium text-blue-600">Manage →</span>
        </button>
        <button
          onClick={() => router.push("/bookings")}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs font-medium text-slate-500">Active Bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {stats?.bookings ?? allBookings.filter((b) => ["confirmed", "checked_in", "pending"].includes(b.status)).length}
          </p>
          <span className="mt-2 inline-block text-xs font-medium text-blue-600">View all →</span>
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Occupancy</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{occupancyRate}%</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-700" style={{ width: `${Math.min(100, occupancyRate)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <p className="text-xs font-medium text-slate-500">This month</p>
          <p className="text-lg font-semibold text-slate-900">{formatWithConversion(monthlyRevenue, "USD")}</p>
        </div>
        <button
          onClick={() => router.push("/guests")}
          className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left transition hover:bg-slate-100"
        >
          <p className="text-xs font-medium text-slate-500">Guests</p>
          <p className="text-lg font-semibold text-slate-900">{stats?.guests ?? 0}</p>
        </button>
        <button
          onClick={() => router.push("/roles")}
          className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left transition hover:bg-slate-100"
        >
          <p className="text-xs font-medium text-slate-500">Team</p>
          <p className="text-lg font-semibold text-slate-900">{stats?.teamMembers ?? 0}</p>
        </button>
      </div>

      {/* Mobile Search */}
      <div className="relative lg:hidden" ref={searchRef}>
        <div className="relative flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search properties, guests, tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults && setIsSearchOpen(true)}
            className="ml-2 flex-1 bg-transparent focus:outline-none"
          />
          {isSearching && <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />}
        </div>
        {isSearchOpen && searchResults && (
          <div className="absolute z-100 mt-2 max-h-[400px] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="sticky top-0 border-b border-slate-100 bg-white px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Results ({searchResults.total})</span>
              <button type="button" className="ml-2 text-xs text-slate-400 hover:text-slate-600" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}>Close</button>
            </div>
            <div className="py-2">
              {searchResults.properties?.length > 0 && (
                <div className="px-4 py-2">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Properties</h4>
                  {searchResults.properties.map((p) => (
                    <button key={p.id || p._id} type="button" onClick={() => handleSearchResultClick("property", p.id || p._id)} className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50">
                      {p.title} {p.location && <span className="text-xs text-slate-500">— {p.location}</span>}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.guests?.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Guests</h4>
                  {searchResults.guests.map((g) => (
                    <button key={g.id || g._id} type="button" onClick={() => handleSearchResultClick("guest", g.id || g._id)} className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50">
                      {g.name} {g.email && <span className="text-xs text-slate-500">— {g.email}</span>}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.tasks?.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tasks</h4>
                  {searchResults.tasks.map((t) => (
                    <button key={t.id || t._id} type="button" onClick={() => handleSearchResultClick("task", t.id || t._id)} className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50">{t.title}</button>
                  ))}
                </div>
              )}
              {searchResults.bookings?.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Bookings</h4>
                  {searchResults.bookings.map((b) => (
                    <button key={b.id || b._id} type="button" onClick={() => handleSearchResultClick("booking", b.id || b._id)} className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50">
                      {b.property_id?.title || b.guest_id?.name || "Booking"} — {b.start_date && new Date(b.start_date).toLocaleDateString()}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.total === 0 && <div className="px-4 py-8 text-center text-sm text-slate-400">No results</div>}
            </div>
          </div>
        )}
      </div>

      {/* Today / Upcoming */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex gap-2 lg:gap-4">
          <button type="button" onClick={() => setActiveView("today")} className={`rounded-full px-4 py-2 text-sm font-medium transition lg:px-6 lg:py-2.5 ${activeView === "today" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}>Today</button>
          <button type="button" onClick={() => setActiveView("upcoming")} className={`rounded-full px-4 py-2 text-sm font-medium transition lg:px-6 lg:py-2.5 ${activeView === "upcoming" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}>Upcoming</button>
        </div>
        <button type="button" onClick={() => router.push("/bookings/new")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap">+ Add</button>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-slate-900 lg:text-4xl">
          {activeView === "today" ? `${todaysBookings.length} reservation${todaysBookings.length === 1 ? "" : "s"}` : `${upcomingBookings.length} upcoming reservation${upcomingBookings.length === 1 ? "" : "s"}`}
        </h2>
        {activeView === "today" && getAvailablePropertiesCount() > 0 && (
          <p className="text-sm text-slate-600 lg:text-base">{getAvailablePropertiesCount()} propert{getAvailablePropertiesCount() === 1 ? "y" : "ies"} available</p>
        )}
      </div>

      {/* Today's / Upcoming list */}
      {activeView === "today" && (
        todaysBookings.length > 0 ? (
          <div className="space-y-4 lg:space-y-6">
            {todaysBookings.map((booking, index) => {
              const startDate = new Date(booking.start_date);
              const endDate = new Date(booking.end_date);
              const today = new Date();
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              const guestName = booking.guest_id?.name || "Guest";
              const numGuests = booking.numberOfGuests || 1;
              let title = guestName;
              if (startDate.getTime() === today.getTime()) title = numGuests > 1 ? `${guestName.split(" ")[0]}'s group of ${numGuests} checks in` : `${guestName} checks in`;
              else if (endDate.getTime() === today.getTime()) title = numGuests > 1 ? `${guestName.split(" ")[0]}'s group of ${numGuests} checks out` : `${guestName} checks out`;
              else title = `${guestName} stays for one more day`;
              return (
                <div key={booking.id || index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md lg:rounded-3xl lg:p-8">
                  <p className="text-center text-xs font-medium text-slate-600 lg:text-sm">{startDate.getTime() === today.getTime() ? (booking.check_in_time || "4:00 PM") : "All day"}</p>
                  <div className="mt-6 flex flex-col items-center lg:mt-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white lg:h-24 lg:w-24 lg:text-4xl">{guestName[0]?.toUpperCase() || "G"}</div>
                    <h2 className="mt-4 text-center text-xl font-semibold text-slate-900 lg:mt-6 lg:text-2xl">{title}</h2>
                    {booking.property_id?.title && <p className="mt-2 text-center text-sm text-slate-600 lg:text-base">{booking.property_id.title}</p>}
                    {booking.amount && <p className="mt-1 text-xs text-slate-500 lg:text-sm">${booking.amount}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm lg:rounded-3xl lg:p-16">
            <div className="text-4xl lg:text-6xl">📅</div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900 lg:mt-6 lg:text-2xl">No reservations today</h2>
            <p className="mt-2 text-sm text-slate-600 lg:text-base">Check your upcoming bookings or add a new reservation</p>
            <button type="button" onClick={() => router.push("/bookings")} className="mt-4 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 lg:mt-6">View all bookings</button>
          </div>
        )
      )}

      {activeView === "upcoming" && (
        upcomingBookings.length > 0 ? (
          <div className="space-y-4 lg:space-y-6">
            {upcomingBookings.map((booking, index) => (
              <div key={booking.id || index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md lg:rounded-3xl lg:p-8">
                <p className="text-center text-xs font-medium text-slate-600 lg:text-sm">{new Date(booking.start_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                <div className="mt-6 flex flex-col items-center lg:mt-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white lg:h-24 lg:w-24 lg:text-4xl">{booking.guest_id?.name?.[0]?.toUpperCase() || "G"}</div>
                  <h2 className="mt-4 text-center text-xl font-semibold text-slate-900 lg:mt-6 lg:text-2xl">{booking.guest_id?.name || "Guest"} checks in</h2>
                  {booking.property_id?.title && <p className="mt-2 text-center text-sm text-slate-600 lg:text-base">{booking.property_id.title}</p>}
                  {booking.amount && <p className="mt-1 text-xs text-slate-500 lg:text-sm">${booking.amount}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm lg:rounded-3xl lg:p-16">
            <div className="text-4xl lg:text-6xl">🗓️</div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900 lg:mt-6 lg:text-2xl">No upcoming reservations</h2>
            <p className="mt-2 text-sm text-slate-600 lg:text-base">You're all caught up</p>
          </div>
        )
      )}

      {/* Quick Actions */}
      <div className="space-y-4 lg:space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900 lg:text-3xl">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
          {[
            { path: "/check-in-out", icon: "🚪", title: "Check-In / Out", desc: "Manage arrivals and departures" },
            { path: "/housekeeping", icon: "✨", title: "Housekeeping", desc: "Track cleaning tasks" },
            { path: "/analytics", icon: "📊", title: "Analytics", desc: "View performance metrics" },
            { path: "/website", icon: "🌐", title: "Public Website", desc: "Manage your booking site" },
          ].map(({ path, icon, title, desc }) => (
            <button key={path} type="button" onClick={() => router.push(path)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:shadow-md lg:rounded-3xl lg:p-6">
              <div className="flex items-center gap-2 text-slate-900">
                <span className="text-xl lg:text-2xl">{icon}</span>
                <h3 className="text-base font-semibold lg:text-lg">{title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="pb-4 lg:pb-8" />
    </div>
  );
}
