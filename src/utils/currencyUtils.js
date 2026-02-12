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

/**
 * Exchange rates relative to USD (base currency)
 * Fallback rates if API fails
 */
const FALLBACK_RATES = {
  USD: 1.0,
  EUR: 0.84218,  // Fallback rate
  PKR: 277.5,    // Fallback rate (approximate - 1 USD = 277.5 PKR as of 2026)
};

const RATES_CACHE_KEY = "currencyRatesCache";
const RATES_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch exchange rates from Frankfurter API
 * @returns {Promise<Object>} Exchange rates object
 */
export const fetchExchangeRates = async () => {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD");
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    const data = await response.json();

    // Extract rates and add USD as base
    const rates = {
      USD: 1.0,
      ...data.rates,
    };

    // Frankfurter API doesn't include PKR, so fetch it separately if needed
    // Or use a fallback rate for PKR
    if (!rates.PKR) {
      // Try to get PKR from exchangerate-api.com as fallback
      try {
        const pkrResponse = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        if (pkrResponse.ok) {
          const pkrData = await pkrResponse.json();
          if (pkrData.rates && pkrData.rates.PKR) {
            rates.PKR = pkrData.rates.PKR;
          } else {
            rates.PKR = FALLBACK_RATES.PKR;
          }
        } else {
          rates.PKR = FALLBACK_RATES.PKR;
        }
      } catch (pkrError) {
        console.log("Could not fetch PKR rate, using fallback");
        rates.PKR = FALLBACK_RATES.PKR;
      }
    }

    // Cache the rates with timestamp
    if (typeof window !== "undefined") {
      const cache = {
        rates,
        timestamp: Date.now(),
      };
      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cache));
    }

    return rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);

    // Try to use cached rates if available
    if (typeof window !== "undefined") {
      const cached = getCachedRates();
      if (cached) {
        console.log("Using cached exchange rates");
        // Ensure PKR is in cached rates
        if (!cached.PKR) {
          cached.PKR = FALLBACK_RATES.PKR;
        }
        return cached;
      }
    }

    // Fallback to static rates
    console.log("Using fallback exchange rates");
    return FALLBACK_RATES;
  }
};

/**
 * Get cached exchange rates if still valid
 * @returns {Object|null} Cached rates or null if expired/not found
 */
const getCachedRates = () => {
  if (typeof window === "undefined") return null;

  try {
    const cacheStr = localStorage.getItem(RATES_CACHE_KEY);
    if (!cacheStr) return null;

    const cache = JSON.parse(cacheStr);
    const age = Date.now() - cache.timestamp;

    // Use cache if less than expiry time
    if (age < RATES_CACHE_EXPIRY && cache.rates) {
      return cache.rates;
    }

    return null;
  } catch (error) {
    console.error("Error reading cached rates:", error);
    return null;
  }
};

/**
 * Get current exchange rates (from cache or API)
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<Object>} Exchange rates object
 */
export const getExchangeRates = async (forceRefresh = false) => {
  // Check cache first if not forcing refresh
  if (!forceRefresh && typeof window !== "undefined") {
    const cached = getCachedRates();
    if (cached) {
      return cached;
    }
  }

  // Fetch fresh rates
  return await fetchExchangeRates();
};

/**
 * Get exchange rate from one currency to another
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Object} rates - Optional rates object (if not provided, uses cached/fallback)
 * @returns {Promise<number>} Exchange rate
 */
export const getExchangeRate = async (fromCurrency, toCurrency, rates = null) => {
  if (fromCurrency === toCurrency) return 1.0;

  let exchangeRates = rates;
  if (!exchangeRates) {
    exchangeRates = await getExchangeRates();
  }

  const fromRate = exchangeRates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1.0;
  const toRate = exchangeRates[toCurrency] || FALLBACK_RATES[toCurrency] || 1.0;

  // Convert: fromCurrency -> USD -> toCurrency
  return toRate / fromRate;
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code (defaults to user's default currency)
 * @param {Object} rates - Optional rates object (if not provided, uses cached/fallback)
 * @returns {Promise<number>} Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency = null, rates = null) => {
  if (amount === null || amount === undefined) return 0;
  if (!fromCurrency) return amount;

  const targetCurrency = toCurrency || getDefaultCurrency();
  if (fromCurrency === targetCurrency) return amount;

  const rate = await getExchangeRate(fromCurrency, targetCurrency, rates);
  return amount * rate;
};

/**
 * Synchronous version of convertCurrency using cached rates
 * Use this for immediate conversions without async overhead
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code (defaults to user's default currency)
 * @returns {number} Converted amount
 */
export const convertCurrencySync = (amount, fromCurrency, toCurrency = null) => {
  if (amount === null || amount === undefined) return 0;
  if (!fromCurrency) return amount;

  const targetCurrency = toCurrency || getDefaultCurrency();
  if (fromCurrency === targetCurrency) return amount;

  // Use cached rates or fallback
  const cachedRates = getCachedRates() || FALLBACK_RATES;
  const fromRate = cachedRates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1.0;
  const toRate = cachedRates[toCurrency] || FALLBACK_RATES[toCurrency] || 1.0;

  const rate = toRate / fromRate;
  return amount * rate;
};

/**
 * Format amount with currency conversion (synchronous version using cached rates)
 * Converts the amount to the target currency before formatting
 * @param {number} amount - Amount to format (assumed to be in sourceCurrency)
 * @param {string} sourceCurrency - Currency of the amount
 * @param {string} targetCurrency - Currency to convert to (defaults to user's default currency)
 * @returns {string} Formatted currency string
 */
export const formatCurrencyWithConversion = (amount, sourceCurrency, targetCurrency = null) => {
  if (amount === null || amount === undefined) return "N/A";

  const target = targetCurrency || getDefaultCurrency();
  const convertedAmount = convertCurrencySync(amount, sourceCurrency, target);

  return formatCurrency(convertedAmount, target);
};

/**
 * Format amount with currency conversion (async version with fresh rates)
 * Converts the amount to the target currency before formatting
 * @param {number} amount - Amount to format (assumed to be in sourceCurrency)
 * @param {string} sourceCurrency - Currency of the amount
 * @param {string} targetCurrency - Currency to convert to (defaults to user's default currency)
 * @returns {Promise<string>} Formatted currency string
 */
export const formatCurrencyWithConversionAsync = async (amount, sourceCurrency, targetCurrency = null) => {
  if (amount === null || amount === undefined) return "N/A";

  const target = targetCurrency || getDefaultCurrency();
  const convertedAmount = await convertCurrency(amount, sourceCurrency, target);

  return formatCurrency(convertedAmount, target);
};

