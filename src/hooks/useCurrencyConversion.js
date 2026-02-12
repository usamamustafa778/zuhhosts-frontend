"use client";

import { useCallback } from "react";
import { useCurrency } from "./useCurrency";
import { 
  convertCurrencySync, 
  convertCurrency,
  formatCurrency, 
  formatCurrencyWithConversion,
  formatCurrencyWithConversionAsync 
} from "@/utils/currencyUtils";

/**
 * Hook for currency conversion and formatting
 * Provides utilities to convert and format amounts based on the selected currency
 * Uses cached exchange rates for synchronous operations (better performance)
 * Automatically re-renders when currency changes
 * @returns {Object} { currency, convert, convertAsync, format, formatWithConversion, formatWithConversionAsync }
 */
export const useCurrencyConversion = () => {
  const { currency } = useCurrency();
  
  // Memoize conversion functions to ensure they use the latest currency value
  // This ensures components re-render when currency changes

  /**
   * Convert amount from source currency to selected currency (synchronous, uses cached rates)
   * @param {number} amount - Amount to convert
   * @param {string} sourceCurrency - Currency of the amount
   * @returns {number} Converted amount
   */
  const convert = useCallback((amount, sourceCurrency) => {
    return convertCurrencySync(amount, sourceCurrency, currency);
  }, [currency]);

  /**
   * Convert amount from source currency to selected currency (async, fetches fresh rates)
   * @param {number} amount - Amount to convert
   * @param {string} sourceCurrency - Currency of the amount
   * @returns {Promise<number>} Converted amount
   */
  const convertAsync = useCallback(async (amount, sourceCurrency) => {
    return await convertCurrency(amount, sourceCurrency, currency);
  }, [currency]);

  /**
   * Format amount in selected currency (assumes amount is already in selected currency)
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  const format = useCallback((amount) => {
    return formatCurrency(amount, currency);
  }, [currency]);

  /**
   * Convert and format amount from source currency to selected currency (synchronous, uses cached rates)
   * @param {number} amount - Amount to convert and format
   * @param {string} sourceCurrency - Currency of the amount
   * @returns {string} Formatted currency string
   */
  const formatWithConversion = useCallback((amount, sourceCurrency) => {
    return formatCurrencyWithConversion(amount, sourceCurrency, currency);
  }, [currency]);

  /**
   * Convert and format amount from source currency to selected currency (async, fetches fresh rates)
   * @param {number} amount - Amount to convert and format
   * @param {string} sourceCurrency - Currency of the amount
   * @returns {Promise<string>} Formatted currency string
   */
  const formatWithConversionAsync = useCallback(async (amount, sourceCurrency) => {
    return await formatCurrencyWithConversionAsync(amount, sourceCurrency, currency);
  }, [currency]);

  return {
    currency,
    convert,
    convertAsync,
    format,
    formatWithConversion,
    formatWithConversionAsync,
  };
};

