"use client";

export default function Modal({ 
  title, 
  description, 
  isOpen, 
  onClose, 
  children, 
  primaryActionLabel = "Save", 
  primaryAction,
  onPrimaryAction,
  size = "medium",
  disabled = false
}) {
  if (!isOpen) return null;

  const handlePrimaryAction = async () => {
    if (onPrimaryAction) {
      await onPrimaryAction();
    } else if (primaryAction) {
      await primaryAction();
    }
  };

  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-xl",
    large: "max-w-4xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto">
      <div className={`w-full ${sizeClasses[size]} rounded-3xl border border-slate-100 bg-white shadow-2xl my-8`}>
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 py-4 px-6 z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-50 flex-shrink-0"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          <div className="space-y-4">{children}</div>
        </div>
        <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-slate-100 py-4 px-6 flex justify-end gap-3">
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            {primaryActionLabel || primaryAction ? "Cancel" : "Close"}
          </button>
          {(primaryActionLabel || primaryAction || onPrimaryAction) && (
            <button 
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
              onClick={handlePrimaryAction}
              disabled={disabled}
            >
              {primaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

