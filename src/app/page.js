"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getStructuredData } from "./seo-metadata";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Redirect to dashboard if already logged in
    const token = getAuthToken();
    if (token) {
      router.replace("/dashboard");
    }

    // Set page title and meta tags dynamically
    document.title =
      "Zuha Hosts - Property Management System for Hospitality Teams";

    const metaTags = [
      {
        name: "description",
        content:
          "All-in-one property management dashboard for hospitality teams. Manage bookings, properties, guests, and payments efficiently. Built for scale with real-time analytics and automation.",
      },
      {
        name: "keywords",
        content:
          "property management, hospitality management, booking management, zuha hosts, vacation rental software, hotel management system, property management software, guest management, booking calendar, revenue management",
      },
      { name: "author", content: "Zuha Hosts Team" },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zuhahosts.com" },
      {
        property: "og:title",
        content:
          "Zuha Hosts - Property Management System for Hospitality Teams",
      },
      {
        property: "og:description",
        content:
          "All-in-one property management dashboard for hospitality teams. Manage bookings, properties, guests, and payments efficiently.",
      },
      {
        property: "og:image",
        content: "https://zuhahosts.com/og-image.jpg",
      },
      { property: "og:site_name", content: "Zuha Hosts" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@zuhahosts" },
      { name: "twitter:creator", content: "@zuhahosts" },
      {
        name: "twitter:title",
        content:
          "Zuha Hosts - Property Management System for Hospitality Teams",
      },
      {
        name: "twitter:description",
        content:
          "All-in-one property management dashboard for hospitality teams. Manage bookings, properties, guests, and payments efficiently.",
      },
      {
        name: "twitter:image",
        content: "https://zuhahosts.com/og-image.jpg",
      },
      { name: "theme-color", content: "#f43f5e" },
      { name: "application-name", content: "Zuha Hosts" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      { name: "apple-mobile-web-app-title", content: "Zuha Hosts" },
      { name: "format-detection", content: "telephone=no" },
      { name: "mobile-web-app-capable", content: "yes" },
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
    canonical.setAttribute("href", "https://zuhahosts.com");

    // Add structured data
    const schemas = getStructuredData();
    // Update URLs in schemas to use Zuha Hosts domain
    const updatedSchemas = Object.values(schemas).map((schema) => {
      const schemaStr = JSON.stringify(schema);
      return JSON.parse(
        schemaStr
          .replace(/airbnb-dashboard\.com/g, "zuhahosts.com")
          .replace(/Airbnb Dashboard/g, "Zuha Hosts")
          .replace(/@airbnbdashboard/g, "@zuhahosts")
      );
    });
    
    updatedSchemas.forEach((schema, index) => {
      const scriptId = `structured-data-${index}`;
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    });
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-xl shadow-lg shadow-rose-500/30">
                🏠
              </div>
              <span className="text-xl font-bold text-slate-900">
                Zuha Hosts
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:shadow-xl hover:shadow-rose-500/40"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        {/* Enhanced Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-1/4 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-rose-400/30 to-pink-400/30 blur-3xl"></div>
          <div className="absolute -left-20 top-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/3 h-[350px] w-[350px] rounded-full bg-gradient-to-tl from-purple-400/20 to-pink-400/20 blur-3xl"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-rose-700 shadow-lg shadow-rose-100/50 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              <span>Transform Your Hospitality Business</span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="block">Simplify Property</span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Bookings & Management
                </span>
                <svg
                  className="absolute -bottom-2 left-0 hidden w-full text-rose-500/30 lg:block"
                  viewBox="0 0 400 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 6C66 2 133 10 200 6C267 2 333 10 398 6"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Subheading */}
            <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-slate-600 sm:text-2xl">
              Manage reservations, track availability, and automate your workflow—all in one place. 
              The complete booking platform for{" "}
              <span className="font-semibold text-slate-900">
                vacation rentals and property managers
              </span>
              .
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-rose-500/40 transition-all hover:scale-105 hover:shadow-rose-500/50"
              >
                <span className="relative z-10">Start Free Trial</span>
                <svg
                  className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1"
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
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </Link>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg transition-all hover:scale-105 hover:border-slate-300 hover:shadow-xl"
              >
                <svg
                  className="h-5 w-5 text-slate-600 transition-colors group-hover:text-rose-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Watch Demo</span>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-5 w-5 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-5 w-5 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-5 w-5 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>

            {/* Stats - Enhanced Design */}
            <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8">
              <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-6 backdrop-blur-sm transition hover:border-rose-200 hover:shadow-lg">
                <div className="mb-1 text-4xl font-bold text-slate-900">10K+</div>
                <div className="text-sm font-medium text-slate-600">
                  Properties Managed
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-6 backdrop-blur-sm transition hover:border-rose-200 hover:shadow-lg">
                <div className="mb-1 text-4xl font-bold text-slate-900">50K+</div>
                <div className="text-sm font-medium text-slate-600">
                  Active Bookings
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-6 backdrop-blur-sm transition hover:border-rose-200 hover:shadow-lg">
                <div className="mb-1 text-4xl font-bold text-slate-900">99.9%</div>
                <div className="text-sm font-medium text-slate-600">
                  Uptime SLA
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-6 backdrop-blur-sm transition hover:border-rose-200 hover:shadow-lg">
                <div className="mb-1 text-4xl font-bold text-slate-900">24/7</div>
                <div className="text-sm font-medium text-slate-600">
                  Expert Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to succeed
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg text-slate-600">
              Powerful features designed to help you manage your hospitality
              business efficiently
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-rose-200 hover:shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl shadow-lg shadow-blue-500/30">
                📊
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Real-time Analytics
              </h3>
              <p className="text-slate-600">
                Track bookings, revenue, and occupancy rates with interactive
                dashboards and detailed reports.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-rose-200 hover:shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-2xl shadow-lg shadow-emerald-500/30">
                📅
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Smart Scheduling
              </h3>
              <p className="text-slate-600">
                Manage bookings, check-ins, and maintenance with an intuitive
                calendar interface.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-rose-200 hover:shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-2xl shadow-lg shadow-purple-500/30">
                👥
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Guest Management
              </h3>
              <p className="text-slate-600">
                Keep track of guest preferences, history, and communications in
                one centralized location.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-rose-200 hover:shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-2xl shadow-lg shadow-rose-500/30">
                💳
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Payment Processing
              </h3>
              <p className="text-slate-600">
                Secure payment handling with multiple payment methods and
                automated invoicing.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-rose-200 hover:shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-2xl shadow-lg shadow-orange-500/30">
                ✅
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Task Management
              </h3>
              <p className="text-slate-600">
                Assign and track maintenance, cleaning, and other tasks with
                kanban boards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-rose-200 hover:shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-2xl shadow-lg shadow-cyan-500/30">
                🔒
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Role-based Access
              </h3>
              <p className="text-slate-600">
                Control permissions with granular role-based access for
                different team members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-slate-900 sm:text-4xl">
                Built for modern hospitality teams
              </h2>
              <p className="mb-8 text-lg text-slate-600">
                Say goodbye to scattered spreadsheets and disconnected tools.
                Our platform brings everything together in one beautiful,
                easy-to-use interface.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    ✓
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-slate-900">
                      Save Time
                    </h4>
                    <p className="text-slate-600">
                      Automate repetitive tasks and reduce manual data entry by
                      up to 70%
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    ✓
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-slate-900">
                      Boost Revenue
                    </h4>
                    <p className="text-slate-600">
                      Optimize pricing and occupancy rates with data-driven
                      insights
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    ✓
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-slate-900">
                      Improve Experience
                    </h4>
                    <p className="text-slate-600">
                      Deliver exceptional guest experiences with streamlined
                      operations
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    ✓
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-slate-900">
                      Scale Easily
                    </h4>
                    <p className="text-slate-600">
                      Grow from 1 to 1000+ properties without changing your
                      workflow
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 to-pink-400/20 blur-3xl"></div>
              <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-xl shadow-lg shadow-rose-500/20">
                  📈
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  Performance Overview
                </div>
              </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Occupancy Rate
                      </span>
                      <span className="font-semibold text-emerald-600">
                        94%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Guest Satisfaction
                      </span>
                      <span className="font-semibold text-blue-600">88%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Revenue Growth
                      </span>
                      <span className="font-semibold text-purple-600">
                        +32%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    This Month
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-slate-900">
                      $124,500
                    </div>
                    <div className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      +18%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-slate-900 py-24">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-rose-600/30 to-pink-600/30 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-600/30 to-cyan-600/30 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to transform your operations?
          </h2>
          <p className="mb-10 text-lg text-slate-300">
            Join thousands of hospitality professionals who trust our platform
            to manage their properties.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-2xl transition hover:bg-slate-50"
            >
              Start Your Free Trial
              <svg
                className="h-5 w-5"
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
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Sign in to your account
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            No credit card required · Free 14-day trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-lg">
                  🏠
                </div>
                <span className="font-bold text-slate-900">
                  Zuha Hosts
                </span>
              </div>
              <p className="text-sm text-slate-600">
                The modern way to manage your hospitality business.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-rose-600">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600">
                    License
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            © 2025 Zuha Hosts. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
