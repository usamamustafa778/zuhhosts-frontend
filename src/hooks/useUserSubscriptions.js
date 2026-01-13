"use client";

import { useState, useCallback } from "react";
import {
    getMyActiveSubscription,
    getMySubscriptions,
    getMySubscriptionById,
    createSubscription,
    uploadPaymentScreenshot,
} from "@/lib/api";

export function useUserSubscriptions() {
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [pendingSubscription, setPendingSubscription] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load active subscription
    const loadActiveSubscription = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Load active subscription
            const data = await getMyActiveSubscription();
            if (data.success !== undefined) {
                setHasActiveSubscription(data.hasActiveSubscription || false);
                setActiveSubscription(data.subscription || null);
            } else {
                setHasActiveSubscription(false);
                setActiveSubscription(null);
            }
            
            // Also check for pending subscriptions (only if no active subscription)
            if (!data.hasActiveSubscription || !data.subscription) {
                try {
                    const subscriptionsData = await getMySubscriptions({ status: "pending" });
                    if (subscriptionsData.success !== undefined) {
                        const pending = subscriptionsData.subscriptions?.find(
                            (sub) => sub.status === "pending"
                        );
                        setPendingSubscription(pending || null);
                    } else if (Array.isArray(subscriptionsData)) {
                        const pending = subscriptionsData.find((sub) => sub.status === "pending");
                        setPendingSubscription(pending || null);
                    } else {
                        setPendingSubscription(null);
                    }
                } catch (pendingErr) {
                    console.error("Error loading pending subscriptions:", pendingErr);
                    setPendingSubscription(null);
                }
            } else {
                setPendingSubscription(null);
            }
        } catch (err) {
            setError(err.message || "Failed to load active subscription");
            console.error("Error loading active subscription:", err);
            setHasActiveSubscription(false);
            setActiveSubscription(null);
            setPendingSubscription(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load user subscriptions with filters
    const loadSubscriptions = useCallback(async (filters = {}) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getMySubscriptions(filters);
            if (data.success !== undefined) {
                setSubscriptions(data.subscriptions || []);
                setCount(data.count || 0);
            } else {
                setSubscriptions(Array.isArray(data) ? data : []);
                setCount(Array.isArray(data) ? data.length : 0);
            }
        } catch (err) {
            setError(err.message || "Failed to load subscriptions");
            console.error("Error loading subscriptions:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get subscription by ID
    const loadSubscription = useCallback(async (id) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getMySubscriptionById(id);
            if (data.success && data.subscription) {
                return data.subscription;
            } else if (data.subscription) {
                return data.subscription;
            }
            return data;
        } catch (err) {
            setError(err.message || "Failed to load subscription");
            console.error("Error loading subscription:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create subscription
    const create = useCallback(async (packageType, notes = "", paymentScreenshot = null) => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await createSubscription({
                package: packageType,
                notes,
                paymentScreenshot,
            });
            if (result.success && result.subscription) {
                // Reload subscriptions after creation
                await loadSubscriptions();
                await loadActiveSubscription();
                return result.subscription;
            }
            return result;
        } catch (err) {
            setError(err.message || "Failed to create subscription");
            console.error("Error creating subscription:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadSubscriptions, loadActiveSubscription]);

    // Upload payment screenshot
    const uploadScreenshot = useCallback(async (id, file) => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await uploadPaymentScreenshot(id, file);
            if (result.success && result.subscription) {
                setSubscriptions((prev) =>
                    prev.map((sub) => {
                        const subId = sub.id || sub._id;
                        return subId === id ? result.subscription : sub;
                    })
                );
                if (activeSubscription && (activeSubscription.id === id || activeSubscription._id === id)) {
                    setActiveSubscription(result.subscription);
                }
                return result.subscription;
            }
            return result;
        } catch (err) {
            setError(err.message || "Failed to upload payment screenshot");
            console.error("Error uploading payment screenshot:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [activeSubscription]);

    return {
        activeSubscription,
        hasActiveSubscription,
        pendingSubscription,
        subscriptions,
        count,
        isLoading,
        error,
        loadActiveSubscription,
        loadSubscriptions,
        loadSubscription,
        create,
        uploadScreenshot,
    };
}

