'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import SummaryCard from '@/components/common/SummaryCard';

/**
 * SUPERADMIN DASHBOARD
 * For platform superadmin (role: 'superadmin')
 * 
 * Features:
 * - View all hosts
 * - Manage platform staff
 * - Platform-wide analytics
 * - Full access to everything
 */
export default function SuperadminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    hosts: 0,
    properties: 0,
    bookings: 0,
    revenue: 0,
    staff: 0,
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    // Verify this is SUPERADMIN
    if (parsedUser.role !== 'superadmin' && parsedUser.role?.name !== 'superadmin') {
      alert('Access denied. This page is for superadmin only.');
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchPlatformStats(token);
  }, [router]);

  const fetchPlatformStats = async (token) => {
    try {
      // Fetch hosts
      const hostsResponse = await fetch('http://localhost:5001/api/hosts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (hostsResponse.ok) {
        const hostsData = await hostsResponse.json();
        const hosts = hostsData.hosts || [];
        
        // Calculate platform-wide stats
        const platformStats = hosts.reduce((acc, host) => {
          return {
            hosts: acc.hosts + 1,
            properties: acc.properties + (host.stats?.properties || 0),
            bookings: acc.bookings + (host.stats?.bookings || 0),
            revenue: acc.revenue + (host.stats?.totalRevenue || 0),
          };
        }, { hosts: 0, properties: 0, bookings: 0, revenue: 0 });

        setStats(platformStats);
      }

      // Fetch superadmin staff count
      const staffResponse = await fetch('http://localhost:5001/api/superadmin/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStats(prev => ({ ...prev, staff: staffData.count || 0 }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            ⭐ Superadmin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Platform-wide management and analytics
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              SUPERADMIN
            </span>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <SummaryCard
            title="Total Hosts"
            value={stats.hosts}
            icon="🏠"
            color="blue"
            link="/superadmin/hosts"
          />
          <SummaryCard
            title="All Properties"
            value={stats.properties}
            icon="🏘️"
            color="green"
          />
          <SummaryCard
            title="All Bookings"
            value={stats.bookings}
            icon="📅"
            color="purple"
          />
          <SummaryCard
            title="Platform Revenue"
            value={`$${stats.revenue}`}
            icon="💰"
            color="yellow"
          />
          <SummaryCard
            title="Platform Staff"
            value={stats.staff}
            icon="🛠️"
            color="indigo"
            link="/superadmin/staff"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/superadmin/hosts')}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🏠</div>
              <div className="font-medium text-gray-900">Manage Hosts</div>
              <div className="text-sm text-gray-600">View all property owners</div>
            </button>
            <button
              onClick={() => router.push('/superadmin/staff')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🛠️</div>
              <div className="font-medium text-gray-900">Platform Staff</div>
              <div className="text-sm text-gray-600">Manage platform team</div>
            </button>
            <button
              onClick={() => router.push('/superadmin/roles')}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🔐</div>
              <div className="font-medium text-gray-900">Roles</div>
              <div className="text-sm text-gray-600">Manage roles</div>
            </button>
            <button
              onClick={() => router.push('/superadmin/analytics')}
              className="p-4 border border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Analytics</div>
              <div className="text-sm text-gray-600">Platform insights</div>
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-medium text-red-900 mb-2">🔒 Full Access Mode</h3>
          <p className="text-sm text-red-700">
            You have complete access to all hosts, properties, bookings, and platform settings.
            Use this power responsibly.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

