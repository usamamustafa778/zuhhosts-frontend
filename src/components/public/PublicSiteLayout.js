"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getImageUrl } from "@/lib/api";

const navItems = [
  { label: "Home", path: "" },
  { label: "Properties", path: "/properties" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export default function PublicSiteLayout({ tenant, slug, homeHref, primaryColor, logoUrl, contactEmail, contactPhone, children }) {
  const pathname = usePathname();
  const basePath = homeHref === "/" ? "" : `/public/${slug}`;
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === "") return pathname === basePath || pathname === `/public/${slug}`;
    return pathname === `${basePath}${path}` || pathname?.endsWith(path);
  };

  const propertiesHref = `${basePath}/properties`;

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 antialiased flex flex-col">
      {/* Premium header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 md:h-20">
            <Link
              href={homeHref}
              className="flex items-center gap-3 min-w-0 shrink-0 group"
            >
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={tenant?.name}
                  className="h-11 w-11 md:h-12 md:w-12 rounded-xl object-contain shrink-0 border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow"
                />
              )}
              <div className="min-w-0 hidden sm:block">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
                  {tenant?.country || "Luxury Stays"}
                </span>
                <span className="block text-lg font-semibold text-slate-900 truncate tracking-tight">
                  {tenant?.name}
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main">
              {navItems.map(({ label, path }) => {
                const href = path === "" ? homeHref : `${basePath}${path}`;
                const active = isActive(path);
                return (
                  <Link
                    key={path || "home"}
                    href={href}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? "text-white shadow-md"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    style={active ? { backgroundColor: primaryColor } : {}}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\s/g, "")}`}
                  className="hidden lg:inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <span className="text-slate-400">📞</span>
                  <span>{contactPhone}</span>
                </a>
              )}
              <Link
                href={propertiesHref}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:opacity-95 transition-all duration-200"
                style={{ backgroundColor: primaryColor }}
              >
                Book now
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white py-4 px-4">
            <div className="flex flex-col gap-1">
              {navItems.map(({ label, path }) => {
                const href = path === "" ? homeHref : `${basePath}${path}`;
                return (
                  <Link
                    key={path || "home"}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100"
                  >
                    {label}
                  </Link>
                );
              })}
              <Link
                href={propertiesHref}
                onClick={() => setMenuOpen(false)}
                className="mt-2 mx-4 py-3 rounded-xl text-center font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Book now
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Premium footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={tenant?.name}
                    className="h-12 w-12 rounded-xl object-contain border border-slate-700"
                  />
                )}
                <span className="text-xl font-semibold text-white">{tenant?.name}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                Curated stays and exceptional hospitality. Book direct for the best rates.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Explore</h4>
              <ul className="space-y-3">
                {navItems.map(({ label, path }) => {
                  const href = path === "" ? homeHref : `${basePath}${path}`;
                  return (
                    <li key={path || "home"}>
                      <Link
                        href={href}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link
                    href={propertiesHref}
                    className="text-sm font-medium hover:text-white transition-colors"
                    style={{ color: primaryColor }}
                  >
                    View all properties
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {contactEmail && (
                  <li>
                    <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors">
                      {contactEmail}
                    </a>
                  </li>
                )}
                {contactPhone && (
                  <li>
                    <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                      {contactPhone}
                    </a>
                  </li>
                )}
                {!contactEmail && !contactPhone && (
                  <li>Contact details available on request.</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Why book direct</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">✓ Best price guaranteed</li>
                <li className="flex items-center gap-2">✓ No booking fees</li>
                <li className="flex items-center gap-2">✓ Instant confirmation</li>
              </ul>
            </div>
          </div>
          <div className="mt-14 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {tenant?.name}. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Powered by{" "}
              <a href="https://zuhahost.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                Zuha Host
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
