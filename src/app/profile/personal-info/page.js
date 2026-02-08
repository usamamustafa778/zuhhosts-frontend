"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth, useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateUserProfile, getCurrencies } from "@/lib/api";
import { setAuthUser } from "@/lib/auth";
import { useSEO } from "@/hooks/useSEO";
import toast from "react-hot-toast";

/** Phone: digits, +, -, (), spaces only (per API) */
const PHONE_REGEX = /^[\d\s\-+()]*$/;

const BUSINESS_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "airbnb_host", label: "Airbnb / Vacation rental" },
  { value: "both", label: "Both" },
];

export default function PersonalInfoPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { isHost, isTeamMember } = useAuth();
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useSEO({
    title: "Personal Information | Zuha Host",
    description: "Update your personal information, contact details, and business details.",
    keywords: "personal information, profile details, contact information, business details, user profile",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    department: "",
    defaultCurrency: "",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchUserData();
    }
  }, [isLoading, isAuthenticated]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [response, currenciesRes] = await Promise.all([
        getUserProfile(),
        getCurrencies().catch(() => ({ currencies: [], defaultCurrency: null })),
      ]);
      const userData = response.user || response;
      const tenantData = userData?.tenant ?? (typeof userData?.tenantId === "object" ? userData.tenantId : null) ?? response?.tenant ?? null;
      setUser(userData);
      setTenant(tenantData);

      const list = currenciesRes?.currencies ?? currenciesRes?.data?.currencies ?? [];
      setCurrencies(Array.isArray(list) ? list : list && typeof list === "object" ? list : []);

      const nameParts = (userData.name || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData({
        firstName,
        lastName,
        email: userData.email || "",
        phone: userData.phone ?? "",
        businessName: userData.businessName || tenantData?.name || "",
        businessType: tenantData?.businessType || "",
        department: userData.department ?? "",
        defaultCurrency: userData.defaultCurrency || currenciesRes?.defaultCurrency || "",
      });
    } catch (err) {
      console.error("Failed to load user data:", err);
      toast.error(err.message || "Failed to load profile information. Please try again.");
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && value !== "" && !PHONE_REGEX.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    if (name.length < 2) {
      toast.error("Name must be at least 2 characters long.");
      return;
    }
    if (formData.phone && !PHONE_REGEX.test(formData.phone.trim())) {
      toast.error("Phone may only contain digits, +, -, (), and spaces.");
      return;
    }
    if (tenant && formData.businessName.trim().length > 0 && formData.businessName.trim().length < 2) {
      toast.error("Business name must be at least 2 characters.");
      return;
    }

    const toastId = toast.loading("Updating personal information...");

    try {
      setSaving(true);

      const updateData = {
        name,
        email: formData.email.trim(),
        phone: formData.phone.trim() === "" ? null : formData.phone.trim(),
        businessName: formData.businessName.trim() || null,
        businessType: formData.businessType || null,
        department: formData.department.trim() || null,
        defaultCurrency: formData.defaultCurrency || undefined,
      };

      const response = await updateUserProfile(updateData);

      const updatedUser = response.user || response;
      if (updatedUser) {
        setUser(updatedUser);
        setAuthUser(updatedUser);
      }
      if (response.tenant) {
        setTenant(response.tenant);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("tenant-updated", { detail: response.tenant }));
        }
      }

      toast.success("Personal information updated successfully!", { id: toastId });
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error(err.message || "Failed to update information. Please try again.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const first = formData.firstName?.charAt(0) || "";
    const last = formData.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-rose-500" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600">Loading your profile…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Page header */}
      <header className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 rounded-lg px-2 py-1 -ml-2"
          aria-label="Go back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Personal information
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Update your name, contact details, business info, and currency.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture Section */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-2xl font-bold text-white shadow-md ring-4 ring-white sm:h-24 sm:w-24 sm:text-3xl">
                {getUserInitials()}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 shadow transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                aria-label="Change photo"
              >
                <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">Profile picture</h2>
              <p className="mt-0.5 text-sm text-slate-600">Upload a photo to help others recognize you.</p>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 rounded"
              >
                Change photo
              </button>
            </div>
          </div>
        </section>

        {/* Personal Details Section */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Personal details</h2>
                <p className="text-xs text-slate-500">Your legal name and role</p>
              </div>
            </div>
          </div>
          <div className="space-y-6 p-6 sm:p-8">
              {/* Legal Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Legal name
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Business name (for hosts without tenant object) */}
              {isHost && !tenant && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Business name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Your business name"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Department (for staff) */}
              {isTeamMember && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="Your department"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              )}
          </div>
        </section>

        {/* Business details (when user has a tenant) */}
        {tenant && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                  <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Business details</h2>
                  <p className="text-xs text-slate-500">Your business name, type, and public URL</p>
                </div>
              </div>
            </div>
            <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Business name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Your business name (min 2 characters)"
                      minLength={2}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Updates your business name and public URL slug.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Business type
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="">Select type</option>
                    {BUSINESS_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Hotel, Airbnb/vacation rental, or both.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                  <p className="text-sm text-slate-600">{tenant.country || "—"}</p>
                  <p className="mt-1 text-xs text-slate-500">Set during signup or tenant setup.</p>
                </div>

                {(tenant?.slug || tenant?.publicUrl) && (
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">Public URL</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">
                      {tenant.publicUrl || `${tenant.slug}.zuhahost.com`}
                    </p>
                  </div>
                )}
            </div>
          </section>
        )}

        {/* Contact information */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Contact information</h2>
                <p className="text-xs text-slate-500">Email and phone</p>
              </div>
            </div>
          </div>
          <div className="space-y-6 p-6 sm:p-8">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+92 300 1234567"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Digits, +, -, (), spaces only. Leave empty to clear.</p>
              </div>
          </div>
        </section>

        {/* Default currency */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0-8v1m0-1c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Default currency</h2>
                <p className="text-xs text-slate-500">Preferred currency for amounts</p>
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Currency
              </label>
              <select
                name="defaultCurrency"
                value={formData.defaultCurrency}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="">Select currency</option>
                {Array.isArray(currencies)
                  ? currencies.map((c) => (
                      <option key={c.code || c.id} value={c.code || c.id}>
                        {c.name ? `${c.code || c.id} — ${c.name}` : c.code || c.id}
                      </option>
                    ))
                  : typeof currencies === "object" && currencies !== null
                    ? Object.entries(currencies).map(([code, name]) => (
                        <option key={code} value={code}>
                          {typeof name === "string" ? `${code} — ${name}` : code}
                        </option>
                      ))
                    : null}
              </select>
              <p className="mt-1 text-xs text-slate-500">Must be a supported currency code (e.g. USD, PKR).</p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving…</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

