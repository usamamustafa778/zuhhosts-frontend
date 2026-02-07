"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPublicProperties } from "@/lib/api";
import { usePublicSite } from "@/components/public/PublicSiteContext";
import PropertyCard from "@/components/public/PropertyCard";

export default function PublicPropertiesPage() {
  const params = useParams();
  const router = useRouter();
  const site = usePublicSite();
  const slug = site?.slug ?? params?.slug;
  const homeHref = site?.homeHref ?? `/public/${slug}`;
  const primaryColor = site?.primaryColor || "#0d9488";
  const tenant = site?.tenant;

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        setLoading(true);
        const list = await getPublicProperties(slug);
        setProperties(Array.isArray(list) ? list : []);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

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
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border-2 border-dashed border-slate-200 bg-white/60">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 7l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium text-lg">No properties available right now.</p>
            <p className="text-slate-500 text-sm mt-1">Check back soon for new listings.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCard
                key={property.id ?? property._id}
                property={property}
                primaryColor={primaryColor}
                onSelect={handleSelectProperty}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
