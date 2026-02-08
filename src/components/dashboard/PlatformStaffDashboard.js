"use client";

import { useRouter } from "next/navigation";

export default function PlatformStaffDashboard({ user }) {
  const router = useRouter();

  const hasPermission = (name) => {
    if (user?.role?.permissions?.includes(name)) return true;
    if (user?.permissions?.some((p) => p.name === name)) return true;
    return false;
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case "full":
        return "bg-green-100 text-green-800";
      case "limited":
        return "bg-yellow-100 text-yellow-800";
      case "read-only":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">🛠️ Platform Staff Dashboard</h1>
        <p className="mt-1 text-slate-600">Welcome back, {user?.name}!</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {user?.role && <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">{user.role.name}</span>}
          {user?.department && <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{user.department}</span>}
          {user?.accessLevel && <span className={`rounded px-2 py-1 text-xs font-medium ${getAccessLevelColor(user.accessLevel)}`}>{user.accessLevel} access</span>}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <h3 className="mb-2 font-medium text-indigo-900">🔐 Your Access Level</h3>
        <p className="text-sm text-indigo-700">
          {user?.accessLevel === "full" && "You have full access to platform management features."}
          {user?.accessLevel === "limited" && "You have limited access to specific platform features."}
          {user?.accessLevel === "read-only" && "You have read-only access to view platform data."}
          {!user?.accessLevel && "Access level not set. Contact superadmin."}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Platform Tools</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {hasPermission("view_all_hosts") && (
            <button type="button" onClick={() => router.push("/hosts")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50">
              <div className="text-2xl">🏠</div>
              <div className="font-medium text-slate-900">View Hosts</div>
              <div className="text-sm text-slate-600">Browse all hosts</div>
            </button>
          )}
          {hasPermission("manage_tickets") && (
            <button type="button" onClick={() => router.push("/platform-staff/tickets")} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-green-500 hover:bg-green-50">
              <div className="text-2xl">🎫</div>
              <div className="font-medium text-slate-900">Support Tickets</div>
              <div className="text-sm text-slate-600">Handle support</div>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-medium text-slate-900">Your Permissions</h3>
          <div className="flex flex-wrap gap-2">
            {user.role.permissions.map((perm, i) => (
              <span key={i} className="rounded bg-indigo-100 px-3 py-1 text-sm text-indigo-800">{perm}</span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-2 font-medium text-slate-900">Need Help?</h3>
        <p className="text-sm text-slate-600">If you need additional permissions or have questions about your access, contact the superadmin.</p>
      </div>
    </div>
  );
}
