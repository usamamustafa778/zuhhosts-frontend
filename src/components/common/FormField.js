"use client";

export default function FormField({
  label,
  as = "input",
  options = [],
  ...props
}) {
  return (
    <label className="space-y-1 text-sm text-slate-600">
      <span className="font-semibold text-sm">{label}</span>

      {as === "textarea" && (
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
          {...props}
        />
      )}

      {as === "select" && (
        <select
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
          {...props}
        >
          {options.map((option, index) => {
            const value = typeof option === "object" ? option.value : option;
            const label = typeof option === "object" ? option.label : option;

            return (
              <option key={`${value || "option"}-${index}`} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      )}

      {as === "input" && (
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
          {...props}
        />
      )}
    </label>
  );
}
