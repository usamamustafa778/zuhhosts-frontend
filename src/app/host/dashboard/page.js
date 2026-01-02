'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import { getAllBookings } from '@/lib/api';

/**
 * HOST DASHBOARD
 * For property owners (host: true, hostId: null)
 * 
 * Features:
 * - View properties, bookings, revenue
 * - Manage team members
 * - Manage guests
 * - Modern UI with charts and analytics
 */
export default function HostDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [todaysBookings, setTodaysBookings] = useState([]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    // Verify this is a HOST
    if (!parsedUser.host || parsedUser.hostId !== null) {
      alert('Access denied. This page is for property owners only.');
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchHostStats(token, parsedUser.id);
    fetchTodaysBookings(token, parsedUser.id);
  }, [router]);

  const fetchHostStats = async (token, hostId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/hosts/${hostId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.host?.stats || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysBookings = async (token, hostId) => {
    try {
      const bookings = await getAllBookings('?period=today');
      setTodaysBookings(Array.isArray(bookings) ? bookings : []);
    } catch (error) {
      console.error('Error fetching today\'s bookings:', error);
      setTodaysBookings([]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const monthlyRevenue = stats?.monthlyRevenue || 0;
  const revenueChange = stats?.revenueChange || 0;
  const occupancyRate = stats?.occupancyRate || 0;

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="mt-1 text-slate-600">
              Here's what's happening with your properties today
            </p>
            {user?.businessName && (
              <p className="mt-1 text-sm font-medium text-blue-600">
                {user.businessName}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push('/bookings')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 hover:shadow-xl"
          >
            <span>📅</span>
            <span>Today's Bookings</span>
            {todaysBookings.length > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                {todaysBookings.length}
              </span>
            )}
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg transition hover:shadow-xl">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10"></div>
            <div className="relative">
              <p className="text-sm font-medium text-blue-100">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold">${(stats?.totalRevenue || 0).toLocaleString()}</p>
              <div className="mt-3 flex items-center text-sm">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${revenueChange >= 0 ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
                  {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange)}%
                </span>
                <span className="ml-2 text-blue-100">vs last month</span>
              </div>
            </div>
          </div>

          {/* Properties Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Properties</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.properties || 0}</p>
                <button
                  onClick={() => router.push('/properties')}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Manage →
                </button>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                <span className="text-2xl">🏘️</span>
              </div>
            </div>
          </div>

          {/* Active Bookings Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Bookings</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.bookings || 0}</p>
                <button
                  onClick={() => router.push('/bookings')}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View all →
                </button>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          {/* Team Members Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Team Members</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.teamMembers || 0}</p>
                <button
                  onClick={() => router.push('/host/team')}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Manage →
                </button>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Occupancy Rate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Occupancy Rate</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{occupancyRate}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-slate-600">Current month average</p>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">This Month</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">${monthlyRevenue.toLocaleString()}</p>
              <p className="mt-2 text-xs text-slate-600">Revenue so far</p>
            </div>
          </div>

          {/* Guests */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Total Guests</h3>
              <span className="text-2xl">🎫</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{stats?.guests || 0}</p>
              <button
                onClick={() => router.push('/guests')}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all guests →
              </button>
            </div>
          </div>
        </div>

        {/* Today's Bookings and Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Bookings - Takes 2 columns */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Today's Bookings</h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {todaysBookings.length}
                </span>
              </div>
              <button
                onClick={() => router.push('/bookings')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {todaysBookings.length > 0 ? (
                todaysBookings.map((booking, index) => (
                  <div
                    key={booking.id || index}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {booking.guest_id?.name?.[0] || 'G'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{booking.guest_id?.name || 'Guest'}</p>
                        <p className="text-sm text-slate-600">{booking.property_id?.title || 'Property'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">${booking.amount || 0}</p>
                      <p className="text-xs text-slate-600">
                        {booking.status && (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            booking.status === 'confirmed' || booking.status === 'checked-in' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {booking.status}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-4xl">📅</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">No bookings today</p>
                  <p className="mt-1 text-xs text-slate-600">Check back later or view all bookings</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="border-b border-slate-100 pb-4 text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => router.push('/properties')}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <span className="text-lg">🏘️</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Add Property</p>
                  <p className="text-xs text-slate-600">List new property</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/host/team')}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-purple-500 hover:bg-purple-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <span className="text-lg">👥</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Add Team</p>
                  <p className="text-xs text-slate-600">Invite members</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/guests')}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-green-500 hover:bg-green-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <span className="text-lg">🎫</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Add Guest</p>
                  <p className="text-xs text-slate-600">Create contact</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/host/payments')}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-amber-500 hover:bg-amber-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <span className="text-lg">💳</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Payments</p>
                  <p className="text-xs text-slate-600">View transactions</p>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}

