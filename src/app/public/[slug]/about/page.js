"use client";

import Link from "next/link";
import { usePublicSite } from "@/components/public/PublicSiteContext";
import { getImageUrl } from "@/lib/api";

export default function PublicAboutPage() {
  const site = usePublicSite();
  const tenant = site?.tenant;
  const web = site?.web ?? {};
  const primaryColor = site?.primaryColor || "#0d9488";
  const logoUrl = getImageUrl(web.logo ?? web.logoUrl ?? "");
  const homeHref = site?.homeHref ?? "";
  const basePath = homeHref === "/" ? "" : `/public/${site?.slug}`;
  const propertiesHref = `${basePath}/properties`;

  const description = web.description || `Welcome to ${tenant?.name}. We offer comfortable stays with the best price, no commission, and instant confirmation when you book direct.`;
  const aboutText = web.aboutText ?? web.about ?? web.story ?? null;

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero strip */}
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-medium mb-3">About us</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            About {tenant?.name}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mt-4">
            {description}
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {logoUrl && (
            <div className="shrink-0">
              <img
                src={logoUrl}
                alt={tenant?.name}
                className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl object-contain border border-slate-200 shadow-xl bg-white"
              />
            </div>
          )}
          <div className="flex-1 space-y-4">
            {tenant?.country && (
              <p className="text-slate-600 flex items-center gap-2 text-lg">
                <span className="text-slate-400">📍</span> Based in {tenant.country}
              </p>
            )}
            {tenant?.businessType && (
              <p className="text-slate-600 text-lg">
                <span className="font-semibold text-slate-800">Type:</span> {tenant.businessType}
              </p>
            )}
          </div>
        </div>

        <div
          className="mt-16 rounded-2xl p-8 sm:p-10 border border-slate-200/80 bg-white shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}02 50%, white 100%)`,
          }}
        >
          <p className="text-xs uppercase tracking-[0.25em] font-semibold mb-4" style={{ color: primaryColor }}>
            Our story
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Where hospitality meets excellence</h2>
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-lg">
            {aboutText ? (
              <p className="whitespace-pre-line">{aboutText}</p>
            ) : (
              <>
                <p>
                  We are committed to giving you the best direct-booking experience. When you book with us, you get the best price with no hidden fees and instant confirmation.
                </p>
                <p className="mt-5">
                  Thank you for choosing {tenant?.name}. We look forward to hosting you and making your stay unforgettable.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-20 grid sm:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-5"
              style={{ backgroundColor: primaryColor }}
            >
              ✓
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Best price</h3>
            <p className="text-slate-600">Book direct and save. No commission, ever.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-5"
              style={{ backgroundColor: primaryColor }}
            >
              ⚡
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Instant confirmation</h3>
            <p className="text-slate-600">Confirm your stay in seconds.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-5"
              style={{ backgroundColor: primaryColor }}
            >
              🏠
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Quality stays</h3>
            <p className="text-slate-600">Curated properties you can trust.</p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <Link
            href={propertiesHref}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl hover:opacity-95 transition-all duration-300"
            style={{ backgroundColor: primaryColor }}
          >
            View our properties
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
