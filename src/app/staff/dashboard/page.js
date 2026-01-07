'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import SummaryCard from '@/components/common/SummaryCard';
import { API_BASE_URL } from '@/lib/api';

/**
 * HOST STAFF DASHBOARD
 * For team members working for hosts (host: false, hostId: <host_id>)
 * 
 * Features:
 * - View assigned tasks
 * - Limited access based on permissions
 * - View bookings (if permitted)
 */
export default function StaffDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    // Verify this is HOST STAFF (not a host, and has a valid hostId that's not "superadmin")
    if (parsedUser.host || !parsedUser.hostId || parsedUser.hostId === 'superadmin') {
      alert('Access denied. This page is for host team members only.');
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchTasks(token);
  }, [router]);

  const fetchTasks = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardShell>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            👤 Staff Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}!
          </p>
          {user?.role && (
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                {user.role.name}
              </span>
              {user.department && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {user.department}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="My Tasks"
            value={pendingTasks}
            icon="✅"
            color="blue"
            link="/staff/tasks"
          />
          <SummaryCard
            title="Completed"
            value={completedTasks}
            icon="✓"
            color="green"
          />
          <SummaryCard
            title="Total Tasks"
            value={tasks.length}
            icon="📋"
            color="purple"
            link="/staff/tasks"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/staff/tasks')}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">✅</div>
              <div className="font-medium text-gray-900">My Tasks</div>
              <div className="text-sm text-gray-600">View assigned tasks</div>
            </button>

            {hasPermission('view_bookings') && (
              <button
                onClick={() => router.push('/staff/bookings')}
                className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="font-medium text-gray-900">Bookings</div>
                <div className="text-sm text-gray-600">View bookings</div>
              </button>
            )}

            <button
              onClick={() => router.push('/staff/profile')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">👤</div>
              <div className="font-medium text-gray-900">My Profile</div>
              <div className="text-sm text-gray-600">Update your info</div>
            </button>
          </div>
        </div>

        {/* Permissions Info */}
        {user?.role && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Your Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {user.role.permissions?.map((perm, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {perm}
                </span>
              ))}
              {(!user.role.permissions || user.role.permissions.length === 0) && (
                <span className="text-sm text-blue-700">
                  No specific permissions assigned. Contact your manager.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

