"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

export default function SuperadminDashboard({ user }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    hosts: 0,
    properties: 0,
    bookings: 0,
    revenue: 0,
    staff: 0,
  });

  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchPlatformStats(token);
  }, [user]);

  const fetchPlatformStats = async (token) => {
    try {
      const hostsRes = await fetch(`${API_BASE_URL}/hosts`, { headers: { Authorization: `Bearer ${token}` } });
      if (hostsRes.ok) {
        const data = await hostsRes.json();
        const hosts = data.hosts || [];
        const platformStats = hosts.reduce(
          (acc, host) => ({
            hosts: acc.hosts + 1,
            properties: acc.properties + (host.stats?.properties || 0),
            bookings: acc.bookings + (host.stats?.bookings || 0),
            revenue: acc.revenue + (host.stats?.totalRevenue || 0),
          }),
          { hosts: 0, properties: 0, bookings: 0, revenue: 0 }
        );
        setStats((prev) => ({ ...prev, ...platformStats }));
      }

      const staffRes = await fetch(`${API_BASE_URL}/superadmin/staff`, { headers: { Authorization: `Bearer ${token}` } });
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStats((prev) => ({ ...prev, staff: staffData.count || 0 }));
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">⭐ Superadmin Dashboard</h1>
        <p className="mt-1 text-slate-600">Platform-wide management and analytics</p>
        <span className="mt-2 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">SUPERADMIN</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <button type="button" onClick={() => router.push("/hosts")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Total Hosts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.hosts}</p>
          <span className="mt-2 inline-block text-sm font-medium text-blue-600">Manage →</span>
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">All Properties</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.properties}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">All Bookings</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.bookings}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Platform Revenue</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">${stats.revenue}</p>
        </div>
        <button type="button" onClick={() => router.push("/superadmin/staff")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Platform Staff</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.staff}</p>
          <span className="mt-2 inline-block text-sm font-medium text-blue-600">Manage →</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Platform Management</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <button type="button" onClick={() => router.push("/hosts")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50">
            <div className="text-2xl">🏠</div>
            <div className="font-medium text-slate-900">Manage Hosts</div>
            <div className="text-sm text-slate-600">View all property owners</div>
          </button>
          <button type="button" onClick={() => router.push("/superadmin/staff")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-purple-500 hover:bg-purple-50">
            <div className="text-2xl">🛠️</div>
            <div className="font-medium text-slate-900">Platform Staff</div>
            <div className="text-sm text-slate-600">Manage platform team</div>
          </button>
          <button type="button" onClick={() => router.push("/roles")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-green-500 hover:bg-green-50">
            <div className="text-2xl">🔐</div>
            <div className="font-medium text-slate-900">Roles</div>
            <div className="text-sm text-slate-600">Manage roles</div>
          </button>
          <button type="button" onClick={() => router.push("/analytics")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-yellow-500 hover:bg-yellow-50">
            <div className="text-2xl">📊</div>
            <div className="font-medium text-slate-900">Analytics</div>
            <div className="text-sm text-slate-600">Platform insights</div>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-6">
        <h3 className="mb-2 font-medium text-red-900">🔒 Full Access Mode</h3>
        <p className="text-sm text-red-700">You have complete access to all hosts, properties, bookings, and platform settings. Use this power responsibly.</p>
      </div>
    </div>
  );
}
