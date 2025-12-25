"use client";

const variants = {
  Confirmed: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Cancelled: "bg-rose-50 text-rose-600",
  Maintenance: "bg-amber-50 text-amber-700",
  Listed: "bg-emerald-50 text-emerald-700",
  Active: "bg-sky-50 text-sky-700",
  Away: "bg-slate-100 text-slate-600",
  Failed: "bg-rose-50 text-rose-600",
  Completed: "bg-emerald-50 text-emerald-600",
  Default: "bg-slate-100 text-slate-600",
};

export default function StatusPill({ label }) {
  const style = variants[label] || variants.Default;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

