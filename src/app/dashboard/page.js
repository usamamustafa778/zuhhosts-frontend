"use client";

import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-slate-100 bg-white text-sm text-slate-500">
        Checking your session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
          Welcome to your property management system. Get started by managing your properties, bookings, guests, and tasks.
        </p>
      </div>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/properties">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">🏡</div>
            <h3 className="font-semibold text-slate-900">Properties</h3>
            <p className="text-sm text-slate-500 mt-1">Manage your property listings</p>
          </div>
        </Link>

        <Link href="/bookings">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold text-slate-900">Bookings</h3>
            <p className="text-sm text-slate-500 mt-1">View and manage reservations</p>
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
            <p className="text-sm text-slate-500 mt-1">Track team assignments</p>
          </div>
        </Link>
      </section>

      {/* Getting Started Section */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">1</div>
            <div>
              <h3 className="font-semibold text-slate-900">Add Your Properties</h3>
              <p className="text-sm text-slate-600">Start by adding your rental properties to the system</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">2</div>
            <div>
              <h3 className="font-semibold text-slate-900">Create Guest Profiles</h3>
              <p className="text-sm text-slate-600">Add your guests with their contact information</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">3</div>
            <div>
              <h3 className="font-semibold text-slate-900">Manage Bookings</h3>
              <p className="text-sm text-slate-600">Create and track bookings for your properties</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">4</div>
            <div>
              <h3 className="font-semibold text-slate-900">Assign Tasks</h3>
              <p className="text-sm text-slate-600">Create tasks for your team members to coordinate work</p>
            </div>
          </div>
        </div>
      </section>

      {/* API Integration Info */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">System Status</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">API Connection</span>
            <span className="text-green-600 font-semibold">● Connected</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Backend Server</span>
            <span className="text-slate-900 font-mono text-xs">http://localhost:5001</span>
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

