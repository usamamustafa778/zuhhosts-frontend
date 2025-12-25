"use client";

import dayjs from "dayjs";

const intensity = (count) => {
  if (count >= 5) return "bg-emerald-500 text-white";
  if (count >= 3) return "bg-emerald-400 text-white";
  if (count > 0) return "bg-emerald-200 text-emerald-900";
  return "bg-slate-100 text-slate-400";
};

export default function BookingCalendar({ data = [] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-slate-800">Next 30 Days</h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-slate-100"></div>
            <span className="text-slate-600">No bookings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-emerald-200"></div>
            <span className="text-slate-600">1-2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-emerald-400"></div>
            <span className="text-slate-600">3-4</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-emerald-500"></div>
            <span className="text-slate-600">5+</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {data.map((item, index) => {
          const date = dayjs(item.date);
          const isToday = date.isSame(dayjs(), 'day');
          
          return (
            <div
              key={item.date || `calendar-day-${index}`}
              className={`relative flex flex-col items-center justify-center rounded-lg p-3 transition-all hover:scale-105 ${intensity(item.count)} ${
                isToday ? 'ring-2 ring-rose-500 ring-offset-2' : ''
              }`}
            >
              <span className="text-xs font-medium opacity-60">
                {date.format("MMM")}
              </span>
              <span className="text-2xl font-bold">{date.format("D")}</span>
              <span className="text-xs font-medium opacity-90">
                {date.format("ddd")}
              </span>
              {item.count > 0 && (
                <div className="absolute top-1 right-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-xs font-bold">
                    {item.count}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Total Bookings:</span>{" "}
          {data.reduce((sum, item) => sum + item.count, 0)} bookings in the next 30 days
        </p>
      </div>
    </div>
  );
}
