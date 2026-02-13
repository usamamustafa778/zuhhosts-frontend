"use client";

import { useState } from "react";
import Image from "next/image";

export default function PhotoCarousel({ photos = [] }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;

  const handleNext = () => setIndex((prev) => (prev + 1) % photos.length);
  const handlePrev = () => setIndex((prev) => (prev - 1 + photos.length) % photos.length);

  const currentPhoto = photos[index];
  const isLocalhost = currentPhoto?.startsWith?.("http://localhost") || currentPhoto?.startsWith?.("https://localhost");

  return (
    <div className="relative overflow-hidden w-full h-full rounded-2xl border border-slate-100 bg-slate-100">
      <div className="relative h-full w-full">
        {isLocalhost ? (
          <img
            src={currentPhoto}
            alt="Property photo"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Image
            src={currentPhoto}
            alt="Property photo"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 100vw"
            unoptimized={isLocalhost}
          />
        )}
      </div>
      {photos.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-700 shadow-lg backdrop-blur-sm hover:bg-white hover:scale-110 transition-all z-10"
            onClick={handlePrev}
            aria-label="Previous image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-700 shadow-lg backdrop-blur-sm hover:bg-white hover:scale-110 transition-all z-10"
            onClick={handleNext}
            aria-label="Next image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      {photos.length > 1 && (
        <div className="absolute bottom-4 right-4 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white z-10">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}

