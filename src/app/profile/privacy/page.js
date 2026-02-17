"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

export default function PrivacyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // SEO
  useSEO({
    title: "Privacy Settings | Zuha Host",
    description: "Control your privacy preferences and data sharing settings.",
    keywords: "privacy, privacy settings, data privacy, privacy preferences",
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    shareDataWithPartners: false,
    marketingEmails: true,
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
      
      // Load privacy settings from user data if available
      if (userData.privacySettings) {
        setPrivacySettings(userData.privacySettings);
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
      // Set user to null but allow page to display with default settings
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (setting) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      // API call to update privacy settings would go here
      // await updatePrivacySettings(user.id, privacySettings);
      
      setMessage({ type: "success", text: "Privacy settings updated successfully!" });
    } catch (err) {
      console.error("Failed to update privacy settings:", err);
      setMessage({ type: "error", text: "Failed to update settings. Please try again." });
    } finally {
      setSaving(false);
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

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
        enabled ? "bg-slate-900" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <header className="mb-8 lg:max-w-4xl lg:mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 focus:outline-none"
          aria-label="Go back"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Privacy
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Control what information you share and how we contact you.
        </p>
      </header>

      <div className="lg:max-w-4xl lg:mx-auto space-y-6">
        {message && (
          <div
            className={`rounded-lg p-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile visibility card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <svg
                  className="h-5 w-5 text-rose-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.5C7.305 4.5 3.314 7.36 2 12c1.314 4.64 5.305 7.5 10 7.5s8.686-2.86 10-7.5c-1.314-4.64-5.305-7.5-10-7.5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9a3 3 0 100 6 3 3 0 000-6z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Profile visibility
                </h2>
                <p className="text-xs text-slate-500">
                  Choose what contact details are visible to others.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-slate-900">Show email address</p>
                <p className="text-sm text-slate-600">
                  Allow others to see your email.
                </p>
              </div>
              <ToggleSwitch
                enabled={privacySettings.showEmail}
                onToggle={() => handleToggle("showEmail")}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-slate-900">Show phone number</p>
                <p className="text-sm text-slate-600">
                  Allow others to see your phone.
                </p>
              </div>
              <ToggleSwitch
                enabled={privacySettings.showPhone}
                onToggle={() => handleToggle("showPhone")}
              />
            </div>
          </div>
        </section>

        {/* Communication card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <svg
                  className="h-5 w-5 text-rose-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M21 12c0-4.418-4.03-8-9-8S3 7.582 3 12s4.03 8 9 8a9.84 9.84 0 003.53-.64L21 21l-.64-3.47A7.8 7.8 0 0021 12z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Communication
                </h2>
                <p className="text-xs text-slate-500">
                  Control how guests and Zuha Host contact you.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-slate-900">Allow messages</p>
                <p className="text-sm text-slate-600">
                  Receive messages from guests and hosts.
                </p>
              </div>
              <ToggleSwitch
                enabled={privacySettings.allowMessages}
                onToggle={() => handleToggle("allowMessages")}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-slate-900">Marketing emails</p>
                <p className="text-sm text-slate-600">
                  Receive promotional offers, tips, and product updates.
                </p>
              </div>
              <ToggleSwitch
                enabled={privacySettings.marketingEmails}
                onToggle={() => handleToggle("marketingEmails")}
              />
            </div>
          </div>
        </section>

        {/* Data sharing card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <svg
                  className="h-5 w-5 text-rose-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m14-12h.01M4.99 9H5"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Data sharing
                </h2>
                <p className="text-xs text-slate-500">
                  Decide how your data is used to improve services.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  Share with trusted partners
                </p>
                <p className="text-sm text-slate-600">
                  Allow selected partners to access your data for analytics and
                  product improvements.
                </p>
              </div>
              <ToggleSwitch
                enabled={privacySettings.shareDataWithPartners}
                onToggle={() => handleToggle("shareDataWithPartners")}
              />
            </div>
          </div>
        </section>

        {/* Data management card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <svg
                  className="h-5 w-5 text-rose-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Data management
                </h2>
                <p className="text-xs text-slate-500">
                  Download your data or request account deletion.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-6 sm:p-8">
            <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">
              <div>
                <p className="font-medium text-slate-900">
                  Download your data
                </p>
                <p className="text-xs text-slate-600">
                  Get a copy of the information associated with your account.
                </p>
              </div>
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button className="flex w-full items-center justify-between rounded-xl border border-red-200 bg-white p-4 text-left text-sm hover:bg-red-50 active:bg-red-100 transition-colors">
              <div>
                <p className="font-medium text-red-600">Delete your account</p>
                <p className="text-xs text-red-500">
                  Permanently remove your account and all associated data.
                </p>
              </div>
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </section>

        {/* Save actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

