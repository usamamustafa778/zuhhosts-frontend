"use client";

import { useState, useEffect } from "react";
import KanbanBoard from "@/components/modules/KanbanBoard";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import { getAllTasks, createTask, updateTask } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";

export default function TasksPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [tasks, setTasks] = useState([]);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    assignee: "",
    status: "To Do",
    dueDate: "",
    priority: "Medium",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllTasks();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load tasks");
        console.error("Error loading tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [isAuthenticated]);

  const handleComplete = async (taskId) => {
    try {
      const task = tasks.find((t) => (t.id || t._id) === taskId);
      if (task) {
        const updatedTask = await updateTask(taskId, { ...task, status: "Done" });
        setTasks((prev) =>
          prev.map((t) => (t.id || t._id) === taskId ? updatedTask : t)
        );
      }
    } catch (err) {
      setError(err.message || "Failed to update task");
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData = {
        title: formData.title,
        assignee: formData.assignee,
        status: formData.status,
        dueDate: formData.dueDate,
        priority: formData.priority,
      };
      const newTask = await createTask(taskData);
      setTasks((prev) => [...prev, newTask]);
      setCreateOpen(false);
      setFormData({
        title: "",
        assignee: "",
        status: "To Do",
        dueDate: "",
        priority: "Medium",
      });
    } catch (err) {
      setError(err.message || "Failed to create task");
    }
  };

  // Transform API task data to Kanban format
  const kanbanTasks = tasks.map((task) => {
    const taskId = task.id || task._id;
    // Map status to column names
    let column = "To Do";
    if (task.status === "In Progress" || task.status === "in-progress") column = "In Progress";
    else if (task.status === "Review" || task.status === "review") column = "Review";
    else if (task.status === "Done" || task.status === "done" || task.status === "completed") column = "Done";

    return {
      id: taskId,
      title: task.title || task.name || "Untitled Task",
      assignee: task.assignee || task.assignedTo || "Unassigned",
      due: task.dueDate || task.due || "No date",
      priority: task.priority || "Medium",
      column: column,
    };
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Checking your access…
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-600">
        Loading tasks…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Tasks
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Kanban board
          </h1>
          <p className="text-sm text-slate-500">
            Coordinate housekeeping, maintenance, and concierge workflows.
          </p>
        </div>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setCreateOpen(true)}
        >
          New task
        </button>
      </div>

      <KanbanBoard tasks={kanbanTasks} onComplete={handleComplete} />

      <Modal
        title="Create task"
        description="Send instant tasks to staff or partners."
        isOpen={isCreateOpen}
        onClose={() => {
          setCreateOpen(false);
          setFormData({
            title: "",
            assignee: "",
            status: "To Do",
            dueDate: "",
            priority: "Medium",
          });
        }}
        primaryActionLabel="Create task"
        primaryAction={handleCreateTask}
      >
        <div className="space-y-4">
          <FormField 
            name="title" 
            label="Title" 
            placeholder="Task title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <FormField 
            name="assignee" 
            label="Assignee" 
            placeholder="Team member"
            value={formData.assignee}
            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
          />
          <FormField
            name="status"
            label="Status"
            as="select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={["To Do", "In Progress", "Review", "Done"]}
          />
          <FormField 
            name="dueDate" 
            label="Due date" 
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <FormField
            name="priority"
            label="Priority"
            as="select"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={["Low", "Medium", "High"]}
          />
        </div>
      </Modal>
    </div>
  );
}

