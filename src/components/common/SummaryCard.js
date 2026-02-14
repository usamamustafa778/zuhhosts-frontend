"use client";

const trendStyles = {
  up: "text-emerald-600 bg-emerald-50",
  down: "text-rose-600 bg-rose-50",
  neutral: "text-slate-600 bg-slate-100",
};

export default function SummaryCard({
  label,
  title,
  value,
  change,
  trend = "neutral",
  icon,
  iconBgColor = "bg-slate-100",
  iconColor = "text-slate-600",
  subtitle,
}) {
  // Support both 'label' (old API) and 'title' (new API)
  const displayTitle = title || label;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Header with Icon and Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {displayTitle && (
            <p className="text-sm font-semibold text-slate-700 leading-tight">{displayTitle}</p>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl ${iconBgColor} shrink-0 ml-3`}>
            <div className={iconColor}>{icon}</div>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-2">
        <p className="text-3xl font-bold text-slate-900 leading-tight">{value}</p>
      </div>

      {/* Subtitle (optional) */}
      {subtitle && (
        <p className="mt-3 text-sm font-medium text-slate-500">{subtitle}</p>
      )}

      {/* Change indicator (optional, for backward compatibility) */}
      {change && (
        <span
          className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${trendStyles[trend]}`}
        >
          {change}
        </span>
      )}
    </div>
  );
}
