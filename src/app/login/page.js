"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  XCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { loginUser, loginSuperadmin } from "@/lib/api";
import { setAuthToken, setAuthUser, getAuthToken } from "@/lib/auth";
import { getUserDashboard } from "@/utils/userTypes";

const setMetaTags = () => {
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
    { name: "twitter:title", content: "Sign In - Zuha Hosts" },
    {
      name: "twitter:description",
      content:
        "Access your property management dashboard to manage bookings and operations.",
    },
  ];

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

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", "https://zuhahosts.com/login");
};

const parseErrorMessage = (err) => {
  let errorMessage = err.message || "Failed to login. Please try again.";

  try {
    const parsed = JSON.parse(errorMessage);
    if (parsed.error) {
      errorMessage = parsed.error;
    }
  } catch {
    // Not JSON, use as is
  }

  const lowerMessage = errorMessage.toLowerCase();
  if (
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("password") ||
    lowerMessage.includes("email")
  ) {
    return "Invalid email or password. Please check your credentials.";
  }
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return errorMessage;
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.replace("/dashboard");
    }
    setMetaTags();
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
      let response;

      try {
        response = await loginUser({
          email: formData.email,
          password: formData.password,
        });
      } catch (regularError) {
        try {
          response = await loginSuperadmin({
            username: formData.email,
            password: formData.password,
          });
        } catch (superadminError) {
          throw regularError;
        }
      }

      const token = response?.data?.token || response?.token;
      const user = response?.data?.user || response?.user;

      if (!token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      setAuthToken(token);
      setAuthUser(user);
      setSuccess(true);

      const dashboardRoute = getUserDashboard(user);
      setTimeout(() => {
        window.location.href = dashboardRoute;
      }, 500);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-rose-400/20 to-pink-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 blur-3xl"></div>
      </div>

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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700"
              >
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
                  placeholder="Enter your email address"
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
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 py-3 pl-11 pr-12 text-sm text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

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

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Login successful! Redirecting…</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-rose-500/40 focus:outline-none focus:ring-4 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
                  <span className="relative z-10">Signing in…</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Sign in</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
            </button>
          </form>

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
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
