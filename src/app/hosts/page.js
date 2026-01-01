"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/common/DataTable";
import StatusPill from "@/components/common/StatusPill";
import { useDashboard } from "@/components/layout/DashboardShell";
import { getHostsList } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function HostsPage() {
  const router = useRouter();
  useDashboard(); // Ensure we're in dashboard context
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const [hostsData, setHostsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only superadmin can access this page
    if (!authLoading && !isSuperAdmin) {
      router.replace("/dashboard");
      return;
    }

    if (!isSuperAdmin) return;

    let isMounted = true;

    const loadHosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getHostsList();
        
        if (isMounted) {
          // Handle different response formats
          const hostsArray = response?.hosts || response?.data?.hosts || response || [];
          setHostsData(Array.isArray(hostsArray) ? hostsArray : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load hosts");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHosts();

    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin, authLoading, router]);

  const handleViewHost = (hostId) => {
    router.push(`/hosts/${hostId}`);
  };

  // Format data for DataTable component
  const rows = hostsData.map((host, index) => {
    const hostId = host.id || host._id || `host-${index}`;
    const hasActivity = (host.stats?.bookings || 0) > 0;

    return {
      id: hostId,
      cells: [
        // Host Name & Email
        <div key={`name-${hostId}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
            {host.name?.charAt(0)?.toUpperCase() || "H"}
          </div>
          <div>
            <div className="font-medium text-slate-900">{host.name}</div>
            <div className="text-xs text-slate-500">{host.email}</div>
          </div>
        </div>,
        // Properties
        <div key={`properties-${hostId}`} className="text-center">
          <div className="text-lg font-semibold text-slate-900">
            {host.stats?.properties || 0}
          </div>
          <div className="text-xs text-slate-500">Properties</div>
        </div>,
        // Bookings
        <div key={`bookings-${hostId}`} className="text-center">
          <div className="text-lg font-semibold text-slate-900">
            {host.stats?.bookings || 0}
          </div>
          <div className="text-xs text-slate-500">Bookings</div>
        </div>,
        // Guests
        <div key={`guests-${hostId}`} className="text-center">
          <div className="text-lg font-semibold text-slate-900">
            {host.stats?.guests || 0}
          </div>
          <div className="text-xs text-slate-500">Guests</div>
        </div>,
        // Team Members
        <div key={`team-${hostId}`} className="text-center">
          <div className="text-lg font-semibold text-slate-900">
            {host.stats?.teamMembers || 0}
          </div>
          <div className="text-xs text-slate-500">Team</div>
        </div>,
        // Revenue
        <div key={`revenue-${hostId}`} className="text-right">
          <div className="text-lg font-semibold text-green-600">
            ${(host.stats?.totalRevenue || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Total</div>
        </div>,
        // Status
        <StatusPill
          key={`status-${hostId}`}
          status={hasActivity ? "active" : "inactive"}
          label={hasActivity ? "Active" : "Inactive"}
        />,
        // Actions
        <button
          key={`actions-${hostId}`}
          onClick={() => handleViewHost(hostId)}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          View Details
        </button>,
      ],
    };
  });

  if (authLoading || (isLoading && !error)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-slate-600">Loading hosts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Hosts</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hosts Management</h1>
          <p className="mt-1 text-slate-600">
            View and manage all hosts in the system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
            <div className="text-sm text-slate-600">Total Hosts</div>
            <div className="text-2xl font-bold text-slate-900">
              {hostsData.length}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-600">Total Properties</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {hostsData.reduce((sum, host) => sum + (host.stats?.properties || 0), 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-600">Total Bookings</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {hostsData.reduce((sum, host) => sum + (host.stats?.bookings || 0), 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-600">Total Team Members</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {hostsData.reduce((sum, host) => sum + (host.stats?.teamMembers || 0), 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-600">Total Revenue</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            ${hostsData.reduce((sum, host) => sum + (host.stats?.totalRevenue || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Hosts Table */}
      <DataTable
        headers={[
          "Host Name",
          "Properties",
          "Bookings",
          "Guests",
          "Team Members",
          "Revenue",
          "Status",
          "Actions",
        ]}
        rows={rows}
        emptyLabel="No hosts found"
      />
    </div>
  );
}

