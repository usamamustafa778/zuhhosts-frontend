"use client";

import StepLayout from "./StepLayout";
import FormField from "@/components/common/FormField";
import { DISCOUNT_OPTIONS, SAFETY_DISCLOSURES } from "../_constants/amenities";

export default function Step4AirbnbPricing({ formData, handleChange, onBack, onNext, isSaving = false }) {
  const basePrice = Number(formData.price) || 0;
  const premium = Number(formData.weekendPremiumPercent) || 0;
  const weekendPrice = basePrice > 0 ? Math.round(basePrice * (1 + premium / 100)) : 0;
  const discounts = formData.discounts || {};

  const toggleDiscount = (key) => {
    handleChange("discounts", { ...discounts, [key]: !discounts[key] });
  };

  return (
    <StepLayout
      stepLabel="Pricing & Policies"
      totalSteps={5}
      currentStep={4}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!formData.price || Number(formData.price) <= 0}
      isSaving={isSaving}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        {/* Nightly Rate */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Nightly Rate</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <FormField label="Weekday Price (USD) *" type="number" min="1" step="1" value={formData.price} onChange={(e) => handleChange("price", e.target.value)} placeholder="60" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Weekend Premium</label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="0" max="99" step="1"
                  value={premium}
                  onChange={(e) => handleChange("weekendPremiumPercent", Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                <span className="text-lg font-semibold text-slate-900 min-w-16 text-right">{premium}%</span>
              </div>
              {basePrice > 0 && (
                <p className="text-sm text-slate-600 mt-2">Weekend price: <span className="font-semibold">${weekendPrice}/night</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Discounts */}
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Discounts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {DISCOUNT_OPTIONS.map((d) => (
              <label
                key={d.key}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  discounts[d.key] ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input type="checkbox" checked={discounts[d.key] || false} onChange={() => toggleDiscount(d.key)} className="sr-only" />
                <span className="text-lg font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg min-w-14 text-center">{d.pct}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{d.label}</p>
                  <p className="text-xs text-slate-600">{d.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${discounts[d.key] ? "border-slate-900 bg-slate-900" : "border-slate-300"}`}>
                  {discounts[d.key] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Safety */}
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Safety Disclosures</h2>
          <div className="space-y-2">
            {SAFETY_DISCLOSURES.map((item) => (
              <label key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-900">{item.label}</span>
                <input
                  type="checkbox"
                  checked={formData.safetyFeatures?.[item.key] || false}
                  onChange={() => handleChange("safetyFeatures", { ...formData.safetyFeatures, [item.key]: !formData.safetyFeatures?.[item.key] })}
                  className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
