"use client";

import StepLayout from "./StepLayout";

const MODEL_OPTIONS = [
  { value: "hotel", emoji: "🏨", label: "Hotel", desc: "Multiple room types & inventory. Ideal for hotels, resorts, hostels." },
  { value: "airbnb", emoji: "🏠", label: "Vacation Rental", desc: "A single property like an apartment, villa, or house." },
];

export default function Step1ModelSelect({ propertyModel, setPropertyModel, onBack, onNext, isSaving = false }) {
  return (
    <StepLayout stepLabel="Property Model" totalSteps={5} currentStep={1} onBack={onBack} onNext={onNext} nextDisabled={!propertyModel} isSaving={isSaving}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">What type of property are you listing?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {MODEL_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setPropertyModel(opt.value)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                propertyModel === opt.value ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-4xl block mb-3">{opt.emoji}</span>
              <h3 className="font-semibold text-slate-900 mb-1">{opt.label}</h3>
              <p className="text-sm text-slate-600">{opt.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </StepLayout>
  );
}
