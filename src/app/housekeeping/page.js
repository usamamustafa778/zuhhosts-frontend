"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getHousekeepingDashboard,
  getHousekeepingTasks,
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

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dashboard, tasksData, propertiesData] = await Promise.all([
        getHousekeepingDashboard(),
        getHousekeepingTasks(filters),
        getAllProperties(),
      ]);

      setDashboardStats(dashboard);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
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

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading housekeeping dashboard..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Housekeeping</h1>
        </div>

        <button
          onClick={() => loadData()}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
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
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
          <button
            className="text-sm text-slate-600 hover:text-slate-900 underline"
            onClick={() => setFilters({ status: "", propertyId: "" })}
          >
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

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{tasks.length}</span> task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">All Clean!</h3>
            <p className="text-slate-600">No housekeeping tasks at the moment.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const taskId = task.id || task._id;
            const property = task.propertyId;
            const room = task.roomId;
            const unit = task.unitId;

            return (
              <div
                key={taskId}
                className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {property?.title || property?.name || "Unknown Property"}
                      </h3>
                      <StatusPill
                        label={task.status}
                        className={getStatusColor(task.status)}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      {room && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span>Room {room.roomNumber}</span>
                          {room.status && (
                            <StatusPill
                              label={room.status}
                              className={`ml-2 ${getRoomStatusColor(room.status)}`}
                            />
                          )}
                        </div>
                      )}

                      {unit && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>Unit {unit.unitName}</span>
                        </div>
                      )}

                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}

                      {task.priority && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="capitalize">{task.priority}</span>
                        </div>
                      )}
                    </div>

                    {task.notes && (
                      <p className="mt-2 text-sm text-slate-600">{task.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {task.status === "pending" && (
                      <button
                        onClick={() => handleStartTask(taskId)}
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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
                        className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
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
        <div className="space-y-4">
          {selectedTask && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-900 mb-2">
                {selectedTask.propertyId?.title || "Property"}
              </h4>
              {selectedTask.roomId && (
                <p className="text-sm text-slate-600">Room {selectedTask.roomId.roomNumber}</p>
              )}
              {selectedTask.unitId && (
                <p className="text-sm text-slate-600">Unit {selectedTask.unitId.unitName}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Completion Notes (Optional)
            </label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
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
