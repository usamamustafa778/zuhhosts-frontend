"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
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

export default function TasksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    property_id: "",
    title: "",
    description: "",
    assigned_to: "",
    status: "pending",
  });

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
    try {
      setError(null);
      const updatedTask = await updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => ((t.id || t._id) === taskId ? updatedTask : t))
      );
    } catch (err) {
      setError(err.message || "Failed to update task");
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

  // Transform API task data to Kanban format
  const kanbanTasks = tasks.map((task) => {
    const taskId = task.id || task._id;

    // Map API status to Kanban column names
    let column = "Pending";
    if (task.status === "in_progress") column = "In Progress";
    else if (task.status === "completed") column = "Completed";
    else if (task.status === "cancelled") column = "Cancelled";

    return {
      id: taskId,
      title: task.title || "Untitled Task",
      assignee: task.assigned_to?.name || "Unassigned",
      property: task.property_id?.title || "No property",
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
    <>
      <Head>
        <title>Tasks | Zuha Host</title>
        <meta name="description" content="Track and manage property maintenance tasks, cleaning schedules, and team assignments." />
      </Head>
      <div className="space-y-8">
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
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Task Management
          </h1>
        </div>

        <div className="flex gap-2">
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
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => setCreateOpen(true)}
          >
            New task
          </button>
        </div>
      </div>

      <KanbanBoard tasks={kanbanTasks} onComplete={handleComplete} />

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
    </>
  );
}
