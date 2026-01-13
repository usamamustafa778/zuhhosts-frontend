"use client";

import { formatCurrency } from "@/utils/currencyUtils";
import { API_BASE_URL } from "@/lib/api";

// Status Pill Component
function StatusPill({ status }) {
  const statusConfig = {
    pending: { label: "Pending Approval", className: "bg-amber-50 text-amber-700" },
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

export default function PendingSubscriptionRequest({ subscription, onUploadScreenshot, isLoading }) {
  if (!subscription) return null;

  const packageName = subscription.package?.replace("_", " ") || "N/A";
  const createdDate = subscription.createdAt
    ? new Date(subscription.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            Subscription Pending Approval
          </h2>
          <p className="text-sm text-slate-600">
            Your subscription request is awaiting admin approval
          </p>
        </div>
        <StatusPill status={subscription.status} />
      </div>

      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Package</p>
            <p className="text-sm font-semibold text-slate-900 capitalize">{packageName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Price</p>
            <p className="text-sm font-semibold text-slate-900">
              {subscription.price ? formatCurrency(subscription.price, subscription.currency || "USD") : "Free"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Max Properties</p>
            <p className="text-sm font-semibold text-slate-900">
              {subscription.maxProperties === -1 ? "Unlimited" : subscription.maxProperties || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Payment Status</p>
            <PaymentStatusPill status={subscription.paymentStatus} />
          </div>
        </div>

        {subscription.notes && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{subscription.notes}</p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 mt-4">
          <p className="text-xs text-slate-500 mb-1">Requested On</p>
          <p className="text-sm text-slate-700">{createdDate}</p>
        </div>
      </div>

      {!subscription.paymentScreenshot && onUploadScreenshot && (
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <p className="text-sm font-medium text-slate-900 mb-2">
            Payment Screenshot Required
          </p>
          <p className="text-xs text-slate-600 mb-3">
            Please upload your payment screenshot to complete the subscription request.
          </p>
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
                    alert(err.message || "Failed to upload payment screenshot");
                  }
                }
              };
              input.click();
            }}
            disabled={isLoading}
            className="w-full rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Uploading..." : "Upload Payment Screenshot"}
          </button>
        </div>
      )}

      {subscription.paymentScreenshot && (
        <div className="bg-white rounded-lg p-4 border border-slate-200">
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

