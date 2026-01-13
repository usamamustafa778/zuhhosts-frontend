"use client";

import { useState, useCallback } from "react";
import {
  getSubscriptionStatistics,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  approveSubscription,
  rejectSubscription,
} from "@/lib/api";

export function useSubscriptions() {
  const [statistics, setStatistics] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSubscriptionStatistics();
      if (data.success && data.statistics) {
        setStatistics(data.statistics);
      } else if (data.statistics) {
        setStatistics(data.statistics);
      }
    } catch (err) {
      setError(err.message || "Failed to load statistics");
      console.error("Error loading subscription statistics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load subscriptions with filters
  const loadSubscriptions = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllSubscriptions(filters);
      if (data.success !== undefined) {
        setSubscriptions(data.subscriptions || []);
        setCount(data.count || 0);
      } else {
        // Handle case where API returns array directly
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
      const data = await getSubscriptionById(id);
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

  // Update subscription
  const update = useCallback(async (id, data) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await updateSubscription(id, data);
      if (result.success && result.subscription) {
        setSubscriptions((prev) =>
          prev.map((sub) => {
            const subId = sub.id || sub._id;
            return subId === id ? result.subscription : sub;
          })
        );
        return result.subscription;
      }
      return result;
    } catch (err) {
      setError(err.message || "Failed to update subscription");
      console.error("Error updating subscription:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete subscription
  const remove = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteSubscription(id);
      setSubscriptions((prev) =>
        prev.filter((sub) => {
          const subId = sub.id || sub._id;
          return subId !== id;
        })
      );
      setCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message || "Failed to delete subscription");
      console.error("Error deleting subscription:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Approve subscription
  const approve = useCallback(async (id, notes = "") => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await approveSubscription(id, { notes });
      if (result.success && result.subscription) {
        setSubscriptions((prev) =>
          prev.map((sub) => {
            const subId = sub.id || sub._id;
            return subId === id ? result.subscription : sub;
          })
        );
        return result.subscription;
      }
      return result;
    } catch (err) {
      setError(err.message || "Failed to approve subscription");
      console.error("Error approving subscription:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reject subscription
  const reject = useCallback(async (id, rejectionReason) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await rejectSubscription(id, { rejectionReason });
      if (result.success && result.subscription) {
        setSubscriptions((prev) =>
          prev.map((sub) => {
            const subId = sub.id || sub._id;
            return subId === id ? result.subscription : sub;
          })
        );
        return result.subscription;
      }
      return result;
    } catch (err) {
      setError(err.message || "Failed to reject subscription");
      console.error("Error rejecting subscription:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    statistics,
    subscriptions,
    count,
    isLoading,
    error,
    loadStatistics,
    loadSubscriptions,
    loadSubscription,
    update,
    remove,
    approve,
    reject,
  };
}

