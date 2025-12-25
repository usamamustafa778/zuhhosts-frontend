"use client";

import dayjs from "dayjs";

const intensity = (count) => {
  if (count >= 5) return "bg-emerald-500 text-white";
  if (count >= 3) return "bg-emerald-200 text-emerald-900";
  if (count > 0) return "bg-emerald-100 text-emerald-900";
  return "bg-slate-100 text-slate-400";
};

export default function BookingCalendar({ data = [] }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">Calendar View</h4>
        <span className="text-xs text-slate-500">Next 7 days</span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {data.map((item, index) => (
          <div
            key={item.date || `calendar-day-${index}`}
            className={`flex flex-col items-center justify-center rounded-2xl px-2 py-3 ${intensity(item.count)}`}
          >
            <span>{dayjs(item.date).format("dd")}</span>
            <span className="text-base font-bold">{item.count}</span>
            <span>{dayjs(item.date).format("D")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

