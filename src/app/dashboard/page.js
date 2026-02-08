"use client";

import { useAuth, useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import {
  OwnerDashboard,
  StaffDashboard,
  SuperadminDashboard,
  PlatformStaffDashboard,
} from "@/components/dashboard";

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user, isSuperAdmin } = useRequireAuth();
  const { isHost, isTeamMember } = useAuth(); // isHost = owner (roleType: 'owner')

  useSEO({
    title: "Dashboard | Zuha Host",
    description:
      "Your property management dashboard. View bookings, earnings, and manage your listings.",
    keywords:
      "dashboard, overview, property management, host dashboard, bookings",
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-slate-100 bg-white text-sm text-slate-500">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Owner (business/tenant owner – what signups get; roleType: 'owner')
  if (isHost) {
    return <OwnerDashboard user={user} />;
  }

  // Superadmin
  if (isSuperAdmin) {
    return <SuperadminDashboard user={user} />;
  }

  // Platform staff (hostId === "superadmin")
  if (user.hostId === "superadmin") {
    return <PlatformStaffDashboard user={user} />;
  }

  // Host staff (team member)
  if (isTeamMember) {
    return <StaffDashboard user={user} />;
  }

  // Unknown role
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-slate-500">No dashboard available for your role.</p>
    </div>
  );
}
