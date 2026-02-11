"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getHousekeepingDashboard,
  getHousekeepingTasks,
  getHousekeepingStatuses,
  updateHousekeepingStatus,
  startHousekeepingTask,
  completeHousekeepingTask,
  getAllProperties,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import SummaryCard from "@/components/common/SummaryCard";
import StatusPill from "@/components/common/StatusPill";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";
import PageLoader from "@/components/common/PageLoader";
import { handleApiError } from "@/utils/errorHandler";

export default function HousekeepingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  useSEO({
    title: "Housekeeping | Zuha Host",
    description: "Manage housekeeping tasks and room status for all your properties.",
    keywords: "housekeeping, cleaning, room status, operations, tasks",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    propertyId: "",
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dashboardRes, tasksRes, propertiesData, statusesData] = await Promise.all([
        getHousekeepingDashboard(),
        getHousekeepingTasks(filters),
        getAllProperties(),
        getHousekeepingStatuses().catch(() => []),
      ]);

      const raw = dashboardRes?.data ?? dashboardRes;
      const rs = raw?.roomStats ?? {};
      const us = raw?.unitStats ?? {};
      setDashboardStats({
        ...raw,
        dirtyRooms: (rs.dirty ?? 0) + (us.dirty ?? 0),
        inProgressRooms: (rs.in_progress ?? 0) + (us.in_progress ?? 0),
        cleanRooms: (rs.clean ?? 0) + (us.clean ?? 0),
        totalRooms:
          (rs.clean ?? 0) + (rs.dirty ?? 0) + (rs.in_progress ?? 0) +
          (us.clean ?? 0) + (us.dirty ?? 0) + (us.in_progress ?? 0),
      });
      setTasks(Array.isArray(tasksRes) ? tasksRes : (tasksRes?.data ?? []));
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setStatusOptions(Array.isArray(statusesData) ? statusesData : []);
    } catch (error) {
      // Use centralized error handler - auto-redirects on TENANT_REQUIRED
      handleApiError(error, router, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTask = async (taskId) => {
    const toastId = toast.loading("Starting task...");
    try {
      await startHousekeepingTask(taskId);
      toast.success("Task started!", { id: toastId });
      loadData();
    } catch (error) {
      toast.dismiss(toastId);
      handleApiError(error, router, toast);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    
    setIsProcessing(true);
    const toastId = toast.loading("Completing task...");

    try {
      await completeHousekeepingTask(selectedTask.id || selectedTask._id, {
        notes: completionNotes,
      });
      toast.success("Task completed!", { id: toastId });
      setCompleteModalOpen(false);
      setSelectedTask(null);
      setCompletionNotes("");
      loadData();
    } catch (error) {
      toast.dismiss(toastId);
      handleApiError(error, router, toast);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Update room or unit housekeeping status (PATCH /api/housekeeping/status) */
  const handleUpdateRoomUnitStatus = async (task, status) => {
    const roomId = task.roomId?._id ?? task.roomId?.id ?? task.roomId;
    const unitId = task.unitId?._id ?? task.unitId?.id ?? task.unitId;
    if (!roomId && !unitId) {
      toast.error("No room or unit linked to this task");
      return;
    }
    const key = roomId ? `room-${roomId}` : `unit-${unitId}`;
    setStatusUpdatingId(key);
    const toastId = toast.loading("Updating status...");
    try {
      await updateHousekeepingStatus({
        roomId: roomId || undefined,
        unitId: unitId || undefined,
        status,
      });
      toast.success("Status updated", { id: toastId });
      loadData();
    } catch (error) {
      toast.dismiss(toastId);
      handleApiError(error, router, toast);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getRoomStatusColor = (status) => {
    const colors = {
      dirty: "bg-rose-100 text-rose-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      clean: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const housekeepingStatusOptions =
    statusOptions.length > 0
      ? statusOptions
      : [
          { value: "clean", label: "Clean" },
          { value: "dirty", label: "Dirty" },
          { value: "in_progress", label: "In progress" },
        ];

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading housekeeping dashboard..." />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Housekeeping</h1>
              <p className="text-slate-600 mt-0.5 text-sm sm:text-base">Track cleaning status across all rooms and units.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 active:bg-slate-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Dirty Rooms"
            value={dashboardStats.dirtyRooms || 0}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            iconBgColor="bg-rose-100"
            iconColor="text-rose-600"
          />

          <SummaryCard
            title="In Progress"
            value={dashboardStats.inProgressRooms || 0}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />

          <SummaryCard
            title="Clean Rooms"
            value={dashboardStats.cleanRooms || 0}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />

          <SummaryCard
            title="Total Rooms"
            value={dashboardStats.totalRooms || 0}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            iconBgColor="bg-slate-100"
            iconColor="text-slate-600"
          />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Filters</h3>
            <p className="text-xs text-slate-500 mt-0.5">Narrow down housekeeping tasks by status and property.</p>
          </div>
          <button
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
            onClick={() => setFilters({ status: "", propertyId: "" })}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Status"
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            placeholder="All Status"
            options={[
              { value: "", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ]}
          />

          <Select
            label="Property"
            value={filters.propertyId}
            onChange={(value) => setFilters({ ...filters, propertyId: value })}
            placeholder="All Properties"
            options={[
              { value: "", label: "All Properties" },
              ...properties.map((p) => ({
                value: p.id || p._id,
                label: p.title || p.name,
              })),
            ]}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <p className="text-slate-600">
            Showing <span className="font-semibold text-slate-900">{tasks.length}</span> task
            {tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-12 sm:p-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">All clean!</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              There are no housekeeping tasks at the moment. New tasks from check-outs will show here.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const taskId = task.id || task._id;
            const property = task.property_id ?? task.propertyId;
            const room = task.roomId;
            const statusAccent =
              task.status === "completed"
                ? "bg-emerald-500"
                : task.status === "in_progress"
                ? "bg-blue-500"
                : "bg-amber-500";

            return (
              <div
                key={taskId}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow flex"
              >
                <div className={`w-1.5 shrink-0 ${statusAccent}`} aria-hidden />
                <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                        {property?.title || property?.name || "Unknown Property"}
                      </h3>
                      <StatusPill
                        label={task.status}
                        className={getStatusColor(task.status)}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                      {room && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="inline-flex items-center gap-1 text-slate-700">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="font-medium">Room {room.roomNumber}</span>
                          </div>
                          {(room.housekeepingStatus || room.status) && (
                            <StatusPill
                              label={room.housekeepingStatus || room.status}
                              className={`ml-1 ${getRoomStatusColor(room.housekeepingStatus || room.status)}`}
                            />
                          )}
                          <Select
                            label=""
                            value=""
                            onChange={(value) => value && handleUpdateRoomUnitStatus(task, value)}
                            placeholder="Set status"
                            options={housekeepingStatusOptions}
                            className="ml-1 min-w-[140px]"
                            disabled={!!statusUpdatingId}
                          />
                        </div>
                      )}

                      {task.assignedTo && (
                        <div className="inline-flex items-center gap-1 text-slate-700">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate max-w-[140px]">{task.assignedTo.name}</span>
                        </div>
                      )}

                      {task.priority && (
                        <div className="inline-flex items-center gap-1 text-slate-700">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="capitalize">{task.priority}</span>
                        </div>
                      )}
                    </div>

                    {task.notes && (
                      <div className="mt-3 text-sm text-slate-600">
                        {typeof task.notes === "string" ? (
                          <p>{task.notes}</p>
                        ) : typeof task.notes === "object" && task.notes !== null ? (
                          <ul className="list-disc list-inside space-y-0.5">
                            {Object.entries(task.notes)
                              .filter(([, v]) => v != null && String(v).trim() !== "")
                              .map(([k, v]) => (
                                <li key={k}>
                                  <span className="font-medium text-slate-700">
                                    {k.replace(/_/g, " ")}:
                                  </span>{" "}
                                  {String(v)}
                                </li>
                              ))}
                          </ul>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:flex-col sm:items-end shrink-0">
                    {task.status === "pending" && (
                      <button
                        onClick={() => handleStartTask(taskId)}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
                      >
                        Start
                      </button>
                    )}

                    {task.status === "in_progress" && (
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setCompleteModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Complete Task Modal */}
      <Modal
        title="Complete Task"
        description="Mark this cleaning task as complete"
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setCompleteModalOpen(false);
          setSelectedTask(null);
          setCompletionNotes("");
        }}
        primaryActionLabel={isProcessing ? "Processing..." : "Complete Task"}
        onPrimaryAction={handleCompleteTask}
        disabled={isProcessing}
      >
        <div className="space-y-5">
          {selectedTask && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <h4 className="font-semibold text-slate-900 mb-1">
                {(selectedTask.property_id ?? selectedTask.propertyId)?.title || "Property"}
              </h4>
              {selectedTask.roomId && (
                <p className="text-sm text-slate-600">Room {selectedTask.roomId.roomNumber}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Completion notes <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition disabled:opacity-50"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Fresh linens, deep cleaned bathroom, restocked amenities..."
              disabled={isProcessing}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
