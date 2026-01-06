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
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Privacy
          </h1>
        </div>
      </div>

      <div>
        <div className="lg:max-w-4xl lg:mx-auto">
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="max-w-2xl space-y-6">
          {/* Profile Visibility */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile visibility</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Show email address</p>
                  <p className="text-sm text-slate-600">Allow others to see your email</p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.showEmail}
                  onToggle={() => handleToggle("showEmail")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Show phone number</p>
                  <p className="text-sm text-slate-600">Allow others to see your phone</p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.showPhone}
                  onToggle={() => handleToggle("showPhone")}
                />
              </div>
            </div>
          </div>

          {/* Communication */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Communication</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Allow messages</p>
                  <p className="text-sm text-slate-600">Receive messages from guests and hosts</p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.allowMessages}
                  onToggle={() => handleToggle("allowMessages")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Marketing emails</p>
                  <p className="text-sm text-slate-600">Receive promotional offers and updates</p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.marketingEmails}
                  onToggle={() => handleToggle("marketingEmails")}
                />
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Data sharing</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Share with partners</p>
                  <p className="text-sm text-slate-600">Allow partners to access your data for improved services</p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.shareDataWithPartners}
                  onToggle={() => handleToggle("shareDataWithPartners")}
                />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Data management</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <div className="text-left">
                  <p className="font-medium text-slate-900">Download your data</p>
                  <p className="text-sm text-slate-600">Get a copy of all your information</p>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button className="w-full flex items-center justify-between rounded-lg border border-red-200 p-4 hover:bg-red-50 active:bg-red-100 transition-colors">
                <div className="text-left">
                  <p className="font-medium text-red-600">Delete your account</p>
                  <p className="text-sm text-red-500">Permanently remove your account and data</p>
                </div>
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="max-w-2xl mt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full lg:w-auto rounded-lg bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800 active:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

