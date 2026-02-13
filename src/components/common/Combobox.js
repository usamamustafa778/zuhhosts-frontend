"use client";

import { useState, useEffect, useRef } from "react";

export default function Combobox({
  value,
  onChange,
  options = [],
  placeholder = "Search...",
  getOptionLabel,
  getOptionValue,
  getOptionDescription,
  renderOption,
  required = false,
  className = "",
  disabled = false,
  noOptionsMessage = "No options found",
  /** When value is empty, show this in the input (e.g. free-typed ID card number) */
  freeTextValue = "",
  /** Called when user types in the input (for single-field search + free text) */
  onInputChange,
  /** If true, dropdown opens only when typed text matches an option (not on focus). Default false = open on focus. */
  showDropdownOnlyOnMatch = false,
  /** If true, hide the chevron-down icon (e.g. for guest search field). */
  hideChevron = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const containerRef = useRef(null);

  // Find selected option when value changes; when no selection, show freeTextValue
  useEffect(() => {
    if (value) {
      const option = options.find(
        (opt) => getOptionValue(opt) === value
      );
      if (option) {
        setSelectedOption(option);
        setSearchQuery(getOptionLabel(option));
      }
    } else {
      setSelectedOption(null);
      setSearchQuery(typeof freeTextValue === "string" ? freeTextValue : "");
    }
  }, [value, options, freeTextValue]);

  // When dropdown is open and input shows the selected option's label, show all options
  // so the user can pick a different option. Otherwise filter by search query.
  const isShowingSelectedLabel =
    showDropdown &&
    selectedOption &&
    searchQuery.trim() === getOptionLabel(selectedOption).trim();
  const filterQuery = isShowingSelectedLabel ? "" : searchQuery;

  const filteredOptions = filterQuery
    ? options.filter((option) => {
        const searchLower = filterQuery.toLowerCase();
        const label = getOptionLabel(option).toLowerCase();
        const description = getOptionDescription
          ? getOptionDescription(option)?.toLowerCase() || ""
          : "";
        return label.includes(searchLower) || description.includes(searchLower);
      })
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setSearchQuery(getOptionLabel(option));
    onChange(getOptionValue(option));
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    if (onInputChange) onInputChange(newValue);
    if (!newValue) {
      setSelectedOption(null);
      onChange("");
      setShowDropdown(false);
      return;
    }
    if (showDropdownOnlyOnMatch) {
      // Only show dropdown when search text matches at least one option
      const searchLower = newValue.toLowerCase().trim();
      const hasMatch = options.some((opt) => {
        const label = (getOptionLabel(opt) || "").toLowerCase();
        const desc = getOptionDescription ? (getOptionDescription(opt) || "").toLowerCase() : "";
        return label.includes(searchLower) || desc.includes(searchLower);
      });
      setShowDropdown(hasMatch);
    } else {
      setShowDropdown(true);
    }
  };

  const handleFocus = () => {
    if (!showDropdownOnlyOnMatch) {
      setShowDropdown(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed ${hideChevron ? "" : "pr-10"}`}
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        required={required && !value}
      />
      {!hideChevron && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-4 w-4 text-slate-400"
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
        </div>
      )}

      <input type="hidden" value={value} required={required} />

      {/* Dropdown */}
      {showDropdown && !disabled && (
        <div className="absolute z-[100] w-full mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={getOptionValue(option) || index}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors border-b border-slate-100 last:border-b-0"
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div className="font-medium text-slate-900">
                      {getOptionLabel(option)}
                    </div>
                    {getOptionDescription && getOptionDescription(option) && (
                      <div className="text-xs text-slate-600">
                        {getOptionDescription(option)}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">
              {noOptionsMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

