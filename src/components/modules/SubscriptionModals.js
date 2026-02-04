"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import Combobox from "@/components/common/Combobox";
import { formatCurrency } from "@/utils/currencyUtils";
import { API_BASE_URL } from "@/lib/api";

// Subscription Status Pill Component
function SubscriptionStatusPill({ status }) {
  const statusConfig = {
    trial: { label: "Trial", className: "bg-blue-50 text-blue-700" },
    pending: { label: "Pending", className: "bg-amber-50 text-amber-700" },
    approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700" },
    rejected: { label: "Rejected", className: "bg-rose-50 text-rose-600" },
    expired: { label: "Expired", className: "bg-slate-100 text-slate-600" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-600" };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

// Payment Status Pill Component
function PaymentStatusPill({ status }) {
  const statusConfig = {
    paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700" },
    unpaid: { label: "Unpaid", className: "bg-amber-50 text-amber-700" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-600" };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

// View Modal
export function ViewSubscriptionModal({ subscription, isOpen, onClose }) {
  if (!subscription) return null;

  return (
    <Modal
      title="Subscription Details"
      description="View complete subscription information."
      isOpen={isOpen}
      onClose={onClose}
      size="large"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">User</label>
            <div className="text-sm text-slate-900">
              <div className="font-semibold">{subscription.userId?.name || "N/A"}</div>
              <div className="text-slate-500">{subscription.userId?.email || "N/A"}</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Package</label>
            <div className="text-sm text-slate-900 capitalize">
              {subscription.package?.replace("_", " ") || "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Price</label>
            <div className="text-sm text-slate-900">
              {subscription.price
                ? formatCurrency(subscription.price, subscription.currency || "USD")
                : "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Max Properties</label>
            <div className="text-sm text-slate-900">
              {subscription.maxProperties === -1 ? "Unlimited" : subscription.maxProperties || "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <SubscriptionStatusPill status={subscription.status} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Payment Status</label>
            <PaymentStatusPill status={subscription.paymentStatus} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <div className="text-sm text-slate-900">
              {subscription.startDate
                ? new Date(subscription.startDate).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <div className="text-sm text-slate-900">
              {subscription.endDate
                ? new Date(subscription.endDate).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        </div>
        {subscription.notes && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
              {subscription.notes}
            </div>
          </div>
        )}
        {subscription.rejectionReason && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Rejection Reason</label>
            <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
              {subscription.rejectionReason}
            </div>
          </div>
        )}
        {subscription.paymentScreenshot && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Payment Screenshot</label>
            <a
              href={`${API_BASE_URL}${subscription.paymentScreenshot}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View Screenshot
            </a>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Created At</label>
            <div className="text-sm text-slate-500">
              {subscription.createdAt
                ? new Date(subscription.createdAt).toLocaleString()
                : "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Updated At</label>
            <div className="text-sm text-slate-500">
              {subscription.updatedAt
                ? new Date(subscription.updatedAt).toLocaleString()
                : "N/A"}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Edit Modal
export function EditSubscriptionModal({ subscription, isOpen, onClose, onSubmit, formData, onFormChange }) {
  if (!subscription) return null;

  return (
    <Modal
      title="Edit Subscription"
      description="Update subscription package, price, and notes."
      isOpen={isOpen}
      onClose={onClose}
      primaryActionLabel="Update Subscription"
      onPrimaryAction={() => {
        document.getElementById("edit-subscription-form")?.requestSubmit();
      }}
    >
      <form id="edit-subscription-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Package <span className="text-rose-500">*</span>
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.package}
            onChange={(e) => onFormChange("package", e.target.value)}
            required
          >
            <option value="">Select Package</option>
            <option value="free_trial">Free Trial</option>
            <option value="basic">Basic</option>
            <option value="big_businesses">Big Businesses</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Price <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.price}
            onChange={(e) => onFormChange("price", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.notes}
            onChange={(e) => onFormChange("notes", e.target.value)}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}

// Approve Modal
export function ApproveSubscriptionModal({ subscription, isOpen, onClose, onSubmit, formData, onFormChange }) {
  if (!subscription) return null;

  return (
    <Modal
      title="Approve Subscription"
      description="Approve this subscription request. Payment verification notes are optional."
      isOpen={isOpen}
      onClose={onClose}
      primaryActionLabel="Approve Subscription"
      onPrimaryAction={() => {
        document.getElementById("approve-subscription-form")?.requestSubmit();
      }}
    >
      <form id="approve-subscription-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.notes}
            onChange={(e) => onFormChange("notes", e.target.value)}
            placeholder="Payment verified successfully. Subscription approved."
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}

// Reject Modal
export function RejectSubscriptionModal({ subscription, isOpen, onClose, onSubmit, formData, onFormChange }) {
  if (!subscription) return null;

  return (
    <Modal
      title="Reject Subscription"
      description="Reject this subscription request. Please provide a reason for rejection."
      isOpen={isOpen}
      onClose={onClose}
      primaryActionLabel="Reject Subscription"
      onPrimaryAction={() => {
        document.getElementById("reject-subscription-form")?.requestSubmit();
      }}
    >
      <form id="reject-subscription-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Rejection Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.rejectionReason}
            onChange={(e) => onFormChange("rejectionReason", e.target.value)}
            placeholder="Payment screenshot is unclear or does not match the subscription amount. Please upload a clearer screenshot."
            rows={4}
            required
          />
        </div>
      </form>
    </Modal>
  );
}

// Create Subscription Modal (for superadmin)
export function CreateSubscriptionModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  users = [],
  isLoading = false,
}) {
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentScreenshot(null);
      setScreenshotPreview(null);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentScreenshot(file);
      const preview = URL.createObjectURL(file);
      setScreenshotPreview(preview);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      paymentScreenshot: paymentScreenshot,
    };
    onSubmit(submitData);
  };

  const packageOptions = [
    { value: "free_trial", label: "Free Trial", price: 0, maxProperties: 5 },
    { value: "basic", label: "Basic", price: 10, maxProperties: 10 },
    { value: "big_businesses", label: "Big Businesses", price: 20, maxProperties: 50 },
    { value: "enterprise", label: "Enterprise", price: 50, maxProperties: -1 },
  ];

  const selectedPackage = packageOptions.find((pkg) => pkg.value === formData.package);

  return (
    <Modal
      title="Create Subscription"
      description="Create a new subscription for a user. You can auto-approve it or leave it pending."
      isOpen={isOpen}
      onClose={onClose}
      primaryActionLabel="Create Subscription"
      onPrimaryAction={() => {
        document.getElementById("create-subscription-form")?.requestSubmit();
      }}
      disabled={isLoading}
    >
      <form id="create-subscription-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            User <span className="text-rose-500">*</span>
          </label>
          <Combobox
            value={formData.userId}
            onChange={(value) => onFormChange("userId", value)}
            options={users}
            getOptionLabel={(user) => `${user.name || "N/A"} (${user.email || "N/A"})`}
            getOptionValue={(user) => user.id || user._id}
            getOptionDescription={(user) => user.email}
            placeholder="Search user by name or email..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Package <span className="text-rose-500">*</span>
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.package}
            onChange={(e) => onFormChange("package", e.target.value)}
            required
          >
            <option value="">Select Package</option>
            {packageOptions.map((pkg) => (
              <option key={pkg.value} value={pkg.value}>
                {pkg.label} - ${pkg.price}/month
                {pkg.maxProperties === -1
                  ? " (Unlimited properties)"
                  : ` (${pkg.maxProperties} properties)`}
              </option>
            ))}
          </select>
        </div>

        {selectedPackage && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-900">{selectedPackage.label} Plan</span>
              <span className="text-lg font-bold text-rose-600">
                {selectedPackage.price === 0
                  ? "Free"
                  : `${formatCurrency(selectedPackage.price, "USD")}/month`}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {selectedPackage.maxProperties === -1
                ? "Unlimited properties"
                : `Up to ${selectedPackage.maxProperties} properties`}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Price (Optional - defaults to package price)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.price || ""}
            onChange={(e) => onFormChange("price", e.target.value)}
            placeholder="Leave empty to use package default"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.status || "pending"}
            onChange={(e) => onFormChange("status", e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Payment Status
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.paymentStatus || "unpaid"}
            onChange={(e) => onFormChange("paymentStatus", e.target.value)}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoApprove"
            checked={formData.autoApprove || false}
            onChange={(e) => onFormChange("autoApprove", e.target.checked)}
            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          <label htmlFor="autoApprove" className="text-sm font-medium text-slate-700">
            Auto-approve subscription (sets status to approved and payment to paid)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Payment Screenshot (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {screenshotPreview && (
            <div className="mt-2">
              <img
                src={screenshotPreview}
                alt="Payment screenshot preview"
                className="max-w-full h-32 object-contain rounded-lg border border-slate-200"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={formData.notes || ""}
            onChange={(e) => onFormChange("notes", e.target.value)}
            placeholder="Additional notes about this subscription..."
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}

