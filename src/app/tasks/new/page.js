"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Combobox from "@/components/common/Combobox";
import InputField from "@/components/common/InputField";
import PageLoader from "@/components/common/PageLoader";
import {
  createTask,
  getAllProperties,
  getAllUsers,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

export default function CreateTaskPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  // SEO
  useSEO({
    title: "Create Task | Zuha Host",
    description: "Create and assign a new task to your team.",
  });

  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      date: new Date().toISOString().split('T')[0],
      paid_to: "",
      paid_by: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [propertiesData, usersData] = await Promise.all([
        getAllProperties(),
        getAllUsers(),
      ]);
      setProperties(propertiesData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load form data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const taskData = {
      property_id: formData.property_id,
      title: formData.title,
      description: formData.description,
      assigned_to: formData.assigned_to,
      status: formData.status,
    };

    // Include payment if checkbox is checked and payment fields are filled
    if (
      formData.includePayment &&
      formData.payment.amount &&
      formData.payment.payment_type
    ) {
      taskData.payment = {
        amount: parseFloat(formData.payment.amount),
        payment_type: formData.payment.payment_type,
        method: formData.payment.method,
        date: formData.payment.date,
        paid_to: formData.payment.paid_to,
        paid_by: formData.payment.paid_by,
        notes: formData.payment.notes,
      };
    }

    const createPromise = createTask(taskData);

    toast.promise(createPromise, {
      loading: "Creating task...",
      success: "Task created successfully!",
      error: (err) => err.message || "Failed to create task",
    });

    try {
      setIsSubmitting(true);
      await createPromise;
      router.push("/tasks");
    } catch (err) {
      console.error("Error creating task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0"
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
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">
            Create New Task
          </h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
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
            <p className="text-xs text-slate-500 -mt-3">3-100 characters</p>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* Payment Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          payment: { ...formData.payment, payment_type: e.target.value },
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
                          payment: { ...formData.payment, method: e.target.value },
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
                  required={formData.includePayment}
                />

                <InputField
                  label="Paid To"
                  type="text"
                  value={formData.payment.paid_to}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, paid_to: e.target.value },
                    })
                  }
                  placeholder="Recipient name"
                />

                <InputField
                  label="Paid By"
                  type="text"
                  value={formData.payment.paid_by}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, paid_by: e.target.value },
                    })
                  }
                  placeholder="Payer name"
                />

                <InputField
                  label="Notes"
                  type="text"
                  value={formData.payment.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, notes: e.target.value },
                    })
                  }
                  placeholder="Additional payment notes"
                />
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

