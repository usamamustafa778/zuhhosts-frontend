"use client";

import { useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function IdCardGallery({ idCards = [] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!idCards || idCards.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        No ID cards uploaded
      </div>
    );
  }

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % idCards.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + idCards.length) % idCards.length);
  };

  const getFullUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const downloadIdCard = (path, index) => {
    const url = getFullUrl(path);
    const link = document.createElement('a');
    link.href = url;
    link.download = `id-card-${index + 1}${path.substring(path.lastIndexOf('.'))}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageFile = (path) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {idCards.map((idCardPath, index) => (
          <div
            key={`${idCardPath}-${index}`}
            className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
          >
            {isImageFile(idCardPath) ? (
              <img
                src={getFullUrl(idCardPath)}
                alt={`Guest ID Card ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => openLightbox(index)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                <ExternalLink className="h-8 w-8 text-slate-400" />
                <span className="text-xs text-slate-500">PDF Document</span>
              </div>
            )}
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => openLightbox(index)}
                className="rounded-full bg-white p-2 text-slate-700 hover:bg-slate-100 transition-colors"
                title="View full size"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                onClick={() => downloadIdCard(idCardPath, index)}
                className="rounded-full bg-white p-2 text-slate-700 hover:bg-slate-100 transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>

            {/* Card number badge */}
            <div className="absolute top-2 left-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-white">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 rounded-full bg-white p-2 text-slate-700 hover:bg-slate-100 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {idCards.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 rounded-full bg-white p-3 text-slate-700 hover:bg-slate-100 transition-colors z-10"
                aria-label="Previous"
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 rounded-full bg-white p-3 text-slate-700 hover:bg-slate-100 transition-colors z-10"
                aria-label="Next"
              >
                →
              </button>
            </>
          )}

          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {isImageFile(idCards[currentIndex]) ? (
              <img
                src={getFullUrl(idCards[currentIndex])}
                alt={`Guest ID Card ${currentIndex + 1}`}
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <ExternalLink className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 mb-4">PDF Document</p>
                <a
                  href={getFullUrl(idCards[currentIndex])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </a>
              </div>
            )}

            <div className="mt-4 text-center text-sm text-white">
              {currentIndex + 1} / {idCards.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

