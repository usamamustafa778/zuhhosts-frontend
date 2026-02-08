"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPublicProperties } from "@/lib/api";
import { usePublicSite } from "@/components/public/PublicSiteContext";
import PropertyCard from "@/components/public/PropertyCard";
import { getTenantSlugFromSubdomain } from "@/utils/tenantUtils";

const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "hotel", label: "Hotel" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "cabin", label: "Cabin" },
  { value: "condo", label: "Condo" },
];

export default function PublicPropertiesPage() {
  const params = useParams();
  const router = useRouter();
  const site = usePublicSite();
  // Slug: context (from layout) > route params > subdomain (tenant site)
  const slug = site?.slug ?? params?.slug ?? getTenantSlugFromSubdomain();
  const homeHref = site?.homeHref ?? (slug ? `/public/${slug}` : "/");
  const primaryColor = site?.primaryColor || "#0d9488";
  const tenant = site?.tenant;

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const list = await getPublicProperties(slug);
        if (!cancelled) setProperties(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          setProperties([]);
          setError(err?.message || "Failed to load properties");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const searchLower = (search || "").toLowerCase().trim();
      if (searchLower) {
        const titleMatch = (p.title || "").toLowerCase().includes(searchLower);
        const locationMatch = (p.location || "").toLowerCase().includes(searchLower);
        const placeMatch = (p.placeType || "").toLowerCase().includes(searchLower) || (p.propertyType || "").toLowerCase().includes(searchLower);
        if (!titleMatch && !locationMatch && !placeMatch) return false;
      }
      if (propertyType) {
        const type = (p.propertyType || p.placeType || p.modelType || "").toLowerCase();
        if (type !== propertyType.toLowerCase()) return false;
      }
      return true;
    });
  }, [properties, search, propertyType]);

  const handleSelectProperty = (property) => {
    const id = property.id ?? property._id;
    router.push(homeHref === "/" ? `/property/${id}` : `/public/${slug}/property/${id}`);
  };

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero strip */}
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-medium mb-3">Our collection</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            All properties
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto mt-4">
            {loading
              ? "Loading..."
              : `${properties.length} propert${properties.length === 1 ? "y" : "ies"} available for your stay at ${tenant?.name}.`}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm animate-pulse"
              >
                <div className="aspect-4/3 bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 rounded-3xl border-2 border-rose-200 bg-rose-50/60">
            <p className="text-rose-700 font-medium text-lg">Could not load properties</p>
            <p className="text-slate-600 text-sm mt-1">{error}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border-2 border-dashed border-slate-200 bg-white/60">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 7l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium text-lg">No properties available right now.</p>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              Properties appear here when the host marks them as <strong>Public</strong> in the dashboard (Properties → open a property → toggle &quot;Public&quot;).
            </p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <input
                type="search"
                placeholder="Search by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {PROPERTY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {(search || propertyType) && (
                <span className="text-sm text-slate-500">
                  Showing {filteredProperties.length} of {properties.length}
                </span>
              )}
            </div>

            {filteredProperties.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-slate-200 bg-white">
                <p className="text-slate-600 font-medium">No properties match your filters.</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting search or type.</p>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPropertyType(""); }}
                  className="mt-4 text-sm font-medium rounded-lg px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id ?? property._id}
                    property={property}
                    primaryColor={primaryColor}
                    onSelect={handleSelectProperty}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
