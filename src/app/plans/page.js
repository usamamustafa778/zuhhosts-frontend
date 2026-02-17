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
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 lg:max-w-4xl lg:mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 focus:outline-none"
          aria-label="Go back"
        >
          <svg
            className="h-4 w-4"
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
          Back
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100">
            <svg
              className="h-6 w-6 text-rose-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 0a.5.5 0 11-1 0 .5.5 0 011 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Plans
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              View and manage your subscription plan.
            </p>
          </div>
        </div>
      </header>

      <div className="lg:max-w-4xl lg:mx-auto space-y-6">
        {subscriptionLoading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-rose-500" aria-hidden />
            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading your plan…
            </p>
            <p className="mt-1 text-xs text-slate-500">
              This may take a moment.
            </p>
          </div>
        ) : pendingSubscription ? (
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
          <>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                    <svg
                      className="h-5 w-5 text-rose-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 0a.5.5 0 11-1 0 .5.5 0 011 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Choose your plan
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select a plan below to start managing your properties.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <SubscriptionPackages
                  onCreateSubscription={async (
                    packageType,
                    notes,
                    paymentScreenshot,
                  ) => {
                    await createSubscription(
                      packageType,
                      notes,
                      paymentScreenshot,
                    );
                    await loadActiveSubscription();
                  }}
                  isLoading={subscriptionLoading}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
