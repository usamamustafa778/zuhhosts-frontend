"use client";

import { useState, useEffect, useRef } from "react";
import Combobox from "./Combobox";

// Common country codes
const COUNTRY_CODES = [
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+92", country: "PK", flag: "🇵🇰", name: "Pakistan" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "+966", country: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+27", country: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+20", country: "EG", flag: "🇪🇬", name: "Egypt" },
  { code: "+234", country: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "+7", country: "RU", flag: "🇷🇺", name: "Russia" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
];

// Parse existing value to extract country code and number
const parsePhoneValue = (phoneValue) => {
  if (!phoneValue || phoneValue.trim() === "") return { code: "+1", number: "" };
  
  // Sort country codes by length (longest first) to handle cases like +1 vs +123
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  
  // Check if value already starts with a country code
  for (const country of sortedCodes) {
    if (phoneValue.startsWith(country.code)) {
      const remainder = phoneValue.substring(country.code.length).trim();
      return {
        code: country.code,
        number: remainder,
      };
    }
  }
  
  // Default to +1 if no code found (treat as just a number)
  return { code: "+1", number: phoneValue.trim() };
};

export default function PhoneInput({ value, onChange, placeholder, className = "", required = false, error = null }) {
  const parsed = parsePhoneValue(value);
  const [selectedCode, setSelectedCode] = useState(parsed.code);
  const [phoneNumber, setPhoneNumber] = useState(parsed.number);
  const lastValueRef = useRef(value);

  // Update when value prop changes (important for edit mode)
  useEffect(() => {
    // Only update if value actually changed from external source (not from our own onChange)
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      const newParsed = parsePhoneValue(value || "");
    setSelectedCode(newParsed.code);
    setPhoneNumber(newParsed.number);
    }
  }, [value]);

  const handleCodeChange = (code) => {
    setSelectedCode(code);
    // Combine new code with existing number
    const fullPhone = code + (phoneNumber ? ` ${phoneNumber}` : "");
    const formattedValue = fullPhone.trim() || "";
    lastValueRef.current = formattedValue;
    if (onChange) {
      onChange({ target: { value: formattedValue } });
    }
  };

  const handleNumberChange = (e) => {
    const number = e.target.value;
    setPhoneNumber(number);
    // Combine selected code with new number
    const fullPhone = selectedCode + (number ? ` ${number}` : "");
    const formattedValue = fullPhone.trim() || "";
    lastValueRef.current = formattedValue;
    if (onChange) {
      onChange({ target: { value: formattedValue } });
    }
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === selectedCode);

  return (
    <div className={className}>
      <div className="flex gap-2">
        {/* Country Code Selector using Combobox */}
        <div className="w-[140px] shrink-0">
          <Combobox
            value={selectedCode}
            onChange={handleCodeChange}
            options={COUNTRY_CODES}
            getOptionLabel={(country) => `${country.flag} ${country.code}`}
            getOptionValue={(country) => country.code}
            getOptionDescription={(country) => country.name}
            renderOption={(country) => (
              <div className="flex items-center gap-2">
                <span className="text-base">{country.flag}</span>
                <span className="font-medium text-slate-700">{country.code}</span>
                <span className="text-xs text-slate-500 ml-auto">{country.country}</span>
              </div>
            )}
            placeholder={`${selectedCountry?.flag || "🇺🇸"} ${selectedCode}`}
            className="text-sm"
            noOptionsMessage="No country found"
          />
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || "123 456 7890"}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors ${
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
              : "border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          }`}
          required={required}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}

