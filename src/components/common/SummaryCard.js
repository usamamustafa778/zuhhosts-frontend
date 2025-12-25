"use client";

const trendStyles = {
  up: "text-emerald-600 bg-emerald-50",
  down: "text-rose-600 bg-rose-50",
  neutral: "text-slate-600 bg-slate-100",
};

export default function SummaryCard({ label, value, change, trend = "neutral" }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <span
        className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${trendStyles[trend]}`}
      >
        {change}
      </span>
    </div>
  );
}

