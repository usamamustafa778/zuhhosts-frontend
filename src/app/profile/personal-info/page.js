"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { getCurrentUser, updateUser } from "@/lib/api";

export default function PersonalInfoPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
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
      const userData = response.user;
      setUser(userData);
      
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        dateOfBirth: userData.dateOfBirth || "",
        address: userData.address || "",
        city: userData.city || "",
        country: userData.country || "",
        postalCode: userData.postalCode || "",
      });
    } catch (err) {
      console.error("Failed to load user data:", err);
      // Set user to null but allow form to be empty
      setUser(null);
      // Form will remain with default empty values
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      
      await updateUser(user.id, formData);
      
      setMessage({ type: "success", text: "Personal information updated successfully!" });
    } catch (err) {
      console.error("Failed to update user:", err);
      setMessage({ type: "error", text: "Failed to update information. Please try again." });
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

  return (
    <>
      <Head>
        <title>Personal Information | Zuha Host</title>
        <meta name="description" content="Update your personal information, contact details, and profile data." />
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
          <h1 className="text-lg font-semibold text-slate-900">Personal information</h1>
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
        <h1 className="text-3xl font-semibold text-slate-900">Personal information</h1>
        <p className="mt-2 text-slate-600">Update your personal details and contact information</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 lg:px-6">
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

        <div className="space-y-6 max-w-2xl">
          {/* Legal Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Legal name
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Phone number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Date of birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* City, Country, Postal Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Postal code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="ZIP/Postal"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Save Button - Sticky on Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:static lg:border-0 lg:p-0 lg:mt-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 active:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      {/* Bottom padding for mobile sticky button */}
      <div className="h-20 lg:hidden" />
    </div>
    </>
  );
}

