"use client";

import SummaryCard from "@/components/common/SummaryCard";
import DataTable from "@/components/common/DataTable";
import StatusPill from "@/components/common/StatusPill";
import PhotoCarousel from "@/components/modules/PhotoCarousel";
import { useRequireAuth } from "@/hooks/useAuth";
import { summaryStats, bookings, properties, tasks } from "@/data/dummyData";

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
          Property management operations dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Track properties, bookings, tasks, and payments in a single pane of glass.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <SummaryCard key={stat.id} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Upcoming bookings</h2>
              <p className="text-sm text-slate-500">Realtime sync from booking engines</p>
            </div>
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              View calendar
            </button>
          </div>
          <div className="mt-4">
            <DataTable
              headers={["Booking", "Guest", "Property", "Dates", "Total", "Status"]}
              rows={bookings.slice(0, 4).map((booking) => ({
                id: booking.id,
                cells: [
                  <span className="font-semibold text-slate-700" key="code">
                    {booking.id}
                  </span>,
                  booking.guest,
                  <span className="text-slate-600" key="property">
                    {booking.property}
                  </span>,
                  `${booking.checkIn} → ${booking.checkOut}`,
                  booking.total,
                  <StatusPill key="status" label={booking.status} />,
                ],
              }))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-100 bg-linear-to-b from-white to-slate-50 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600">Action center</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-center justify-between">
                Pending approvals <span className="text-slate-900">4</span>
              </li>
              <li className="flex items-center justify-between">
                Tasks due today <span className="text-rose-600">7</span>
              </li>
              <li className="flex items-center justify-between">
                Check-ins tomorrow <span className="text-slate-900">13</span>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">Top performing property</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{properties[0].name}</p>
              <p>{properties[0].location}</p>
              <p>Occupancy {properties[0].occupancy}% · ${properties[0].nightlyRate}/night</p>
            </div>
            <div className="mt-3">
              <PhotoCarousel photos={properties[0].photos} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Team activity</h2>
            <p className="text-sm text-slate-500">Tasks flowing through the Kanban board</p>
          </div>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            New task
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tasks.slice(0, 4).map((task) => (
            <div key={task.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400">{task.column}</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{task.title}</p>
              <p className="text-sm text-slate-500">{task.assignee}</p>
              <p className="mt-3 text-xs text-slate-400">Due {task.due}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

