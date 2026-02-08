"use client";

import Link from "next/link";

export default function StepLayout({
  children,
  stepLabel,
  totalSteps,
  currentStep,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  isSubmit = false,
  isCreating = false,
  isSaving = false,
}) {
  const progressPercent = (currentStep / totalSteps) * 100;
  const isBusy = isCreating || isSaving;
  const nextButtonLabel = isCreating ? "Publishing..." : isSaving ? "Saving..." : nextLabel;

  return (
    <div className="h-[calc(100vh-120px)] bg-slate-50">
      <main className="max-w-6xl mx-auto">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{stepLabel}</h1>
            <span className="text-sm text-slate-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {children}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            type={isSubmit ? "submit" : "button"}
            onClick={isSubmit ? undefined : onNext}
            disabled={nextDisabled || isBusy}
            className={`px-8 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubmit
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {nextButtonLabel}
          </button>
        </div>
      </main>
    </div>
  );
}
