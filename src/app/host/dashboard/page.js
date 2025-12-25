'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import SummaryCard from '@/components/common/SummaryCard';

/**
 * HOST DASHBOARD
 * For property owners (host: true, hostId: null)
 * 
 * Features:
 * - View properties, bookings, revenue
 * - Manage team members
 * - Manage guests
 */
export default function HostDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);

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
  }, [router]);

  const fetchHostStats = async (token, hostId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/hosts/${hostId}`, {
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
            🏠 Host Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}!
          </p>
          {user?.businessName && (
            <p className="text-sm text-gray-500 mt-1">
              {user.businessName}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Properties"
            value={stats?.properties || 0}
            icon="🏘️"
            color="blue"
            link="/host/properties"
          />
          <SummaryCard
            title="Active Bookings"
            value={stats?.bookings || 0}
            icon="📅"
            color="green"
            link="/host/bookings"
          />
          <SummaryCard
            title="Team Members"
            value={stats?.teamMembers || 0}
            icon="👥"
            color="purple"
            link="/host/team"
          />
          <SummaryCard
            title="Total Revenue"
            value={`$${stats?.totalRevenue || 0}`}
            icon="💰"
            color="yellow"
            link="/host/payments"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SummaryCard
            title="Guests"
            value={stats?.guests || 0}
            icon="🎫"
            color="indigo"
            link="/guests"
          />
          <SummaryCard
            title="Payments"
            value={stats?.payments || 0}
            icon="💳"
            color="pink"
            link="/host/payments"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/host/properties')}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🏘️</div>
              <div className="font-medium text-gray-900">Add Property</div>
              <div className="text-sm text-gray-600">List a new property</div>
            </button>
            <button
              onClick={() => router.push('/host/team')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-medium text-gray-900">Add Team Member</div>
              <div className="text-sm text-gray-600">Invite staff to help</div>
            </button>
            <button
              onClick={() => router.push('/guests')}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🎫</div>
              <div className="font-medium text-gray-900">Add Guest</div>
              <div className="text-sm text-gray-600">Create guest contact</div>
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

