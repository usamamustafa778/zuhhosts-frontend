"use client";

import { formatCurrency } from "@/utils/currencyUtils";
import { API_BASE_URL } from "@/lib/api";

// Status Pill Component
function StatusPill({ status }) {
  const statusConfig = {
    trial: { label: "Trial", className: "bg-blue-50 text-blue-700" },
    pending: { label: "Pending Approval", className: "bg-amber-50 text-amber-700" },
    approved: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
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

export default function UserSubscriptionStatus({ subscription, onUploadScreenshot, isLoading }) {
  if (!subscription) return null;

  const packageName = subscription.package?.replace("_", " ") || "N/A";
  const startDate = subscription.startDate
    ? new Date(subscription.startDate).toLocaleDateString()
    : null;
  const endDate = subscription.endDate
    ? new Date(subscription.endDate).toLocaleDateString()
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Current Subscription</h3>
          <p className="text-sm text-slate-600 capitalize">{packageName} Plan</p>
        </div>
        <StatusPill status={subscription.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Price</p>
          <p className="text-lg font-semibold text-slate-900">
            {subscription.price ? formatCurrency(subscription.price, subscription.currency || "USD") : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Max Properties</p>
          <p className="text-lg font-semibold text-slate-900">
            {subscription.maxProperties === -1 ? "Unlimited" : subscription.maxProperties || "N/A"}
          </p>
        </div>
        {startDate && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Start Date</p>
            <p className="text-sm font-medium text-slate-900">{startDate}</p>
          </div>
        )}
        {endDate && (
          <div>
            <p className="text-xs text-slate-500 mb-1">End Date</p>
            <p className="text-sm font-medium text-slate-900">{endDate}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-500 mb-1">Payment Status</p>
          <PaymentStatusPill status={subscription.paymentStatus} />
        </div>
        {subscription.status === "pending" && !subscription.paymentScreenshot && onUploadScreenshot && (
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    await onUploadScreenshot(subscription.id || subscription._id, file);
                  } catch (err) {
                    console.error("Error uploading screenshot:", err);
                  }
                }
              };
              input.click();
            }}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline disabled:opacity-50"
          >
            {isLoading ? "Uploading..." : "Upload Payment Screenshot"}
          </button>
        )}
      </div>

      {subscription.notes && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Notes</p>
          <p className="text-sm text-slate-700">{subscription.notes}</p>
        </div>
      )}

      {subscription.rejectionReason && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-rose-600 mb-1">Rejection Reason</p>
          <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
            {subscription.rejectionReason}
          </p>
        </div>
      )}

      {subscription.paymentScreenshot && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Payment Screenshot</p>
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
    </div>
  );
}

