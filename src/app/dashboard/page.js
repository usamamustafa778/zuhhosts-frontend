"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useRequireAuth } from "@/hooks/useAuth";
import { getAllBookings } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useRequireAuth();
  const { isHost } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaysBookings, setTodaysBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [activeView, setActiveView] = useState("today"); // 'today' or 'upcoming'

  // SEO
  useSEO({
    title: "Dashboard | Zuha Host",
    description: "Your property management dashboard. View bookings, earnings, and manage your listings.",
    keywords: "dashboard, overview, property management, host dashboard, bookings",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Fetch stats for hosts
      if (isHost) {
        fetchHostStats();
        fetchTodaysBookings();
        fetchUpcomingBookings();
      } else {
        setLoading(false);
      }
    }
  }, [isLoading, isAuthenticated, user, isHost]);

  const fetchHostStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/hosts/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.host?.stats || {});
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysBookings = async () => {
    try {
      const bookings = await getAllBookings("?period=today");
      setTodaysBookings(Array.isArray(bookings) ? bookings : []);
    } catch (error) {
      console.error("Error fetching today's bookings:", error);
      setTodaysBookings([]);
    }
  };

  const fetchUpcomingBookings = async () => {
    try {
      const bookings = await getAllBookings("?period=upcoming");
      setUpcomingBookings(Array.isArray(bookings) ? bookings : []);
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error);
      setUpcomingBookings([]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading || (isHost && loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-slate-100 bg-white text-sm text-slate-500">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show modern dashboard for hosts
  if (isHost) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 lg:space-y-12 py-0 lg:py-4">
        {/* Today/Upcoming Toggle with Add Booking Button */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex gap-2 lg:gap-4">
            <button
              onClick={() => setActiveView("today")}
              className={`rounded-full px-4 lg:px-6 py-2 lg:py-2.5 text-sm font-medium transition ${
                activeView === "today"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveView("upcoming")}
              className={`rounded-full px-4 lg:px-6 py-2 lg:py-2.5 text-sm font-medium transition ${
                activeView === "upcoming"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
            >
              Upcoming
            </button>
          </div>

          <button
            onClick={() => router.push("/bookings/new")}
            className="rounded-full border whitespace-nowrap border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Add
          </button>
        </div>

        {/* Reservation Count */}
        <div className="text-center">
          <h2 className="text-2xl lg:text-4xl font-semibold text-slate-900">
            {activeView === "today" ? (
              <>
                {todaysBookings.length}{" "}
                {todaysBookings.length === 1 ? "reservation" : "reservations"}
              </>
            ) : (
              <>
                {upcomingBookings.length} upcoming{" "}
                {upcomingBookings.length === 1 ? "reservation" : "reservations"}
              </>
            )}
          </h2>
        </div>

        {/* Today's Reservations */}
        {activeView === "today" &&
          (todaysBookings.length > 0 ? (
            <div className="space-y-4 lg:space-y-6">
              {todaysBookings.map((booking, index) => (
                <div
                  key={booking.id || index}
                  className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-center text-xs lg:text-sm font-medium text-slate-600">
                    {(() => {
                      const startDate = new Date(booking.start_date);
                      const today = new Date();
                      startDate.setHours(0, 0, 0, 0);
                      today.setHours(0, 0, 0, 0);
                      
                      if (startDate.getTime() === today.getTime()) {
                        // Show check-in time if available, otherwise show "All day"
                        return booking.check_in_time || "4:00 PM";
                      }
                      return "All day";
                    })()}
                  </p>
                  <div className="mt-6 lg:mt-8 flex flex-col items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 lg:h-24 lg:w-24 items-center justify-center rounded-full bg-slate-900 text-2xl lg:text-4xl font-bold text-white">
                        {booking.guest_id?.name?.[0]?.toUpperCase() || "G"}
                      </div>
                      {(() => {
                        const numberOfGuests = booking.numberOfGuests || 1;
                        const startDate = new Date(booking.start_date);
                        const today = new Date();
                        startDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        
                        // If check-in is today and there are multiple guests, show +N indicator
                        if (startDate.getTime() === today.getTime() && numberOfGuests > 1) {
                          return (
                            <div className="flex h-16 w-16 lg:h-24 lg:w-24 items-center justify-center rounded-full bg-slate-200 text-2xl lg:text-3xl font-bold text-slate-900">
                              +{numberOfGuests - 1}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <h2 className="mt-4 lg:mt-6 text-center text-xl lg:text-2xl font-semibold text-slate-900">
                      {(() => {
                        const guestName = booking.guest_id?.name || "Guest";
                        const numberOfGuests = booking.numberOfGuests || 1;
                        const startDate = new Date(booking.start_date);
                        const endDate = new Date(booking.end_date);
                        const today = new Date();
                        startDate.setHours(0, 0, 0, 0);
                        endDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        
                        // If check-in is today, show "group of X checks in"
                        if (startDate.getTime() === today.getTime()) {
                          if (numberOfGuests > 1) {
                            return `${guestName.split(" ")[0]}'s group of ${numberOfGuests} checks in`;
                          } else {
                            return `${guestName} checks in`;
                          }
                        }
                        
                        // If checkout is today, show "checks out"
                        if (endDate.getTime() === today.getTime()) {
                          if (numberOfGuests > 1) {
                            return `${guestName.split(" ")[0]}'s group of ${numberOfGuests} checks out`;
                          } else {
                            return `${guestName} checks out`;
                          }
                        }
                        
                        // Otherwise, show "stays for one more day" (ongoing stay)
                        return `${guestName} stays for one more day`;
                      })()}
                    </h2>
                    {booking.property_id?.title && (
                      <p className="mt-2 text-center text-sm lg:text-base text-slate-600">
                        {booking.property_id.title}
                      </p>
                    )}
                    {booking.amount && (
                      <p className="mt-1 text-xs lg:text-sm text-slate-500">
                        ${booking.amount}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-12 lg:p-16 text-center shadow-sm">
              <div className="text-4xl lg:text-6xl">📅</div>
              <h2 className="mt-4 lg:mt-6 text-xl lg:text-2xl font-semibold text-slate-900">
                No reservations today
              </h2>
              <p className="mt-2 text-sm lg:text-base text-slate-600">
                Check your upcoming bookings or add a new reservation
              </p>
              <button
                onClick={() => router.push("/bookings")}
                className="mt-4 lg:mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                View all bookings
              </button>
            </div>
          ))}

        {/* Upcoming Reservations */}
        {activeView === "upcoming" &&
          (upcomingBookings.length > 0 ? (
            <div className="space-y-4 lg:space-y-6">
              {upcomingBookings.map((booking, index) => (
                <div
                  key={booking.id || index}
                  className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-center text-xs lg:text-sm font-medium text-slate-600">
                    {new Date(booking.start_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="mt-6 lg:mt-8 flex flex-col items-center">
                    <div className="flex h-16 w-16 lg:h-24 lg:w-24 items-center justify-center rounded-full bg-slate-900 text-2xl lg:text-4xl font-bold text-white">
                      {booking.guest_id?.name?.[0]?.toUpperCase() || "G"}
                    </div>
                    <h2 className="mt-4 lg:mt-6 text-center text-xl lg:text-2xl font-semibold text-slate-900">
                      {booking.guest_id?.name || "Guest"} checks in
                    </h2>
                    {booking.property_id?.title && (
                      <p className="mt-2 text-center text-sm lg:text-base text-slate-600">
                        {booking.property_id.title}
                      </p>
                    )}
                    {booking.amount && (
                      <p className="mt-1 text-xs lg:text-sm text-slate-500">
                        ${booking.amount}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-12 lg:p-16 text-center shadow-sm">
              <div className="text-4xl lg:text-6xl">🗓️</div>
              <h2 className="mt-4 lg:mt-6 text-xl lg:text-2xl font-semibold text-slate-900">
                No upcoming reservations
              </h2>
              <p className="mt-2 text-sm lg:text-base text-slate-600">
                You're all caught up! Check back later for future bookings
              </p>
            </div>
          ))}

        {/* Your Follow-ups */}
        <div className="space-y-4 lg:space-y-6">
          <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900">
            Your follow-ups
          </h2>

          <div className="grid gap-3 lg:gap-4">
            {/* Quick action cards */}
            <button
              onClick={() => router.push("/tasks")}
              className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-5 lg:p-6 text-left transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <span className="text-xl lg:text-2xl">✅</span>
                    <h3 className="font-semibold text-base lg:text-lg">Tasks</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Review pending tasks
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Spacing for mobile nav */}
        <div className="pb-4 lg:pb-8"></div>
      </div>
    );
  }

  // Default dashboard for non-host users
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Property Management Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Welcome to your property management system. Get started by managing
          your properties, bookings, guests, and tasks.
        </p>
      </div>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/properties">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">🏡</div>
            <h3 className="font-semibold text-slate-900">Properties</h3>
            <p className="text-sm text-slate-500 mt-1">
              Manage your property listings
            </p>
          </div>
        </Link>

        <Link href="/bookings">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold text-slate-900">Bookings</h3>
            <p className="text-sm text-slate-500 mt-1">
              View and manage reservations
            </p>
          </div>
        </Link>

        <Link href="/guests">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-slate-900">Guests</h3>
            <p className="text-sm text-slate-500 mt-1">Manage guest contacts</p>
          </div>
        </Link>

        <Link href="/tasks">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-semibold text-slate-900">Tasks</h3>
            <p className="text-sm text-slate-500 mt-1">
              Track team assignments
            </p>
          </div>
        </Link>
      </section>

      {/* Getting Started Section */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">
          Getting Started
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Add Your Properties
              </h3>
              <p className="text-sm text-slate-600">
                Start by adding your rental properties to the system
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Create Guest Profiles
              </h3>
              <p className="text-sm text-slate-600">
                Add your guests with their contact information
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Manage Bookings</h3>
              <p className="text-sm text-slate-600">
                Create and track bookings for your properties
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              4
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Assign Tasks</h3>
              <p className="text-sm text-slate-600">
                Create tasks for your team members to coordinate work
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API Integration Info */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          System Status
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">API Connection</span>
            <span className="text-green-600 font-semibold">● Connected</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Backend Server</span>
            <span className="text-slate-900 font-mono text-xs">
              {process.env.NEXT_PUBLIC_API_BASE_URL || "Not configured"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">Authentication</span>
            <span className="text-green-600 font-semibold">✓ Active</span>
          </div>
        </div>
      </section>
    </div>
  );
}
