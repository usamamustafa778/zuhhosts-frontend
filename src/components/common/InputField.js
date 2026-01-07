"use client";

export default function InputField({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  className = "",
  inputClassName = "",
  iconPrefix,
  iconSuffix,
  ...props
}) {
  const baseInputClasses = "w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none transition-colors";
  const errorInputClasses = "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200";
  const normalInputClasses = "border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
  
  const finalInputClasses = `${baseInputClasses} ${error ? errorInputClasses : normalInputClasses} ${inputClassName}`;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {iconPrefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 z-10">
            {iconPrefix}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={finalInputClasses}
          required={required}
          {...props}
        />
        {iconSuffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 z-10">
            {iconSuffix}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}

