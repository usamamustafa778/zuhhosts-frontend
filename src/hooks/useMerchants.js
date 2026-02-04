"use client";

import { useState, useCallback } from "react";
import {
    getAllMerchants,
    getMerchantById,
    createMerchant,
    updateMerchant,
    deleteMerchant,
    getMerchantStatistics,
} from "@/lib/api";

export function useMerchants() {
    const [merchants, setMerchants] = useState([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load merchants with filters
    const loadMerchants = useCallback(async (filters = {}) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getAllMerchants(filters);
            if (data.success !== undefined) {
                setMerchants(data.merchants || []);
                setCount(data.count || 0);
            } else {
                setMerchants(Array.isArray(data) ? data : []);
                setCount(Array.isArray(data) ? data.length : 0);
            }
        } catch (err) {
            setError(err.message || "Failed to load merchants");
            console.error("Error loading merchants:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get merchant by ID
    const loadMerchant = useCallback(async (id) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getMerchantById(id);
            if (data.success && data.merchant) {
                return data.merchant;
            } else if (data.merchant) {
                return data.merchant;
            }
            return data;
        } catch (err) {
            setError(err.message || "Failed to load merchant");
            console.error("Error loading merchant:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create merchant
    const create = useCallback(async (data) => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await createMerchant(data);
            if (result.success && result.merchant) {
                setMerchants((prev) => [result.merchant, ...prev]);
                setCount((prev) => prev + 1);
                return result.merchant;
            }
            return result;
        } catch (err) {
            setError(err.message || "Failed to create merchant");
            console.error("Error creating merchant:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update merchant
    const update = useCallback(async (id, data) => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await updateMerchant(id, data);
            if (result.success && result.merchant) {
                setMerchants((prev) =>
                    prev.map((merchant) => {
                        const merchantId = merchant.id || merchant._id;
                        return merchantId === id ? result.merchant : merchant;
                    })
                );
                return result.merchant;
            }
            return result;
        } catch (err) {
            setError(err.message || "Failed to update merchant");
            console.error("Error updating merchant:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Delete merchant
    const remove = useCallback(async (id) => {
        try {
            setIsLoading(true);
            setError(null);
            await deleteMerchant(id);
            setMerchants((prev) =>
                prev.filter((merchant) => {
                    const merchantId = merchant.id || merchant._id;
                    return merchantId !== id;
                })
            );
            setCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            setError(err.message || "Failed to delete merchant");
            console.error("Error deleting merchant:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get merchant statistics
    const loadStatistics = useCallback(async (id) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getMerchantStatistics(id);
            if (data.success && data.statistics) {
                return data.statistics;
            }
            return data;
        } catch (err) {
            setError(err.message || "Failed to load merchant statistics");
            console.error("Error loading merchant statistics:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        merchants,
        count,
        isLoading,
        error,
        loadMerchants,
        loadMerchant,
        create,
        update,
        remove,
        loadStatistics,
    };
}

