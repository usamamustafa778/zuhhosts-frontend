"use client";

import { useState, useEffect, useRef } from "react";

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  className = "",
  disabled = false,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const selectedOption = options.find(
    (opt) => (typeof opt === "object" ? opt.value : opt) === value
  );

  const displayValue = selectedOption
    ? typeof selectedOption === "object"
      ? selectedOption.label
      : selectedOption
    : placeholder;

  const handleSelect = (option) => {
    const optionValue = typeof option === "object" ? option.value : option;
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-600">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 
            bg-white focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200
            disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400
            flex items-center justify-between
            transition-colors
            ${!value ? "text-slate-400" : "text-slate-900"}
            ${isOpen ? "border-slate-400 ring-2 ring-slate-200" : ""}
          `}
        >
          <span className="truncate text-left flex-1">{displayValue}</span>
          <svg
            className={`h-4 w-4 text-slate-400 ml-2 shrink-0 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {options.length > 0 ? (
              options.map((option, index) => {
                const optionValue =
                  typeof option === "object" ? option.value : option;
                const optionLabel =
                  typeof option === "object" ? option.label : option;
                const isSelected = value === optionValue;

                return (
                  <button
                    key={`${optionValue || "option"}-${index}`}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-3 py-2 text-left text-sm 
                      hover:bg-slate-50 focus:bg-slate-50 focus:outline-none 
                      transition-colors
                      border-b border-slate-100 last:border-b-0
                      ${isSelected ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"}
                    `}
                  >
                    {optionLabel}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">
                No options available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

