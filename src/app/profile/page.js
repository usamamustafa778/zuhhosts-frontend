"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // SEO
  useSEO({
    title: "Account Settings | Zuha Host",
    description: "Manage your account settings, preferences, and personal information.",
    keywords: "account settings, profile, user settings, preferences",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchUserData();
    }
  }, [isLoading, isAuthenticated]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      const userData = response.user || response;
      setUser(userData);
    } catch (err) {
      console.error("Failed to load user data:", err);
      // Don't throw error, just set user to null
      // The page can still be displayed without user data
      setUser(null);
    } finally {
      setLoading(false);
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
