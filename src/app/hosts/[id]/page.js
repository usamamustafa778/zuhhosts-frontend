"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DataTable from "@/components/common/DataTable";
import StatusPill from "@/components/common/StatusPill";
import { 
  getHostDetails, 
  getHostProperties, 
  getHostBookings, 
  getHostUsers,
  getHostGuests,
  getHostTasks,
  getHostPayments 
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function HostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const hostId = params.id;

  const [hostDetails, setHostDetails] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [guests, setGuests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only superadmin can access this page
    if (!authLoading && !isSuperAdmin) {
      router.replace("/dashboard");
      return;
    }

    if (!isSuperAdmin || !hostId) return;

    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [
          detailsRes,
          propertiesRes,
          bookingsRes,
          usersRes,
          guestsRes,
          tasksRes,
          paymentsRes,
        ] = await Promise.allSettled([
          getHostDetails(hostId),
          getHostProperties(hostId),
          getHostBookings(hostId),
          getHostUsers(hostId),
          getHostGuests(hostId),
          getHostTasks(hostId),
          getHostPayments(hostId),
        ]);

        if (isMounted) {
          if (detailsRes.status === "fulfilled") {
            setHostDetails(detailsRes.value?.host || detailsRes.value);
          }
          if (propertiesRes.status === "fulfilled") {
            setProperties(Array.isArray(propertiesRes.value) ? propertiesRes.value : propertiesRes.value?.properties || []);
          }
          if (bookingsRes.status === "fulfilled") {
            setBookings(Array.isArray(bookingsRes.value) ? bookingsRes.value : bookingsRes.value?.bookings || []);
          }
          if (usersRes.status === "fulfilled") {
            setUsers(Array.isArray(usersRes.value) ? usersRes.value : usersRes.value?.users || []);
          }
          if (guestsRes.status === "fulfilled") {
            setGuests(Array.isArray(guestsRes.value) ? guestsRes.value : guestsRes.value?.guests || []);
          }
          if (tasksRes.status === "fulfilled") {
            setTasks(Array.isArray(tasksRes.value) ? tasksRes.value : tasksRes.value?.tasks || []);
          }
          if (paymentsRes.status === "fulfilled") {
            setPayments(Array.isArray(paymentsRes.value) ? paymentsRes.value : paymentsRes.value?.payments || []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load host data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin, authLoading, hostId, router]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "properties", label: "Properties", icon: "🏡", count: properties.length },
    { id: "bookings", label: "Bookings", icon: "📅", count: bookings.length },
    { id: "users", label: "Team Members", icon: "👥", count: users.length },
    { id: "guests", label: "Guests", icon: "🧳", count: guests.length },
    { id: "tasks", label: "Tasks", icon: "📝", count: tasks.length },
    { id: "payments", label: "Payments", icon: "💳", count: payments.length },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-slate-600">Loading host details...</p>
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
            <h3 className="font-semibold text-red-900">Error Loading Host</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <span>←</span>
        <span>Back to Hosts</span>
      </button>

      {/* Host Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
              {hostDetails?.name?.charAt(0)?.toUpperCase() || "H"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {hostDetails?.name || "Unknown Host"}
              </h1>
              <p className="text-slate-600">{hostDetails?.email}</p>
              {hostDetails?.phone && (
                <p className="text-sm text-slate-500">{hostDetails.phone}</p>
              )}
            </div>
          </div>
          <StatusPill status="active" label="Active Host" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm text-slate-600">Properties</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {properties.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm text-slate-600">Bookings</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {bookings.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm text-slate-600">Team Members</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {users.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm text-slate-600">Total Revenue</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              ${payments.reduce((sum, p) => sum + (parseFloat(p.amount?.replace(/[$,]/g, "")) || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {activeTab === "properties" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Properties</h3>
          {properties.length > 0 ? (
            <div className="space-y-3">
              {properties.map((property) => (
                <div
                  key={property.id || property._id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {property.title || property.name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {property.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      ${property.price || property.nightlyRate}
                    </div>
                    <div className="text-sm text-slate-500">per night</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No properties found</p>
          )}
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Bookings</h3>
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id || booking._id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {booking.guest?.name || booking.guestId?.name || "Guest"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusPill status={booking.status?.toLowerCase()} label={booking.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No bookings found</p>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Team Members</h3>
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id || user._id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    {user.role?.name || user.role || "Team Member"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No team members found</p>
          )}
        </div>
      )}

      {activeTab === "guests" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Guests</h3>
          {guests.length > 0 ? (
            <div className="space-y-3">
              {guests.map((guest) => (
                <div
                  key={guest.id || guest._id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="font-medium text-slate-900">{guest.name}</div>
                  <div className="text-sm text-slate-500">{guest.email}</div>
                  {guest.phone && (
                    <div className="text-sm text-slate-500">{guest.phone}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No guests found</p>
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Tasks</h3>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id || task._id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <div className="font-medium text-slate-900">{task.title}</div>
                    <div className="text-sm text-slate-500">
                      {task.assignee || "Unassigned"}
                    </div>
                  </div>
                  <StatusPill status={task.status?.toLowerCase()} label={task.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No tasks found</p>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Payments</h3>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id || payment._id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {payment.guest || "Payment"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(payment.date || payment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {payment.amount}
                    </div>
                    <StatusPill status={payment.status?.toLowerCase()} label={payment.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No payments found</p>
          )}
        </div>
      )}
    </div>
  );
}

