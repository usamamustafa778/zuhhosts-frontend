"use client";

import { useState, useEffect } from "react";
import { getDefaultCurrency, getCurrencyName, setDefaultCurrency } from "@/utils/currencyUtils";
import { updateDefaultCurrency } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

/**
 * Hook for managing user's default currency
 * @returns {Object} { currency, currencyName, updateCurrency, isLoading }
 */
export const useCurrency = () => {
  const [currency, setCurrency] = useState(() => {
    if (typeof window === "undefined") return "USD";
    return getDefaultCurrency();
  });

  const currencyName = getCurrencyName(currency);

  const [isLoading, setIsLoading] = useState(false);

  // Listen for storage changes (when currency is updated in another tab/window)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "defaultCurrency") {
        setCurrency(getDefaultCurrency());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  /**
   * Update user's default currency
   * @param {string} newCurrency - New currency code
   * @returns {Promise<void>}
   */
  const updateCurrency = async (newCurrency) => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await updateDefaultCurrency(newCurrency);
      const userData = response.user || response;

      // Update state and local storage
      setCurrency(newCurrency);
      setDefaultCurrency(newCurrency);

      // Dispatch event to notify other components
      window.dispatchEvent(new Event("currency-change"));
    } catch (err) {
      console.error("Failed to update currency:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { currency, currencyName, updateCurrency, isLoading };
};

