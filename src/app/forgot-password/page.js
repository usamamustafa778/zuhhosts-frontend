"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { forgotPassword } from "@/lib/api";
import InputField from "@/components/common/InputField";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Forgot password - Zuha Hosts";
  }, []);

  const validateEmail = (value) => {
    if (!value || !value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address";
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (fieldError) setFieldError("");
    if (error) setError("");
  };

  const handleBlur = () => {
    setFieldError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailError = validateEmail(email);
    setFieldError(emailError);
    if (emailError) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await forgotPassword(email.trim().toLowerCase());
      const message = result?.message || "If an account exists with this email, you will receive a password reset link.";
      setSuccess(message);
    } catch (err) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-rose-400/20 to-pink-400/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-rose-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <div className="space-y-8 rounded-3xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-10">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-3xl shadow-lg shadow-rose-500/30">
              🔐
            </div>
            <div className="space-y-2">
              <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-3xl font-bold text-transparent">
                Forgot password
              </h1>
              <p className="text-sm text-slate-600">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email address"
              error={fieldError}
              required
              autoComplete="email"
              iconPrefix={<Mail className="h-5 w-5 text-slate-400" />}
              inputClassName="rounded-xl border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
            />

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-rose-500/40 focus:outline-none focus:ring-4 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
                  <span className="relative z-10">Sending…</span>
                </>
              ) : (
                <span className="relative z-10">Send reset link</span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600">
            Check your email for the reset link. If you don&apos;t see it, check your spam folder.
          </p>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-rose-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
