"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import KanbanBoard from "@/components/modules/KanbanBoard";
import Modal from "@/components/common/Modal";
import PageLoader from "@/components/common/PageLoader";
import Combobox from "@/components/common/Combobox";
import InputField from "@/components/common/InputField";
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
import { formatCurrency } from "@/utils/currencyUtils";

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
  const [filterStatus, setFilterStatus] = useState(() => {
    // Default to all on desktop, pending on mobile
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 ? "all" : "pending";
    }
    return "all";
  });
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
    includePayment: false,
    payment: {
      amount: "",
      payment_type: "maintenance_work",
      method: "cash",
      status: "unpaid",
      date: new Date().toISOString().split("T")[0],
      paid_to: "",
      paid_by: "",
      notes: "",
    },
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
      const params = filterStatus && filterStatus !== "all" ? `?status=${filterStatus}` : "";

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

  // Handle create task button - redirect to new page on mobile, open modal on desktop
  const handleCreateTaskClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.push("/tasks/new");
    } else {
      setCreateOpen(true);
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

    const toastId = toast.loading("Updating task status...");

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

      toast.success("Task status updated successfully", { id: toastId });
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
      toast.error(err.message || "Failed to update task status", {
        id: toastId,
      });
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

    const toastId = toast.loading("Creating task...");

    try {
      setError(null);

      // Prepare task data
      const taskData = {
        property_id: formData.property_id,
        title: formData.title,
        description: formData.description || undefined,
        assigned_to: formData.assigned_to,
        status: formData.status,
      };

      // Include payment if checkbox is checked and required fields are filled
      if (
        formData.includePayment &&
        formData.payment.amount &&
        formData.payment.payment_type &&
        formData.payment.method
      ) {
        taskData.payment = {
          amount: parseFloat(formData.payment.amount),
          payment_type: formData.payment.payment_type,
          method: formData.payment.method,
          status: formData.payment.status || "unpaid",
          date: formData.payment.date
            ? new Date(formData.payment.date).toISOString()
            : undefined,
          paid_to: formData.payment.paid_to || undefined,
          paid_by: formData.payment.paid_by || undefined,
          notes: formData.payment.notes || undefined,
        };
      }

      const newTask = await createTask(taskData);
      setTasks((prev) => [newTask, ...prev]);
      setCreateOpen(false);
      setFormData({
        property_id: "",
        title: "",
        description: "",
        assigned_to: "",
        status: "pending",
        includePayment: false,
        payment: {
          amount: "",
          payment_type: "maintenance_work",
          method: "cash",
          status: "unpaid",
          date: new Date().toISOString().split("T")[0],
          paid_to: "",
          paid_by: "",
          notes: "",
        },
      });
      console.log("✅ Task created successfully:", newTask);
      toast.success("Task created successfully", { id: toastId });
    } catch (err) {
      console.error("❌ Error creating task:", err);
      setError(err.message || "Failed to create task");
      toast.error(err.message || "Failed to create task", { id: toastId });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const toastId = toast.loading("Deleting task...");

    try {
      setError(null);
      await deleteTask(taskId);
      setTasks((prev) =>
        prev.filter((t) => {
          const id = t.id || t._id;
          return id !== taskId;
        })
      );
      toast.success("Task deleted successfully", { id: toastId });
    } catch (err) {
      setError(err.message || "Failed to delete task");
      toast.error(err.message || "Failed to delete task", { id: toastId });
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    const toastId = toast.loading("Updating task...");

    try {
      setError(null);
      const taskId = editingTask.id || editingTask._id;

      // Prepare task data
      const taskData = {};
      if (formData.property_id) taskData.property_id = formData.property_id;
      if (formData.title) taskData.title = formData.title;
      if (formData.description) taskData.description = formData.description;
      if (formData.assigned_to) taskData.assigned_to = formData.assigned_to;
      if (formData.status) taskData.status = formData.status;

      // Include payment if checkbox is checked and required fields are filled
      if (
        formData.includePayment &&
        formData.payment.amount &&
        formData.payment.payment_type &&
        formData.payment.method
      ) {
        taskData.payment = {
          amount: parseFloat(formData.payment.amount),
          payment_type: formData.payment.payment_type,
          method: formData.payment.method,
          status: formData.payment.status || "unpaid",
          date: formData.payment.date
            ? new Date(formData.payment.date).toISOString()
            : undefined,
          paid_to: formData.payment.paid_to || undefined,
          paid_by: formData.payment.paid_by || undefined,
          notes: formData.payment.notes || undefined,
        };
      }

      const updatedTask = await updateTask(taskId, taskData);
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
        includePayment: false,
        payment: {
          amount: "",
          payment_type: "maintenance_work",
          method: "cash",
          status: "unpaid",
          date: new Date().toISOString().split("T")[0],
          paid_to: "",
          paid_by: "",
          notes: "",
        },
      });
      toast.success("Task updated successfully", { id: toastId });
    } catch (err) {
      setError(err.message || "Failed to update task");
      toast.error(err.message || "Failed to update task", { id: toastId });
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
      payment: task.payment || null, // Include payment info for display
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

        <div className="flex gap-2 items-center">
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

          {/* Filter Dropdown - Desktop only */}
          <select
            className="hidden md:block rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-slate-400"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={handleCreateTaskClick}
          >
            <span className="hidden sm:inline">New task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs - Mobile only */}
      <div className="md:hidden flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterStatus === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setFilterStatus("all")}
        >
          All
        </button>
        <button
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterStatus === "pending"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setFilterStatus("pending")}
        >
          Pending
        </button>
        <button
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterStatus === "in_progress"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setFilterStatus("in_progress")}
        >
          Progress
        </button>
        <button
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterStatus === "completed"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setFilterStatus("completed")}
        >
          Completed
        </button>
        <button
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterStatus === "cancelled"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setFilterStatus("cancelled")}
        >
          Cancelled
        </button>
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
                onClick={handleCreateTaskClick}
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
                              const taskPayment = task.payment || {};
                              const paymentDate = taskPayment.date
                                ? new Date(taskPayment.date)
                                    .toISOString()
                                    .split("T")[0]
                                : new Date().toISOString().split("T")[0];

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
                                includePayment: Boolean(
                                  taskPayment && taskPayment.amount !== undefined
                                ),
                                payment: {
                                  amount: taskPayment.amount?.toString() || "",
                                  payment_type:
                                    taskPayment.payment_type ||
                                    "maintenance_work",
                                  method: taskPayment.method || "cash",
                                  status: taskPayment.status || "unpaid",
                                  date: paymentDate,
                                  paid_to: taskPayment.paid_to || "",
                                  paid_by: taskPayment.paid_by || "",
                                  notes: taskPayment.notes || "",
                                },
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
                onClick={handleCreateTaskClick}
              >
                New task
              </button>
            </div>
          ) : (
            <KanbanBoard
              tasks={kanbanTasks}
              onComplete={handleComplete}
              onStatusChange={handleStatusChange}
              onEdit={(kanbanTask) => {
                // Find the original task from the tasks array
                const originalTask = tasks.find((t) => {
                  const taskId = t.id || t._id;
                  return taskId === kanbanTask.id;
                });

                if (originalTask) {
                  setEditingTask(originalTask);
                  const taskPayment = originalTask.payment || {};
                  const paymentDate = taskPayment.date
                    ? new Date(taskPayment.date).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0];

                  setFormData({
                    property_id:
                      typeof originalTask.property_id === "object"
                        ? originalTask.property_id.id ||
                          originalTask.property_id._id
                        : originalTask.property_id || "",
                    title: originalTask.title || "",
                    description: originalTask.description || "",
                    assigned_to:
                      typeof originalTask.assigned_to === "object"
                        ? originalTask.assigned_to.id ||
                          originalTask.assigned_to._id
                        : originalTask.assigned_to || "",
                    status: originalTask.status || "pending",
                    includePayment: Boolean(taskPayment && taskPayment.amount !== undefined),
                    payment: {
                      amount: taskPayment.amount?.toString() || "",
                      payment_type:
                        taskPayment.payment_type || "maintenance_work",
                      method: taskPayment.method || "cash",
                      date: paymentDate,
                      paid_to: taskPayment.paid_to || "",
                      paid_by: taskPayment.paid_by || "",
                      notes: taskPayment.notes || "",
                    },
                  });
                }
              }}
              onDelete={handleDeleteTask}
              processingTasks={Array.from(processingTasks)}
            />
          )}
        </>
      )}

      {/* Edit Task Modal */}
      <Modal
        title="Edit Task"
        description="Update task details, assignment, and payment information."
        isOpen={Boolean(editingTask)}
        onClose={() => {
          setEditingTask(null);
          setFormData({
            property_id: "",
            title: "",
            description: "",
            assigned_to: "",
            status: "pending",
            includePayment: false,
            payment: {
              amount: "",
              payment_type: "maintenance_work",
              method: "cash",
              date: new Date().toISOString().split("T")[0],
              paid_to: "",
              paid_by: "",
              notes: "",
            },
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
          <InputField
            label="Title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Task title"
            minLength={3}
            maxLength={100}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed task description (optional)..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Property <span className="text-rose-500">*</span>
            </label>
            <Combobox
              value={formData.property_id}
              onChange={(value) =>
                setFormData({ ...formData, property_id: value })
              }
              options={properties}
              getOptionLabel={(property) => property.title || property.name}
              getOptionValue={(property) => property.id || property._id}
              getOptionDescription={(property) =>
                property.address || property.location
              }
              placeholder="Search property by name, address, or location..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assign To <span className="text-rose-500">*</span>
              </label>
              <Combobox
                value={formData.assigned_to}
                onChange={(value) =>
                  setFormData({ ...formData, assigned_to: value })
                }
                options={users}
                getOptionLabel={(user) => `${user.name} (${user.email})`}
                getOptionValue={(user) => user.id || user._id}
                getOptionDescription={(user) => user.email}
                placeholder="Search team member..."
                required
              />
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
          </div>

          {/* Payment Section */}
          <div className="pt-4 border-t border-slate-200">
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={formData.includePayment}
                onChange={(e) =>
                  setFormData({ ...formData, includePayment: e.target.checked })
                }
                className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Include Payment
              </span>
              {editingTask &&
                editingTask.payment &&
                editingTask.payment.amount !== undefined &&
                formData.includePayment && (
                  <span className="text-xs text-slate-500 ml-2">
                    ({formatCurrency(editingTask.payment.amount || 0, editingTask.payment.currency || null)} •{" "}
                    {(editingTask.payment.status || "unpaid") === "paid"
                      ? "Paid"
                      : "Unpaid"}
                    )
                  </span>
                )}
            </label>

            {formData.includePayment && (
              <div className="space-y-4 pl-6 border-l-2 border-slate-200">
                <InputField
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.payment.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, amount: e.target.value },
                    })
                  }
                  placeholder="0.00"
                  required={formData.includePayment}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={formData.payment.payment_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment: {
                            ...formData.payment,
                            payment_type: e.target.value,
                          },
                        })
                      }
                      required={formData.includePayment}
                    >
                      <option value="maintenance_work">Maintenance work</option>
                      <option value="staff_payment">Staff payment</option>
                      <option value="utility_bills">Utility bills</option>
                      <option value="supplies">Supplies</option>
                      <option value="refund">Refund</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={formData.payment.method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment: {
                            ...formData.payment,
                            method: e.target.value,
                          },
                        })
                      }
                      required={formData.includePayment}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={formData.payment.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment: {
                          ...formData.payment,
                          status: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <InputField
                  label="Date"
                  type="date"
                  value={formData.payment.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, date: e.target.value },
                    })
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Paid To"
                    type="text"
                    value={formData.payment.paid_to}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment: {
                          ...formData.payment,
                          paid_to: e.target.value,
                        },
                      })
                    }
                    placeholder="Person/entity name"
                  />

                  <InputField
                    label="Paid By"
                    type="text"
                    value={formData.payment.paid_by}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment: {
                          ...formData.payment,
                          paid_by: e.target.value,
                        },
                      })
                    }
                    placeholder="Person/entity name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
                    value={formData.payment.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment: { ...formData.payment, notes: e.target.value },
                      })
                    }
                    placeholder="Additional payment notes..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Create Task Modal - Desktop Only */}
      <Modal
        title="Create New Task"
        isOpen={
          isCreateOpen &&
          typeof window !== "undefined" &&
          window.innerWidth >= 768
        }
        onClose={() => {
          setCreateOpen(false);
          setFormData({
            property_id: "",
            title: "",
            description: "",
            assigned_to: "",
            status: "pending",
            includePayment: false,
            payment: {
              amount: "",
              payment_type: "maintenance_work",
              method: "cash",
              date: new Date().toISOString().split("T")[0],
              paid_to: "",
              paid_by: "",
              notes: "",
            },
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
          <InputField
            label="Title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Task title"
            minLength={3}
            maxLength={100}
            required
          />
          <p className="text-xs text-slate-500 -mt-2">3-100 characters</p>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">
              Description
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed task description (optional)..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Property <span className="text-rose-500">*</span>
            </label>
            <Combobox
              value={formData.property_id}
              onChange={(value) =>
                setFormData({ ...formData, property_id: value })
              }
              options={properties}
              getOptionLabel={(property) => property.title || property.name}
              getOptionValue={(property) => property.id || property._id}
              getOptionDescription={(property) =>
                property.address || property.location
              }
              placeholder="Search property by name, address, or location..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assign To <span className="text-rose-500">*</span>
              </label>
              <Combobox
                value={formData.assigned_to}
                onChange={(value) =>
                  setFormData({ ...formData, assigned_to: value })
                }
                options={users}
                getOptionLabel={(user) => `${user.name} (${user.email})`}
                getOptionValue={(user) => user.id || user._id}
                getOptionDescription={(user) => user.email}
                placeholder="Search team member..."
                required
              />
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
          </div>

          {/* Payment Section */}
          <div className="pt-4 border-t border-slate-200">
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={formData.includePayment}
                onChange={(e) =>
                  setFormData({ ...formData, includePayment: e.target.checked })
                }
                className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Include Payment
              </span>
            </label>

            {formData.includePayment && (
              <div className="space-y-4 pl-6 border-l-2 border-slate-200">
                <InputField
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.payment.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, amount: e.target.value },
                    })
                  }
                  placeholder="0.00"
                  required={formData.includePayment}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={formData.payment.payment_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment: {
                            ...formData.payment,
                            payment_type: e.target.value,
                          },
                        })
                      }
                      required={formData.includePayment}
                    >
                      <option value="maintenance_work">Maintenance work</option>
                      <option value="staff_payment">Staff payment</option>
                      <option value="utility_bills">Utility bills</option>
                      <option value="supplies">Supplies</option>
                      <option value="refund">Refund</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={formData.payment.method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment: {
                            ...formData.payment,
                            method: e.target.value,
                          },
                        })
                      }
                      required={formData.includePayment}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={formData.payment.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment: {
                          ...formData.payment,
                          status: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <InputField
                  label="Date"
                  type="date"
                  value={formData.payment.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, date: e.target.value },
                    })
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Paid To"
                    type="text"
                    value={formData.payment.paid_to}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment: {
                          ...formData.payment,
                          paid_to: e.target.value,
                        },
                      })
                    }
                    placeholder="Person/entity name"
                  />

                  <InputField
                    label="Paid By"
                    type="text"
                    value={formData.payment.paid_by}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment: {
                          ...formData.payment,
                          paid_by: e.target.value,
                        },
                      })
                    }
                    placeholder="Person/entity name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
                    value={formData.payment.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment: { ...formData.payment, notes: e.target.value },
                      })
                    }
                    placeholder="Additional payment notes..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
