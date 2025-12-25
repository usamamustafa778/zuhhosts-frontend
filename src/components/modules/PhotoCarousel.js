"use client";

import { useState } from "react";
import Image from "next/image";

export default function PhotoCarousel({ photos = [] }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;

  const handleNext = () => setIndex((prev) => (prev + 1) % photos.length);
  const handlePrev = () => setIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
      <div className="relative h-48 w-full">
        <Image
          src={photos[index]}
          alt="Property photo"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      {photos.length > 1 && (
        <>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-sm text-slate-600 backdrop-blur hover:bg-white"
            onClick={handlePrev}
          >
            ‹
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-sm text-slate-600 backdrop-blur hover:bg-white"
            onClick={handleNext}
          >
            ›
          </button>
        </>
      )}
      <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-white">
        {index + 1} / {photos.length}
      </div>
    </div>
  );
}

