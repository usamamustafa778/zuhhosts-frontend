"use client";

import { formatCurrency } from "@/utils/currencyUtils";
import { getImageUrl } from "@/lib/api";

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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
              <svg
                className="h-5 w-5 text-rose-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Current subscription
              </h2>
              <p className="text-sm text-slate-500 capitalize">
                {packageName} plan
              </p>
            </div>
          </div>
          <StatusPill status={subscription.status} />
        </div>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0-8v1m0-1c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Price</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900">
                {subscription.price ? formatCurrency(subscription.price, subscription.currency || "USD") : "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Max properties</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900">
                {subscription.maxProperties === -1 ? "Unlimited" : subscription.maxProperties ?? "—"}
              </p>
            </div>
          </div>
          {startDate && (
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200/80">
                <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Start date</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{startDate}</p>
              </div>
            </div>
          )}
          {endDate && (
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200/80">
                <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">End date</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{endDate}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Payment status</p>
            <PaymentStatusPill status={subscription.paymentStatus} />
          </div>
          {subscription.status === "pending" && !subscription.paymentScreenshot && onUploadScreenshot && (
            <button
              type="button"
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
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-rose-600" />
                  Uploading…
                </>
              ) : (
                "Upload payment screenshot"
              )}
            </button>
          )}
        </div>

        {subscription.notes && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-slate-500">Notes</p>
            <p className="text-sm text-slate-700">{subscription.notes}</p>
          </div>
        )}

        {subscription.rejectionReason && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-3">
            <p className="mb-1 text-xs font-semibold text-rose-600">Rejection reason</p>
            <p className="text-sm text-rose-700">{subscription.rejectionReason}</p>
          </div>
        )}

        {subscription.paymentScreenshot && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="mb-2 text-xs font-medium text-slate-500">Payment screenshot</p>
            <a
              href={getImageUrl(subscription.paymentScreenshot) || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700"
            >
              View screenshot
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

