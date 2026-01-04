"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { getCurrentUser } from "@/lib/api";

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [notificationSettings, setNotificationSettings] = useState({
    // Bookings
    bookingConfirmed: true,
    bookingCancelled: true,
    bookingReminder: true,
    guestMessage: true,
    
    // Payments
    paymentReceived: true,
    paymentFailed: true,
    payoutProcessed: true,
    
    // Properties
    propertyApproved: true,
    propertyRejected: true,
    maintenanceAlert: true,
    
    // Reviews
    newReview: true,
    reviewReminder: true,
    
    // Marketing
    promotions: false,
    newsletter: true,
    productUpdates: true,
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchUserData();
    }
  }, [isLoading, isAuthenticated]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await getCurrentUser();
      setUser(response.user);
      
      // Load notification settings from user data if available
      if (response.user.notificationSettings) {
        setNotificationSettings(response.user.notificationSettings);
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
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      // API call to update notification settings would go here
      // await updateNotificationSettings(user.id, notificationSettings);
      
      setMessage({ type: "success", text: "Notification preferences updated successfully!" });
    } catch (err) {
      console.error("Failed to update notification settings:", err);
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
    <>
      <Head>
        <title>Notification Settings | Zuha Host</title>
        <meta name="description" content="Customize your notification preferences for bookings, payments, and updates." />
      </Head>
      <div className="min-h-screen bg-white -mx-4 lg:mx-0 -my-6 lg:my-0">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block mb-8 px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Account settings
        </button>
        <h1 className="text-3xl font-semibold text-slate-900">Notifications</h1>
        <p className="mt-2 text-slate-600">Choose how you want to be notified about activity</p>
      </div>

      <div className="px-4 py-6 lg:px-6">
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
          {/* Bookings */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Bookings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Booking confirmed</p>
                  <p className="text-sm text-slate-600">Get notified when a booking is confirmed</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.bookingConfirmed}
                  onToggle={() => handleToggle("bookingConfirmed")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Booking cancelled</p>
                  <p className="text-sm text-slate-600">Get notified when a booking is cancelled</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.bookingCancelled}
                  onToggle={() => handleToggle("bookingCancelled")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Booking reminders</p>
                  <p className="text-sm text-slate-600">Reminders about upcoming check-ins</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.bookingReminder}
                  onToggle={() => handleToggle("bookingReminder")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Guest messages</p>
                  <p className="text-sm text-slate-600">New messages from guests</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.guestMessage}
                  onToggle={() => handleToggle("guestMessage")}
                />
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payments</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Payment received</p>
                  <p className="text-sm text-slate-600">When you receive a payment</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.paymentReceived}
                  onToggle={() => handleToggle("paymentReceived")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Payment failed</p>
                  <p className="text-sm text-slate-600">When a payment fails</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.paymentFailed}
                  onToggle={() => handleToggle("paymentFailed")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Payout processed</p>
                  <p className="text-sm text-slate-600">When a payout is processed</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.payoutProcessed}
                  onToggle={() => handleToggle("payoutProcessed")}
                />
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Properties</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Property approved</p>
                  <p className="text-sm text-slate-600">When your property is approved</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.propertyApproved}
                  onToggle={() => handleToggle("propertyApproved")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Property rejected</p>
                  <p className="text-sm text-slate-600">When your property needs updates</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.propertyRejected}
                  onToggle={() => handleToggle("propertyRejected")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Maintenance alerts</p>
                  <p className="text-sm text-slate-600">Reminders about property maintenance</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.maintenanceAlert}
                  onToggle={() => handleToggle("maintenanceAlert")}
                />
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Reviews</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">New review</p>
                  <p className="text-sm text-slate-600">When you receive a new review</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.newReview}
                  onToggle={() => handleToggle("newReview")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Review reminders</p>
                  <p className="text-sm text-slate-600">Reminders to review guests</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.reviewReminder}
                  onToggle={() => handleToggle("reviewReminder")}
                />
              </div>
            </div>
          </div>

          {/* Marketing */}
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Marketing</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Promotions</p>
                  <p className="text-sm text-slate-600">Special offers and deals</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.promotions}
                  onToggle={() => handleToggle("promotions")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Newsletter</p>
                  <p className="text-sm text-slate-600">Weekly updates and tips</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.newsletter}
                  onToggle={() => handleToggle("newsletter")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Product updates</p>
                  <p className="text-sm text-slate-600">New features and improvements</p>
                </div>
                <ToggleSwitch
                  enabled={notificationSettings.productUpdates}
                  onToggle={() => handleToggle("productUpdates")}
                />
              </div>
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

      {/* Bottom padding for mobile */}
      <div className="h-8 lg:hidden" />
    </div>
    </>
  );
}

