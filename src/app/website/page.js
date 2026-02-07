"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getWebsiteConfig,
  updateWebsiteConfig,
  togglePublicWebsite,
  getImageUrl,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import FormField from "@/components/common/FormField";
import PageLoader from "@/components/common/PageLoader";
import { handleApiError } from "@/utils/errorHandler";

export default function WebsitePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  useSEO({
    title: "Public Website | Zuha Host",
    description: "Manage your public booking website configuration and branding.",
    keywords: "public website, booking website, branding, configuration",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    tenantName: "",
    slug: "",
    publicUrl: "",
    enabled: false,
    canToggle: true,
    logo: "",
    description: "",
    primaryColor: "#3b82f6",
    contactEmail: "",
    contactPhone: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const raw = await getWebsiteConfig();
      // Normalize: API may return config at top level or nested under data/config/websiteConfig
      const configData = raw && (typeof raw === "object")
        ? (raw.data ?? raw.config ?? raw.websiteConfig ?? raw)
        : null;
      if (configData && typeof configData === "object") {
        const tenantName = configData.tenantName ?? configData.name ?? "";
        const slug = configData.slug ?? "";
        const publicUrl = configData.publicUrl ?? (slug ? `${slug}.zuhahost.com` : "");
        const enabled = Boolean(configData.enabled ?? configData.isEnabled);
        const canToggle = configData.canToggle !== false;
        const logo = configData.logo ?? configData.logoUrl ?? "";
        const description = configData.description ?? "";
        const primaryColor = configData.primaryColor ?? "#3b82f6";
        const contactEmail = configData.contactEmail ?? "";
        const contactPhone = configData.contactPhone ?? "";

        setConfig({
          tenantName,
          slug,
          publicUrl,
          enabled,
          canToggle,
          logo,
          description,
          primaryColor,
          contactEmail,
          contactPhone,
        });
        if (logo) {
          setLogoPreview(getImageUrl(logo) || logo);
        } else {
          setLogoPreview(null);
        }
      }
    } catch (error) {
      console.error("Failed to load website configuration:", error);
      handleApiError(error, router, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be less than 2MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleWebsite = async () => {
    if (!config.canToggle) return;
    const toastId = toast.loading(
      config.enabled ? "Disabling website..." : "Enabling website..."
    );

    try {
      await togglePublicWebsite(!config.enabled);
      setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
      toast.success(
        config.enabled
          ? "Public website disabled"
          : "Public website enabled!",
        { id: toastId }
      );
    } catch (error) {
      toast.dismiss(toastId);
      const msg = error?.message || "";
      if (msg.includes("PUBLIC_WEBSITE_NOT_ALLOWED") || msg.includes("not allowed")) {
        toast.error("Upgrade your plan to enable the public website.");
      } else {
        handleApiError(error, router, toast);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Saving configuration...");

    try {
      if (logoFile) {
        // Use FormData if logo is being uploaded
        const formData = new FormData();
        formData.append("description", config.description);
        formData.append("primaryColor", config.primaryColor);
        formData.append("contactEmail", config.contactEmail);
        formData.append("contactPhone", config.contactPhone);
        formData.append("logo", logoFile);

        await updateWebsiteConfig(formData);
      } else {
        // Use JSON if no logo upload
        await updateWebsiteConfig({
          description: config.description,
          primaryColor: config.primaryColor,
          contactEmail: config.contactEmail,
          contactPhone: config.contactPhone,
        });
      }

      toast.success("Configuration saved successfully!", { id: toastId });
      loadData(); // Reload to get updated logo URL
    } catch (error) {
      toast.dismiss(toastId);
      handleApiError(error, router, toast);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  if (isLoading) {
    return <PageLoader message="Loading website configuration..." />;
  }

  const publicUrl = config.publicUrl || (config.slug ? `${config.slug}.zuhahost.com` : "Loading...");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
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
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Your Booking Website</h1>
            <p className="text-slate-600 mt-1">Manage your site and branding from the dashboard</p>
          </div>
        </div>
      </div>

      {/* Website Status Card */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-slate-900">Website Status</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  config.enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {config.enabled ? "Live" : "Disabled"}
              </span>
            </div>

            {config.enabled ? (
              <div className="space-y-2">
                <p className="text-slate-600">
                  Your public booking website is live and accepting bookings! 🎉
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={publicUrl.startsWith("http") ? publicUrl : `https://${publicUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium underline"
                  >
                    {publicUrl}
                  </a>
                  <button
                    onClick={() => {
                      const url = publicUrl.startsWith("http") ? publicUrl : `https://${publicUrl}`;
                      navigator.clipboard.writeText(url);
                      toast.success("URL copied to clipboard!");
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Copy URL"
                  >
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : config.canToggle ? (
              <p className="text-slate-600">
                Enable your public website to start receiving commission-free direct bookings.
              </p>
            ) : (
              <p className="text-slate-600">
                Upgrade your plan to enable your public booking website.
              </p>
            )}
          </div>

          {config.canToggle ? (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.enabled}
                onChange={handleToggleWebsite}
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          ) : (
            <span className="text-sm text-amber-600 font-medium">Upgrade to enable</span>
          )}
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="rounded-3xl border border-slate-100 bg-white shadow-sm p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Website Configuration</h2>

        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo
            </label>
            <div className="flex items-start gap-4">
              {logoPreview && (
                <div className="w-24 h-24 rounded-xl border-2 border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.src = ""; }}
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Logo
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  PNG, JPG, GIF, or WEBP. Max 2MB. Square format recommended.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <FormField
            label="Business Description"
            as="textarea"
            rows={4}
            value={config.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Welcome to our property! We offer..."
          />

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                className="w-16 h-10 rounded-lg border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="#3b82f6"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              This color will be used for buttons and accents on your public website.
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Contact Email"
              type="email"
              value={config.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              placeholder="info@example.com"
            />

            <FormField
              label="Contact Phone"
              type="tel"
              value={config.contactPhone}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => router.push("/properties")}
            className="flex-1 rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex gap-4">
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Why use your public booking website?
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✓ Zero commission fees - keep 100% of your earnings</li>
              <li>✓ Full control over your brand and guest experience</li>
              <li>✓ Instant booking confirmations and calendar sync</li>
              <li>✓ Professional booking flow with payment integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
