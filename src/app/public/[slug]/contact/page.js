"use client";

import { useState } from "react";
import Link from "next/link";
import { usePublicSite } from "@/components/public/PublicSiteContext";

export default function PublicContactPage() {
  const site = usePublicSite();
  const tenant = site?.tenant;
  const primaryColor = site?.primaryColor || "#0d9488";
  const contactEmail = site?.contactEmail ?? null;
  const contactPhone = site?.contactPhone ?? null;
  const homeHref = site?.homeHref ?? "";
  const basePath = homeHref === "/" ? "" : `/public/${site?.slug}`;
  const propertiesHref = `${basePath}/properties`;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    const subject = encodeURIComponent(`Contact from ${tenant?.name} website`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\nMessage:\n${form.message}`
    );
    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    }
    setSent(true);
    setSending(false);
  };

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero strip */}
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-medium mb-3">Get in touch</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Contact us
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto mt-4">
            Have a question or want to book? We&apos;re here to help.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-semibold mb-4" style={{ color: primaryColor }}>
              Contact
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Reach out</h2>
            <div className="space-y-5">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white text-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    ✉️
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
                    <p className="text-slate-900 font-medium break-all mt-0.5">{contactEmail}</p>
                  </div>
                </a>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white text-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    📞
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</p>
                    <p className="text-slate-900 font-medium mt-0.5">{contactPhone}</p>
                  </div>
                </a>
              )}
              {!contactEmail && !contactPhone && (
                <p className="text-slate-600 p-5 rounded-2xl border border-slate-200 bg-white">
                  Contact details are not yet configured for this site.
                </p>
              )}
            </div>
            <div className="mt-8">
              <Link
                href={propertiesHref}
                className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: primaryColor }}
              >
                View all properties →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] font-semibold mb-4" style={{ color: primaryColor }}>
              Send a message
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">We&apos;ll get back to you</h2>
            {sent && contactEmail ? (
              <p className="text-slate-600 leading-relaxed">
                Your email client should open with your message. If not, email us directly at{" "}
                <a href={`mailto:${contactEmail}`} className="font-semibold underline" style={{ color: primaryColor }}>
                  {contactEmail}
                </a>
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-2">
                    Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-stone-50/50 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-shadow"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-stone-50/50 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-shadow"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-stone-50/50 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-shadow"
                    placeholder="+1 234 567 8900"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-stone-50/50 focus:ring-2 focus:ring-offset-1 focus:border-transparent resize-none transition-shadow"
                    placeholder="How can we help?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !contactEmail}
                  className="w-full rounded-xl py-4 font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {sending ? "Opening email..." : "Send message"}
                </button>
                {!contactEmail && (
                  <p className="text-sm text-slate-500 mt-3">
                    Contact form will open your email client when an address is configured.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
