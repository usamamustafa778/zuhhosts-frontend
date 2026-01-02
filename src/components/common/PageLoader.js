"use client";

export default function PageLoader({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mx-auto mb-4 h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
        </div>
        
        {/* Message */}
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
}

