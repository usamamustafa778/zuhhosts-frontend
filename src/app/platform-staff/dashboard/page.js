'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import SummaryCard from '@/components/common/SummaryCard';

/**
 * PLATFORM STAFF DASHBOARD
 * For superadmin staff members (host: false, hostId: "superadmin")
 * 
 * Features:
 * - Platform operations
 * - Limited access based on permissions
 * - Support and analytics
 */
export default function PlatformStaffDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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

    // Verify this is PLATFORM STAFF (hostId === "superadmin")
    if (parsedUser.hostId !== 'superadmin') {
      alert('Access denied. This page is for platform staff only.');
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  const hasPermission = (permissionName) => {
    // Check in role permissions
    if (user?.role?.permissions?.includes(permissionName)) {
      return true;
    }
    // Check in custom permissions
    if (user?.permissions?.some(p => p.name === permissionName)) {
      return true;
    }
    return false;
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case 'full':
        return 'bg-green-100 text-green-800';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'read-only':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            🛠️ Platform Staff Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}!
          </p>
          <div className="flex items-center gap-2 mt-2">
            {user?.role && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                {user.role.name}
              </span>
            )}
            {user?.department && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {user.department}
              </span>
            )}
            {user?.accessLevel && (
              <span className={`px-2 py-1 text-xs font-medium rounded ${getAccessLevelColor(user.accessLevel)}`}>
                {user.accessLevel} access
              </span>
            )}
          </div>
        </div>

        {/* Access Level Info */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="font-medium text-indigo-900 mb-2">🔐 Your Access Level</h3>
          <p className="text-sm text-indigo-700">
            {user?.accessLevel === 'full' && 'You have full access to platform management features.'}
            {user?.accessLevel === 'limited' && 'You have limited access to specific platform features.'}
            {user?.accessLevel === 'read-only' && 'You have read-only access to view platform data.'}
            {!user?.accessLevel && 'Access level not set. Contact superadmin.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasPermission('view_all_hosts') && (
              <button
                onClick={() => router.push('/hosts')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="text-2xl mb-2">🏠</div>
                <div className="font-medium text-gray-900">View Hosts</div>
                <div className="text-sm text-gray-600">Browse all hosts</div>
              </button>
            )}

            {hasPermission('manage_tickets') && (
              <button
                onClick={() => router.push('/platform-staff/tickets')}
                className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
              >
                <div className="text-2xl mb-2">🎫</div>
                <div className="font-medium text-gray-900">Support Tickets</div>
                <div className="text-sm text-gray-600">Handle support</div>
              </button>
            )}

            <button
              onClick={() => router.push('/platform-staff/profile')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">👤</div>
              <div className="font-medium text-gray-900">My Profile</div>
              <div className="text-sm text-gray-600">Update your info</div>
            </button>
          </div>
        </div>

        {/* Permissions */}
        {user?.role && user.role.permissions && user.role.permissions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-900 mb-3">Your Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {user.role.permissions.map((perm, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-800 rounded"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600">
            If you need additional permissions or have questions about your access, contact the superadmin.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

