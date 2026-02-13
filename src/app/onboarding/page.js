"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setupTenant, getMyTenant } from "@/lib/api";
import FormField from "@/components/common/FormField";
import Select from "@/components/common/Select";
import PageLoader from "@/components/common/PageLoader";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    businessType: "",
  });

  useEffect(() => {
    checkExistingTenant();
  }, []);

  const checkExistingTenant = async () => {
    try {
      const tenant = await getMyTenant();
      if (tenant && tenant.id) {
        // User already has a tenant, redirect to dashboard
        router.push("/dashboard");
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      // If 404, user doesn't have a tenant yet, which is expected
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || formData.name.trim().length < 3) {
        toast.error("Please enter a valid business name (minimum 3 characters)");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.country) {
        toast.error("Please select your country");
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.businessType) {
      toast.error("Please select your business type");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating your workspace...");

    try {
      const result = await setupTenant({
        name: formData.name.trim(),
        country: formData.country,
        businessType: formData.businessType,
      });

      toast.success("Workspace created successfully!", { id: toastId });

      // Update user in local storage if returned
      if (result.data && result.data.user) {
        // Update auth context if needed
        const { setAuthUser } = require("@/lib/auth");
        if (typeof window !== "undefined" && setAuthUser) {
          setAuthUser(result.data.user);
        }
      }

      // Redirect to dashboard or subscription selection
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error) {
      const errorMessage = error.message || "Failed to create workspace";
      toast.error(errorMessage, { id: toastId });
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Setting up your workspace..." />;
  }

  return (
    <div className="min-h-screen bg-linear-to-t from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-400 border-2 border-slate-200"
                    }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded transition-colors ${step > s ? "bg-slate-900" : "bg-slate-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium text-slate-600 px-4">
            <span className={step === 1 ? "text-slate-900" : ""}>Business Info</span>
            <span className={step === 2 ? "text-slate-900" : ""}>Location</span>
            <span className={step === 3 ? "text-slate-900" : ""}>Business Type</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Business Name */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Welcome to Zuha Host! 👋
                  </h1>
                  <p className="text-slate-600">
                    Let's set up your workspace. First, what should we call your business?
                  </p>
                </div>

                <div>
                  <FormField
                    label="Business Name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Grand Plaza Hotel, Beach Villa Rentals"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    This is how your business will appear to guests and staff.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Country */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Where are you located? 🌍
                  </h1>
                  <p className="text-slate-600">
                    This helps us provide the right features and currency for your region.
                  </p>
                </div>

                <Select
                  label="Country"
                  value={formData.country}
                  onChange={(value) => handleChange("country", value)}
                  placeholder="Select your country"
                  options={[
                    "Afghanistan",
                    "Albania",
                    "Algeria",
                    "Argentina",
                    "Australia",
                    "Austria",
                    "Bangladesh",
                    "Belgium",
                    "Brazil",
                    "Canada",
                    "Chile",
                    "China",
                    "Colombia",
                    "Czech Republic",
                    "Denmark",
                    "Egypt",
                    "Finland",
                    "France",
                    "Germany",
                    "Greece",
                    "Hong Kong",
                    "India",
                    "Indonesia",
                    "Iran",
                    "Iraq",
                    "Ireland",
                    "Israel",
                    "Italy",
                    "Japan",
                    "Jordan",
                    "Kenya",
                    "Kuwait",
                    "Lebanon",
                    "Malaysia",
                    "Mexico",
                    "Morocco",
                    "Nepal",
                    "Netherlands",
                    "New Zealand",
                    "Nigeria",
                    "Norway",
                    "Oman",
                    "Pakistan",
                    "Peru",
                    "Philippines",
                    "Poland",
                    "Portugal",
                    "Qatar",
                    "Russia",
                    "Saudi Arabia",
                    "Singapore",
                    "South Africa",
                    "South Korea",
                    "Spain",
                    "Sri Lanka",
                    "Sweden",
                    "Switzerland",
                    "Taiwan",
                    "Thailand",
                    "Turkey",
                    "Ukraine",
                    "United Arab Emirates",
                    "United Kingdom",
                    "United States",
                    "Vietnam",
                  ]}
                />
              </div>
            )}

            {/* Step 3: Business Type */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    What type of business do you run? 🏨
                  </h1>
                  <p className="text-slate-600">
                    This helps us customize the experience for your needs.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Business Type
                  </label>

                  {[
                    {
                      value: "hotel",
                      icon: "🏨",
                      title: "Hotel",
                      description: "Traditional hotel with multiple rooms, floors, and room types",
                    },
                    {
                      value: "airbnb",
                      icon: "🏠",
                      title: "Airbnb / Vacation Rental",
                      description: "Apartments, villas, houses and vacation rentals",
                    },
                    {
                      value: "both",
                      icon: "🏢",
                      title: "Both",
                      description: "I manage both hotels and vacation rentals",
                    },
                  ].map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleChange("businessType", option.value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.businessType === option.value
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{option.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {option.title}
                          </h3>
                          <p className="text-sm text-slate-600">{option.description}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.businessType === option.value
                              ? "border-slate-900 bg-slate-900"
                              : "border-slate-300"
                            }`}
                        >
                          {formData.businessType === option.value && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isCreating}
                  className="flex-1 rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isCreating || !formData.businessType}
                  className="flex-1 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? "Creating..." : "Complete Setup"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Need help? Contact us at{" "}
          <a href="mailto:support@zuhahost.com" className="text-slate-900 underline">
            support@zuhahost.com
          </a>
        </p>
      </div>
    </div>
  );
}
