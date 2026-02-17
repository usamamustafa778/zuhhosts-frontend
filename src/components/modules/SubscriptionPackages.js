"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import { formatCurrency } from "@/utils/currencyUtils";

// Package configuration
export const PACKAGES = {
    free_trial: {
        name: "Free Trial",
        price: 0,
        maxProperties: 5,
        popular: false,
        features: [
            "Up to 5 properties",
            "Basic features",
            "7-day trial period",
            "Free",
        ],
    },
    basic: {
        name: "Basic",
        price: 10,
        maxProperties: 10,
        popular: true,
        features: [
            "Up to 10 properties",
            "Basic support",
            "Standard features",
            "$10/month",
        ],
    },
    big_businesses: {
        name: "Big Businesses",
        price: 50,
        maxProperties: 50,
        popular: false,
        features: [
            "Up to 50 properties",
            "Priority support",
            "Advanced features",
            "$50/month",
        ],
    },
    enterprise: {
        name: "Enterprise",
        price: 100,
        maxProperties: -1, // Unlimited
        popular: false,
        features: [
            "Unlimited properties",
            "24/7 premium support",
            "All features",
            "Custom integrations",
            "$100/month",
        ],
    },
};

export default function SubscriptionPackages({ onCreateSubscription, isLoading }) {
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [paymentScreenshot, setPaymentScreenshot] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);

    const handlePackageSelect = (packageKey) => {
        setSelectedPackage(packageKey);
        setIsModalOpen(true);
    };

    const handleFileChange = (file) => {
        if (file) {
            setPaymentScreenshot(file);
            const preview = URL.createObjectURL(file);
            setScreenshotPreview(preview);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPackage) return;

        try {
            await onCreateSubscription(selectedPackage, notes, paymentScreenshot);
            setIsModalOpen(false);
            setSelectedPackage(null);
            setNotes("");
            setPaymentScreenshot(null);
            if (screenshotPreview) {
                URL.revokeObjectURL(screenshotPreview);
                setScreenshotPreview(null);
            }
        } catch (err) {
            console.error("Error creating subscription:", err);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setSelectedPackage(null);
        setNotes("");
        setPaymentScreenshot(null);
        if (screenshotPreview) {
            URL.revokeObjectURL(screenshotPreview);
            setScreenshotPreview(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(PACKAGES).map(([key, pkg]) => (
                    <div
                        key={key}
                        className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-6 ${
                            pkg.popular
                                ? "border-rose-200 ring-1 ring-rose-100"
                                : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                        {pkg.popular && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                <span className="inline-flex rounded-full bg-rose-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                                    Most popular
                                </span>
                            </div>
                        )}
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">{pkg.name}</h3>
                            <div className="mt-3 flex items-baseline justify-center gap-0.5">
                                {pkg.price === 0 ? (
                                    <span className="text-2xl font-bold text-slate-900">Free</span>
                                ) : (
                                    <>
                                        <span className="text-2xl font-bold text-rose-600">
                                            {formatCurrency(pkg.price, "USD")}
                                        </span>
                                        <span className="text-sm font-medium text-slate-500">/month</span>
                                    </>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                {pkg.maxProperties === -1 ? "Unlimited" : `Up to ${pkg.maxProperties}`} properties
                            </p>
                        </div>

                        <ul className="space-y-3 mb-6 flex-1">
                            {pkg.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700">
                                    <svg
                                        className="mt-0.5 h-5 w-5 shrink-0 text-rose-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            onClick={() => handlePackageSelect(key)}
                            disabled={isLoading}
                            className={`mt-auto w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                pkg.popular
                                    ? "bg-rose-600 text-white hover:bg-rose-700"
                                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                            }`}
                        >
                            {isLoading ? "Processing…" : "Select plan"}
                        </button>
                    </div>
                ))}
            </div>

            {/* Create Subscription Modal */}
            <Modal
                title={selectedPackage ? `Subscribe to ${PACKAGES[selectedPackage]?.name}` : "Subscribe"}
                description="Complete your subscription. You can add a payment screenshot now or after submitting."
                isOpen={isModalOpen}
                onClose={handleClose}
                primaryActionLabel="Create subscription"
                onPrimaryAction={() => {
                    document.getElementById("create-subscription-form")?.requestSubmit();
                }}
                disabled={isLoading}
            >
                {selectedPackage && (
                    <form id="create-subscription-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold text-slate-900">
                                    {PACKAGES[selectedPackage].name} plan
                                </span>
                                <span className="text-xl font-bold text-rose-600">
                                    {PACKAGES[selectedPackage].price === 0
                                        ? "Free"
                                        : `${formatCurrency(PACKAGES[selectedPackage].price, "USD")}/month`}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                                {PACKAGES[selectedPackage].maxProperties === -1
                                    ? "Unlimited properties"
                                    : `Up to ${PACKAGES[selectedPackage].maxProperties} properties`}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Notes (optional)
                            </label>
                            <textarea
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional information for the admin…"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Payment screenshot (optional)
                            </label>
                            <p className="mb-2 text-xs text-slate-500">
                                You can upload a screenshot now or later from your subscription page.
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e.target.files[0])}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-rose-700 hover:file:bg-rose-100"
                            />
                            {screenshotPreview && (
                                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                    <img
                                        src={screenshotPreview}
                                        alt="Payment screenshot preview"
                                        className="h-36 w-full object-contain object-center"
                                    />
                                </div>
                            )}
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
}

