"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Lock } from "lucide-react";
import { registerUser } from "@/lib/api";
import { setAuthToken, setAuthUser, getAuthToken } from "@/lib/auth";
import InputField from "@/components/common/InputField";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.replace("/dashboard");
    }

    // Set page title and meta tags for SEO
    document.title =
      "Create Account - Zuha Hosts | Start Managing Properties";

    const metaTags = [
      {
        name: "description",
        content:
          "Create your free Zuha Hosts account. Start managing your vacation rentals, properties, bookings, and guests with our comprehensive property management platform.",
      },
      {
        name: "keywords",
        content:
          "zuha hosts signup, property management registration, booking system signup, hospitality platform register, vacation rental account",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://zuhahosts.com/register",
      },
      {
        property: "og:title",
        content:
          "Create Account - Zuha Hosts | Start Managing Properties",
      },
      {
        property: "og:description",
        content:
          "Sign up for Zuha Hosts and start managing your properties efficiently. Free 14-day trial, no credit card required.",
      },
      {
        property: "og:image",
        content: "https://zuhahosts.com/og-image-register.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Create Your Zuha Hosts Account",
      },
      {
        name: "twitter:description",
        content:
          "Start managing properties with our comprehensive booking platform. Free trial available.",
      },
    ];

    // Set meta tags
    metaTags.forEach((tag) => {
      const key = tag.name ? "name" : "property";
      const value = tag.name || tag.property;
      let element = document.querySelector(`meta[${key}="${value}"]`);

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(key, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", tag.content);
    });

    // Set canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://zuhahosts.com/register");

    // Add structured data for registration page
    const registerSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Create Account - Zuha Hosts",
      description:
        "Sign up for Zuha Hosts property management platform",
      url: "https://zuhahosts.com/register",
      mainEntity: {
        "@type": "SoftwareApplication",
        name: "Zuha Hosts",
        applicationCategory: "BusinessApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free 14-day trial, no credit card required",
        },
      },
    };

    let script = document.getElementById("register-schema");
    if (!script) {
      script = document.createElement("script");
      script.id = "register-schema";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(registerSchema);
  }, [router]);

  const validateField = (name, value) => {
    let error = "";
    
    if (name === "name") {
      if (!value) {
        error = "Full name is required";
      } else if (value.trim().length < 2) {
        error = "Name must be at least 2 characters";
      }
    } else if (name === "email") {
      if (!value) {
        error = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Please enter a valid email address";
      }
    } else if (name === "password") {
      if (!value) {
        error = "Password is required";
      } else if (value.length < 8) {
        error = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
        error = "Password must contain at least one uppercase and one lowercase letter";
      } else if (!/(?=.*\d)/.test(value)) {
        error = "Password must contain at least one number";
      }
    }
    
    return error;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    // Validate all fields
    const nameError = validateField("name", formData.name);
    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);
    
    setFieldErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
    });

    if (nameError || emailError || passwordError) {
      setError("Please fix the errors above before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerUser(formData);
      const token =
        response?.token ||
        response?.accessToken ||
        response?.data?.token ||
        response?.data?.accessToken;
      const user =
        response?.user ||
        response?.data?.user ||
        null;

      if (!token) {
        throw new Error("Registration succeeded but no token was returned.");
      }

      setAuthToken(token);
      setAuthUser(user);
      setSuccess("Account created successfully! Redirecting to dashboard…");
      setTimeout(() => {
        router.replace("/dashboard");
      }, 500);
    } catch (err) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4 py-12">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-rose-400/20 to-pink-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 blur-3xl"></div>
      </div>

      {/* Register card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-rose-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
        <div className="space-y-8 rounded-3xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-10">
          {/* Logo and header */}
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-3xl shadow-lg shadow-rose-500/30">
              🏠
            </div>
            <div className="space-y-2">
              <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-3xl font-bold text-transparent">
                Create hosting account
              </h1>
              <p className="text-sm text-slate-600">
                Join the Zuha Hosts platform
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Full name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="John Doe"
              error={fieldErrors.name}
              required
              iconPrefix={<User className="h-5 w-5 text-slate-400" />}
              inputClassName="rounded-xl border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
            />

            <InputField
              label="Email address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="you@zuhahosts.com"
              error={fieldErrors.email}
              required
              autoComplete="email"
              iconPrefix={<Mail className="h-5 w-5 text-slate-400" />}
              inputClassName="rounded-xl border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Choose a strong password"
              error={fieldErrors.password}
              required
              autoComplete="new-password"
              iconPrefix={<Lock className="h-5 w-5 text-slate-400" />}
              inputClassName="rounded-xl border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
            />

            {/* Terms and conditions */}
            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-2 focus:ring-rose-500 focus:ring-offset-0"
              />
              <span className="text-slate-600">
                I agree to the{" "}
                <a href="#" className="font-semibold text-rose-600 hover:text-rose-700">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-semibold text-rose-600 hover:text-rose-700">
                  Privacy Policy
                </a>
              </span>
            </div>

            {/* Error and success messages */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-rose-500/40 focus:outline-none focus:ring-4 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="relative z-10 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="relative z-10">Creating account…</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Create account</span>
                  <svg
                    className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
            </button>
          </form>

          {/* Login link */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/80 px-4 text-slate-500">
                Already have an account?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-rose-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Sign in to your account
            </Link>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-slate-500">
          By creating an account, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}

