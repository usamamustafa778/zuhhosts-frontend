"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, loginSuperadmin } from "@/lib/api";
import { setAuthToken, setAuthUser, getAuthToken } from "@/lib/auth";
import { getUserDashboard, getUserTypeLabel } from "@/utils/userTypes";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loginType, setLoginType] = useState("regular"); // "regular" or "superadmin"

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.replace("/dashboard");
    }

    // Set page title and meta tags for SEO
    document.title = "Sign In - Zuha Hosts | Property Management Login";

    const metaTags = [
      {
        name: "description",
        content:
          "Sign in to your Zuha Hosts account. Access your property management platform to manage bookings, properties, guests, and payments efficiently.",
      },
      {
        name: "keywords",
        content:
          "zuha hosts login, property management login, booking system login, hospitality dashboard signin, vacation rental login",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zuhahosts.com/login" },
      {
        property: "og:title",
        content: "Sign In - Zuha Hosts | Property Management Login",
      },
      {
        property: "og:description",
        content:
          "Sign in to your Zuha Hosts account to manage your properties, bookings, and guests.",
      },
      {
        property: "og:image",
        content: "https://zuhahosts.com/og-image-login.jpg",
      },
      { name: "twitter:card", content: "summary" },
      {
        name: "twitter:title",
        content: "Sign In - Zuha Hosts",
      },
      {
        name: "twitter:description",
        content:
          "Access your property management dashboard to manage bookings and operations.",
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
    canonical.setAttribute("href", "https://zuhahosts.com/login");
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use different login endpoint based on login type
      const response = loginType === "superadmin"
        ? await loginSuperadmin({
            username: formData.email,  // Superadmin uses username field
            password: formData.password,
          })
        : await loginUser({
            email: formData.email,
            password: formData.password,
          });

      const token =
        response?.token ||
        response?.accessToken ||
        response?.data?.token ||
        response?.data?.accessToken;
      const user = response?.user || response?.data?.user || null;

      if (!token) {
        console.error("❌ No token in response:", response);
        throw new Error("Login succeeded but no token was returned.");
      }

      setAuthToken(token);
      setAuthUser(user);
      setSuccess(true);

      // Route to correct dashboard based on user type
      const dashboardRoute = getUserDashboard(user);
      const userType = getUserTypeLabel(user);
      
      console.log(`✅ Login successful! User type: ${userType}`);
      console.log(`🔄 Redirecting to: ${dashboardRoute}`);

      // Use replace instead of push to avoid back button issues
      setTimeout(() => {
        router.replace(dashboardRoute);
      }, 500);
    } catch (err) {
      // Better error message handling
      let errorMessage = err.message || "Failed to login. Please try again.";

      // Parse JSON error if it's a stringified JSON
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error) {
          errorMessage = parsed.error;
        }
      } catch {
        // Not JSON, use as is
      }

      // User-friendly error messages
      if (
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("password") ||
        errorMessage.toLowerCase().includes("email")
      ) {
        errorMessage =
          "Invalid email or password. Please check your credentials.";
      } else if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      setError(errorMessage);
      console.error("Login error:", err);
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

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="space-y-8 rounded-3xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-10">
          {/* Logo and header */}
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-3xl shadow-lg shadow-rose-500/30">
              🏠
            </div>
            <div className="space-y-2">
              <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-3xl font-bold text-transparent">
                Welcome back
              </h1>
              <p className="text-sm text-slate-600">
                Sign in to your Zuha Hosts dashboard
              </p>
            </div>
          </div>

          {/* Login Type Toggle */}
          <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setLoginType("regular")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                loginType === "regular"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Host / Team Member
            </button>
            <button
              type="button"
              onClick={() => setLoginType("superadmin")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                loginType === "superadmin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🔑 Superadmin
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700"
              >
                {loginType === "superadmin" ? "Username" : "Email address"}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type={loginType === "superadmin" ? "text" : "email"}
                  autoComplete={loginType === "superadmin" ? "username" : "email"}
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
                  placeholder={loginType === "superadmin" ? "admin" : "you@zuhahosts.com"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-2 focus:ring-rose-500 focus:ring-offset-0"
                />
                <span className="text-slate-600">Remember me</span>
              </label>
              <a
                href="#"
                className="font-semibold text-rose-600 hover:text-rose-700"
              >
                Forgot password?
              </a>
            </div>

            {/* Error and success messages */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0"
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
                  className="mt-0.5 h-5 w-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Login successful! Redirecting…</span>
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
                  <span className="relative z-10">Signing in…</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Sign in</span>
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

          {/* Register link */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/80 px-4 text-slate-500">
                New to Zuha Hosts?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-rose-600"
            >
              Create an account
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-slate-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
