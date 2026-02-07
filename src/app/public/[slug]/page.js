"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPublicProperties, getImageUrl } from "@/lib/api";
import { usePublicSite } from "@/components/public/PublicSiteContext";
import PropertyCard from "@/components/public/PropertyCard";

const FEATURED_COUNT = 6;

const TRUST_ITEMS = [
  { label: "Best price guaranteed", sub: "Book direct, save more", icon: "✓" },
  { label: "No booking fees", sub: "Zero hidden costs", icon: "✓" },
  { label: "Instant confirmation", sub: "Confirm in seconds", icon: "✓" },
  { label: "24/7 support", sub: "We're here for you", icon: "✓" },
];

const STATS = [
  { value: "500+", label: "Happy guests", icon: "👋" },
  { value: "4.9", label: "Guest rating", icon: "⭐" },
  { value: "100%", label: "Direct booking", icon: "🔒" },
];

const WHY_BOOK = [
  {
    title: "Best price",
    desc: "Book direct and save. We never add hidden fees or commission.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "No commission",
    desc: "Zero third-party fees. Every dollar goes toward your stay.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Instant confirmation",
    desc: "Confirm your booking in seconds. No waiting, no hassle.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Exceptional hospitality",
    desc: "From check-in to check-out, we ensure a memorable experience.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
];

const AMENITIES = [
  { label: "High-speed WiFi", icon: "📶", detail: "Stay connected" },
  { label: "Parking", icon: "🅿️", detail: "On-site" },
  { label: "Concierge", icon: "🛎️", detail: "24/7 assistance" },
  { label: "Spa & wellness", icon: "🧖", detail: "Relax & recharge" },
  { label: "Pool", icon: "🏊", detail: "Year-round" },
  { label: "Room service", icon: "🍽️", detail: "In-room dining" },
  { label: "Gym", icon: "💪", detail: "Fitness center" },
  { label: "Business center", icon: "💼", detail: "Work away" },
];

const TESTIMONIALS = [
  {
    quote:
      "An unforgettable stay. The rooms were immaculate and the service was beyond expectations. Will definitely return.",
    author: "Sarah M.",
    role: "Guest",
    stars: 5,
  },
  {
    quote:
      "Booked direct and saved a lot. The property was exactly as described—elegant, clean, and perfectly located.",
    author: "James K.",
    role: "Guest",
    stars: 5,
  },
  {
    quote:
      "From the moment we arrived we felt like VIPs. Top-class hospitality and attention to detail.",
    author: "Elena R.",
    role: "Guest",
    stars: 5,
  },
];

function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4 text-amber-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function SectionBadge({ children, primaryColor }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <span
        className="h-px w-8 rounded-full bg-slate-300"
        style={{ backgroundColor: primaryColor }}
      />
      <span
        className="text-xs uppercase tracking-[0.25em] font-semibold"
        style={{ color: primaryColor }}
      >
        {children}
      </span>
      <span
        className="h-px w-8 rounded-full bg-slate-300"
        style={{ backgroundColor: primaryColor }}
      />
    </div>
  );
}

export default function PublicLandingPage() {
  const params = useParams();
  const router = useRouter();
  const site = usePublicSite();
  const slug = site?.slug ?? params?.slug;
  const homeHref = site?.homeHref ?? `/public/${slug}`;
  const primaryColor = site?.primaryColor || "#0d9488";
  const tenant = site?.tenant;
  const web = site?.web ?? {};

  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const list = await getPublicProperties(slug);
        setProperties(Array.isArray(list) ? list : []);
      } catch {
        setProperties([]);
      }
    };
    load();
  }, [slug]);

  const description =
    web.description ||
    `Welcome to ${tenant?.name}. Where luxury meets comfort—book your stay directly for the best price and exceptional service.`;
  const basePath = homeHref === "/" ? "" : `/public/${slug}`;
  const propertiesHref = `${basePath}/properties`;

  // Dynamic data from backend (fallback to defaults when not set)
  const heroImageUrl = getImageUrl(web.heroImage ?? web.bannerImage ?? "");
  const defaultHeroUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80";
  const testimonialsList =
    Array.isArray(web.testimonials) && web.testimonials.length > 0
      ? web.testimonials.map((t) => ({
          quote: t.quote ?? "",
          author: t.author ?? t.authorName ?? "Guest",
          role: t.role ?? "Guest",
          stars: typeof t.stars === "number" ? t.stars : 5,
        }))
      : TESTIMONIALS;
  const amenitiesList =
    Array.isArray(web.amenities) && web.amenities.length > 0
      ? web.amenities.map((a) => ({
          label: a.label ?? "",
          icon: a.icon ?? "✨",
          detail: a.detail ?? "",
        }))
      : AMENITIES;

  return (
    <>
      {/* 1. Hero */}
      <section className="relative min-h-[78vh] flex items-center justify-center overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55"
          style={{
            backgroundImage: `url('${heroImageUrl || defaultHeroUrl}')`,
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-slate-900/85 via-slate-900/50 to-slate-900/95" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, transparent 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/90 font-medium mb-4">
            {tenant?.country || "Luxury Stays"}
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6 drop-shadow-lg">
            {tenant?.name}
          </h1>
          <p className="text-lg sm:text-xl text-white/95 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={propertiesHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              style={{ backgroundColor: primaryColor }}
            >
              Explore our stays
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              href="#properties"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border-2 border-white/70 text-white hover:bg-white/15 transition-all duration-300"
            >
              See collection below
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-stone-50 to-transparent" />
        <a
          href="#properties"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors"
          aria-label="Scroll to properties"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg
            className="w-6 h-6 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </a>
      </section>

      {/* 3. Trust strip — fuller bar */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
              >
                <span
                  className="flex items-center justify-center w-12 h-12 rounded-2xl text-white text-lg font-bold shrink-0 shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {item.icon}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Properties */}
      <section
        id="properties"
        className="py-20 sm:py-24 bg-stone-50 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <SectionBadge primaryColor={primaryColor}>
              Our collection
            </SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Curated stays
              {properties.length > 0 && (
                <span className="text-slate-500 font-normal text-xl ml-2">
                  ({properties.length})
                </span>
              )}
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Handpicked properties for comfort, style, and the best rate when
              you book direct.
            </p>
          </div>
          <div className="flex justify-end mb-8">
            {properties.length > FEATURED_COUNT && (
              <Link
                href={propertiesHref}
                className="text-sm font-semibold hover:underline flex items-center gap-1"
                style={{ color: primaryColor }}
              >
                View all
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            )}
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border-2 border-dashed border-slate-200 bg-white/80 shadow-inner">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5 border border-slate-200">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 12l2-2m0 7l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <p className="text-slate-600 font-medium text-lg">
                No properties available right now.
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Check back soon for new listings.
              </p>
              <Link
                href={`${basePath}/contact`}
                className="inline-block mt-6 text-sm font-medium"
                style={{ color: primaryColor }}
              >
                Get in touch for availability →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.slice(0, FEATURED_COUNT).map((property) => (
                  <PropertyCard
                    key={property.id ?? property._id}
                    property={property}
                    primaryColor={primaryColor}
                    onSelect={(p) => {
                      const id = p.id ?? p._id;
                      router.push(
                        homeHref === "/"
                          ? `/property/${id}`
                          : `/public/${slug}/property/${id}`
                      );
                    }}
                  />
                ))}
              </div>
              {properties.length > FEATURED_COUNT && (
                <div className="mt-14 text-center">
                  <Link
                    href={propertiesHref}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border-2 transition-all duration-200 hover:shadow-lg"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    View all {properties.length} properties
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 4. Testimonials */}
      <section className="py-20 sm:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <SectionBadge primaryColor={primaryColor}>
              Testimonials
            </SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              What our guests say
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              Real stays, real experiences. Here&apos;s what travelers are
              saying about {tenant?.name}.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonialsList.map((t, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300"
              >
                <span className="absolute top-6 right-6 text-6xl font-serif text-slate-200 leading-none">
                  &ldquo;
                </span>
                <StarRating count={t.stars ?? 5} />
                <p className="text-slate-700 leading-relaxed mb-6 relative z-10">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {(t.author || "G").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.author}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why book direct */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <SectionBadge primaryColor={primaryColor}>
              Why book direct
            </SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              More value, less hassle
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              Skip the middleman. Book directly with us and get the best rate
              and experience.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_BOOK.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-slate-200 bg-stone-50/50 p-8 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-300"
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Stats + Welcome */}
      <section className="relative py-20 sm:py-24 bg-slate-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.15), transparent)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-white/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8 sm:gap-12 text-center mb-16">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <span className="text-3xl mb-2 block opacity-80">{s.icon}</span>
                <p
                  className="text-3xl sm:text-4xl font-bold tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {s.value}
                </p>
                <p className="text-sm text-white/70 mt-1 uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              A different kind of stay
            </h2>
            <p className="text-white/80 leading-relaxed">
              At {tenant?.name}, we offer more than a place to sleep—refined
              spaces, thoughtful service, and the best price when you book
              direct. No middlemen, no hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Amenities */}
      <section className="py-20 sm:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <SectionBadge primaryColor={primaryColor}>
              Amenities & services
            </SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Everything you need
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              From high-speed WiFi to concierge service—we&apos;ve got you
              covered.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {amenitiesList.map((item, i) => (
              <div
                key={item.label ? `${item.label}-${i}` : i}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300"
              >
                <span className="text-4xl mb-3">{item.icon || "✨"}</span>
                <span className="text-sm font-semibold text-slate-900 text-center">
                  {item.label}
                </span>
                {item.detail ? (
                  <span className="text-xs text-slate-500 mt-1">{item.detail}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Discover */}
      {tenant?.country ? (
        <section className="py-20 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-3xl border border-slate-200 bg-stone-50/50 p-10 sm:p-14 text-center">
              <SectionBadge primaryColor={primaryColor}>Discover</SectionBadge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
                Experience {tenant.country}
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
                Our properties are thoughtfully located to give you the best of
                the region—culture, convenience, and comfort. Discover what
                makes {tenant.name} the choice for discerning travelers.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                <span className="px-4 py-2 rounded-full bg-white border border-slate-200">
                  Culture
                </span>
                <span className="px-4 py-2 rounded-full bg-white border border-slate-200">
                  Convenience
                </span>
                <span className="px-4 py-2 rounded-full bg-white border border-slate-200">
                  Comfort
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 9. Final CTA */}
      <section className="py-20 sm:py-24 bg-stone-50 border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 sm:p-14 shadow-sm">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Ready to book?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Browse our collection and secure your stay at the best price.
              Instant confirmation, no fees.
            </p>
            <Link
              href={propertiesHref}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl hover:opacity-95 transition-all duration-300"
              style={{ backgroundColor: primaryColor }}
            >
              View all properties
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <p className="text-sm text-slate-500 mt-6">
              No credit card required to browse · Free cancellation on most
              stays
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
