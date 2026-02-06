"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setupTenant } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import PageLoader from "@/components/common/PageLoader";

export default function TenantSetupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useRequireAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "Pakistan",
    businessType: "hotel",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Setting up your business...");

    try {
      const result = await setupTenant(formData);

      toast.success("Business setup complete!", { id: toastId });

      // Update user in local storage if returned
      if (result.data && result.data.user) {
        // You might want to update your auth context here
        // For now, we'll just redirect
      }

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error) {
      console.error("Tenant setup error:", error);
      toast.error(error.message || "Failed to setup business", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Complete Your Business Setup
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Before you can access your dashboard and features, we need a bit more
            information about your business.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Why do we need this?
              </h3>
              <p className="text-sm text-blue-800">
                Zuha Host is a multi-tenant platform. This setup creates your dedicated
                space where you'll manage properties, bookings, and get your own public
                booking website at <strong>{formData.name ? `${formData.name.toLowerCase().replace(/\s+/g, '-')}.zuhahost.com` : 'yourname.zuhahost.com'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Business Name *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Sunrise Hotel, Beach Villa Rentals"
              helpText="This will be displayed on your public booking website"
              required
            />

            <div className="grid md:grid-cols-2 gap-6">
              <Select
                label="Country *"
                value={formData.country}
                onChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
                options={[
                  "Pakistan",
                  "United States",
                  "United Kingdom",
                  "United Arab Emirates",
                  "India",
                  "Canada",
                  "Australia",
                  "Other",
                ]}
                required
              />

              <Select
                label="Business Type *"
                value={formData.businessType}
                onChange={(value) =>
                  setFormData({ ...formData, businessType: value })
                }
                options={[
                  { value: "hotel", label: "Hotel / Hostel" },
                  { value: "airbnb", label: "Vacation Rentals / Airbnb" },
                  { value: "both", label: "Both" },
                ]}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="w-full rounded-full bg-slate-900 px-6 py-4 text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Setting up..." : "Complete Setup & Continue"}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Your free trial will start automatically. No credit card required.
            </p>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            What happens after setup:
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="text-green-600">✓</div>
              <p className="text-sm text-slate-700">
                You'll get a free trial subscription to explore all features
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-green-600">✓</div>
              <p className="text-sm text-slate-700">
                Your public booking website will be instantly available
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-green-600">✓</div>
              <p className="text-sm text-slate-700">
                You can start adding properties and accepting bookings
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
