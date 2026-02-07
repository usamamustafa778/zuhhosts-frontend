"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPublicTenantInfo } from "@/lib/api";
import PageLoader from "@/components/common/PageLoader";
import { getTenantSlugFromSubdomain } from "@/utils/tenantUtils";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  
  // Try to get slug from subdomain first, fallback to route param
  const subdomainSlug = getTenantSlugFromSubdomain();
  const slug = subdomainSlug || params.slug;
  const bookingId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [homeHref, setHomeHref] = useState(`/public/${slug}`);

  useEffect(() => {
    loadTenant();
  }, [slug]);

  useEffect(() => {
    const sub = getTenantSlugFromSubdomain();
    setHomeHref(sub && sub === slug ? "/" : `/public/${slug}`);
  }, [slug]);

  const loadTenant = async () => {
    try {
      const tenantInfo = await getPublicTenantInfo(slug);
      setTenant(tenantInfo);
    } catch (error) {
      console.error("Failed to load tenant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading..." />;
  }

  const primaryColor = tenant?.websiteConfig?.primaryColor || "#3b82f6";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: primaryColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-slate-600">
            Thank you for booking with {tenant?.name}
          </p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-600 mb-1">Booking Confirmation Number</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">#{bookingId}</p>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h3 className="font-semibold text-slate-900 mb-4">What's Next?</h3>

            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <span className="font-bold" style={{ color: primaryColor }}>
                  1
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Check Your Email</h4>
                <p className="text-sm text-slate-600">
                  We've sent a confirmation email with your booking details.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <span className="font-bold" style={{ color: primaryColor }}>
                  2
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Payment Instructions</h4>
                <p className="text-sm text-slate-600">
                  Our team will contact you shortly with payment details.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <span className="font-bold" style={{ color: primaryColor }}>
                  3
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Prepare for Your Stay</h4>
                <p className="text-sm text-slate-600">
                  Save this confirmation number and bring a valid ID on check-in day.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {(tenant?.websiteConfig?.contactEmail || tenant?.websiteConfig?.contactPhone) && (
            <div className="border-t border-slate-200 mt-6 pt-6">
              <h4 className="font-semibold text-slate-900 mb-3">Need Help?</h4>
              <div className="space-y-2 text-sm">
                {tenant.websiteConfig.contactEmail && (
                  <p className="text-slate-600">
                    Email:{" "}
                    <a
                      href={`mailto:${tenant.websiteConfig.contactEmail}`}
                      className="text-slate-900 hover:underline"
                    >
                      {tenant.websiteConfig.contactEmail}
                    </a>
                  </p>
                )}
                {tenant.websiteConfig.contactPhone && (
                  <p className="text-slate-600">
                    Phone:{" "}
                    <a
                      href={`tel:${tenant.websiteConfig.contactPhone}`}
                      className="text-slate-900 hover:underline"
                    >
                      {tenant.websiteConfig.contactPhone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(homeHref)}
            className="flex-1 rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Properties
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Print Confirmation
          </button>
        </div>
      </div>
    </div>
  );
}
