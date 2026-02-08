"use client";

import StepLayout from "./StepLayout";

export default function Step5Review({ formData, existingImages = [], images = [], propertyModel, isHotelFlow, isAirbnbFlow, roomTypes, onBack, onSubmit }) {
  const totalRooms = roomTypes.reduce((sum, rt) => sum + (Number(rt.inventory) || 0), 0);
  const photoCount = (existingImages?.length || 0) + (images?.length || 0);

  return (
    <StepLayout stepLabel="Review & Publish" totalSteps={5} currentStep={5} onBack={onBack} onNext={() => {}} nextLabel="Publish" isSubmit>
      <form onSubmit={onSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Review */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Information</h2>
              <dl className="grid sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</dt>
                  <dd className="text-slate-900 font-medium mt-1">{formData.title || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</dt>
                  <dd className="text-slate-900 font-medium mt-1 capitalize">{formData.placeType || propertyModel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</dt>
                  <dd className="text-slate-900 font-medium mt-1">{formData.location || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Address</dt>
                  <dd className="text-slate-900 font-medium mt-1">{formData.address || formData.location || "—"}</dd>
                </div>
                {isHotelFlow && formData.starRating && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Star Rating</dt>
                    <dd className="text-slate-900 font-medium mt-1">{"★".repeat(Number(formData.starRating))}</dd>
                  </div>
                )}
                {isAirbnbFlow && (
                  <>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Guests / Beds / Baths</dt>
                      <dd className="text-slate-900 font-medium mt-1">{formData.maxGuests} guests · {formData.beds} bed{Number(formData.beds) !== 1 ? "s" : ""} · {formData.bathrooms} bath</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Base Price</dt>
                      <dd className="text-slate-900 font-medium mt-1">${formData.price}/night</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            {/* Amenities */}
            {formData.amenities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((a) => (
                    <span key={a} className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Types (hotel) */}
            {isHotelFlow && roomTypes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Room Types</h2>
                <div className="space-y-2">
                  {roomTypes.map((rt) => (
                    <div key={rt.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-medium text-slate-900">{rt.name}</span>
                        <span className="text-sm text-slate-600 ml-2">({rt.inventory} rooms · ${rt.price}/night)</span>
                      </div>
                      <span className="text-sm text-slate-600">{rt.bedCount} {rt.bedType} · {rt.maxOccupancy} guests</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">Total: {totalRooms} rooms</p>
              </div>
            )}

            {/* Description */}
            {formData.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Description</h2>
                <p className="text-slate-700 text-sm whitespace-pre-line">{formData.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Media</h2>
              <p className="text-sm text-slate-700">{photoCount} photo{photoCount !== 1 ? "s" : ""} uploaded</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Before publishing</h3>
              <ul className="space-y-2 text-sm text-blue-900">
                <li className="flex items-start gap-2">
                  <InfoIcon />
                  Your property will be created as <strong>private</strong>. Enable public visibility later.
                </li>
                <li className="flex items-start gap-2">
                  <InfoIcon />
                  You can edit all details after publishing from the property settings page.
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-rose-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publish Property
            </button>
          </div>
        </div>
      </form>
    </StepLayout>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  );
}
