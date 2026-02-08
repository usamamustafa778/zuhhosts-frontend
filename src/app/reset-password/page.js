"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/lib/api";
import InputField from "@/components/common/InputField";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const readTokenFromUrl = useCallback(() => {
    const t = searchParams.get("token") || searchParams.get("reset_token") || "";
    setToken(t?.trim() || "");
  }, [searchParams]);

  useEffect(() => {
    document.title = "Reset password - Zuha Hosts";
    readTokenFromUrl();
  }, [readTokenFromUrl]);

  const validateNewPassword = (value) => {
    if (!value) return "New password is required";
    if (value.length < 6) return "Password must be at least 6 characters long";
    return "";
  };

  const validateConfirm = (value) => {
    if (!value) return "Please confirm your password";
    if (value !== newPassword) return "Passwords do not match";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "newPassword") {
      setNewPassword(value);
      setFieldErrors((prev) => ({ ...prev, newPassword: "", confirmPassword: value !== confirmPassword ? prev.confirmPassword : "" }));
    } else {
      setConfirmPassword(value);
      setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
    if (error) setError("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === "newPassword") setFieldErrors((prev) => ({ ...prev, newPassword: validateNewPassword(value) }));
    if (name === "confirmPassword") setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const effectiveToken = token?.trim();
    if (!effectiveToken) {
      setError("Reset link is invalid or missing. Please use the link from your email or request a new one.");
      return;
    }

    const newError = validateNewPassword(newPassword);
    const confirmError = validateConfirm(confirmPassword);
    setFieldErrors({ newPassword: newError, confirmPassword: confirmError });
    if (newError || confirmError) {
      setError("Please fix the errors above.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token: effectiveToken, newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const msg = err?.message || "Something went wrong. Please try again.";
      const lower = msg.toLowerCase();
      if (lower.includes("invalid") || lower.includes("expired")) {
        setError("Invalid or expired reset link. Please request a new password reset.");
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidToken = token?.trim().length > 0;

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
              🔑
            </div>
            <div className="space-y-2">
              <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-3xl font-bold text-transparent">
                Reset password
              </h1>
              <p className="text-sm text-slate-600">
                Enter your new password below.
              </p>
            </div>
          </div>

          {!hasValidToken ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Missing or invalid reset link. Please use the link from your email, or{" "}
                <Link href="/forgot-password" className="font-semibold underline hover:text-amber-900">
                  request a new password reset
                </Link>.
              </div>
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>Password has been reset successfully. Redirecting you to login…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="New password"
                type={showPassword ? "text" : "password"}
                name="newPassword"
                value={newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="At least 6 characters"
                error={fieldErrors.newPassword}
                required
                autoComplete="new-password"
                minLength={6}
                iconPrefix={<Lock className="h-5 w-5 text-slate-400" />}
                iconSuffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                inputClassName="rounded-xl border-slate-200 bg-white/50 py-3 pl-11 pr-12 text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
              />

              <InputField
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Confirm your new password"
                error={fieldErrors.confirmPassword}
                required
                autoComplete="new-password"
                minLength={6}
                iconPrefix={<Lock className="h-5 w-5 text-slate-400" />}
                inputClassName="rounded-xl border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-sm transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
              />

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{error}</span>
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
                    <span className="relative z-10">Resetting…</span>
                  </>
                ) : (
                  <span className="relative z-10">Reset password</span>
                )}
              </button>
            </form>
          )}

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
