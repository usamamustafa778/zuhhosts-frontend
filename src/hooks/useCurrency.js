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
      if (e.key === "defaultCurrency" || e.key === null) {
        const newCurrency = getDefaultCurrency();
        if (newCurrency !== currency) {
          setCurrency(newCurrency);
        }
      }
    };

    // Listen for custom currency-change events (same-tab changes)
    const handleCurrencyChange = (e) => {
      const newCurrency = e.detail?.currency || getDefaultCurrency();
      if (newCurrency !== currency) {
        setCurrency(newCurrency);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("currency-change", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currency-change", handleCurrencyChange);
    };
  }, [currency]); // Include currency in dependencies to check for changes

  /**
   * Update user's default currency
   * @param {string} newCurrency - New currency code
   * @param {boolean} isSuperAdmin - Whether the user is a superadmin
   * @returns {Promise<void>}
   */
  const updateCurrency = async (newCurrency, isSuperAdmin = false) => {
    if (newCurrency === currency) return; // No change needed
    
    setIsLoading(true);
    try {
      // For superadmin, just update localStorage (no API call needed)
      if (isSuperAdmin) {
        setCurrency(newCurrency);
        setDefaultCurrency(newCurrency);
        
        // Dispatch event to notify other components
        const event = new CustomEvent("currency-change", {
          detail: { currency: newCurrency },
          bubbles: true,
        });
        window.dispatchEvent(event);
        
        setIsLoading(false);
        return;
      }

      // For regular users, update via API
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await updateDefaultCurrency(newCurrency);
      const userData = response.user || response;

      // Update state FIRST (synchronous) to trigger immediate re-renders
      setCurrency(newCurrency);
      setDefaultCurrency(newCurrency);

      // Dispatch event to notify other components (including those not using the hook)
      // Use a custom event with detail to ensure it's caught
      const event = new CustomEvent("currency-change", {
        detail: { currency: newCurrency },
        bubbles: true,
      });
      window.dispatchEvent(event);
      
      // Also trigger storage event for cross-tab sync
      window.dispatchEvent(new StorageEvent("storage", {
        key: "defaultCurrency",
        newValue: newCurrency,
      }));
    } catch (err) {
      console.error("Failed to update currency:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { currency, currencyName, updateCurrency, isLoading };
};

