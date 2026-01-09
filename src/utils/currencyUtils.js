/**
 * Currency utility functions for managing default currency in local storage
 */

const CURRENCY_KEY = "defaultCurrency";
const CURRENCY_MAP_KEY = "currencyMap"; // Stores mapping of currency codes to names

/**
 * Get default currency from local storage
 * @returns {string} Currency code (defaults to "USD")
 */
export const getDefaultCurrency = () => {
  if (typeof window === "undefined") return "USD";
  return localStorage.getItem(CURRENCY_KEY) || "USD";
};

/**
 * Get currency name from code using stored currency map
 * @param {string} currencyCode - Currency code
 * @returns {string} Currency name (defaults to currency code if not found)
 */
export const getCurrencyName = (currencyCode) => {
  if (typeof window === "undefined" || !currencyCode) return currencyCode || "USD";
  
  try {
    const currencyMapStr = localStorage.getItem(CURRENCY_MAP_KEY);
    if (currencyMapStr) {
      const currencyMap = JSON.parse(currencyMapStr);
      return currencyMap[currencyCode] || currencyCode;
    }
  } catch (err) {
    console.error("Error reading currency map:", err);
  }
  
  return currencyCode;
};

/**
 * Store currency mapping in local storage
 * @param {Array} currencies - Array of {code, name} objects
 */
export const setCurrencyMap = (currencies) => {
  if (typeof window === "undefined" || !currencies) return;
  
  try {
    const currencyMap = {};
    currencies.forEach((currency) => {
      if (currency.code && currency.name) {
        currencyMap[currency.code] = currency.name;
      }
    });
    localStorage.setItem(CURRENCY_MAP_KEY, JSON.stringify(currencyMap));
  } catch (err) {
    console.error("Error storing currency map:", err);
  }
};

/**
 * Get currency map from local storage
 * @returns {Object} Currency map {code: name}
 */
export const getCurrencyMap = () => {
  if (typeof window === "undefined") return {};
  
  try {
    const currencyMapStr = localStorage.getItem(CURRENCY_MAP_KEY);
    if (currencyMapStr) {
      return JSON.parse(currencyMapStr);
    }
  } catch (err) {
    console.error("Error reading currency map:", err);
  }
  
  return {};
};

/**
 * Set default currency in local storage
 * @param {string} currency - Currency code
 */
export const setDefaultCurrency = (currency) => {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(CURRENCY_KEY, currency || "USD");
  
  // Update user object in local storage if it exists
  try {
    const userStr = localStorage.getItem("luxeboard.authUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.defaultCurrency = currency || "USD";
      localStorage.setItem("luxeboard.authUser", JSON.stringify(user));
    }
  } catch (err) {
    console.error("Error updating user currency in local storage:", err);
  }
};

/**
 * Format amount with currency (no currency name displayed)
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (defaults to user's default currency)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = null) => {
  if (amount === null || amount === undefined) return "N/A";
  
  const currency = currencyCode || getDefaultCurrency();
  
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch (err) {
    // Fallback if currency formatting fails
    return `${currency || "USD"} ${amount.toFixed(2)}`;
  }
};

/**
 * Initialize currency from user object (called after login)
 * @param {Object} user - User object with defaultCurrency
 */
export const initializeCurrencyFromUser = (user) => {
  if (!user) return;
  
  const currency = user.defaultCurrency || "USD";
  setDefaultCurrency(currency);
};

