"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { getCurrencies } from "@/lib/api";
import { useCurrency } from "@/hooks/useCurrency";
import { setCurrencyMap } from "@/utils/currencyUtils";
import { useSEO } from "@/hooks/useSEO";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { currency, currencyName, updateCurrency, isLoading: updatingCurrency } = useCurrency();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState([]);

  // SEO
  useSEO({
    title: "Account Settings | Zuha Host",
    description: "Manage your account settings, preferences, and personal information.",
    keywords: "account settings, profile, user settings, preferences",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchUserData();
      fetchCurrencies();
    }
  }, [isLoading, isAuthenticated]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // User data is already in local storage from auth, but we can fetch if needed
      setUser(null);
    } catch (err) {
      console.error("Failed to load user data:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await getCurrencies();
      const currenciesList = response.currencies || [];
      setCurrencies(currenciesList);
      
      // Store currency map in local storage for use across the app
      setCurrencyMap(currenciesList);
    } catch (err) {
      console.error("Failed to load currencies:", err);
    }
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;

    try {
      await updateCurrency(newCurrency);
      toast.success("Default currency updated successfully!");
    } catch (err) {
      console.error("Failed to update currency:", err);
      toast.error(err.message || "Failed to update currency. Please try again.");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const settingsItems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: "Personal information",
      href: "/profile/personal-info",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Login & security",
      href: "/profile/security",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Privacy",
      href: "/profile/privacy",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: "Payments",
      href: "/payments",
    },
  ];

  return (
    <div className="min-h-screen bg-white lg:bg-slate-50 -mx-4 lg:mx-0 -my-6 lg:my-0 px-4 lg:px-0 py-6 lg:py-0">
      {/* Mobile: Back Button + Header in same row */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0"
          >
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">
            Account settings
          </h1>
        </div>
      </div>

      {/* Desktop: Header */}
      <div className="hidden lg:block mb-8 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-slate-900">
            Account settings
          </h1>
          <p className="mt-2 text-slate-600">
            Manage your account preferences and settings
          </p>
        </div>
      </div>

      <div className="lg:max-w-4xl lg:mx-auto">
        {/* Email Confirmation Card (Optional - can be shown conditionally) */}
        {user && !user.emailVerified && (
          <div className="mb-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <svg className="w-6 h-6 text-slate-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Confirm your email address</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    We'll send a code to your inbox.
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button className="mt-4 w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors">
              Confirm email
            </button>
          </div>
        )}

        {/* Currency Selector */}
        <div className="mb-6 rounded-2xl bg-white border border-slate-200 p-6 lg:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900">Default currency</h2>
              <p className="text-sm text-slate-600 mt-1">
                This currency will be used as the default when creating new payments, bookings, or properties.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              disabled={updatingCurrency || loading}
              className="w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 py-3.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              {currencies.length > 0 ? (
                currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </option>
                ))
              ) : (
                <option value="USD">US Dollar (USD)</option>
              )}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
              {updatingCurrency && (
                <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {currencyName && (
            <p className="text-xs text-slate-500 mt-3">
              Current default: {currencyName}
            </p>
          )}
        </div>

        {/* Settings List */}
        <div className="space-y-0 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm border-t border-slate-200 -mx-4 lg:mx-0 lg:overflow-hidden">
          {settingsItems.map((item, index) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center justify-between py-5 px-4 lg:px-6 hover:bg-slate-50 active:bg-slate-100 transition-colors ${
                index !== settingsItems.length - 1 ? 'border-b border-slate-200' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-slate-700">
                  {item.icon}
                </div>
                <span className="text-base font-normal text-slate-900">
                  {item.title}
                </span>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
