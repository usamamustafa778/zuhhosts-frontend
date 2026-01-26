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

  const handlePrimaryAction = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (disabled) {
      console.log("⚠️ Modal: Action disabled, ignoring click");
      return;
    }
    
    console.log("🔵 Modal: Primary action clicked", { onPrimaryAction, primaryAction });
    
    try {
      if (onPrimaryAction) {
        console.log("🔵 Modal: Calling onPrimaryAction");
        await onPrimaryAction();
      } else if (primaryAction) {
        console.log("🔵 Modal: Calling primaryAction");
        await primaryAction();
      } else {
        console.warn("⚠️ Modal: No primary action handler provided");
      }
    } catch (error) {
      console.error("❌ Modal: Error in primary action:", error);
      throw error; // Re-throw so parent can handle
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
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-50 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              aria-label="Close modal"
              disabled={disabled}
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
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={disabled}
          >
            {primaryActionLabel || primaryAction ? "Cancel" : "Close"}
          </button>
          {(primaryActionLabel || primaryAction || onPrimaryAction) && (
            <button 
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900 flex items-center gap-2"
              onClick={handlePrimaryAction}
              disabled={disabled}
            >
              {disabled && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {primaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

