"use client";

export default function SummaryCard({
  title,
  label,
  value,
  subtitle,
  icon,
  iconBgColor = "bg-slate-100",
  iconColor = "text-slate-700",
}) {
  const heading = title || label || "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          {heading && (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {heading}
            </p>
          )}
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBgColor} ${iconColor}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

