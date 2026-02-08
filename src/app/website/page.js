"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getWebsiteConfig,
  updateWebsiteConfig,
  togglePublicWebsite,
  getImageUrl,
} from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import FormField from "@/components/common/FormField";
import PageLoader from "@/components/common/PageLoader";
import { handleApiError } from "@/utils/errorHandler";

const DEFAULT_TESTIMONIAL = { quote: "", author: "", role: "Guest", stars: 5 };
const DEFAULT_AMENITY = { label: "", icon: "✨", detail: "" };

const SECTIONS = [
  { id: "header", label: "Header & logo", icon: "M4 6h16M4 12h16M4 18h7" },
  { id: "hero", label: "Hero section", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" },
  { id: "contact", label: "Contact", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id: "testimonials", label: "Testimonials", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { id: "amenities", label: "Amenities", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
];

export default function WebsitePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  useSEO({
    title: "Website Customization | Zuha Host",
    description: "Manage your public booking website: branding, hero image, testimonials, and amenities.",
    keywords: "public website, booking website, branding, hero image, testimonials, amenities",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    tenantName: "",
    slug: "",
    publicUrl: "",
    enabled: false,
    canToggle: true,
    logo: "",
    description: "",
    primaryColor: "#0d9488",
    contactEmail: "",
    contactPhone: "",
    heroImage: "",
    heroTitle: "",
    testimonials: [],
    amenities: [],
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const raw = await getWebsiteConfig();
      const configData =
        raw && typeof raw === "object"
          ? raw.data ?? raw.config ?? raw.websiteConfig ?? raw
          : null;
      if (configData && typeof configData === "object") {
        const tenantName = configData.tenantName ?? configData.name ?? "";
        const slug = configData.slug ?? "";
        const publicUrl = configData.publicUrl ?? (slug ? `${slug}.zuhahost.com` : "");
        const enabled = Boolean(configData.enabled ?? configData.isEnabled);
        const canToggle = configData.canToggle !== false;
        const logo = configData.logo ?? configData.logoUrl ?? "";
        const description = configData.description ?? "";
        const primaryColor = configData.primaryColor ?? "#0d9488";
        const contactEmail = configData.contactEmail ?? "";
        const contactPhone = configData.contactPhone ?? "";
        const heroImage = configData.heroImage ?? configData.bannerImage ?? configData.heroImageUrl ?? "";
        const heroTitle = configData.heroTitle ?? (configData.tenantName ?? configData.name ?? "");
        const testimonials = Array.isArray(configData.testimonials)
          ? configData.testimonials.map((t) => ({
              quote: t.quote ?? "",
              author: t.author ?? t.authorName ?? "",
              role: t.role ?? "Guest",
              stars: typeof t.stars === "number" ? t.stars : 5,
            }))
          : [];
        const amenities = Array.isArray(configData.amenities)
          ? configData.amenities.map((a) => ({
              label: a.label ?? "",
              icon: a.icon ?? "✨",
              detail: a.detail ?? "",
            }))
          : [];

        setConfig({
          tenantName,
          slug,
          publicUrl,
          enabled,
          canToggle,
          logo,
          description,
          primaryColor,
          contactEmail,
          contactPhone,
          heroImage,
          heroTitle,
          testimonials,
          amenities,
        });
        setLogoPreview(logo ? getImageUrl(logo) || logo : null);
        setHeroPreview(heroImage ? getImageUrl(heroImage) || heroImage : null);
      }
    } catch (error) {
      console.error("Failed to load website configuration:", error);
      handleApiError(error, router, toast);
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be under 2MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleHeroChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Hero image must be under 5MB");
        return;
      }
      setHeroFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setHeroPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addTestimonial = () => {
    setConfig((prev) => ({
      ...prev,
      testimonials: [...prev.testimonials, { ...DEFAULT_TESTIMONIAL }],
    }));
  };

  const updateTestimonial = (index, field, value) => {
    setConfig((prev) => {
      const next = [...prev.testimonials];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, testimonials: next };
    });
  };

  const removeTestimonial = (index) => {
    setConfig((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index),
    }));
  };

  const addAmenity = () => {
    setConfig((prev) => ({
      ...prev,
      amenities: [...prev.amenities, { ...DEFAULT_AMENITY }],
    }));
  };

  const updateAmenity = (index, field, value) => {
    setConfig((prev) => {
      const next = [...prev.amenities];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, amenities: next };
    });
  };

  const removeAmenity = (index) => {
    setConfig((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleToggleWebsite = async () => {
    if (!config.canToggle) return;
    const toastId = toast.loading(config.enabled ? "Disabling..." : "Enabling...");
    try {
      await togglePublicWebsite(!config.enabled);
      setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
      toast.success(config.enabled ? "Website disabled" : "Website enabled!", { id: toastId });
    } catch (error) {
      toast.dismiss(toastId);
      const msg = error?.message || "";
      if (msg.includes("PUBLIC_WEBSITE_NOT_ALLOWED") || msg.includes("not allowed")) {
        toast.error("Upgrade your plan to enable the public website.");
      } else {
        handleApiError(error, router, toast);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Saving...");

    try {
      // Backend validation: testimonials require quote and author; amenities require label
      const testimonialsToSend = config.testimonials
        .filter((t) => (t.quote || "").trim() && (t.author || "").trim())
        .map((t) => ({
          quote: (t.quote || "").trim(),
          author: (t.author || "").trim(),
          role: (t.role || "Guest").trim() || "Guest",
          stars: typeof t.stars === "number" && t.stars >= 1 && t.stars <= 5 ? t.stars : 5,
        }));
      const amenitiesToSend = config.amenities
        .filter((a) => (a.label || "").trim())
        .map((a) => ({
          label: (a.label || "").trim(),
          icon: (a.icon || "").trim() || undefined,
          detail: (a.detail || "").trim() || undefined,
        }));

      const payload = {
        description: config.description,
        primaryColor: config.primaryColor,
        contactEmail: config.contactEmail,
        contactPhone: config.contactPhone,
        heroImage: (config.heroImage || "").trim() || undefined,
        heroTitle: (config.heroTitle || "").trim() || undefined,
        testimonials: testimonialsToSend,
        amenities: amenitiesToSend,
      };

      if (logoFile || heroFile) {
        const formData = new FormData();
        formData.append("description", payload.description);
        formData.append("primaryColor", payload.primaryColor);
        formData.append("contactEmail", payload.contactEmail);
        formData.append("contactPhone", payload.contactPhone);
        if (!heroFile && payload.heroImage) formData.append("heroImage", payload.heroImage);
        if (payload.heroTitle) formData.append("heroTitle", payload.heroTitle);
        formData.append("testimonials", JSON.stringify(payload.testimonials));
        formData.append("amenities", JSON.stringify(payload.amenities));
        if (logoFile) formData.append("logo", logoFile);
        if (heroFile) formData.append("heroImage", heroFile);
        await updateWebsiteConfig(formData);
      } else {
        await updateWebsiteConfig(payload);
      }

      toast.success("Configuration saved!", { id: toastId });
      setLogoFile(null);
      setHeroFile(null);
      await loadData(true);
    } catch (error) {
      toast.dismiss(toastId);
      handleApiError(error, router, toast);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking access..." />;
  }
  if (isLoading) {
    return <PageLoader message="Loading website configuration..." />;
  }

  const publicUrl = config.publicUrl || (config.slug ? `${config.slug}.zuhahost.com` : "");
  const fullUrl = publicUrl.startsWith("http") ? publicUrl : `https://${publicUrl}`;
  const primaryColor = config.primaryColor || "#0d9488";

  const scrollToSection = (id) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80">
      {/* Editor toolbar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            aria-label="Back"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">Website editor</h1>
            <p className="text-xs text-slate-500 truncate">{config.tenantName || "Your site"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {config.enabled && (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <span>View site</span>
              <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          {config.canToggle && (
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-slate-600 hidden sm:inline">
                {config.enabled ? "Live" : "Off"}
              </span>
              <input type="checkbox" className="sr-only peer" checked={config.enabled} onChange={handleToggleWebsite} />
              <div className="relative w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          )}
          <form onSubmit={handleSave} className="inline">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar: section nav (desktop) */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-slate-200 bg-white py-4">
          <nav className="px-3 space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <svg className="w-5 h-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
                {s.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-3 pt-4 border-t border-slate-100">
            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 truncate">
              {publicUrl}
            </a>
          </div>
        </aside>

        {/* Main: scrollable editor panels */}
        <main className="flex-1 overflow-auto">
          <form onSubmit={handleSave} className="w-full min-w-0 px-4 lg:px-6 py-6 lg:py-8 space-y-6">
            {/* Header & logo */}
            <section
              ref={(el) => (sectionRefs.current.header = el)}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Header & logo</h2>
                <p className="text-xs text-slate-500 mt-0.5">Logo and accent color for your site header</p>
              </div>
              <div className="p-4 sm:p-5 space-y-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 w-24 h-24 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <span className="text-3xl text-slate-300">Logo</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 cursor-pointer transition-colors w-fit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                      Change logo
                    </label>
                    <span className="text-xs text-slate-500">PNG, JPG, WEBP. Max 2MB</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Accent color</span>
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono w-28 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>
            </section>

            {/* Hero / Banner section - editor overlay on image */}
            <section
              ref={(el) => (sectionRefs.current.hero = el)}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="relative rounded-xl overflow-hidden bg-slate-200 aspect-21/9 min-h-[200px]">
                {/* Background image */}
                {heroPreview ? (
                  <img
                    src={heroPreview}
                    alt="Banner"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : null}
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-black/50" />
                {/* Centered title + tagline editors */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
                  <div className="flex items-center gap-2 w-full max-w-xl">
                    <input
                      type="text"
                      value={config.heroTitle}
                      onChange={(e) => handleChange("heroTitle", e.target.value)}
                      placeholder="banner title here"
                      className="flex-1 min-w-0 rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-lg sm:text-xl font-bold text-white placeholder:text-white/70 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90" title="Edit title">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full max-w-xl">
                    <input
                      type="text"
                      value={config.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="tagline/description here"
                      className="flex-1 min-w-0 rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-300/80 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/80" title="Edit tagline">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </span>
                  </div>
                </div>
                {/* Change Banner button - bottom right */}
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
                  <input type="file" accept="image/*" onChange={handleHeroChange} className="hidden" id="hero-upload" />
                  <label
                    htmlFor="hero-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Change Banner
                  </label>
                  <span className="text-xs text-slate-300/90">Max: 5MB</span>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <label className="block text-xs font-medium text-slate-500 mb-1">Or paste image URL</label>
                <input
                  type="url"
                  value={config.heroImage}
                  onChange={(e) => {
                    handleChange("heroImage", e.target.value);
                    if (!heroFile && e.target.value) setHeroPreview(e.target.value);
                  }}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>
            </section>

            {/* Contact */}
            <section
              ref={(el) => (sectionRefs.current.contact = el)}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
                <p className="text-xs text-slate-500 mt-0.5">Shown in header and footer of your public site</p>
              </div>
              <div className="p-4 sm:p-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={config.contactEmail}
                      onChange={(e) => handleChange("contactEmail", e.target.value)}
                      placeholder="info@example.com"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={config.contactPhone}
                      onChange={(e) => handleChange("contactPhone", e.target.value)}
                      placeholder="+1 555 123 4567"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section
              ref={(el) => (sectionRefs.current.testimonials = el)}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Testimonials</h2>
                <p className="text-xs text-slate-500 mt-0.5">Guest quotes on your landing page. Quote and author required.</p>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                {config.testimonials.map((t, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Testimonial {i + 1}</span>
                      <button type="button" onClick={() => removeTestimonial(i)} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Remove">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 2 0 0116.138 21H7.862a2 2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Quote</label>
                      <textarea
                        value={t.quote}
                        onChange={(e) => updateTestimonial(i, "quote", e.target.value)}
                        rows={2}
                        placeholder="An unforgettable stay..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Author</label>
                        <input type="text" value={t.author} onChange={(e) => updateTestimonial(i, "author", e.target.value)} placeholder="Sarah M." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                        <input type="text" value={t.role} onChange={(e) => updateTestimonial(i, "role", e.target.value)} placeholder="Guest" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-500">Stars</label>
                      <select value={t.stars} onChange={(e) => updateTestimonial(i, "stars", Number(e.target.value))} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addTestimonial} className="w-full rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center gap-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add testimonial
                </button>
              </div>
            </section>

            {/* Amenities */}
            <section
              ref={(el) => (sectionRefs.current.amenities = el)}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Amenities</h2>
                <p className="text-xs text-slate-500 mt-0.5">Features to show (e.g. WiFi, Pool). Label required.</p>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
            {config.amenities.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                  <input
                    type="text"
                    value={a.icon}
                    onChange={(e) => updateAmenity(i, "icon", e.target.value)}
                    className="w-full h-full text-center text-2xl bg-transparent border-0 focus:outline-none"
                    placeholder="✨"
                    title="Emoji"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
                  <input type="text" value={a.label} onChange={(e) => updateAmenity(i, "label", e.target.value)} placeholder="e.g. High-speed WiFi" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Detail</label>
                  <input type="text" value={a.detail} onChange={(e) => updateAmenity(i, "detail", e.target.value)} placeholder="e.g. Stay connected" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                </div>
                <button type="button" onClick={() => removeAmenity(i)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
                <button type="button" onClick={addAmenity} className="w-full rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center gap-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add amenity
                </button>
          </div>
        </section>

            {/* Mobile save */}
            <div className="lg:hidden flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()} className="flex-1 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
