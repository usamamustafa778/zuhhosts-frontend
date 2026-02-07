"use client";

import { useState, useEffect } from "react";
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
    testimonials: [],
    amenities: [],
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);

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
  const primaryColor = config.primaryColor || "#0d9488";

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 lg:hidden"
            aria-label="Back"
          >
            <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Website customization
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Branding, hero image, testimonials, and amenities for your public site
            </p>
          </div>
        </div>
      </div>

      {/* Status card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9a9 9 0 019-9m-9 9a9 9 0 000 18m9-9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-slate-900">Public website</h2>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    config.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {config.enabled ? "Live" : "Disabled"}
                </span>
              </div>
              {config.enabled ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={publicUrl.startsWith("http") ? publicUrl : `https://${publicUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {publicUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl.startsWith("http") ? publicUrl : `https://${publicUrl}`);
                      toast.success("URL copied!");
                    }}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500"
                    title="Copy"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              ) : config.canToggle ? (
                <p className="text-sm text-slate-600 mt-1">Enable to accept direct bookings with zero commission.</p>
              ) : (
                <p className="text-sm text-amber-600 mt-1">Upgrade your plan to enable.</p>
              )}
            </div>
          </div>
          {config.canToggle && (
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={config.enabled} onChange={handleToggleWebsite} />
              <div className="w-12 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          )}
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Branding */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: primaryColor }}>
              1
            </span>
            Branding
          </h2>
          <p className="text-sm text-slate-500 mb-6">Logo, description, and accent color</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
              <div className="flex flex-wrap items-center gap-4">
                {logoPreview && (
                  <div className="w-20 h-20 rounded-xl border-2 border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                    Upload logo
                  </label>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP. Max 2MB.</p>
                </div>
              </div>
            </div>

            <FormField
              label="Business description"
              as="textarea"
              rows={3}
              value={config.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Welcome to our property. We offer..."
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => handleChange("primaryColor", e.target.value)}
                  className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => handleChange("primaryColor", e.target.value)}
                  className="flex-1 max-w-[140px] rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Used for buttons and accents on your public site.</p>
            </div>
          </div>
        </section>

        {/* Hero image */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: primaryColor }}>
              2
            </span>
            Hero / banner image
          </h2>
          <p className="text-sm text-slate-500 mb-6">Large image at the top of your landing page</p>

          <div className="space-y-4">
            {heroPreview && (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 aspect-21/9 max-h-48">
                <img src={heroPreview} alt="Hero preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              <input type="file" accept="image/*" onChange={handleHeroChange} className="hidden" id="hero-upload" />
              <label htmlFor="hero-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                Upload hero image
              </label>
              <div className="flex-1 min-w-0">
                <FormField
                  label="Or paste image URL"
                  type="url"
                  value={config.heroImage}
                  onChange={(e) => {
                    handleChange("heroImage", e.target.value);
                    if (!heroFile && e.target.value) setHeroPreview(e.target.value);
                  }}
                  placeholder="https://... (path or URL)"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Wide image recommended (e.g. 1920×800). Max 5MB for upload.</p>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: primaryColor }}>
              3
            </span>
            Contact
          </h2>
          <p className="text-sm text-slate-500 mb-6">Shown in header and footer of your public site</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Contact email" type="email" value={config.contactEmail} onChange={(e) => handleChange("contactEmail", e.target.value)} placeholder="info@example.com" />
            <FormField label="Contact phone" type="tel" value={config.contactPhone} onChange={(e) => handleChange("contactPhone", e.target.value)} placeholder="+1 555 123 4567" />
          </div>
        </section>

        {/* Testimonials */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: primaryColor }}>
              4
            </span>
            Testimonials
          </h2>
          <p className="text-sm text-slate-500 mb-6">Guest quotes on your landing page. Quote and author are required per item. Leave empty to use default placeholders.</p>

          <div className="space-y-6">
            {config.testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">Testimonial {i + 1}</span>
                  <button type="button" onClick={() => removeTestimonial(i)} className="text-slate-400 hover:text-red-600 text-sm font-medium transition-colors">
                    Remove
                  </button>
                </div>
                <FormField label="Quote" as="textarea" rows={2} value={t.quote} onChange={(e) => updateTestimonial(i, "quote", e.target.value)} placeholder="An unforgettable stay..." />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Author" type="text" value={t.author} onChange={(e) => updateTestimonial(i, "author", e.target.value)} placeholder="Sarah M." />
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-600">Role</label>
                    <input
                      type="text"
                      value={t.role}
                      onChange={(e) => updateTestimonial(i, "role", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Guest"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stars (1–5)</label>
                  <select value={t.stars} onChange={(e) => updateTestimonial(i, "stars", Number(e.target.value))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-24">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <button type="button" onClick={addTestimonial} className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add testimonial
            </button>
          </div>
        </section>

        {/* Amenities */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: primaryColor }}>
              5
            </span>
            Amenities
          </h2>
          <p className="text-sm text-slate-500 mb-6">Services and features to show (e.g. WiFi, Pool). Label is required per item. Leave empty for defaults.</p>

          <div className="space-y-4">
            {config.amenities.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <input
                  type="text"
                  value={a.icon}
                  onChange={(e) => updateAmenity(i, "icon", e.target.value)}
                  className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-2xl"
                  placeholder="📶"
                  title="Emoji or icon"
                />
                <div className="flex-1 min-w-[120px]">
                  <FormField label="Label" type="text" value={a.label} onChange={(e) => updateAmenity(i, "label", e.target.value)} placeholder="High-speed WiFi" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <FormField label="Detail" type="text" value={a.detail} onChange={(e) => updateAmenity(i, "detail", e.target.value)} placeholder="Stay connected" />
                </div>
                <button type="button" onClick={() => removeAmenity(i)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button type="button" onClick={addAmenity} className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add amenity
            </button>
          </div>
        </section>

        {/* Save */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end sticky bottom-4 sm:static bg-white/95 sm:bg-transparent py-3 sm:py-0 -mx-4 px-4 sm:mx-0 sm:px-0 border-t sm:border-0 border-slate-200">
          <button type="button" onClick={() => router.back()} className="rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      {/* Info */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Why customize your site?</h3>
            <p className="text-sm text-slate-600">
              Your public website is the face of your brand. A custom hero, real testimonials, and your amenities help guests trust and book direct—with zero commission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
