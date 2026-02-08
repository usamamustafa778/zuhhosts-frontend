"use client";

import { getImageUrl } from "@/lib/api";

export default function PropertyCard({ property, primaryColor, onSelect }) {
  const id = property.id ?? property._id;
  const images = property.images ?? property.photos ?? [];
  const firstImage = images[0] ?? property.image ?? property.photo;
  const imgSrc = getImageUrl(firstImage);

  return (
    <button
      type="button"
      onClick={() => onSelect(property)}
      className="group text-left rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-2xl hover:border-slate-300 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
    >
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={property.title ?? "Property"}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = "none";
              const placeholder = e.currentTarget.nextElementSibling;
              if (placeholder) placeholder.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center bg-slate-200 text-slate-400 ${imgSrc ? "hidden" : ""}`}>
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
            +{images.length - 1} photos
          </span>
        )}
        <div
          className="absolute bottom-3 left-3 right-3 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ color: primaryColor }}
        >
          <span className="text-sm font-semibold text-white drop-shadow-lg">View details →</span>
        </div>
      </div>
      <div className="p-6">
        <h4 className="text-lg font-semibold text-slate-900 mb-2 group-hover:underline decoration-2 underline-offset-2 line-clamp-2">
          {property.title}
        </h4>
        {(property.location || property.placeType || property.propertyType) && (
          <p className="text-sm text-slate-500 mb-4 truncate flex items-center gap-1">
            {(property.placeType || property.propertyType) && (
              <span className="capitalize text-slate-600">{property.placeType || property.propertyType}</span>
            )}
            {(property.placeType || property.propertyType) && property.location && <span className="text-slate-400"> · </span>}
            {property.location && (
              <>
                <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {property.location}
              </>
            )}
          </p>
        )}
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {property.maxGuests > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">👥</span> {property.maxGuests} guest{property.maxGuests !== 1 ? "s" : ""}
              </span>
            )}
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">🛏</span> {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">🚿</span> {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
              </span>
            )}
            {property.starRating != null && property.starRating > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-amber-500">★</span> {Number(property.starRating).toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-xl font-bold tracking-tight" style={{ color: primaryColor }}>
              {property.price != null ? `$${Number(property.price).toLocaleString()}` : "—"}
            </span>
            <span className="text-sm text-slate-500 ml-0.5">/ night</span>
          </div>
        </div>
      </div>
    </button>
  );
}
