"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import KanbanBoard from "@/components/modules/KanbanBoard";
import Modal from "@/components/common/Modal";
import PageLoader from "@/components/common/PageLoader";
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getAllProperties,
  getAllUsers,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

export default function TasksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  // SEO
  useSEO({
    title: "Tasks | Zuha Host",
    description:
      "Track and manage property maintenance tasks, cleaning schedules, and team assignments.",
    keywords:
      "tasks, maintenance, cleaning schedule, task management, property tasks",
  });
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [processingTasks, setProcessingTasks] = useState(new Set());
  const [viewMode, setViewMode] = useState(() => {
    // Default to kanban on desktop, cards on mobile
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 ? "kanban" : "cards";
    }
    return "kanban";
  });

  // Form state
  const [formData, setFormData] = useState({
    property_id: "",
    title: "",
    description: "",
    assigned_to: "",
    status: "pending",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest(".dropdown-container")) {
        setOpenDropdownId(null);
      }
      if (
        openStatusDropdownId &&
        !event.target.closest(".status-dropdown-container")
      ) {
        setOpenStatusDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId, openStatusDropdownId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated, filterStatus]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query params for filtering
      const params = filterStatus ? `?status=${filterStatus}` : "";

      const [tasksData, propertiesData, usersData] = await Promise.all([
        getAllTasks(params),
        getAllProperties(),
        getAllUsers(),
      ]);

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setError(err.message || "Failed to load data");
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Find the task to get its current state for rollback
    const currentTask = tasks.find((t) => (t.id || t._id) === taskId);
    if (!currentTask) return;

    // Optimistic update - immediately update local state
    setTasks((prev) =>
      prev.map((t) => {
        const id = t.id || t._id;
        if (id === taskId) {
          return { ...t, status: newStatus };
        }
        return t;
      })
    );

    // Mark task as processing
    setProcessingTasks((prev) => new Set(prev).add(taskId));

    try {
      setError(null);
      const updatedTask = await updateTask(taskId, { status: newStatus });

      // Update with server response
      setTasks((prev) =>
        prev.map((t) => {
          const id = t.id || t._id;
          return id === taskId ? updatedTask : t;
        })
      );
    } catch (err) {
      // Rollback on error
      setTasks((prev) =>
        prev.map((t) => {
          const id = t.id || t._id;
          if (id === taskId) {
            return currentTask; // Restore original task
          }
          return t;
        })
      );
      setError(err.message || "Failed to update task");
    } finally {
      // Remove from processing
      setProcessingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleComplete = async (taskId) => {
    await handleStatusChange(taskId, "completed");
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    console.log("🚀 Creating task", formData);

    try {
      setError(null);
      const newTask = await createTask(formData);
      setTasks((prev) => [newTask, ...prev]);
      setCreateOpen(false);
      setFormData({
        property_id: "",
        title: "",
        description: "",
        assigned_to: "",
        status: "pending",
      });
      console.log("✅ Task created successfully:", newTask);
    } catch (err) {
      console.error("❌ Error creating task:", err);
      setError(err.message || "Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      setError(null);
      await deleteTask(taskId);
      setTasks((prev) =>
        prev.filter((t) => {
          const id = t.id || t._id;
          return id !== taskId;
        })
      );
    } catch (err) {
      setError(err.message || "Failed to delete task");
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setError(null);
      const taskId = editingTask.id || editingTask._id;
      const updatedTask = await updateTask(taskId, formData);
      setTasks((prev) =>
        prev.map((t) => ((t.id || t._id) === taskId ? updatedTask : t))
      );
      setEditingTask(null);
      setFormData({
        property_id: "",
        title: "",
        description: "",
        assigned_to: "",
        status: "pending",
      });
    } catch (err) {
      setError(err.message || "Failed to update task");
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status || "").toLowerCase().trim();
    switch (normalizedStatus) {
      case "completed":
      case "complete":
        return "bg-green-100 text-green-700";
      case "in_progress":
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
      case "canceled":
        return "bg-rose-100 text-rose-700";
      case "pending":
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = (status || "").toLowerCase().trim();
    switch (normalizedStatus) {
      case "in_progress":
      case "in-progress":
        return "In Progress";
      case "completed":
      case "complete":
        return "Completed";
      case "cancelled":
      case "canceled":
        return "Cancelled";
      case "pending":
      default:
        return "Pending";
    }
  };

  // Transform API task data to Kanban format
  const kanbanTasks = tasks.map((task) => {
    const taskId = task.id || task._id;

    // Map API status to Kanban column names (explicitly handle all cases)
    let column = "Pending";
    const status = (task.status || "").toLowerCase().trim();
    if (status === "in_progress" || status === "in-progress") {
      column = "In Progress";
    } else if (status === "completed" || status === "complete") {
      column = "Completed";
    } else if (status === "cancelled" || status === "canceled") {
      column = "Cancelled";
    } else {
      // Default to Pending for "pending" or any other status
      column = "Pending";
    }

    // Handle nested objects from API response
    const assignedTo =
      typeof task.assigned_to === "object" && task.assigned_to !== null
        ? task.assigned_to
        : users.find((u) => (u.id || u._id) === task.assigned_to) || {};

    const property =
      typeof task.property_id === "object" && task.property_id !== null
        ? task.property_id
        : properties.find((p) => (p.id || p._id) === task.property_id) || {};

    return {
      id: taskId,
      title: task.title || "Untitled Task",
      assignee: assignedTo.name || "Unassigned",
      property: property.title || property.name || "No property",
      description: task.description || "",
      status: task.status,
      column: column,
      createdAt: task.createdAt,
    };
  });

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading tasks..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <svg
              className="w-6 h-6 text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Task Management
          </h1>
        </div>

        <div className="flex gap-2">
          {/* View Mode Switcher - Hidden on mobile */}
          <div className="hidden md:flex rounded-full border border-slate-200 p-1">
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("cards")}
              title="Card View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 6v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setViewMode("kanban")}
              title="Kanban Board"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </button>
          </div>

          <select
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => setCreateOpen(true)}
          >
            <span className="hidden sm:inline">New task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Card View (Mobile) */}
      {viewMode === "cards" && (
        <>
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No tasks yet
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Create your first task to get started
              </p>
              <button
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => setCreateOpen(true)}
              >
                New task
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {tasks.map((task) => {
                const taskId = task.id || task._id;

                // Handle nested objects from API response
                const property =
                  typeof task.property_id === "object" &&
                  task.property_id !== null
                    ? task.property_id
                    : properties.find(
                        (p) => (p.id || p._id) === task.property_id
                      ) || {};

                const assignee =
                  typeof task.assigned_to === "object" &&
                  task.assigned_to !== null
                    ? task.assigned_to
                    : users.find((u) => (u.id || u._id) === task.assigned_to) ||
                      {};

                const propertyName =
                  property.title || property.name || "No property";
                const assigneeName = assignee.name || "Unassigned";

                return (
                  <div
                    key={taskId}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow relative"
                  >
                    {/* Actions Dropdown */}
                    <div className="absolute top-3 right-3 dropdown-container z-10">
                      <button
                        onClick={() =>
                          setOpenDropdownId(
                            openDropdownId === taskId ? null : taskId
                          )
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-200 active:bg-slate-300 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-slate-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === taskId && (
                        <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                          <button
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2"
                            onClick={() => {
                              setEditingTask(task);
                              setFormData({
                                property_id:
                                  typeof task.property_id === "object"
                                    ? task.property_id.id ||
                                      task.property_id._id
                                    : task.property_id || "",
                                title: task.title || "",
                                description: task.description || "",
                                assigned_to:
                                  typeof task.assigned_to === "object"
                                    ? task.assigned_to.id ||
                                      task.assigned_to._id
                                    : task.assigned_to || "",
                                status: task.status || "pending",
                              });
                              setOpenDropdownId(null);
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                            onClick={() => {
                              handleDeleteTask(taskId);
                              setOpenDropdownId(null);
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Task Content - Matching Kanban Card Style */}
                    <div className="flex items-start justify-between gap-2 mb-1 pr-8">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
                        {task.title}
                      </p>
                    </div>
                    {task.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {propertyName && propertyName !== "No property" && (
                      <p className="mt-2 text-xs text-slate-600 font-medium truncate">
                        📍 {propertyName}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
                          {assigneeName.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-xs text-slate-600 truncate max-w-[100px]">
                          {assigneeName}
                          {task.createdAt && (
                            <p className=" text-[10px] text-slate-400">
                              {new Date(task.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          )}
                        </span>
                      </div>

                      {/* Status badge with dropdown */}
                      <div className="relative status-dropdown-container shrink-0">
                        <button
                          onClick={() =>
                            setOpenStatusDropdownId(
                              openStatusDropdownId === taskId ? null : taskId
                            )
                          }
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                            task.status === "completed" ||
                            task.status === "complete"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : task.status === "in_progress" ||
                                task.status === "in-progress"
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : task.status === "cancelled" ||
                                task.status === "canceled"
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              : "bg-red-100 text-red-600 hover:bg-red-200"
                          }`}
                        >
                          {task.status === "completed" ||
                          task.status === "complete"
                            ? "Done"
                            : task.status === "in_progress" ||
                              task.status === "in-progress"
                            ? "Active"
                            : task.status === "cancelled" ||
                              task.status === "canceled"
                            ? "Cancelled"
                            : "Pending"}
                          <svg
                            className="ml-1 h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Status Dropdown Menu */}
                        {openStatusDropdownId === taskId && (
                          <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                            <button
                              className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                                task.status === "pending"
                                  ? "bg-slate-50 text-slate-900"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                              onClick={() => {
                                handleStatusChange(taskId, "pending");
                                setOpenStatusDropdownId(null);
                              }}
                            >
                              Pending
                            </button>
                            <button
                              className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors border-t border-slate-100 ${
                                task.status === "in_progress" ||
                                task.status === "in-progress"
                                  ? "bg-blue-50 text-blue-900"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                              onClick={() => {
                                handleStatusChange(taskId, "in_progress");
                                setOpenStatusDropdownId(null);
                              }}
                            >
                              In Progress
                            </button>
                            <button
                              className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors border-t border-slate-100 ${
                                task.status === "completed" ||
                                task.status === "complete"
                                  ? "bg-green-50 text-green-900"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                              onClick={() => {
                                handleStatusChange(taskId, "completed");
                                setOpenStatusDropdownId(null);
                              }}
                            >
                              Completed
                            </button>
                            <button
                              className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors border-t border-slate-100 ${
                                task.status === "cancelled" ||
                                task.status === "canceled"
                                  ? "bg-rose-50 text-rose-900"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                              onClick={() => {
                                handleStatusChange(taskId, "cancelled");
                                setOpenStatusDropdownId(null);
                              }}
                            >
                              Cancelled
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Kanban View (Desktop) */}
      {viewMode === "kanban" && (
        <>
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No tasks yet
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Create your first task to get started
              </p>
              <button
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => setCreateOpen(true)}
              >
                New task
              </button>
            </div>
          ) : (
            <KanbanBoard
              tasks={kanbanTasks}
              onComplete={handleComplete}
              onStatusChange={handleStatusChange}
              processingTasks={Array.from(processingTasks)}
            />
          )}
        </>
      )}

      {/* Edit Task Modal */}
      <Modal
        title="Edit task"
        description="Update task details and assignment."
        isOpen={Boolean(editingTask)}
        onClose={() => {
          setEditingTask(null);
          setFormData({
            property_id: "",
            title: "",
            description: "",
            assigned_to: "",
            status: "pending",
          });
        }}
        primaryActionLabel="Update task"
        onPrimaryAction={() => {
          document.getElementById("edit-task-form")?.requestSubmit();
        }}
      >
        <form
          id="edit-task-form"
          onSubmit={handleUpdateTask}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Property <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.property_id}
              onChange={(e) =>
                setFormData({ ...formData, property_id: e.target.value })
              }
              required
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option
                  key={property.id || property._id}
                  value={property.id || property._id}
                >
                  {property.title || property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Task title"
              minLength={3}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed task description..."
              rows={4}
              minLength={5}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Assign To <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.assigned_to}
              onChange={(e) =>
                setFormData({ ...formData, assigned_to: e.target.value })
              }
              required
            >
              <option value="">Select a team member</option>
              {users.map((user) => (
                <option key={user.id || user._id} value={user.id || user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        title="Create task"
        description="Assign tasks to team members for property management."
        isOpen={isCreateOpen}
        onClose={() => {
          setCreateOpen(false);
          setFormData({
            property_id: "",
            title: "",
            description: "",
            assigned_to: "",
            status: "pending",
          });
        }}
        primaryActionLabel="Create task"
        onPrimaryAction={() => {
          document.getElementById("create-task-form")?.requestSubmit();
        }}
      >
        <form
          id="create-task-form"
          onSubmit={handleCreateTask}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Property <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.property_id}
              onChange={(e) =>
                setFormData({ ...formData, property_id: e.target.value })
              }
              required
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option
                  key={property.id || property._id}
                  value={property.id || property._id}
                >
                  {property.title || property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Task title"
              minLength={3}
              maxLength={100}
              required
            />
            <p className="mt-1 text-xs text-slate-500">3-100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed task description..."
              rows={4}
              minLength={5}
              required
            />
            <p className="mt-1 text-xs text-slate-500">Minimum 5 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Assign To <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.assigned_to}
              onChange={(e) =>
                setFormData({ ...formData, assigned_to: e.target.value })
              }
              required
            >
              <option value="">Select a team member</option>
              {users.map((user) => (
                <option key={user.id || user._id} value={user.id || user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
