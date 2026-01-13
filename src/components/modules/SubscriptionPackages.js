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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(PACKAGES).map(([key, pkg]) => (
                    <div
                        key={key}
                        className="rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-rose-500 hover:shadow-lg transition-all"
                    >
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                            <div className="text-3xl font-bold text-rose-600 mb-1">
                                {pkg.price === 0 ? (
                                    <span>Free</span>
                                ) : (
                                    <>
                                        {formatCurrency(pkg.price, "USD")}
                                        <span className="text-sm font-normal text-slate-500">/month</span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-slate-600">
                                {pkg.maxProperties === -1 ? "Unlimited" : `Up to ${pkg.maxProperties}`} properties
                            </p>
                        </div>

                        <ul className="space-y-2 mb-6">
                            {pkg.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                                    <svg
                                        className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
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
                            onClick={() => handlePackageSelect(key)}
                            disabled={isLoading}
                            className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Processing..." : "Select Plan"}
                        </button>
                    </div>
                ))}
            </div>

            {/* Create Subscription Modal */}
            <Modal
                title={`Subscribe to ${selectedPackage ? PACKAGES[selectedPackage]?.name : ""} Plan`}
                description="Complete your subscription by providing payment details."
                isOpen={isModalOpen}
                onClose={handleClose}
                primaryActionLabel="Create Subscription"
                onPrimaryAction={() => {
                    document.getElementById("create-subscription-form")?.requestSubmit();
                }}
                disabled={isLoading}
            >
                {selectedPackage && (
                    <form id="create-subscription-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-900">
                                    {PACKAGES[selectedPackage].name} Plan
                                </span>
                                <span className="text-lg font-bold text-rose-600">
                                    {PACKAGES[selectedPackage].price === 0 ? (
                                        "Free"
                                    ) : (
                                        `${formatCurrency(PACKAGES[selectedPackage].price, "USD")}/month`
                                    )}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600">
                                {PACKAGES[selectedPackage].maxProperties === -1
                                    ? "Unlimited properties"
                                    : `Up to ${PACKAGES[selectedPackage].maxProperties} properties`}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Notes (Optional)
                            </label>
                            <textarea
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional information..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Payment Screenshot (Optional)
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                You can upload payment screenshot now or later
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e.target.files[0])}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            {screenshotPreview && (
                                <div className="mt-2">
                                    <img
                                        src={screenshotPreview}
                                        alt="Payment screenshot preview"
                                        className="w-full h-32 object-contain border border-slate-200 rounded-lg bg-slate-50"
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

