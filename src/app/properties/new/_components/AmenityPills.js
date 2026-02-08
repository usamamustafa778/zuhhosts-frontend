"use client";

export default function AmenityPills({ items, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
            selected.includes(item)
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
