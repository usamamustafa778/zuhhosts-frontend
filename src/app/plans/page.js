"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import SubscriptionPackages from "@/components/modules/SubscriptionPackages";
import UserSubscriptionStatus from "@/components/modules/UserSubscriptionStatus";
import PendingSubscriptionRequest from "@/components/modules/PendingSubscriptionRequest";
import PageLoader from "@/components/common/PageLoader";
import { useSEO } from "@/hooks/useSEO";

export default function PlansPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const {
    activeSubscription,
    hasActiveSubscription,
    pendingSubscription,
    isLoading: subscriptionLoading,
    loadActiveSubscription,
    create: createSubscription,
    uploadScreenshot,
  } = useUserSubscriptions();

  useSEO({
    title: "Plans | Zuha Host",
    description: "View and manage your subscription plan.",
    keywords: "plans, subscription, billing",
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadActiveSubscription();
    }
  }, [isAuthenticated, loadActiveSubscription]);

  if (authLoading || !isAuthenticated) {
    return <PageLoader message="Checking your access..." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shrink-0 lg:hidden"
          >
            <svg
              className="w-6 h-6 text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Plans</h1>
            <p className="text-slate-600 mt-1">
              View and manage your subscription plan
            </p>
          </div>
        </div>
      </div>

      {subscriptionLoading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-100 bg-white">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600"></div>
            <p className="mt-3 text-sm text-slate-500">Loading plans...</p>
          </div>
        </div>
      ) : (
        <>
          {pendingSubscription ? (
            <PendingSubscriptionRequest
              subscription={pendingSubscription}
              onUploadScreenshot={async (id, file) => {
                await uploadScreenshot(id, file);
                await loadActiveSubscription();
              }}
              isLoading={subscriptionLoading}
            />
          ) : hasActiveSubscription && activeSubscription ? (
            <UserSubscriptionStatus
              subscription={activeSubscription}
              onUploadScreenshot={async (id, file) => {
                await uploadScreenshot(id, file);
                await loadActiveSubscription();
              }}
              isLoading={subscriptionLoading}
            />
          ) : (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">
                    Subscribe to a Plan
                  </h2>
                  <p className="text-sm text-slate-600">
                    Choose a subscription plan to start managing your properties
                  </p>
                </div>
              </div>
              <SubscriptionPackages
                onCreateSubscription={async (
                  packageType,
                  notes,
                  paymentScreenshot
                ) => {
                  await createSubscription(
                    packageType,
                    notes,
                    paymentScreenshot
                  );
                  await loadActiveSubscription();
                }}
                isLoading={subscriptionLoading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
