"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getStructuredData } from "./seo-metadata";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    setMounted(true);
    const token = getAuthToken();
    if (token) {
      router.replace("/dashboard");
    }

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
    canonical.setAttribute("href", "https://zuhahosts.com");

    const schemas = getStructuredData();
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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  if (!mounted) return null;

  // Consistent section styles
  const sectionContainer = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
  const sectionTitle = "mb-4 text-3xl font-bold text-slate-900 sm:text-4xl";
  const sectionDescription = "mx-auto mb-12 max-w-2xl text-lg text-slate-600";
  const primaryButton =
    "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-rose-500/40";
  const secondaryButton =
    "inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg transition-all hover:scale-105 hover:border-slate-300 hover:shadow-xl";

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className={sectionContainer}>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-xl shadow-lg shadow-rose-500/30">
                🏠
              </div>
              <span className="text-xl font-bold text-slate-900">
                Zuha Hosts
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-slate-700 transition hover:text-rose-600"
              >
                How It Works
              </a>
              <a
                href="#features"
                className="text-sm font-semibold text-slate-700 transition hover:text-rose-600"
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-sm font-semibold text-slate-700 transition hover:text-rose-600"
              >
                Testimonials
              </a>
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
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-rose-50/30 to-white pt-24 pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-1/4 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-rose-400/20 to-pink-400/20 blur-3xl"></div>
          <div className="absolute left-1/4 bottom-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-400/15 to-cyan-400/15 blur-3xl"></div>
        </div>

        <div className={`${sectionContainer} pt-20 lg:pt-32 pb-5`}>
          <div className="text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-rose-700 shadow-lg shadow-rose-100/50 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              <span>Transform Your Hospitality Business</span>
            </div>

            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 bg-clip-text text-transparent">
                  Bookings, Cleaning, and Staff tasks all in one dashboard.
                </span>
              </span>
            </h1>

            <p className={sectionDescription.replace("mb-12", "mb-12")}>
              Manage reservations, track availability, and automate your
              workflow—all in one place. The complete booking platform for{" "}
              <span className="font-semibold text-slate-900">
                vacation rentals and property managers
              </span>
              .
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className={primaryButton}>
                <span>Start Free Trial</span>
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
              <a href="#how-it-works" className={secondaryButton}>
                <svg
                  className="h-5 w-5 text-slate-600"
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
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
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
                <span>Free 1 month trial</span>
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

            <div className="mt-20">
              <div className="relative mx-auto max-w-5xl">
                <div className="relative aspect-video overflow-visible rounded-2xl border-4 border-white shadow-2xl">
                  <iframe
                    className="h-full w-full rounded-2xl "
                    src="https://www.youtube.com/embed/42RZMQ9lPAU?rel=0&modestbranding=1&vq=hd1080"
                    title="Zuha Hosts Platform Introduction"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    frameBorder="0"
                  ></iframe>
                  {/* Badge on edge of video */}
                  <div className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2">
                    <div className="rounded-full bg-white px-6 py-2.5 shadow-lg border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">
                        Zuha Hosts explained in 2 minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-24">
        <div className={sectionContainer}>
          <div className="text-center mb-16">
            <h2 className={sectionTitle}>How It Works</h2>
            <p className={sectionDescription}>
              Get started in minutes and transform your property management
              workflow
            </p>
          </div>

          <div className="relative">
            {/* Connecting line - only visible on large screens */}
            <div className="absolute left-0 right-0 top-20 hidden lg:block">
              <div className="mx-auto h-1 w-4/5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-full opacity-20"></div>
            </div>

            <div className="grid gap-8 md:gap-12 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: 1,
                  title: "Add Your Properties",
                  description:
                    "Upload property details, photos, and set availability calendars. Import from spreadsheets or add manually.",
                  color: "from-rose-500 to-pink-600",
                  icon: "🏠",
                },
                {
                  step: 2,
                  title: "Manage Bookings",
                  description:
                    "Create reservations, track check-ins and check-outs, and manage guest communications all from one dashboard.",
                  color: "from-blue-500 to-blue-600",
                  icon: "📅",
                },
                {
                  step: 3,
                  title: "Manage Property",
                  description:
                    "Handle maintenance tasks, coordinate cleaning schedules, and manage property operations with your team efficiently.",
                  color: "from-emerald-500 to-emerald-600",
                  icon: "🔧",
                },
                {
                  step: 4,
                  title: "Track and Grow",
                  description:
                    "Monitor earnings, analyze performance, and scale your business with real-time insights and automated workflows.",
                  color: "from-purple-500 to-purple-600",
                  icon: "📈",
                },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="relative z-10">
                    {/* Step Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-rose-200">
                      {/* Step Number Badge */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-2xl font-bold text-white shadow-lg`}
                          >
                            {item.step}
                          </div>
                          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-lg shadow-md">
                            {item.icon}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="text-center">
                        <h3 className="mb-3 text-lg font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow connector - only visible on large screens */}
                  {index < 3 && (
                    <div className="absolute -right-6 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
                      <div className="rounded-full bg-white p-2 shadow-lg border border-slate-200">
                        <svg
                          className="h-6 w-6 text-slate-400"
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
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/register" className={primaryButton}>
              Get Started Now
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
            <p className="mt-4 text-sm text-slate-600">
              Setup takes less than 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Screenshots Section */}
      <section className="bg-slate-50 py-24">
        <div className={sectionContainer}>
          <div className="text-center mb-16">
            <h2 className={sectionTitle}>Beautiful, Intuitive Dashboard</h2>
            <p className={sectionDescription}>
              Experience the power of our modern interface designed for
              efficiency and ease of use
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {[
              {

                description:
                  "Track bookings, revenue, and occupancy at a glance",
                gradient: "from-slate-50 to-slate-100",
                image: "/image1.png",
              },
              {

                description: "Visual booking management with drag-and-drop",
                gradient: "from-blue-50 to-indigo-100",
                image: "/image2.png",
              },
              {

                description: "Manage all your properties from one central hub",
                gradient: "from-emerald-50 to-teal-100",
                image: "/image3.png",
              },
              {

                description: "Complete revenue tracking and payment management",
                gradient: "from-purple-50 to-pink-100",
                image: "/image4.png",
              },
            ].map((screenshot, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                onClick={() => setSelectedImage(screenshot.image)}
              >
                <div className="aspect-video relative overflow-hidden bg-slate-50">
                  <img
                    src={screenshot.image}
                    alt="Feature screenshot"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg
                        className="w-12 h-12 text-white drop-shadow-lg"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Image Modal */}
          {selectedImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setSelectedImage(null)}
            >
              <div
                className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <img
                  src={selectedImage}
                  alt="Full size screenshot"
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                />
              </div>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 transition"
            >
              Explore the full dashboard
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className={sectionContainer}>
          <div className="text-center mb-16">
            <h2 className={sectionTitle}>Everything You Need to Succeed</h2>
            <p className={sectionDescription}>
              Powerful features designed to help you manage your hospitality
              business efficiently
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "📅",
                title: "Booking Management",
                description:
                  "Create, track, and manage reservations with an intuitive calendar interface. Handle check-ins, check-outs, and booking modifications seamlessly.",
                color: "from-blue-500 to-blue-600",
              },
              {
                icon: "🏠",
                title: "Property Management",
                description:
                  "Manage all your properties from one central hub. Track availability, maintenance, and property details efficiently.",
                color: "from-emerald-500 to-emerald-600",
              },
              {
                icon: "👥",
                title: "Staff Management",
                description:
                  "Assign roles, manage permissions, and coordinate your team with granular access control and task assignments.",
                color: "from-purple-500 to-purple-600",
              },
              {
                icon: "💳",
                title: "Payments Management",
                description:
                  "Secure payment processing with multiple payment methods, automated invoicing, and comprehensive financial tracking.",
                color: "from-rose-500 to-pink-600",
              },
              {
                icon: "👤",
                title: "Guest Management",
                description:
                  "Keep track of guest preferences, history, and communications in one centralized location for better service delivery.",
                color: "from-orange-500 to-orange-600",
              },
              {
                icon: "📊",
                title: "Analytics & Reporting",
                description:
                  "Track bookings, revenue, and occupancy rates with interactive dashboards and detailed reports for data-driven decisions.",
                color: "from-cyan-500 to-cyan-600",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-rose-200 hover:shadow-xl"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-2xl shadow-lg`}
                >
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-slate-50 py-24">
        <div className={sectionContainer}>
          <div className="text-center mb-16">
            <h2 className={sectionTitle}>Loved by Property Managers</h2>
            <p className={sectionDescription}>
              See what hosts are saying about how Zuha Hosts transformed their
              business
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Sarah Mitchell",
                role: "Property Manager, Coastal Rentals",
                initials: "SM",
                quote:
                  "Zuha Hosts has completely transformed how we manage our 25 properties. The dashboard is intuitive, and we've cut our administrative time in half. Revenue tracking is a game-changer!",
                color: "from-rose-500 to-pink-600",
              },
              {
                name: "James Davis",
                role: "Host, Mountain View Properties",
                initials: "JD",
                quote:
                  "The booking calendar is exactly what we needed. Managing check-ins and check-outs across multiple properties is now effortless. Our team loves the task management features too!",
                color: "from-blue-500 to-blue-600",
              },
              {
                name: "Emily Rodriguez",
                role: "Owner, Urban Stay Rentals",
                initials: "ER",
                quote:
                  "Switching to Zuha Hosts was the best decision we made this year. The guest management system keeps everything organized, and the payment processing is seamless. Highly recommend!",
                color: "from-emerald-500 to-emerald-600",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg transition hover:shadow-xl"
              >
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-6 text-slate-700">{testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.color} text-xl font-bold text-white`}
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50 to-pink-50 p-8 text-center">
            <div className="mb-4 text-4xl font-bold text-slate-900">4.8/5</div>
            <div className="mb-2 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="h-6 w-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-slate-600">
              Based on 1,250+ reviews from property managers worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-24">
        <div className={sectionContainer}>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className={sectionTitle}>
                Built for Modern Hospitality Teams
              </h2>
              <p className="mb-8 text-lg text-slate-600">
                Say goodbye to scattered spreadsheets and disconnected tools.
                Our platform brings everything together in one beautiful,
                easy-to-use interface.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: "Save Time",
                    description:
                      "Automate repetitive tasks and reduce manual data entry by up to 70%",
                  },
                  {
                    title: "Boost Revenue",
                    description:
                      "Optimize pricing and occupancy rates with data-driven insights",
                  },
                  {
                    title: "Improve Experience",
                    description:
                      "Deliver exceptional guest experiences with streamlined operations",
                  },
                  {
                    title: "Scale Easily",
                    description:
                      "Grow from 1 to 1000+ properties without changing your workflow",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                      ✓
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-slate-900">
                        {benefit.title}
                      </h4>
                      <p className="text-slate-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
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
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-rose-600/20 to-pink-600/20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-600/20 to-cyan-600/20 blur-3xl"></div>
        </div>

        <div className={`${sectionContainer} relative z-10 text-center`}>
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to Transform Your Operations?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300">
            Join thousands of hospitality professionals who trust our platform
            to manage their properties.
          </p>

          <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="relative z-10 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-2xl transition hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer"
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
            No credit card required · Free 1 month trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className={sectionContainer}>
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-lg">
                  🏠
                </div>
                <span className="font-bold text-slate-900">Zuha Hosts</span>
              </div>
              <p className="text-sm text-slate-600">
                The modern way to manage your hospitality business.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing"],
              },
              {
                title: "Company",
                links: ["About", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms"],
              },
            ].map((section, index) => (
              <div key={index}>
                <h4 className="mb-4 font-semibold text-slate-900">
                  {section.title}
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="hover:text-rose-600">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            © 2025 Zuha Hosts. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
