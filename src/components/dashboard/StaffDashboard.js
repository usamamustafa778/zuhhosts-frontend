"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

export default function StaffDashboard({ user }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchTasks(token);
  }, [user]);

  const fetchTasks = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (name) => {
    if (user?.role?.permissions?.includes(name)) return true;
    if (user?.permissions?.some((p) => p.name === name)) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">👤 Staff Dashboard</h1>
        <p className="mt-1 text-slate-600">Welcome back, {user?.name}!</p>
        {user?.role && (
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">{user.role.name}</span>
            {user.department && <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{user.department}</span>}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <button type="button" onClick={() => router.push("/tasks")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">My Tasks</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{pendingTasks}</p>
          <span className="mt-2 inline-block text-sm font-medium text-blue-600">View tasks →</span>
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Completed</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{completedTasks}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Tasks</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tasks.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <button type="button" onClick={() => router.push("/tasks")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50">
            <div className="text-2xl">✅</div>
            <div className="font-medium text-slate-900">My Tasks</div>
            <div className="text-sm text-slate-600">View assigned tasks</div>
          </button>
          {hasPermission("view_bookings") && (
            <button type="button" onClick={() => router.push("/bookings")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-green-500 hover:bg-green-50">
              <div className="text-2xl">📅</div>
              <div className="font-medium text-slate-900">Bookings</div>
              <div className="text-sm text-slate-600">View bookings</div>
            </button>
          )}
          <button type="button" onClick={() => router.push("/profile")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-purple-500 hover:bg-purple-50">
            <div className="text-2xl">👤</div>
            <div className="font-medium text-slate-900">My Profile</div>
            <div className="text-sm text-slate-600">Update your info</div>
          </button>
        </div>
      </div>

      {user?.role?.permissions?.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-medium text-blue-900">Your Permissions</h3>
          <div className="flex flex-wrap gap-2">
            {user.role.permissions.map((perm, i) => (
              <span key={i} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">{perm}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
